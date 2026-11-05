"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Briefcase, CalendarDays, Search, Target } from "lucide-react";
import rolesData from "@/data/roles.json";
import curriculum from "@/data/curriculum.json";
import problems from "@/data/problems.json";
import fundamentals from "@/data/fundamentals.json";

const moduleLabels: Record<string, string> = {
  fund: "M0 · Fundamentals",
  "mod-1": "M1 · Backend, Cache & Capacity",
  "mod-2": "M2 · RAG, Search & Multimodal",
  "mod-3": "M3 · Agents, Memory & Latency",
  "mod-4": "M4 · Models & Serving",
  "mod-5": "M5 · LLMOps, Evals, Security",
};

const weightText: Record<number, string> = { 3: "Core", 2: "Solid", 1: "Skim", 0: "Skip" };

export default function RolesPage() {
  const [activeId, setActiveId] = useState(rolesData.roles[0].id);
  const role = rolesData.roles.find((r) => r.id === activeId) || rolesData.roles[0];

  const sessionMap = useMemo(() => {
    const map: Record<string, { number: number; title: string }> = {};
    curriculum.modules.forEach((m) =>
      m.sessions.forEach((s) => {
        map[s.id] = { number: s.number, title: s.title };
      })
    );
    return map;
  }, []);

  const renderSessions = (ids: string[], tone: string) =>
    ids.length === 0 ? (
      <p className="text-xs text-muted-foreground">None — everything is relevant to this track.</p>
    ) : (
      <ul className="space-y-1.5">
        {ids.map((id) => (
          <li key={id}>
            <Link
              href={`/roadmap/${id}`}
              className={`block rounded-lg border px-3 py-1.5 text-xs transition-colors hover:border-primary/50 ${tone}`}
            >
              <span className="font-mono font-semibold">S{String(sessionMap[id]?.number).padStart(2, "0")}</span>{" "}
              {sessionMap[id]?.title}
            </Link>
          </li>
        ))}
      </ul>
    );

  const planLink = (item: string) => {
    if (item.startsWith("fund-")) {
      const t = fundamentals.topics.find((x) => x.id === item);
      return { href: `/fundamentals/${item}`, label: t ? `F${t.number}` : item };
    }
    if (item.startsWith("problem:")) {
      const id = item.replace("problem:", "");
      return { href: `/problems?id=${id}`, label: `Problem: ${id}` };
    }
    return { href: `/roadmap/${item}`, label: `S${String(sessionMap[item]?.number).padStart(2, "0")}` };
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
          <Target className="h-3.5 w-3.5" /> Target Roles
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Which positions to target and how to study for each
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{rolesData.intro}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {rolesData.roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActiveId(r.id)}
            className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
              r.id === activeId
                ? "border-primary/60 bg-primary/10 shadow-sm"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary">{r.priority}</span>
            <div className="mt-1 text-sm font-bold text-foreground">{r.title}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{r.fit}</div>
          </button>
        ))}
      </div>

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-foreground">{role.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{role.tagline}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
              <Search className="h-4 w-4 text-primary" /> Job titles to search
            </h3>
            <div className="flex flex-wrap gap-2">
              {role.titlesToSearch.map((t) => (
                <span key={t} className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs text-foreground">
                  {t}
                </span>
              ))}
            </div>
            <h3 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-foreground">
              <Briefcase className="h-4 w-4 text-primary" /> Where these roles live
            </h3>
            <p className="text-sm text-foreground/90">{role.targetCompanies}</p>
            <h3 className="mb-2 mt-5 text-sm font-bold text-foreground">What interviews test</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
              {role.whatTheyTest.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <h3 className="mb-2 mt-5 text-sm font-bold text-foreground">How to frame your resume</h3>
            <p className="text-sm text-foreground/90">{role.resumeFraming}</p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-bold text-foreground">Study weight by module</h3>
            <div className="space-y-2">
              {Object.entries(role.weights).map(([key, w]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 font-mono text-[11px] text-muted-foreground">{moduleLabels[key]}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary" style={{ width: `${(w / 3) * 100}%`, opacity: w === 0 ? 0.2 : 1 }} />
                  </div>
                  <span className="w-10 font-mono text-[11px] font-semibold text-foreground">{weightText[w]}</span>
                </div>
              ))}
            </div>

            <h3 className="mb-2 mt-5 flex items-center gap-2 text-sm font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Gaps to close for this track
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/90">
              {role.gapsToClose.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>

            <h3 className="mb-2 mt-5 text-sm font-bold text-foreground">Practice problems</h3>
            <div className="flex flex-wrap gap-2">
              {role.problems.map((pid) => {
                const p = problems.find((x) => x.id === pid);
                return (
                  <Link
                    key={pid}
                    href={`/problems?id=${pid}`}
                    className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    {p?.title.replace(/^Design an? /, "") || pid}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-bold text-primary">Must do</h3>
            {renderSessions(role.mustDo, "border-primary/30 bg-primary/5 text-foreground")}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-foreground">Skim</h3>
            {renderSessions(role.skim, "border-border bg-muted/20 text-foreground")}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold text-muted-foreground">Skip for now</h3>
            {renderSessions(role.skip, "border-border bg-muted/10 text-muted-foreground")}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" /> {rolesData.studyPlan.title}
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Weeks 3–6 are the baseline; use the selected track above to skip or skim sessions.
        </p>
        <div className="space-y-2">
          {rolesData.studyPlan.weeks.map((w) => (
            <div key={w.week} className="flex flex-col gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:flex-row sm:items-center">
              <div className="w-16 shrink-0 font-mono text-xs font-bold text-primary">Week {w.week}</div>
              <div className="flex-1 text-sm text-foreground">{w.focus}</div>
              <div className="flex flex-wrap gap-1.5">
                {w.do.map((item) => {
                  const l = planLink(item);
                  return (
                    <Link
                      key={item}
                      href={l.href}
                      className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-foreground hover:border-primary/50"
                    >
                      {l.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
