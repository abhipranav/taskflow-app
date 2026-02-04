"use client";

import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User, AlertCircle, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "./kanban-board";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  onSelect?: (taskId: string, e: React.MouseEvent) => void;
  isHighlighted?: boolean;
}

// Calculate due date status
function getDueDateStatus(dueDate: string | undefined) {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: "overdue", label: `${Math.abs(diffDays)}d overdue`, color: "bg-red-500/20 text-red-600 dark:text-red-400" };
  } else if (diffDays === 0) {
    return { status: "today", label: "Due today", color: "bg-amber-500/20 text-amber-600 dark:text-amber-400" };
  } else if (diffDays <= 3) {
    return { status: "soon", label: `${diffDays}d left`, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" };
  } else if (diffDays <= 7) {
    return { status: "week", label: `${diffDays}d left`, color: "bg-slate-500/20 text-slate-600 dark:text-slate-400" };
  }
  return { status: "future", label: dueDate, color: "bg-muted text-muted-foreground" };
}

// Priority indicator colors
const PRIORITY_COLORS: Record<string, string> = {
  p1: "border-l-red-500",
  p2: "border-l-orange-500",
  p3: "border-l-yellow-500",
  p4: "border-l-blue-500",
};

function TaskCardComponent({ task, isDragging, onClick, isSelected, onSelect, isHighlighted }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  const dragging = isDragging || isSortableDragging;
  const dueDateStatus = useMemo(() => getDueDateStatus(task.dueDate), [task.dueDate]);
  const priorityClass = task.priority && task.priority !== "none" ? PRIORITY_COLORS[task.priority] : "";

  function handleClick(e: React.MouseEvent) {
    // Handle multi-select with shift/cmd
    if (onSelect && (e.shiftKey || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      onSelect(task.id, e);
      return;
    }
    if (!dragging && onClick) {
      onClick();
    }
  }

  return (
    <div
      id={`task-${task.id}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        "cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md border-l-4",
        dragging && "rotate-2 scale-105 shadow-lg ring-2 ring-primary",
        dueDateStatus?.status === "overdue" && "border-red-500/50",
        isSelected && "ring-2 ring-primary bg-primary/5",
        isHighlighted && "animate-highlight-pulse ring-2 ring-primary shadow-lg shadow-primary/25",
        priorityClass || "border-l-transparent"
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium">{task.title}</h4>

      {/* Description preview */}
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {task.description}
        </p>
      )}

      {/* Footer */}
      {(task.assignee || task.dueDate) && (
        <div className="mt-3 flex items-center justify-between gap-2">
          {/* Due date badge */}
          {dueDateStatus && (
            <div className={cn(
              "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              dueDateStatus.color
            )}>
              {dueDateStatus.status === "overdue" ? (
                <AlertCircle className="h-3 w-3" />
              ) : dueDateStatus.status === "today" ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>{dueDateStatus.label}</span>
            </div>
          )}
          
          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1 ml-auto">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {task.assignee.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Priority indicator for P1 tasks */}
      {task.priority === "p1" && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
          <Flag className="h-3 w-3" />
          <span>High Priority</span>
        </div>
      )}
    </div>
  );
}

// Memoized export for performance
export const TaskCard = memo(TaskCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.description === nextProps.task.description &&
    prevProps.task.dueDate === nextProps.task.dueDate &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.assignee === nextProps.task.assignee &&
    prevProps.task.labels.length === nextProps.task.labels.length &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted
  );
});
