"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import Link from "next/link";

interface CalendarTask {
  id: string;
  title: string;
  dueDate: Date;
  priority: string | null;
  boardId: string;
  boardName: string;
  columnName: string;
}

interface CalendarApiTask extends Omit<CalendarTask, "dueDate"> {
  dueDate: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const response = await fetch(
        `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data: { tasks: CalendarApiTask[] } = await response.json();
      setTasks(data.tasks.map((task) => ({ ...task, dueDate: new Date(task.dueDate) })));
    } catch (error) {
      console.error("Failed to fetch calendar tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter((task) => isSameDay(task.dueDate, day));
  };

  const priorityColors: Record<string, string> = {
    p1: "bg-red-500",
    p2: "bg-orange-500",
    p3: "bg-yellow-500",
    p4: "bg-blue-500",
    none: "bg-gray-400",
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <CalendarIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">
              View your tasks by due date
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="min-w-32"
            onClick={() => setCurrentDate(new Date())}
          >
            {format(currentDate, "MMMM yyyy")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {loading ? (
            <div className="grid grid-cols-7">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="min-h-28 p-2 border-b border-r">
                  <Skeleton className="h-6 w-6 rounded-full mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <div
                    key={idx}
                    className={`min-h-28 p-2 border-b border-r cursor-pointer transition-colors hover:bg-muted/50 ${
                      !isCurrentMonth ? "bg-muted/20" : ""
                    } ${isSelected ? "bg-primary/10" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-full text-sm ${
                          isToday(day)
                            ? "bg-primary text-primary-foreground font-bold"
                            : !isCurrentMonth
                            ? "text-muted-foreground"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                          {dayTasks.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <Link
                          key={task.id}
                          href={`/board/${task.boardId}?card=${task.id}`}
                          className="block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1 p-1 rounded text-xs hover:bg-muted truncate">
                            <div
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                priorityColors[task.priority || "none"]
                              }`}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-muted-foreground pl-3">
                          +{dayTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Detail */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getTasksForDay(selectedDate).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No tasks due on this day
              </p>
            ) : (
              <div className="space-y-2">
                {getTasksForDay(selectedDate).map((task) => (
                  <Link
                    key={task.id}
                    href={`/board/${task.boardId}?card=${task.id}`}
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div
                        className={`h-3 w-3 rounded-full shrink-0 ${
                          priorityColors[task.priority || "none"]
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.boardName} • {task.columnName}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
