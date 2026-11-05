"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import fundamentalsData from "@/data/fundamentals.json";
import problemsData from "@/data/problems.json";
import flashcardsData from "@/data/flashcards.json";
import { useProgress } from "@/components/ProgressProvider";
import JourneyMap from "@/components/JourneyMap";

export default function DashboardPage() {
  const { isItemCompleted, toggleItemCompleted, getFlashcardRating } =
    useProgress();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [recommendationMode, setRecommendationMode] = useState<"ROADMAP" | "READY">("ROADMAP");

  // Flatten all sessions across modules
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

  // Flatten the full 10-Week sequence (Fundamentals + Sessions + Case Studies)
  const sequenceItems = useMemo(() => {
    const list: Array<{
      id: string;
      rawId: string;
      week: number;
      phaseNumber: number;
      phaseTitle: string;
      weekFocus: string;
      weekMilestone: string;
      type: "fundamental" | "session" | "problem";
      typeLabel: string;
      title: string;
      subtitle: string;
      href: string;
      readTime: string;
      status: "written" | "skeleton";
      studyPrompt: string;
      isCompleted: boolean;
      tier?: string;
    }> = [];

    const sessionMap = new Map<string, (typeof allSessions)[0]>();
    allSessions.forEach((s) => sessionMap.set(s.id, s));

    const fundMap = new Map<string, (typeof fundamentalsData.topics)[0]>();
    fundamentalsData.topics.forEach((t) => fundMap.set(t.id, t));

    const problemMap = new Map<string, (typeof problemsData)[0]>();
    problemsData.forEach((p) => problemMap.set(p.id, p));

    const phaseMap = new Map<number, (typeof curriculumData.phases)[0]>();
    curriculumData.phases.forEach((p) => phaseMap.set(p.number, p));

    curriculumData.weeks.forEach((w) => {
      const phase = phaseMap.get(w.phase);
      w.items.forEach((itemId) => {
        if (itemId.startsWith("fund-")) {
          const t = fundMap.get(itemId);
          if (t) {
            list.push({
              id: itemId,
              rawId: itemId,
              week: w.week,
              phaseNumber: w.phase,
              phaseTitle: phase?.title || `Phase ${w.phase}`,
              weekFocus: w.focus,
              weekMilestone: w.milestone,
              type: "fundamental",
              typeLabel: "Distributed Fundamental",
              title: `Topic ${t.number}: ${t.title}`,
              subtitle: t.aiTieIn,
              href: `/fundamentals/${t.id}`,
              readTime: t.readTime,
              status: t.status as "written" | "skeleton",
              studyPrompt: `Explain ${t.title} from first principles with everyday analogies, edge cases, failure scenarios, and AI system tie-ins (Vector DB replicas, agent state, rate limits).`,
              isCompleted: isItemCompleted(itemId),
            });
          }
        } else if (itemId.startsWith("problem:")) {
          const pId = itemId.replace("problem:", "");
          const p = problemMap.get(pId);
          if (p) {
            list.push({
              id: itemId,
              rawId: pId,
              week: w.week,
              phaseNumber: w.phase,
              phaseTitle: phase?.title || `Phase ${w.phase}`,
              weekFocus: w.focus,
              weekMilestone: w.milestone,
              type: "problem",
              typeLabel: "Canonical Case Study",
              title: p.title,
              subtitle: p.resumeTie,
              href: `/problems?id=${p.id}`,
              readTime: "45 min mock",
              status: p.status as "written" | "skeleton",
              studyPrompt: `You are a Principal AI Architect interviewing me for a Senior AI Engineer position. Prompt: "${p.prompt}". Wait for my clarifying questions and back-of-the-envelope estimation before moving to architecture.`,
              isCompleted: isItemCompleted(itemId) || isItemCompleted(pId),
              tier: p.tier,
            });
          }
        } else if (itemId.startsWith("session-")) {
          const s = sessionMap.get(itemId);
          if (s) {
            list.push({
              id: itemId,
              rawId: itemId,
              week: w.week,
              phaseNumber: w.phase,
              phaseTitle: phase?.title || `Phase ${w.phase}`,
              weekFocus: w.focus,
              weekMilestone: w.milestone,
              type: "session",
              typeLabel: "Curriculum Session",
              title: `Session ${String(s.number).padStart(2, "0")}: ${s.title}`,
              subtitle: s.projectTieIn,
              href: `/roadmap/${s.id}`,
              readTime: s.estimatedReadTime || "15 min",
              status: s.status as "written" | "skeleton",
              studyPrompt: s.studyPrompt,
              isCompleted: isItemCompleted(itemId),
            });
          }
        }
      });
    });

    return list;
  }, [allSessions, isItemCompleted]);

  // Primary recommendation: first uncompleted item in 10-week sequence
  const roadmapNextItem = useMemo(() => {
    return sequenceItems.find((item) => !item.isCompleted) || sequenceItems[0];
  }, [sequenceItems]);

  // Secondary recommendation: first uncompleted item that is FULLY WRITTEN
  const readyNextItem = useMemo(() => {
    return (
      sequenceItems.find((item) => !item.isCompleted && item.status === "written") ||
      roadmapNextItem
    );
  }, [sequenceItems, roadmapNextItem]);

  const activeNextItem =
    recommendationMode === "ROADMAP" ? roadmapNextItem : readyNextItem;

  // Items for the current active week
  const currentWeekItems = useMemo(() => {
    return sequenceItems.filter((i) => i.week === activeNextItem.week);
  }, [sequenceItems, activeNextItem.week]);

  const currentWeekDoneCount = useMemo(() => {
    return currentWeekItems.filter((i) => i.isCompleted).length;
  }, [currentWeekItems]);

  // Overall Statistics
  const totalRoadmapItems = sequenceItems.length;
  const totalCompletedRoadmapItems = sequenceItems.filter((i) => i.isCompleted).length;
  const overallCompletionPct = Math.round(
    (totalCompletedRoadmapItems / (totalRoadmapItems || 1)) * 100
  );

  const completedSessionsCount = allSessions.filter((s) => isItemCompleted(s.id)).length;
  const completedFundamentalsCount = fundamentalsData.topics.filter((t) => isItemCompleted(t.id)).length;
  const completedProblemsCount = problemsData.filter((p) => isItemCompleted(p.id) || isItemCompleted(`problem:${p.id}`)).length;

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
      await navigator.clipboard.writeText(activeNextItem.studyPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HERO: Greeting & 10-Week Sequence Next Action */}
      <section className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Compass className="h-3.5 w-3.5" />
              <span>AI System Design Study Portal · 10-Week Mastery</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {curriculumData.candidate.name.split(" ")[0]}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Master distributed systems, production RAG, multi-agent systems, LLM serving, and 18 canonical case studies for AI-native startups and product companies.
            </p>
          </div>

          {/* Overall Readiness KPI Card */}
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-secondary/50 p-4 sm:min-w-[260px]">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span className="font-semibold text-foreground">10-Week Progress</span>
              <span className="font-mono font-semibold text-foreground">
                {totalCompletedRoadmapItems} / {totalRoadmapItems} Items
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${overallCompletionPct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/50 text-[11px] font-mono text-muted-foreground text-center">
              <div>
                <span className="font-bold text-foreground">{completedFundamentalsCount}/8</span>
                <div className="text-[10px] text-muted-foreground">Fund.</div>
              </div>
              <div>
                <span className="font-bold text-foreground">{completedSessionsCount}/31</span>
                <div className="text-[10px] text-muted-foreground">Sessions</div>
              </div>
              <div>
                <span className="font-bold text-foreground">{completedProblemsCount}/18</span>
                <div className="text-[10px] text-muted-foreground">Cases</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Next Step Recommendation Banner */}
        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/5 p-4 sm:p-5 transition-all hover:border-primary/60">
          <div className="flex flex-col gap-4">
            {/* Top Bar: Mode Switcher & Week Identifier */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-primary/15 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-0.5 font-mono text-xs font-semibold text-primary-foreground">
                  <Flame className="h-3.5 w-3.5" />
                  NEXT UP
                </span>
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  Week {activeNextItem.week} · {activeNextItem.phaseTitle}
                </span>
                <span className="rounded border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                  {activeNextItem.typeLabel}
                </span>
                {activeNextItem.status === "written" ? (
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    DEEP-DIVE READY
                  </span>
                ) : (
                  <span className="rounded bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                    SKELETON PROMPT
                  </span>
                )}
              </div>

              {/* Toggle: 10-Week Sequence vs Next Ready Guide */}
              <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRecommendationMode("ROADMAP")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    recommendationMode === "ROADMAP"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  10-Week Sequence
                </button>
                <button
                  type="button"
                  onClick={() => setRecommendationMode("READY")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    recommendationMode === "READY"
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Next Ready Guide
                </button>
              </div>
            </div>

            {/* Middle: Title & Subtitle */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1.5 max-w-3xl">
                <h2 className="text-lg font-bold text-foreground sm:text-xl">
                  {activeNextItem.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Anchor / System Tie:</span>{" "}
                  {activeNextItem.subtitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Week {activeNextItem.week} Milestone:</span>{" "}
                  {activeNextItem.weekMilestone}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
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
                  href={activeNextItem.href}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 transition-opacity"
                >
                  <span>
                    {activeNextItem.type === "problem"
                      ? "Open Problem"
                      : activeNextItem.type === "fundamental"
                      ? "Study Topic"
                      : "Open Session"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Bottom: Week Tasks Strip */}
            <div className="pt-2 border-t border-primary/10">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span className="font-mono font-semibold text-foreground">
                  Week {activeNextItem.week} Checklist ({currentWeekDoneCount}/{currentWeekItems.length} Done)
                </span>
                <Link
                  href="/plan"
                  className="text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>View 10-Week Plan</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentWeekItems.map((item) => {
                  const isCurrent = item.id === activeNextItem.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary/20 text-primary font-semibold ring-1 ring-primary/40"
                          : item.isCompleted
                          ? "border-border/60 bg-secondary/60 text-muted-foreground hover:text-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      }`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="truncate max-w-[180px] sm:max-w-[240px]">
                        {item.title.replace(/^Session \d+: /, "").replace(/^Topic \d+: /, "").replace(/^Design an? /, "")}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE BIG PICTURE JOURNEY MAP */}
      <section className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
        <JourneyMap />
      </section>
    </div>
  );
}
