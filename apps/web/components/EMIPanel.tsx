"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp, CreditCard } from "lucide-react";
import type { EMIResult } from "@/lib/types";

interface HITLProps {
  runId?: string;
  onSubmit: (data: { tenure_months: string; down_payment_pct: string; interest_override?: string }) => void;
}

export function EMIInputPanel({ onSubmit }: HITLProps) {
  const [tenure, setTenure] = useState(60);
  const [downPayment, setDownPayment] = useState(20);
  const [interestOverride, setInterestOverride] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 glow-pulse"
      style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-amber)", boxShadow: "0 0 16px rgba(245,166,35,0.15)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-4 h-4" style={{ color: "var(--color-amber)" }} />
        <h3 className="text-display text-sm font-semibold" style={{ color: "var(--color-amber)" }}>
          EMI Calculator
        </h3>
      </div>

      <div className="space-y-4">
        {/* Tenure */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Loan Tenure
            </label>
            <span className="text-price text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {tenure} months ({Math.round(tenure / 12)} yrs)
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={84}
            step={12}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full accent-amber-400"
            style={{ accentColor: "var(--color-amber)" }}
          />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            <span>1yr</span><span>3yr</span><span>5yr</span><span>7yr</span>
          </div>
        </div>

        {/* Down payment */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
              Down Payment
            </label>
            <span className="text-price text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {downPayment}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--color-amber)" }}
          />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            <span>0%</span><span>25%</span><span>50%</span>
          </div>
        </div>

        {/* Optional interest override */}
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Interest Rate Override (optional)
          </label>
          <input
            type="number"
            placeholder="e.g. 11.5"
            step="0.1"
            value={interestOverride}
            onChange={(e) => setInterestOverride(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              background: "var(--color-surface-3)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Leave blank to use default (used: 13.5%, new: 9.5%)
          </p>
        </div>

        <button
          onClick={() =>
            onSubmit({
              tenure_months: String(tenure),
              down_payment_pct: String(downPayment),
              ...(interestOverride ? { interest_override: interestOverride } : {}),
            })
          }
          className="w-full py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-amber)", color: "#0A0B0E" }}
        >
          Calculate EMI
        </button>
      </div>
    </motion.div>
  );
}

interface ResultProps {
  results: EMIResult[];
}

export function EMIResultPanel({ results }: ResultProps) {
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
        <TrendingUp className="w-4 h-4" style={{ color: "var(--color-amber)" }} />
        <h3 className="text-display text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
          EMI Breakdown
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {results.map((r, i) => (
          <div key={i} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {r.listing_label}
                </p>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={
                    r.condition === "new"
                      ? { background: "var(--color-new-dim)", color: "var(--color-new)" }
                      : { background: "var(--color-used-dim)", color: "var(--color-used)" }
                  }
                >
                  {r.condition} · {r.interest_rate}% p.a.
                </span>
              </div>
              <div className="text-right">
                <p className="text-price text-lg font-bold" style={{ color: "var(--color-amber)" }}>
                  {r.monthly_emi_display}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  /month
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Price", value: r.price_display },
                { label: "Total Interest", value: r.total_interest_display },
                { label: "Total Paid", value: r.total_paid_display },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-lg p-2 text-center"
                  style={{ background: "var(--color-surface-2)" }}
                >
                  <p className="text-price text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 flex items-center gap-1.5" style={{ background: "var(--color-surface-2)" }}>
        <CreditCard className="w-3 h-3" style={{ color: "var(--color-text-muted)" }} />
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          *Estimates only. Interest rates: new 9.5%, used 13.5% p.a. Verify with lender.
        </p>
      </div>
    </motion.div>
  );
}
