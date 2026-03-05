"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { Send, Square, Trash2, Bot, User, Sparkles, BookOpen, History, Plus, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";

const suggestions = [
  "What are my worst matchups and how can I improve them?",
  "What tech cards should I consider for the current meta?",
  "Analyze my recent match history and identify patterns.",
];

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ChatInterfaceProps {
  archetypes?: Array<{ id: string; name: string }>;
}

export function ChatInterface({ archetypes = [] }: ChatInterfaceProps) {
  const [studyMode, setStudyMode] = useState(false);
  const [studyArchetypeId, setStudyArchetypeId] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { messages, isStreaming, error, conversationId, sendMessage, stopStreaming, clearChat, loadConversation } =
    useCoachChat({
      mode: studyMode ? "study" : "general",
      matchupArchetypeId: studyMode ? studyArchetypeId : undefined,
    });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/coach/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  function handleShowHistory() {
    setShowHistory(true);
    fetchConversations();
  }

  async function handleLoadConversation(convId: string) {
    await loadConversation(convId);
    setShowHistory(false);
  }

  function handleNewChat() {
    clearChat();
    setShowHistory(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)] sm:h-[calc(100vh-12rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg holo-gradient shrink-0 shadow-[0_0_10px_oklch(0.75_0.18_165/0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-background" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium text-sm">AI Coach</span>
            <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:inline">
              {isStreaming ? "thinking..." : "ready"}
            </span>
            {studyMode && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-[oklch(0.78_0.16_80/0.1)] text-[oklch(0.78_0.16_80)] border-[oklch(0.78_0.16_80/0.2)]">
                <BookOpen className="h-2.5 w-2.5 mr-1" />
                Study
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowHistory}
            className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
          >
            <History className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">History</span>
          </Button>
          <Button
            variant={studyMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setStudyMode(!studyMode)}
            className={cn(
              "text-xs h-7 px-2",
              studyMode
                ? "bg-[oklch(0.78_0.16_80/0.15)] text-[oklch(0.78_0.16_80)] hover:bg-[oklch(0.78_0.16_80/0.25)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="h-3 w-3 sm:mr-1" />
            <span className="hidden sm:inline">Study</span>
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
            >
              <Trash2 className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Study mode archetype selector */}
      {studyMode && archetypes.length > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground/60">Studying:</span>
          <Select value={studyArchetypeId} onValueChange={setStudyArchetypeId}>
            <SelectTrigger className="flex-1 sm:w-[200px] sm:flex-none h-8 text-xs bg-muted/20 border-border/40">
              <SelectValue placeholder="Select matchup" />
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
      )}

      {/* Chat area or history panel */}
      {showHistory ? (
        <div className="flex-1 overflow-hidden rounded-xl border border-border/30 glass-card">
          <div className="p-3 sm:p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setShowHistory(false)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to chat
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="text-xs h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                New Chat
              </Button>
            </div>
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
              Previous Conversations
            </h3>
            <ScrollArea className="flex-1">
              {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No previous conversations.
                </p>
              ) : (
                <div className="space-y-1">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv.id)}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/20 border border-transparent",
                        conv.id === conversationId && "border-primary/20 bg-primary/5"
                      )}
                    >
                      <p className="text-sm truncate">
                        {conv.title || "Untitled conversation"}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground/50 mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden rounded-xl border border-border/30 glass-card">
          <ScrollArea className="h-full p-3 sm:p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/20 mb-4">
                  <Bot className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium mb-1">Ready to coach</p>
                <p className="text-xs text-muted-foreground/60 max-w-sm mb-6">
                  Ask about matchups, tech choices, gameplay strategies, or
                  anything related to competitive Pokemon TCG.
                </p>
                <div className="grid gap-2 w-full max-w-md">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-lg border border-border/30 bg-muted/10 p-3 text-left text-xs sm:text-sm text-muted-foreground hover:bg-muted/25 hover:text-foreground hover:border-primary/15 transition-all duration-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-2.5 animate-fade-in",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md holo-gradient mt-0.5">
                        <Bot className="h-3 w-3 text-background" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 max-w-[88%] sm:max-w-[80%]",
                        msg.role === "user"
                          ? "bg-primary/10 text-foreground border border-primary/15 text-sm leading-relaxed whitespace-pre-wrap"
                          : "bg-muted/20 border border-border/20"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        msg.content ? (
                          <MarkdownMessage content={msg.content} />
                        ) : isStreaming ? (
                          <span className="text-sm text-muted-foreground animate-pulse">...</span>
                        ) : null
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/30 mt-0.5">
                        <User className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Input area */}
      {!showHistory && (
        <form onSubmit={handleSubmit} className="mt-2.5 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            rows={1}
            className="min-h-[40px] max-h-[100px] resize-none bg-muted/15 border-border/30 focus:border-primary/40 text-sm"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stopStreaming}
              className="shrink-0 h-10 w-10 border-border/30"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="shrink-0 h-10 w-10 holo-gradient text-background disabled:opacity-20 shadow-[0_0_12px_oklch(0.75_0.18_165/0.15)]"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      )}
    </div>
  );
}
