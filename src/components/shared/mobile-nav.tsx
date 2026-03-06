"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Grid3X3, Layers, BookOpen, Bot, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Meta", icon: BarChart3 },
  { href: "/matchups", label: "Matchups", icon: Grid3X3 },
  { href: "/decks", label: "Decks", icon: Layers },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/training", label: "Training", icon: Target },
  { href: "/coach", label: "Coach", icon: Bot },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border/40 bg-background/90 backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[44px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_oklch(0.75_0.18_165/0.5)]")} />
              <span className="text-[9px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
