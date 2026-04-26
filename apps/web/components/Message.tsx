"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, Listing, EMIResult, ReviewSummary, ComparisonTable, ShortlistEntry } from "@/lib/types";
import SummaryCard from "./SummaryCard";
import { EMIResultPanel } from "./EMIPanel";
import ComparisonTableView from "./ComparisonTableView";
import ReviewSummaryView from "./ReviewSummaryView";

interface Props {
  message: ChatMessage;
  onShortlist?: (listing: Listing) => void;
  onEMI?: (listing: Listing) => void;
  onCompare?: (listing: Listing) => void;
}

function isListingArray(data: unknown): data is Listing[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as Record<string, unknown>)["brand"] === "string";
}

function isEMIArray(data: unknown): data is EMIResult[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as Record<string, unknown>)["monthly_emi"] === "number";
}

function isShortlistArray(data: unknown): data is ShortlistEntry[] {
  return Array.isArray(data) && data.length > 0 && typeof (data[0] as Record<string, unknown>)["listing"] === "object";
}

function isReviewSummary(data: unknown): data is ReviewSummary {
  return typeof data === "object" && data !== null && "pros" in data && "cons" in data;
}

function isComparisonTable(data: unknown): data is ComparisonTable {
  return typeof data === "object" && data !== null && "rows" in data && "cars" in data;
}

export default function Message({ message, onShortlist, onEMI, onCompare }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
          isUser ? "rounded-br-sm" : "rounded-bl-sm"
        }`}
        style={
          isUser
            ? { background: "var(--color-amber-glow)", border: "1px solid var(--color-amber-dim)" }
            : { background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }
        }
      >
        {isUser ? (
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            {message.content}
          </p>
        ) : (
          <div
            className={`text-sm prose prose-sm max-w-none ${message.streaming ? "stream-caret" : ""}`}
            style={{ color: "var(--color-text-primary)" }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: "var(--color-amber)" }}>
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code
                    className="text-price text-xs px-1 py-0.5 rounded"
                    style={{ background: "var(--color-surface-3)" }}
                  >
                    {children}
                  </code>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                    style={{ color: "var(--color-amber)" }}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Rich payload blocks */}
      {message.rich_payload && !isUser && (
        <div className="max-w-full w-full">
          {(message.rich_payload.type === "listings" || message.rich_payload.type === "shortlist") &&
            isListingArray(message.rich_payload.data) && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(message.rich_payload.data as Listing[]).map((listing, i) => (
                  <SummaryCard
                    key={`${listing.brand}-${listing.model}-${i}`}
                    listing={listing}
                    index={i}
                    onShortlist={onShortlist}
                    onEMI={onEMI}
                    onCompare={onCompare}
                  />
                ))}
              </div>
            )}

          {message.rich_payload.type === "shortlist" &&
            isShortlistArray(message.rich_payload.data) && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(message.rich_payload.data as ShortlistEntry[]).map((entry, i) => (
                  <SummaryCard
                    key={`shortlist-${i}`}
                    listing={entry.listing}
                    index={i}
                    isShortlisted
                    onEMI={onEMI}
                    onCompare={onCompare}
                  />
                ))}
              </div>
            )}

          {message.rich_payload.type === "emi_results" && isEMIArray(message.rich_payload.data) && (
            <EMIResultPanel results={message.rich_payload.data as EMIResult[]} />
          )}

          {message.rich_payload.type === "review_summary" && isReviewSummary(message.rich_payload.data) && (
            <ReviewSummaryView review={message.rich_payload.data as ReviewSummary} />
          )}

          {message.rich_payload.type === "comparison_table" && isComparisonTable(message.rich_payload.data) && (
            <ComparisonTableView table={message.rich_payload.data as ComparisonTable} />
          )}
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        {new Date(message.timestamp).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
