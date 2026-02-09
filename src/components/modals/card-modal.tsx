"use client";

import { useState, useTransition, useEffect, useRef, useLayoutEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Tag, Trash2, Sparkles, Check, Square, CheckSquare, Loader2, Plus, X, Palette, User, UserPlus, Link2, ExternalLink, Github, History, Paperclip, FileText, Image as ImageIcon, Download, Flag, Timer } from "lucide-react";
import { updateCard, archiveCard } from "@/app/actions/cards";
import { generateCardSubtasks, summarizeCard, getCardChecklists, toggleChecklistItem, deleteChecklistItem } from "@/app/actions/ai";
import { addLabelToCard, removeLabelFromCard } from "@/app/actions/cards";
import { createLabel } from "@/app/actions/labels";
import { updateCardAssignee } from "@/app/actions/members";
import { addLinkToCard, removeLinkFromCard, getCardLinks } from "@/app/actions/links";
import { getCardActivity, ActivityLog as ActivityLogType } from "@/app/actions/activity";
import { addAttachment, removeAttachment, getAttachments } from "@/app/actions/attachments";
import { ActivityLog } from "@/components/activity-log";
import { TimeTracking } from "@/components/time-tracking";
import type { Task, Label as LabelType } from "@/components/board/kanban-board";
import type { Attachment } from "@/db/schema";

interface CardLink {
  id: string;
  url: string;
  type: string | null;
  title: string | null;
}

interface BoardMember {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CardModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  availableLabels: LabelType[];
  onDelete: (taskId: string) => void;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  boardId: string;
  boardName?: string;
  onJumpToCard?: (taskId: string) => void;
  origin?: { x: number; y: number } | null;
  onLabelCreated?: (label: LabelType) => void;
  boardMembers?: BoardMember[];
  currentUser?: { id: string; name?: string | null; image?: string | null };
}

// Preset colors for new labels - calming, muted tones
const LABEL_COLORS = [
  "#94a3b8", // slate
  "#78716c", // stone
  "#a3a3a3", // neutral gray
  "#64748b", // slate blue
  "#6b7280", // gray
  "#a8a29e", // warm gray
  "#9ca3af", // cool gray
  "#7c8590", // blue gray
  "#8b8b8b", // medium gray
  "#6e6e6e", // charcoal
];

export function CardModal({
  task,
  isOpen,
  onClose,
  availableLabels,
  onDelete,
  onUpdate,
  boardId,
  boardName,
  onJumpToCard,
  origin,
  onLabelCreated,
  boardMembers = [],
  currentUser,
}: CardModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [summary, setSummary] = useState("");
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [taskLabels, setTaskLabels] = useState<LabelType[]>(task?.labels || []);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);
  
  // Assignee state
  const [assignee, setAssignee] = useState<BoardMember | null>(null);
  const [isAssigneePopoverOpen, setIsAssigneePopoverOpen] = useState(false);
  
  // New label creation state
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);
  
  // Links state
  const [cardLinks, setCardLinks] = useState<CardLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // Activity state
  const [activities, setActivities] = useState<ActivityLogType[]>([]);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Priority state
  const [priority, setPriority] = useState(task?.priority || "none");

  // UX state
  type CardTab = "details" | "checklist" | "links" | "time" | "ai" | "activity";
  const [activeTab, setActiveTab] = useState<CardTab>("details");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [contextPulse, setContextPulse] = useState(false);
  const contextPulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attachmentsLoaded, setAttachmentsLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Load checklists when task changes
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setDueDate(task.dueDate || "");
      setSummary("");
      setTaskLabels(task.labels || []);
      setPriority(task.priority || "none");
      setContextPulse(true);
      if (contextPulseTimeoutRef.current) {
        clearTimeout(contextPulseTimeoutRef.current);
      }
      contextPulseTimeoutRef.current = setTimeout(() => {
        setContextPulse(false);
      }, 900);
      setIsCreatingLabel(false);
      setNewLabelName("");
      setActiveTab("details");
      setSaveStatus("idle");
      setAttachmentsLoaded(false);
      setActivityLoaded(false);
      setAttachments([]);
      setActivities([]);
      
      // Set assignee from task
      if (task.assignee && boardMembers) {
        const member = boardMembers.find(m => m.name === task.assignee);
        setAssignee(member || null);
      } else {
        setAssignee(null);
      }
      
      // Load existing checklists
      getCardChecklists(task.id).then(items => {
        setChecklists(items.map(item => ({
          id: item.id,
          text: item.text,
          completed: item.completed || false,
        })));
      });
      
      // Load existing links
      getCardLinks(task.id).then(links => {
        setCardLinks(links);
      });
      
      // Reset link input
      setNewLinkUrl("");
      setIsAddingLink(false);
    }
  }, [task, isOpen, boardMembers]);

  useLayoutEffect(() => {
    if (!isOpen || !origin || !contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect();
    const modalCenterX = rect.left + rect.width / 2;
    const modalCenterY = rect.top + rect.height / 2;
    const dx = origin.x - modalCenterX;
    const dy = origin.y - modalCenterY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const nx = dx / distance;
    const ny = dy / distance;
    const px = -ny;
    const py = nx;
    const curve = Math.min(22, Math.max(10, distance * 0.08));
    const midX = dx * 0.45 + px * curve;
    const midY = dy * 0.45 + py * curve;

    contentRef.current.animate(
      [
        {
          transform: `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0) scale(0.96)`,
          opacity: 0.65,
          boxShadow: "0 16px 50px hsl(var(--primary) / 0.22)",
        },
        {
          transform: `translate(-50%, -50%) translate3d(${midX}px, ${midY}px, 0) scale(0.985)`,
          opacity: 0.9,
          boxShadow: "0 20px 60px hsl(var(--primary) / 0.18)",
        },
        {
          transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(1)",
          opacity: 1,
          boxShadow: "0 24px 70px hsl(var(--primary) / 0.14)",
        },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      }
    );
  }, [isOpen, origin]);

  // Lazy-load heavy sections
  useEffect(() => {
    if (!task || !isOpen) return;

    if (activeTab === "links" && !attachmentsLoaded) {
      getAttachments(task.id).then(atts => {
        setAttachments(atts);
        setAttachmentsLoaded(true);
      });
    }

    if (activeTab === "activity" && !activityLoaded) {
      getCardActivity(task.id).then(logs => {
        setActivities(logs);
        setActivityLoaded(true);
      });
    }
  }, [activeTab, attachmentsLoaded, activityLoaded, task, isOpen]);

  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
      }
      if (contextPulseTimeoutRef.current) {
        clearTimeout(contextPulseTimeoutRef.current);
      }
    };
  }, []);

  // Attachment handlers
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success) {
        await addAttachment(task!.id, data.url, data.name, data.size, data.type);
        const updated = await getAttachments(task!.id);
        setAttachments(updated);
        setAttachmentsLoaded(true);
        
        // Refresh activity log
        const logs = await getCardActivity(task!.id);
        setActivities(logs);
        setActivityLoaded(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      // Reset input value? Needs ref or just let it be.
      e.target.value = "";
    }
  }

  async function handleDeleteAttachment(id: string) {
    await removeAttachment(id);
    setAttachments(prev => prev.filter(a => a.id !== id));
    setAttachmentsLoaded(true);
    
    // Refresh activity log
    const logs = await getCardActivity(task!.id);
    setActivities(logs);
    setActivityLoaded(true);
  }

  if (!task) return null;

  function handleSave() {
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        await updateCard(task!.id, {
          title,
          description: description || undefined,
          dueDate: dueDate ? new Date(dueDate) : null,
        });
        onUpdate(task!.id, { title, description, dueDate });
        setSaveStatus("saved");
        if (saveStatusTimeoutRef.current) {
          clearTimeout(saveStatusTimeoutRef.current);
        }
        saveStatusTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 1500);
      } catch (error) {
        console.error("Failed to save task:", error);
        setSaveStatus("idle");
      }
    });
  }

  function handleDelete() {
    if (confirm("Archive this task? You can undo from the board.")) {
      startTransition(async () => {
        await archiveCard(task!.id);
        onDelete(task!.id);
        onClose();
      });
    }
  }

  async function handleGenerateSubtasks() {
    setIsGenerating(true);
    try {
      const newSubtasks = await generateCardSubtasks(task!.id);
      setChecklists(prev => [...prev, ...newSubtasks.map(s => ({
        id: s.id,
        text: s.text,
        completed: s.completed,
      }))]);
    } catch (error) {
      console.error("Failed to generate subtasks:", error);
      alert("Failed to generate subtasks. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSummarize() {
    setIsSummarizing(true);
    try {
      const newSummary = await summarizeCard(task!.id);
      setSummary(newSummary || "");
    } catch (error) {
      console.error("Failed to summarize:", error);
      alert("Failed to summarize. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  }

  async function handleToggleChecklist(checklistId: string, completed: boolean) {
    setChecklists(prev =>
      prev.map(item =>
        item.id === checklistId ? { ...item, completed } : item
      )
    );
    await toggleChecklistItem(checklistId, completed);
  }

  async function handleDeleteChecklist(checklistId: string) {
    setChecklists(prev => prev.filter(item => item.id !== checklistId));
    await deleteChecklistItem(checklistId);
  }

  async function handleAddLabel(label: LabelType) {
    if (taskLabels.some(l => l.id === label.id)) return;
    
    const newLabels = [...taskLabels, label];
    setTaskLabels(newLabels);
    onUpdate(task!.id, { labels: newLabels });
    
    await addLabelToCard(task!.id, label.id);
  }

  async function handleRemoveLabel(labelId: string) {
    const newLabels = taskLabels.filter(l => l.id !== labelId);
    setTaskLabels(newLabels);
    onUpdate(task!.id, { labels: newLabels });
    
    await removeLabelFromCard(task!.id, labelId);
  }

  async function handleCreateLabel() {
    if (!newLabelName.trim()) return;
    
    try {
      const newLabel = await createLabel(boardId, newLabelName.trim(), newLabelColor);
      
      // Add to available labels
      if (onLabelCreated) {
        onLabelCreated(newLabel);
      }
      
      // Add to this task
      await handleAddLabel(newLabel);
      
      // Reset form
      setNewLabelName("");
      setNewLabelColor(LABEL_COLORS[0]);
      setIsCreatingLabel(false);
    } catch (error) {
      console.error("Failed to create label:", error);
      alert("Failed to create label. Please try again.");
    }
  }

  async function handleAssigneeChange(member: BoardMember | null) {
    setAssignee(member);
    setIsAssigneePopoverOpen(false);
    
    await updateCardAssignee(task!.id, member?.id || null);
    onUpdate(task!.id, { assignee: member?.name || undefined });
  }

  async function handleAssignToMe() {
    if (!currentUser) return;
    const me = boardMembers.find(m => m.id === currentUser.id);
    if (me) {
      await handleAssigneeChange(me);
    }
  }

  async function handleAddLink() {
    if (!newLinkUrl.trim()) return;
    
    try {
      const newLink = await addLinkToCard(task!.id, newLinkUrl.trim());
      setCardLinks(prev => [...prev, newLink]);
      setNewLinkUrl("");
      setIsAddingLink(false);
    } catch (error) {
      console.error("Failed to add link:", error);
      alert("Failed to add link. Please try again.");
    }
  }

  async function handleRemoveLink(linkId: string) {
    setCardLinks(prev => prev.filter(l => l.id !== linkId));
    await removeLinkFromCard(linkId);
  }

  const completedCount = checklists.filter(c => c.completed).length;
  const totalCount = checklists.length;
  
  const availableToAdd = availableLabels.filter(
    label => !taskLabels.some(l => l.id === label.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        ref={contentRef}
        className="max-w-3xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-none data-[state=closed]:animate-none"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context + Save Status */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {boardName && (
                <Badge
                  variant="secondary"
                  className={`rounded-md transition-shadow ${contextPulse ? "ring-1 ring-primary/40 shadow-[0_0_16px_hsl(var(--primary)_/_0.35)]" : ""}`}
                >
                  {boardName}
                </Badge>
              )}
              {task.columnTitle && (
                <>
                  <span className="text-muted-foreground/60">/</span>
                  <Badge
                    variant="outline"
                    className={`rounded-md transition-shadow ${contextPulse ? "ring-1 ring-primary/30 shadow-[0_0_12px_hsl(var(--primary)_/_0.25)]" : ""}`}
                  >
                    {task.columnTitle}
                  </Badge>
                </>
              )}
              {onJumpToCard && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onClose();
                    onJumpToCard(task.id);
                  }}
                >
                  Jump to card
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground min-h-[18px]">
              {saveStatus === "saving" && "Saving..."}
              {saveStatus === "saved" && "Saved"}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CardTab)}>
            <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="links">Links & Files</TabsTrigger>
              <TabsTrigger value="time">Time</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* DETAILS */}
            <TabsContent value="details">
              <div className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">Task Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSave}
                    className="text-lg font-semibold h-12"
                    placeholder="Enter task title..."
                  />
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Labels</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {taskLabels.map((label) => (
                      <Badge
                        key={label.id}
                        style={{ backgroundColor: label.color }}
                        className="text-white group cursor-pointer hover:opacity-80"
                        onClick={() => handleRemoveLabel(label.id)}
                      >
                        {label.name}
                        <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
                      </Badge>
                    ))}
                    
                    {/* Add Label Button */}
                    <Popover open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 px-2">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                        {!isCreatingLabel ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Add Label</p>
                            
                            {/* Existing labels */}
                            {availableToAdd.length > 0 && (
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {availableToAdd.map((label) => (
                                  <button
                                    key={label.id}
                                    onClick={() => {
                                      handleAddLabel(label);
                                      setIsLabelPopoverOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                                  >
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{ backgroundColor: label.color }}
                                    />
                                    <span className="text-sm">{label.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            
                            {availableToAdd.length > 0 && <hr className="my-2" />}
                            
                            {/* Create new label button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => setIsCreatingLabel(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create new label
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Create Label</p>
                              <button
                                onClick={() => setIsCreatingLabel(false)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            
                            {/* Label name input */}
                            <Input
                              value={newLabelName}
                              onChange={(e) => setNewLabelName(e.target.value)}
                              placeholder="Label name..."
                              className="h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateLabel();
                                if (e.key === "Escape") setIsCreatingLabel(false);
                              }}
                            />
                            
                            {/* Color picker */}
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground flex items-center gap-1">
                                <Palette className="h-3 w-3" />
                                Color
                              </label>
                              <div className="flex flex-wrap gap-1">
                                {LABEL_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => setNewLabelColor(color)}
                                    className={`w-6 h-6 rounded transition-all ${
                                      newLabelColor === color
                                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                                        : "hover:scale-110"
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            
                            {/* Preview and create */}
                            <div className="flex items-center gap-2">
                              <Badge
                                style={{ backgroundColor: newLabelColor }}
                                className="text-white"
                              >
                                {newLabelName || "Preview"}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={handleCreateLabel}
                                disabled={!newLabelName.trim()}
                                className="ml-auto"
                              >
                                Create
                              </Button>
                            </div>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Assignee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {assignee ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50">
                        {assignee.image ? (
                          <img src={assignee.image} alt="" className="h-6 w-6 rounded-full" />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">
                            {assignee.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium">{assignee.name || assignee.email}</span>
                        <button
                          onClick={() => handleAssigneeChange(null)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                    
                    <Popover open={isAssigneePopoverOpen} onOpenChange={setIsAssigneePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <UserPlus className="h-4 w-4 mr-1" />
                          {assignee ? "Change" : "Assign"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-2" align="start">
                        <div className="space-y-1">
                          {currentUser && (
                            <>
                              <button
                                onClick={handleAssignToMe}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left text-sm font-medium text-primary"
                              >
                                <Check className="h-4 w-4" />
                                Assign to me
                              </button>
                              <hr className="my-1" />
                            </>
                          )}
                          {boardMembers.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => handleAssigneeChange(member)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left ${
                                assignee?.id === member.id ? "bg-muted" : ""
                              }`}
                            >
                              {member.image ? (
                                <img src={member.image} alt="" className="h-6 w-6 rounded-full" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">
                                  {member.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{member.name || member.email}</p>
                                {member.name && (
                                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                )}
                              </div>
                              {assignee?.id === member.id && (
                                <Check className="h-4 w-4 text-primary" />
                              )}
                            </button>
                          ))}
                          {boardMembers.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No team members yet
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    onBlur={handleSave}
                    className="w-48"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Flag className="h-4 w-4" />
                    Priority
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "none", label: "None", color: "bg-muted text-muted-foreground" },
                      { value: "p1", label: "P1", color: "bg-red-500 text-white" },
                      { value: "p2", label: "P2", color: "bg-orange-500 text-white" },
                      { value: "p3", label: "P3", color: "bg-yellow-500 text-white" },
                      { value: "p4", label: "P4", color: "bg-blue-500 text-white" },
                    ].map((p) => (
                      <Button
                        key={p.value}
                        variant="outline"
                        size="sm"
                        className={`h-8 ${priority === p.value ? p.color : ""}`}
                        onClick={() => {
                          setPriority(p.value);
                          startTransition(async () => {
                            await updateCard(task!.id, { priority: p.value });
                            onUpdate(task!.id, { priority: p.value });
                          });
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSave}
                    placeholder="Add a more detailed description..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* CHECKLIST */}
            <TabsContent value="checklist">
              <div className="space-y-4">
                {checklists.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckSquare className="h-4 w-4" />
                        <span>Subtasks</span>
                        <span className="text-xs">({completedCount}/{totalCount})</span>
                      </div>
                      {totalCount > 0 && (
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(completedCount / totalCount) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {checklists.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <button
                            onClick={() => handleToggleChecklist(item.id, !item.completed)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            {item.completed ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                          <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                            {item.text}
                          </span>
                          <button
                            onClick={() => handleDeleteChecklist(item.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No subtasks yet. Generate a checklist to break this down.
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateSubtasks}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-3 w-3" />
                    )}
                    Generate Subtasks
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* LINKS & FILES */}
            <TabsContent value="links">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link2 className="h-4 w-4" />
                    <span>Links</span>
                  </div>
                  
                  {/* Existing links */}
                  {cardLinks.length > 0 && (
                    <div className="space-y-1">
                      {cardLinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2 group">
                          {link.type?.includes("github") ? (
                            <Github className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          )}
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate flex-1"
                          >
                            {link.title || link.url}
                          </a>
                          <Badge variant="outline" className="text-xs">
                            {link.type === "github_issue" ? "Issue" :
                             link.type === "github_pr" ? "PR" :
                             link.type === "gitlab_issue" ? "Issue" :
                             link.type === "gitlab_mr" ? "MR" : "Link"}
                          </Badge>
                          <button
                            onClick={() => handleRemoveLink(link.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add link form */}
                  {isAddingLink ? (
                    <div className="flex gap-2">
                      <Input
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo/issues/123"
                        className="flex-1 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddLink();
                          if (e.key === "Escape") setIsAddingLink(false);
                        }}
                      />
                      <Button size="sm" onClick={handleAddLink} className="h-8">
                        Add
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsAddingLink(false)} className="h-8">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setIsAddingLink(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add link
                    </Button>
                  )}
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <Label className="text-muted-foreground flex items-center gap-2">
                       <Paperclip className="h-4 w-4" />
                       Attachments
                     </Label>
                     <label className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 ${isUploading ? 'opacity-50' : ''}`}>
                        <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {isUploading ? "Uploading..." : "Add file"}
                     </label>
                  </div>
                  
                  {attachments.length > 0 ? (
                    <div className="grid gap-2">
                       {attachments.map(att => (
                         <div key={att.id} className="flex items-center gap-3 p-2 rounded-md border bg-muted/20 group">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                              {att.type.startsWith('image') ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">
                                  {att.name}
                               </a>
                               <div className="text-xs text-muted-foreground flex items-center gap-2">
                                 <span>{(att.size / 1024).toFixed(1)} KB</span>
                                 <span>•</span>
                                 <span>{new Date(att.createdAt || new Date()).toLocaleDateString()}</span>
                               </div>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={att.url} download target="_blank" className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted">
                                 <Download className="h-4 w-4" />
                              </a>
                              <button onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted">
                                 <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No attachments yet.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TIME */}
            <TabsContent value="time">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  Time Tracking
                </Label>
                {task && <TimeTracking cardId={task.id} estimatedTime={task.estimatedTime} />}
              </div>
            </TabsContent>

            {/* AI */}
            <TabsContent value="ai">
              <div className="space-y-4">
                {summary && (
                  <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                      <Sparkles className="h-4 w-4" />
                      AI Summary
                    </div>
                    <p className="text-sm">{summary}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Actions</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleGenerateSubtasks}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-3 w-3" />
                      )}
                      Generate Subtasks
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-3 w-3" />
                      )}
                      Summarize
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Uses AI when configured, otherwise falls back to smart rules
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ACTIVITY */}
            <TabsContent value="activity">
              <div className="space-y-3">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <History className="h-4 w-4" />
                   <span>Activity</span>
                 </div>
                 <div className="max-h-60 overflow-y-auto pr-2">
                    <ActivityLog items={activities} />
                 </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button onClick={onClose} disabled={isPending}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
