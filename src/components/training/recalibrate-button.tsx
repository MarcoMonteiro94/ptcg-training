"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adjustDailyGoals } from "@/server/actions/training";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";

interface RecalibrateButtonProps {
  planId: string;
}

export function RecalibrateButton({ planId }: RecalibrateButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleRecalibrate() {
    startTransition(async () => {
      const result = await adjustDailyGoals(planId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Adjusted goals for ${result.adjusted} remaining days`);
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRecalibrate}
      disabled={isPending}
      className="text-muted-foreground text-xs gap-1.5"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <RefreshCw className="h-3.5 w-3.5" />
      )}
      Recalibrate
    </Button>
  );
}
