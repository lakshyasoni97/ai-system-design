"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Clock, Cpu } from "lucide-react";
import MarkdownArticle from "./MarkdownArticle";
import ReadingList, { ReadingItem } from "./ReadingList";
import StudyScratchpad from "./StudyScratchpad";
import { useProgress } from "./ProgressProvider";

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
  prev,
  next,
}: {
  topic: Topic;
  content: string;
  reading: ReadingItem[];
  prev: Topic | null;
  next: Topic | null;
}) {
  const { done, toggle } = useFundamentalsDone();
  const { isSessionCompleted, toggleSessionCompleted } = useProgress();
  const isDone = isSessionCompleted(topic.id) || done.includes(topic.id);

  const handleToggle = () => {
    toggle(topic.id);
    toggleSessionCompleted(topic.id);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/fundamentals"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              Module 0 · Topic {topic.number} of 8
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

      <MarkdownArticle
        content={content}
        diagramTitle={`Fundamentals ${topic.number} — Diagram`}
        sourceType="fundamental"
        sourceId={topic.id}
        sourceTitle={`Topic ${topic.number}: ${topic.title}`}
        href={`/fundamentals/${topic.id}`}
      />
      <ReadingList items={reading} />
      <StudyScratchpad
        sourceId={topic.id}
        sourceTitle={`Topic ${topic.number}: ${topic.title}`}
        placeholder="Jot down core distributed systems invariants, CAP/PACELC trade-offs, or AI tie-ins for this topic..."
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
            Start Session 01 <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
