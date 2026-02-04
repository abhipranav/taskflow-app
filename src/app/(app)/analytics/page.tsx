"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target,
  Calendar,
  Flame,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import Link from "next/link";

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  timeTracking: {
    totalTimeLogged: number;
    averageTimePerTask: number;
    mostTimeSpentBoard: string | null;
    weeklyTime: number[];
  };
  productivity: {
    tasksCompletedThisWeek: number;
    tasksCreatedThisWeek: number;
    currentStreak: number;
    bestStreak: number;
    dailyCompletions: { date: string; count: number }[];
  };
  boardStats: {
    id: string;
    name: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thisWeekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Track your productivity and progress
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/my-tasks">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-3xl font-bold">{data.overview.totalTasks}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Target className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold">{data.overview.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.overview.completionRate}% completion rate
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-3xl font-bold">{data.overview.inProgressTasks}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks?filter=overdue">
          <Card className={`transition-all hover:shadow-md cursor-pointer ${data.overview.overdueTasks > 0 ? "border-red-500/30 hover:border-red-500" : "hover:border-primary/50"}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className={`text-3xl font-bold ${data.overview.overdueTasks > 0 ? "text-red-500" : ""}`}>
                    {data.overview.overdueTasks}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${data.overview.overdueTasks > 0 ? "bg-red-500/10" : "bg-muted"}`}>
                  <Calendar className={`h-6 w-6 ${data.overview.overdueTasks > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Productivity & Time Tracking */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Tasks completed each day this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {thisWeekDays.map((day, i) => {
                const completion = data.productivity.dailyCompletions.find(
                  (d) => isSameDay(new Date(d.date), day)
                );
                const count = completion?.count || 0;
                const maxCount = Math.max(
                  ...data.productivity.dailyCompletions.map((d) => d.count),
                  1
                );
                const height = (count / maxCount) * 100;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative w-full flex justify-center">
                      <div
                        className={`w-8 rounded-t transition-all ${
                          isSameDay(day, today)
                            ? "bg-primary"
                            : count > 0
                            ? "bg-primary/60"
                            : "bg-muted"
                        }`}
                        style={{ height: `${Math.max(height, 8)}%` }}
                      />
                      {count > 0 && (
                        <span className="absolute -top-5 text-xs font-medium">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs ${isSameDay(day, today) ? "font-bold" : "text-muted-foreground"}`}>
                      {weekDays[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {data.productivity.currentStreak}
                  <span className="text-base">days</span>
                  {data.productivity.currentStreak > 0 && (
                    <Flame className="h-5 w-5 text-orange-500" />
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold flex items-center gap-1 justify-end">
                  {data.productivity.bestStreak}
                  <span className="text-base">days</span>
                  <Trophy className="h-5 w-5 text-yellow-500" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Time Tracking
            </CardTitle>
            <CardDescription>Time logged on tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">
                  {formatTime(data.timeTracking.totalTimeLogged)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg per Task</p>
                <p className="text-2xl font-bold">
                  {formatTime(data.timeTracking.averageTimePerTask)}
                </p>
              </div>
            </div>
            
            {data.timeTracking.mostTimeSpentBoard && (
              <div className="p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Most Active Board</p>
                <p className="font-medium">{data.timeTracking.mostTimeSpentBoard}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">This Week</p>
              <div className="flex gap-1">
                {data.timeTracking.weeklyTime.map((time, i) => (
                  <div
                    key={i}
                    className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                  >
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          (time / Math.max(...data.timeTracking.weeklyTime, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Board Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Board Performance</CardTitle>
          <CardDescription>Task completion rates by board</CardDescription>
        </CardHeader>
        <CardContent>
          {data.boardStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No boards with tasks yet
            </p>
          ) : (
            <div className="space-y-4">
              {data.boardStats.map((board) => (
                <Link key={board.id} href={`/board/${board.id}`}>
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{board.name}</p>
                        <Badge variant="secondary">
                          {board.completedTasks}/{board.totalTasks}
                        </Badge>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${board.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {board.completionRate}%
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
