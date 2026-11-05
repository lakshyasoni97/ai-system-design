"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { Eye, EyeOff, RotateCcw, MessageSquareQuote } from "lucide-react";

interface ActiveRecallContextType {
  isRecallMode: boolean;
  setIsRecallMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  revealedClozes: Record<string, boolean>;
  toggleCloze: (id: string) => void;
  revealAll: () => void;
  resetClozes: () => void;
  registerCloze: (id: string) => void;
  totalClozes: number;
  revealedCount: number;
}

const ActiveRecallContext = createContext<ActiveRecallContextType | undefined>(undefined);

export function ActiveRecallProvider({ children }: { children: React.ReactNode }) {
  const [isRecallMode, setIsRecallMode] = useState<boolean>(false);
  const [revealedClozes, setRevealedClozes] = useState<Record<string, boolean>>({});
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const registerCloze = useCallback((id: string) => {
    setRegisteredIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const toggleCloze = useCallback((id: string) => {
    setRevealedClozes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const revealAll = useCallback(() => {
    setRevealedClozes((prev) => {
      const next = { ...prev };
      registeredIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [registeredIds]);

  const resetClozes = useCallback(() => {
    setRevealedClozes({});
  }, []);

  const revealedCount = Object.values(revealedClozes).filter(Boolean).length;
  const totalClozes = registeredIds.size;

  return (
    <ActiveRecallContext.Provider
      value={{
        isRecallMode,
        setIsRecallMode,
        revealedClozes,
        toggleCloze,
        revealAll,
        resetClozes,
        registerCloze,
        totalClozes,
        revealedCount,
      }}
    >
      {children}
    </ActiveRecallContext.Provider>
  );
}

export function useActiveRecall() {
  const ctx = useContext(ActiveRecallContext);
  return (
    ctx || {
      isRecallMode: false,
      setIsRecallMode: () => {},
      revealedClozes: {},
      toggleCloze: () => {},
      revealAll: () => {},
      resetClozes: () => {},
      registerCloze: () => {},
      totalClozes: 0,
      revealedCount: 0,
    }
  );
}

/**
 * Interactive Cloze Code Pill component
 */
export function ClozeCodePill({
  children,
  rawText,
  ...props
}: {
  children: React.ReactNode;
  rawText: string;
} & React.HTMLAttributes<HTMLElement>) {
  const { isRecallMode, revealedClozes, toggleCloze, registerCloze } = useActiveRecall();
  const autoId = useId();
  const id = `cloze-${rawText.trim().replace(/\s+/g, "_")}-${autoId}`;

  React.useEffect(() => {
    registerCloze(id);
  }, [id, registerCloze]);

  const isRevealed = revealedClozes[id];

  if (!isRecallMode) {
    return (
      <code
        className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[0.875rem] text-primary font-medium"
        {...props}
      >
        {children}
      </code>
    );
  }

  if (isRevealed) {
    return (
      <button
        type="button"
        onClick={() => toggleCloze(id)}
        title="Click to hide"
        className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 font-mono text-[0.875rem] text-primary font-medium transition-all hover:opacity-80 cursor-pointer"
        {...props}
      >
        <span>{children}</span>
      </button>
    );
  }

  const lengthHint = rawText.length <= 4 ? "short" : rawText.length <= 10 ? "mid" : "long";

  return (
    <button
      type="button"
      onClick={() => toggleCloze(id)}
      title="Active Recall Mode: Click to reveal target metric/formula"
      className="inline-flex select-none items-center gap-1 rounded-md border border-dashed border-accent/60 bg-accent/10 px-2 py-0.5 font-mono text-[0.8125rem] text-accent font-semibold transition-all hover:bg-accent/20 cursor-pointer animate-pulse"
      {...props}
    >
      <span className="opacity-75">[ ? ]</span>
      <span className="text-[10px] text-accent/80 font-normal">
        {lengthHint === "short" ? "•" : lengthHint === "mid" ? "••" : "•••"}
      </span>
    </button>
  );
}

/**
 * Spoken Interview / Recall Blockquote with active recall mask
 */
export function RecallBlockquote({ children }: { children: React.ReactNode }) {
  const { isRecallMode } = useActiveRecall();
  const [revealed, setRevealed] = useState(false);

  // If in recall mode, allow testing oneself before revealing
  if (isRecallMode && !revealed) {
    return (
      <blockquote className="my-5 sm:my-6 rounded-2xl border-l-4 border-accent/60 bg-accent/5 p-4 sm:p-5 text-base leading-relaxed shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-accent font-semibold font-mono text-xs uppercase tracking-wider">
            <MessageSquareQuote className="h-4 w-4" />
            <span>Spoken Interview Defense / Key Rule Masked</span>
          </div>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent/15 px-3 py-1.5 font-mono text-xs font-semibold text-accent hover:bg-accent/25 transition-colors cursor-pointer w-fit"
          >
            Say it aloud, then click to reveal →
          </button>
        </div>
      </blockquote>
    );
  }

  return (
    <blockquote className="relative my-5 sm:my-6 rounded-2xl border-l-4 border-primary bg-primary/5 p-4 sm:p-5 text-base leading-relaxed text-foreground shadow-2xs [&_strong]:text-primary [&_strong]:font-bold">
      {isRecallMode && (
        <button
          type="button"
          onClick={() => setRevealed(false)}
          className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer rounded bg-secondary px-1.5 py-0.5 border border-border"
        >
          Mask
        </button>
      )}
      {children}
    </blockquote>
  );
}

/**
 * Top toolbar for toggling Recall Mode on study articles
 */
export function ActiveRecallToolbar() {
  const { isRecallMode, setIsRecallMode, revealedCount, totalClozes, revealAll, resetClozes } =
    useActiveRecall();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsRecallMode((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
            isRecallMode
              ? "border-accent/60 bg-accent/15 text-accent shadow-xs"
              : "border-border bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {isRecallMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span>{isRecallMode ? "Recall Mode: ON" : "Recall Mode: OFF"}</span>
        </button>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {isRecallMode
            ? "Formulas, key numbers, and interview scripts are masked. Test yourself before revealing!"
            : "Turn ON to mask metrics and trade-off verdicts for active retrieval practice."}
        </span>
      </div>

      {isRecallMode && (
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="rounded-lg border border-border bg-secondary px-2 py-1 text-muted-foreground">
            Revealed: <span className="text-foreground font-semibold">{revealedCount}</span> /{" "}
            {totalClozes}
          </span>
          <button
            type="button"
            onClick={revealAll}
            className="rounded-lg border border-border bg-secondary px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Reveal All
          </button>
          <button
            type="button"
            onClick={resetClozes}
            className="flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
