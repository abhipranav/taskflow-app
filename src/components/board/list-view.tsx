"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckSquare, Flag } from "lucide-react";
import { updateCard } from "@/app/actions/cards";
import type { Task, ColumnType } from "./kanban-board";

interface ListViewProps {
  columns: ColumnType[];
  onCardClick: (task: Task) => void;
  onCardUpdate: (taskId: string, data: Partial<Task>) => void;
  onCardMove: (taskId: string, toColumnId: string) => void;
  searchQuery: string;
  highlightedTaskId?: string | null;
}

export function ListView({ columns, onCardClick, onCardUpdate, onCardMove, searchQuery, highlightedTaskId }: ListViewProps) {
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [editingDueId, setEditingDueId] = useState<string | null>(null);
  const [draftDue, setDraftDue] = useState("");

  const priorityOptions = [
    { value: "none", label: "None" },
    { value: "p1", label: "P1" },
    { value: "p2", label: "P2" },
    { value: "p3", label: "P3" },
    { value: "p4", label: "P4" },
  ];
  // Flatten all tasks with their column info and filter by search
  const allTasks = columns.flatMap(column => 
    column.tasks
      .filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(task => ({
        ...task,
        columnTitle: task.columnTitle || column.title,
      }))
  );

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No tasks found</p>
        <p className="text-sm">
          {searchQuery ? "Try a different search term" : "Create your first task"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-4">Task</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Labels</div>
          <div className="col-span-2">Due Date</div>
        </div>

        {/* Table Body */}
        <div className="divide-y">
          {allTasks.map((task) => (
            <div
              id={`task-${task.id}`}
              key={task.id}
              onClick={() => {
                if (editingTitleId || editingDueId) return;
                onCardClick(task);
              }}
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                task.id === highlightedTaskId && "animate-highlight-pulse bg-primary/10 ring-2 ring-primary ring-inset"
              )}
            >
              {/* Task Title & Description */}
              <div className="col-span-4">
                {editingTitleId === task.id ? (
                  <Input
                    value={draftTitle}
                    autoFocus
                    className="h-8 text-sm"
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={async () => {
                      if (draftTitle.trim() && draftTitle !== task.title) {
                        onCardUpdate(task.id, { title: draftTitle.trim() });
                        await updateCard(task.id, { title: draftTitle.trim() });
                      }
                      setEditingTitleId(null);
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        if (draftTitle.trim() && draftTitle !== task.title) {
                          onCardUpdate(task.id, { title: draftTitle.trim() });
                          await updateCard(task.id, { title: draftTitle.trim() });
                        }
                        setEditingTitleId(null);
                      }
                      if (e.key === "Escape") {
                        setEditingTitleId(null);
                      }
                    }}
                  />
                ) : (
                  <>
                    <p
                      className="font-medium truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(task.id);
                        setDraftTitle(task.title);
                      }}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Status (Column) */}
              <div className="col-span-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={task.columnId}
                  onValueChange={(value) => {
                    if (value !== task.columnId) {
                      onCardMove(task.id, value);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="col-span-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={task.priority || "none"}
                  onValueChange={async (value) => {
                    onCardUpdate(task.id, { priority: value });
                    await updateCard(task.id, { priority: value });
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.value !== "none" ? (
                          <span className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            {p.label}
                          </span>
                        ) : (
                          p.label
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Labels */}
              <div className="col-span-2 flex items-center gap-1 overflow-hidden">
                {task.labels.slice(0, 2).map((label) => (
                  <Badge
                    key={label.id}
                    style={{ backgroundColor: label.color }}
                    className="text-white text-xs"
                  >
                    {label.name}
                  </Badge>
                ))}
                {task.labels.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{task.labels.length - 2}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div className="col-span-2 flex items-center text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                {editingDueId === task.id ? (
                  <Input
                    type="date"
                    value={draftDue}
                    className="h-7 text-xs"
                    autoFocus
                    onChange={(e) => setDraftDue(e.target.value)}
                    onBlur={async () => {
                      const nextDue = draftDue ? new Date(draftDue) : null;
                      onCardUpdate(task.id, { dueDate: draftDue || undefined });
                      await updateCard(task.id, { dueDate: nextDue });
                      setEditingDueId(null);
                    }}
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setEditingDueId(task.id);
                      setDraftDue(task.dueDate || "");
                    }}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {task.dueDate || "—"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mt-4 text-center">
        Showing {allTasks.length} task{allTasks.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>
    </div>
  );
}
