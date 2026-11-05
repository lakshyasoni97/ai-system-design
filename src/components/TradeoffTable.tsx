"use client";

import React, { useState } from "react";
import { Scale, Eye, EyeOff } from "lucide-react";
import { useActiveRecall } from "./ActiveRecallContext";

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
  const { isRecallMode } = useActiveRecall();
  const [localBlind, setLocalBlind] = useState<boolean>(false);
  const [revealedCells, setRevealedCells] = useState<Record<number, boolean>>({});

  // Blind mode is active if page recall mode is ON, or if user toggled it locally on this table
  const isBlinded = isRecallMode || localBlind;

  const toggleCell = (index: number) => {
    setRevealedCells((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleToggleBlind = () => {
    setLocalBlind((prev) => !prev);
    setRevealedCells({});
  };

  if (children) {
    return (
      <div className="my-6 overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-3.5 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-accent shrink-0" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
              {title || "Architectural Trade-Off Decision Matrix"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleBlind}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
              isBlinded
                ? "border-accent/40 bg-accent/15 text-accent"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {isBlinded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{isBlinded ? "Verdicts Blinded (Click to Reveal)" : "Blind Verdicts"}</span>
          </button>
        </div>

        <div
          className={`overflow-x-auto -webkit-overflow-scrolling-touch ${
            isBlinded
              ? "[&_tbody_tr_td:last-child]:relative [&_tbody_tr_td:last-child]:cursor-pointer [&_tbody_tr_td:last-child]:transition-all [&_tbody_tr_td:last-child]:hover:bg-muted/60"
              : ""
          }`}
          onClick={(e) => {
            if (!isBlinded) return;
            const target = e.target as HTMLElement;
            const td = target.closest("td");
            if (td && td.parentElement) {
              const tr = td.parentElement;
              // Check if it's the last child td
              if (tr.lastElementChild === td) {
                const isMasked = td.getAttribute("data-revealed") !== "true";
                if (isMasked) {
                  td.setAttribute("data-revealed", "true");
                  td.classList.remove("blur-xs", "opacity-40", "select-none");
                } else {
                  td.removeAttribute("data-revealed");
                  td.classList.add("blur-xs", "opacity-40", "select-none");
                }
              }
            }
          }}
        >
          <table
            className={`w-full border-collapse text-left text-xs sm:text-sm ${
              isBlinded
                ? "[&_tbody_tr_td:last-child:not([data-revealed='true'])]:blur-xs [&_tbody_tr_td:last-child:not([data-revealed='true'])]:opacity-40 [&_tbody_tr_td:last-child:not([data-revealed='true'])]:select-none"
                : ""
            }`}
          >
            {children}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-3.5 py-2.5 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-accent shrink-0" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            {title || "Architectural Trade-Off Decision Matrix"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleToggleBlind}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
            isBlinded
              ? "border-accent/40 bg-accent/15 text-accent"
              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {isBlinded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          <span>{isBlinded ? "Verdicts Blinded" : "Blind Verdicts"}</span>
        </button>
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
            {rows?.map((r, i) => {
              const cellRevealed = revealedCells[i];
              return (
                <tr key={i} className="transition-colors hover:bg-muted/40">
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold text-foreground">
                    {r.dimension}
                  </td>
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionA}</td>
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionB}</td>
                  {r.optionC !== undefined && (
                    <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-muted-foreground">{r.optionC}</td>
                  )}
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-mono text-xs font-semibold text-primary">
                    {isBlinded && !cellRevealed ? (
                      <button
                        type="button"
                        onClick={() => toggleCell(i)}
                        className="rounded border border-dashed border-accent/50 bg-accent/10 px-2 py-1 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                        title="Click to reveal verdict"
                      >
                        [ Reveal Verdict ]
                      </button>
                    ) : (
                      <span
                        onClick={() => isBlinded && toggleCell(i)}
                        className={isBlinded ? "cursor-pointer hover:opacity-80" : ""}
                        title={isBlinded ? "Click to hide" : undefined}
                      >
                        {r.verdict}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
