"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    if (value === "all") {
      params.delete("deck");
    } else {
      params.set("deck", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={activeDeckId || "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px] bg-muted/20 border-border/50 h-8 text-xs">
        <SelectValue placeholder="All Decks" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Decks</SelectItem>
        {decks.map((deck) => (
          <SelectItem key={deck.id} value={deck.id}>
            {deck.name} ({deck.games}g)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
