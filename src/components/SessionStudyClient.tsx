"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Clock,
  ArrowLeft,
  ArrowRight,
  Layers,
  Briefcase,
} from "lucide-react";
import MarkdownArticle, { TocQuickJump } from "./MarkdownArticle";
import FlashcardPlayer, { FlashcardItem } from "./FlashcardPlayer";
import ReadingList from "./ReadingList";
import StudyScratchpad from "./StudyScratchpad";
import ScenarioQuiz, { QuizQuestion } from "./ScenarioQuiz";
import resourcesData from "@/data/resources.json";
import { useProgress } from "./ProgressProvider";

interface SessionMeta {
  id: string;
  number: number;
  title: string;
  projectTieIn: string;
  estimatedReadTime?: string;
  studyPrompt: string;
  moduleId: string;
  moduleTitle: string;
}

interface SessionStudyClientProps {
  session: SessionMeta;
  markdownContent: string;
  sessionFlashcards: FlashcardItem[];
  sessionQuizzes?: QuizQuestion[];
  prevSession: { id: string; number: number; title: string } | null;
  nextSession: { id: string; number: number; title: string } | null;
}

export default function SessionStudyClient({
  session,
  markdownContent,
  sessionFlashcards,
  sessionQuizzes = [],
  prevSession,
  nextSession,
}: SessionStudyClientProps) {
  const {
    isSessionCompleted,
    toggleSessionCompleted,
    scratchpadNotes,
    getHighlightsForSource,
    quizResults,
  } = useProgress();

  const quizAnsweredCount = useMemo(
    () => sessionQuizzes.filter((q) => Boolean(quizResults[q.id])).length,
    [sessionQuizzes, quizResults]
  );
  const quizCorrectCount = useMemo(
    () => sessionQuizzes.filter((q) => quizResults[q.id]?.isCorrect).length,
    [sessionQuizzes, quizResults]
  );

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const completed = isSessionCompleted(session.id);
  const personalNote = scratchpadNotes[session.id] || "";
  const sessionHighlights = getHighlightsForSource(session.id);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(session.studyPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  const quickJumps: TocQuickJump[] = useMemo(() => {
    const jumps: TocQuickJump[] = [];
    if (sessionHighlights.length > 0) {
      jumps.push({
        id: "page-highlights-drawer",
        label: "Highlights & Comments",
        badge: String(sessionHighlights.length),
        tone: "emerald",
      });
    }
    jumps.push({
      id: "session-scratchpad",
      label: "Architect Notebook",
      dot: Boolean(personalNote.trim()),
      tone: "amber",
    });
    if (sessionQuizzes.length > 0) {
      jumps.push({
        id: "session-quiz",
        label: "Scenario Quiz",
        badge:
          quizAnsweredCount > 0
            ? `${quizCorrectCount}/${sessionQuizzes.length}`
            : undefined,
        tone: "amber",
      });
    }
    jumps.push({
      id: "session-flashcards",
      label: "Flashcards",
      tone: "primary",
    });
    return jumps;
  }, [
    sessionHighlights.length,
    personalNote,
    sessionQuizzes.length,
    quizAnsweredCount,
    quizCorrectCount,
  ]);

  const readingItems =
    (
      resourcesData.sessions as Record<
        string,
        { title: string; type: string; why: string; url?: string; href?: string }[]
      >
    )[session.id] || [];

  return (
    <div className="relative space-y-8">
      {/* 1. Header Bar */}
      <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/curriculum"
              className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Session {String(session.number).padStart(2, "0")} of 31
            </Link>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {session.estimatedReadTime || "15 min read"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary font-semibold">
              <Briefcase className="h-3.5 w-3.5" />
              {session.projectTieIn}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary font-semibold">Prompt Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span>Copy Socratic Prompt</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleSessionCompleted(session.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                completed
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground/60" />
                  <span>Mark as Completed</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-mono text-xs text-muted-foreground">
            {session.moduleTitle}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
            {session.title}
          </h1>
        </div>
      </div>

      {/* 2. Unified Study Reader + Sticky Right-Rail TOC */}
      <MarkdownArticle
        content={markdownContent}
        diagramTitle={`Session ${String(session.number).padStart(2, "0")} — Architecture`}
        sourceType="session"
        sourceId={session.id}
        sourceTitle={`Session ${String(session.number).padStart(2, "0")}: ${session.title}`}
        href={`/roadmap/${session.id}`}
        showToc
        tocQuickJumps={quickJumps}
        footerContent={
          <div className="space-y-8 pt-2">
            {/* Reading list */}
            <ReadingList items={readingItems} />

            {/* Personal Session Scratchpad (collapsed when empty to reduce clutter) */}
            <StudyScratchpad
              sourceId={session.id}
              sourceTitle={`Session ${String(session.number).padStart(2, "0")}: ${session.title}`}
              placeholder="Jot down personal metrics, interview analogies, or trade-offs to remember for this session..."
              collapsibleWhenEmpty
            />

            {/* Scenario & Trade-Off Defense Quiz */}
            {sessionQuizzes.length > 0 && (
              <div id="session-quiz" className="scroll-mt-24">
                <ScenarioQuiz
                  questions={sessionQuizzes}
                  sourceTitle={session.title}
                  sourceId={session.id}
                  isTopicCompleted={completed}
                  onMarkTopicCompleted={() => toggleSessionCompleted(session.id)}
                />
              </div>
            )}

            {/* Check Your Understanding — Session Flashcards */}
            <div
              id="session-flashcards"
              className="rounded-3xl border border-border bg-card p-6 shadow-sm scroll-mt-24"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <Layers className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Check Your Understanding
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Active recall testing on the key architectural trade-offs of{" "}
                      {session.title}
                    </p>
                  </div>
                </div>
                <Link
                  href="/flashcards"
                  className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/20 transition-colors font-semibold"
                >
                  All Flashcards →
                </Link>
              </div>

              <FlashcardPlayer cards={sessionFlashcards} compact />
            </div>

            {/* Prev / Next Session Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              {prevSession ? (
                <Link
                  href={`/roadmap/${prevSession.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      Previous Session
                    </div>
                    <div className="font-semibold text-foreground">
                      S{prevSession.number}: {prevSession.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextSession && (
                <Link
                  href={`/roadmap/${nextSession.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-right text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-sm"
                >
                  <div>
                    <div className="font-mono text-[11px] text-primary font-semibold">
                      Next Session
                    </div>
                    <div className="font-semibold text-foreground">
                      S{nextSession.number}: {nextSession.title}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
