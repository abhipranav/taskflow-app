"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Settings,
  CheckSquare,
  Layout,
  Search,
  Plus,
  Keyboard,
  Sun,
  Calendar,
  BarChart3,
  CalendarRange,
  Target,
  FileText,
  Sparkles,
} from "lucide-react";
import { searchTasks, SearchResult } from "@/app/actions/search";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

interface Board {
  id: string;
  name: string;
}

interface CommandPaletteProps {
  boards: Board[];
}

export function CommandPalette({ boards }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  
  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search tasks when query changes
  React.useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      searchTasks({ query: debouncedSearch, limit: 10 })
        .then(setSearchResults)
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setSearch("");
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={(open) => {
      setOpen(open);
      if (!open) {
        setSearch("");
        setSearchResults([]);
      }
    }}>
      <CommandInput 
        placeholder="Search tasks or type a command..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? "Searching..." : "No results found."}
        </CommandEmpty>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <CommandGroup heading="Tasks">
              {searchResults.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => runCommand(() => router.push(`/board/${result.boardId}`))}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate">{result.title}</span>
                    {result.priority && result.priority !== "none" && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs shrink-0 ${
                          result.priority === "p1" ? "border-red-500 text-red-500" :
                          result.priority === "p2" ? "border-orange-500 text-orange-500" :
                          result.priority === "p3" ? "border-yellow-500 text-yellow-500" :
                          "border-blue-500 text-blue-500"
                        }`}
                      >
                        {result.priority.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {result.boardName}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/"))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/today"))}
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Today</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/my-tasks"))}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>My Tasks</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/calendar"))}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("taskflow:open-ai-chat"));
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            <span>AI Assistant</span>
            <kbd className="ml-auto text-xs text-muted-foreground">⌘/</kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/weekly-review"))}
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            <span>Weekly Review</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/analytics"))}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/standup"))}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Daily Standup</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/settings"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Boards">
          {boards.map((board) => (
            <CommandItem
              key={board.id}
              onSelect={() => runCommand(() => router.push(`/board/${board.id}`))}
            >
              <Layout className="mr-2 h-4 w-4" />
              <span>{board.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              document.dispatchEvent(new CustomEvent("create-board"));
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Board</span>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              document.dispatchEvent(new CustomEvent("taskflow:toggle-focus-timer"));
            }}
          >
            <Target className="mr-2 h-4 w-4" />
            <span>Toggle Focus Timer</span>
            <kbd className="ml-auto text-xs text-muted-foreground">F</kbd>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              // Open quick capture
              const event = new KeyboardEvent("keydown", { key: "q" });
              window.dispatchEvent(event);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Quick Capture</span>
            <kbd className="ml-auto text-xs text-muted-foreground">Q</kbd>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
