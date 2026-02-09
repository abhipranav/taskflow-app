"use server";

import { db } from "@/db";
import { cards, columns, boards, labels, cardLabels } from "@/db/schema";
import { eq, and, like, or, desc, isNull, lte, gte, sql } from "drizzle-orm";
import { auth } from "@/auth";

export interface SearchFilters {
  query?: string;
  boardId?: string;
  priority?: string;
  labelId?: string;
  dueDateRange?: "overdue" | "today" | "week" | "month";
  assigneeId?: string;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  dueDate: Date | null;
  boardId: string;
  boardName: string;
  columnId: string;
  columnName: string;
  labels: { id: string; name: string; color: string }[];
  assigneeName: string | null;
}

export async function searchTasks(filters: SearchFilters): Promise<SearchResult[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;
  const limit = filters.limit || 50;

  // Get user's boards
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    columns: { id: true, name: true },
  });

  if (userBoards.length === 0) return [];

  const boardIds = filters.boardId 
    ? [filters.boardId]
    : userBoards.map(b => b.id);

  // Build date filter
  let dateFilter: Date | null = null;
  let dateLte: Date | null = null;
  const now = new Date();
  
  if (filters.dueDateRange === "overdue") {
    dateLte = new Date(now.setHours(0, 0, 0, 0));
  } else if (filters.dueDateRange === "today") {
    dateFilter = new Date();
    dateFilter.setHours(0, 0, 0, 0);
    dateLte = new Date();
    dateLte.setHours(23, 59, 59, 999);
  } else if (filters.dueDateRange === "week") {
    dateLte = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (filters.dueDateRange === "month") {
    dateLte = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  // Get columns for the boards
  const boardColumns = await db.query.columns.findMany({
    where: sql`${columns.boardId} IN ${boardIds}`,
    columns: { id: true, name: true, boardId: true },
  });

  const columnIds = boardColumns.map(c => c.id);

  if (columnIds.length === 0) return [];

  // Search cards
  const cardsQuery = db
    .select({
      id: cards.id,
      title: cards.title,
      description: cards.description,
      priority: cards.priority,
      dueDate: cards.dueDate,
      columnId: cards.columnId,
      assigneeId: cards.assigneeId,
    })
    .from(cards)
    .where(
      and(
        sql`${cards.columnId} IN ${columnIds}`,
        isNull(cards.archivedAt),
        filters.query
          ? or(
              like(cards.title, `%${filters.query}%`),
              like(cards.description, `%${filters.query}%`)
            )
          : undefined,
        filters.priority && filters.priority !== "all"
          ? eq(cards.priority, filters.priority)
          : undefined,
        filters.assigneeId
          ? eq(cards.assigneeId, filters.assigneeId)
          : undefined,
        dateFilter
          ? gte(cards.dueDate, dateFilter)
          : undefined,
        dateLte
          ? lte(cards.dueDate, dateLte)
          : undefined
      )
    )
    .orderBy(desc(cards.updatedAt))
    .limit(limit);

  const foundCards = await cardsQuery;

  // Get labels for found cards
  const cardIds = foundCards.map(c => c.id);
  
  const cardLabelData = cardIds.length > 0
    ? await db
        .select({
          cardId: cardLabels.cardId,
          labelId: labels.id,
          labelName: labels.name,
          labelColor: labels.color,
        })
        .from(cardLabels)
        .innerJoin(labels, eq(cardLabels.labelId, labels.id))
        .where(sql`${cardLabels.cardId} IN ${cardIds}`)
    : [];

  // Filter by label if specified
  const filteredCards = filters.labelId
    ? foundCards.filter(card =>
        cardLabelData.some(cl => cl.cardId === card.id && cl.labelId === filters.labelId)
      )
    : foundCards;

  // Build results
  const results: SearchResult[] = filteredCards.map(card => {
    const column = boardColumns.find(c => c.id === card.columnId);
    const board = userBoards.find(b => b.id === column?.boardId);
    const cardLabelsForCard = cardLabelData.filter(cl => cl.cardId === card.id);

    return {
      id: card.id,
      title: card.title,
      description: card.description,
      priority: card.priority,
      dueDate: card.dueDate,
      boardId: board?.id || "",
      boardName: board?.name || "",
      columnId: card.columnId,
      columnName: column?.name || "",
      labels: cardLabelsForCard.map(cl => ({
        id: cl.labelId,
        name: cl.labelName,
        color: cl.labelColor,
      })),
      assigneeName: null, // Would need to join users table
    };
  });

  return results;
}

export async function getSearchFilters() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  // Get user's boards with labels
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    columns: { id: true, name: true },
    with: {
      labels: {
        columns: { id: true, name: true, color: true },
      },
    },
  });

  return {
    boards: userBoards.map(b => ({ id: b.id, name: b.name })),
    labels: userBoards.flatMap(b => b.labels),
  };
}
