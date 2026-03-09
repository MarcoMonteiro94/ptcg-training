"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MATCH_TYPES = [
  { value: "all", label: "All Matches" },
  { value: "tournament", label: "Tournament" },
  { value: "tcg-masters", label: "TCG Masters" },
  { value: "tcg-live", label: "TCG Live" },
  { value: "physical", label: "Physical" },
] as const;

export type MatchTypeFilter = (typeof MATCH_TYPES)[number]["value"];

interface MatchTypeFilterProps {
  active: MatchTypeFilter;
}

export function MatchTypeFilter({ active }: MatchTypeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={active} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px] bg-muted/20 border-border/50 h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MATCH_TYPES.map((t) => (
          <SelectItem key={t.value} value={t.value} className="text-xs">
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
