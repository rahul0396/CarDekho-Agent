"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExternalLink, Heart, BarChart2, Calculator, MapPin, Fuel, Settings2, Gauge } from "lucide-react";
import type { Listing } from "@/lib/types";

const SOURCE_LABELS: Record<string, string> = {
  cardekho: "CarDekho",
  cars24: "Cars24",
  spinny: "Spinny",
};

const SOURCE_COLORS: Record<string, string> = {
  cardekho: "#E84142",
  cars24: "#FF6B35",
  spinny: "#7C3AED",
};

function formatInr(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

interface Props {
  listing: Listing;
  index?: number;
  onShortlist?: (listing: Listing) => void;
  onCompare?: (listing: Listing) => void;
  onEMI?: (listing: Listing) => void;
  isShortlisted?: boolean;
}

export default function SummaryCard({
  listing,
  index = 0,
  onShortlist,
  onCompare,
  onEMI,
  isShortlisted = false,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const sourceColor = SOURCE_COLORS[listing.source] ?? "#F5A623";
  const sourceLabel = SOURCE_LABELS[listing.source] ?? listing.source;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="relative aspect-video overflow-hidden" style={{ background: "var(--color-surface-2)" }}>
        {listing.image_url && !imgError ? (
          <Image
            src={listing.image_url}
            alt={`${listing.brand} ${listing.model}`}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          /* Placeholder with brand initials */
          <div className="w-full h-full flex items-center justify-center">
            <span
              className="text-display text-5xl font-bold opacity-10"
              style={{ color: sourceColor }}
            >
              {listing.brand.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Condition badge */}
        <div className="absolute top-2 right-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={
              listing.condition === "new"
                ? { background: "var(--color-new-dim)", color: "var(--color-new)", border: "1px solid var(--color-new)" }
                : { background: "var(--color-used-dim)", color: "var(--color-used)", border: "1px solid var(--color-used)" }
            }
          >
            {listing.condition}
          </span>
        </div>

        {/* Source pill */}
        <div className="absolute top-2 left-2">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${sourceColor}22`, color: sourceColor, border: `1px solid ${sourceColor}44` }}
          >
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 p-3">
        {/* Title */}
        <div>
          <h3 className="text-display text-sm font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>
            {listing.brand} {listing.model}
          </h3>
          {listing.variant && (
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
              {listing.variant}
            </p>
          )}
        </div>

        {/* Price */}
        <p
          className="text-price text-lg font-semibold"
          style={{ color: "var(--color-amber)" }}
        >
          {formatInr(listing.price_inr)}
        </p>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {listing.year > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <span>{listing.year}</span>
            </span>
          )}
          {listing.km > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <Gauge className="w-3 h-3" />
              {listing.km.toLocaleString("en-IN")} km
            </span>
          )}
          {listing.fuel && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <Fuel className="w-3 h-3" />
              {listing.fuel}
            </span>
          )}
          {listing.transmission && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <Settings2 className="w-3 h-3" />
              {listing.transmission}
            </span>
          )}
          {listing.city && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <MapPin className="w-3 h-3" />
              {listing.city}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: "var(--color-border)" }} />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onShortlist?.(listing)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
            style={
              isShortlisted
                ? { background: "var(--color-amber-glow)", color: "var(--color-amber)", border: "1px solid var(--color-amber-dim)" }
                : { background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }
            }
          >
            <Heart className={`w-3 h-3 ${isShortlisted ? "fill-current" : ""}`} />
            {isShortlisted ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => onCompare?.(listing)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            <BarChart2 className="w-3 h-3" />
            Compare
          </button>
          <button
            onClick={() => onEMI?.(listing)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
          >
            <Calculator className="w-3 h-3" />
            EMI
          </button>
          {listing.source_url && (
            <a
              href={listing.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all"
              style={{ background: "var(--color-surface-2)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Skeleton variant ─────────────────────────────────────────────────────── */
export function SummaryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col overflow-hidden rounded-xl border"
      style={{ background: "var(--color-surface-1)", borderColor: "var(--color-border)" }}
    >
      <div className="skeleton aspect-video" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-5 w-1/3" />
        <div className="flex gap-2">
          <div className="skeleton h-3 w-12" />
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-3 w-14" />
        </div>
        <div className="skeleton h-px" />
        <div className="flex gap-1">
          <div className="skeleton h-6 w-14" />
          <div className="skeleton h-6 w-16" />
          <div className="skeleton h-6 w-12" />
        </div>
      </div>
    </motion.div>
  );
}
