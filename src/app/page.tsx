"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Layers,
  ShieldCheck,
  Calculator,
  Compass,
  Flame,
  Copy,
  Check,
  Clock,
  Sparkles,
  GitFork,
  BookOpen,
  Target,
  Library,
  ListChecks,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import flashcardsData from "@/data/flashcards.json";
import { useProgress } from "@/components/ProgressProvider";
import JourneyMap from "@/components/JourneyMap";

export default function DashboardPage() {
  const { completedSessions, isSessionCompleted, getFlashcardRating } =
    useProgress();
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Flatten all sessions
  const allSessions = useMemo(
    () =>
      curriculumData.modules.flatMap((mod) =>
        mod.sessions.map((s) => ({
          ...s,
          moduleId: mod.id,
          moduleTitle: mod.title,
        }))
      ),
    []
  );

  // The single recommended next action
  const nextUpSession = useMemo(() => {
    return allSessions.find((s) => !isSessionCompleted(s.id)) || allSessions[0];
  }, [allSessions, isSessionCompleted]);

  const completionPct = Math.round(
    (completedSessions.length / allSessions.length) * 100
  );

  // Flashcard statistics
  const flashcardStats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let unseen = 0;
    for (const card of flashcardsData) {
      const r = getFlashcardRating(card.id);
      if (r === "easy") easy++;
      else if (r === "medium") medium++;
      else if (r === "hard") hard++;
      else unseen++;
    }
    return { easy, medium, hard, unseen, total: flashcardsData.length };
  }, [getFlashcardRating]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(nextUpSession.studyPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO: Greeting & Single Recommended Next Action */}
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Compass className="h-3.5 w-3.5" />
              <span>AI System Design Study Portal</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {curriculumData.candidate.name.split(" ")[0]}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Master 100x scale distributed architectures, production RAG,
              multi-agent systems, and LLMOps. Follow your 20-session roadmap below.
            </p>
          </div>

          {/* Overall Readiness KPI Card */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/50 p-4 sm:min-w-[220px]">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Overall Readiness</span>
              <span className="font-mono font-semibold text-foreground">
                {completedSessions.length} / {allSessions.length} Done
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{completionPct}% Complete</span>
              <span>{allSessions.length - completedSessions.length} To Go</span>
            </div>
          </div>
        </div>

        {/* Highlighted Next Step Banner */}
        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5 transition-all hover:border-primary/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2 py-0.5 font-mono text-[11px] font-semibold text-primary-foreground">
                  <Flame className="h-3 w-3" />
                  NEXT UP
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {nextUpSession.moduleTitle}
                </span>
              </div>

              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Session {String(nextUpSession.number).padStart(2, "0")}:{" "}
                {nextUpSession.title}
              </h2>

              <p className="text-xs text-muted-foreground">
                Anchor:{" "}
                <span className="text-foreground font-medium">
                  {nextUpSession.projectTieIn}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Copy Socratic AI Study Prompt"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary font-semibold">Prompt Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <Link
                href={`/roadmap/${nextUpSession.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 transition-opacity"
              >
                <span>Continue Session {String(nextUpSession.number).padStart(2, "0")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE BIG PICTURE JOURNEY MAP */}
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <JourneyMap />
      </section>

      {/* 2.5 CORE STRATEGY & FOUNDATIONS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Target Strategy, Fundamentals & Problem Bank
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Role alignment, distributed systems building blocks, and standard GenAI interview prompts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Target Roles */}
          <Link
            href="/roles"
            className="group relative flex flex-col justify-between rounded-2xl border border-primary/30 bg-card p-5 transition-all hover:border-primary/60 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Target className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-primary group-hover:underline">
                  5 Role Tracks →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Target Positions & 8-Week Plan
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Applied AI, Agent Platform, LLM Infra, AI Solutions Architect, and ML Engineer role weighting.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span className="text-primary font-semibold">Priority Tracks & Gaps</span>
            </div>
          </Link>

          {/* Module 0: Fundamentals */}
          <Link
            href="/fundamentals"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Library className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  Module 0 (8 Topics) →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Distributed Systems Fundamentals
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Replication, sharding, storage engines, queues vs. logs, rate limits, and latency math.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span>Classic systems building blocks</span>
            </div>
          </Link>

          {/* Problem Bank */}
          <Link
            href="/problems"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <ListChecks className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  8 Problems →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Standard AI System Design Bank
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Enterprise RAG, ChatGPT clone, LLM Gateway, Coding Sandbox, and High-QPS Serving.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span>Interactive practice mode</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. THREE FOCUSED PRACTICE PATHWAYS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Interview Defense Arenas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active recall, hostile architecture cross-examination, and live capacity math.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Flashcards */}
          <Link
            href="/flashcards"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  {flashcardStats.total} Cards →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Flashcards
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Spaced repetition for architectural trade-offs, vector limits, and distributed edge cases.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span className="text-destructive font-semibold">
                {flashcardStats.hard} hard
              </span>
              <span>•</span>
              <span className="text-primary font-semibold">
                {flashcardStats.easy} mastered
              </span>
            </div>
          </Link>

          {/* Projects */}
          <Link
            href="/projects"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  4 Blueprints →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Projects
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Baseline vs. 100x architectures & hostile interviewer Q&As for Deloitte & Network18.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-primary font-medium border-t border-border/60 pt-2.5">
              <span>Deloitte & Network18 Defense</span>
            </div>
          </Link>

          {/* Mock Interview */}
          <Link
            href="/simulator"
            className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Calculator className="h-4.5 w-4.5" />
                </div>
                <span className="font-mono text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                  Simulator →
                </span>
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">
                Mock Interview
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                45-minute pacing timer, stage checklists, and live HNSW RAM / QPS capacity calculator.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span>5-Stage Pacing & Calculator</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
