import { Zap } from "lucide-react";

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
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl holo-gradient mb-6">
            <Zap className="h-8 w-8 text-background" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            TCG Trainer
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
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
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
