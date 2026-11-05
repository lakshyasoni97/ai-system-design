"use client";

import React from "react";
import { Scale } from "lucide-react";

export interface TradeoffRow {
  dimension: string;
  optionA: string;
  optionB: string;
  optionC?: string;
  verdict: string;
}

interface TradeoffTableProps {
  title?: string;
  headers?: string[];
  rows?: TradeoffRow[];
  children?: React.ReactNode;
}

export default function TradeoffTable({
  title,
  headers,
  rows,
  children,
}: TradeoffTableProps) {
  if (children) {
    return (
      <div className="my-6 overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs">
        {title && (
          <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3.5 py-2.5 sm:px-4 sm:py-3">
            <Scale className="h-4 w-4 text-accent shrink-0" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {title}
            </span>
          </div>
        )}
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            {children}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <Scale className="h-4 w-4 text-accent shrink-0" />
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
          {title || "Architectural Trade-Off Decision Matrix"}
        </span>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              {(headers || ["Dimension", "Option A", "Option B", "When to Choose"]).map(
                (h, idx) => (
                  <th key={idx} className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono font-semibold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/80">
            {rows?.map((r, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold text-foreground">
                  {r.dimension}
                </td>
                <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionA}</td>
                <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionB}</td>
                {r.optionC !== undefined && (
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionC}</td>
                )}
                <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-xs font-semibold text-primary">
                  {r.verdict}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
