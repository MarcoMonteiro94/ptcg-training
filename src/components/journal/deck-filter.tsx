"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { DeckCombobox } from "@/components/shared/deck-combobox";

interface DeckFilterProps {
  decks: Array<{ id: string; name: string; games: number }>;
  activeDeckId: string | null;
}

export function DeckFilter({ decks, activeDeckId }: DeckFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("deck");
    } else {
      params.set("deck", value);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const archetypes = decks.map((d) => ({ id: d.id, name: `${d.name} (${d.games}g)` }));

  return (
    <DeckCombobox
      archetypes={archetypes}
      value={activeDeckId || ""}
      onValueChange={handleChange}
      placeholder="Filter by deck"
      allowEmpty
      emptyLabel="All Decks"
      className="w-[200px]"
    />
  );
}
