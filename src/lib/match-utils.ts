export type MatchResult = "win" | "loss" | "draw";

export const resultConfig: Record<
  MatchResult,
  { bg: string; text: string; border: string; label: string }
> = {
  win: {
    bg: "bg-[oklch(0.72_0.19_155/0.15)]",
    text: "text-[oklch(0.80_0.15_155)]",
    border: "border-[oklch(0.72_0.19_155/0.25)]",
    label: "W",
  },
  loss: {
    bg: "bg-[oklch(0.65_0.22_25/0.15)]",
    text: "text-[oklch(0.80_0.15_25)]",
    border: "border-[oklch(0.65_0.22_25/0.25)]",
    label: "L",
  },
  draw: {
    bg: "bg-[oklch(0.78_0.16_80/0.15)]",
    text: "text-[oklch(0.85_0.12_80)]",
    border: "border-[oklch(0.78_0.16_80/0.25)]",
    label: "D",
  },
};
