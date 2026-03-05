"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 lg:hidden mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg holo-gradient">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="font-bold">TCG Trainer</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to access your training dashboard
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="trainer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full holo-gradient text-background font-semibold"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/50" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-mono">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-border/50 hover:bg-muted/50"
        onClick={handleGoogleLogin}
      >
        Continue with Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New trainer?{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create account
        </Link>
      </p>
    </div>
  );
}
