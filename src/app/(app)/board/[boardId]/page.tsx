import { Suspense } from "react";
import { KanbanBoard } from "@/components/board/kanban-board";
import { getBoardWithData, getBoardLabels } from "@/app/actions/boards";
import { getBoardMembers } from "@/app/actions/members";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const board = await getBoardWithData(boardId);
  
  if (!board) {
    notFound();
  }

  const [labels, members] = await Promise.all([
    getBoardLabels(boardId),
    getBoardMembers(boardId),
  ]);

  type BoardColumn = (typeof board.columns)[number];
  type BoardCard = BoardColumn["cards"][number];

  // Transform data for the KanbanBoard component
  const columnsData = board.columns.map((col: BoardColumn) => ({
    id: col.id,
    title: col.name,
      tasks: col.cards.map((card: BoardCard) => ({
        id: card.id,
        title: card.title,
        description: card.description || undefined,
        columnId: card.columnId,
        columnTitle: col.name,
        labels: card.cardLabels.map((cl: BoardCard["cardLabels"][number]) => ({
          id: cl.label.id,
          name: cl.label.name,
          color: cl.label.color,
        })),
      assignee: card.assignee?.name || undefined,
      dueDate: card.dueDate ? card.dueDate.toISOString().split("T")[0] : undefined,
      priority: card.priority || "none",
      estimatedTime: card.estimatedTime,
    })),
  }));

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading board...</div>}>
      <KanbanBoard 
        boardId={board.id}
        boardName={board.name}
        initialColumns={columnsData} 
        availableLabels={labels}
        boardMembers={members}
        boardBackground={board.background}
        user={session.user}
      />
    </Suspense>
  );
}
