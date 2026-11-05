"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Layers,
  CalendarDays,
  Target,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Check,
  Flame,
  Copy,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import fundamentalsData from "@/data/fundamentals.json";
import problemsData from "@/data/problems.json";
import { useProgress } from "@/components/ProgressProvider";

interface RoadmapItem {
  id: string;
  rawId: string;
  type: "fundamental" | "session" | "problem";
  typeLabel: string;
  badgeCode: string;
  title: string;
  subtitle: string;
  href: string;
  time: string;
  status: "written" | "skeleton";
  studyPrompt: string;
  isDone: boolean;
  tier?: string;
}

export default function JourneyMap() {
  const { isItemCompleted, toggleItemCompleted } = useProgress();
  const [viewMode, setViewMode] = useState<"TIMELINE" | "MODULES">("TIMELINE");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flatten all sessions
  const allSessions = useMemo(
    () =>
      curriculumData.modules.flatMap((m) =>
        m.sessions.map((s) => ({
          ...s,
          moduleId: m.id,
          moduleTitle: m.title,
        }))
      ),
    []
  );

  const sessionMap = useMemo(() => {
    const map = new Map<string, (typeof allSessions)[0]>();
    allSessions.forEach((s) => map.set(s.id, s));
    return map;
  }, [allSessions]);

  const fundMap = useMemo(() => {
    const map = new Map<string, (typeof fundamentalsData.topics)[0]>();
    fundamentalsData.topics.forEach((t) => map.set(t.id, t));
    return map;
  }, []);

  const problemMap = useMemo(() => {
    const map = new Map<string, (typeof problemsData)[0]>();
    problemsData.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  // Compute weeks with processed items
  const processedWeeks = useMemo(() => {
    return curriculumData.weeks.map((w) => {
      const items: RoadmapItem[] = w.items.map((itemId) => {
        if (itemId.startsWith("fund-")) {
          const t = fundMap.get(itemId);
          return {
            id: itemId,
            rawId: itemId,
            type: "fundamental",
            typeLabel: "Distributed Fundamental",
            badgeCode: `F${String(t?.number || 0).padStart(2, "0")}`,
            title: t ? t.title : itemId,
            subtitle: t?.aiTieIn || "Distributed System Building Block",
            href: `/fundamentals/${itemId}`,
            time: t?.readTime || "14m",
            status: (t?.status as "written" | "skeleton") || "written",
            studyPrompt: `Explain ${t?.title || itemId} from first principles with real-world analogies, failure modes, and AI system tie-ins.`,
            isDone: isItemCompleted(itemId),
          };
        }
        if (itemId.startsWith("problem:")) {
          const pId = itemId.replace("problem:", "");
          const p = problemMap.get(pId);
          return {
            id: itemId,
            rawId: pId,
            type: "problem",
            typeLabel: "Case Study",
            badgeCode: "CASE",
            title: p ? p.title.replace(/^Design an? /, "") : itemId,
            subtitle: p?.resumeTie || (p?.tier ? `${p.tier} tier interview problem` : "System Design Case"),
            href: `/problems?id=${pId}`,
            time: "45m mock",
            status: (p?.status as "written" | "skeleton") || "written",
            studyPrompt: `Mock interview for ${p?.title || pId}. Walk through requirements, capacity math, and high-level architecture.`,
            isDone: isItemCompleted(itemId) || isItemCompleted(pId),
            tier: p?.tier,
          };
        }
        const s = sessionMap.get(itemId);
        return {
          id: itemId,
          rawId: itemId,
          type: "session",
          typeLabel: "Session",
          badgeCode: `S${String(s?.number || 0).padStart(2, "0")}`,
          title: s ? s.title : itemId,
          subtitle: s?.projectTieIn || "Architecture Topic",
          href: `/roadmap/${itemId}`,
          time: s?.estimatedReadTime || "15m",
          status: (s?.status as "written" | "skeleton") || "skeleton",
          studyPrompt: s?.studyPrompt || `Deep dive into ${s?.title || itemId}`,
          isDone: isItemCompleted(itemId),
        };
      });

      const completedCount = items.filter((i) => i.isDone).length;
      return {
        ...w,
        items,
        completedCount,
        isCompleted: completedCount === items.length && items.length > 0,
      };
    });
  }, [fundMap, problemMap, sessionMap, isItemCompleted]);

  // Determine current active week (first week not fully completed)
  const activeWeekNum = useMemo(() => {
    const found = processedWeeks.find((w) => !w.isCompleted);
    return found ? found.week : processedWeeks[0].week;
  }, [processedWeeks]);

  // Collapsible state for weeks: defaults to expanding current active week, completed weeks collapsed
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});

  const isWeekOpen = (wNum: number) => {
    if (collapsedWeeks[wNum] !== undefined) {
      return !collapsedWeeks[wNum];
    }
    // Default: open if current active week or uncompleted
    return wNum === activeWeekNum;
  };

  const toggleWeek = (wNum: number) => {
    setCollapsedWeeks((prev) => ({
      ...prev,
      [wNum]: isWeekOpen(wNum),
    }));
  };

  // Phase statistics for Tier 1 Macro Stepper
  const phaseStats = useMemo(() => {
    return curriculumData.phases.map((ph) => {
      const weeksInPhase = processedWeeks.filter((w) => w.phase === ph.number);
      const totalItems = weeksInPhase.reduce((acc, w) => acc + w.items.length, 0);
      const completedItems = weeksInPhase.reduce((acc, w) => acc + w.completedCount, 0);
      const isPhaseDone = totalItems > 0 && completedItems === totalItems;
      const isCurrentPhase = weeksInPhase.some((w) => w.week === activeWeekNum);

      return {
        ...ph,
        totalItems,
        completedItems,
        pct: Math.round((completedItems / (totalItems || 1)) * 100),
        isPhaseDone,
        isCurrentPhase,
      };
    });
  }, [processedWeeks, activeWeekNum]);

  const handleCopyPrompt = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Mastery Roadmap & Progression
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
              10 Weeks · 5 Phases · 57 Items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Progressive 10-week syllabus with automatic milestone focusing and 1-click completion tracking.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("TIMELINE")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "TIMELINE"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>10-Week Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("MODULES")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                viewMode === "MODULES"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Architecture Modules</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TIER 1 MACRO PROGRESSION: 5-PHASE STEPPER */}
      <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3.5 sm:p-4">
        <div className="flex items-center justify-between text-xs font-semibold mb-2.5">
          <span className="font-mono uppercase text-muted-foreground text-[11px] tracking-wider">
            Curriculum Phase Progression
          </span>
          <span className="font-mono text-[11px] text-primary">
            Current: Phase {phaseStats.find((p) => p.isCurrentPhase)?.number ?? 0}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {phaseStats.map((phase) => (
            <div
              key={phase.id}
              className={`rounded-xl border p-2.5 transition-all ${
                phase.isCurrentPhase
                  ? "border-primary/60 bg-card ring-1 ring-primary/40 shadow-xs"
                  : phase.isPhaseDone
                  ? "border-border/60 bg-card/60 opacity-90"
                  : "border-border/40 bg-card/30 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  {phase.isPhaseDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : phase.isCurrentPhase ? (
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className="font-mono font-bold text-[11px] text-foreground">
                    Phase {phase.number}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {phase.completedItems}/{phase.totalItems}
                </span>
              </div>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary mb-1.5">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${phase.pct}%` }}
                />
              </div>

              <div className="text-[11px] font-medium text-foreground truncate">
                {phase.title.replace(/^Phase \d+: /, "")}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {phase.weeks}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TIER 2 MESO TIMELINE VIEW */}
      {viewMode === "TIMELINE" && (
        <div className="space-y-3.5">
          {processedWeeks.map((w) => {
            const isOpen = isWeekOpen(w.week);
            const isCurrent = w.week === activeWeekNum;
            const pct = Math.round((w.completedCount / (w.items.length || 1)) * 100);

            return (
              <div
                key={w.week}
                className={`rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-primary/60 bg-card shadow-sm ring-1 ring-primary/20"
                    : w.isCompleted
                    ? "border-border/60 bg-card/80"
                    : "border-border bg-card"
                }`}
              >
                {/* Collapsible Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleWeek(w.week)}
                  className="flex w-full items-center justify-between p-3.5 sm:p-4 text-left cursor-pointer hover:bg-muted/30 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-mono text-xs font-bold shrink-0 transition-colors ${
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
                        <span>Phase {w.phase}</span>
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
                        {w.completedCount} / {w.items.length}
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

                {/* Week Checklist Items */}
                {isOpen && (
                  <div className="border-t border-border/60 p-3 sm:p-4 space-y-2 bg-muted/10 rounded-b-2xl">
                    <div className="space-y-1.5">
                      {w.items.map((item) => {
                        return (
                          <div
                            key={item.id}
                            className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:px-3.5 sm:py-2.5 transition-all ${
                              item.isDone
                                ? "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                                : "border-border bg-card text-foreground hover:border-primary/50 hover:shadow-2xs"
                            }`}
                          >
                            {/* Left: Checkbox + Badges + Title */}
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                              <button
                                type="button"
                                onClick={() => toggleItemCompleted(item.id)}
                                className="mt-0.5 sm:mt-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                                title={item.isDone ? "Mark incomplete" : "Mark completed"}
                              >
                                {item.isDone ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 opacity-40 hover:opacity-100" />
                                )}
                              </button>

                              <span
                                className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold shrink-0 ${
                                  item.type === "fundamental"
                                    ? "bg-accent/15 text-accent border border-accent/30"
                                    : item.type === "problem"
                                    ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                    : "bg-primary/15 text-primary border border-primary/30"
                                }`}
                              >
                                {item.badgeCode}
                              </span>

                              <div className="min-w-0">
                                <Link
                                  href={item.href}
                                  className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2 block leading-snug"
                                >
                                  {item.title}
                                </Link>
                                <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-2 mt-0.5">
                                  {item.subtitle}
                                </span>
                              </div>
                            </div>

                            {/* Right: Meta Pills & Actions */}
                            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50 w-full sm:w-auto justify-end">
                              {item.status === "written" ? (
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
                                {item.time}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopyPrompt(item.id, item.studyPrompt)}
                                className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Copy Socratic AI Study Prompt"
                              >
                                {copiedId === item.id ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <Link
                                href={item.href}
                                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors ${
                                  item.isDone
                                    ? "border border-border bg-card text-muted-foreground hover:text-foreground"
                                    : "bg-primary text-primary-foreground hover:opacity-90"
                                }`}
                              >
                                <span>{item.isDone ? "Review" : "Study"}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DOMAIN MODULES VIEW */}
      {viewMode === "MODULES" && (
        <div className="space-y-4">
          {curriculumData.modules.map((mod, modIdx) => {
            const completedCount = mod.sessions.filter((s) => isItemCompleted(s.id)).length;
            const isModuleComplete = completedCount === mod.sessions.length;

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs"
              >
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isModuleComplete
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      M{modIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {mod.focus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(completedCount / mod.sessions.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {completedCount}/{mod.sessions.length} Done
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {mod.sessions.map((s) => {
                    const completed = isItemCompleted(s.id);
                    return (
                      <div
                        key={s.id}
                        className={`flex flex-col justify-between rounded-xl border p-3 transition-all ${
                          completed
                            ? "border-border/60 bg-secondary/30"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground">
                              S{String(s.number).padStart(2, "0")} · W{s.week}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleItemCompleted(s.id)}
                              className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              {completed ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              ) : (
                                <Circle className="h-4 w-4 opacity-40 hover:opacity-100" />
                              )}
                            </button>
                          </div>
                          <Link
                            href={`/roadmap/${s.id}`}
                            className="text-xs sm:text-sm font-semibold leading-snug text-foreground hover:text-primary transition-colors line-clamp-2"
                          >
                            {s.title}
                          </Link>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span className="truncate max-w-[140px] opacity-80">
                            {s.projectTieIn.split(" ")[0]}
                          </span>
                          <span className="inline-flex items-center gap-1 opacity-75">
                            <Clock className="h-3 w-3" />
                            {s.estimatedReadTime || "15m"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
