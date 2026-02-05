"use server";

import { db } from "@/db";
import { columns } from "@/db/schema";
import { eq, asc, gt, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Create a new column
export async function createColumn(boardId: string, name: string) {
  // Get the max position
  const existing = await db.query.columns.findMany({
    where: eq(columns.boardId, boardId),
    orderBy: [asc(columns.position)],
  });
  
  const maxPosition = existing.length > 0 
    ? Math.max(...existing.map(c => c.position)) + 1 
    : 0;

  const id = crypto.randomUUID();
  await db.insert(columns).values({
    id,
    boardId,
    name,
    position: maxPosition,
  });

  revalidatePath("/");
  return id;
}

// Update column name
export async function updateColumnName(columnId: string, name: string) {
  await db.update(columns)
    .set({ name })
    .where(eq(columns.id, columnId));
  
  revalidatePath("/");
}

// Delete a column
export async function deleteColumn(columnId: string) {
  await db.delete(columns).where(eq(columns.id, columnId));
  revalidatePath("/");
}

// Reorder columns
export async function reorderColumns(columnIds: string[]) {
  for (let i = 0; i < columnIds.length; i++) {
    await db.update(columns)
      .set({ position: i })
      .where(eq(columns.id, columnIds[i]));
  }
  revalidatePath("/");
}
