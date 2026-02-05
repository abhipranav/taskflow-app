"use server";

import { generateSubtasks, summarizeTask } from "@/lib/ai";
import { db } from "@/db";
import { cards, checklists } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate subtasks for a card using AI
export async function generateCardSubtasks(cardId: string) {
  // Get the card
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
  });

  if (!card) {
    // Card not found - likely an optimistic ID, return empty array
    console.warn(`Card not found for subtask generation: ${cardId}`);
    return [];
  }

  // Generate subtasks using AI
  const subtaskTexts = await generateSubtasks(card.title, card.description || undefined);

  // Get existing checklist items count for positioning
  const existingItems = await db.query.checklists.findMany({
    where: eq(checklists.cardId, cardId),
  });
  const startPosition = existingItems.length;

  // Create checklist items
  const createdSubtasks = [];
  for (let i = 0; i < subtaskTexts.length; i++) {
    const id = crypto.randomUUID();
    await db.insert(checklists).values({
      id,
      cardId,
      text: subtaskTexts[i],
      completed: false,
      position: startPosition + i,
    });
    createdSubtasks.push({
      id,
      text: subtaskTexts[i],
      completed: false,
    });
  }

  revalidatePath("/");
  return createdSubtasks;
}

// Summarize a card using AI
export async function summarizeCard(cardId: string) {
  // Get the card with checklists
  const card = await db.query.cards.findFirst({
    where: eq(cards.id, cardId),
    with: {
      checklists: {
        orderBy: [asc(checklists.position)],
      },
    },
  });

  if (!card) {
    // Card not found - likely an optimistic ID, return null
    console.warn(`Card not found for summarization: ${cardId}`);
    return null;
  }

  // Generate summary using AI
  const subtaskTexts = card.checklists.map((c: { text: string }) => c.text);
  const summary = await summarizeTask(
    card.title,
    card.description || undefined,
    subtaskTexts
  );

  // Update the card with the summary
  await db.update(cards)
    .set({ summary, updatedAt: new Date() })
    .where(eq(cards.id, cardId));

  revalidatePath("/");
  return summary;
}

// Get checklist items for a card
export async function getCardChecklists(cardId: string) {
  return await db.query.checklists.findMany({
    where: eq(checklists.cardId, cardId),
    orderBy: [asc(checklists.position)],
  });
}

// Toggle checklist item completion
export async function toggleChecklistItem(checklistId: string, completed: boolean) {
  await db.update(checklists)
    .set({ completed })
    .where(eq(checklists.id, checklistId));
  
  revalidatePath("/");
}

// Delete checklist item
export async function deleteChecklistItem(checklistId: string) {
  await db.delete(checklists).where(eq(checklists.id, checklistId));
  revalidatePath("/");
}
