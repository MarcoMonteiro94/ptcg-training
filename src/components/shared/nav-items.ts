import {
  BarChart3,
  Grid3X3,
  Home,
  Layers,
  BookOpen,
  Trophy,
  Target,
  Bot,
  PieChart,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Home", sublabel: "Dashboard", icon: Home },
  { href: "/meta", label: "Meta", sublabel: "Tier List", icon: BarChart3 },
  { href: "/matchups", label: "Matchups", sublabel: "Matrix", icon: Grid3X3 },
  { href: "/decks", label: "Decks", sublabel: "Explorer", icon: Layers },
  { href: "/journal", label: "Journal", sublabel: "Battle Log", icon: BookOpen },
  { href: "/stats", label: "Stats", sublabel: "Performance", icon: PieChart },
  { href: "/tournaments", label: "Tournaments", sublabel: "Reports", icon: Trophy },
  { href: "/training", label: "Training", sublabel: "Practice Plan", icon: Target },
  { href: "/coach", label: "Coach", sublabel: "AI Assist", icon: Bot },
];
