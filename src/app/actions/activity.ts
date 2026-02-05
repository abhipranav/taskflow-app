"use server";

import { db } from "@/db";
import { activities, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface ActivityLog {
  id: string;
  userId: string | null;
  boardId: string | null;
  cardId: string | null;
  action: string;
  entityType: string;
  entityTitle: string | null;
  details: string | null;
  createdAt: Date | null;
  user: {
    name: string | null;
    image: string | null;
  } | null;
}

// Log an activity
export async function logActivity(
  boardId: string,
  userId: string,
  action: string,
  entityType: "board" | "column" | "card",
  entityTitle: string,
  details?: string,
  cardId?: string
) {
  try {
    await db.insert(activities).values({
      id: crypto.randomUUID(),
      boardId,
      userId,
      action,
      entityType,
      entityTitle,
      details,
      cardId,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
    // Don't throw, we don't want to break the main action if logging fails
  }
}

// Get activities for a card
export async function getCardActivity(cardId: string): Promise<ActivityLog[]> {
  const logs = await db
    .select({
      id: activities.id,
      userId: activities.userId,
      boardId: activities.boardId,
      cardId: activities.cardId,
      action: activities.action,
      entityType: activities.entityType,
      entityTitle: activities.entityTitle,
      details: activities.details,
      createdAt: activities.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(activities)
    .leftJoin(users, eq(activities.userId, users.id))
    .where(eq(activities.cardId, cardId))
    .orderBy(desc(activities.createdAt));

  return logs.map(log => ({
    id: log.id,
    userId: log.userId,
    boardId: log.boardId,
    cardId: log.cardId,
    action: log.action,
    entityType: log.entityType,
    entityTitle: log.entityTitle,
    details: log.details,
    createdAt: log.createdAt,
    user: log.userName ? { name: log.userName, image: log.userImage } : null
  }));
}

// Get activities for a board
export async function getBoardActivity(boardId: string, limit = 50): Promise<ActivityLog[]> {
  const logs = await db
    .select({
      id: activities.id,
      userId: activities.userId,
      boardId: activities.boardId,
      cardId: activities.cardId,
      action: activities.action,
      entityType: activities.entityType,
      entityTitle: activities.entityTitle,
      details: activities.details,
      createdAt: activities.createdAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(activities)
    .leftJoin(users, eq(activities.userId, users.id))
    .where(eq(activities.boardId, boardId))
    .orderBy(desc(activities.createdAt))
    .limit(limit);

  return logs.map(log => ({
    id: log.id,
    userId: log.userId,
    boardId: log.boardId,
    cardId: log.cardId,
    action: log.action,
    entityType: log.entityType,
    entityTitle: log.entityTitle,
    details: log.details,
    createdAt: log.createdAt,
    user: log.userName ? { name: log.userName, image: log.userImage } : null
  }));
}
