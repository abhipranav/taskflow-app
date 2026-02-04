"use client";

import Link from "next/link";
import { Moon, Sun, Layout, Search, List, Columns, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notification-bell";
import { AIChatWrapper } from "@/components/ai-chat-wrapper";

interface HeaderProps {
  boardName?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  viewMode?: "kanban" | "list";
  onViewModeChange?: (mode: "kanban" | "list") => void;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  onSignOut?: () => void;
}

export function Header({ 
  boardName, 
  searchQuery = "", 
  onSearchChange,
  viewMode = "kanban",
  onViewModeChange,
  user,
  onSignOut,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        {/* Logo - Links to landing page */}
        <Link href="/welcome" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layout className="h-4 w-4" />
          </div>
          <span className="text-lg hidden sm:inline">TaskFlow</span>
        </Link>

        {/* Board Name */}
        {boardName && (
          <>
            <span className="text-muted-foreground hidden sm:inline">/</span>
            <span className="font-medium truncate max-w-[150px]">{boardName}</span>
          </>
        )}

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View Mode Toggle */}
        <div className="flex items-center border rounded-lg p-0.5">
          <Button
            variant={viewMode === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => onViewModeChange?.("kanban")}
          >
            <Columns className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Board</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => onViewModeChange?.("list")}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* AI Chat */}
        <AIChatWrapper userName={user?.name || undefined} />

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-2">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            {onSignOut && (
              <Button variant="ghost" size="icon" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign out</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
