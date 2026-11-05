"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, HelpCircle, ListChecks, Timer } from "lucide-react";
import problems from "@/data/problems.json";
import rolesData from "@/data/roles.json";
import MermaidDiagram from "@/components/MermaidDiagram";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/90">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function ProblemsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initial = problems.find((p) => p.id === params.get("id")) || problems[0];
  const [activeId, setActiveId] = useState(initial.id);
  const [trackFilter, setTrackFilter] = useState("all");
  const [practiceMode, setPracticeMode] = useState(true);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const p = problems.find((x) => x.id === activeId) || problems[0];
  const visible = problems.filter((x) => trackFilter === "all" || x.tracks.includes(trackFilter));

  const select = (id: string) => {
    setActiveId(id);
    setRevealed({});
    router.replace(`/problems?id=${id}`, { scroll: false });
  };

  const showSolution = !practiceMode || revealed["solution"];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
          <ListChecks className="h-3.5 w-3.5" /> Problem Bank
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Standard AI system design problems
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Unseen-prompt practice. Open a problem, spend 10 minutes on requirements and estimation on paper, then reveal the
          reference outline. Each problem maps back to your resume and to curriculum sessions.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={trackFilter}
            onChange={(e) => setTrackFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
          >
            <option value="all">All tracks</option>
            {rolesData.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setPracticeMode((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
          >
            {practiceMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Practice mode: {practiceMode ? "on (solution hidden)" : "off"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-4">
          {visible.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => select(x.id)}
              className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-colors ${
                x.id === p.id ? "border-primary/60 bg-primary/10" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="text-sm font-semibold text-foreground">{x.title.replace(/^Design an? /, "")}</div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>{x.difficulty}</span>
                <span className="text-primary">{x.tier}</span>
                <span>W{x.week}</span>
                {x.mustDo && <span className="text-accent">must-do</span>}
                {x.status === "skeleton" && <span className="rounded bg-muted px-1">skeleton</span>}
              </div>
            </button>
          ))}
          {visible.length === 0 && <p className="text-sm text-muted-foreground">No problems for this track.</p>}
        </div>

        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-primary">{p.difficulty}</span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                <Timer className="h-3.5 w-3.5" /> 45 min
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-foreground">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{p.prompt}</p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] text-muted-foreground">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">tier: {p.tier}</span>
              <span className="rounded bg-muted px-2 py-0.5">week {p.week}</span>
              {p.mustDo && <span className="rounded bg-accent/10 px-2 py-0.5 text-accent">must-do</span>}
            </div>
            {p.status === "skeleton" && (
              <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                Skeleton: the reference solution is not written yet. Use the clarifying questions and deep-dive prompts to practise cold.
              </p>
            )}
          </div>

          <Section title="1. Clarifying questions to ask">
            <List items={p.clarifying} />
          </Section>

          {practiceMode && !revealed["solution"] && (
            <button
              type="button"
              onClick={() => setRevealed((r) => ({ ...r, solution: true }))}
              className="w-full cursor-pointer rounded-2xl border border-dashed border-primary/50 bg-primary/5 py-4 text-sm font-semibold text-primary hover:bg-primary/10"
            >
              Reveal reference solution
            </button>
          )}

          {showSolution && (
            <>
              <Section title="2. Back-of-the-envelope estimation">
                <List items={p.estimation} />
              </Section>
              <Section title="3. Architecture outline">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/90">
                  {p.architecture.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </Section>
              <MermaidDiagram chart={p.mermaid} title={`${p.title.replace(/^Design an? /, "")} — Reference Architecture`} />
              <Section title="4. Deep dives (hostile interviewer)">
                <div className="space-y-3">
                  {p.deepDives.map((d, i) => {
                    const key = `dd-${i}`;
                    return (
                      <div key={key} className="rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex items-start gap-2 text-sm font-semibold text-foreground">
                          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {d.q}
                        </div>
                        {revealed[key] ? (
                          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{d.a}</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRevealed((r) => ({ ...r, [key]: true }))}
                            className="mt-2 cursor-pointer font-mono text-xs font-semibold text-primary"
                          >
                            Try answering, then reveal
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
              <div className="grid gap-4 md:grid-cols-2">
                <Section title="Key trade-offs">
                  <List items={p.tradeoffs} />
                </Section>
                <Section title="Failure modes">
                  <List items={p.failureModes} />
                </Section>
              </div>
              <Section title="Follow-up extensions">
                <List items={p.followUps} />
              </Section>
            </>
          )}

          {p.upgradeNotes.length > 0 && (
            <Section title="Planned upgrades to this reference solution">
              <List items={p.upgradeNotes} />
            </Section>
          )}

          <Section title="Connect to your experience & study">
            <p className="mb-3 text-sm text-foreground/90">
              <span className="font-semibold">Resume tie-in:</span> {p.resumeTie}
            </p>
            <div className="flex flex-wrap gap-2">
              {p.relatedSessions.map((sid) => (
                <Link
                  key={sid}
                  href={`/roadmap/${sid}`}
                  className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] text-foreground hover:border-primary/50"
                >
                  {sid.replace("session-", "Session ")}
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading problems…</div>}>
      <ProblemsContent />
    </Suspense>
  );
}
