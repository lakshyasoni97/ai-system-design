"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Flag,
  Target,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import curriculum from "@/data/curriculum.json";
import fundamentals from "@/data/fundamentals.json";
import problems from "@/data/problems.json";
import { useProgress } from "@/components/ProgressProvider";

const tierStyle: Record<string, string> = {
  "must-know": "text-primary border-primary/30 bg-primary/10",
  "high-freq": "text-accent border-accent/30 bg-accent/10",
  differentiator: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  secondary: "text-muted-foreground border-border bg-muted/40",
};

export default function PlanPage() {
  const { isItemCompleted, toggleItemCompleted } = useProgress();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const sessionMap = useMemo(() => {
    const map: Record<string, (typeof curriculum.modules)[0]["sessions"][0]> = {};
    curriculum.modules.forEach((m) =>
      m.sessions.forEach((s) => {
        map[s.id] = s;
      })
    );
    return map;
  }, []);

  const fundMap = useMemo(() => {
    const map = new Map<string, (typeof fundamentals.topics)[0]>();
    fundamentals.topics.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  const problemMap = useMemo(() => {
    const map = new Map<string, (typeof problems)[0]>();
    problems.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  // Compute weeks with completion state
  const computedWeeks = useMemo(() => {
    return curriculum.weeks.map((w) => {
      let doneCount = 0;
      w.items.forEach((itemId) => {
        if (isItemCompleted(itemId)) doneCount++;
      });
      return {
        ...w,
        doneCount,
        totalCount: w.items.length,
        isCompleted: doneCount === w.items.length && w.items.length > 0,
      };
    });
  }, [isItemCompleted]);

  // First unfinished week is the active week
  const activeWeekNum = useMemo(() => {
    const found = computedWeeks.find((w) => !w.isCompleted);
    return found ? found.week : computedWeeks[0].week;
  }, [computedWeeks]);

  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});

  const isWeekOpen = (wNum: number) => {
    if (collapsedWeeks[wNum] !== undefined) {
      return !collapsedWeeks[wNum];
    }
    return wNum === activeWeekNum;
  };

  const toggleWeek = (wNum: number) => {
    setCollapsedWeeks((prev) => ({
      ...prev,
      [wNum]: isWeekOpen(wNum),
    }));
  };

  // Phase statistics
  const phaseStats = useMemo(() => {
    return curriculum.phases.map((ph) => {
      const weeksInPhase = computedWeeks.filter((w) => w.phase === ph.number);
      const total = weeksInPhase.reduce((acc, w) => acc + w.totalCount, 0);
      const done = weeksInPhase.reduce((acc, w) => acc + w.doneCount, 0);
      return {
        ...ph,
        total,
        done,
        pct: Math.round((done / (total || 1)) * 100),
        isCurrent: weeksInPhase.some((w) => w.week === activeWeekNum),
        isDone: total > 0 && done === total,
      };
    });
  }, [computedWeeks, activeWeekNum]);

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const renderItemRow = (itemId: string) => {
    const isDone = isItemCompleted(itemId);

    if (itemId.startsWith("fund-")) {
      const t = fundMap.get(itemId);
      const studyPrompt = `Explain ${t?.title || itemId} from first principles with real-world analogies, failure modes, and AI system tie-ins.`;

      return (
        <div
          key={itemId}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all ${
            isDone
              ? "border-border/50 bg-secondary/30 text-muted-foreground"
              : "border-border bg-card text-foreground hover:border-primary/50"
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => toggleItemCompleted(itemId)}
              className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
              title={isDone ? "Mark incomplete" : "Mark completed"}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 opacity-40 hover:opacity-100" />
              )}
            </button>
            <span className="rounded bg-accent/15 border border-accent/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-accent shrink-0">
              F{String(t?.number || 0).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <Link
                href={`/fundamentals/${itemId}`}
                className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2 block leading-snug"
              >
                {t?.title}
              </Link>
              <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
                {t?.aiTieIn}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Ready
            </span>
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t?.readTime || "14m"}
            </span>
            <button
              type="button"
              onClick={() => handleCopyPrompt(itemId, studyPrompt)}
              className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Copy Socratic AI Study Prompt"
            >
              {copiedId === itemId ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <Link
              href={`/fundamentals/${itemId}`}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                isDone
                  ? "border border-border bg-card text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              <span>{isDone ? "Review" : "Study"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      );
    }

    if (itemId.startsWith("problem:")) {
      const pId = itemId.replace("problem:", "");
      const p = problemMap.get(pId);
      const studyPrompt = `Mock interview for ${p?.title || pId}. Walk through requirements, capacity math, and high-level architecture.`;

      return (
        <div
          key={itemId}
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all ${
            isDone
              ? "border-border/50 bg-secondary/30 text-muted-foreground"
              : "border-border bg-card text-foreground hover:border-primary/50"
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => toggleItemCompleted(itemId)}
              className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
              title={isDone ? "Mark incomplete" : "Mark completed"}
            >
              {isDone ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Circle className="h-5 w-5 opacity-40 hover:opacity-100" />
              )}
            </button>
            <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-500 shrink-0">
              CASE
            </span>
            <div className="min-w-0">
              <Link
                href={`/problems?id=${pId}`}
                className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2 block leading-snug"
              >
                {p?.title.replace(/^Design an? /, "")}
              </Link>
              <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
                {p?.resumeTie}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
            <span
              className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                tierStyle[p?.tier || "secondary"]
              }`}
            >
              {p?.tier}
            </span>
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> 45m
            </span>
            <button
              type="button"
              onClick={() => handleCopyPrompt(itemId, studyPrompt)}
              className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Copy Socratic AI Study Prompt"
            >
              {copiedId === itemId ? (
                <Check className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <Link
              href={`/problems?id=${pId}`}
              className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                isDone
                  ? "border border-border bg-card text-muted-foreground hover:text-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              <span>{isDone ? "Review" : "Solve"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      );
    }

    const s = sessionMap[itemId];
    const studyPrompt = s?.studyPrompt || `Deep dive into ${s?.title || itemId}`;

    return (
      <div
        key={itemId}
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all ${
          isDone
            ? "border-border/50 bg-secondary/30 text-muted-foreground"
            : "border-border bg-card text-foreground hover:border-primary/50"
        }`}
      >
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => toggleItemCompleted(itemId)}
            className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
            title={isDone ? "Mark incomplete" : "Mark completed"}
          >
            {isDone ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 opacity-40 hover:opacity-100" />
            )}
          </button>
          <span className="rounded bg-primary/15 border border-primary/30 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary shrink-0">
            S{String(s?.number || 0).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <Link
              href={`/roadmap/${itemId}`}
              className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2 block leading-snug"
            >
              {s?.title}
            </Link>
            <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
              {s?.projectTieIn}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
          {s?.status === "written" ? (
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Ready
            </span>
          ) : (
            <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              Skeleton
            </span>
          )}
          <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {s?.estimatedReadTime || "15m"}
          </span>
          <button
            type="button"
            onClick={() => handleCopyPrompt(itemId, studyPrompt)}
            className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Copy Socratic AI Study Prompt"
          >
            {copiedId === itemId ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <Link
            href={`/roadmap/${itemId}`}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
              isDone
                ? "border border-border bg-card text-muted-foreground hover:text-foreground"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            <span>{isDone ? "Review" : "Study"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
          <CalendarDays className="h-3.5 w-3.5" /> 10-Week Study Plan
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Curriculum Roadmap & Milestone Checklist
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Target: {curriculum.candidate.targetProfile}. Phases 0 to 2 build the foundational toolkit; Phase 3 case studies are interleaved from Week 3 so you apply each topic immediately.
        </p>
      </div>

      {/* 2. Macro 5-Phase Overview */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {phaseStats.map((ph) => (
          <div
            key={ph.id}
            className={`rounded-2xl border p-5 shadow-xs transition-all ${
              ph.isCurrent
                ? "border-primary/60 bg-card ring-1 ring-primary/25"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  Phase {ph.number}
                </span>
                <h2 className="text-sm font-bold text-foreground">
                  {ph.title.replace(/^Phase \d+: /, "")}
                </h2>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {ph.weeks}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{ph.done} of {ph.total} Items Completed</span>
              <span className="font-bold text-foreground">{ph.pct}%</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary mt-1.5 mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${ph.pct}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">{ph.goal}</p>

            <ul className="mt-3 space-y-1 text-xs text-foreground/90 border-t border-border/50 pt-2.5">
              {ph.exitCriteria.map((c) => (
                <li key={c} className="flex gap-1.5">
                  <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* 3. Progressive 10-Week Accordion */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Week-by-Week Execution</h2>
          <span className="text-xs text-muted-foreground font-mono">
            Active: Week {activeWeekNum}
          </span>
        </div>

        {computedWeeks.map((w) => {
          const isOpen = isWeekOpen(w.week);
          const isCurrent = w.week === activeWeekNum;
          const phase = curriculum.phases.find((p) => p.number === w.phase);
          const pct = Math.round((w.doneCount / (w.totalCount || 1)) * 100);

          return (
            <div
              key={w.week}
              className={`rounded-2xl border transition-all ${
                isCurrent
                  ? "border-primary/60 bg-card shadow-xs ring-1 ring-primary/20"
                  : w.isCompleted
                  ? "border-border/60 bg-card/80"
                  : "border-border bg-card"
              }`}
            >
              {/* Accordion Header */}
              <button
                type="button"
                onClick={() => toggleWeek(w.week)}
                className="flex w-full items-center justify-between p-4 text-left cursor-pointer hover:bg-muted/30 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold shrink-0 ${
                      w.isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    W{w.week}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">
                        Week {w.week}: {w.focus}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-primary px-2 py-0.2 font-mono text-[10px] font-bold text-primary-foreground shrink-0 animate-pulse">
                          ACTIVE FOCUS
                        </span>
                      )}
                      {w.isCompleted && (
                        <span className="rounded bg-primary/10 border border-primary/25 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary shrink-0">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-mono">
                      <span>Phase {w.phase} ({phase?.title.replace(/^Phase \d+: /, "")})</span>
                      <span>•</span>
                      <span className="truncate max-w-[280px] sm:max-w-md">
                        Milestone: {w.milestone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {w.doneCount} / {w.totalCount}
                    </span>
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary mt-1">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Items List */}
              {isOpen && (
                <div className="border-t border-border/60 p-3 sm:p-4 space-y-2 bg-muted/10 rounded-b-2xl">
                  <div className="space-y-1.5">
                    {w.items.map(renderItemRow)}
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                    <Flag className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>
                      <strong className="text-foreground">Week {w.week} Milestone:</strong> {w.milestone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
