"use client";

import React, { useMemo } from "react";
import { Layers, Keyboard, CheckCircle2, Clock, Flame, HelpCircle, AlertCircle } from "lucide-react";
import flashcardsData from "@/data/flashcards.json";
import FlashcardPlayer from "@/components/FlashcardPlayer";
import { useProgress } from "@/components/ProgressProvider";

export default function FlashcardsPage() {
  const { getFlashcardRating, isCardDue } = useProgress();

  const stats = useMemo(() => {
    let easy = 0;
    let medium = 0;
    let hard = 0;
    let unseen = 0;
    let due = 0;
    for (const c of flashcardsData) {
      const r = getFlashcardRating(c.id);
      if (r === "easy") easy++;
      else if (r === "medium") medium++;
      else if (r === "hard") hard++;
      else unseen++;

      if (isCardDue(c.id)) {
        due++;
      }
    }
    return { easy, medium, hard, unseen, due, total: flashcardsData.length };
  }, [getFlashcardRating, isCardDue]);

  return (
    <div className="space-y-8">
      {/* Header & Keyboard Legend */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs text-accent font-semibold">
              <Layers className="h-3.5 w-3.5" />
              <span>Spaced-Repetition Active Recall Arena</span>
            </div>
            <h1 className="mt-2.5 text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
              Production AI System Design Flashcards
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              High-signal architectural defense cards anchored to Deloitte &
              Network18 production metrics.
            </p>
          </div>

          {/* Keyboard-First UX Legend (Hidden on touch mobile) */}
          <div className="hidden md:block rounded-xl border border-border bg-muted/30 p-3.5 font-mono text-xs">
            <div className="mb-2 flex items-center gap-1.5 text-foreground font-semibold">
              <Keyboard className="h-4 w-4 text-primary" />
              <span>Keyboard-First Controls</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground sm:grid-cols-3">
              <div>
                <kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground border border-border">
                  Space
                </kbd>{" "}
                Flip Card
              </div>
              <div>
                <kbd className="rounded bg-destructive/15 px-1.5 py-0.5 text-destructive font-semibold">
                  1
                </kbd>{" "}
                Rate Hard
              </div>
              <div>
                <kbd className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                  2
                </kbd>{" "}
                Rate Medium
              </div>
              <div>
                <kbd className="rounded bg-primary/15 px-1.5 py-0.5 text-primary font-semibold">
                  3
                </kbd>{" "}
                Rate Easy
              </div>
              <div>
                <kbd className="rounded bg-secondary px-1.5 py-0.5 text-foreground border border-border">
                  ← / →
                </kbd>{" "}
                Prev / Next
              </div>
            </div>
          </div>
        </div>

        {/* Mastery Summary Strip */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-5">
          <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Due for Review</span>
            </div>
            <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
              {stats.due}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-destructive font-semibold">
              <Flame className="h-4 w-4" />
              <span>Hard (Priority)</span>
            </div>
            <span className="font-mono text-lg font-bold text-destructive">
              {stats.hard}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <Clock className="h-4 w-4" />
              <span>Medium / Good</span>
            </div>
            <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
              {stats.medium}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-primary font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Easy / Mastered</span>
            </div>
            <span className="font-mono text-lg font-bold text-primary">
              {stats.easy}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary px-4 py-2.5 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
              <HelpCircle className="h-4 w-4" />
              <span>Unseen Cards</span>
            </div>
            <span className="font-mono text-lg font-bold text-foreground">
              {stats.unseen}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Player */}
      <FlashcardPlayer cards={flashcardsData} />
    </div>
  );
}
