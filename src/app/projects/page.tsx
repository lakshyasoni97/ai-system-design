"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ShieldAlert,
  TrendingUp,
  Cpu,
  Gauge,
  DollarSign,
  Award,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Columns,
  Maximize,
} from "lucide-react";
import projectsData from "@/data/projects.json";
import MermaidDiagram from "@/components/MermaidDiagram";

function ProjectsDefenseContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const initialProject =
    projectsData.find((p) => p.id === tabParam) || projectsData[0];

  const [activeId, setActiveId] = useState<string>(initialProject.id);
  const [hideAnswers, setHideAnswers] = useState<boolean>(false);
  const [revealedQuestions, setRevealedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [copiedPitch, setCopiedPitch] = useState<boolean>(false);
  const [diagramMode, setDiagramMode] = useState<"split" | "current" | "100x">("split");

  useEffect(() => {
    if (tabParam && projectsData.some((p) => p.id === tabParam)) {
      setActiveId(tabParam);
    }
  }, [tabParam]);

  const activeProject =
    projectsData.find((p) => p.id === activeId) || projectsData[0];

  const handleSelectProject = (id: string) => {
    setActiveId(id);
    router.replace(`/projects?tab=${id}`, { scroll: false });
  };

  const toggleQuestionReveal = (key: string) => {
    setRevealedQuestions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyPitch = async () => {
    try {
      await navigator.clipboard.writeText(activeProject.elevatorPitch);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary font-semibold">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>The 100x Scale Resume Defense Blueprints</span>
        </div>
        <h1 className="mt-2.5 text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
          4 Flagship Production Projects — Current vs. 100x Scale
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every architectural choice, latency budget, unit cost, and hostile
          interviewer follow-up mapped to Lakshya Soni&apos;s production work at
          Deloitte and Network18.
        </p>

        {/* 4 Project Tabs */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {projectsData.map((proj) => {
            const isSelected = proj.id === activeProject.id;
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => handleSelectProject(proj.id)}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                      proj.company === "Deloitte"
                        ? "bg-primary/20 text-primary"
                        : "bg-accent/20 text-accent"
                    }`}
                  >
                    {proj.company}
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <div className="mt-2 font-semibold text-xs sm:text-sm text-foreground line-clamp-2">
                  {proj.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. 30-Second Elevator Pitch & Impact Metrics */}
      <div id="pitch" className="rounded-2xl border border-border bg-card p-6 shadow-sm scroll-mt-24">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              {activeProject.company} • {activeProject.tag}
            </div>
            <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              {activeProject.title}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {activeProject.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyPitch}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {copiedPitch ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-semibold">Pitch Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Copy 30s Pitch</span>
              </>
            )}
          </button>
        </div>

        {/* Elevator Pitch Box */}
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="mb-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
            The 30-Second Elevator Pitch
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-foreground">
            {activeProject.elevatorPitch}
          </p>
        </div>

        {/* 4 Impact Metric KPIs */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {activeProject.impactMetrics.map((m, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="text-xs text-muted-foreground">{m.label}</div>
              <div className="mt-1 font-mono text-2xl font-bold text-primary">
                {m.value}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                {m.delta}
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack Badges */}
        <div className="mt-4 flex flex-wrap gap-1.5 pt-2">
          {activeProject.techStack.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-secondary px-2.5 py-1 font-mono text-xs text-accent font-semibold"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Architecture Diagrams with View Mode Switcher */}
      <div id="architecture" className="space-y-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Architecture Blueprint Comparison
            </h3>
            <p className="text-xs text-muted-foreground">
              Examine baseline production topology vs. 100x scale interview defense.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-secondary p-1">
            <button
              type="button"
              onClick={() => setDiagramMode("split")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                diagramMode === "split"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode("current")}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                diagramMode === "current"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Baseline Only
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode("100x")}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                diagramMode === "100x"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              100x Scale Focus
            </button>
          </div>
        </div>

        {/* Diagram Cards */}
        <div
          className={`grid gap-6 ${
            diagramMode === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {(diagramMode === "split" || diagramMode === "current") && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-base font-bold text-foreground">
                  1. Deployed Production Architecture
                </h4>
                <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground font-semibold">
                  Baseline Scale
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Actual production topology shipped at {activeProject.company}.
              </p>
              <MermaidDiagram
                chart={activeProject.currentArchitectureMermaid}
                title={`${activeProject.tag} — Baseline Topology`}
              />
            </div>
          )}

          {(diagramMode === "split" || diagramMode === "100x") && (
            <div className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="text-base font-bold text-primary">
                  2. 100x Scale Defense Architecture
                </h4>
                <span className="rounded bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  100x Interview Blueprint
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Re-architected for global multi-region QPS, fault isolation, and
                sub-second tail latency.
              </p>
              <MermaidDiagram
                chart={activeProject.scale100xArchitectureMermaid}
                title={`${activeProject.tag} — 100x Scale Defense`}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Hard Numbers Cheat Sheet */}
      <div id="numbers" className="rounded-2xl border border-border bg-card p-6 shadow-sm scroll-mt-24">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <Gauge className="h-5 w-5 text-accent" />
          <span>Hard Numbers Cheat Sheet (Memorize for Back-of-the-Envelope)</span>
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-primary font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>QPS Target</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
              {activeProject.hardNumbers.qps}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-accent font-semibold">
              <Cpu className="h-3.5 w-3.5" />
              <span>Daily Volume</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
              {activeProject.hardNumbers.dailyVolume}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-amber-600 dark:text-amber-400 font-semibold">
              <Gauge className="h-3.5 w-3.5" />
              <span>P50 / P99 Latency</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
              {activeProject.hardNumbers.latency}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-primary font-semibold">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Unit Economics</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
              {activeProject.hardNumbers.costPer1k}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-accent font-semibold">
              <Award className="h-3.5 w-3.5" />
              <span>Eval Metrics</span>
            </div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-foreground">
              {activeProject.hardNumbers.evalMetrics}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Top 5 Hostile Interviewer Questions & Bulletproof Answers */}
      <div id="questions" className="rounded-2xl border border-border bg-card p-6 shadow-sm scroll-mt-24">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Top 5 &ldquo;Hostile Interviewer&rdquo; Questions & Bulletproof
                Answers
              </h3>
              <p className="text-xs text-muted-foreground">
                Practice answering out loud before revealing the production
                defense response.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setHideAnswers((h) => !h);
              setRevealedQuestions({});
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {hideAnswers ? (
              <>
                <Eye className="h-4 w-4 text-primary" />
                <span>Show All Answers</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 text-amber-500" />
                <span>Self-Test Mode (Hide Answers)</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {activeProject.hostileQuestions.map((hq, idx) => {
            const qKey = `${activeProject.id}-q-${idx}`;
            const isVisible = !hideAnswers || revealedQuestions[qKey];

            return (
              <div
                key={qKey}
                className="rounded-xl border border-border bg-muted/20 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-destructive/15 font-mono text-xs font-bold text-destructive">
                      Q{idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
                      &ldquo;{hq.question}&rdquo;
                    </h4>
                  </div>

                  {hideAnswers && (
                    <button
                      type="button"
                      onClick={() => toggleQuestionReveal(qKey)}
                      className="shrink-0 rounded-lg border border-border bg-card px-3 py-1 font-mono text-xs text-primary font-semibold hover:bg-muted cursor-pointer"
                    >
                      {isVisible ? "Hide" : "Reveal Answer"}
                    </button>
                  )}
                </div>

                {isVisible && (
                  <div className="mt-3.5 border-t border-border pt-3.5 pl-9 text-sm leading-relaxed text-foreground/90">
                    {hq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsDefensePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-mono text-sm text-muted-foreground">
          Loading 100x Scale Project Blueprints...
        </div>
      }
    >
      <ProjectsDefenseContent />
    </Suspense>
  );
}
