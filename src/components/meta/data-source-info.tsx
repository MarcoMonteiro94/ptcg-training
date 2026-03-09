"use client";

import { useState } from "react";
import { Info, ChevronDown } from "lucide-react";

export function DataSourceInfo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border/30 bg-muted/20">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left cursor-pointer"
      >
        <Info className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
        <span className="text-xs text-muted-foreground/70">
          Where does this data come from?
        </span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground/40 ml-auto transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 text-xs text-muted-foreground/60 leading-relaxed border-t border-border/20 pt-2.5">
          <p>
            Tournament results and decklists are sourced from{" "}
            <span className="text-foreground/70 font-medium">Limitless TCG</span> and{" "}
            <span className="text-foreground/70 font-medium">Trainer Hill</span>, covering
            official Pokemon TCG tournaments (Regionals, Internationals, and other sanctioned events).
          </p>
          <p>
            The <span className="text-foreground/70 font-medium">Meta Score</span> (0-100) is
            calculated using a multi-factor formula: Win Rate (30%), Top Cut Rate (30%), Usage Rate
            (20%), and Matchup Spread (20%). Tiers are derived from the meta score:{" "}
            <span className="font-mono text-[10px]">S &ge;55 · A &ge;43 · B &ge;30 · C &ge;15 · D &lt;15</span>.
          </p>
          <p>
            Data is refreshed periodically and reflects the current Standard format competitive
            landscape. Win rates and matchup data require a minimum sample size for confidence.
          </p>
        </div>
      )}
    </div>
  );
}
