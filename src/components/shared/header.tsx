"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/85 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg holo-gradient shadow-[0_0_12px_oklch(0.75_0.18_165/0.2)]">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight leading-none">
              TCG Trainer
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/70 uppercase tracking-[0.2em] hidden sm:block">
              Competitive Analytics
            </span>
          </div>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-[10px] font-mono text-primary/70">STANDARD</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
