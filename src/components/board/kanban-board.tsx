"use client";

import React, { useState, useId, useTransition, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { ListView } from "./list-view";
import { CardModal } from "@/components/modals/card-modal";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { updateBoardBackground } from "@/app/actions/boards";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { getBoardActivity, ActivityLog as ActivityLogType } from "@/app/actions/activity";
import { ActivityLog } from "@/components/activity-log";
import { Plus, Palette, History } from "lucide-react";
import { createColumn, reorderColumns, deleteColumn, updateColumnName } from "@/app/actions/columns";
import { createCard, moveCard, reorderCards, restoreCard } from "@/app/actions/cards";
import { smoothScrollToElement } from "@/lib/scroll";

// Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  columnTitle?: string;
  labels: { id: string; name: string; color: string }[];
  assignee?: string;
  dueDate?: string;
  priority?: string;
  estimatedTime?: number | null;
}

export interface ColumnType {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

interface BoardMember {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface KanbanBoardProps {
  boardId: string;
  boardName: string;
  initialColumns: ColumnType[];
  availableLabels: Label[];
  boardMembers?: BoardMember[];
  boardBackground?: string | null;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function KanbanBoard({ boardId, boardName, initialColumns, availableLabels, boardMembers = [], boardBackground, user }: KanbanBoardProps) {
  const dndId = useId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [columns, setColumns] = useState<ColumnType[]>(initialColumns);
  const [labels, setLabels] = useState<Label[]>(availableLabels);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnType | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [undoCardId, setUndoCardId] = useState<string | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modalOrigin, setModalOrigin] = useState<{ x: number; y: number } | null>(null);
  
  // Search and view state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  // Per-board preferences (view mode + last board context)
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("taskflow:lastBoardId", boardId);
    const stored = localStorage.getItem(`taskflow:boardPrefs:${boardId}`);
    if (stored) {
      try {
        const prefs = JSON.parse(stored);
        if (prefs.viewMode === "kanban" || prefs.viewMode === "list") {
          setViewMode(prefs.viewMode);
        }
      } catch {
        // ignore malformed prefs
      }
    }
  }, [boardId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefs = { viewMode };
    localStorage.setItem(`taskflow:boardPrefs:${boardId}`, JSON.stringify(prefs));
  }, [boardId, viewMode]);
  
  // Background state
  const [background, setBackground] = useState(boardBackground || "");
  const [isBackgroundPickerOpen, setIsBackgroundPickerOpen] = useState(false);
  
  // Activity state
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityLogType[]>([]);
  
  const BACKGROUND_COLORS = [
    "", // Clear/default (uses app background)
    "#f8fafc", // subtle gray
    "#f1f5f9", // cool slate
    "#e2e8f0", // soft slate
    "#e0f2fe", // soft sky blue
    "#dbeafe", // light blue  
    "#e0e7ff", // soft indigo
    "#ede9fe", // light lavender
    "#fae8ff", // soft pink
    "#fce7f3", // light rose
    "#ecfccb", // soft lime
    "#d1fae5", // mint green
    "#ccfbf1", // light teal
    "#fef3c7", // soft amber
    "#f5f5f4", // warm gray
    "#0f172a", // deep slate
    "#111827", // deep gray
    "#1e293b", // slate
    "#0b1120", // midnight
    "#1f2937", // graphite
  ];

  async function handleBackgroundChange(color: string) {
    setBackground(color);
    setIsBackgroundPickerOpen(false);
    await updateBoardBackground(boardId, color);
  }

  async function handleSignOut() {
    const { signOut } = await import("next-auth/react");
    signOut({ callbackUrl: "/login" });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter columns based on search query
  const filteredColumns = columns.map(col => ({
    ...col,
    tasks: col.tasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  function findColumn(id: string) {
    const column = columns.find((col) => col.id === id);
    if (column) return column;

    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === id);
      if (task) return col;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const activeId = active.id as string;

    const column = columns.find((col) => col.id === activeId);
    if (column) {
      setActiveColumn(column);
      return;
    }

    for (const col of columns) {
      const task = col.tasks.find((t) => t.id === activeId);
      if (task) {
        setActiveTask(task);
        return;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
      return;
    }

    if (activeTask) {
      setColumns((cols) => {
        const activeColumnIndex = cols.findIndex((col) => col.id === activeColumn.id);
        const overColumnIndex = cols.findIndex((col) => col.id === overColumn.id);

        const activeTaskIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
        
        const newActiveColumn = {
          ...activeColumn,
          tasks: activeColumn.tasks.filter((t) => t.id !== activeId),
        };

        const taskToMove = { 
          ...activeColumn.tasks[activeTaskIndex], 
          columnId: overColumn.id,
          columnTitle: overColumn.title,
        };
        const newOverColumn = {
          ...overColumn,
          tasks: [...overColumn.tasks, taskToMove],
        };

        const newColumns = [...cols];
        newColumns[activeColumnIndex] = newActiveColumn;
        newColumns[overColumnIndex] = newOverColumn;

        return newColumns;
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      setActiveColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle column reordering
    if (activeColumn) {
      const activeIndex = columns.findIndex((col) => col.id === activeId);
      const overIndex = columns.findIndex((col) => col.id === overId);

      if (activeIndex !== overIndex) {
        const newColumns = arrayMove(columns, activeIndex, overIndex);
        setColumns(newColumns);
        
        startTransition(() => {
          reorderColumns(newColumns.map(c => c.id));
        });
      }
    }

    // Handle task reordering/moving
    if (activeTask) {
      const column = findColumn(activeId);
      if (column) {
        const activeIndex = column.tasks.findIndex((t) => t.id === activeId);
        const overIndex = column.tasks.findIndex((t) => t.id === overId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          setColumns((cols) =>
            cols.map((col) => {
              if (col.id === column.id) {
                const newTasks = arrayMove(col.tasks, activeIndex, overIndex);
                
                startTransition(() => {
                  reorderCards(col.id, newTasks.map(t => t.id));
                });
                
                return { ...col, tasks: newTasks };
              }
              return col;
            })
          );
        }
      }

      // Check if task moved to a different column
      const newColumn = findColumn(activeId);
      if (newColumn && activeTask.columnId !== newColumn.id) {
        const position = newColumn.tasks.findIndex(t => t.id === activeId);
        startTransition(() => {
          moveCard(activeId, newColumn.id, position);
        });
      }
    }

    setActiveTask(null);
    setActiveColumn(null);
  }

  function handleCardClick(task: Task) {
    const column = columns.find(col => col.id === task.columnId);
    if (typeof window !== "undefined") {
      const el = document.getElementById(`task-${task.id}`);
      const rect = el?.getBoundingClientRect();
      setModalOrigin(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      localStorage.setItem("taskflow:lastBoardId", boardId);
      localStorage.setItem("taskflow:lastColumnId", task.columnId);
    }
    setSelectedTask({
      ...task,
      columnTitle: task.columnTitle || column?.title,
    });
    setIsModalOpen(true);
  }

  function handleJumpToCard(taskId: string) {
    const el = document.getElementById(`task-${taskId}`);
    if (!el) return;
    smoothScrollToElement(el, { block: "center" });
    setHighlightedTaskId(taskId);
    setTimeout(() => setHighlightedTaskId(null), 1200);
  }

  // Track if we've already processed the card param to prevent double execution
  const processedCardRef = useRef<string | null>(null);
  const mountedRef = useRef(false);
  
  // Get card ID from URL - needs to be reactive
  const cardIdFromUrl = searchParams.get("card");

  // Mark component as mounted
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  // Handle card URL parameter - instant modal + short context cue
  useEffect(() => {
    let highlightTimeout: ReturnType<typeof setTimeout> | null = null;
    let replaceTimeout: ReturnType<typeof setTimeout> | null = null;

    const initTimeout = setTimeout(() => {
      if (!mountedRef.current) return;

      // Skip if no card param or already processed this card
      if (!cardIdFromUrl || processedCardRef.current === cardIdFromUrl) {
        return;
      }

      // Find the task across all columns (use initialColumns as fallback)
      let foundTask: Task | null = null;
      let foundColumnTitle: string | undefined;
      const searchColumns = columns.length > 0 ? columns : initialColumns;
      
      for (const col of searchColumns) {
        const task = col.tasks.find(t => t.id === cardIdFromUrl);
        if (task) {
          foundTask = task;
          foundColumnTitle = col.title;
          break;
        }
      }

      if (!foundTask) {
        return;
      }

      // Mark as processed
      processedCardRef.current = cardIdFromUrl;

      const taskWithContext = {
        ...foundTask,
        columnTitle: foundTask.columnTitle || foundColumnTitle,
      };

      if (typeof window !== "undefined") {
        const el = document.getElementById(`task-${cardIdFromUrl}`);
        const rect = el?.getBoundingClientRect();
        setModalOrigin(rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      }

      // Instant modal open for speed
      setSelectedTask(taskWithContext);
      setIsModalOpen(true);

      // Short highlight cue for context
      setHighlightedTaskId(cardIdFromUrl);

      // Scroll into view without delaying modal
      requestAnimationFrame(() => {
        if (!mountedRef.current) return;
        const el = document.getElementById(`task-${cardIdFromUrl}`);
        if (el) {
          smoothScrollToElement(el, { block: "center" });
        }
      });

      highlightTimeout = setTimeout(() => {
        if (!mountedRef.current) return;
        setHighlightedTaskId(null);
      }, 1200);

      replaceTimeout = setTimeout(() => {
        if (!mountedRef.current) return;
        router.replace(`/board/${boardId}`, { scroll: false });
      }, 400);
    }, 50);

    return () => {
      clearTimeout(initTimeout);
      if (highlightTimeout) clearTimeout(highlightTimeout);
      if (replaceTimeout) clearTimeout(replaceTimeout);
    };
  }, [cardIdFromUrl, columns, initialColumns, boardId, router]);

  function handleModalClose() {
    setIsModalOpen(false);
    setSelectedTask(null);
    setHighlightedTaskId(null);
    setModalOrigin(null);
    // Reset processed ref so same card can be opened again
    processedCardRef.current = null;
    // Clear the card param from URL
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("card")) {
      params.delete("card");
      router.replace(`/board/${boardId}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    }
  }

  function handleTaskDelete(taskId: string) {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    setUndoCardId(taskId);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoCardId(null);
    }, 5000);
  }

  function handleTaskUpdate(taskId: string, data: Partial<Task>) {
    setColumns((cols) =>
      cols.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === taskId ? { ...t, ...data } : t
        ),
      }))
    );
    // Update the selected task as well
    if (selectedTask?.id === taskId) {
      setSelectedTask({ ...selectedTask, ...data });
    }
  }

  function handleListCardMove(taskId: string, toColumnId: string) {
    const targetColumn = columns.find(col => col.id === toColumnId);
    const targetTitle = targetColumn?.title;
    const targetPosition = targetColumn ? targetColumn.tasks.length : 0;

    setColumns((cols) => {
      let movedTask: Task | null = null;
      const withoutTask = cols.map(col => {
        const taskIndex = col.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          movedTask = col.tasks[taskIndex];
          return {
            ...col,
            tasks: col.tasks.filter(t => t.id !== taskId),
          };
        }
        return col;
      });

      if (!movedTask) return cols;

      return withoutTask.map(col => {
        if (col.id === toColumnId) {
          return {
            ...col,
            tasks: [
              ...col.tasks,
              { ...movedTask!, columnId: toColumnId, columnTitle: targetTitle || col.title },
            ],
          };
        }
        return col;
      });
    });

    startTransition(() => {
      moveCard(taskId, toColumnId, targetPosition);
    });

    if (selectedTask?.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        columnId: toColumnId,
        columnTitle: targetTitle || selectedTask.columnTitle,
      });
    }
  }

  async function handleUndoArchive() {
    if (!undoCardId) return;
    await restoreCard(undoCardId);
    setUndoCardId(null);
    router.refresh();
  }

  async function handleAddColumn() {
    const newColumnId = crypto.randomUUID();
    const newColumn: ColumnType = {
      id: newColumnId,
      title: "New Column",
      tasks: [],
    };
    setColumns([...columns, newColumn]);
    
    startTransition(async () => {
      await createColumn(boardId, "New Column");
    });
  }

  async function handleAddTask(columnId: string, title: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem("taskflow:lastBoardId", boardId);
      localStorage.setItem("taskflow:lastColumnId", columnId);
    }
    const newTaskId = crypto.randomUUID();
    const newTask: Task = {
      id: newTaskId,
      title,
      columnId,
      columnTitle: columns.find(col => col.id === columnId)?.title,
      labels: [],
    };
    
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === columnId) {
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      })
    );

    startTransition(async () => {
      await createCard(columnId, title);
    });
  }

  function handleUpdateColumnTitle(columnId: string, title: string) {
    setColumns((cols) =>
      cols.map((col) => {
        if (col.id === columnId) {
          return { 
            ...col, 
            title,
            tasks: col.tasks.map(task => ({ ...task, columnTitle: title })),
          };
        }
        return col;
      })
    );

    startTransition(() => {
      updateColumnName(columnId, title);
    });
  }

  function handleDeleteColumn(columnId: string) {
    setColumns((cols) => cols.filter((col) => col.id !== columnId));
    
    startTransition(() => {
      deleteColumn(columnId);
    });
  }

  return (
    <div 
      className="flex min-h-screen flex-col transition-colors"
      style={{ backgroundColor: background || undefined }}
    >
      <Header 
        boardName={boardName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        user={user}
        onSignOut={handleSignOut}
      />
      
      {/* Board Actions Bar */}
      <div className="px-6 pt-4 flex items-center gap-2">
        <Popover open={isBackgroundPickerOpen} onOpenChange={setIsBackgroundPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Palette className="h-4 w-4 mr-1" />
              Background
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-2">
              <p className="text-sm font-medium">Board Background</p>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_COLORS.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => handleBackgroundChange(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      background === color ? "ring-2 ring-primary ring-offset-2" : ""
                    } ${!color ? "bg-background border-dashed" : ""}`}
                    style={{ backgroundColor: color || undefined }}
                    title={color ? color : "Default"}
                  >
                    {!color && <span className="text-xs text-muted-foreground">✕</span>}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Sheet open={isActivityOpen} onOpenChange={(open) => {
          setIsActivityOpen(open);
          if (open) {
            getBoardActivity(boardId).then(setActivities);
          }
        }}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <History className="h-4 w-4 mr-1" />
              Activity
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Board Activity</SheetTitle>
              <SheetDescription>Recent activity on this board</SheetDescription>
            </SheetHeader>
            <ActivityLog items={activities} />
          </SheetContent>
        </Sheet>
      </div>
      
      <main className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <div className="h-full overflow-x-auto p-4 md:p-6 snap-x snap-mandatory">
            <DndContext
              id={dndId}
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4">
                <SortableContext
                  items={columns.map((col) => col.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {filteredColumns.map((column) => (
                    <Column
                      key={column.id}
                      column={column}
                      onAddTask={handleAddTask}
                      onUpdateTitle={handleUpdateColumnTitle}
                      onDelete={handleDeleteColumn}
                      onCardClick={handleCardClick}
                      highlightedTaskId={highlightedTaskId}
                    />
                  ))}
                </SortableContext>

                <Button
                  variant="outline"
                  className="h-auto min-h-[200px] w-[280px] shrink-0 border-dashed"
                  onClick={handleAddColumn}
                  disabled={isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Column
                </Button>
              </div>

              <DragOverlay>
                {activeTask ? (
                  <TaskCard task={activeTask} isDragging />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <ListView
            columns={columns}
            onCardClick={handleCardClick}
            onCardUpdate={handleTaskUpdate}
            onCardMove={handleListCardMove}
            searchQuery={searchQuery}
            highlightedTaskId={highlightedTaskId}
          />
        )}
      </main>

      {undoCardId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full border bg-background/95 shadow-lg backdrop-blur px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Task archived</span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleUndoArchive}>
            Undo
          </Button>
        </div>
      )}

      <CardModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        availableLabels={labels}
        onDelete={handleTaskDelete}
        onUpdate={handleTaskUpdate}
        boardId={boardId}
        boardName={boardName}
        onJumpToCard={handleJumpToCard}
        origin={modalOrigin}
        onLabelCreated={(label) => setLabels(prev => [...prev, label])}
        boardMembers={boardMembers}
        currentUser={user ? { id: user.id || "", name: user.name, image: user.image } : undefined}
      />
    </div>
  );
}
