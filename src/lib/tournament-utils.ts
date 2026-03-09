export type TournamentPlacing =
  | "dropped"
  | "top-1024"
  | "top-512"
  | "top-256"
  | "top-128"
  | "top-64"
  | "top-32"
  | "top-16"
  | "top-8"
  | "top-4"
  | "finalist"
  | "champion";

export type TournamentType =
  | "online"
  | "challenge"
  | "cup"
  | "regional"
  | "international"
  | "worlds";

export const PLACING_OPTIONS: { value: TournamentPlacing; label: string }[] = [
  { value: "champion", label: "Champion" },
  { value: "finalist", label: "Finalist" },
  { value: "top-4", label: "Top 4" },
  { value: "top-8", label: "Top 8" },
  { value: "top-16", label: "Top 16" },
  { value: "top-32", label: "Top 32" },
  { value: "top-64", label: "Top 64" },
  { value: "top-128", label: "Top 128" },
  { value: "top-256", label: "Top 256" },
  { value: "top-512", label: "Top 512" },
  { value: "top-1024", label: "Top 1024" },
  { value: "dropped", label: "Dropped" },
];

export function getPlacingLabel(placing: string): string {
  return PLACING_OPTIONS.find((p) => p.value === placing)?.label || placing;
}

export const TOURNAMENT_TYPES: { value: TournamentType; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "challenge", label: "Challenge" },
  { value: "cup", label: "Cup" },
  { value: "regional", label: "Regional" },
  { value: "international", label: "International" },
  { value: "worlds", label: "Worlds" },
];

const typeStyleConfig: Record<TournamentType, { bg: string; text: string }> = {
  worlds: {
    bg: "bg-[oklch(0.75_0.16_55/0.2)]",
    text: "text-[oklch(0.85_0.13_55)]",
  },
  international: {
    bg: "bg-[oklch(0.75_0.16_55/0.15)]",
    text: "text-[oklch(0.85_0.13_55)]",
  },
  regional: {
    bg: "bg-[oklch(0.75_0.16_55/0.12)]",
    text: "text-[oklch(0.82_0.11_55)]",
  },
  cup: {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  challenge: {
    bg: "bg-muted/30",
    text: "text-muted-foreground",
  },
  online: {
    bg: "bg-muted/20",
    text: "text-muted-foreground/70",
  },
};

export function getTypeStyle(type: TournamentType | null) {
  return typeStyleConfig[type || "challenge"] || typeStyleConfig.challenge;
}

const placingStyleConfig: Record<string, { bg: string; text: string }> = {
  champion: {
    bg: "bg-[oklch(0.75_0.16_55/0.2)]",
    text: "text-[oklch(0.85_0.13_55)]",
  },
  finalist: {
    bg: "bg-[oklch(0.75_0.16_55/0.12)]",
    text: "text-[oklch(0.82_0.11_55)]",
  },
  "top-4": {
    bg: "bg-primary/10",
    text: "text-primary",
  },
  "top-8": {
    bg: "bg-primary/10",
    text: "text-primary",
  },
};

const defaultPlacingStyle = { bg: "bg-muted/30", text: "text-muted-foreground" };

export function getPlacingStyle(placing: string) {
  return placingStyleConfig[placing] || defaultPlacingStyle;
}
