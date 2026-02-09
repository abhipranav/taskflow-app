"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sun,
  Target,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Flame,
  Sparkles,
  Flag,
} from "lucide-react";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import Link from "next/link";

interface FocusTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string | null;
  boardId: string;
  boardName: string;
  columnName: string;
  isCompleted: boolean;
}

interface FocusTaskApi extends Omit<FocusTask, "dueDate"> {
  dueDate: string | null;
}

interface TodayStats {
  totalToday: number;
  completedToday: number;
  overdue: number;
  upcoming: number;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<FocusTask[]>([]);
  const [stats, setStats] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  async function fetchTodayTasks() {
    try {
      const response = await fetch("/api/today");
      const data: { tasks: FocusTaskApi[]; stats: TodayStats } = await response.json();
      const parsedTasks: FocusTask[] = data.tasks.map((task) => ({
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      }));
      setTasks(parsedTasks);
      setStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch today's tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteTask(taskId: string, completed: boolean) {
    setCompletingTask(taskId);
    try {
      await fetch(`/api/today/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, isCompleted: completed } : t
      ));
      
      if (stats) {
        setStats({
          ...stats,
          completedToday: completed 
            ? stats.completedToday + 1 
            : stats.completedToday - 1,
        });
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
    } finally {
      setCompletingTask(null);
    }
  }

  const priorityColors: Record<string, string> = {
    p1: "text-red-500 bg-red-500/10",
    p2: "text-orange-500 bg-orange-500/10",
    p3: "text-yellow-500 bg-yellow-500/10",
    p4: "text-blue-500 bg-blue-500/10",
  };

  const priorityLabels: Record<string, string> = {
    p1: "Urgent",
    p2: "High",
    p3: "Medium",
    p4: "Low",
  };

  const getTimeLabel = (date: Date | null) => {
    if (!date) return null;
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return "Overdue";
    return format(date, "MMM d");
  };

  const overdueTasks = tasks.filter(t => t.dueDate && isPast(t.dueDate) && !isToday(t.dueDate) && !t.isCompleted);
  const todayTasks = tasks.filter(t => t.dueDate && isToday(t.dueDate) && !t.isCompleted);
  const upcomingTasks = tasks.filter(t => t.dueDate && !isPast(t.dueDate) && !isToday(t.dueDate) && !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);
  const noDueDateTasks = tasks.filter(t => !t.dueDate && !t.isCompleted);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
          <Sun className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{greeting()}</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")} • Focus on what matters today
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{stats.totalToday}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className={`${stats.overdue > 0 ? "border-red-500/20 bg-red-500/5" : ""}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className={`text-2xl font-bold ${stats.overdue > 0 ? "text-red-500" : ""}`}>
                    {stats.overdue}
                  </p>
                </div>
                <AlertCircle className={`h-8 w-8 ${stats.overdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.upcoming}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Focus Section */}
      <div className="space-y-4">
        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <Card className="border-red-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                <CardTitle className="text-red-500">Overdue</CardTitle>
                <Badge variant="destructive" className="ml-auto">
                  {overdueTasks.length}
                </Badge>
              </div>
              <CardDescription>
                These tasks need your immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdueTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  completing={completingTask === task.id}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  getTimeLabel={getTimeLabel}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Today&apos;s Focus</CardTitle>
              {todayTasks.length > 0 && (
                <Badge className="ml-auto">{todayTasks.length}</Badge>
              )}
            </div>
            <CardDescription>
              Tasks scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  No tasks due today. You&apos;re all caught up!
                </p>
              </div>
            ) : (
              todayTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  completing={completingTask === task.id}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  getTimeLabel={getTimeLabel}
                />
              ))
            )}
          </CardContent>
        </Card>

        {/* High Priority with no date */}
        {noDueDateTasks.filter(t => t.priority === "p1" || t.priority === "p2").length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-orange-500" />
                <CardTitle>High Priority</CardTitle>
              </div>
              <CardDescription>
                Important tasks without a due date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {noDueDateTasks
                .filter(t => t.priority === "p1" || t.priority === "p2")
                .map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    completing={completingTask === task.id}
                    priorityColors={priorityColors}
                    priorityLabels={priorityLabels}
                    getTimeLabel={getTimeLabel}
                  />
                ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Coming Up</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {upcomingTasks.length}
                </Badge>
              </div>
              <CardDescription>
                Tasks due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcomingTasks.slice(0, 5).map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  completing={completingTask === task.id}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  getTimeLabel={getTimeLabel}
                />
              ))}
              {upcomingTasks.length > 5 && (
                <Button variant="ghost" className="w-full mt-2">
                  View {upcomingTasks.length - 5} more
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Completed Today */}
        {completedTasks.length > 0 && (
          <Card className="opacity-75">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <CardTitle>Completed</CardTitle>
                <Badge variant="secondary" className="ml-auto">
                  {completedTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {completedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                  completing={completingTask === task.id}
                  priorityColors={priorityColors}
                  priorityLabels={priorityLabels}
                  getTimeLabel={getTimeLabel}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onComplete,
  completing,
  priorityColors,
  priorityLabels,
  getTimeLabel,
}: {
  task: FocusTask;
  onComplete: (id: string, completed: boolean) => void;
  completing: boolean;
  priorityColors: Record<string, string>;
  priorityLabels: Record<string, string>;
  getTimeLabel: (date: Date | null) => string | null;
}) {
  const timeLabel = getTimeLabel(task.dueDate);
  const isOverdue = task.dueDate && isPast(task.dueDate) && !isToday(task.dueDate);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:bg-muted/50 ${task.isCompleted ? "opacity-60" : ""}`}>
      <Checkbox
        checked={task.isCompleted}
        disabled={completing}
        onCheckedChange={(checked) => onComplete(task.id, !!checked)}
        className="h-5 w-5"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-medium truncate ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          {task.priority && task.priority !== "none" && (
            <Badge variant="secondary" className={priorityColors[task.priority]}>
              {priorityLabels[task.priority]}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link 
            href={`/board/${task.boardId}`} 
            className="hover:text-foreground hover:underline"
          >
            {task.boardName}
          </Link>
          <span>•</span>
          <span>{task.columnName}</span>
          {timeLabel && (
            <>
              <span>•</span>
              <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                {timeLabel}
              </span>
            </>
          )}
        </div>
      </div>
      
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/board/${task.boardId}?card=${task.id}`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
