"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Format } from "@/types";

const formats: { value: Format; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "expanded", label: "Expanded" },
];

export function FormatFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFormat = (searchParams.get("format") as Format) || "standard";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", value);
    router.push(`?${params.toString()}`);
  }

  return (
    <Select value={currentFormat} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Format" />
      </SelectTrigger>
      <SelectContent>
        {formats.map((f) => (
          <SelectItem key={f.value} value={f.value}>
            {f.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
