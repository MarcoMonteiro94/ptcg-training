import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { getMetaStats } from "@/server/queries/meta";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchetypeTier } from "@/types";
import { getArchetypeImages } from "@/lib/pokemon-images";

export const metadata: Metadata = {
  title: "Deck Explorer",
  description: "Browse competitive Pokemon TCG meta archetypes with sample lists, card usage data, and matchup analysis.",
};

export const revalidate = 3600;

const tierConfig: Record<ArchetypeTier, { bg: string; text: string; border: string }> = {
  S: {
    bg: "bg-[oklch(0.65_0.25_25/0.15)]",
    text: "text-[oklch(0.80_0.18_25)]",
    border: "border-[oklch(0.65_0.25_25/0.20)]",
  },
  A: {
    bg: "bg-[oklch(0.75_0.16_55/0.15)]",
    text: "text-[oklch(0.85_0.13_55)]",
    border: "border-[oklch(0.75_0.16_55/0.20)]",
  },
  B: {
    bg: "bg-[oklch(0.80_0.14_85/0.15)]",
    text: "text-[oklch(0.88_0.11_85)]",
    border: "border-[oklch(0.80_0.14_85/0.20)]",
  },
  C: {
    bg: "bg-[oklch(0.65_0.15_250/0.15)]",
    text: "text-[oklch(0.80_0.12_250)]",
    border: "border-[oklch(0.65_0.15_250/0.20)]",
  },
  D: {
    bg: "bg-muted/30",
    text: "text-muted-foreground",
    border: "border-border/30",
  },
};

export default async function DecksPage() {
  const format = "standard" as const;

  let archetypes: Awaited<ReturnType<typeof getMetaStats>> = [];
  try {
    archetypes = await getMetaStats(format);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Deck Explorer</h1>
        <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
          Browse meta archetypes, sample lists, and card usage data
        </p>
      </div>

      {archetypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/30 glass-card">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No archetype data available.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Run the data pipeline to populate.
          </p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {archetypes.map((arch) => {
            const tier = tierConfig[arch.tier as ArchetypeTier] || tierConfig.D;
            const images = getArchetypeImages(arch.id);
            return (
              <Link key={arch.id} href={`/decks/${arch.slug}`}>
                <div
                  className={cn(
                    "group rounded-xl border px-4 py-3.5 transition-all duration-200 hover:bg-muted/15 hover:border-primary/20 glass-card",
                    tier.border
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {images.length > 0 && (
                        <span className="flex -space-x-3 shrink-0">
                          {images.map((url, i) => (
                            <Image
                              key={i}
                              src={url}
                              alt=""
                              width={36}
                              height={36}
                              className="h-9 w-9 object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                              unoptimized
                            />
                          ))}
                        </span>
                      )}
                      <span className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {arch.name}
                      </span>
                    </div>
                    {arch.tier && (
                      <Badge
                        className={cn(
                          "font-mono font-bold text-[10px] px-2 py-0.5 border-0 shrink-0",
                          tier.bg,
                          tier.text
                        )}
                      >
                        {arch.tier}
                      </Badge>
                    )}
                  </div>
                  {arch.winRate != null && arch.winRate > 0 && (
                    <div className="text-[11px] font-mono text-muted-foreground/60 mt-1">
                      {(arch.winRate * 100).toFixed(1)}% WR
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
