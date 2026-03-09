"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { deleteDeck } from "@/server/actions/decklists";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";
import { AddDeckDialog } from "./add-deck-dialog";
import { ImportDeckDialog } from "./import-deck-dialog";

interface Decklist {
  id: string;
  name: string;
  archetypeId: string | null;
  format: string;
  isActive: boolean;
}

interface MyDecksSectionProps {
  decklists: Decklist[];
  archetypes: Array<{ id: string; name: string }>;
}

export function MyDecksSection({ decklists, archetypes }: MyDecksSectionProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete(deckId: string, deckName: string) {
    if (!confirm(`Remove "${deckName}" from your decks?`)) return;

    startTransition(async () => {
      const response = await deleteDeck(deckId);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      toast.success("Deck removed");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border/30 glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50">
          My Decks
        </h3>
        <div className="flex gap-1.5">
          <ImportDeckDialog archetypes={archetypes} />
          <AddDeckDialog archetypes={archetypes} />
        </div>
      </div>

      {decklists.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 text-center py-4">
          Save your favorite decks for quick access in selectors.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {decklists.map((deck) => {
            const deckImg = deck.archetypeId
              ? getArchetypeImageUrl(deck.archetypeId)
              : null;

            return (
              <div
                key={deck.id}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg border border-border/30 bg-card/30 px-3 py-2.5 transition-colors hover:bg-muted/20"
                )}
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
                  <div className="h-7 w-7 rounded-full bg-muted/50 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{deck.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/50 capitalize">
                    {deck.format}
                  </span>
                </div>

                {deck.isActive && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0 shrink-0">
                    Active
                  </Badge>
                )}

                <button
                  onClick={() => handleDelete(deck.id, deck.name)}
                  disabled={isPending}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
