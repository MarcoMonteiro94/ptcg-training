import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Trophy, ChevronRight } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";

interface TournamentCardProps {
  tournament: {
    id: string;
    name: string;
    date: string;
    format: string;
    userArchetypeId: string | null;
    placing: number | null;
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

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 transition-colors hover:bg-muted/20"
    >
      {deckImg ? (
        <Image
          src={deckImg}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain shrink-0"
          unoptimized
        />
      ) : (
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
          <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{tournament.name}</div>
        <div className="flex gap-2 text-[11px] font-mono text-muted-foreground mt-0.5">
          <span>
            {new Date(tournament.date + "T00:00:00").toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
          {deckName && <span className="hidden sm:inline">{deckName}</span>}
        </div>
      </div>

      {hasGames && (
        <div className="font-mono text-sm font-medium shrink-0">
          <span className="text-[oklch(0.80_0.15_155)]">{record.wins}</span>
          <span className="text-muted-foreground/50">-</span>
          <span className="text-[oklch(0.80_0.15_25)]">{record.losses}</span>
          {record.draws > 0 && (
            <>
              <span className="text-muted-foreground/50">-</span>
              <span className="text-[oklch(0.85_0.12_80)]">{record.draws}</span>
            </>
          )}
        </div>
      )}

      {tournament.placing && (
        <Badge className="font-mono text-xs bg-primary/10 text-primary border-0 shrink-0">
          #{tournament.placing}
        </Badge>
      )}

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  );
}
