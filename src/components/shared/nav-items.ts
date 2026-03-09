import {
  BarChart3,
  Grid3X3,
  Layers,
  BookOpen,
  Trophy,
  Target,
  Bot,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Meta", sublabel: "Dashboard", icon: BarChart3 },
  { href: "/matchups", label: "Matchups", sublabel: "Matrix", icon: Grid3X3 },
  { href: "/decks", label: "Decks", sublabel: "Explorer", icon: Layers },
  { href: "/journal", label: "Journal", sublabel: "Battle Log", icon: BookOpen },
  { href: "/tournaments", label: "Tournaments", sublabel: "Reports", icon: Trophy },
  { href: "/training", label: "Training", sublabel: "Practice Plan", icon: Target },
  { href: "/coach", label: "Coach", sublabel: "AI Assist", icon: Bot },
];
