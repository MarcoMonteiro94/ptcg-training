import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getUserDecklistById } from "@/server/queries/decklists";
import { getAllArchetypes } from "@/server/queries/archetypes";
import { BackButton } from "@/components/shared/back-button";
import { CardImage } from "@/components/decks/card-image";
import { getArchetypeImages } from "@/lib/pokemon-images";
import { UserDeckActions } from "@/components/decks/user-deck-actions";

export const metadata: Metadata = {
  title: "My Deck",
  description: "View and edit your saved deck.",
};

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
  "lillie's determination", "pokégear 3.0", "pokegear 3.0", "vs seeker",
  "professor sada's vitality", "professor turo's scenario", "crispin",
  "dawn", "briar", "hilda", "hop", "korrina", "erika's invitation",
  "ciphermaniac's codebreaking", "ethan's earnestness",
  "earthen vessel", "prime catcher", "secret box", "precious trolley",
  "superior energy retrieval", "fighting gong", "air balloon",
  "bravery charm", "luxurious cape", "vitality band",
  "technical machine: evolution", "technical machine: turbo energize",
  "artazon", "area zero underdepths", "battle cage", "spikemuth gym",
  "magma basin", "town store", "team rocket's watchtower",
  "unfair stamp", "acerola's mischief", "cyrano", "black belt's training",
  "xerosic's machinations", "n's pp up", "pal pad", "powerglass",
  "n's castle", "lively stadium", "jumbo ice cream",
]);

function isPokemonCard(cardId: string): boolean {
  if (ENERGY_RE.test(cardId)) return false;
  if (KNOWN_TRAINERS.has(cardId.toLowerCase())) return false;
  return true;
}

export default async function UserDeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { deckId } = await params;

  let deck: Awaited<ReturnType<typeof getUserDecklistById>> | null = null;
  let archetypeName: string | null = null;
  let allArchetypes: Array<{ id: string; name: string }> = [];

  try {
    const [deckResult, archetypes] = await Promise.all([
      getUserDecklistById(user.id, deckId),
      getAllArchetypes(),
    ]);
    deck = deckResult;
    allArchetypes = archetypes.map((a) => ({ id: a.id, name: a.name }));
    if (deck?.archetypeId) {
      archetypeName = archetypes.find((a) => a.id === deck!.archetypeId)?.name ?? null;
    }
  } catch {
    // DB not connected
  }

  if (!deck) notFound();

  const images = deck.archetypeId ? getArchetypeImages(deck.archetypeId) : [];
  const totalCards = deck.cards.reduce((sum, c) => sum + c.count, 0);

  const pokemon = deck.cards.filter((c) => isPokemonCard(c.card_id));
  const trainers = deck.cards.filter((c) => !isPokemonCard(c.card_id) && !ENERGY_RE.test(c.card_id));
  const energy = deck.cards.filter((c) => ENERGY_RE.test(c.card_id));

  const pokemonCount = pokemon.reduce((s, c) => s + c.count, 0);
  const trainerCount = trainers.reduce((s, c) => s + c.count, 0);
  const energyCount = energy.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/decks" label="Decks" />

      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {images.length > 0 && (
            <span className="flex -space-x-4 shrink-0">
              {images.map((url, i) => (
                <Image
                  key={i}
                  src={url}
                  alt=""
                  width={56}
                  height={56}
                  className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-lg"
                  unoptimized
                />
              ))}
            </span>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{deck.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {archetypeName && (
                <span className="text-xs text-muted-foreground/70">{archetypeName}</span>
              )}
              <Badge className="font-mono text-[10px] bg-muted/30 text-muted-foreground border-0 capitalize">
                {deck.format}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                {totalCards} cards
              </span>
              {deck.isActive && (
                <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        <UserDeckActions
          deck={{
            id: deck.id,
            name: deck.name,
            archetypeId: deck.archetypeId,
            format: deck.format,
            cards: deck.cards,
          }}
          archetypes={allArchetypes}
        />
      </div>

      {deck.cards.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/30 p-8 text-center">
          <p className="text-muted-foreground text-sm">No cards in this deck yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Edit the deck to add cards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pokemon.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">
                Pokemon ({pokemonCount})
              </h3>
              <div className="flex flex-wrap gap-2">
                {pokemon.map((c) => (
                  <CardImage key={c.card_id} cardName={c.card_id} count={c.count} size="sm" />
                ))}
              </div>
            </div>
          )}

          {trainers.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">
                Trainers ({trainerCount})
              </h3>
              <div className="flex flex-wrap gap-2">
                {trainers.map((c) => (
                  <CardImage key={c.card_id} cardName={c.card_id} count={c.count} size="sm" />
                ))}
              </div>
            </div>
          )}

          {energy.length > 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 p-4">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50 mb-3">
                Energy ({energyCount})
              </h3>
              <div className="flex flex-wrap gap-2">
                {energy.map((c) => (
                  <CardImage key={c.card_id} cardName={c.card_id} count={c.count} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
