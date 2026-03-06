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
import { Loader2, Target, Zap, Focus, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Archetype {
  id: string;
  name: string;
  tier: string | null;
}

interface TrainingSetupFormProps {
  archetypes: Archetype[];
  previousPlan?: {
    focusAreas: string[] | null;
    completionRate: number | null;
    difficulty: string | null;
  } | null;
}

const FOCUS_AREA_OPTIONS = [
  "Matchup Improvement",
  "Consistency",
  "Speed of Play",
  "Prize Mapping",
  "Mulligan Decisions",
  "Opening Turns",
  "Late Game Decisions",
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "casual" as const, label: "Casual", description: "Lighter goals, relaxed pace" },
  { value: "competitive" as const, label: "Competitive", description: "Standard training load" },
  { value: "grinder" as const, label: "Grinder", description: "Maximum goals, intense pace" },
];

export function TrainingSetupForm({ archetypes, previousPlan }: TrainingSetupFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [selectedDeck, setSelectedDeck] = useState("");
  const [weeklyTarget, setWeeklyTarget] = useState(15);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"casual" | "competitive" | "grinder">("competitive");
  const [step, setStep] = useState(1);

  function toggleFocusArea(area: string) {
    setFocusAreas((prev) => {
      if (prev.includes(area)) return prev.filter((a) => a !== area);
      if (prev.length >= 3) {
        toast.error("Maximum 3 focus areas");
        return prev;
      }
      return [...prev, area];
    });
  }

  function handleGenerate() {
    if (!selectedDeck) {
      toast.error("Please select a deck");
      return;
    }

    startTransition(async () => {
      const result = await createTrainingPlan({
        archetypeId: selectedDeck,
        weeklyGameTarget: weeklyTarget,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        difficulty,
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
      {/* Previous plan insight */}
      {previousPlan && (
        <div className="rounded-lg bg-muted/20 border border-border/30 p-3 text-sm space-y-1">
          <p className="text-xs font-mono uppercase text-muted-foreground">
            Previous Plan
          </p>
          {previousPlan.completionRate !== null && (
            <p className="text-muted-foreground">
              Completion: <strong>{Math.round(previousPlan.completionRate * 100)}%</strong>
            </p>
          )}
          {previousPlan.focusAreas && previousPlan.focusAreas.length > 0 && (
            <p className="text-muted-foreground">
              Focus: {previousPlan.focusAreas.join(", ")}
            </p>
          )}
        </div>
      )}

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

      {/* Step 2: Focus areas */}
      {step >= 2 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              2
            </div>
            <h3 className="text-sm font-medium">Focus Areas</h3>
          </div>

          <Label className="text-xs text-muted-foreground">
            What do you want to improve? (1-3 areas)
          </Label>

          <div className="flex flex-wrap gap-2">
            {FOCUS_AREA_OPTIONS.map((area) => (
              <button
                key={area}
                onClick={() => toggleFocusArea(area)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all border",
                  focusAreas.includes(area)
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-muted/20 border-border/50 text-muted-foreground hover:border-border"
                )}
              >
                {area}
              </button>
            ))}
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

      {/* Step 3: Weekly target + difficulty */}
      {step >= 3 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              3
            </div>
            <h3 className="text-sm font-medium">Training Settings</h3>
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

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">
              Difficulty
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className={cn(
                    "rounded-lg border p-2.5 text-center transition-all",
                    difficulty === opt.value
                      ? "bg-primary/10 border-primary/40"
                      : "bg-muted/20 border-border/50 hover:border-border"
                  )}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => setStep(4)}
            variant="outline"
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 4: Generate */}
      {step >= 4 && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
              4
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
            {focusAreas.length > 0 && (
              <div className="flex items-center gap-2">
                <Focus className="h-4 w-4 text-muted-foreground" />
                <span>Focus: <strong>{focusAreas.join(", ")}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span>
                Target: <strong>{weeklyTarget} games/week</strong> (~{Math.ceil(weeklyTarget / 7)}/day)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <span>
                Difficulty: <strong className="capitalize">{difficulty}</strong>
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
