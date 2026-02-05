import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, notificationPreferences, scheduledReminders, cards } from "@/db/schema";
import { eq, and, lt, isNull, gte } from "drizzle-orm";

// This API route should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// It checks for due/overdue tasks and creates notifications

type UserPrefs = {
  inAppEnabled: boolean;
  inAppDueSoon: boolean;
  inAppOverdue: boolean;
  emailEnabled: boolean;
  emailDueSoon: boolean;
  emailOverdue: boolean;
  pushEnabled: boolean;
  reminderLeadTime: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

const DEFAULT_PREFS: UserPrefs = {
  inAppEnabled: true,
  inAppDueSoon: true,
  inAppOverdue: true,
  emailEnabled: true,
  emailDueSoon: true,
  emailOverdue: true,
  pushEnabled: false,
  reminderLeadTime: 24,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function isInQuietHours(prefs: UserPrefs): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
  
  return currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd;
}

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const stats = {
      dueSoonNotifications: 0,
      overdueNotifications: 0,
      errors: [] as string[],
    };

    // Get all users with their notification preferences
    const allUsers = await db.query.users.findMany({
      with: {
        notificationPreferences: true,
      },
    });

    const userPrefsMap = new Map<string, UserPrefs>(
      allUsers.map(u => {
        const np = u.notificationPreferences;
        return [
          u.id,
          np ? {
            inAppEnabled: np.inAppEnabled ?? true,
            inAppDueSoon: np.inAppDueSoon ?? true,
            inAppOverdue: np.inAppOverdue ?? true,
            emailEnabled: np.emailEnabled ?? true,
            emailDueSoon: np.emailDueSoon ?? true,
            emailOverdue: np.emailOverdue ?? true,
            pushEnabled: np.pushEnabled ?? false,
            reminderLeadTime: np.reminderLeadTime ?? 24,
            quietHoursStart: np.quietHoursStart ?? null,
            quietHoursEnd: np.quietHoursEnd ?? null,
          } : DEFAULT_PREFS,
        ];
      })
    );

    // Find cards due within the reminder lead time for each user
    const allCards = await db.query.cards.findMany({
      where: and(
        isNull(cards.archivedAt),
        gte(cards.dueDate, now)
      ),
      with: {
        column: {
          with: {
            board: true,
          },
        },
        assignee: true,
      },
    });

    // Process due soon notifications
    for (const card of allCards) {
      if (!card.dueDate) continue;

      const notifyUserId = card.assigneeId || card.column.board.userId;
      const prefs = userPrefsMap.get(notifyUserId) || DEFAULT_PREFS;

      const leadTimeMs = prefs.reminderLeadTime * 60 * 60 * 1000;
      const reminderTime = new Date(card.dueDate.getTime() - leadTimeMs);

      // Check if it's time to send the reminder
      if (now >= reminderTime && now < card.dueDate) {
        // Check if we already sent this reminder
        const existingReminder = await db.query.scheduledReminders.findFirst({
          where: and(
            eq(scheduledReminders.cardId, card.id),
            eq(scheduledReminders.userId, notifyUserId),
            eq(scheduledReminders.type, "due_soon")
          ),
        });

        if (existingReminder) continue;

        // Check quiet hours
        if (isInQuietHours(prefs)) continue;

        // Create in-app notification
        if (prefs.inAppEnabled && prefs.inAppDueSoon) {
          const hoursUntilDue = Math.round((card.dueDate.getTime() - now.getTime()) / (60 * 60 * 1000));
          
          await db.insert(notifications).values({
            id: crypto.randomUUID(),
            userId: notifyUserId,
            type: "due_soon",
            title: "Task due soon",
            message: `"${card.title}" is due in ${hoursUntilDue} hour${hoursUntilDue !== 1 ? "s" : ""}`,
            cardId: card.id,
            boardId: card.column.boardId,
            actionUrl: `/board/${card.column.boardId}?card=${card.id}`,
          });

          stats.dueSoonNotifications++;
        }

        // Record that we processed this reminder
        await db.insert(scheduledReminders).values({
          id: crypto.randomUUID(),
          cardId: card.id,
          userId: notifyUserId,
          type: "due_soon",
          scheduledFor: reminderTime,
          sentAt: now,
          channels: JSON.stringify(prefs.inAppEnabled ? ["in_app"] : []),
        });
      }
    }

    // Find overdue cards
    const overdueCards = await db.query.cards.findMany({
      where: and(
        isNull(cards.archivedAt),
        lt(cards.dueDate, now)
      ),
      with: {
        column: {
          with: {
            board: true,
          },
        },
      },
    });

    // Process overdue notifications (send once per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const card of overdueCards) {
      if (!card.dueDate) continue;

      const notifyUserId = card.assigneeId || card.column.board.userId;
      const prefs = userPrefsMap.get(notifyUserId) || DEFAULT_PREFS;
      
      if (!prefs.inAppOverdue) continue;

      // Check if we already sent overdue notification today
      const existingReminder = await db.query.scheduledReminders.findFirst({
        where: and(
          eq(scheduledReminders.cardId, card.id),
          eq(scheduledReminders.userId, notifyUserId),
          eq(scheduledReminders.type, "overdue"),
          gte(scheduledReminders.sentAt, today)
        ),
      });

      if (existingReminder) continue;

      // Check quiet hours
      if (isInQuietHours(prefs)) continue;

      // Create overdue notification
      const daysOverdue = Math.floor((now.getTime() - card.dueDate.getTime()) / (24 * 60 * 60 * 1000));
      
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: notifyUserId,
        type: "overdue",
        title: "Task overdue!",
        message: `"${card.title}" is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
        cardId: card.id,
        boardId: card.column.boardId,
        actionUrl: `/board/${card.column.boardId}?card=${card.id}`,
      });

      await db.insert(scheduledReminders).values({
        id: crypto.randomUUID(),
        cardId: card.id,
        userId: notifyUserId,
        type: "overdue",
        scheduledFor: now,
        sentAt: now,
        channels: JSON.stringify(["in_app"]),
      });

      stats.overdueNotifications++;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
