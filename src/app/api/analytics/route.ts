import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { cards, boards, timeEntries, activities } from "@/db/schema";
import { eq, and, gte, isNull, desc } from "drizzle-orm";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format, startOfWeek, endOfWeek } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d";

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const startDate = subDays(new Date(), days);
  const endDate = new Date();

  // Get all user boards
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    with: {
      columns: {
        with: {
          cards: {
            where: isNull(cards.archivedAt),
          },
        },
      },
    },
  });

  // Calculate overview stats
  const allCards = userBoards.flatMap(b => b.columns.flatMap(c => c.cards));
  const doneColumnNames = ["done", "complete", "completed", "finished", "closed"];
  const inProgressColumnNames = ["in progress", "doing", "working"];
  
  const completedCards = userBoards.flatMap(b =>
    b.columns
      .filter(c => doneColumnNames.some(name => c.name.toLowerCase().includes(name)))
      .flatMap(c => c.cards)
  );

  const inProgressCards = userBoards.flatMap(b =>
    b.columns
      .filter(c => inProgressColumnNames.some(name => c.name.toLowerCase().includes(name)))
      .flatMap(c => c.cards)
  );

  const now = new Date();
  const overdueCards = allCards.filter(
    c => c.dueDate && c.dueDate < now && !completedCards.find(cc => cc.id === c.id)
  );

  const overview = {
    totalTasks: allCards.length,
    completedTasks: completedCards.length,
    inProgressTasks: inProgressCards.length,
    overdueTasks: overdueCards.length,
    completionRate: allCards.length > 0 
      ? Math.round((completedCards.length / allCards.length) * 100) 
      : 0,
  };

  // Get time tracking data
  const userTimeEntries = await db.query.timeEntries.findMany({
    where: and(
      eq(timeEntries.userId, userId),
      gte(timeEntries.createdAt, startDate)
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

  const totalTimeLogged = userTimeEntries.reduce((acc, e) => acc + e.duration, 0);
  const tasksWithTime = new Set(userTimeEntries.map(e => e.cardId));
  const averageTimePerTask = tasksWithTime.size > 0 
    ? Math.round(totalTimeLogged / tasksWithTime.size) 
    : 0;

  // Board with most time
  const timeByBoard: Record<string, { name: string; time: number }> = {};
  userTimeEntries.forEach((entry) => {
    const board = entry.card?.column?.board;
    if (board) {
      const boardId = board.id;
      if (!timeByBoard[boardId]) {
        timeByBoard[boardId] = { name: board.name, time: 0 };
      }
      timeByBoard[boardId].time += entry.duration;
    }
  });
  const mostTimeSpentBoard = Object.values(timeByBoard)
    .sort((a, b) => b.time - a.time)[0]?.name || null;

  // Weekly time breakdown
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyTime = weekDays.map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    return userTimeEntries
      .filter(e => e.createdAt && e.createdAt >= dayStart && e.createdAt <= dayEnd)
      .reduce((acc, e) => acc + e.duration, 0);
  });

  // Productivity data
  const recentActivities = await db.query.activities.findMany({
    where: and(
      eq(activities.userId, userId),
      gte(activities.createdAt, startDate)
    ),
    orderBy: [desc(activities.createdAt)],
  });

  // Tasks completed this week (moved to done columns)
  const moveActivities = recentActivities.filter(
    a => a.action === "moved" && a.details?.toLowerCase().includes("done")
  );
  
  const thisWeekActivities = moveActivities.filter(
    a => a.createdAt && a.createdAt >= weekStart
  );

  // Daily completions for chart
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyCompletions = daysInRange.slice(-14).map(day => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const count = moveActivities.filter(
      a => a.createdAt && a.createdAt >= dayStart && a.createdAt <= dayEnd
    ).length;
    return { date: format(day, "yyyy-MM-dd"), count };
  });

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (let i = dailyCompletions.length - 1; i >= 0; i--) {
    if (dailyCompletions[i].count > 0) {
      if (i === dailyCompletions.length - 1 || i === dailyCompletions.length - 2) {
        currentStreak++;
      }
      tempStreak++;
    } else {
      if (currentStreak > 0 && i < dailyCompletions.length - 2) {
        // Streak broken
      }
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 0;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  const productivity = {
    tasksCompletedThisWeek: thisWeekActivities.length,
    tasksCreatedThisWeek: recentActivities.filter(
      a => a.action === "created" && a.createdAt && a.createdAt >= weekStart
    ).length,
    currentStreak,
    bestStreak,
    dailyCompletions,
  };

  // Board stats
  const boardStats = userBoards.map(board => {
    const boardCards = board.columns.flatMap(c => c.cards);
    const boardCompleted = board.columns
      .filter(c => doneColumnNames.some(name => c.name.toLowerCase().includes(name)))
      .flatMap(c => c.cards);

    return {
      id: board.id,
      name: board.name,
      totalTasks: boardCards.length,
      completedTasks: boardCompleted.length,
      completionRate: boardCards.length > 0 
        ? Math.round((boardCompleted.length / boardCards.length) * 100) 
        : 0,
    };
  }).filter(b => b.totalTasks > 0);

  return NextResponse.json({
    overview,
    timeTracking: {
      totalTimeLogged,
      averageTimePerTask,
      mostTimeSpentBoard,
      weeklyTime,
    },
    productivity,
    boardStats,
  });
}
