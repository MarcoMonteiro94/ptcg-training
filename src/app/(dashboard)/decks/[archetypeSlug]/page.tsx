import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getArchetypeBySlug } from "@/server/queries/archetypes";
import { getDecklistsByArchetype, getCardUsageForArchetype, getArchetypePlacements } from "@/server/queries/decklists";
import { getMatchupsForArchetype } from "@/server/queries/matchups";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BackButton } from "@/components/shared/back-button";
import { getArchetypeImages, getPokemonImageUrl } from "@/lib/pokemon-images";

// Simple heuristic: energy cards end with "Energy", trainers are common ones
const ENERGY_RE = /energy$/i;
const KNOWN_TRAINERS = new Set([
  "ultra ball", "nest ball", "rare candy", "buddy-buddy poffin", "iono",
  "boss's orders", "professor's research", "night stretcher", "counter catcher",
  "jamming tower", "technical machine: devolution", "super rod", "switch",
  "escape rope", "battle vip pass", "exp. share", "tool scrapper",
  "forest seal stone", "heavy ball", "hisuian heavy ball", "enhanced hammer",
  "energy retrieval", "energy search", "energy recycler", "energy switch",
  "arven", "irida", "colress's experiment", "cynthia's ambition",
  "judge", "marnie", "n", "guzma", "lysandre", "penny", "roxanne",
  "lillie's determination", "pokégear 3.0", "vs seeker",
]);

function isPokemonCard(cardId: string): boolean {
  if (ENERGY_RE.test(cardId)) return false;
  if (KNOWN_TRAINERS.has(cardId.toLowerCase())) return false;
  return true;
}

export const revalidate = 3600;

function getWinRateColor(winRate: number) {
  if (winRate >= 0.55) return "text-[oklch(0.80_0.15_155)]";
  if (winRate >= 0.45) return "text-foreground/70";
  return "text-[oklch(0.80_0.15_25)]";
}

export default async function ArchetypeDetailPage({
  params,
}: {
  params: Promise<{ archetypeSlug: string }>;
}) {
  const { archetypeSlug } = await params;

  let archetype: Awaited<ReturnType<typeof getArchetypeBySlug>> | null = null;

  try {
    archetype = await getArchetypeBySlug(archetypeSlug);
  } catch {
    // DB not connected — show not found
  }

  if (!archetype) {
    notFound();
  }

  let sampleLists: Awaited<ReturnType<typeof getDecklistsByArchetype>> = [];
  let cardUsage: Awaited<ReturnType<typeof getCardUsageForArchetype>> = [];
  let placements: Awaited<ReturnType<typeof getArchetypePlacements>> = [];
  let matchups: Awaited<ReturnType<typeof getMatchupsForArchetype>> = [];

  try {
    [sampleLists, cardUsage, placements, matchups] = await Promise.all([
      getDecklistsByArchetype(archetype.id),
      getCardUsageForArchetype(archetype.id),
      getArchetypePlacements(archetype.id),
      getMatchupsForArchetype(archetype.id),
    ]);
  } catch {
    // Partial data load failure is ok
  }

  const coreCards = cardUsage.filter((c) => c.isCore);
  const flexCards = cardUsage.filter((c) => !c.isCore);

  const images = getArchetypeImages(archetype.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/decks" label="Deck Explorer" />
      <div className="flex items-center gap-3">
        {images.length > 0 && (
          <span className="flex -space-x-3 shrink-0">
            {images.map((url, i) => (
              <Image
                key={i}
                src={url}
                alt={archetype.name}
                width={48}
                height={48}
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-lg"
                unoptimized
              />
            ))}
          </span>
        )}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{archetype.name}</h1>
        {archetype.tier && (
          <Badge className="font-mono text-[10px] bg-muted/30 text-muted-foreground border-0">
            Tier {archetype.tier}
          </Badge>
        )}
      </div>
      {archetype.description && (
        <p className="text-xs sm:text-sm text-muted-foreground/70">{archetype.description}</p>
      )}

      <Tabs defaultValue="cards">
        <TabsList className="bg-muted/20 border border-border/30 w-full sm:w-auto">
          <TabsTrigger value="cards" className="text-[11px] sm:text-xs font-mono data-[state=active]:bg-card flex-1 sm:flex-none">Cards</TabsTrigger>
          <TabsTrigger value="lists" className="text-[11px] sm:text-xs font-mono data-[state=active]:bg-card flex-1 sm:flex-none">Lists ({sampleLists.length})</TabsTrigger>
          <TabsTrigger value="matchups" className="text-[11px] sm:text-xs font-mono data-[state=active]:bg-card flex-1 sm:flex-none">Matchups</TabsTrigger>
          <TabsTrigger value="results" className="text-[11px] sm:text-xs font-mono data-[state=active]:bg-card flex-1 sm:flex-none">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-4 mt-4">
          {coreCards.length > 0 && (
            <div className="rounded-xl border border-[oklch(0.72_0.19_155/0.20)] bg-card/30 p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[oklch(0.80_0.15_155)] mb-3">
                Core Cards (&ge;75% usage)
              </h3>
              <div className="space-y-1">
                {coreCards.map((card) => (
                  <div key={card.cardId} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPokemonCard(card.cardId) && (
                        <Image
                          src={getPokemonImageUrl(card.cardId)}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain shrink-0"
                          unoptimized
                        />
                      )}
                      <span className="truncate">{card.cardId}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {card.avgCount}x avg ({Math.round(card.usageRate * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {flexCards.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Flex Cards
              </h3>
              <div className="space-y-1">
                {flexCards.slice(0, 20).map((card) => (
                  <div key={card.cardId} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isPokemonCard(card.cardId) && (
                        <Image
                          src={getPokemonImageUrl(card.cardId)}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain shrink-0"
                          unoptimized
                        />
                      )}
                      <span className="truncate">{card.cardId}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {card.avgCount}x avg ({Math.round(card.usageRate * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {cardUsage.length === 0 && (
            <p className="text-muted-foreground text-sm">No card usage data available.</p>
          )}
        </TabsContent>

        <TabsContent value="lists" className="mt-4">
          {sampleLists.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sample lists available.</p>
          ) : (
            <div className="space-y-3">
              {sampleLists.map((list) => {
                const pokemon = list.cards.filter((c) => isPokemonCard(c.card_id));
                const trainers = list.cards.filter((c) => !isPokemonCard(c.card_id) && !ENERGY_RE.test(c.card_id));
                const energy = list.cards.filter((c) => ENERGY_RE.test(c.card_id));
                return (
                  <details
                    key={list.id}
                    className="rounded-xl border border-border/50 bg-card/30 group"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-muted/10 transition-colors">
                      <span className="text-sm font-medium">
                        {list.playerName || "Unknown"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{list.placing || "N/A"}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground/50">
                          {list.cards.length} cards
                        </span>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 pt-1 border-t border-border/30">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {pokemon.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Pokemon</h4>
                            <div className="space-y-0.5">
                              {pokemon.map((c) => (
                                <div key={c.card_id} className="flex items-center gap-1.5 text-xs">
                                  <Image
                                    src={getPokemonImageUrl(c.card_id)}
                                    alt=""
                                    width={16}
                                    height={16}
                                    className="h-4 w-4 object-contain"
                                    unoptimized
                                  />
                                  <span className="font-mono text-muted-foreground/70">{c.count}x</span>
                                  <span>{c.card_id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {trainers.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Trainers</h4>
                            <div className="space-y-0.5">
                              {trainers.map((c) => (
                                <div key={c.card_id} className="flex items-center gap-1.5 text-xs">
                                  <span className="font-mono text-muted-foreground/70">{c.count}x</span>
                                  <span>{c.card_id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {energy.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-2">Energy</h4>
                            <div className="space-y-0.5">
                              {energy.map((c) => (
                                <div key={c.card_id} className="flex items-center gap-1.5 text-xs">
                                  <span className="font-mono text-muted-foreground/70">{c.count}x</span>
                                  <span>{c.card_id}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="matchups" className="mt-4">
          {matchups.length === 0 ? (
            <p className="text-muted-foreground text-sm">No matchup data available.</p>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-1.5">
              {matchups
                .filter((m) => m.totalGames >= 10)
                .sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
                .map((m) => (
                  <div key={m.opponentId} className="flex justify-between items-center text-sm border-b border-border/30 pb-1.5 last:border-0">
                    <span>vs {m.opponentName}</span>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-mono", getWinRateColor(m.winRate ?? 0))}>
                        {m.winRate !== null ? `${Math.round(m.winRate * 100)}%` : "-"}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground/60">
                        {m.totalGames}g
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          {placements.length === 0 ? (
            <p className="text-muted-foreground text-sm">No placement data available.</p>
          ) : (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-1.5">
              {placements.map((p) => (
                <div key={p.id} className="flex justify-between text-sm border-b border-border/30 pb-1.5 last:border-0">
                  <span>{p.playerName}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    #{p.placing} {p.record && `(${p.record})`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
