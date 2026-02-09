"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Mic, MicOff, Sparkles, Loader2, Calendar, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { parseNaturalLanguageTask } from "@/lib/task-parser";
import { format } from "date-fns";

interface Board {
  id: string;
  name: string;
  columns: {
    id: string;
    name: string;
    position: number;
  }[];
}

interface QuickCaptureProps {
  boards: Board[];
}

type SpeechRecognitionResult = {
  transcript: string;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<SpeechRecognitionResult>>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function QuickCapture({ boards }: QuickCaptureProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");
  const [priority, setPriority] = useState<string>("none");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [suggestedPriority, setSuggestedPriority] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [parsedLabels, setParsedLabels] = useState<string[]>([]);
  const router = useRouter();

  // Parse natural language as user types
  const parsedTask = useMemo(() => {
    if (!title.trim()) return null;
    return parseNaturalLanguageTask(title);
  }, [title]);

  // Apply parsed values
  useEffect(() => {
    if (parsedTask) {
      if (parsedTask.priority && !suggestedPriority) {
        setPriority(parsedTask.priority);
      }
      if (parsedTask.dueDate) {
        setDueDate(parsedTask.dueDate);
      }
      if (parsedTask.estimatedTime) {
        setEstimatedTime(parsedTask.estimatedTime);
      }
      if (parsedTask.labels.length > 0) {
        setParsedLabels(parsedTask.labels);
      }
    }
  }, [parsedTask, suggestedPriority]);

  // Keyboard shortcut: Q to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.key.toLowerCase() === "q" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-select last-used board/column (context-aware)
  useEffect(() => {
    if (!open || boards.length === 0) return;
    const lastBoardId = typeof window !== "undefined"
      ? localStorage.getItem("taskflow:lastBoardId")
      : null;
    const lastColumnId = typeof window !== "undefined"
      ? localStorage.getItem("taskflow:lastColumnId")
      : null;

    const board = boards.find(b => b.id === lastBoardId) || boards[0];
    setSelectedBoardId(board.id);

    const preferredColumn = board.columns.find(c => c.id === lastColumnId)
      || board.columns.sort((a, b) => a.position - b.position)[0];
    if (preferredColumn) {
      setSelectedColumnId(preferredColumn.id);
    }
  }, [open, boards]);

  // Update column when board changes
  useEffect(() => {
    if (selectedBoardId) {
      const board = boards.find(b => b.id === selectedBoardId);
      if (board && board.columns.length > 0) {
        const lastColumnId = typeof window !== "undefined"
          ? localStorage.getItem("taskflow:lastColumnId")
          : null;
        const preferredColumn = board.columns.find(c => c.id === lastColumnId)
          || board.columns.sort((a, b) => a.position - b.position)[0];
        if (preferredColumn) {
          setSelectedColumnId(preferredColumn.id);
        }
      }
    }
  }, [selectedBoardId, boards]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedBoardId) {
      localStorage.setItem("taskflow:lastBoardId", selectedBoardId);
    }
  }, [selectedBoardId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedColumnId) {
      localStorage.setItem("taskflow:lastColumnId", selectedColumnId);
    }
  }, [selectedColumnId]);

  const selectedBoard = boards.find(b => b.id === selectedBoardId);

  // Voice input
  const startListening = useCallback(() => {
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognitionCtor =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Voice input is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (!transcript) return;
      setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.start();
  }, []);

  // AI priority suggestion
  const suggestPriority = useCallback(async () => {
    if (!title.trim()) return;
    
    setAiSuggesting(true);
    try {
      const response = await fetch("/api/ai/suggest-priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestedPriority(data.priority);
        setPriority(data.priority);
      }
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
    } finally {
      setAiSuggesting(false);
    }
  }, [title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedColumnId) return;

    setLoading(true);
    try {
      // Use parsed title (without the date/priority/label markers)
      const taskTitle = parsedTask?.title || title.trim();
      
      const response = await fetch("/api/quick-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          columnId: selectedColumnId,
          priority,
          dueDate: dueDate?.toISOString(),
          estimatedTime,
          labels: parsedLabels,
        }),
      });

      if (response.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("taskflow:lastBoardId", selectedBoardId);
          localStorage.setItem("taskflow:lastColumnId", selectedColumnId);
        }
        setTitle("");
        setPriority("none");
        setSuggestedPriority(null);
        setDueDate(null);
        setEstimatedTime(null);
        setParsedLabels([]);
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: "none", label: "No Priority", color: "" },
    { value: "p1", label: "P1 - Urgent", color: "text-red-500" },
    { value: "p2", label: "P2 - High", color: "text-orange-500" },
    { value: "p3", label: "P3 - Medium", color: "text-yellow-500" },
    { value: "p4", label: "P4 - Low", color: "text-blue-500" },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Quick Capture Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Capture
              <Badge variant="secondary" className="text-xs">
                Press Q
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Input with Voice */}
            <div className="relative">
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="pr-20"
                autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={startListening}
                  disabled={isListening}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={suggestPriority}
                  disabled={aiSuggesting || !title.trim()}
                >
                  {aiSuggesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Board & Column Selection */}
            <div className="grid grid-cols-2 gap-3">
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {selectedBoard?.columns
                    .sort((a, b) => a.position - b.position)
                    .map((column) => (
                      <SelectItem key={column.id} value={column.id}>
                        {column.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Selection */}
            <div className="flex items-center gap-2">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {suggestedPriority && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI suggested
                </Badge>
              )}
            </div>

            {/* Parsed info badges */}
            {(dueDate || estimatedTime || parsedLabels.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {dueDate && (
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(dueDate, "MMM d")}
                  </Badge>
                )}
                {estimatedTime && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {estimatedTime >= 60 ? `${Math.floor(estimatedTime / 60)}h` : `${estimatedTime}m`}
                  </Badge>
                )}
                {parsedLabels.map(label => (
                  <Badge key={label} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Syntax help */}
            <p className="text-xs text-muted-foreground">
              💡 Try: &quot;Fix bug p1 tomorrow #backend&quot; or &quot;Write blog post 2h friday #content&quot;
            </p>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim() || !selectedColumnId}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
