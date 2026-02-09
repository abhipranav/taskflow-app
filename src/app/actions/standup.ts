"use server";

import { db } from "@/db";
import { activities, cards, boards } from "@/db/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { subDays, startOfDay, format } from "date-fns";
import { generateText } from "@/lib/ai";

export async function generateStandupReport() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const yesterday = startOfDay(subDays(new Date(), 1));

  // Get recent activities
  const recentActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.createdAt, yesterday)
    ),
    orderBy: [desc(activities.createdAt)],
    limit: 50,
  });

  // Get user's current tasks
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        with: {
          cards: {
            where: eq(cards.assigneeId, userId),
          },
        },
      },
    },
  });

  // Group tasks by column type
  const inProgressColumnNames = ["in progress", "doing", "working"];
  const todoColumnNames = ["to do", "backlog", "todo"];
  const doneColumnNames = ["done", "complete", "completed"];

  const allTasks = userBoards.flatMap(b =>
    b.columns.flatMap(c =>
      c.cards.map((card) => ({
        ...card,
        boardName: b.name,
        columnName: c.name,
        isInProgress: inProgressColumnNames.some(name => 
          c.name.toLowerCase().includes(name)
        ),
        isTodo: todoColumnNames.some(name => 
          c.name.toLowerCase().includes(name)
        ),
        isDone: doneColumnNames.some(name => 
          c.name.toLowerCase().includes(name)
        ),
      }))
    )
  );

  const inProgressTasks = allTasks.filter(t => t.isInProgress && !t.archivedAt);
  const todoTasks = allTasks.filter(t => t.isTodo && !t.archivedAt);

  // Completed yesterday
  const completedActivities = recentActivities.filter(
    a => a.action === "moved" && a.details?.toLowerCase().includes("done")
  );

  // Build context for AI
  const context = {
    date: format(new Date(), "MMMM d, yyyy"),
    completedYesterday: completedActivities.map(a => a.entityTitle).filter(Boolean),
    inProgress: inProgressTasks.map(t => ({ 
      title: t.title, 
      board: t.boardName,
      dueDate: t.dueDate ? format(t.dueDate, "MMM d") : null,
    })),
    upcoming: todoTasks.slice(0, 5).map(t => ({ 
      title: t.title, 
      board: t.boardName,
    })),
    overdue: allTasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && !t.isDone && !t.archivedAt
    ).map(t => t.title),
  };

  // Try AI generation
  try {
    const prompt = `Generate a concise daily standup report in markdown format based on this data:

**Date:** ${context.date}

**Completed Recently:**
${context.completedYesterday.length > 0 
  ? context.completedYesterday.map(t => `- ${t}`).join('\n')
  : '- No tasks completed recently'}

**Currently In Progress:**
${context.inProgress.length > 0 
  ? context.inProgress.map(t => `- ${t.title} (${t.board})${t.dueDate ? ` - Due: ${t.dueDate}` : ''}`).join('\n')
  : '- No tasks in progress'}

**Overdue Items:**
${context.overdue.length > 0 
  ? context.overdue.map(t => `- ${t}`).join('\n')
  : '- No overdue items 🎉'}

**Next Up:**
${context.upcoming.length > 0 
  ? context.upcoming.map(t => `- ${t.title} (${t.board})`).join('\n')
  : '- No upcoming tasks'}

Format this into a professional standup report with sections for:
1. 📋 What I completed
2. 🔄 What I'm working on
3. ⚠️ Blockers/Overdue (if any)
4. 📅 What's next

Keep it brief and actionable. If there are overdue items, highlight them as potential blockers.`;

    const report = await generateText(prompt);
    if (report) {
      return { report, context };
    }
  } catch (error) {
    console.error("AI standup generation failed:", error);
  }

  // Fallback to template-based report
  const fallbackReport = `# Daily Standup - ${context.date}

## 📋 Completed Recently
${context.completedYesterday.length > 0 
  ? context.completedYesterday.map(t => `- ${t}`).join('\n')
  : '_No tasks completed recently_'}

## 🔄 Currently Working On
${context.inProgress.length > 0 
  ? context.inProgress.map(t => `- **${t.title}** (${t.board})${t.dueDate ? ` - Due: ${t.dueDate}` : ''}`).join('\n')
  : '_No tasks in progress_'}

${context.overdue.length > 0 ? `## ⚠️ Overdue Items
${context.overdue.map(t => `- 🔴 ${t}`).join('\n')}` : ''}

## 📅 Next Up
${context.upcoming.length > 0 
  ? context.upcoming.map(t => `- ${t.title} (${t.board})`).join('\n')
  : '_No upcoming tasks_'}

---
_Generated automatically from TaskFlow_`;

  return { report: fallbackReport, context };
}

export async function getStandupData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const yesterday = startOfDay(subDays(new Date(), 1));

  const recentActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.createdAt, yesterday)
    ),
    orderBy: [desc(activities.createdAt)],
    limit: 20,
  });

  return { activities: recentActivities };
}
