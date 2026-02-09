import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { cards, columns, boards, timeEntries, activities } from "@/db/schema";
import { eq, and, gte, lte, sql, isNull, isNotNull } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Award,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks, differenceInDays } from "date-fns";

async function getWeeklyStats(userId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  const lastWeekStart = subWeeks(weekStart, 1);
  const lastWeekEnd = subWeeks(weekEnd, 1);

  // Get user's boards
  const userBoards = await db.query.boards.findMany({
    where: eq(boards.userId, userId),
    columns: { id: true },
  });
  const boardIds = userBoards.map(b => b.id);

  if (boardIds.length === 0) {
    return {
      completedThisWeek: 0,
      completedLastWeek: 0,
      timeTrackedMinutes: 0,
      timeTrackedLastWeek: 0,
      upcomingDeadlines: [],
      overdueCount: 0,
      activitiesThisWeek: 0,
      streak: 0,
      topLabels: [],
      completionByDay: {},
    };
  }

  // Completed tasks this week (tasks moved to done-like columns or archived this week)
  const completedThisWeek = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        sql`${activities.boardId} IN ${boardIds}`,
        eq(activities.action, "completed"),
        gte(activities.createdAt, weekStart),
        lte(activities.createdAt, weekEnd)
      )
    );

  // Completed last week for comparison
  const completedLastWeek = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        sql`${activities.boardId} IN ${boardIds}`,
        eq(activities.action, "completed"),
        gte(activities.createdAt, lastWeekStart),
        lte(activities.createdAt, lastWeekEnd)
      )
    );

  // Time tracked this week
  const timeThisWeek = await db
    .select({ total: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0)` })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.createdAt, weekStart),
        lte(timeEntries.createdAt, weekEnd)
      )
    );

  // Time tracked last week
  const timeLastWeek = await db
    .select({ total: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0)` })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.userId, userId),
        gte(timeEntries.createdAt, lastWeekStart),
        lte(timeEntries.createdAt, lastWeekEnd)
      )
    );

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = await db
    .select({
      id: cards.id,
      title: cards.title,
      dueDate: cards.dueDate,
      priority: cards.priority,
      boardId: columns.boardId,
    })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .where(
      and(
        sql`${columns.boardId} IN ${boardIds}`,
        isNull(cards.archivedAt),
        isNotNull(cards.dueDate),
        gte(cards.dueDate, now),
        lte(cards.dueDate, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000))
      )
    )
    .orderBy(cards.dueDate)
    .limit(10);

  // Overdue count
  const overdueResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .where(
      and(
        sql`${columns.boardId} IN ${boardIds}`,
        isNull(cards.archivedAt),
        isNotNull(cards.dueDate),
        lte(cards.dueDate, now)
      )
    );

  // Activities count this week
  const activitiesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        sql`${activities.boardId} IN ${boardIds}`,
        gte(activities.createdAt, weekStart),
        lte(activities.createdAt, weekEnd)
      )
    );

  // Calculate streak (consecutive days with activity)
  let streak = 0;
  const checkDate = new Date();
  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(checkDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(checkDate);
    dayEnd.setHours(23, 59, 59, 999);

    const dayActivity = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(
        and(
          sql`${activities.boardId} IN ${boardIds}`,
          gte(activities.createdAt, dayStart),
          lte(activities.createdAt, dayEnd)
        )
      );

    if (dayActivity[0].count > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i > 0) {
      break;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  return {
    completedThisWeek: completedThisWeek[0]?.count || 0,
    completedLastWeek: completedLastWeek[0]?.count || 0,
    timeTrackedMinutes: Math.round((timeThisWeek[0]?.total || 0) / 60),
    timeTrackedLastWeek: Math.round((timeLastWeek[0]?.total || 0) / 60),
    upcomingDeadlines: upcomingDeadlines.map(d => ({
      ...d,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
    })),
    overdueCount: overdueResult[0]?.count || 0,
    activitiesThisWeek: activitiesCount[0]?.count || 0,
    streak,
    topLabels: [], // Could add label stats
    completionByDay: {}, // Could add day-by-day breakdown
  };
}

export default async function WeeklyReviewPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const stats = await getWeeklyStats(session.user.id);
  
  const completionChange = stats.completedLastWeek > 0
    ? Math.round(((stats.completedThisWeek - stats.completedLastWeek) / stats.completedLastWeek) * 100)
    : stats.completedThisWeek > 0 ? 100 : 0;

  const timeChange = stats.timeTrackedLastWeek > 0
    ? Math.round(((stats.timeTrackedMinutes - stats.timeTrackedLastWeek) / stats.timeTrackedLastWeek) * 100)
    : stats.timeTrackedMinutes > 0 ? 100 : 0;

  const weekProgress = Math.round((new Date().getDay() / 7) * 100);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Weekly Review</h1>
        <p className="text-muted-foreground">
          {format(startOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d")} - {format(endOfWeek(new Date(), { weekStartsOn: 1 }), "MMM d, yyyy")}
        </p>
      </div>

      {/* Week Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Week Progress</span>
            <span className="text-sm text-muted-foreground">{weekProgress}%</span>
          </div>
          <Progress value={weekProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {7 - new Date().getDay()} days remaining this week
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {completionChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
              )}
              {completionChange >= 0 ? "+" : ""}{completionChange}% vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Tracked</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(stats.timeTrackedMinutes / 60)}h {stats.timeTrackedMinutes % 60}m
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {timeChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />
              )}
              {timeChange >= 0 ? "+" : ""}{timeChange}% vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak} days</div>
            <p className="text-xs text-muted-foreground">
              {stats.streak >= 7 ? "🔥 On fire!" : "Keep it up!"}
            </p>
          </CardContent>
        </Card>

        <Card className={stats.overdueCount > 0 ? "border-red-500/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdueCount > 0 ? "text-red-500" : ""}`}>
              {stats.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueCount > 0 ? "Needs attention" : "All caught up! 🎉"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Deadlines
          </CardTitle>
          <CardDescription>Tasks due in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.upcomingDeadlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming deadlines. Nice! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <Link
                  key={task.id}
                  href={`/board/${task.boardId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {task.priority === "p1" && (
                      <Badge variant="destructive" className="text-xs">P1</Badge>
                    )}
                    {task.priority === "p2" && (
                      <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">P2</Badge>
                    )}
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {task.dueDate && differenceInDays(task.dueDate, new Date()) === 0
                        ? "Today"
                        : task.dueDate && differenceInDays(task.dueDate, new Date()) === 1
                        ? "Tomorrow"
                        : task.dueDate
                        ? format(task.dueDate, "EEE, MMM d")
                        : ""}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            This Week&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl font-bold">{stats.activitiesThisWeek}</div>
            <p className="text-muted-foreground">total actions this week</p>
            <p className="text-sm text-muted-foreground mt-2">
              Including task updates, moves, and completions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Motivation */}
      {stats.streak >= 3 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <CardContent className="flex items-center gap-4 py-6">
            <Award className="h-12 w-12 text-amber-500" />
            <div>
              <h3 className="font-semibold text-lg">
                {stats.streak >= 7 ? "You're on fire! 🔥" : "Great momentum! 💪"}
              </h3>
              <p className="text-muted-foreground">
                {stats.streak} day streak! Keep up the amazing work.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
