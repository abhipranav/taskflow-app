import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cards } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Column {
  id: string;
  name: string;
  position: number;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const { completed } = await request.json();

  // Get the card's board to find the appropriate column
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, taskId),
    with: {
      column: {
        with: {
          board: {
            with: {
              columns: true,
            },
          },
        },
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // Find a "done" column or use the last column
  const boardColumns = card.column.board.columns as Column[];
  const doneColumnNames = ["done", "complete", "completed", "finished", "closed"];
  
  let targetColumn: Column | undefined;
  
  if (completed) {
    // Find done column
    targetColumn = boardColumns.find((col: Column) => 
      doneColumnNames.some(name => col.name.toLowerCase().includes(name))
    );
    // Fallback to last column
    if (!targetColumn) {
      targetColumn = boardColumns.sort((a: Column, b: Column) => b.position - a.position)[0];
    }
  } else {
    // Move back to first non-done column (like "To Do")
    targetColumn = boardColumns.find((col: Column) => 
      !doneColumnNames.some(name => col.name.toLowerCase().includes(name))
    );
    // Fallback to first column
    if (!targetColumn) {
      targetColumn = boardColumns.sort((a: Column, b: Column) => a.position - b.position)[0];
    }
  }

  if (targetColumn && targetColumn.id !== card.columnId) {
    await db.update(cards)
      .set({ 
        columnId: targetColumn.id,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, taskId));
  }

  return NextResponse.json({ success: true });
}
