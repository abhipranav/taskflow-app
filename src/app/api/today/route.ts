import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cards, columns, boards } from "@/db/schema";
import { eq, and, or, lte, gte, isNull, isNotNull } from "drizzle-orm";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const today = new Date();
  const weekFromNow = addDays(today, 7);

  // Get all tasks assigned to user or with due dates soon
  const allCards = await db
    .select({
      id: cards.id,
      title: cards.title,
      description: cards.description,
      dueDate: cards.dueDate,
      priority: cards.priority,
      columnId: cards.columnId,
      columnName: columns.name,
      boardId: boards.id,
      boardName: boards.name,
      archivedAt: cards.archivedAt,
      assigneeId: cards.assigneeId,
    })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(
      and(
        isNull(cards.archivedAt),
        or(
          eq(cards.assigneeId, userId),
          and(
            isNotNull(cards.dueDate),
            lte(cards.dueDate, weekFromNow)
          )
        )
      )
    );

  // Check if task is in a "done" column (simple heuristic)
  const doneColumnNames = ["done", "complete", "completed", "finished", "closed"];
  
  const tasks = allCards.map(card => ({
    id: card.id,
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    priority: card.priority,
    boardId: card.boardId,
    boardName: card.boardName,
    columnName: card.columnName,
    isCompleted: doneColumnNames.some(name => 
      card.columnName.toLowerCase().includes(name)
    ),
  }));

  // Calculate stats
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const stats = {
    totalToday: tasks.filter(t => 
      t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd
    ).length,
    completedToday: tasks.filter(t => t.isCompleted).length,
    overdue: tasks.filter(t => 
      t.dueDate && t.dueDate < todayStart && !t.isCompleted
    ).length,
    upcoming: tasks.filter(t => 
      t.dueDate && t.dueDate > todayEnd && t.dueDate <= weekFromNow && !t.isCompleted
    ).length,
  };

  return NextResponse.json({ tasks, stats });
}
