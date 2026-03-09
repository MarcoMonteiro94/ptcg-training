"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pencil, Trophy, ExternalLink } from "lucide-react";
import { MatchEditDialog } from "./match-edit-dialog";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";
import { resultConfig } from "@/lib/match-utils";

interface MatchLog {
  id: string;
  result: "win" | "loss" | "draw";
  opponentArchetypeId: string | null;
  userArchetypeId: string | null;
  wentFirst: boolean | null;
  format: string;
  notes: string | null;
  playedAt: Date;
  userTournamentId?: string | null;
  roundNumber?: number | null;
  platform?: string | null;
}

const platformLabels: Record<string, string> = {
  "tcg-masters": "Masters",
  "tcg-live": "Live",
  "physical": "IRL",
};

interface MatchListProps {
  matches: MatchLog[];
  archetypeNames: Record<string, string>;
  archetypes?: Array<{ id: string; name: string }>;
}

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
              {match.opponentArchetypeId && (() => {
                const oppImg = getArchetypeImageUrl(match.opponentArchetypeId);
                return oppImg ? (
                  <Image src={oppImg} alt="" width={24} height={24} className="h-6 w-6 object-contain shrink-0" unoptimized />
                ) : null;
              })()}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {userDeck ? (
                    <span>
                      <span className="text-muted-foreground hidden sm:inline">{userDeck}</span>
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
                  <span>{new Date(match.playedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                </div>
              </div>
              {match.userTournamentId && (
                <Link
                  href={`/tournaments/${match.userTournamentId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 text-primary/60 hover:text-primary transition-colors"
                  title={match.roundNumber ? `Tournament R${match.roundNumber}` : "Tournament"}
                >
                  <Trophy className="h-3 w-3" />
                </Link>
              )}
              {match.platform && platformLabels[match.platform] && (
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/50 bg-muted/30 px-1.5 py-0.5 rounded hidden sm:inline">
                  {platformLabels[match.platform]}
                </span>
              )}
              {(() => {
                const reviewMatch = match.notes?.match(/Review:\s*(https?:\/\/\S+)/);
                return reviewMatch ? (
                  <a
                    href={reviewMatch[1]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 text-primary/60 hover:text-primary transition-colors"
                    title="View game review"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null;
              })()}
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
