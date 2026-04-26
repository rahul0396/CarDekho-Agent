"use client";

import { useState } from "react";
import type { UsageResponse } from "@/lib/types";
import UsageModal from "./UsageModal";

interface Props {
  usage: UsageResponse | null;
}

export default function UsageChip({ usage }: Props) {
  const [open, setOpen] = useState(false);

  if (!usage) return null;

  const pct = usage.session.percent_used.runs;
  const color =
    pct >= 85 ? "var(--color-danger)" :
    pct >= 60 ? "var(--color-warning)" :
    "var(--color-new)";
  const bg =
    pct >= 85 ? "rgba(239,68,68,0.12)" :
    pct >= 60 ? "rgba(245,158,11,0.12)" :
    "rgba(16,185,129,0.12)";

  /* SVG ring */
  const r = 7;
  const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
        style={{ background: bg, border: `1px solid ${color}44`, color }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r={r} fill="none" stroke={color} strokeWidth="2.5" opacity="0.2" />
          <circle
            cx="10"
            cy="10"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={circ}
            strokeDashoffset={dash}
            strokeLinecap="round"
            transform="rotate(-90 10 10)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <span>Usage: {Math.round(pct)}%</span>
      </button>

      <UsageModal open={open} onClose={() => setOpen(false)} usage={usage} />
    </>
  );
}
