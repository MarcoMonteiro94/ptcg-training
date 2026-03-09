"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ArchetypeTier } from "@/types";
import { getArchetypeImages } from "@/lib/pokemon-images";

interface TierListProps {
  archetypes: Array<{
    id: string;
    name: string;
    slug: string;
    metaScore: number;
    justification?: string | null;
  }>;
}

function tierFromScore(score: number): ArchetypeTier {
  if (score >= 55) return "S";
  if (score >= 43) return "A";
  if (score >= 30) return "B";
  if (score >= 15) return "C";
  return "D";
}

const tierConfig: Record<ArchetypeTier, { bg: string; text: string; glow: string }> = {
  S: { bg: "bg-[oklch(0.70_0.20_15/0.15)]", text: "text-[oklch(0.70_0.20_15)]", glow: "shadow-[0_0_10px_oklch(0.70_0.20_15/0.2)]" },
  A: { bg: "bg-[oklch(0.78_0.16_80/0.12)]", text: "text-[oklch(0.78_0.16_80)]", glow: "" },
  B: { bg: "bg-[oklch(0.75_0.18_165/0.12)]", text: "text-[oklch(0.75_0.18_165)]", glow: "" },
  C: { bg: "bg-[oklch(0.70_0.15_200/0.12)]", text: "text-[oklch(0.70_0.15_200)]", glow: "" },
  D: { bg: "bg-muted/40", text: "text-muted-foreground", glow: "" },
};

const tiers: ArchetypeTier[] = ["S", "A", "B", "C", "D"];

export function TierList({ archetypes }: TierListProps) {
  const withTiers = archetypes.map((a) => ({
    ...a,
    tier: tierFromScore(a.metaScore),
  }));

  const grouped = tiers.map((tier) => ({
    tier,
    decks: withTiers
      .filter((a) => a.tier === tier)
      .sort((a, b) => b.metaScore - a.metaScore),
  }));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {grouped.map(
          ({ tier, decks }) =>
            decks.length > 0 && (
              <div key={tier} className="flex gap-3 items-start">
                <Badge
                  className={`${tierConfig[tier].bg} ${tierConfig[tier].text} ${tierConfig[tier].glow} border-0 min-w-9 h-7 justify-center text-sm font-bold font-mono shrink-0 mt-0.5`}
                >
                  {tier}
                </Badge>
                <div className="flex flex-wrap gap-1.5">
                  {decks.map((deck) => {
                    const images = getArchetypeImages(deck.id);
                    return (
                    <Tooltip key={deck.id}>
                      <TooltipTrigger asChild>
                        <Link href={`/decks/${deck.slug}`}>
                          <div className="group rounded-lg border border-border/40 bg-card/40 px-2.5 py-1.5 sm:px-3 sm:py-2 hover:border-primary/25 hover:bg-primary/5 transition-all duration-200">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium group-hover:text-primary transition-colors whitespace-nowrap">
                              {images.length > 0 && (
                                <span className="flex -space-x-2 shrink-0">
                                  {images.map((url, i) => (
                                    <Image
                                      key={i}
                                      src={url}
                                      alt=""
                                      width={28}
                                      height={28}
                                      className="h-7 w-7 object-contain drop-shadow-sm"
                                      unoptimized
                                    />
                                  ))}
                                </span>
                              )}
                              {deck.name}
                            </div>
                          </div>
                        </Link>
                      </TooltipTrigger>
                      {deck.justification && (
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          {deck.justification}
                        </TooltipContent>
                      )}
                    </Tooltip>
                    );
                  })}
                </div>
              </div>
            )
        )}
        {archetypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <span className="text-muted-foreground text-lg">?</span>
            </div>
            <p className="text-muted-foreground text-sm">
              No archetype data available yet.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Run the data pipeline to populate tier rankings.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
