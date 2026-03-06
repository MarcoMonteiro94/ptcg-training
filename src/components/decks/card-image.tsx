"use client";

import Image from "next/image";
import { useState } from "react";
import { getCardImageUrl } from "@/lib/card-images";

interface CardImageProps {
  cardName: string;
  count?: number;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { width: 80, height: 112, className: "w-[80px]" },
  md: { width: 120, height: 168, className: "w-[120px]" },
  lg: { width: 160, height: 224, className: "w-[160px]" },
};

export function CardImage({ cardName, count, size = "sm" }: CardImageProps) {
  const [error, setError] = useState(false);
  const imageUrl = getCardImageUrl(cardName);
  const { width, height, className } = sizes[size];

  if (!imageUrl || error) {
    return (
      <div
        className={`${className} aspect-[5/7] rounded-lg bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 border border-border/40 flex flex-col items-center justify-center p-2 relative overflow-hidden`}
      >
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_50%_50%,oklch(0.75_0.18_165),transparent_70%)]" />
        <span className="text-[9px] text-muted-foreground/50 text-center leading-tight font-mono z-10">
          {cardName}
        </span>
        {count != null && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-mono font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md z-10">
            {count}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`${className} relative group`}>
      <Image
        src={imageUrl}
        alt={cardName}
        width={width}
        height={height}
        className="rounded-lg shadow-md transition-transform duration-200 group-hover:scale-105 group-hover:shadow-xl"
        unoptimized
        onError={() => setError(true)}
      />
      {count != null && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-mono font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md z-10">
          {count}
        </span>
      )}
    </div>
  );
}
