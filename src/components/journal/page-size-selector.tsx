"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = ["10", "20", "50"] as const;
const COOKIE_NAME = "journal-page-size";

interface PageSizeSelectorProps {
  currentSize: number;
}

export function PageSizeSelector({ currentSize }: PageSizeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    // Persist in cookie (365 days, path=/)
    document.cookie = `${COOKIE_NAME}=${value};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;

    // Navigate without size in URL, reset page
    const params = new URLSearchParams(searchParams.toString());
    params.delete("size");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select value={currentSize.toString()} onValueChange={handleChange}>
      <SelectTrigger className="w-[72px] bg-muted/20 border-border/50 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAGE_SIZES.map((size) => (
          <SelectItem key={size} value={size}>
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
