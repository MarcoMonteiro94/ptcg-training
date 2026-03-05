"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrainingPlan } from "@/server/actions/training";
import { toast } from "sonner";
import { Loader2, Target, Zap } from "lucide-react";

interface Archetype {
  id: string;
  name: string;
  tier: string | null;
}

interface TrainingSetupFormProps {
  archetypes: Archetype[];
}

export function TrainingSetupForm({ archetypes }: TrainingSetupFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDeck, setSelectedDeck] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(15);
  const [step, setStep] = useState(1);

  function handleGenerate() {
    if (!selectedDeck) {
      toast.error("Please select a deck");
      return;
    }

    startTransition(async () => {
      const result = await createTrainingPlan({
        archetypeId: selectedDeck,
        weeklyGameTarget: weeklyTarget,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Training plan created!");
      router.push("/training");
    });
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Choose deck */}
      <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
            1
          </div>
          <h3 className="text-sm font-medium">Choose Your Deck</h3>
        </div>

        <Select value={selectedDeck} onValueChange={(v) => { setSelectedDeck(v); setStep(2); }}>
          <SelectTrigger className="bg-muted/20 border-border/50">
            <SelectValue placeholder="Select your active deck" />
          </SelectTrigger>
          <SelectContent>
            {archetypes.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                <span className="flex items-center gap-2">
                  {a.name}
                  {a.tier && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {a.tier}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Weekly target */}
      {step >= 2 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              2
            </div>
            <h3 className="text-sm font-medium">Weekly Game Target</h3>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">
              How many games do you want to play per week?
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
              <span className="text-2xl font-bold font-mono text-primary min-w-[3ch] text-right">
                {weeklyTarget}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>5 (casual)</span>
              <span>15 (regular)</span>
              <span>30 (grinder)</span>
            </div>
          </div>

          <Button
            onClick={() => setStep(3)}
            variant="outline"
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 3: Generate */}
      {step >= 3 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              3
            </div>
            <h3 className="text-sm font-medium">Generate Plan</h3>
          </div>

          <div className="rounded-lg bg-muted/20 p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span>
                Deck: <strong>{archetypes.find((a) => a.id === selectedDeck)?.name}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span>
                Target: <strong>{weeklyTarget} games/week</strong> (~{Math.ceil(weeklyTarget / 7)}/day)
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            AI will analyze your match history, worst matchups, and current meta to create a personalized plan.
          </p>

          <Button
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full holo-gradient text-background"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating plan...
              </>
            ) : (
              "Generate Training Plan"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
