"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useProgress } from "./ProgressProvider";

export interface QuizOption {
  id: "A" | "B" | "C" | "D";
  text: string;
  trapLabel: string;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  sourceId: string;
  module: string;
  category: "Trade-Off" | "2 AM Failure" | "Capacity Math" | "Architecture" | string;
  projectTag?: string;
  scenario: string;
  question: string;
  options: QuizOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  takeaway: string;
}

interface ScenarioQuizProps {
  questions: QuizQuestion[];
  sourceTitle: string;
  sourceId: string;
  isTopicCompleted?: boolean;
  onMarkTopicCompleted?: () => void;
}

function InlineFormatted({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={idx}
              className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-primary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong key={idx} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </>
  );
}

const CATEGORY_STYLE: Record<string, string> = {
  "2 AM Failure": "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "Capacity Math": "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Trade-Off": "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  Architecture: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function ScenarioQuiz({
  questions,
  sourceTitle,
  isTopicCompleted = false,
  onMarkTopicCompleted,
}: ScenarioQuizProps) {
  const { quizResults, recordQuizAnswer, resetQuizQuestions } = useProgress();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showOtherTraps, setShowOtherTraps] = useState(true);

  const safeIndex = Math.min(activeIndex, Math.max(0, questions.length - 1));
  const current = questions[safeIndex];

  const stats = useMemo(() => {
    let answered = 0;
    let correct = 0;
    questions.forEach((q) => {
      const attempt = quizResults[q.id];
      if (attempt) {
        answered += 1;
        if (attempt.isCorrect) correct += 1;
      }
    });
    return { answered, correct, total: questions.length };
  }, [questions, quizResults]);

  if (!questions || questions.length === 0 || !current) {
    return null;
  }

  const currentAttempt = quizResults[current.id];
  const isAnswered = Boolean(currentAttempt);
  const allAnswered = stats.answered === stats.total;

  const handleSelectOption = (optionId: "A" | "B" | "C" | "D") => {
    if (isAnswered) return;
    recordQuizAnswer(current.id, optionId, optionId === current.correctOptionId);
  };

  const handleReset = () => {
    resetQuizQuestions(questions.map((q) => q.id));
    setActiveIndex(0);
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Scenario & Trade-Off Defense Quiz
            </h2>
            <p className="text-xs text-muted-foreground">
              Test your architectural instincts on 2 AM production failures, capacity math, and design trade-offs for {sourceTitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold ${
              allAnswered && stats.correct === stats.total
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border bg-secondary text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-primary" />
            <span>
              {stats.correct} / {stats.total} Correct
            </span>
            {stats.answered > 0 && stats.answered < stats.total && (
              <span className="text-muted-foreground font-normal">
                ({stats.answered} answered)
              </span>
            )}
          </div>

          {stats.answered > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Question Stepper Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {questions.map((q, idx) => {
            const attempt = quizResults[q.id];
            const isActive = idx === safeIndex;
            let stateClasses =
              "border-border bg-secondary/60 text-muted-foreground hover:text-foreground";
            if (attempt?.isCorrect) {
              stateClasses =
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
            } else if (attempt && !attempt.isCorrect) {
              stateClasses =
                "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${stateClasses} ${
                  isActive ? "ring-2 ring-primary/40 border-primary" : ""
                }`}
              >
                {attempt?.isCorrect ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : attempt ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : null}
                <span>Q{idx + 1}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {current.projectTag && (
            <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary">
              {current.projectTag}
            </span>
          )}
          <span
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold ${
              CATEGORY_STYLE[current.category] ||
              "border-border bg-secondary text-muted-foreground"
            }`}
          >
            {current.category}
          </span>
        </div>
      </div>

      {/* Active Question Card */}
      <div className="space-y-4">
        {/* Scenario Box */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Production Scenario</span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/95">
            <InlineFormatted text={current.scenario} />
          </p>
        </div>

        {/* Question Prompt */}
        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
          <InlineFormatted text={current.question} />
        </h3>

        {/* Options List */}
        <div className="space-y-2.5">
          {current.options.map((opt) => {
            const isCorrectOption = opt.id === current.correctOptionId;
            const isSelected = currentAttempt?.selectedOptionId === opt.id;

            let cardStyle =
              "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/60 cursor-pointer";
            if (isAnswered) {
              if (isCorrectOption) {
                cardStyle =
                  "border-emerald-500/60 bg-emerald-500/10 cursor-default";
              } else if (isSelected) {
                cardStyle = "border-rose-500/60 bg-rose-500/10 cursor-default";
              } else {
                cardStyle =
                  "border-border/70 bg-secondary/20 opacity-85 cursor-default";
              }
            }

            const showExplanation =
              isAnswered && (isCorrectOption || isSelected || showOtherTraps);

            return (
              <button
                key={opt.id}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(opt.id)}
                className={`w-full text-left rounded-2xl border p-3.5 sm:p-4 transition-all ${cardStyle}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-mono text-xs font-bold ${
                      isAnswered && isCorrectOption
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isAnswered && isSelected
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-border bg-card text-foreground"
                    }`}
                  >
                    {opt.id}
                  </span>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="text-sm sm:text-[15px] leading-relaxed text-foreground">
                      <InlineFormatted text={opt.text} />
                    </div>

                    {isAnswered && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold ${
                            isCorrectOption
                              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : isSelected
                              ? "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "border-border bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isCorrectOption ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {opt.trapLabel}
                        </span>
                        {isSelected && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            Your choice
                          </span>
                        )}
                      </div>
                    )}

                    {showExplanation && (
                      <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground border-t border-border/60 pt-2">
                        <InlineFormatted text={opt.explanation} />
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toggle other trap explanations & Golden Rule Takeaway */}
        {isAnswered && (
          <div className="space-y-3 pt-1">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowOtherTraps((prev) => !prev)}
                className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showOtherTraps ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>Hide unselected trap explanations</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Show all distractor traps</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-1">
              <div className="text-xs font-bold text-primary">
                Interview golden rule
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                <InlineFormatted text={current.takeaway} />
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Banner when all answered */}
      {allAnswered && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <div className="space-y-0.5">
            <div className="font-mono text-xs font-bold text-primary">
              Quiz complete: {stats.correct}/{stats.total} correct
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.correct === stats.total
                ? "Clean sweep! You spotted every production trap and capacity trade-off."
                : "Review any missed trap badges above or reset to drill again."}
            </p>
          </div>
          {!isTopicCompleted && onMarkTopicCompleted && (
            <button
              type="button"
              onClick={onMarkTopicCompleted}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark Topic as Completed</span>
            </button>
          )}
        </div>
      )}

      {/* Footer Prev / Next Navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <button
          type="button"
          disabled={safeIndex === 0}
          onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="font-mono text-xs text-muted-foreground">
          Question {safeIndex + 1} of {questions.length}
        </span>

        <button
          type="button"
          disabled={safeIndex >= questions.length - 1}
          onClick={() =>
            setActiveIndex((i) => Math.min(questions.length - 1, i + 1))
          }
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer"
        >
          <span>Next Question</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
