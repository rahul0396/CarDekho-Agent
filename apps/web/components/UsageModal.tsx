"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Activity, AlertCircle } from "lucide-react";
import type { UsageResponse } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  usage: UsageResponse;
}

function ProgressBar({ pct, color, label, used, limit, unit = "" }: {
  pct: number; color: string; label: string; used: number; limit: number; unit?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <span style={{ color: "var(--color-text-primary)" }} className="text-price">
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-surface-3)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
        {Math.round(pct)}% used
      </p>
    </div>
  );
}

function getResetCountdown(resetAt: string): string {
  const diff = new Date(resetAt).getTime() - Date.now();
  if (diff <= 0) return "soon";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function UsageModal({ open, onClose, usage }: Props) {
  const { session } = usage;
  const maxPct = Math.max(
    session.percent_used.runs,
    session.percent_used.input_tokens,
    session.percent_used.output_tokens
  );
  const barColor = maxPct >= 85 ? "var(--color-danger)" : maxPct >= 60 ? "var(--color-warning)" : "var(--color-new)";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 right-4 z-50 w-80 rounded-2xl overflow-hidden"
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-float)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}
            >
              <Activity className="w-4 h-4" style={{ color: "var(--color-amber)" }} />
              <h2 className="text-display text-sm font-bold flex-1" style={{ color: "var(--color-text-primary)" }}>
                Daily Usage
              </h2>
              <button onClick={onClose} className="p-1 rounded-md hover:opacity-60 transition-opacity">
                <X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Warning if near limit */}
              {maxPct >= 80 && (
                <div
                  className="flex items-start gap-2 p-2.5 rounded-lg"
                  style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-warning)" }} />
                  <p className="text-xs" style={{ color: "var(--color-warning)" }}>
                    {maxPct >= 100
                      ? "Daily limit reached. Resets in " + getResetCountdown(session.reset_at) + "."
                      : "Approaching daily limit. Use wisely — resets in " + getResetCountdown(session.reset_at) + "."}
                  </p>
                </div>
              )}

              {/* Progress bars */}
              <ProgressBar
                pct={session.percent_used.runs}
                color={barColor}
                label="Messages"
                used={session.used.runs}
                limit={session.limits.runs}
              />
              <ProgressBar
                pct={session.percent_used.input_tokens}
                color={barColor}
                label="Input tokens"
                used={session.used.input_tokens}
                limit={session.limits.input_tokens}
              />
              <ProgressBar
                pct={session.percent_used.output_tokens}
                color={barColor}
                label="Output tokens"
                used={session.used.output_tokens}
                limit={session.limits.output_tokens}
              />

              {/* Cost estimate */}
              <div
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: "var(--color-surface-2)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3" style={{ color: "var(--color-amber)" }} />
                  <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Est. cost today
                  </span>
                </div>
                <span className="text-price text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  ${session.used.cost_usd_estimate.toFixed(4)}
                </span>
              </div>

              {/* Reset time */}
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                Resets in {getResetCountdown(session.reset_at)} · Limits keep this service free for everyone
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
