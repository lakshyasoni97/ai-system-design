"use client";

import React, { useState } from "react";
import { ChevronDown, Clock, HelpCircle, Layers, MessageSquareQuote, Zap } from "lucide-react";
import type {
  ExplainLayer,
  InterviewQAItem,
  RapidFireItem,
  SocraticStep,
  TimelineEvent,
} from "@/lib/parseStudyArticle";

type RenderMarkdownFn = (md: string) => React.ReactNode;

export function SocraticLadderBlock({
  id,
  heading,
  steps,
  renderMarkdown,
}: {
  id: string;
  heading: string;
  steps: SocraticStep[];
  renderMarkdown: RenderMarkdownFn;
}) {
  const [openIndices, setOpenIndices] = useState<Record<number, boolean>>({});
  const allOpen = steps.every((_, idx) => openIndices[idx]);

  const toggleAll = () => {
    if (allOpen) {
      setOpenIndices({});
    } else {
      const next: Record<number, boolean> = {};
      steps.forEach((_, idx) => {
        next[idx] = true;
      });
      setOpenIndices(next);
    }
  };

  return (
    <div className="my-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id={id}
          className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
        >
          <HelpCircle className="h-4 w-4 text-primary shrink-0" />
          <span>{heading}</span>
        </h3>
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {allOpen ? "Hide all answers" : "Reveal all answers"}
        </button>
      </div>

      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isOpen = Boolean(openIndices[idx]);
          return (
            <div
              key={idx}
              className={`rounded-xl border transition-colors ${
                isOpen
                  ? "border-primary/35 bg-primary/[0.03]"
                  : "border-border bg-muted/20 hover:border-border/80"
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenIndices((prev) => ({ ...prev, [idx]: !prev[idx] }))
                }
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="mt-0.5 shrink-0 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    Q{idx + 1}
                  </span>
                  <span className="text-sm sm:text-[15px] font-semibold leading-snug text-foreground">
                    {step.question}
                  </span>
                </div>
                <span className="mt-0.5 flex items-center gap-1 shrink-0 font-mono text-[11px] text-muted-foreground">
                  <span className="hidden sm:inline">
                    {isOpen ? "Hide" : "Think & Reveal"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-border/70 px-4 py-3 text-sm leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {renderMarkdown(step.answerMarkdown)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ExplainInLayersBlock({
  id,
  heading,
  layers,
  renderMarkdown,
}: {
  id: string;
  heading: string;
  layers: ExplainLayer[];
  renderMarkdown: RenderMarkdownFn;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeLayer = layers[activeIdx] || layers[0];

  return (
    <div className="my-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id={id}
          className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
        >
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <span>{heading}</span>
        </h3>

        <div className="inline-flex flex-wrap items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
          {layers.map((layer, idx) => (
            <button
              key={layer.label}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-all cursor-pointer ${
                idx === activeIdx
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {layer.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {activeLayer && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
          <div className="mb-1.5 font-mono text-[11px] font-semibold text-primary">
            {activeLayer.label}
          </div>
          <div className="text-sm sm:text-base leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {renderMarkdown(activeLayer.bodyMarkdown)}
          </div>
        </div>
      )}
    </div>
  );
}

export function TimestampedTimelineBlock({
  id,
  heading,
  events,
  takeawayMarkdown,
  renderMarkdown,
}: {
  id: string;
  heading: string;
  events: TimelineEvent[];
  takeawayMarkdown?: string;
  renderMarkdown: RenderMarkdownFn;
}) {
  return (
    <div className="my-6 space-y-3">
      <h3
        id={id}
        className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
      >
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span>{heading}</span>
      </h3>

      <div className="relative ml-2 border-l-2 border-border pl-5 space-y-3.5 py-1">
        {events.map((ev, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3">
              <span className="inline-block w-fit shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                {ev.time}
              </span>
              <div className="text-sm sm:text-[15px] leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {renderMarkdown(ev.bodyMarkdown)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {takeawayMarkdown && (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 text-sm leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {renderMarkdown(takeawayMarkdown)}
        </div>
      )}
    </div>
  );
}

export function InterviewQAGroup({
  items,
  renderMarkdown,
}: {
  items: InterviewQAItem[];
  renderMarkdown: RenderMarkdownFn;
}) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() =>
    items.length > 0 ? { [items[0].id]: true } : {}
  );
  const allOpen = items.every((item) => openIds[item.id]);

  const toggleAll = () => {
    if (allOpen) {
      setOpenIds({});
    } else {
      const next: Record<string, boolean> = {};
      items.forEach((item) => {
        next[item.id] = true;
      });
      setOpenIds(next);
    }
  };

  return (
    <div className="my-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-muted-foreground">
          <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
          <span>{items.length} Interview Questions — tap to practice before revealing</span>
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isOpen = Boolean(openIds[item.id]);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-muted/15 overflow-hidden transition-colors"
            >
              <button
                type="button"
                id={item.id}
                onClick={() =>
                  setOpenIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                }
                aria-expanded={isOpen}
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer scroll-mt-24"
              >
                <span className="text-sm sm:text-base font-semibold leading-snug text-foreground">
                  {item.title}
                </span>
                <ChevronDown
                  className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-border/70 bg-card/60 px-4 py-4 text-sm sm:text-base leading-relaxed text-foreground/95 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {renderMarkdown(item.bodyMarkdown)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RapidFireBlock({
  id,
  heading,
  items,
  renderMarkdown,
}: {
  id: string;
  heading: string;
  items: RapidFireItem[];
  renderMarkdown: RenderMarkdownFn;
}) {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const allRevealed = items.every((_, idx) => revealed[idx]);

  const toggleAll = () => {
    if (allRevealed) {
      setRevealed({});
    } else {
      const next: Record<number, boolean> = {};
      items.forEach((_, idx) => {
        next[idx] = true;
      });
      setRevealed(next);
    }
  };

  return (
    <div className="my-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id={id}
          className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
        >
          <Zap className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{heading}</span>
        </h3>
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {allRevealed ? "Hide all" : "Reveal all"}
        </button>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-muted/15 overflow-hidden">
        {items.map((item, idx) => {
          const isOpen = Boolean(revealed[idx]);
          return (
            <button
              key={idx}
              type="button"
              onClick={() =>
                setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }))
              }
              className="w-full px-4 py-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-foreground">
                  {item.prompt}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-primary font-medium">
                  {isOpen ? "Hide" : "Reveal"}
                </span>
              </div>
              {isOpen && (
                <div className="mt-2 border-l-2 border-primary/40 pl-3 text-sm text-foreground/90 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {renderMarkdown(item.answer)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
