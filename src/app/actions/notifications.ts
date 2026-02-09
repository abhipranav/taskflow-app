"use server";

import { db } from "@/db";
import { notifications, notificationPreferences, scheduledReminders, cards } from "@/db/schema";
import { eq, desc, and, lt, isNull, gte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ============================================
// Notification Preferences
// ============================================

export async function getNotificationPreferences() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, session.user.id),
  });

  // Return defaults if no preferences exist
  if (!prefs) {
    return {
      userId: session.user.id,
      inAppEnabled: true,
      inAppDueSoon: true,
      inAppOverdue: true,
      inAppAssigned: true,
      emailEnabled: true,
      emailAddress: session.user.email,
      emailDueSoon: true,
      emailOverdue: true,
      emailDailyDigest: false,
      emailDigestTime: "08:00",
      pushEnabled: false,
      pushSubscription: null,
      pushDueSoon: true,
      pushOverdue: true,
      pushAssigned: true,
      reminderLeadTime: 24,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }

  return prefs;
}

export async function updateNotificationPreferences(
  preferences: Partial<{
    inAppEnabled: boolean;
    inAppDueSoon: boolean;
    inAppOverdue: boolean;
    inAppAssigned: boolean;
    emailEnabled: boolean;
    emailAddress: string | null;
    emailDueSoon: boolean;
    emailOverdue: boolean;
    emailDailyDigest: boolean;
    emailDigestTime: string;
    pushEnabled: boolean;
    pushSubscription: string | null;
    pushDueSoon: boolean;
    pushOverdue: boolean;
    pushAssigned: boolean;
    reminderLeadTime: number;
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }>
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check if preferences exist
  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ ...preferences, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, session.user.id));
  } else {
    await db.insert(notificationPreferences).values({
      userId: session.user.id,
      ...preferences,
    });
  }

  revalidatePath("/settings/notifications");
}

// ============================================
// In-App Notifications
// ============================================

export async function getNotifications(limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
    limit,
    with: {
      card: true,
      board: true,
    },
  });
}

export async function getUnreadNotificationCount() {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const unread = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, session.user.id),
      eq(notifications.read, false)
    ),
  });

  return unread.length;
}

export async function markNotificationAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      )
    );

  revalidatePath("/");
}

export async function markAllNotificationsAsRead() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.read, false)
      )
    );

  revalidatePath("/");
}

export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      )
    );

  revalidatePath("/");
}

export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.delete(notifications).where(eq(notifications.userId, session.user.id));
  revalidatePath("/");
}

// ============================================
// Create Notifications
// ============================================

export async function createNotification(data: {
  userId: string;
  type: "due_soon" | "overdue" | "mention" | "card_assigned" | "reminder";
  title: string;
  message: string;
  cardId?: string;
  boardId?: string;
  actionUrl?: string;
}) {
  await db.insert(notifications).values({
    id: crypto.randomUUID(),
    ...data,
  });
}

// ============================================
// Due Date Reminder System
// ============================================

export async function checkAndCreateDueReminders() {
  // This function should be called by a cron job or scheduled task
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Find all cards due in the next 24 hours that haven't been reminded
  const upcomingCards = await db.query.cards.findMany({
    where: and(
      gte(cards.dueDate, now),
      lt(cards.dueDate, in24Hours),
      isNull(cards.archivedAt)
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

  for (const card of upcomingCards) {
    // Check if we already sent a due_soon reminder for this card
    const existingReminder = await db.query.scheduledReminders.findFirst({
      where: and(
        eq(scheduledReminders.cardId, card.id),
        eq(scheduledReminders.type, "due_soon")
      ),
    });

    if (existingReminder) continue;

    // Determine who to notify (assignee or board owner)
    const notifyUserId = card.assigneeId || card.column.board.userId;

    // Check user's notification preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, notifyUserId),
    });

    // Create in-app notification if enabled
    if (!prefs || prefs.inAppEnabled !== false) {
      await createNotification({
        userId: notifyUserId,
        type: "due_soon",
        title: "Task due soon",
        message: `"${card.title}" is due in less than 24 hours`,
        cardId: card.id,
        boardId: card.column.boardId,
        actionUrl: `/board/${card.column.boardId}?card=${card.id}`,
      });
    }

    // Record that we sent this reminder
    await db.insert(scheduledReminders).values({
      id: crypto.randomUUID(),
      cardId: card.id,
      userId: notifyUserId,
      type: "due_soon",
      scheduledFor: now,
      sentAt: now,
      channels: JSON.stringify(["in_app"]),
    });
  }

  // Check for overdue cards
  const overdueCards = await db.query.cards.findMany({
    where: and(
      lt(cards.dueDate, now),
      isNull(cards.archivedAt)
    ),
    with: {
      column: {
        with: {
          board: true,
        },
      },
    },
  });

  for (const card of overdueCards) {
    // Check if we already sent an overdue reminder today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingReminder = await db.query.scheduledReminders.findFirst({
      where: and(
        eq(scheduledReminders.cardId, card.id),
        eq(scheduledReminders.type, "overdue"),
        gte(scheduledReminders.sentAt, today)
      ),
    });

    if (existingReminder) continue;

    const notifyUserId = card.assigneeId || card.column.board.userId;

    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, notifyUserId),
    });

    if (!prefs || prefs.inAppOverdue !== false) {
      await createNotification({
        userId: notifyUserId,
        type: "overdue",
        title: "Task overdue!",
        message: `"${card.title}" is past its due date`,
        cardId: card.id,
        boardId: card.column.boardId,
        actionUrl: `/board/${card.column.boardId}?card=${card.id}`,
      });
    }

    await db.insert(scheduledReminders).values({
      id: crypto.randomUUID(),
      cardId: card.id,
      userId: notifyUserId,
      type: "overdue",
      scheduledFor: now,
      sentAt: now,
      channels: JSON.stringify(["in_app"]),
    });
  }
}

// ============================================
// Push Notification Subscription
// ============================================

export async function savePushSubscription(subscription: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await updateNotificationPreferences({
    pushEnabled: true,
    pushSubscription: subscription,
  });
}

export async function removePushSubscription() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await updateNotificationPreferences({
    pushEnabled: false,
    pushSubscription: undefined,
  });
}
