"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { abandonPlan } from "@/server/actions/training";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AbandonPlanDialogProps {
  planId: string;
  completionRate: number;
  gamesPlayed: number;
  gameTarget: number;
}

export function AbandonPlanDialog({
  planId,
  completionRate,
  gamesPlayed,
  gameTarget,
}: AbandonPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAbandon() {
    startTransition(async () => {
      const result = await abandonPlan(planId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Plan abandoned");
      setOpen(false);
      router.push("/training/setup");
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          New Plan
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Abandon Current Plan?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose your current progress. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg bg-muted/20 p-3 space-y-1 text-sm">
          <p>
            Games: <strong>{gamesPlayed}/{gameTarget}</strong>
          </p>
          <p>
            Goal completion: <strong>{Math.round(completionRate * 100)}%</strong>
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAbandon}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Abandon & Create New"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
