"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Layout,
  Settings,
  LogOut,
  ChevronUp,
  Plus,
  User2,
  CheckSquare,
  Sparkles,
  Sun,
  BarChart3,
  Calendar,
  FileText,
  CalendarRange,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateBoardDialog } from "@/components/modals/create-board-dialog";
import { BoardContextMenu } from "@/components/board/board-context-menu";
import { createBoard, updateBoardBackground } from "@/app/actions/boards";

interface Board {
  id: string;
  name: string;
  background?: string | null;
}

interface AppSidebarProps {
  boards: Board[];
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AppSidebar({ boards, user }: AppSidebarProps) {
  const pathname = usePathname();

  const handleCreateBoard = async (name: string, template: string, background: string) => {
    if (!user.id) throw new Error("User not authenticated");
    const boardId = await createBoard(name, user.id, template);
    
    // Update background if one was selected
    if (background) {
      await updateBoardBackground(boardId, background);
    }
    return boardId;
  };

  const handleOpenAIChat = () => {
    window.dispatchEvent(new CustomEvent("taskflow:open-ai-chat"));
  };

  const mainNavItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Today",
      url: "/today",
      icon: Sun,
    },
    {
      title: "My Tasks",
      url: "/my-tasks",
      icon: CheckSquare,
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: Calendar,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Weekly Review",
      url: "/weekly-review",
      icon: CalendarRange,
    },
    {
      title: "Standup",
      url: "/standup",
      icon: FileText,
    },
  ];

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/welcome">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Layout className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TaskFlow</span>
                  <span className="text-xs text-muted-foreground">Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* AI Assistant - opens chat panel instead of navigating */}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleOpenAIChat} className="cursor-pointer">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Assistant</span>
                  <span className="ml-auto text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    ⌘/
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Boards */}
        <SidebarGroup>
          <SidebarGroupLabel>Boards</SidebarGroupLabel>
          <SidebarGroupAction title="Create Board">
            <CreateBoardDialog 
              onCreateBoard={handleCreateBoard}
              trigger={<Plus className="h-4 w-4" />}
            />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {boards.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <span className="text-muted-foreground text-sm">No boards yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                boards.map((board) => (
                  <BoardContextMenu key={board.id} board={board}>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === `/board/${board.id}`}>
                        <Link href={`/board/${board.id}`}>
                          <div
                            className="h-4 w-4 rounded-sm shrink-0"
                            style={{ backgroundColor: board.background || "#e0f2fe" }}
                          />
                          <span className="truncate">{board.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </BoardContextMenu>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="h-8 w-8 rounded-lg"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <User2 className="h-4 w-4" />
                    </div>
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name || "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    // Show a brief signing out state
                    const el = document.createElement('div');
                    el.innerHTML = `<div class="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                      <div class="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border shadow-lg animate-in zoom-in-95 duration-300">
                        <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        <p class="text-sm font-medium">Signing out...</p>
                      </div>
                    </div>`;
                    document.body.appendChild(el);
                    await new Promise(r => setTimeout(r, 800));
                    signOut({ callbackUrl: "/welcome" });
                  }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
