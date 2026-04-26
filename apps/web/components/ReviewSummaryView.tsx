"use client";

import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, AlertTriangle, ExternalLink } from "lucide-react";
import type { ReviewSummary } from "@/lib/types";

interface Props {
  review: ReviewSummary;
}

export default function ReviewSummaryView({ review }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-1)" }}
    >
      <div
        className="px-3 py-2"
        style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}
      >
        <p className="text-display text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {review.brand} {review.model} — Owner & Expert Reviews
        </p>
      </div>

      <div className="p-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Pros */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <ThumbsUp className="w-3 h-3" style={{ color: "var(--color-new)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--color-new)" }}>
              Pros
            </span>
          </div>
          <ul className="space-y-1">
            {review.pros.map((pro, i) => (
              <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-new)", flexShrink: 0 }}>·</span> {pro}
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <ThumbsDown className="w-3 h-3" style={{ color: "var(--color-danger)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--color-danger)" }}>
              Cons
            </span>
          </div>
          <ul className="space-y-1">
            {review.cons.map((con, i) => (
              <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "var(--color-danger)", flexShrink: 0 }}>·</span> {con}
              </li>
            ))}
          </ul>
        </div>

        {/* Red flags */}
        {review.red_flags.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <AlertTriangle className="w-3 h-3" style={{ color: "var(--color-warning)" }} />
              <span className="text-xs font-semibold" style={{ color: "var(--color-warning)" }}>
                Watch Out
              </span>
            </div>
            <ul className="space-y-1">
              {review.red_flags.map((flag, i) => (
                <li key={i} className="text-xs flex items-start gap-1" style={{ color: "var(--color-text-secondary)" }}>
                  <span style={{ color: "var(--color-warning)", flexShrink: 0 }}>⚠</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Excerpts */}
      {review.excerpts.length > 0 && (
        <div
          className="px-3 py-2 space-y-2"
          style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-2)" }}
        >
          {review.excerpts.slice(0, 2).map((ex, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-lg leading-tight" style={{ color: "var(--color-amber)" }}>&ldquo;</span>
              <div>
                <p className="text-xs italic" style={{ color: "var(--color-text-secondary)" }}>
                  {ex.snippet}
                </p>
                <a
                  href={ex.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-xs mt-0.5 hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Source <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
