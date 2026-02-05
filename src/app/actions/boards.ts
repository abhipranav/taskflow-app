"use server";

import { db } from "@/db";
import { boards, columns, cards, labels, cardLabels, boardMembers } from "@/db/schema";
import { eq, asc, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { getTemplateById } from "@/lib/board-templates";

// Get all boards for the current user
export async function getUserBoards() {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  return await db.query.boards.findMany({
    where: eq(boards.userId, session.user.id),
    orderBy: [asc(boards.createdAt)],
  });
}

// Get boards with their columns (for quick capture)
export async function getBoardsWithColumns(): Promise<{
  id: string;
  name: string;
  columns: { id: string; name: string; position: number }[];
}[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  const result = await db.query.boards.findMany({
    where: eq(boards.userId, session.user.id),
    orderBy: [asc(boards.createdAt)],
    with: {
      columns: {
        orderBy: [asc(columns.position)],
        columns: {
          id: true,
          name: true,
          position: true,
        },
      },
    },
  });
  
  return result.map(board => ({
    id: board.id,
    name: board.name,
    columns: board.columns.map(col => ({
      id: col.id,
      name: col.name,
      position: col.position,
    })),
  }));
}

// Get all boards (legacy - for demo purposes)
export async function getBoards() {
  return await db.query.boards.findMany({
    orderBy: [asc(boards.createdAt)],
  });
}

// Get a single board with all its data
export async function getBoardWithData(boardId: string) {
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
    with: {
      columns: {
        orderBy: [asc(columns.position)],
        with: {
          cards: {
            where: isNull(cards.archivedAt),
            orderBy: [asc(cards.position)],
            with: {
              cardLabels: {
                with: {
                  label: true,
                },
              },
              assignee: true,
            },
          },
        },
      },
      labels: true,
    },
  });

  return board;
}

// Get first available board (for demo purposes)
export async function getDefaultBoard() {
  const board = await db.query.boards.findFirst({
    orderBy: [asc(boards.createdAt)],
  });
  return board;
}

// Create a new board
// Create a new board with template-based columns and labels
export async function createBoard(name: string, userId: string, template: string = "kanban") {
  const id = crypto.randomUUID();
  await db.insert(boards).values({
    id,
    name,
    userId,
  });
  
  // Add creator as board owner
  await db.insert(boardMembers).values({
    boardId: id,
    userId,
    role: "owner",
  });

  // Get template configuration
  const templateConfig = getTemplateById(template);
  
  if (templateConfig) {
    // Create columns from template
    if (templateConfig.columns.length > 0) {
      await db.insert(columns).values(
        templateConfig.columns.map((colName, index) => ({
          id: crypto.randomUUID(),
          boardId: id,
          name: colName,
          position: index,
        }))
      );
    }
    
    // Create labels from template
    if (templateConfig.labels.length > 0) {
      await db.insert(labels).values(
        templateConfig.labels.map((label) => ({
          id: crypto.randomUUID(),
          boardId: id,
          name: label.name,
          color: label.color,
        }))
      );
    }
  } else {
    // Fallback to simple kanban if template not found
    const defaultColumns = ["To Do", "In Progress", "Done"];
    await db.insert(columns).values(
      defaultColumns.map((colName, index) => ({
        id: crypto.randomUUID(),
        boardId: id,
        name: colName,
        position: index,
      }))
    );
  }
  
  return id;
}

// Get all labels for a board
export async function getBoardLabels(boardId: string) {
  return await db.query.labels.findMany({
    where: eq(labels.boardId, boardId),
  });
}

// Rename a board
export async function renameBoard(boardId: string, name: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.update(boards)
    .set({ name })
    .where(eq(boards.id, boardId));
}

// Delete a board
export async function deleteBoard(boardId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Verify ownership
  const board = await db.query.boards.findFirst({
    where: eq(boards.id, boardId),
  });
  
  if (!board || board.userId !== session.user.id) {
    throw new Error("Not authorized");
  }

  await db.delete(boards).where(eq(boards.id, boardId));
}

// Update board background
export async function updateBoardBackground(boardId: string, background: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await db.update(boards)
    .set({ background, updatedAt: new Date() })
    .where(eq(boards.id, boardId));
  
  return background;
}

// Get dashboard stats for a user
export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, session.user.id),
    with: {
      columns: {
        with: {
          cards: {
            columns: {
              id: true,
              dueDate: true,
              archivedAt: true,
              assigneeId: true,
            },
          },
        },
      },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalTasks = 0;
  let overdueTasks = 0;
  let dueSoonTasks = 0;
  let myTasks = 0;

  userBoards.forEach(board => {
    board.columns.forEach(col => {
      col.cards.forEach((card: { id: string; dueDate: Date | null; archivedAt: Date | null; assigneeId: string | null }) => {
        if (card.archivedAt) return; // Skip archived
        totalTasks++;
        
        if (card.assigneeId === session.user?.id) {
          myTasks++;
        }
        
        if (card.dueDate) {
          const due = new Date(card.dueDate);
          due.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) overdueTasks++;
          else if (diffDays <= 3) dueSoonTasks++;
        }
      });
    });
  });

  return {
    totalBoards: userBoards.length,
    totalTasks,
    overdueTasks,
    dueSoonTasks,
    myTasks,
    recentBoards: userBoards.slice(0, 5),
  };
}
