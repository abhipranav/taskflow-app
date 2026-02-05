"use server";

import { db } from "@/db";
import { boardMembers, users, cards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logActivity } from "./activity";

// Get all members of a board
export async function getBoardMembers(boardId: string) {
  const members = await db.query.boardMembers.findMany({
    where: eq(boardMembers.boardId, boardId),
    with: {
      user: true,
    },
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return members.map((m: any) => ({
    id: m.user.id as string,
    name: m.user.name as string | null,
    email: m.user.email as string | null,
    image: m.user.image as string | null,
    role: m.role as string,
    joinedAt: m.joinedAt as Date | null,
  }));
}

// Add a member to a board by email
export async function addMemberToBoard(boardId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new Error("User not found. They need to sign up first.");
  }

  // Check if already a member
  const existing = await db.query.boardMembers.findFirst({
    where: and(
      eq(boardMembers.boardId, boardId),
      eq(boardMembers.userId, user.id)
    ),
  });

  if (existing) {
    throw new Error("User is already a member of this board");
  }

  // Add member
  await db.insert(boardMembers).values({
    boardId,
    userId: user.id,
    role: "member",
  });

  revalidatePath("/");
  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

// Remove a member from a board
export async function removeMemberFromBoard(boardId: string, userId: string) {
  await db.delete(boardMembers)
    .where(and(
      eq(boardMembers.boardId, boardId),
      eq(boardMembers.userId, userId)
    ));
  
  revalidatePath("/");
}

// Update card assignee
export async function updateCardAssignee(cardId: string, assigneeId: string | null) {
  const session = await auth();
  
  await db.update(cards)
    .set({ 
      assigneeId,
      updatedAt: new Date(),
    })
    .where(eq(cards.id, cardId));
  
  // Log activity
  if (session?.user?.id) {
    try {
      const card = await db.query.cards.findFirst({
        where: eq(cards.id, cardId),
        with: { column: true }
      });
      
      let assigneeName = "Unassigned";
      if (assigneeId) {
        const assignee = await db.query.users.findFirst({
          where: eq(users.id, assigneeId)
        });
        assigneeName = assignee?.name || "Unknown";
      }

      if (card && card.column) {
        await logActivity(
          card.column.boardId,
          session.user.id,
          "updated",
          "card",
          card.title,
          assigneeId ? `assigned to ${assigneeName}` : "removed assignee",
          cardId
        );
      }
    } catch (e) {
      console.error("Failed to log assignment activity", e);
    }
  }

  revalidatePath("/");
}

// Assign current user to card
export async function assignToMe(cardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  await updateCardAssignee(cardId, session.user.id);
}

// Add board owner as first member when board is created
export async function addBoardOwner(boardId: string, userId: string) {
  await db.insert(boardMembers).values({
    boardId,
    userId,
    role: "owner",
  });
}
