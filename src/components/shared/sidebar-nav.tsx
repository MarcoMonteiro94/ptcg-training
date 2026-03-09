"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Grid3X3,
  Layers,
  BookOpen,
  Trophy,
  Bot,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Meta", sublabel: "Dashboard", icon: BarChart3 },
  { href: "/matchups", label: "Matchups", sublabel: "Matrix", icon: Grid3X3 },
  { href: "/decks", label: "Decks", sublabel: "Explorer", icon: Layers },
  { href: "/journal", label: "Journal", sublabel: "Battle Log", icon: BookOpen },
  { href: "/tournaments", label: "Tournaments", sublabel: "Reports", icon: Trophy },
  { href: "/training", label: "Training", sublabel: "Practice Plan", icon: Target },
  { href: "/coach", label: "Coach", sublabel: "AI Assist", icon: Bot },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5 px-3 py-5">
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
                isActive ? "text-primary drop-shadow-[0_0_4px_oklch(0.75_0.18_165/0.4)]" : "text-muted-foreground/70 group-hover:text-foreground"
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
  );
}
