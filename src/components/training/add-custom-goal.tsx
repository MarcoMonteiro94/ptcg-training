"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCustomGoal } from "@/server/actions/training";
import { toast } from "sonner";
import { Plus, Loader2, X } from "lucide-react";

interface AddCustomGoalProps {
  goalId: string;
}

export function AddCustomGoal({ goalId }: AddCustomGoalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    startTransition(async () => {
      const result = await addCustomGoal(goalId, description);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDescription("");
      setIsOpen(false);
    });
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/20 transition-colors border border-dashed border-border/50"
      >
        <Plus className="h-3.5 w-3.5" />
        Add custom goal
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g., Review hand traps for mirror match"
        className="h-9 text-sm bg-muted/20 border-border/50"
        autoFocus
        disabled={isPending}
      />
      <Button type="submit" size="sm" disabled={isPending || !description.trim()}>
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => { setIsOpen(false); setDescription(""); }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
