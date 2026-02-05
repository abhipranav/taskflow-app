import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cards, columns, labels, cardLabels } from "@/db/schema";
import { eq, asc, and, isNull } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, columnId, priority, dueDate, estimatedTime, labels: labelNames } = await request.json();

  if (!title || !columnId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get the board ID from the column
  const column = await db.query.columns.findFirst({
    where: eq(columns.id, columnId),
  });

  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  // Get max position in column
  const existing = await db.query.cards.findMany({
    where: and(
      eq(cards.columnId, columnId),
      isNull(cards.archivedAt)
    ),
    orderBy: [asc(cards.position)],
  });

  const maxPosition = existing.length > 0 
    ? Math.max(...existing.map(c => c.position)) + 1 
    : 0;

  const id = crypto.randomUUID();
  await db.insert(cards).values({
    id,
    columnId,
    title,
    position: maxPosition,
    priority: priority || "none",
    dueDate: dueDate ? new Date(dueDate) : null,
    estimatedTime: estimatedTime || null,
    assigneeId: session.user.id, // Auto-assign to creator
  });

  // Handle labels - find or create matching labels
  if (labelNames && labelNames.length > 0) {
    // Get existing labels for this board
    const boardLabels = await db.query.labels.findMany({
      where: eq(labels.boardId, column.boardId),
    });

    for (const labelName of labelNames) {
      let label = boardLabels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
      
      // Create label if it doesn't exist
      if (!label) {
        const labelId = crypto.randomUUID();
        const colors = ["#94a3b8", "#78716c", "#64748b", "#6b7280", "#a8a29e"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        await db.insert(labels).values({
          id: labelId,
          boardId: column.boardId,
          name: labelName,
          color,
        });
        
        label = { id: labelId, boardId: column.boardId, name: labelName, color };
      }

      // Add label to card
      await db.insert(cardLabels).values({
        cardId: id,
        labelId: label.id,
      });
    }
  }

  return NextResponse.json({ id, success: true });
}
