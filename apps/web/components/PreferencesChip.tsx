"use client";

import type { BuyerProfile } from "@/lib/types";

interface Props {
  profile: BuyerProfile;
}

function formatBudget(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 100_000 ? `₹${(n / 100_000).toFixed(0)}L` : `₹${n.toLocaleString()}`;
  if (min > 0 && max > 0) return `${fmt(min)}–${fmt(max)}`;
  if (max > 0) return `Up to ${fmt(max)}`;
  return "";
}

export default function PreferencesChip({ profile }: Props) {
  const chips: string[] = [];

  const budget = formatBudget(profile.budget_min ?? 0, profile.budget_max ?? 0);
  if (budget) chips.push(budget);
  if (profile.body_style) chips.push(profile.body_style);
  if (profile.fuel) chips.push(profile.fuel);
  if (profile.transmission) chips.push(profile.transmission);
  if (profile.condition && profile.condition !== "both") chips.push(profile.condition);

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap px-4 py-1.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <span className="text-xs shrink-0" style={{ color: "var(--color-text-muted)" }}>
        Your profile:
      </span>
      {chips.map((chip) => (
        <span
          key={chip}
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "var(--color-surface-2)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
