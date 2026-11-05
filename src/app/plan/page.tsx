"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Circle, Flag, Target } from "lucide-react";
import curriculum from "@/data/curriculum.json";
import fundamentals from "@/data/fundamentals.json";
import problems from "@/data/problems.json";
import { useProgress } from "@/components/ProgressProvider";

const tierStyle: Record<string, string> = {
  "must-know": "text-primary",
  "high-freq": "text-accent",
  differentiator: "text-amber-500",
  secondary: "text-muted-foreground",
};

export default function PlanPage() {
  const { isSessionCompleted } = useProgress();

  const sessionMap = useMemo(() => {
    const map: Record<string, { number: number; title: string; status: string; isNew: boolean }> = {};
    curriculum.modules.forEach((m) =>
      m.sessions.forEach((s) => {
        map[s.id] = { number: s.number, title: s.title, status: s.status, isNew: s.isNew };
      })
    );
    return map;
  }, []);

  const renderItem = (item: string) => {
    if (item.startsWith("fund-")) {
      const t = fundamentals.topics.find((x) => x.id === item);
      return (
        <Link
          key={item}
          href={`/fundamentals/${item}`}
          className="block rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/50"
        >
          <span className="font-mono font-semibold text-muted-foreground">F{t?.number}</span> {t?.title}
        </Link>
      );
    }
    if (item.startsWith("problem:")) {
      const id = item.replace("problem:", "");
      const p = problems.find((x) => x.id === id);
      return (
        <Link
          key={item}
          href={`/problems?id=${id}`}
          className="block rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs hover:border-primary"
        >
          <span className="font-mono font-semibold text-primary">CASE</span> {p?.title.replace(/^Design an? /, "")}
          <span className={`ml-2 font-mono text-[10px] uppercase ${tierStyle[p?.tier ?? "secondary"]}`}>{p?.tier}</span>
          {p?.mustDo && <span className="ml-1 font-mono text-[10px] uppercase text-accent">must-do</span>}
        </Link>
      );
    }
    const s = sessionMap[item];
    const done = isSessionCompleted(item);
    return (
      <Link
        key={item}
        href={`/roadmap/${item}`}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs hover:border-primary/50"
      >
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : (
          <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        )}
        <span>
          <span className="font-mono font-semibold text-muted-foreground">S{String(s?.number).padStart(2, "0")}</span>{" "}
          {s?.title}
          {s?.isNew && <span className="ml-2 font-mono text-[10px] font-bold text-accent">NEW</span>}
          {s?.status === "skeleton" && <span className="ml-2 font-mono text-[10px] text-muted-foreground">skeleton</span>}
        </span>
      </Link>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
          <CalendarDays className="h-3.5 w-3.5" /> 10-Week Plan
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          From Foundations to Canonical Case Studies
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Target: {curriculum.candidate.targetProfile}. Phases 0 to 2 build the toolkit; Phase 3 case studies are interleaved from
          Week 3 so you apply each topic immediately.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {curriculum.phases.map((ph) => (
          <div key={ph.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">{ph.title}</h2>
              <span className="font-mono text-[11px] text-muted-foreground">{ph.weeks}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{ph.goal}</p>
            <ul className="mt-3 space-y-1 text-xs text-foreground/90">
              {ph.exitCriteria.map((c) => (
                <li key={c} className="flex gap-1.5">
                  <Target className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Week by week</h2>
        {curriculum.weeks.map((w) => {
          const phase = curriculum.phases.find((p) => p.number === w.phase);
          return (
            <div key={w.week} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs font-bold text-primary">Week {w.week}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{phase?.title}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{w.focus}</p>
              <div className="mt-3 grid gap-1.5 md:grid-cols-2">{w.items.map(renderItem)}</div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="h-3.5 w-3.5 text-accent" /> Milestone: {w.milestone}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
