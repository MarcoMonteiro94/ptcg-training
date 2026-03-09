"use client";

import { useState, useTransition, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeckCombobox } from "@/components/shared/deck-combobox";
import { createMatchLog } from "@/server/actions/journal";
import { submitParsedLog } from "@/server/actions/log-import";
import { parseTcgMastersFile, findArchetypeMatch } from "@/lib/tcg-masters-parser";
import { toast } from "sonner";
import {
  Plus, Loader2, Upload, ExternalLink, PenLine, Clipboard,
  AlertTriangle, User, Check, ChevronDown, ChevronUp, Play,
} from "lucide-react";

interface Archetype {
  id: string;
  name: string;
}

interface QuickLogDialogProps {
  archetypes: Archetype[];
}

// ─── Parse Result type (matches /api/logs/parse response) ───
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
    winnerPlayer: string | null;
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

export function QuickLogDialog({ archetypes }: QuickLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Manual tab state ───
  const [userArchetypeId, setUserArchetypeId] = useState("");
  const [opponentArchetypeId, setOpponentArchetypeId] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [wentFirst, setWentFirst] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [replayFileContent, setReplayFileContent] = useState<string | null>(null);

  // ─── Paste tab state ───
  const [logText, setLogText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showLog, setShowLog] = useState(true);
  const [overridePlayer, setOverridePlayer] = useState("");
  const [overrideOpponent, setOverrideOpponent] = useState("");
  const [overrideResult, setOverrideResult] = useState("");
  const [selectedIdentity, setSelectedIdentity] = useState<"P1" | "P2" | null>(null);
  const [resolvedCards, setResolvedCards] = useState<{ player: string[]; opponent: string[] } | null>(null);

  function openReplayViewer() {
    if (!replayFileContent) return;
    // Store in sessionStorage so the bridge page can read it
    sessionStorage.setItem("__replayContent", replayFileContent);
    // Open bridge page which sets window.__replayContent and opens TCG Masters
    window.open("/replay", "_blank");
  }

  // ─── TCG Masters JSON replay import (File button) ───
  function importTcgMastersJson(text: string) {
    try {
      const json = JSON.parse(text);
      const parsed = parseTcgMastersFile(json);

      setPlatform("tcg-masters");
      setReplayFileContent(text);

      const ownerMatch = findArchetypeMatch(parsed.ownerDeck.exPokemon, archetypes);
      const opponentMatch = findArchetypeMatch(parsed.opponentDeck.exPokemon, archetypes);

      if (ownerMatch) setUserArchetypeId(ownerMatch);
      if (opponentMatch) setOpponentArchetypeId(opponentMatch);

      const ownerHint = parsed.ownerDeck.exPokemon.join(", ") || "Unknown";
      const oppHint = parsed.opponentDeck.exPokemon.join(", ") || "Unknown";

      toast.success(
        `Imported: ${ownerHint} vs ${oppHint}`,
        { description: "Review the fields and select result" }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse TCG Masters data");
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      importTcgMastersJson(event.target?.result as string);
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Manual tab submit ───
  function handleManualSubmit(closeAfter: boolean) {
    if (!opponentArchetypeId) {
      toast.error("Opponent deck is required");
      return;
    }

    const finalNotes = notes || undefined;

    startTransition(async () => {
      const response = await createMatchLog({
        userArchetypeId: userArchetypeId || undefined,
        opponentArchetypeId,
        result,
        wentFirst: wentFirst === "" ? undefined : wentFirst === "true",
        format: "standard",
        notes: finalNotes,
        platform: platform ? (platform as "tcg-masters" | "tcg-live" | "physical") : undefined,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match logged!");
      router.refresh();

      if (closeAfter) {
        setOpen(false);
      } else {
        setOpponentArchetypeId("");
        setResult("win");
        setWentFirst("");
        setNotes("");
        setReplayFileContent(null);
      }
    });
  }

  // ─── Paste tab: parse logs ───
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
      setShowLog(false);
      setSelectedIdentity(null);

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
    const myCards = isP1 ? parseResult.parsed.playerCards : parseResult.parsed.opponentCards;
    const theirCards = isP1 ? parseResult.parsed.opponentCards : parseResult.parsed.playerCards;

    if (isP1) {
      if (parseResult.classification.playerArchetypeId) setOverridePlayer(parseResult.classification.playerArchetypeId);
      if (parseResult.classification.opponentArchetypeId) setOverrideOpponent(parseResult.classification.opponentArchetypeId);
    } else {
      if (parseResult.classification.opponentArchetypeId) setOverridePlayer(parseResult.classification.opponentArchetypeId);
      if (parseResult.classification.playerArchetypeId) setOverrideOpponent(parseResult.classification.playerArchetypeId);
    }

    const winner = parseResult.parsed.winnerPlayer;
    if (winner) {
      setOverrideResult(winner === identity ? "win" : "loss");
    }

    setResolvedCards({ player: myCards, opponent: theirCards });
  }

  // ─── Paste tab submit ───
  function handlePasteSubmit(closeAfter: boolean) {
    const finalResult = overrideResult || parseResult?.parsed.result;
    const finalOpponent = overrideOpponent || parseResult?.classification.opponentArchetypeId;

    if (!finalResult || !finalOpponent) {
      toast.error("Result and opponent archetype are required");
      return;
    }

    const detectedPlatform =
      parseResult?.parsed.source === "tcg-masters" ? "tcg-masters" as const :
      parseResult?.parsed.source === "ptcg-live" ? "tcg-live" as const :
      undefined;

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
        platform: detectedPlatform,
      });

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Match logged from game log!");
      router.refresh();

      if (closeAfter) {
        setOpen(false);
      } else {
        // Reset paste state for next log
        setLogText("");
        setParseResult(null);
        setShowLog(true);
        setOverridePlayer("");
        setOverrideOpponent("");
        setOverrideResult("");
        setSelectedIdentity(null);
        setResolvedCards(null);
      }
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
    <>
      <Button
        size="sm"
        className="holo-gradient text-background text-xs h-8 shadow-[0_0_10px_oklch(0.75_0.18_165/0.15)]"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        <span className="hidden sm:inline">Log Match</span>
        <span className="sm:hidden">New</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight">Log Match</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="mb-3 w-full">
              <TabsTrigger value="manual" className="gap-1.5 text-xs flex-1">
                <PenLine className="h-3 w-3" />
                Quick Log
              </TabsTrigger>
              <TabsTrigger value="paste" className="gap-1.5 text-xs flex-1">
                <Clipboard className="h-3 w-3" />
                Paste Game Log
              </TabsTrigger>
            </TabsList>

            {/* ─── Manual Entry Tab ─── */}
            <TabsContent value="manual">
              <div className="space-y-4">
                {/* File upload for TCG Masters JSON replay */}
                <div className="flex items-center justify-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-border/30 text-[11px] h-7 px-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    TCG Masters Replay
                  </Button>
                </div>

                {replayFileContent && (
                  <button
                    type="button"
                    onClick={openReplayViewer}
                    className="flex items-center gap-2 w-full rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                  >
                    <Play className="h-3 w-3 text-primary/60 shrink-0" />
                    <span className="text-xs text-primary/80">Watch replay on TCG Masters</span>
                    <ExternalLink className="h-3 w-3 text-primary/40 ml-auto shrink-0" />
                  </button>
                )}

                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Your Deck</Label>
                    <DeckCombobox
                      archetypes={archetypes}
                      value={userArchetypeId}
                      onValueChange={setUserArchetypeId}
                      placeholder="Select deck"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Opponent&apos;s Deck *</Label>
                    <DeckCombobox
                      archetypes={archetypes}
                      value={opponentArchetypeId}
                      onValueChange={setOpponentArchetypeId}
                      placeholder="Select deck"
                    />
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Result *</Label>
                    <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
                      <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                        <SelectItem value="draw">Draw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Went First?</Label>
                    <Select value={wentFirst} onValueChange={setWentFirst}>
                      <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                        <SelectValue placeholder="Unknown" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tcg-masters">TCG Masters</SelectItem>
                        <SelectItem value="tcg-live">TCG Live</SelectItem>
                        <SelectItem value="physical">Physical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    placeholder="Key plays, observations..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="bg-muted/20 border-border/50 resize-none text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleManualSubmit(true)}
                    disabled={isPending || !opponentArchetypeId}
                    className="flex-1 holo-gradient text-background text-xs h-9"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Close"}
                  </Button>
                  <Button
                    onClick={() => handleManualSubmit(false)}
                    disabled={isPending || !opponentArchetypeId}
                    variant="outline"
                    className="flex-1 border-border/30 text-xs h-9"
                  >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Add Another"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ─── Paste Game Log Tab ─── */}
            <TabsContent value="paste">
              <div className="space-y-4">
                {/* Parse results */}
                {parseResult && (
                  <div className="rounded-xl border border-border/50 bg-card/30 p-3 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          Detected
                        </h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[oklch(0.55_0.15_260/0.15)] text-[oklch(0.75_0.12_260)] border-[oklch(0.55_0.15_260/0.25)]">
                          {parseResult.parsed.source === "tcg-masters" ? "TCG Masters" : parseResult.parsed.source === "ptcg-live" ? "PTCG Live" : "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {confidenceBadge(parseResult.parsed.confidence, "Parse")}
                      </div>
                    </div>

                    {hasLowConfidence && (
                      <div className="flex items-start gap-2 text-xs text-[oklch(0.85_0.12_80)] bg-[oklch(0.78_0.16_80/0.1)] rounded-lg p-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Some fields have low confidence. Verify and override if needed.</span>
                      </div>
                    )}

                    {/* TCG Masters: Player identity selection */}
                    {parseResult.parsed.needsPlayerIdentity && !selectedIdentity && (
                      <div className="rounded-lg border border-[oklch(0.55_0.15_260/0.3)] bg-[oklch(0.55_0.15_260/0.05)] p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-[oklch(0.75_0.12_260)]" />
                          <h4 className="text-xs font-medium">Which player were you?</h4>
                        </div>
                        <div className="grid gap-2 grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleSelectIdentity("P1")}
                            className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-left hover:bg-muted/40 hover:border-border transition-colors space-y-1"
                          >
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Player 1</span>
                            {parseResult.parsed.playerCards.length > 0 && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {parseResult.parsed.playerCards.slice(0, 3).join(", ")}
                              </p>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectIdentity("P2")}
                            className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-left hover:bg-muted/40 hover:border-border transition-colors space-y-1"
                          >
                            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Player 2</span>
                            {parseResult.parsed.opponentCards.length > 0 && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {parseResult.parsed.opponentCards.slice(0, 3).join(", ")}
                              </p>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Detected info + overrides */}
                    {(!parseResult.parsed.needsPlayerIdentity || selectedIdentity) && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {(overrideResult || parseResult.parsed.result) && (
                            <span>Result: <strong className="text-foreground capitalize">{overrideResult || parseResult.parsed.result}</strong></span>
                          )}
                          {parseResult.parsed.wentFirst !== null && (
                            <span>First: <strong className="text-foreground">{parseResult.parsed.wentFirst ? "Yes" : "No"}</strong></span>
                          )}
                          {parseResult.parsed.turnCount > 0 && (
                            <span>Turns: <strong className="text-foreground">{parseResult.parsed.turnCount}</strong></span>
                          )}
                          {selectedIdentity && (
                            <span>You: <strong className="text-foreground">{selectedIdentity}</strong></span>
                          )}
                        </div>

                        <div className="border-t border-border/30 pt-3 space-y-3">
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                            Confirm or Override
                          </h4>

                          <div className="grid gap-3 grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Your Deck</Label>
                              <Select value={overridePlayer} onValueChange={setOverridePlayer}>
                                <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                                  <SelectValue placeholder="Select your deck" />
                                </SelectTrigger>
                                <SelectContent>
                                  {archetypes.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs">Opponent&apos;s Deck *</Label>
                              <Select value={overrideOpponent} onValueChange={setOverrideOpponent}>
                                <SelectTrigger className="bg-muted/20 border-border/50 h-9">
                                  <SelectValue placeholder="Select deck" />
                                </SelectTrigger>
                                <SelectContent>
                                  {archetypes.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="w-1/2 pr-1.5 space-y-1.5">
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

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handlePasteSubmit(true)}
                              disabled={isPending || (!overrideOpponent && !parseResult?.classification.opponentArchetypeId) || (!overrideResult && !parseResult?.parsed.result)}
                              className="flex-1 holo-gradient text-background text-xs h-9"
                            >
                              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                                <><Check className="h-3.5 w-3.5 mr-1" />Log & Close</>
                              )}
                            </Button>
                            <Button
                              onClick={() => handlePasteSubmit(false)}
                              disabled={isPending || (!overrideOpponent && !parseResult?.classification.opponentArchetypeId) || (!overrideResult && !parseResult?.parsed.result)}
                              variant="outline"
                              className="flex-1 border-border/30 text-xs h-9"
                            >
                              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Log & Add Another"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Paste area */}
                <div className="space-y-2">
                  {parseResult ? (
                    <button
                      onClick={() => setShowLog(!showLog)}
                      className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
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
                        rows={parseResult ? 3 : 6}
                        className="bg-muted/20 border-border/50 resize-none font-mono text-xs"
                      />
                      <Button
                        onClick={handleParse}
                        disabled={!logText.trim() || isParsing}
                        className="w-full holo-gradient text-background text-xs h-9"
                      >
                        {isParsing ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Parsing...</>
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
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
