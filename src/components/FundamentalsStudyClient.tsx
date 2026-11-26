"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Cpu } from "lucide-react";
import MarkdownArticle, { TocQuickJump } from "./MarkdownArticle";
import ReadingList, { ReadingItem } from "./ReadingList";
import StudyScratchpad from "./StudyScratchpad";
import ScenarioQuiz, { QuizQuestion } from "./ScenarioQuiz";
import AudioOverviewPlayer, { AudioOverviewMeta } from "./AudioOverviewPlayer";
import audioData from "@/data/audio.json";
import { useProgress } from "./ProgressProvider";
import fundamentalsData from "@/data/fundamentals.json";

export function useFundamentalsDone() {
  const { completedItems, toggleItemCompleted, isItemCompleted } = useProgress();
  return {
    done: completedItems.filter((id) => id.startsWith("fund-")),
    toggle: toggleItemCompleted,
    isDone: isItemCompleted,
  };
}

interface Topic {
  id: string;
  number: number;
  title: string;
  readTime: string;
  aiTieIn: string;
}

export default function FundamentalsStudyClient({
  topic,
  content,
  reading,
  quizzes = [],
  prev,
  next,
}: {
  topic: Topic;
  content: string;
  reading: ReadingItem[];
  quizzes?: QuizQuestion[];
  prev: Topic | null;
  next: Topic | null;
}) {
  const { isDone: checkDone, toggle } = useFundamentalsDone();
  const { scratchpadNotes, getHighlightsForSource, quizResults } = useProgress();
  const isDone = checkDone(topic.id);
  const topicAudio = (audioData as Record<string, AudioOverviewMeta>)[topic.id];

  const topicHighlights = getHighlightsForSource(topic.id);
  const personalNote = scratchpadNotes[topic.id] || "";
  const quizAnsweredCount = useMemo(
    () => quizzes.filter((q) => Boolean(quizResults[q.id])).length,
    [quizzes, quizResults]
  );
  const quizCorrectCount = useMemo(
    () => quizzes.filter((q) => quizResults[q.id]?.isCorrect).length,
    [quizzes, quizResults]
  );

  const handleToggle = () => {
    toggle(topic.id);
  };

  const quickJumps: TocQuickJump[] = useMemo(() => {
    const jumps: TocQuickJump[] = [];
    if (topicHighlights.length > 0) {
      jumps.push({
        id: "page-highlights-drawer",
        label: "Highlights & Comments",
        badge: String(topicHighlights.length),
        tone: "emerald",
      });
    }
    jumps.push({
      id: "session-scratchpad",
      label: "Architect Notebook",
      dot: Boolean(personalNote.trim()),
      tone: "amber",
    });
    if (quizzes.length > 0) {
      jumps.push({
        id: "topic-quiz",
        label: "Scenario Quiz",
        badge:
          quizAnsweredCount > 0
            ? `${quizCorrectCount}/${quizzes.length}`
            : undefined,
        tone: "amber",
      });
    }
    return jumps;
  }, [
    topicHighlights.length,
    personalNote,
    quizzes.length,
    quizAnsweredCount,
    quizCorrectCount,
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/fundamentals"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Module 0 / Topic {topic.number} of {fundamentalsData.topics.length}
            </Link>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {topic.readTime}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
              <Cpu className="h-3.5 w-3.5" />
              {topic.aiTieIn}
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
              isDone
                ? "border-primary/50 bg-primary/20 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
            {isDone ? "Completed" : "Mark as Completed"}
          </button>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{topic.title}</h1>
      </div>

      {topicAudio && <AudioOverviewPlayer conceptId={topic.id} audio={topicAudio} />}

      <MarkdownArticle
        content={content}
        diagramTitle={`Fundamentals ${topic.number} — Diagram`}
        sourceType="fundamental"
        sourceId={topic.id}
        sourceTitle={`Topic ${topic.number}: ${topic.title}`}
        href={`/fundamentals/${topic.id}`}
        showToc
        tocQuickJumps={quickJumps}
        footerContent={
          <div className="space-y-6 pt-2">
            {quizzes.length > 0 && (
              <div id="topic-quiz" className="scroll-mt-24">
                <ScenarioQuiz
                  questions={quizzes}
                  sourceTitle={topic.title}
                  sourceId={topic.id}
                  isTopicCompleted={isDone}
                  onMarkTopicCompleted={handleToggle}
                />
              </div>
            )}
            <ReadingList items={reading} />
            <StudyScratchpad
              sourceId={topic.id}
              sourceTitle={`Topic ${topic.number}: ${topic.title}`}
              placeholder="Jot down core distributed systems invariants, CAP/PACELC trade-offs, or AI tie-ins for this topic..."
              collapsibleWhenEmpty
            />

            <div className="flex items-center justify-between gap-3">
              {prev ? (
                <Link
                  href={`/fundamentals/${prev.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground hover:border-primary/40"
                >
                  <ArrowLeft className="h-4 w-4" /> {prev.title}
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link
                  href={`/fundamentals/${next.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground hover:border-primary/40"
                >
                  {next.title} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/roadmap/session-01"
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
                >
                  Start Session 1 <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
