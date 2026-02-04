import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMyTasks } from "@/app/actions/cards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertCircle, Calendar, Clock, CheckSquare, ArrowRight } from "lucide-react";

// Calculate due date status
function getDueDateStatus(dueDate: Date | null) {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: "overdue", label: `${Math.abs(diffDays)}d overdue`, color: "bg-red-500/20 text-red-600 border-red-500/50" };
  } else if (diffDays === 0) {
    return { status: "today", label: "Due today", color: "bg-amber-500/20 text-amber-600 border-amber-500/50" };
  } else if (diffDays <= 3) {
    return { status: "soon", label: `${diffDays}d left`, color: "bg-blue-500/20 text-blue-600 border-blue-500/50" };
  }
  return null;
}

// Sort tasks chronologically by due date (earliest first, null dates at end)
function sortByDueDate(tasks: TaskType[]) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

interface MyTasksPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function MyTasksPage({ searchParams }: MyTasksPageProps) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const filter = params.filter;

  const tasks = await getMyTasks() as TaskType[];

  // Group tasks by urgency and sort chronologically
  const overdueTasks = sortByDueDate(tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }));

  const dueTodayTasks = sortByDueDate(tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }));

  const dueSoonTasks = sortByDueDate(tasks.filter(t => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  }));

  const upcomingTasks = sortByDueDate(tasks.filter(t => {
    if (!t.dueDate) return true;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  }));

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <CheckSquare className="h-8 w-8" />
          My Tasks
        </h1>
        <p className="text-muted-foreground">
          {tasks.length} tasks assigned to you
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tasks assigned</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              Tasks assigned to you will appear here. Go to a board and assign yourself to some tasks!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <Card id="overdue" className={`border-red-500/50 ${filter === 'overdue' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-red-500 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overdue ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Due Today Section */}
          {dueTodayTasks.length > 0 && (
            <Card id="due-today" className="border-amber-500/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-amber-500 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Due Today ({dueTodayTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dueTodayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Due Soon Section (within 3 days) */}
          {dueSoonTasks.length > 0 && (
            <Card id="due-soon" className={`border-blue-500/50 ${filter === 'due-soon' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-500 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Due Soon ({dueSoonTasks.length})
                </CardTitle>
                <CardDescription>Within the next 3 days</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {dueSoonTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Section */}
          {upcomingTasks.length > 0 && (
            <Card id="upcoming">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming ({upcomingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Client-side scroll to filter section */}
      {filter && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                const el = document.getElementById('${filter}');
                if (el) {
                  setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              });
            `,
          }}
        />
      )}
    </div>
  );
}

type TaskType = {
  id: string;
  title: string;
  dueDate: Date | null;
  column: {
    board: {
      id: string;
      name: string;
    };
  };
  cardLabels: {
    label: {
      id: string;
      name: string;
      color: string;
    };
  }[];
};

interface TaskRowProps {
  task: TaskType;
}

function TaskRow({ task }: TaskRowProps) {
  const dueDateStatus = getDueDateStatus(task.dueDate);
  
  return (
    <Link
      href={`/board/${task.column.board.id}?card=${task.id}`}
      className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate group-hover:text-primary transition-colors">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {task.column.board.name}
          </span>
          {task.cardLabels.slice(0, 2).map((cl) => (
            <Badge 
              key={cl.label.id}
              variant="secondary" 
              className="text-xs px-1.5 py-0"
              style={{ backgroundColor: cl.label.color + "30", color: cl.label.color }}
            >
              {cl.label.name}
            </Badge>
          ))}
        </div>
      </div>
      
      {dueDateStatus && (
        <Badge variant="outline" className={dueDateStatus.color}>
          {dueDateStatus.label}
        </Badge>
      )}
      
      {task.dueDate && !dueDateStatus && (
        <span className="text-xs text-muted-foreground">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
      
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
