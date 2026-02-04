"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Code2, Bug, Zap, Server, DollarSign, Users, Briefcase, Rocket,
  Megaphone, Calendar, Share2, Youtube, User, Inbox, CalendarDays, Target,
  Repeat, GraduationCap, BookOpen, Lightbulb, LayoutGrid, ChevronRight,
  Check
} from "lucide-react";
import { getTemplatesByCategory, type BoardTemplate } from "@/lib/board-templates";

interface CreateBoardDialogProps {
  onCreateBoard: (name: string, template: string, background: string) => Promise<string>;
  trigger?: React.ReactNode;
}

const BOARD_COLORS = [
  "#e0f2fe", // soft sky blue
  "#dbeafe", // light blue  
  "#e0e7ff", // soft indigo
  "#ede9fe", // light lavender
  "#fae8ff", // soft pink
  "#fce7f3", // light rose
  "#ecfccb", // soft lime
  "#d1fae5", // mint green
  "#ccfbf1", // light teal
  "#fef3c7", // soft amber
  "#f5f5f4", // warm gray
  "#f1f5f9", // cool slate
];

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2, Bug, Zap, Server, DollarSign, Users, Briefcase, Rocket,
  Megaphone, Calendar, Share2, Youtube, User, Inbox, CalendarDays, Target,
  Repeat, GraduationCap, BookOpen, Lightbulb, LayoutGrid, Plus,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || LayoutGrid;
}

export function CreateBoardDialog({ onCreateBoard, trigger }: CreateBoardDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"template" | "details">("template");
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(BOARD_COLORS[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const categories = getTemplatesByCategory();

  const handleTemplateSelect = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    // Auto-generate a name suggestion
    if (!name) {
      setName(template.name === "Blank Board" ? "" : `My ${template.name}`);
    }
    setStep("details");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedTemplate) return;

    setLoading(true);
    try {
      await onCreateBoard(name.trim(), selectedTemplate.id, selectedColor);
      setOpen(false);
      resetDialog();
      router.refresh();
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setStep("template");
    setName("");
    setSelectedTemplate(null);
    setSelectedColor(BOARD_COLORS[0]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Create board</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 overflow-hidden">
        {step === "template" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Choose a Template</DialogTitle>
              <DialogDescription>
                Select a template that matches your workflow. Each comes with themed columns and labels.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[500px] px-6 pb-6">
              <div className="space-y-6 pr-4">
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {category.templates.map((template) => {
                        const Icon = getIcon(template.icon);
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className="group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left hover:bg-muted/50 hover:border-primary/50 transition-all"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{template.name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {template.columns.length > 0 
                                    ? template.columns.slice(0, 3).join(" → ") + (template.columns.length > 3 ? "..." : "")
                                    : "Empty board"}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {template.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {template.labels.slice(0, 4).map((label, i) => (
                                  <span
                                    key={i}
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: label.color }}
                                    title={label.name}
                                  />
                                ))}
                                {template.labels.length > 4 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{template.labels.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <form onSubmit={handleCreate}>
            <DialogHeader className="px-6 pt-6">
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && (
                  <>
                    {(() => {
                      const Icon = getIcon(selectedTemplate.icon);
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </>
                )}
                Create {selectedTemplate?.name} Board
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Board name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q1 2026 Sprint"
                  autoFocus
                />
              </div>

              {/* Preview columns */}
              {selectedTemplate && selectedTemplate.columns.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-normal">Columns that will be created</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.columns.map((col, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview labels */}
              {selectedTemplate && selectedTemplate.labels.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-normal">Labels that will be created</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTemplate.labels.map((label, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Background color</Label>
                <div className="flex gap-2 flex-wrap">
                  {BOARD_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`relative w-8 h-8 rounded-md transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-offset-2 ring-primary"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-6">
              <Button type="button" variant="ghost" onClick={() => setStep("template")}>
                ← Back
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || loading}>
                {loading ? "Creating..." : "Create Board"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
