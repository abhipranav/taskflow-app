"use client";

import * as React from "react";
import { useEffect, createContext, useContext, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["⌘", "B"], description: "Toggle sidebar" },
  { keys: ["⌘", "Z"], description: "Undo last action" },
  { keys: ["⌘", "⇧", "Z"], description: "Redo last action" },
  { keys: ["Q"], description: "Quick capture task" },
  { keys: ["N"], description: "New task in current column" },
  { keys: ["E"], description: "Edit selected task" },
  { keys: ["D"], description: "Delete selected task" },
  { keys: ["1-4"], description: "Set priority (P1-P4)" },
  { keys: ["F"], description: "Toggle focus timer" },
  { keys: ["T"], description: "Go to Today view" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modal / Cancel" },
];

// Undo/Redo system
type UndoAction = {
  type: "move" | "delete" | "update" | "create";
  cardId: string;
  columnId: string;
  previousState: unknown;
  newState: unknown;
  timestamp: number;
};

interface UndoContextType {
  pushUndo: (action: UndoAction) => void;
  undo: () => UndoAction | null;
  redo: () => UndoAction | null;
  canUndo: boolean;
  canRedo: boolean;
}

const UndoContext = createContext<UndoContextType | null>(null);

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error("useUndo must be used within KeyboardShortcutsProvider");
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  const [undoStack, setUndoStack] = React.useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = React.useState<UndoAction[]>([]);

  const pushUndo = useCallback((action: UndoAction) => {
    setUndoStack(prev => [...prev.slice(-49), action]); // Keep last 50
    setRedoStack([]); // Clear redo on new action
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return null;
    const action = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, action]);
    return action;
  }, [undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return null;
    const action = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, action]);
    return action;
  }, [redoStack]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || 
                      e.target instanceof HTMLTextAreaElement;
      const hasDialog = document.querySelector('[role="dialog"]');
      
      // Show help on ?
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInput) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Undo: Cmd+Z
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey && !isInput) {
        e.preventDefault();
        const action = undo();
        if (action) {
          document.dispatchEvent(new CustomEvent("taskflow:undo", { detail: action }));
        }
        return;
      }

      // Redo: Cmd+Shift+Z
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey && !isInput) {
        e.preventDefault();
        const action = redo();
        if (action) {
          document.dispatchEvent(new CustomEvent("taskflow:redo", { detail: action }));
        }
        return;
      }

      // Focus timer toggle: F
      if (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !isInput && !hasDialog) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("taskflow:toggle-focus-timer"));
        return;
      }

      // Priority shortcuts: 1-4
      if (["1", "2", "3", "4"].includes(e.key) && !e.metaKey && !e.ctrlKey && !isInput && !hasDialog) {
        document.dispatchEvent(new CustomEvent("taskflow:set-priority", { detail: `p${e.key}` }));
        return;
      }

      // Navigate to Today: T
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !isInput && !hasDialog) {
        window.location.href = "/today";
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const undoContext: UndoContextType = {
    pushUndo,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  };

  return (
    <UndoContext.Provider value={undoContext}>
      {children}
      
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Quick actions to navigate TaskFlow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, j) => (
                    <kbd
                      key={j}
                      className="inline-flex h-5 items-center justify-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </UndoContext.Provider>
  );
}
