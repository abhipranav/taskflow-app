import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cards, columns, boards } from "@/db/schema";
import { eq, and, gte, lte, isNull, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "Start and end dates are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get all tasks with due dates in the range
  const allCards = await db
    .select({
      id: cards.id,
      title: cards.title,
      dueDate: cards.dueDate,
      priority: cards.priority,
      boardId: boards.id,
      boardName: boards.name,
      columnName: columns.name,
    })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .innerJoin(boards, eq(columns.boardId, boards.id))
    .where(
      and(
        eq(boards.userId, session.user.id),
        isNull(cards.archivedAt),
        isNotNull(cards.dueDate),
        gte(cards.dueDate, start),
        lte(cards.dueDate, end)
      )
    );

  return NextResponse.json({ tasks: allCards });
}
