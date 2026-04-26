"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ListChecks, X } from "lucide-react";
import type { ShortlistEntry } from "@/lib/types";
import SummaryCard from "./SummaryCard";

interface Props {
  entries: ShortlistEntry[];
  onRemove?: (index: number) => void;
  className?: string;
}

export default function ShortlistDrawer({ entries, onRemove, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col h-full ${className}`}
      style={{ background: "var(--color-surface-1)", borderLeft: "1px solid var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}
      >
        <ListChecks className="w-4 h-4" style={{ color: "var(--color-amber)" }} />
        <h2 className="text-display text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          My Shortlist
        </h2>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: "var(--color-amber-glow)", color: "var(--color-amber)" }}
        >
          {entries.length}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 gap-3"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-surface-2)" }}
              >
                <ListChecks className="w-6 h-6" style={{ color: "var(--color-text-muted)" }} />
              </div>
              <p className="text-xs text-center max-w-[160px]" style={{ color: "var(--color-text-muted)" }}>
                Cars you shortlist will appear here
              </p>
            </motion.div>
          ) : (
            entries.map((entry, i) => (
              <motion.div
                key={`${entry.listing.brand}-${entry.listing.model}-${i}`}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <SummaryCard listing={entry.listing} index={i} isShortlisted />
                {onRemove && (
                  <button
                    onClick={() => onRemove(i)}
                    className="absolute top-1 right-8 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "var(--color-surface-3)" }}
                    title="Remove from shortlist"
                  >
                    <X className="w-3 h-3" style={{ color: "var(--color-danger)" }} />
                  </button>
                )}
                {entry.notes && (
                  <p className="text-xs mt-1 px-1 italic" style={{ color: "var(--color-text-muted)" }}>
                    {entry.notes}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
