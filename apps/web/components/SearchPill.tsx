"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ActiveToolCall } from "@/lib/types";

const TOOL_LABELS: Record<string, string> = {
  search_listings: "Searching listings",
  find_car_image: "Fetching images",
  fetch_reviews: "Loading reviews",
  recent_news: "Checking news",
  build_comparison_table: "Building comparison",
  calculate_emi: "Calculating EMI",
  add_to_shortlist: "Saving to shortlist",
  view_shortlist: "Loading shortlist",
  get_buyer_profile: "Reading profile",
  set_preference: "Saving preference",
  five_year_tco: "Computing 5-yr TCO",
  estimate_insurance: "Estimating insurance",
};

const MEMBER_COLORS: Record<string, string> = {
  listings_cardekho: "#E84142",
  listings_cars24: "#FF6B35",
  listings_spinny: "#7C3AED",
  emi_agent: "#F5A623",
  comparison_agent: "#3B82F6",
  review_agent: "#10B981",
  shortlist_agent: "#F59E0B",
  preference_agent: "#6366F1",
  qa_agent: "#14B8A6",
};

interface Props {
  calls: ActiveToolCall[];
}

export default function SearchPillRow({ calls }: Props) {
  if (calls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 my-1">
      <AnimatePresence mode="popLayout">
        {calls.map((call) => {
          const color = MEMBER_COLORS[call.member] ?? "var(--color-amber)";
          const label = TOOL_LABELS[call.tool] ?? call.tool.replace(/_/g, " ");
          const isDone = call.status === "done";

          return (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, x: -8, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}44`,
                color,
              }}
            >
              {isDone ? (
                <CheckCircle2 className="w-3 h-3 shrink-0" />
              ) : (
                <Loader2 className="w-3 h-3 shrink-0 spinner" />
              )}
              <span>{label}</span>
              {isDone && call.result_snippet && (
                <span className="opacity-60">· {call.result_snippet}</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
