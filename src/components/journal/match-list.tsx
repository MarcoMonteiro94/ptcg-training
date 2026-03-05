"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { MatchEditDialog } from "./match-edit-dialog";

interface MatchLog {
  id: string;
  result: "win" | "loss" | "draw";
  opponentArchetypeId: string | null;
  userArchetypeId: string | null;
  wentFirst: boolean | null;
  format: string;
  notes: string | null;
  playedAt: Date;
}

interface MatchListProps {
  matches: MatchLog[];
  archetypeNames: Record<string, string>;
  archetypes?: Array<{ id: string; name: string }>;
}

const resultConfig = {
  win: {
    bg: "bg-[oklch(0.72_0.19_155/0.15)]",
    text: "text-[oklch(0.80_0.15_155)]",
    border: "border-[oklch(0.72_0.19_155/0.25)]",
    label: "W",
  },
  loss: {
    bg: "bg-[oklch(0.65_0.22_25/0.15)]",
    text: "text-[oklch(0.80_0.15_25)]",
    border: "border-[oklch(0.65_0.22_25/0.25)]",
    label: "L",
  },
  draw: {
    bg: "bg-[oklch(0.78_0.16_80/0.15)]",
    text: "text-[oklch(0.85_0.12_80)]",
    border: "border-[oklch(0.78_0.16_80/0.25)]",
    label: "D",
  },
};

export function MatchList({ matches, archetypeNames, archetypes = [] }: MatchListProps) {
  const [editingMatch, setEditingMatch] = useState<MatchLog | null>(null);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <span className="text-muted-foreground text-lg font-mono">0</span>
        </div>
        <p className="text-muted-foreground text-sm">No matches logged yet.</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Start tracking your games to analyze performance.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5 stagger-children">
        {matches.map((match) => {
          const config = resultConfig[match.result];
          const userDeck = match.userArchetypeId
            ? archetypeNames[match.userArchetypeId]
            : null;
          const opponentDeck = archetypeNames[match.opponentArchetypeId || ""] || "Unknown";

          return (
            <div
              key={match.id}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/20 cursor-pointer",
                config.border,
                "bg-card/30"
              )}
              onClick={() => setEditingMatch(match)}
            >
              <Badge
                className={cn(
                  "font-mono font-bold text-xs w-7 h-7 p-0 flex items-center justify-center border-0 shrink-0",
                  config.bg,
                  config.text
                )}
              >
                {config.label}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {userDeck ? (
                    <span>
                      <span className="text-muted-foreground">{userDeck}</span>
                      {" "}
                      <span className="text-muted-foreground/50">vs</span>
                      {" "}
                      {opponentDeck}
                    </span>
                  ) : (
                    <span>vs {opponentDeck}</span>
                  )}
                </div>
                <div className="flex gap-2 text-[11px] font-mono text-muted-foreground mt-0.5">
                  {match.wentFirst !== null && (
                    <span>{match.wentFirst ? "1st" : "2nd"}</span>
                  )}
                  <span>{new Date(match.playedAt).toLocaleDateString()}</span>
                </div>
              </div>
              {match.notes && (
                <div className="text-xs text-muted-foreground/60 max-w-[180px] truncate hidden sm:block">
                  {match.notes}
                </div>
              )}
              <Pencil className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
            </div>
          );
        })}
      </div>

      {editingMatch && archetypes.length > 0 && (
        <MatchEditDialog
          match={editingMatch}
          archetypes={archetypes}
          open={!!editingMatch}
          onOpenChange={(open) => {
            if (!open) setEditingMatch(null);
          }}
        />
      )}
    </>
  );
}
