import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getUserBoards, getBoardsWithColumns } from "@/app/actions/boards";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CommandPaletteWrapper } from "@/components/command-palette-wrapper";
import { QuickCaptureWrapper } from "@/components/quick-capture-wrapper";
import { FocusTimerWrapper } from "@/components/focus-timer-wrapper";
import { AIChatWrapper } from "@/components/ai-chat-wrapper";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export async function SidebarWrapper({ children }: SidebarWrapperProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const boards = await getUserBoards();
  const boardsWithColumns = await getBoardsWithColumns();

  return (
    <SidebarProvider>
      <AppSidebar 
        boards={boards} 
        user={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }} 
      />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <FocusTimerWrapper triggerVariant="icon" />
          <ThemeToggle />
          <AIChatWrapper userName={session.user.name || undefined} />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
      <CommandPaletteWrapper boards={boards} />
      <QuickCaptureWrapper boards={boardsWithColumns} />
    </SidebarProvider>
  );
}
