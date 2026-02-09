"use server";

import { db } from "@/db";
import { timeEntries } from "@/db/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Start a time entry (for timer)
export async function startTimeEntry(cardId: string, description?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await db.insert(timeEntries).values({
    id,
    cardId,
    userId: session.user.id,
    duration: 0,
    description,
    startedAt: new Date(),
  });

  revalidatePath("/");
  return id;
}

// Stop a running timer and update duration
export async function stopTimeEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.id, entryId),
      eq(timeEntries.userId, session.user.id)
    ),
  });

  if (!entry || !entry.startedAt) {
    throw new Error("Time entry not found");
  }

  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000);

  await db.update(timeEntries)
    .set({
      duration,
      endedAt,
    })
    .where(eq(timeEntries.id, entryId));

  revalidatePath("/");
  return { duration };
}

// Log a manual time entry
export async function logTimeEntry(
  cardId: string,
  duration: number, // in seconds
  description?: string
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  await db.insert(timeEntries).values({
    id,
    cardId,
    userId: session.user.id,
    duration,
    description,
  });

  revalidatePath("/");
  return id;
}

// Delete a time entry
export async function deleteTimeEntry(entryId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.delete(timeEntries)
    .where(and(
      eq(timeEntries.id, entryId),
      eq(timeEntries.userId, session.user.id)
    ));

  revalidatePath("/");
}

// Get time entries for a card
export async function getTimeEntriesForCard(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return await db.query.timeEntries.findMany({
    where: eq(timeEntries.cardId, cardId),
    orderBy: [desc(timeEntries.createdAt)],
    with: {
      user: true,
    },
  });
}

// Get total time logged for a card
export async function getTotalTimeForCard(cardId: string): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0)`,
    })
    .from(timeEntries)
    .where(eq(timeEntries.cardId, cardId));

  return result[0]?.total || 0;
}

// Get running timer for user (if any)
export async function getRunningTimer() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const entry = await db.query.timeEntries.findFirst({
    where: and(
      eq(timeEntries.userId, session.user.id),
      eq(timeEntries.duration, 0), // Running timers have 0 duration
      sql`${timeEntries.startedAt} IS NOT NULL`
    ),
    with: {
      card: {
        with: {
          column: {
            with: {
              board: true,
            },
          },
        },
      },
    },
  });

  return entry;
}

// Get time entries for a user (for analytics)
export async function getUserTimeEntries(
  startDate?: Date,
  endDate?: Date
) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const conditions = [eq(timeEntries.userId, session.user.id)];
  if (startDate) {
    conditions.push(gte(timeEntries.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(timeEntries.createdAt, endDate));
  }

  return await db.query.timeEntries.findMany({
    where: and(...conditions),
    orderBy: [desc(timeEntries.createdAt)],
    with: {
      card: {
        with: {
          column: {
            with: {
              board: true,
            },
          },
        },
      },
    },
  });
}
