"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ArrowRight, Plus, Pencil, Trash2, Archive, RotateCcw, User, FileText, Layout } from "lucide-react";
import { ActivityLog as ActivityLogType } from "@/app/actions/activity";

interface ActivityLogProps {
  items: ActivityLogType[];
}

export function ActivityLog({ items }: ActivityLogProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity found.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <Avatar className="h-8 w-8 mt-0.5">
            <AvatarImage src={item.user?.image || undefined} />
            <AvatarFallback>{item.user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold">{item.user?.name || "Unknown User"}</span>
              <span className="text-muted-foreground">{getActionText(item.action)}</span>
              {item.entityTitle && (
                <span className="font-medium text-primary/90">
                  {item.entityTitle}
                </span>
              )}
            </div>
            {item.details && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-1.5 rounded-md border w-fit max-w-full break-words">
                {item.details}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt || new Date()), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActionText(action: string) {
  switch (action) {
    case "created": return "created";
    case "updated": return "updated";
    case "moved": return "moved";
    case "deleted": return "deleted";
    case "archived": return "archived";
    case "restored": return "restored";
    default: return action;
  }
}
