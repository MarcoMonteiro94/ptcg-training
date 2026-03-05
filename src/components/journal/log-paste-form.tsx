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
import { Clipboard, Loader2, Check, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

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

      // Pre-fill overrides from parsed data
      if (data.classification.playerArchetypeId) {
        setOverridePlayer(data.classification.playerArchetypeId);
      }
      if (data.classification.opponentArchetypeId) {
        setOverrideOpponent(data.classification.opponentArchetypeId);
      }
      if (data.parsed.result) {
        setOverrideResult(data.parsed.result);
      }
    } catch {
      toast.error("Failed to parse log");
    } finally {
      setIsParsing(false);
    }
  }

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
        wentFirst: parseResult?.parsed.wentFirst ?? undefined,
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
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Detected Match Data
            </h3>
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

          {/* Detected info */}
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
                {parseResult.parsed.playerCards.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Key cards: {parseResult.parsed.playerCards.slice(0, 6).join(", ")}
                    {parseResult.parsed.playerCards.length > 6 && ` +${parseResult.parsed.playerCards.length - 6} more`}
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
                {parseResult.parsed.opponentCards.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Key cards: {parseResult.parsed.opponentCards.slice(0, 6).join(", ")}
                    {parseResult.parsed.opponentCards.length > 6 && ` +${parseResult.parsed.opponentCards.length - 6} more`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {parseResult.parsed.result && (
                <span>
                  Result: <strong className="text-foreground capitalize">{parseResult.parsed.result}</strong>
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
              {parseResult.parsed.playerName && (
                <span>
                  Player: <strong className="text-foreground">{parseResult.parsed.playerName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Override section */}
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
              placeholder="Paste your PTCG Live game log here..."
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
