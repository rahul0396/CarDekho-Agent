"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import type {
  ChatMessage,
  ActiveToolCall,
  BuyerProfile,
  ShortlistEntry,
  UsageResponse,
  Listing,
} from "@/lib/types";
import { getSessionId } from "@/lib/session";
import { createChatStream, fetchShortlist, fetchUsage, submitUserInput } from "@/lib/api";
import { readSSEStream, extractRichPayload } from "@/lib/stream";

import Message from "./Message";
import TypingIndicator from "./TypingIndicator";
import SearchPillRow from "./SearchPill";
import PreferencesChip from "./PreferencesChip";
import UsageChip from "./UsageChip";
import ShortlistDrawer from "./ShortlistDrawer";
import { EMIInputPanel } from "./EMIPanel";

function nanoid(): string {
  return Math.random().toString(36).slice(2, 11);
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{
    id: nanoid(),
    role: "assistant",
    content: "Namaste! 🙏 I'm your CarDekho AI Advisor. Tell me what kind of car you're looking for — budget, type, new or used — and I'll find the best options from CarDekho, Cars24, and Spinny.",
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ActiveToolCall[]>([]);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile>({});
  const [shortlist, setShortlist] = useState<ShortlistEntry[]>([]);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [pendingHITL, setPendingHITL] = useState<{ runId: string } | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const sessionId = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const rateLimitTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── init session ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    sessionId.current = getSessionId();
    void (async () => {
      const [sl, u] = await Promise.all([
        fetchShortlist(sessionId.current),
        fetchUsage(sessionId.current),
      ]);
      setShortlist(sl.entries);
      setUsage(u);
    })();

  }, []);

  /* ── scroll management ────────────────────────────────────────────────────── */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!showScrollBtn) scrollToBottom();
  }, [messages, streaming, showScrollBtn, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  /* ── rate limit countdown ─────────────────────────────────────────────────── */
  useEffect(() => {
    return () => {
      if (rateLimitTimer.current) clearInterval(rateLimitTimer.current);
    };
  }, []);

  const startRateLimitCountdown = (seconds: number) => {
    setRateLimitCountdown(seconds);
    rateLimitTimer.current = setInterval(() => {
      setRateLimitCountdown((prev) => {
        if (prev <= 1) {
          if (rateLimitTimer.current) clearInterval(rateLimitTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /* ── send message ─────────────────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || streaming || rateLimitCountdown > 0) return;

    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const assistantId = nanoid();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);
    setActiveToolCalls([]);

    try {
      const response = await createChatStream(text, sessionId.current);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      let fullText = "";

      for await (const event of readSSEStream(response)) {
        switch (event.type) {
          case "token":
            fullText += event.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullText, streaming: true } : m
              )
            );
            break;

          case "tool_call_started": {
            const callId = nanoid();
            setActiveToolCalls((prev) => [
              ...prev,
              { id: callId, member: event.member, tool: event.tool, status: "running" },
            ]);
            break;
          }

          case "tool_call_finished":
            setActiveToolCalls((prev) =>
              prev.map((c) =>
                c.tool === event.tool && c.member === event.member
                  ? { ...c, status: "done", result_snippet: event.result.slice(0, 30) }
                  : c
              )
            );
            // Refresh shortlist if a shortlist tool just ran
            if (event.tool.includes("shortlist")) {
              void fetchShortlist(sessionId.current).then((sl) => setShortlist(sl.entries));
            }
            // Update buyer profile if preference tool ran
            if (event.tool === "set_preference") {
              try {
                const kv = event.result.match(/(\w+)\s*=\s*(.+)/);
                if (kv && kv[1] && kv[2]) {
                  setBuyerProfile((prev) => ({ ...prev, [kv[1] as string]: kv[2] }));
                }
              } catch { /* non-critical */ }
            }
            break;

          case "user_input_required":
            setPendingHITL({ runId: event.run_id });
            setStreaming(false);
            break;

          case "quota_exceeded":
          case "service_busy":
            toast.error(event.message, { duration: 6000 });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: event.message, streaming: false }
                  : m
              )
            );
            setStreaming(false);
            break;

          case "rate_limited":
            toast.warning(event.message);
            startRateLimitCountdown(event.retry_after);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId));
            setStreaming(false);
            break;

          case "run_completed": {
            const { clean, payload } = extractRichPayload(fullText);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: clean || fullText,
                      streaming: false,
                      ...(payload ? { rich_payload: { type: payload.type as ChatMessage["rich_payload"] extends undefined ? never : NonNullable<ChatMessage["rich_payload"]>["type"], data: payload.data as NonNullable<ChatMessage["rich_payload"]>["data"] } } : {}),
                    }
                  : m
              )
            );
            setStreaming(false);
            // Refresh usage after every completed run
            void fetchUsage(sessionId.current).then(setUsage);
            break;
          }

          case "run_error":
            toast.error(event.message);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: "Sorry, something went wrong. Please try again.", streaming: false }
                  : m
              )
            );
            setStreaming(false);
            break;
        }
      }

      // Final cleanup if stream ended without run_completed
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m))
      );
      setStreaming(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Connection failed";
      toast.error(`Error: ${errorMsg}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Connection error. Please try again.", streaming: false }
            : m
        )
      );
      setStreaming(false);
    } finally {
      setActiveToolCalls([]);
    }
  }, [streaming, rateLimitCountdown]);

  /* ── HITL submit ──────────────────────────────────────────────────────────── */
  const handleHITLSubmit = async (data: Record<string, string>) => {
    if (!pendingHITL) return;
    setPendingHITL(null);
    setStreaming(true);
    await submitUserInput(pendingHITL.runId, sessionId.current, data);
    // Response will continue on the existing stream — for v1, trigger a new message
    void sendMessage(`EMI parameters: tenure=${data["tenure_months"]}mo, down payment=${data["down_payment_pct"]}%, interest=${data["interest_override"] ?? "default"}`);
  };

  /* ── keyboard shortcut ────────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const isLimitHit = (usage?.session.percent_used.runs ?? 0) >= 100;
  const canSend = !streaming && !isLimitHit && rateLimitCountdown === 0 && input.trim().length > 0;

  /* ── shortlist handlers ───────────────────────────────────────────────────── */
  const handleShortlist = (listing: Listing) => {
    toast.success(`Added ${listing.brand} ${listing.model} to shortlist ✓`);
    void sendMessage(`Please add to my shortlist: ${listing.brand} ${listing.model} ${listing.year}, ₹${listing.price_inr}, from ${listing.source}`);
  };
  const handleEMI = (listing: Listing) => {
    void sendMessage(`Show me EMI for ${listing.brand} ${listing.model} (${listing.condition}, ₹${listing.price_inr})`);
  };
  const handleCompare = (listing: Listing) => {
    void sendMessage(`Compare ${listing.brand} ${listing.model} with the other cars I've seen`);
  };

  return (
    <div className="flex h-full">
      {/* ── Left: Chat panel ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-4 py-2.5 shrink-0"
          style={{ background: "var(--color-surface-1)", borderBottom: "1px solid var(--color-border)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--color-amber-glow)", border: "1px solid var(--color-amber-dim)" }}
            >
              <span className="text-display text-xs font-black" style={{ color: "var(--color-amber)" }}>
                CD
              </span>
            </div>
            <div>
              <h1 className="text-display text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                CarDekho Agent
              </h1>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                AI Car Advisor
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <UsageChip usage={usage} />
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: shortlist.length > 0 ? "var(--color-amber-glow)" : "var(--color-surface-2)",
                border: `1px solid ${shortlist.length > 0 ? "var(--color-amber-dim)" : "var(--color-border)"}`,
                color: shortlist.length > 0 ? "var(--color-amber)" : "var(--color-text-secondary)",
              }}
            >
              Shortlist
              {shortlist.length > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--color-amber)", color: "#0A0B0E" }}>
                  {shortlist.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Preferences chip */}
        <PreferencesChip profile={buyerProfile} />

        {/* Messages */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.map((msg) => (
            <Message
              key={msg.id}
              message={msg}
              onShortlist={handleShortlist}
              onEMI={handleEMI}
              onCompare={handleCompare}
            />
          ))}

          {/* Tool call pills — shown while streaming */}
          {streaming && activeToolCalls.length > 0 && (
            <div className="flex flex-col gap-1">
              <SearchPillRow calls={activeToolCalls} />
            </div>
          )}

          {/* Typing indicator — before first token */}
          <AnimatePresence>
            {streaming && activeToolCalls.length === 0 && (
              <TypingIndicator key="typing" />
            )}
          </AnimatePresence>

          {/* HITL EMI form */}
          <AnimatePresence>
            {pendingHITL && (
              <motion.div
                key="hitl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <EMIInputPanel
                  runId={pendingHITL.runId}
                  onSubmit={handleHITLSubmit}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom button */}
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              key="scroll-btn"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => { scrollToBottom(); setShowScrollBtn(false); }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
              style={{ background: "var(--color-surface-3)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Latest
            </motion.button>
          )}
        </AnimatePresence>

        {/* Composer */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-1)" }}
        >
          {isLimitHit && (
            <div
              className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg text-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-danger)" }}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Daily limit reached. Resets at midnight UTC.
            </div>
          )}

          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{
              background: "var(--color-surface-2)",
              border: `1px solid ${streaming || isLimitHit ? "var(--color-border)" : "var(--color-border)"}`,
              opacity: isLimitHit ? 0.6 : 1,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                rateLimitCountdown > 0
                  ? `Too fast — try again in ${rateLimitCountdown}s`
                  : isLimitHit
                  ? "Daily limit reached"
                  : "Ask about any car, budget, or requirement…"
              }
              disabled={streaming || isLimitHit || rateLimitCountdown > 0}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm outline-none"
              style={{
                color: "var(--color-text-primary)",
                caretColor: "var(--color-amber)",
                maxHeight: 120,
                lineHeight: 1.5,
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={() => void sendMessage(input)}
              disabled={!canSend}
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: canSend ? "var(--color-amber)" : "var(--color-surface-3)",
                opacity: canSend ? 1 : 0.5,
              }}
              title="Send (Enter)"
            >
              <Send className="w-3.5 h-3.5" style={{ color: canSend ? "#0A0B0E" : "var(--color-text-muted)" }} />
            </button>
          </div>

          <p className="text-xs text-center mt-1.5" style={{ color: "var(--color-text-muted)" }}>
            Shift+Enter for new line · Powered by Claude AI
          </p>
        </div>
      </div>

      {/* ── Right: Shortlist drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="drawer"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 overflow-hidden"
            style={{ minHeight: 0 }}
          >
            <ShortlistDrawer
              entries={shortlist}
              onRemove={(i) => {
                void sendMessage(`Remove car number ${i + 1} from my shortlist`);
              }}
              className="h-full w-[300px]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}