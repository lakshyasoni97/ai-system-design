"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  Filter,
  Flame,
  CheckCircle2,
  Clock,
  HelpCircle,
  Shuffle,
  ExternalLink,
} from "lucide-react";
import { FlashcardRating, useProgress } from "./ProgressProvider";

export interface FlashcardItem {
  id: string;
  sessionId: string;
  module: string;
  projectTag: string;
  question: string;
  answer: string;
}

interface FlashcardPlayerProps {
  cards: FlashcardItem[];
  compact?: boolean;
  initialSessionFilter?: string;
}

const MODULE_LABELS: Record<string, string> = {
  "Module 1": "Mod 1: Backend & Capacity",
  "Module 2": "Mod 2: RAG & Multimodal",
  "Module 3": "Mod 3: Agents & Latency",
  "Module 4": "Mod 4: Models & Serving",
  "Module 5": "Mod 5: LLMOps & Security",
};

export default function FlashcardPlayer({
  cards,
  compact = false,
  initialSessionFilter = "ALL",
}: FlashcardPlayerProps) {
  const { getFlashcardRating, rateFlashcard } = useProgress();

  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [confidenceFilter, setConfidenceFilter] = useState<string>("ALL");
  const [sessionFilter, setSessionFilter] = useState<string>(initialSessionFilter);
  const [prioritizeHard, setPrioritizeHard] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const uniqueModules = useMemo(
    () => Array.from(new Set(cards.map((c) => c.module))),
    [cards]
  );

  const uniqueProjects = useMemo(
    () => Array.from(new Set(cards.map((c) => c.projectTag))),
    [cards]
  );

  const filteredCards = useMemo(() => {
    const list = cards.filter((card) => {
      if (sessionFilter !== "ALL" && card.sessionId !== sessionFilter) return false;
      if (moduleFilter !== "ALL" && card.module !== moduleFilter) return false;
      if (projectFilter !== "ALL" && card.projectTag !== projectFilter) return false;
      if (confidenceFilter !== "ALL") {
        const rating = getFlashcardRating(card.id);
        if (rating !== confidenceFilter) return false;
      }
      return true;
    });

    if (prioritizeHard) {
      const weight: Record<FlashcardRating, number> = {
        hard: 0,
        unseen: 1,
        medium: 2,
        easy: 3,
      };
      return [...list].sort(
        (a, b) => weight[getFlashcardRating(a.id)] - weight[getFlashcardRating(b.id)]
      );
    }
    return list;
  }, [
    cards,
    sessionFilter,
    moduleFilter,
    projectFilter,
    confidenceFilter,
    prioritizeHard,
    getFlashcardRating,
  ]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [moduleFilter, projectFilter, confidenceFilter, sessionFilter]);

  const activeCard = filteredCards[currentIndex] || null;

  const handleNext = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  }, [filteredCards.length]);

  const handlePrev = useCallback(() => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  }, [filteredCards.length]);

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (!activeCard) return;
      rateFlashcard(activeCard.id, rating);
      setIsFlipped(false);
      if (filteredCards.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
      }
    },
    [activeCard, rateFlashcard, filteredCards.length]
  );

  useEffect(() => {
    if (compact) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === "1") {
        e.preventDefault();
        handleRate("hard");
      } else if (e.key === "2") {
        e.preventDefault();
        handleRate("medium");
      } else if (e.key === "3") {
        e.preventDefault();
        handleRate("easy");
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compact, handleRate, handleNext, handlePrev]);

  const ratingBadge = (rating: FlashcardRating) => {
    switch (rating) {
      case "hard":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/15 px-2.5 py-0.5 font-mono text-xs text-destructive font-semibold">
            <Flame className="h-3 w-3" /> Hard / Review First
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">
            <Clock className="h-3 w-3" /> Medium / Good
          </span>
        );
      case "easy":
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 font-mono text-xs text-primary font-semibold">
            <CheckCircle2 className="h-3 w-3" /> Easy / Mastered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs text-muted-foreground font-medium">
            <HelpCircle className="h-3 w-3" /> Unseen
          </span>
        );
    }
  };

  const deckProgressPct = filteredCards.length > 0
    ? Math.round(((currentIndex + 1) / filteredCards.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Filter Bar (Full Mode) */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Filter Deck:</span>
            </div>

            <select
              aria-label="Filter by Module"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All 5 Modules</option>
              {uniqueModules.map((m) => (
                <option key={m} value={m}>
                  {MODULE_LABELS[m] || m}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Project Tag"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Resume Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by Confidence Level"
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Confidence Levels</option>
              <option value="unseen">Unseen</option>
              <option value="hard">Hard / Needs Review</option>
              <option value="medium">Medium / Good</option>
              <option value="easy">Easy / Mastered</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setPrioritizeHard((p) => !p)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
              prioritizeHard
                ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>{prioritizeHard ? "SRS Queue: Hard First" : "Order: Sequential"}</span>
          </button>
        </div>
      )}

      {/* Main Card Arena */}
      {!activeCard ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            No flashcards match your current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setModuleFilter("ALL");
              setProjectFilter("ALL");
              setConfidenceFilter("ALL");
              setSessionFilter("ALL");
            }}
            className="mt-3 rounded-xl bg-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Header Meta & Source Session Link */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-foreground font-semibold">
                Card {currentIndex + 1} / {filteredCards.length}
              </span>
              <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-accent font-semibold">
                {MODULE_LABELS[activeCard.module] || activeCard.module}
              </span>
              <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-primary font-semibold">
                {activeCard.projectTag}
              </span>
              <Link
                href={`/roadmap/${activeCard.sessionId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 font-mono text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                title="Open Source Session Notes"
              >
                <span>{activeCard.sessionId}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <div>{ratingBadge(getFlashcardRating(activeCard.id))}</div>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            aria-label="Flashcard - Press Space or Click to flip between question and answer"
            onKeyDown={(e) => {
              if (e.code === "Space" || e.code === "Enter") {
                e.preventDefault();
                setIsFlipped((f) => !f);
              }
            }}
            className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
              compact ? "min-h-[240px] p-6" : "min-h-[340px] p-8"
            } ${
              isFlipped
                ? "border-primary/50 bg-card shadow-lg ring-1 ring-primary/20"
                : "border-border bg-card hover:border-primary/40 shadow-sm"
            }`}
          >
            {/* Visual Deck Progress Indicator along top of card */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-border/40">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${deckProgressPct}%` }}
              />
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider ${
                    isFlipped
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isFlipped ? "Production Defense Answer" : "Interview Question"}
                </span>

                <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground group-hover:text-foreground">
                  <RotateCw className="h-3.5 w-3.5" />
                  Click or press [Space] to flip
                </span>
              </div>

              {!isFlipped ? (
                <div className="my-6">
                  <h3
                    className={`font-semibold leading-relaxed text-foreground ${
                      compact ? "text-lg" : "text-xl md:text-2xl"
                    }`}
                  >
                    {activeCard.question}
                  </h3>
                </div>
              ) : (
                <div className="prose max-w-none text-sm md:text-base leading-relaxed text-foreground/90 space-y-2 [&_strong]:text-primary [&_code]:rounded-md [&_code]:border [&_code]:border-border [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-accent [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeCard.answer}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground font-mono">
              <span>ID: {activeCard.id}</span>
              <span className="hidden sm:inline">
                {isFlipped
                  ? "Rate your recall confidence below (1 = Hard, 2 = Medium, 3 = Easy)"
                  : "Formulate your architecture defense before flipping"}
              </span>
            </div>
          </div>

          {/* Controls & Rating Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Prev</span>
                {!compact && (
                  <kbd className="hidden sm:inline ml-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
                    ←
                  </kbd>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped((f) => !f)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  !isFlipped
                    ? "border-primary bg-primary text-primary-foreground hover:opacity-90"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Flip</span>
                {!compact && (
                  <kbd className="hidden sm:inline ml-1 rounded bg-black/20 dark:bg-white/20 px-1.5 py-0.5 font-mono text-[10px]">
                    Space
                  </kbd>
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <span>Next</span>
                {!compact && (
                  <kbd className="hidden sm:inline mr-1 rounded bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
                    →
                  </kbd>
                )}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Spaced Repetition Rating Buttons */}
            <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleRate("hard")}
                className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isFlipped
                    ? "border-destructive/60 bg-destructive/15 text-destructive hover:bg-destructive/25 ring-1 ring-destructive/20"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Hard</span>
                {!compact && (
                  <kbd className="hidden sm:inline rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-[10px] text-destructive">
                    1
                  </kbd>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRate("medium")}
                className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isFlipped
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 ring-1 ring-amber-500/20"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Good</span>
                {!compact && (
                  <kbd className="hidden sm:inline rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-400">
                    2
                  </kbd>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleRate("easy")}
                className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  isFlipped
                    ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/25 ring-1 ring-primary/20"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Easy</span>
                {!compact && (
                  <kbd className="hidden sm:inline rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                    3
                  </kbd>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
