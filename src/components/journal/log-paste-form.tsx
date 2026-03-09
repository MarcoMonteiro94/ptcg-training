"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitParsedLog } from "@/server/actions/log-import";
import { toast } from "sonner";
import { Clipboard, Loader2, Check, AlertTriangle, ChevronDown, ChevronUp, User } from "lucide-react";

interface Archetype {
  id: string;
  name: string;
}

interface LogPasteFormProps {
  archetypes: Archetype[];
}

interface ParseResult {
  parsed: {
    playerName: string | null;
    opponentName: string | null;
    result: "win" | "loss" | "draw" | null;
    wentFirst: boolean | null;
    turnCount: number;
    playerCards: string[];
    opponentCards: string[];
    confidence: number;
    source: "ptcg-live" | "tcg-masters" | "unknown";
    needsPlayerIdentity: boolean;
    winnerPlayer: string | null; // "P1" or "P2" for TCG Masters
  };
  classification: {
    playerArchetypeId: string | null;
    playerArchetypeName: string | null;
    playerConfidence: number;
    opponentArchetypeId: string | null;
    opponentArchetypeName: string | null;
    opponentConfidence: number;
  };
}

export function LogPasteForm({ archetypes }: LogPasteFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [logText, setLogText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showLog, setShowLog] = useState(true);

  // Override state for manual corrections
  const [overridePlayer, setOverridePlayer] = useState("");
  const [overrideOpponent, setOverrideOpponent] = useState("");
  const [overrideResult, setOverrideResult] = useState("");

  // TCG Masters player identity state
  const [selectedIdentity, setSelectedIdentity] = useState<"P1" | "P2" | null>(null);

  async function handleParse() {
    if (!logText.trim()) return;

    setIsParsing(true);
    setParseResult(null);

    try {
      const response = await fetch("/api/logs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logText }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to parse log");
        return;
      }

      const data = await response.json() as ParseResult;
      setParseResult(data);
      setShowLog(false); // Collapse log after parsing

      // Reset identity selection for new parse
      setSelectedIdentity(null);

      // Pre-fill overrides from parsed data (only for non-TCG Masters)
      if (!data.parsed.needsPlayerIdentity) {
        if (data.classification.playerArchetypeId) {
          setOverridePlayer(data.classification.playerArchetypeId);
        }
        if (data.classification.opponentArchetypeId) {
          setOverrideOpponent(data.classification.opponentArchetypeId);
        }
        if (data.parsed.result) {
          setOverrideResult(data.parsed.result);
        }
      }
    } catch {
      toast.error("Failed to parse log");
    } finally {
      setIsParsing(false);
    }
  }

  function handleSelectIdentity(identity: "P1" | "P2") {
    if (!parseResult) return;
    setSelectedIdentity(identity);

    const isP1 = identity === "P1";
    // Resolve player/opponent cards based on identity
    // parseResult.parsed.playerCards = P1's cards, opponentCards = P2's cards
    const myCards = isP1 ? parseResult.parsed.playerCards : parseResult.parsed.opponentCards;
    const theirCards = isP1 ? parseResult.parsed.opponentCards : parseResult.parsed.playerCards;

    // Re-classify with resolved cards to pre-fill archetypes
    // For now, use the existing classification but swap if needed
    if (isP1) {
      if (parseResult.classification.playerArchetypeId) {
        setOverridePlayer(parseResult.classification.playerArchetypeId);
      }
      if (parseResult.classification.opponentArchetypeId) {
        setOverrideOpponent(parseResult.classification.opponentArchetypeId);
      }
    } else {
      // User is P2, so swap: P2's classification becomes "player"
      if (parseResult.classification.opponentArchetypeId) {
        setOverridePlayer(parseResult.classification.opponentArchetypeId);
      }
      if (parseResult.classification.playerArchetypeId) {
        setOverrideOpponent(parseResult.classification.playerArchetypeId);
      }
    }

    // Resolve result from winnerPlayer
    const winner = parseResult.parsed.winnerPlayer;
    if (winner) {
      const won = winner === identity;
      setOverrideResult(won ? "win" : "loss");
    }

    // Store resolved cards for display
    setResolvedCards({ player: myCards, opponent: theirCards });
  }

  const [resolvedCards, setResolvedCards] = useState<{ player: string[]; opponent: string[] } | null>(null);

  function handleSubmit() {
    const finalResult = overrideResult || parseResult?.parsed.result;
    const finalOpponent = overrideOpponent || parseResult?.classification.opponentArchetypeId;

    if (!finalResult || !finalOpponent) {
      toast.error("Result and opponent archetype are required");
      return;
    }

    startTransition(async () => {
      const response = await submitParsedLog({
        userArchetypeId: overridePlayer || parseResult?.classification.playerArchetypeId || undefined,
        opponentArchetypeId: finalOpponent,
        result: finalResult as "win" | "loss" | "draw",
        wentFirst: parseResult?.parsed.wentFirst ?? (parseResult?.parsed.needsPlayerIdentity && selectedIdentity
          ? undefined // TCG Masters doesn't reliably track who went first
          : undefined),
        format: "standard",
        notes: parseResult
          ? `Imported from game log. Turns: ${parseResult.parsed.turnCount}. Parse confidence: ${Math.round(parseResult.parsed.confidence * 100)}%`
          : undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match logged from game log!");
      router.push("/journal");
    });
  }

  function confidenceBadge(confidence: number, label: string) {
    const color =
      confidence >= 0.8 ? "bg-[oklch(0.72_0.19_155/0.15)] text-[oklch(0.80_0.15_155)] border-[oklch(0.72_0.19_155/0.25)]" :
      confidence >= 0.5 ? "bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.85_0.12_80)] border-[oklch(0.78_0.16_80/0.25)]" :
      "bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.80_0.15_25)] border-[oklch(0.65_0.22_25/0.25)]";

    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${color}`}>
        {label}: {Math.round(confidence * 100)}%
      </Badge>
    );
  }

  const hasLowConfidence = parseResult && (
    parseResult.classification.playerConfidence < 0.8 ||
    parseResult.classification.opponentConfidence < 0.8 ||
    parseResult.parsed.confidence < 0.7
  );

  return (
    <div className="space-y-4">
      {/* Parse results preview — shown ABOVE the log when available */}
      {parseResult && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Detected Match Data
              </h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[oklch(0.55_0.15_260/0.15)] text-[oklch(0.75_0.12_260)] border-[oklch(0.55_0.15_260/0.25)]">
                {parseResult.parsed.source === "tcg-masters" ? "TCG Masters" : parseResult.parsed.source === "ptcg-live" ? "PTCG Live" : "Unknown"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {confidenceBadge(parseResult.parsed.confidence, "Parse")}
              {parseResult.classification.playerArchetypeId && confidenceBadge(parseResult.classification.playerConfidence, "Your Deck")}
              {parseResult.classification.opponentArchetypeId && confidenceBadge(parseResult.classification.opponentConfidence, "Opponent")}
            </div>
          </div>

          {hasLowConfidence && (
            <div className="flex items-start gap-2 text-sm text-[oklch(0.85_0.12_80)] bg-[oklch(0.78_0.16_80/0.1)] rounded-lg p-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Some fields have low confidence. Please verify the detected values and override if needed.</span>
            </div>
          )}

          {/* TCG Masters: Player identity selection */}
          {parseResult.parsed.needsPlayerIdentity && !selectedIdentity && (
            <div className="rounded-lg border border-[oklch(0.55_0.15_260/0.3)] bg-[oklch(0.55_0.15_260/0.05)] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[oklch(0.75_0.12_260)]" />
                <h4 className="text-sm font-medium">Which player were you?</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                TCG Masters logs use P1/P2 identifiers. Select which player you were to resolve the match result.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSelectIdentity("P1")}
                  className="rounded-lg border border-border/50 bg-muted/20 p-3 text-left hover:bg-muted/40 hover:border-border transition-colors space-y-1.5"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Player 1</span>
                  {parseResult.parsed.playerCards.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cards: {parseResult.parsed.playerCards.slice(0, 5).join(", ")}
                      {parseResult.parsed.playerCards.length > 5 && ` +${parseResult.parsed.playerCards.length - 5}`}
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectIdentity("P2")}
                  className="rounded-lg border border-border/50 bg-muted/20 p-3 text-left hover:bg-muted/40 hover:border-border transition-colors space-y-1.5"
                >
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Player 2</span>
                  {parseResult.parsed.opponentCards.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Cards: {parseResult.parsed.opponentCards.slice(0, 5).join(", ")}
                      {parseResult.parsed.opponentCards.length > 5 && ` +${parseResult.parsed.opponentCards.length - 5}`}
                    </p>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Detected info — show after identity resolved (or immediately for PTCG Live) */}
          {(!parseResult.parsed.needsPlayerIdentity || selectedIdentity) && (
          <div className="grid gap-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Your Deck
                  </span>
                  {parseResult.classification.playerArchetypeId
                    ? confidenceBadge(parseResult.classification.playerConfidence, "Match")
                    : <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.80_0.15_25)]">Not detected</Badge>
                  }
                </div>
                <p className="font-medium">
                  {parseResult.classification.playerArchetypeName || "Unknown"}
                </p>
                {(resolvedCards?.player ?? parseResult.parsed.playerCards).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Key cards: {(resolvedCards?.player ?? parseResult.parsed.playerCards).slice(0, 6).join(", ")}
                    {(resolvedCards?.player ?? parseResult.parsed.playerCards).length > 6 && ` +${(resolvedCards?.player ?? parseResult.parsed.playerCards).length - 6} more`}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/20 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Opponent&apos;s Deck
                  </span>
                  {parseResult.classification.opponentArchetypeId
                    ? confidenceBadge(parseResult.classification.opponentConfidence, "Match")
                    : <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[oklch(0.65_0.22_25/0.15)] text-[oklch(0.80_0.15_25)]">Not detected</Badge>
                  }
                </div>
                <p className="font-medium">
                  {parseResult.classification.opponentArchetypeName || "Unknown"}
                </p>
                {(resolvedCards?.opponent ?? parseResult.parsed.opponentCards).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Key cards: {(resolvedCards?.opponent ?? parseResult.parsed.opponentCards).slice(0, 6).join(", ")}
                    {(resolvedCards?.opponent ?? parseResult.parsed.opponentCards).length > 6 && ` +${(resolvedCards?.opponent ?? parseResult.parsed.opponentCards).length - 6} more`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {(overrideResult || parseResult.parsed.result) && (
                <span>
                  Result: <strong className="text-foreground capitalize">{overrideResult || parseResult.parsed.result}</strong>
                </span>
              )}
              {parseResult.parsed.wentFirst !== null && (
                <span>
                  Went first: <strong className="text-foreground">{parseResult.parsed.wentFirst ? "Yes" : "No"}</strong>
                </span>
              )}
              {parseResult.parsed.turnCount > 0 && (
                <span>
                  Turns: <strong className="text-foreground">{parseResult.parsed.turnCount}</strong>
                </span>
              )}
              {selectedIdentity && (
                <span>
                  You were: <strong className="text-foreground">{selectedIdentity}</strong>
                </span>
              )}
              {!selectedIdentity && parseResult.parsed.playerName && (
                <span>
                  Player: <strong className="text-foreground">{parseResult.parsed.playerName}</strong>
                </span>
              )}
            </div>
          </div>
          )}

          {/* Override section — only show after identity is resolved */}
          {(!parseResult.parsed.needsPlayerIdentity || selectedIdentity) && (
          <div className="border-t border-border/30 pt-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Confirm or Override
            </h4>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Your Deck</Label>
                <Select value={overridePlayer} onValueChange={setOverridePlayer}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue placeholder="Select your deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {archetypes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Opponent&apos;s Deck *</Label>
                <Select value={overrideOpponent} onValueChange={setOverrideOpponent}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue placeholder="Select opponent deck" />
                  </SelectTrigger>
                  <SelectContent>
                    {archetypes.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Result *</Label>
                <Select value={overrideResult} onValueChange={setOverrideResult}>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                    <SelectValue placeholder="Select result" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isPending || (!overrideOpponent && !parseResult?.classification.opponentArchetypeId) || (!overrideResult && !parseResult?.parsed.result)}
              className="w-full sm:w-auto holo-gradient text-background"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm & Save
                </>
              )}
            </Button>
          </div>
          )}
        </div>
      )}

      {/* Paste area — collapsible after parse */}
      <div className="space-y-2">
        {parseResult ? (
          <button
            onClick={() => setShowLog(!showLog)}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clipboard className="h-3 w-3" />
            Game Log
            {showLog ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        ) : (
          <Label className="text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <Clipboard className="h-3 w-3" />
            Paste Game Log
          </Label>
        )}
        {showLog && (
          <>
            <Textarea
              placeholder="Paste your PTCG Live or TCG Masters game log here..."
              value={logText}
              onChange={(e) => {
                setLogText(e.target.value);
                setParseResult(null);
                setShowLog(true);
              }}
              rows={parseResult ? 4 : 8}
              className="bg-muted/20 border-border/50 resize-none font-mono text-xs"
            />
            <Button
              onClick={handleParse}
              disabled={!logText.trim() || isParsing}
              className="w-full sm:w-auto holo-gradient text-background"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : parseResult ? (
                "Re-parse Log"
              ) : (
                "Parse Log"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
