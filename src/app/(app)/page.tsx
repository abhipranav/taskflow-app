import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/app/actions/boards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CheckSquare, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Sun,
  Target,
  FileText,
  CalendarRange,
  Keyboard,
  Sparkles,
  Lightbulb,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/welcome");
  }

  const stats = await getDashboardStats();

  if (!stats || stats.totalBoards === 0) {
    // No boards - show welcome state
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <LayoutDashboard className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to TaskFlow!</h1>
          <p className="text-muted-foreground mb-6">
            Create your first board to start organizing your tasks and projects.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Use the <strong>+</strong> button in the sidebar to create a new board, 
            or run <code className="bg-muted px-1 py-0.5 rounded">npm run db:seed</code> to load demo data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name?.split(" ")[0] || "there"}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/my-tasks">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.totalBoards} boards
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks">
          <Card className="transition-all hover:border-primary/50 hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.myTasks}</div>
              <p className="text-xs text-muted-foreground">
                Assigned to you
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks?filter=overdue">
          <Card className={`transition-all hover:shadow-md cursor-pointer ${stats.overdueTasks > 0 ? "border-red-500/50 hover:border-red-500" : "hover:border-primary/50"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className={`h-4 w-4 ${stats.overdueTasks > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? "text-red-500" : ""}`}>
                {stats.overdueTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/my-tasks?filter=due-soon">
          <Card className={`transition-all hover:shadow-md cursor-pointer ${stats.dueSoonTasks > 0 ? "border-amber-500/50 hover:border-amber-500" : "hover:border-primary/50"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
              <Clock className={`h-4 w-4 ${stats.dueSoonTasks > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.dueSoonTasks > 0 ? "text-amber-500" : ""}`}>
                {stats.dueSoonTasks}
              </div>
              <p className="text-xs text-muted-foreground">
                Within 3 days
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Boards */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Boards</CardTitle>
          <CardDescription>Quick access to your boards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.recentBoards.map((board) => (
              <Link 
                key={board.id} 
                href={`/board/${board.id}`}
                className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div 
                  className="h-10 w-10 rounded-lg shrink-0"
                  style={{ backgroundColor: board.background || "#e0f2fe" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {board.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {board.columns?.reduce((acc, col) => acc + col.cards.length, 0) || 0} tasks
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump to common workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/today" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Today&apos;s Focus</span>
                </div>
                <span className="text-xs text-muted-foreground">See what&apos;s due today</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/standup" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  <span className="font-medium">Daily Standup</span>
                </div>
                <span className="text-xs text-muted-foreground">Generate standup report</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/weekly-review" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Weekly Review</span>
                </div>
                <span className="text-xs text-muted-foreground">Track your progress</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 justify-start">
              <Link href="/my-tasks" className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-green-500" />
                  <span className="font-medium">My Tasks</span>
                </div>
                <span className="text-xs text-muted-foreground">All assigned to you</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Tips */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Keyboard className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Keyboard Ninja</p>
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">⌘K</kbd> for command palette, 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] ml-1">Q</kbd> for quick capture
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Target className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Focus Timer</p>
                <p className="text-xs text-muted-foreground">
                  Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">F</kbd> to start a Pomodoro session and track focused work time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <Sparkles className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Natural Input</p>
                <p className="text-xs text-muted-foreground">
                  Type &quot;Fix bug p1 tomorrow #backend&quot; to auto-set priority, date, and labels
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
