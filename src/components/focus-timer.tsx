"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Target, Volume2, VolumeX, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FocusTimerProps {
  onTimeLogged?: (seconds: number, taskId?: string) => void;
  currentTaskId?: string;
  currentTaskTitle?: string;
  triggerVariant?: "icon" | "compact";
}

type TimerMode = "focus" | "shortBreak" | "longBreak";

const TIMER_PRESETS = {
  focus: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

const CUSTOM_DURATIONS = [15, 25, 30, 45, 60, 90]; // minutes

export function FocusTimer({ onTimeLogged, currentTaskId, currentTaskTitle, triggerVariant = "compact" }: FocusTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customDuration, setCustomDuration] = useState(25);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleD43e7XYvrVmIhZGot7axH4zG0yg29/MjUEvLV6w4N7Uk0QtH1Wf29nPjkEtH1Wg29nOj0EsH1Sh29nOj0EsH1Sh29nOjkEsH1Wh29nOj0EsH1Sh29nOj0EtH1Sg29nPjkAtH1Sh29nOj0EsIFWh29nOj0EsH1ah29nOj0EsH1Wh29nOjkEsH1Wh29nPj0AsH1Sg29nPjkAtH1Wh29nOj0EsH1Wh29nOj0EsH1Wh29nOj0EsH1Wh29nOj0EsH1Wh29nOj0EsH1Wh29nPjkAtH1Wh29nOj0EsIFWh29nOj0EsH1Wh29nOj0EsH1Wh29nPj0AsH1Sg29nPjkAt");
  }, []);

  // Listen for keyboard shortcut
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    document.addEventListener("taskflow:toggle-focus-timer", handleToggle);
    return () => document.removeEventListener("taskflow:toggle-focus-timer", handleToggle);
  }, []);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    // Play sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(mode === "focus" ? "Focus session complete! 🎉" : "Break time over!", {
        body: mode === "focus" 
          ? `Great work! Take a ${sessionsCompleted % 4 === 3 ? "long" : "short"} break.`
          : "Ready to focus again?",
        icon: "/icon-192.png",
      });
    }

    if (mode === "focus") {
      // Log time if callback provided
      if (onTimeLogged && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        onTimeLogged(elapsed, currentTaskId);
      }
      
      setSessions(prev => prev + 1);
      
      // Auto switch to break
      if (sessionsCompleted % 4 === 3) {
        setMode("longBreak");
        setTimeLeft(TIMER_PRESETS.longBreak);
      } else {
        setMode("shortBreak");
        setTimeLeft(TIMER_PRESETS.shortBreak);
      }
    } else {
      // After break, switch to focus
      setMode("focus");
      setTimeLeft(customDuration * 60);
    }
  }, [mode, sessionsCompleted, soundEnabled, onTimeLogged, currentTaskId, customDuration]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        if (mode === "focus") {
          setTotalFocusTime(prev => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, handleTimerComplete]);

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    startTimeRef.current = null;
    setTimeLeft(mode === "focus" ? customDuration * 60 : TIMER_PRESETS[mode]);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    startTimeRef.current = null;
    if (newMode === "focus") {
      setTimeLeft(customDuration * 60);
    } else {
      setTimeLeft(TIMER_PRESETS[newMode]);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "focus" 
    ? ((customDuration * 60 - timeLeft) / (customDuration * 60)) * 100
    : ((TIMER_PRESETS[mode] - timeLeft) / TIMER_PRESETS[mode]) * 100;

  if (!isOpen) {
    const isIconOnly = triggerVariant === "icon";
    return (
      <Button
        variant="ghost"
        size={isIconOnly ? "icon" : "sm"}
        onClick={() => setIsOpen(true)}
        className={cn(
          isIconOnly ? "h-9 w-9" : "gap-2",
          isRunning && mode === "focus" && "text-green-500",
          isRunning && mode !== "focus" && "text-blue-500"
        )}
        aria-label={isRunning ? `Focus timer ${formatTime(timeLeft)}` : "Open focus timer"}
      >
        <Target className="h-4 w-4" />
        {!isIconOnly && isRunning && <span className="font-mono text-xs">{formatTime(timeLeft)}</span>}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-card border rounded-2xl shadow-2xl p-6 w-[320px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className={cn(
              "h-5 w-5",
              mode === "focus" ? "text-green-500" : "text-blue-500"
            )} />
            <span className="font-semibold">Focus Timer</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-4">
          <button
            onClick={() => switchMode("focus")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
              mode === "focus" ? "bg-background shadow text-green-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Focus
          </button>
          <button
            onClick={() => switchMode("shortBreak")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
              mode === "shortBreak" ? "bg-background shadow text-blue-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Short
          </button>
          <button
            onClick={() => switchMode("longBreak")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors",
              mode === "longBreak" ? "bg-background shadow text-blue-600" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Long
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-4">
          {/* Progress Ring */}
          <svg className="w-full h-40" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className={cn(
                "transition-all duration-1000",
                mode === "focus" ? "text-green-500" : "text-blue-500"
              )}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold">{formatTime(timeLeft)}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {mode === "focus" ? "Focus Time" : mode === "shortBreak" ? "Short Break" : "Long Break"}
            </span>
          </div>
        </div>

        {/* Duration Selector (Focus mode only) */}
        {mode === "focus" && !isRunning && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground">Duration:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1">
                  {customDuration} min
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {CUSTOM_DURATIONS.map(duration => (
                  <DropdownMenuItem
                    key={duration}
                    onClick={() => {
                      setCustomDuration(duration);
                      setTimeLeft(duration * 60);
                    }}
                  >
                    {duration} minutes
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Current Task */}
        {currentTaskTitle && (
          <div className="text-center mb-4 p-2 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground">Working on:</span>
            <p className="text-sm font-medium truncate">{currentTaskTitle}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            className={cn(
              "h-14 w-14 rounded-full",
              mode === "focus" 
                ? "bg-green-500 hover:bg-green-600" 
                : "bg-blue-500 hover:bg-blue-600"
            )}
            onClick={toggleTimer}
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => switchMode(mode === "focus" ? "shortBreak" : "focus")}
          >
            {mode === "focus" ? <Coffee className="h-4 w-4" /> : <Target className="h-4 w-4" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex justify-around mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold">{sessionsCompleted}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.floor(totalFocusTime / 60)}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
