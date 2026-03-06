"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Swords, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getArchetypeImages } from "@/lib/pokemon-images";

interface Matchup {
  archetypeId: string;
  archetypeName: string;
  reason: string;
}

interface RecommendedMatchupProps {
  matchups: Matchup[];
  initialIndex: number;
}

export function RecommendedMatchup({ matchups, initialIndex }: RecommendedMatchupProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const matchup = matchups[currentIndex];
  const images = getArchetypeImages(matchup.archetypeId);

  function prev() {
    setCurrentIndex((i) => (i - 1 + matchups.length) % matchups.length);
  }

  function next() {
    setCurrentIndex((i) => (i + 1) % matchups.length);
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[oklch(0.70_0.20_15)]" />
            <CardTitle className="text-base">Recommended Matchup</CardTitle>
          </div>
          {matchups.length > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prev}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {currentIndex + 1}/{matchups.length}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={next}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {images.length > 0 ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.70_0.20_15/0.15)]">
                <span className="flex -space-x-2">
                  {images.slice(0, 2).map((url, i) => (
                    <Image key={i} src={url} alt="" width={24} height={24} className="h-6 w-6 object-contain" unoptimized />
                  ))}
                </span>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.70_0.20_15/0.15)]">
                <Swords className="h-5 w-5 text-[oklch(0.70_0.20_15)]" />
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{matchup.archetypeName}</p>
              <p className="text-xs text-muted-foreground">{matchup.reason}</p>
            </div>
          </div>
          <Link href="/coach">
            <Button variant="outline" size="sm">
              Study with Coach
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
