"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { 
  MessageSquare, 
  Send,
  Loader2, 
  ChevronDown,
  Clock,
  User,
  Database,
  Trash2,
  Plus,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ExternalLink,
  X
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { 
  personas, 
  getPersonaById, 
  getDefaultPersona, 
  starterPrompts,
  type Persona 
} from "@/lib/ai-personas";
import { 
  sendChatMessage, 
  clearChatHistory,
  type ChatMessage 
} from "@/app/actions/chat";
import {
  saveChatState,
  loadChatState,
  getConversationId,
  setConversationId as setStoredConversationId,
  startNewConversation,
  listConversations,
  deleteConversation,
} from "@/lib/chat-store";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { type ChatConversationSummary } from "@/lib/chat-store";

interface AIChatProps {
  userName?: string;
}

export function AIChat({ userName }: AIChatProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentPersona, setCurrentPersona] = useState<Persona>(getDefaultPersona());
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [fetchDashboard, setFetchDashboard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ChatConversationSummary[]>([]);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut to open chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        e.metaKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen for global event to open chat (triggered from sidebar)
  useEffect(() => {
    const handleOpenChat = () => setOpen(true);
    window.addEventListener("taskflow:open-ai-chat", handleOpenChat);
    return () => window.removeEventListener("taskflow:open-ai-chat", handleOpenChat);
  }, []);

  // Ensure the sidebar chat is closed on the full-page AI route.
  useEffect(() => {
    if (pathname === "/ai-assistant" && open) {
      setOpen(false);
      setExpanded(false);
    }
  }, [pathname, open]);

  const handleSend = useCallback(async (messageOverride?: string) => {
    const messageText = messageOverride || input.trim();
    if (!messageText || isPending) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    startTransition(async () => {
      try {
        const { response, contextUsed } = await sendChatMessage(
          messageText,
          currentPersona.id,
          messages,
          fetchDashboard
        );

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          persona: currentPersona.id,
          timestamp: new Date(),
          contextUsed,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setFetchDashboard(false); // Reset after use
      } catch {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    });
  }, [input, isPending, currentPersona, messages, fetchDashboard]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    const newId = startNewConversation();
    setConversationId(newId);
    setMessages([]);
    setInput("");
    setFetchDashboard(false);
    setHistory(listConversations());
  };

  const handleSelectConversation = (id: string) => {
    const state = loadChatState(id);
    if (!state) return;

    setConversationId(id);
    setStoredConversationId(id);
    setMessages(state.messages);
    setInput("");
    setFetchDashboard(false);

    const savedPersona = personas.find(p => p.id === state.personaId);
    if (savedPersona) {
      setCurrentPersona(savedPersona);
    }

    setHistoryOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    deleteConversation(id);
    await clearChatHistory(id);
    if (id === conversationId) {
      const newId = startNewConversation();
      setConversationId(newId);
      setMessages([]);
      setInput("");
      setFetchDashboard(false);
    }
    setHistory(listConversations());
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handlePersonaChange = (persona: Persona) => {
    setCurrentPersona(persona);
    setShowPersonaSelector(false);
    
    // Add system message about persona change
    if (messages.length > 0) {
      const systemMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `*Switched to ${persona.name}*\n\n${persona.tagline}. How can I help you?`,
        persona: persona.id,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  // Load chat state from storage on mount
  useEffect(() => {
    const id = getConversationId();
    setConversationId(id);
    
    const savedState = loadChatState(id);
    if (savedState && savedState.messages.length > 0) {
      setMessages(savedState.messages);
      // Restore persona if saved
      const savedPersona = personas.find(p => p.id === savedState.personaId);
      if (savedPersona) {
        setCurrentPersona(savedPersona);
      }
    }
    setInitialized(true);
    setHistory(listConversations());
  }, []);

  // Save chat state whenever messages or persona changes
  useEffect(() => {
    if (initialized && messages.length > 0) {
      saveChatState({
        messages,
        personaId: currentPersona.id,
        conversationId,
      });
      setHistory(listConversations());
    }
  }, [messages, currentPersona.id, conversationId, initialized]);

  // Welcome message when chat first opens (only if no saved messages)
  useEffect(() => {
    if (open && initialized && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        role: "assistant",
        content: `Hey${userName ? ` ${userName.split(" ")[0]}` : ""}! 👋 I'm ${currentPersona.name}, your TaskFlow assistant.\n\n${currentPersona.description}\n\nYou can ask me about your tasks, get productivity insights, or just chat. Try one of the suggestions below to get started!`,
        persona: currentPersona.id,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [open, initialized, messages.length, currentPersona, userName]);

  useEffect(() => {
    if (historyOpen) {
      setHistory(listConversations());
    }
  }, [historyOpen]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Open AI Chat"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            AI
          </span>
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        hideCloseButton
        className={cn(
          "flex flex-col p-0 gap-0",
          expanded ? "w-full sm:max-w-2xl" : "w-full sm:max-w-md"
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>AI Assistant</SheetTitle>
          <SheetDescription>Chat assistant panel for TaskFlow.</SheetDescription>
        </SheetHeader>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className={cn("text-lg", currentPersona.color)}>
                  {currentPersona.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div>
              <DropdownMenu open={showPersonaSelector} onOpenChange={setShowPersonaSelector}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 font-semibold hover:text-primary transition-colors">
                    {currentPersona.name}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel>Choose AI Persona</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {personas.map((persona) => (
                    <DropdownMenuItem
                      key={persona.id}
                      onClick={() => handlePersonaChange(persona)}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                    >
                      <span className="text-xl mt-0.5">{persona.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{persona.name}</span>
                          {persona.id === currentPersona.id && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {persona.tagline}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">{currentPersona.tagline}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {expanded ? "Collapse" : "Expand"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Open chat history"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">Chat History</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      handleNewChat();
                      setHistoryOpen(false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </div>

                {history.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    No saved chats yet.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-muted",
                          item.id === conversationId ? "bg-muted/60" : "bg-transparent"
                        )}
                        onClick={() => handleSelectConversation(item.id)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.updatedAt), {
                              addSuffix: true,
                            })}{" "}
                            • {item.messageCount} msgs
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteConversation(item.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </button>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      setOpen(false);
                      setExpanded(false);
                      router.push("/ai-assistant");
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in full page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-5 bg-border mx-1" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 group",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <Avatar className={cn(
                  "h-8 w-8 shrink-0",
                  message.role === "user" ? "bg-primary" : "bg-muted"
                )}>
                  <AvatarFallback className="text-sm">
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <span>{getPersonaById(message.persona || "friendly-assistant")?.avatar || "✨"}</span>
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Content */}
                <div
                  className={cn(
                    "flex flex-col max-w-[80%]",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    )}
                  >
                    <ChatMarkdown
                      content={message.content}
                      className={message.role === "user" ? "prose-invert" : "dark:prose-invert"}
                    />
                  </div>
                  
                  {/* Message metadata */}
                  <div className={cn(
                    "flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span className="text-[10px] text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {message.role === "assistant" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyMessage(message.content, message.id)}
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    {message.contextUsed && message.contextUsed.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">
                          {message.contextUsed.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isPending && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-muted">
                  <AvatarFallback>
                    <span>{currentPersona.avatar}</span>
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      {currentPersona.name.split(" ")[0]} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Prompts - only show when no user messages */}
          {messages.length <= 1 && (
            <div className="pb-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">
                Try asking:
              </p>
              <div className="grid gap-2">
                {starterPrompts.slice(0, 4).map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterPrompt(prompt.prompt)}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-lg">{prompt.title.split(" ")[0]}</span>
                    <div>
                      <p className="text-sm font-medium">{prompt.title.slice(2)}</p>
                      <p className="text-xs text-muted-foreground">{prompt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          {/* Data fetch toggle */}
          <div className="flex items-center gap-2 mb-3">
            <Button
              variant={fetchDashboard ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFetchDashboard(!fetchDashboard)}
            >
              <Database className="h-3 w-3 mr-1" />
              {fetchDashboard ? "Dashboard data enabled" : "Fetch dashboard data"}
            </Button>
            <span className="text-xs text-muted-foreground">
              {fetchDashboard ? "AI will include your task data" : "Click to include live data"}
            </span>
          </div>
          
          {/* Input field */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Ask ${currentPersona.name.split(" ")[0]} anything...`}
                className="pr-20 h-11 rounded-full bg-muted/50"
                disabled={isPending}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  ⌘/
                </span>
              </div>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isPending}
              size="icon"
              className="h-11 w-11 rounded-full shrink-0"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Persona suggestions */}
          {currentPersona.suggestedPrompts.length > 0 && messages.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {currentPersona.suggestedPrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleStarterPrompt(prompt)}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted hover:bg-accent transition-colors"
                >
                  {prompt.length > 35 ? prompt.slice(0, 35) + "..." : prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
