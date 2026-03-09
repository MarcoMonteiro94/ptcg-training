import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";
import { cn } from "@/lib/utils";
import {
  type TournamentType,
  getPlacingLabel,
  getTypeStyle,
  getPlacingStyle,
} from "@/lib/tournament-utils";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    date: string;
    format: string;
    userArchetypeId: string | null;
    placing: string | null;
    tournamentType: TournamentType | null;
    record: { wins: number; losses: number; draws: number };
  };
  archetypeNames: Record<string, string>;
}

export function TournamentCard({ tournament, archetypeNames }: TournamentCardProps) {
  const { record } = tournament;
  const deckName = tournament.userArchetypeId
    ? archetypeNames[tournament.userArchetypeId]
    : null;
  const deckImg = tournament.userArchetypeId
    ? getArchetypeImageUrl(tournament.userArchetypeId)
    : null;
  const hasGames = record.wins + record.losses + record.draws > 0;
  const effectiveType = tournament.tournamentType || "challenge";
  const tType = getTypeStyle(effectiveType);

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group block rounded-lg border border-border/30 bg-card/30 px-3 py-3 transition-colors hover:bg-muted/20 active:bg-muted/30"
    >
      {/* Top row: icon + name + type badge + chevron */}
      <div className="flex items-center gap-2.5">
        {deckImg ? (
          <Image
            src={deckImg}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0"
            unoptimized
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{tournament.name}</span>
            <Badge
              className={cn(
                "font-mono text-[9px] px-1.5 py-0 border-0 shrink-0 capitalize",
                tType.bg,
                tType.text
              )}
            >
              {effectiveType}
            </Badge>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
      </div>

      {/* Bottom row: date + deck + record + placing */}
      <div className="flex items-center gap-2 mt-2 ml-[42px]">
        <span className="text-[11px] font-mono text-muted-foreground/60">
          {new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          })}
        </span>

        {deckName && (
          <span className="text-[11px] text-muted-foreground/50 truncate max-w-[100px]">
            {deckName}
          </span>
        )}

        <div className="flex-1" />

        {hasGames && (
          <div className="font-mono text-xs font-medium shrink-0">
            <span className="text-[oklch(0.80_0.15_155)]">{record.wins}</span>
            <span className="text-muted-foreground/40">-</span>
            <span className="text-[oklch(0.80_0.15_25)]">{record.losses}</span>
            {record.draws > 0 && (
              <>
                <span className="text-muted-foreground/40">-</span>
                <span className="text-[oklch(0.85_0.12_80)]">{record.draws}</span>
              </>
            )}
          </div>
        )}

        {tournament.placing && (
          <Badge className={cn(
            "font-mono text-[10px] px-1.5 py-0 border-0 shrink-0",
            getPlacingStyle(tournament.placing).bg,
            getPlacingStyle(tournament.placing).text
          )}>
            {tournament.placing === "champion" ? "🏆 " : ""}
            {getPlacingLabel(tournament.placing)}
          </Badge>
        )}
      </div>
    </Link>
  );
}
