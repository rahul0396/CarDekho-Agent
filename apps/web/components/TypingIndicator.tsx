"use client";

import { motion } from "framer-motion";

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}
    >
      <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
        Thinking
      </span>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: "var(--color-amber)" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
