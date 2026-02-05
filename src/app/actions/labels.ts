"use server";

import { db } from "@/db";
import { labels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Create a new label
export async function createLabel(boardId: string, name: string, color: string) {
  const id = crypto.randomUUID();
  await db.insert(labels).values({
    id,
    boardId,
    name,
    color,
  });
  revalidatePath("/");
  return { id, name, color, boardId };
}

// Delete a label
export async function deleteLabel(labelId: string) {
  await db.delete(labels).where(eq(labels.id, labelId));
  revalidatePath("/");
}

// Update a label
export async function updateLabel(labelId: string, data: { name?: string; color?: string }) {
  await db.update(labels)
    .set(data)
    .where(eq(labels.id, labelId));
  revalidatePath("/");
}
