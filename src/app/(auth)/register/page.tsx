"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/login?message=Check your email to confirm your account");
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
        <h2 className="text-2xl font-bold tracking-tight">Create account</h2>
        <p className="text-sm text-muted-foreground">
          Start your competitive training journey
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Trainer Name
          </Label>
          <Input
            id="displayName"
            placeholder="Your trainer name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary"
            required
          />
        </div>
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
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-muted/50 border-border/50 focus:border-primary"
            minLength={6}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full holo-gradient text-background font-semibold"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
