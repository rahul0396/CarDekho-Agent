"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { ComparisonTable } from "@/lib/types";

interface Props {
  table: ComparisonTable;
}

export default function ComparisonTableView({ table }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-1)" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}
      >
        <Trophy className="w-4 h-4" style={{ color: "var(--color-amber)" }} />
        <h3 className="text-display text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Side-by-Side Comparison
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th
                className="text-left px-3 py-2 font-semibold sticky left-0"
                style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)", minWidth: 120 }}
              >
                Metric
              </th>
              {table.cars.map((car) => (
                <th
                  key={car}
                  className="text-left px-3 py-2 font-semibold"
                  style={{ color: "var(--color-text-primary)", minWidth: 140 }}
                >
                  {car}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr
                key={i}
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                className="hover:bg-white/[0.02]"
              >
                <td
                  className="px-3 py-2 font-medium sticky left-0"
                  style={{ background: "var(--color-surface-1)", color: "var(--color-text-secondary)" }}
                >
                  {row.metric}
                </td>
                {table.cars.map((car) => {
                  const isWinner = row.winner === car && row.winner !== "";
                  return (
                    <td
                      key={car}
                      className="px-3 py-2 text-price"
                      style={{
                        color: isWinner ? "var(--color-new)" : "var(--color-text-primary)",
                        fontWeight: isWinner ? 600 : 400,
                      }}
                    >
                      {isWinner && (
                        <span className="mr-1 text-xs" style={{ color: "var(--color-new)" }}>
                          ✓
                        </span>
                      )}
                      {row.values[car] ?? "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
