"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { navItems } from "./nav-items";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-background/95 backdrop-blur-xl border-border/30 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <nav className="flex flex-col gap-0.5 px-3 py-5 mt-8">
          <div className="px-3 mb-5">
            <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-muted-foreground/50">
              Navigation
            </p>
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/8 text-primary"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_oklch(0.75_0.18_165/0.5)]" />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-primary drop-shadow-[0_0_4px_oklch(0.75_0.18_165/0.4)]"
                      : "text-muted-foreground/70 group-hover:text-foreground"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium leading-none text-[13px]">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono">
                    {item.sublabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
