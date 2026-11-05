"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Flame,
  Clock,
  Layers,
  GitFork,
  Briefcase,
  CalendarDays,
  Target,
  Sparkles,
  Library,
  ListChecks,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import fundamentalsData from "@/data/fundamentals.json";
import problemsData from "@/data/problems.json";
import { useProgress } from "@/components/ProgressProvider";

export default function JourneyMap() {
  const { isSessionCompleted } = useProgress();
  const [viewMode, setViewMode] = useState<"TIMELINE" | "MODULES">("TIMELINE");
  const [fundamentalsDone, setFundamentalsDone] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fundamentals-done");
      if (raw) setFundamentalsDone(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const isItemDone = (id: string) => {
    return isSessionCompleted(id) || fundamentalsDone.includes(id);
  };

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

  const phaseMap = useMemo(() => {
    const map = new Map<number, (typeof curriculumData.phases)[0]>();
    curriculumData.phases.forEach((p) => map.set(p.number, p));
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with High-Level Description & Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Architecture Journey Roadmap
            </h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
              10 Weeks · 31 Sessions · 18 Case Studies
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Switch between the progressive 10-week syllabus or domain-specific architectural modules.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("TIMELINE")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "TIMELINE"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>10-Week Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("MODULES")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "MODULES"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>5 Domain Modules</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW A: 10-WEEK TIMELINE */}
      {viewMode === "TIMELINE" && (
        <div className="space-y-4">
          {curriculumData.weeks.map((w) => {
            const phase = phaseMap.get(w.phase);
            const items = w.items.map((itemId) => {
              if (itemId.startsWith("fund-")) {
                const t = fundMap.get(itemId);
                return {
                  id: itemId,
                  href: `/fundamentals/${itemId}`,
                  title: t ? `F${t.number} · ${t.title}` : itemId,
                  sub: t?.aiTieIn || "Distributed Fundamental",
                  type: "fundamental" as const,
                  isDone: isItemDone(itemId),
                  time: t?.readTime || "14 min",
                };
              }
              if (itemId.startsWith("problem:")) {
                const pId = itemId.replace("problem:", "");
                const p = problemMap.get(pId);
                return {
                  id: itemId,
                  href: `/problems?id=${pId}`,
                  title: p ? `CASE · ${p.title.replace(/^Design an? /, "")}` : itemId,
                  sub: p?.tier ? `${p.tier} tier` : "Case Study",
                  type: "problem" as const,
                  isDone: isItemDone(itemId) || isItemDone(pId),
                  time: "45m mock",
                };
              }
              const s = sessionMap.get(itemId);
              return {
                id: itemId,
                href: `/roadmap/${itemId}`,
                title: s ? `S${String(s.number).padStart(2, "0")} · ${s.title}` : itemId,
                sub: s?.projectTieIn || "Session",
                type: "session" as const,
                isDone: isItemDone(itemId),
                time: s?.estimatedReadTime || "15 min",
              };
            });

            const completedCount = items.filter((i) => i.isDone).length;
            const isWeekComplete = completedCount === items.length && items.length > 0;

            return (
              <div
                key={w.week}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-border/80"
              >
                {/* Week Header */}
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                        isWeekComplete
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      W{w.week}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-foreground">
                          Week {w.week}: {phase?.title.replace(/^Phase \d+: /, "")}
                        </h3>
                        <span className="rounded bg-primary/10 px-2 py-0.2 font-mono text-[10px] font-semibold text-primary">
                          Phase {w.phase}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {w.focus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{
                          width: `${(completedCount / (items.length || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {completedCount}/{items.length} Done
                    </span>
                  </div>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                        item.isDone
                          ? "border-border/60 bg-secondary/30 hover:bg-secondary/60"
                          : item.type === "problem"
                          ? "border-primary/40 bg-primary/5 hover:border-primary/70"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                            {item.type === "fundamental"
                              ? "FUNDAMENTAL"
                              : item.type === "problem"
                              ? "CASE STUDY"
                              : "SESSION"}
                          </span>
                          {item.isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span className="truncate max-w-[130px] opacity-80">
                          {item.sub}
                        </span>
                        <span className="inline-flex items-center gap-1 opacity-75 shrink-0">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Week Milestone */}
                <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>
                    <strong className="text-foreground">Week {w.week} Goal:</strong> {w.milestone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW B: 5 DOMAIN MODULES */}
      {viewMode === "MODULES" && (
        <div className="space-y-4">
          {curriculumData.modules.map((mod, modIdx) => {
            const completedCount = mod.sessions.filter((s) =>
              isSessionCompleted(s.id)
            ).length;
            const isModuleComplete = completedCount === mod.sessions.length;

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-border/80"
              >
                {/* Module Title & Counter Bar */}
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

                {/* Sessions Grid */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {mod.sessions.map((s) => {
                    const completed = isSessionCompleted(s.id);

                    return (
                      <Link
                        key={s.id}
                        href={`/roadmap/${s.id}`}
                        className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                          completed
                            ? "border-border/60 bg-secondary/30 hover:bg-secondary/60"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                              Session {String(s.number).padStart(2, "0")} · W{s.week}
                            </span>
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                            )}
                          </div>

                          <h4 className="text-xs sm:text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {s.title}
                          </h4>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground font-mono">
                          <span className="truncate max-w-[130px] opacity-80">
                            {s.projectTieIn.split(" ")[0]}
                          </span>
                          <span className="inline-flex items-center gap-1 opacity-75 shrink-0">
                            <Clock className="h-3 w-3" />
                            {s.estimatedReadTime || "15m"}
                          </span>
                        </div>
                      </Link>
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
