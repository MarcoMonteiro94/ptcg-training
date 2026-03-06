import { Zap, BarChart3, Target, Bot, BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-sidebar items-center justify-center noise-overlay">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/50" />
        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl holo-gradient mb-6 shadow-[0_0_24px_oklch(0.75_0.18_165/0.3)]">
            <Zap className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            TCG Trainer
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Competitive Pokemon TCG analytics powered by real tournament data
            and AI coaching.
          </p>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono holo-text">15+</span>
              <span className="text-xs mt-1">Archetypes</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono holo-text">Live</span>
              <span className="text-xs mt-1">Meta Data</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold font-mono holo-text">AI</span>
              <span className="text-xs mt-1">Coaching</span>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-3 mt-10 text-left">
            <div className="rounded-xl border border-border/20 bg-card/5 p-3 backdrop-blur-sm">
              <BarChart3 className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs font-medium">Meta Analysis</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Tier rankings from real tournament data</p>
            </div>
            <div className="rounded-xl border border-border/20 bg-card/5 p-3 backdrop-blur-sm">
              <Target className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs font-medium">Training Plans</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">AI-generated practice schedules</p>
            </div>
            <div className="rounded-xl border border-border/20 bg-card/5 p-3 backdrop-blur-sm">
              <BookOpen className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs font-medium">Battle Journal</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Track matches and identify patterns</p>
            </div>
            <div className="rounded-xl border border-border/20 bg-card/5 p-3 backdrop-blur-sm">
              <Bot className="h-4 w-4 text-primary mb-2" />
              <p className="text-xs font-medium">AI Coach</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Personalized strategy advice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
