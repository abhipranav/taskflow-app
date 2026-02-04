"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  Timer,
} from "lucide-react";
import {
  startTimeEntry,
  stopTimeEntry,
  logTimeEntry,
  deleteTimeEntry,
  getTimeEntriesForCard,
  getTotalTimeForCard,
} from "@/app/actions/time-tracking";

interface TimeEntry {
  id: string;
  duration: number;
  description: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date | null;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
}

interface TimeTrackingProps {
  cardId: string;
  estimatedTime?: number | null; // in minutes
}

export function TimeTracking({ cardId, estimatedTime }: TimeTrackingProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runningEntryId, setRunningEntryId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch time entries
  const fetchEntries = useCallback(async () => {
    const [entriesData, total] = await Promise.all([
      getTimeEntriesForCard(cardId),
      getTotalTimeForCard(cardId),
    ]);
    setEntries(entriesData as TimeEntry[]);
    setTotalTime(total);

    // Check if there's a running timer
    const running = entriesData.find(e => e.startedAt && !e.endedAt);
    if (running) {
      setIsRunning(true);
      setRunningEntryId(running.id);
      const startTime = new Date(running.startedAt!).getTime();
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }
  }, [cardId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartTimer = async () => {
    setLoading(true);
    try {
      const entryId = await startTimeEntry(cardId);
      setRunningEntryId(entryId);
      setIsRunning(true);
      setElapsedTime(0);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to start timer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTimer = async () => {
    if (!runningEntryId) return;
    setLoading(true);
    try {
      await stopTimeEntry(runningEntryId);
      setIsRunning(false);
      setRunningEntryId(null);
      setElapsedTime(0);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to stop timer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogManualTime = async () => {
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);

    if (totalSeconds <= 0) return;

    setLoading(true);
    try {
      await logTimeEntry(cardId, totalSeconds, manualDescription || undefined);
      setManualHours("");
      setManualMinutes("");
      setManualDescription("");
      setShowManualEntry(false);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to log time:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    setLoading(true);
    try {
      await deleteTimeEntry(entryId);
      await fetchEntries();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const progress = estimatedTime 
    ? Math.min((totalTime / (estimatedTime * 60)) * 100, 100) 
    : 0;

  return (
    <div className="space-y-3">
      {/* Timer Display */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          {isRunning ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-lg font-bold">
                {formatTime(elapsedTime)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Total: <strong className="text-foreground">{formatDuration(totalTime)}</strong>
              </span>
              {estimatedTime && (
                <span className="text-xs">
                  / {formatDuration(estimatedTime * 60)} estimated
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isRunning ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStopTimer}
              disabled={loading}
            >
              <Pause className="h-4 w-4 mr-1" />
              Stop
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={handleStartTimer}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}

          <Popover open={showManualEntry} onOpenChange={setShowManualEntry}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <p className="text-sm font-medium">Log Time Manually</p>
                <div className="flex gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      className="w-16"
                      min="0"
                    />
                    <span className="text-xs text-muted-foreground">hours</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      className="w-16"
                      min="0"
                      max="59"
                    />
                    <span className="text-xs text-muted-foreground">mins</span>
                  </div>
                </div>
                <Input
                  placeholder="Description (optional)"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleLogManualTime}
                  disabled={loading}
                >
                  Log Time
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress Bar (if estimate exists) */}
      {estimatedTime && (
        <div className="space-y-1">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress > 100 ? "bg-red-500" : progress > 80 ? "bg-yellow-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}% of estimated time used
          </p>
        </div>
      )}

      {/* Time Entries List */}
      {entries.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {entries.slice(0, 5).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50 group"
            >
              <div className="flex items-center gap-2">
                <Timer className="h-3 w-3 text-muted-foreground" />
                <span>{formatDuration(entry.duration)}</span>
                {entry.description && (
                  <span className="text-muted-foreground truncate max-w-32">
                    - {entry.description}
                  </span>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteEntry(entry.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {entries.length > 5 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              +{entries.length - 5} more entries
            </p>
          )}
        </div>
      )}
    </div>
  );
}
