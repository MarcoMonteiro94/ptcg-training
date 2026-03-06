"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlan } from "@/server/actions/training";
import { toast } from "sonner";
import { Pencil, Loader2, Plus, X } from "lucide-react";

interface EditPlanDialogProps {
  planId: string;
  weeklyTarget: number;
  studyTopics: string[];
}

export function EditPlanDialog({
  planId,
  weeklyTarget: initialTarget,
  studyTopics: initialTopics,
}: EditPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [weeklyTarget, setWeeklyTarget] = useState(initialTarget);
  const [topics, setTopics] = useState(initialTopics);
  const [newTopic, setNewTopic] = useState("");

  function addTopic() {
    const trimmed = newTopic.trim();
    if (!trimmed || topics.includes(trimmed)) return;
    setTopics([...topics, trimmed]);
    setNewTopic("");
  }

  function removeTopic(index: number) {
    setTopics(topics.filter((_, i) => i !== index));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updatePlan(planId, {
        weeklyGameTarget: weeklyTarget,
        studyTopics: topics,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan updated");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Training Plan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Weekly Game Target
            </Label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={5}
                max={30}
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-lg font-bold font-mono text-primary min-w-[3ch] text-right">
                {weeklyTarget}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Study Topics
            </Label>
            <div className="space-y-1.5">
              {topics.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-1.5 text-sm"
                >
                  <span className="flex-1">{topic}</span>
                  <button
                    onClick={() => removeTopic(i)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add a study topic"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTopic();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addTopic}
                disabled={!newTopic.trim()}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
