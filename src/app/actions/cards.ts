"use server";

import { db } from "@/db";
import { cards, cardLabels, columns, boards } from "@/db/schema";
import { eq, asc, and, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./activity";

// Create a new card
export async function createCard(columnId: string, title: string, assigneeId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Get the max position in the column
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
    assigneeId, 
  });

  // Log activity
  try {
    const column = await db.query.columns.findFirst({
      where: eq(columns.id, columnId),
    });
    
    if (column) {
      await logActivity(
        column.boardId,
        session.user.id,
        "created",
        "card",
        title,
        `in list ${column.name}`,
        id
      );
    }
  } catch (e) {
    console.error("Failed to log create activity", e);
  }

  revalidatePath("/");
  return id;
}

// Update card
export async function updateCard(
  cardId: string, 
  data: { 
    title?: string; 
    description?: string;
    summary?: string;
    dueDate?: Date | null;
    columnId?: string;
    position?: number;
    priority?: string;
    estimatedTime?: number | null;
    isRecurring?: boolean;
    recurringPattern?: string;
    recurringDays?: string;
  }
) {
  const session = await auth();
  
  await db.update(cards)
    .set({ 
      ...data, 
      updatedAt: new Date() 
    })
    .where(eq(cards.id, cardId));
  
  // Log activity if important fields changed
  if (session?.user?.id && (data.title || data.dueDate || data.description)) {
    try {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, cardId),
        with: { column: true }
      });
      
      if (card && card.column) {
        let action = "updated";
        let details = "";
        
        if (data.dueDate) {
          details = `set due date to ${data.dueDate.toISOString().split('T')[0]}`;
        } else if (data.description) {
          details = "updated description";
        } else if (data.title) {
          details = "renamed card";
        }

        await logActivity(
          card.column.boardId,
          session.user.id,
          action,
          "card",
          card.title,
          details,
          cardId
        );
      }
    } catch (e) {
      console.error("Failed to log update activity", e);
    }
  }

  revalidatePath("/");
}

// Archive a card (soft delete)
export async function archiveCard(cardId: string) {
  const session = await auth();

  const cardInfo = session?.user?.id
    ? await db.query.cards.findFirst({
        where: eq(cards.id, cardId),
        with: { column: true },
      })
    : null;

  await db.update(cards)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(cards.id, cardId));

  if (session?.user?.id && cardInfo && cardInfo.column) {
    await logActivity(
      cardInfo.column.boardId,
      session.user.id,
      "archived",
      "card",
      cardInfo.title,
      undefined,
      undefined
    );
  }

  revalidatePath("/");
}

// Restore an archived card
export async function restoreCard(cardId: string) {
  const session = await auth();

  const cardInfo = session?.user?.id
    ? await db.query.cards.findFirst({
        where: eq(cards.id, cardId),
        with: { column: true },
      })
    : null;

  await db.update(cards)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(eq(cards.id, cardId));

  if (session?.user?.id && cardInfo && cardInfo.column) {
    await logActivity(
      cardInfo.column.boardId,
      session.user.id,
      "restored",
      "card",
      cardInfo.title,
      undefined,
      undefined
    );
  }

  revalidatePath("/");
}

// Delete a card (hard delete)
export async function deleteCard(cardId: string) {
  const session = await auth();
  
  // Get card info before delete for logging
  let cardInfo = null;
  if (session?.user?.id) {
    cardInfo = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: { column: true }
    });
  }

  await db.delete(cards).where(eq(cards.id, cardId));
  
  if (session?.user?.id && cardInfo && cardInfo.column) {
    await logActivity(
      cardInfo.column.boardId,
      session.user.id,
      "deleted",
      "card",
      cardInfo.title,
      undefined,
      cardId // Note: cardId references might fail constraint if we don't handle cascade or if foreign key exists in activities. 
      // Activities table has cardId FK with ON DELETE CASCADE? Yes.
      // So if we delete card, activity log for that card might be deleted too?
      // Yes check schema: cardId references cards.id { onDelete: "cascade" }.
      // So logging "deleted" activity linked to the card will immediately delete the log entry!
      // We should pass null for cardId if we are deleting the card, OR we change schema to SET NULL.
      // For now, let's pass null for cardId.
    );
     // Since the card is deleted, we can't link to it. So pass undefined/null for cardId.
     await logActivity(
      cardInfo.column.boardId,
      session.user.id,
      "deleted",
      "card",
      cardInfo.title,
      undefined,
      undefined 
    );
  }

  revalidatePath("/");
}

// Move card to a different column
export async function moveCard(cardId: string, toColumnId: string, newPosition: number) {
  const session = await auth();

  // Get cards in the target column
  const targetCards = await db.query.cards.findMany({
    where: and(
      eq(cards.columnId, toColumnId),
      isNull(cards.archivedAt)
    ),
    orderBy: [asc(cards.position)],
  });

  // Update positions of cards after the insertion point
  for (let i = newPosition; i < targetCards.length; i++) {
    await db.update(cards)
      .set({ position: i + 1 })
      .where(eq(cards.id, targetCards[i].id));
  }

  // Get old column info for logging
  let oldCardInfo = null;
  if (session?.user?.id) {
    oldCardInfo = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      with: { column: true }
    });
  }

  // Move the card
  await db.update(cards)
    .set({ 
      columnId: toColumnId, 
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));

  // Log move
  if (session?.user?.id && oldCardInfo && oldCardInfo.column && oldCardInfo.columnId !== toColumnId) {
    const newColumn = await db.query.columns.findFirst({
      where: eq(columns.id, toColumnId)
    });
    
    if (newColumn) {
      await logActivity(
        oldCardInfo.column.boardId,
        session.user.id,
        "moved",
        "card",
        oldCardInfo.title,
        `from ${oldCardInfo.column.name} to ${newColumn.name}`,
        cardId
      );
    }
  }

  revalidatePath("/");
}

// Reorder cards within a column
export async function reorderCards(columnId: string, cardIds: string[]) {
  for (let i = 0; i < cardIds.length; i++) {
    await db.update(cards)
      .set({ position: i })
      .where(eq(cards.id, cardIds[i]));
  }
  revalidatePath("/");
}

// Add label to card
export async function addLabelToCard(cardId: string, labelId: string) {
  await db.insert(cardLabels).values({
    cardId,
    labelId,
  });
  revalidatePath("/");
}

// Remove label from card
export async function removeLabelFromCard(cardId: string, labelId: string) {
  await db.delete(cardLabels)
    .where(
      and(
        eq(cardLabels.cardId, cardId),
        eq(cardLabels.labelId, labelId)
      )
    );
  revalidatePath("/");
}

// Get single card with all relations
export async function getCard(cardId: string) {
  return await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
    with: {
      cardLabels: {
        with: {
          label: true,
        },
      },
      assignee: true,
      checklists: {
        orderBy: [asc(cards.position)],
      },
      links: true,
    },
  });
}

// Get all tasks assigned to the current user
export async function getMyTasks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const myCards = await db.query.cards.findMany({
    where: and(
      eq(cards.assigneeId, session.user.id),
      isNull(cards.archivedAt)
    ),
    orderBy: [asc(cards.dueDate)],
    with: {
      cardLabels: {
        with: {
          label: true,
        },
      },
      column: {
        with: {
          board: true,
        },
      },
    },
  });

  return myCards;
}

// Get archived cards for a board
export async function getArchivedCards(boardId: string) {
  const boardColumns = await db.query.columns.findMany({
    where: eq(columns.boardId, boardId),
  });
  
  const columnIds = boardColumns.map(c => c.id);
  
  if (columnIds.length === 0) return [];

  const archivedCards = [];
  for (const colId of columnIds) {
    const cardsInColumn = await db.query.cards.findMany({
      where: and(
        eq(cards.columnId, colId),
        // Only get archived cards
      ),
      with: {
        cardLabels: {
          with: {
            label: true,
          },
        },
      },
    });
    // Filter for archived only
    archivedCards.push(...cardsInColumn.filter(c => c.archivedAt !== null));
  }

  return archivedCards;
}
