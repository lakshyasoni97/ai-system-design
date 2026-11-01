"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FlashcardRating = "unseen" | "hard" | "medium" | "easy";

export type HighlightColor = "amber" | "emerald" | "indigo" | "rose";

export interface TextHighlight {
  id: string;
  sourceType: "session" | "fundamental";
  sourceId: string;
  sourceTitle: string;
  href: string;
  sectionId: string;
  sectionTitle: string;
  text: string;
  prefix?: string;
  suffix?: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

interface ProgressState {
  completedSessions: string[];
  flashcardRatings: Record<string, FlashcardRating>;
  scratchpadNotes: Record<string, string>;
  highlights: TextHighlight[];
}

interface ProgressContextType extends ProgressState {
  isHydrated: boolean;
  toggleSessionCompleted: (sessionId: string) => void;
  isSessionCompleted: (sessionId: string) => boolean;
  rateFlashcard: (cardId: string, rating: FlashcardRating) => void;
  getFlashcardRating: (cardId: string) => FlashcardRating;
  updateScratchpad: (key: string, note: string) => void;
  addHighlight: (hl: Omit<TextHighlight, "id" | "createdAt">) => TextHighlight;
  updateHighlight: (id: string, updates: Partial<Pick<TextHighlight, "color" | "note">>) => void;
  removeHighlight: (id: string) => void;
  getHighlightsForSource: (sourceId: string) => TextHighlight[];
  exportProgressJson: () => string;
  importProgressJson: (jsonStr: string) => boolean;
  resetProgress: () => void;
}

const STORAGE_KEY = "antigravity_ai_study_portal_v1";

const DEFAULT_STATE: ProgressState = {
  completedSessions: ["session-01"],
  flashcardRatings: {
    "fc-001": "easy",
    "fc-002": "medium",
    "fc-006": "easy",
  },
  scratchpadNotes: {
    "session-01":
      "Remember to emphasize KEDA scaling on in-flight requests/PubSub lag vs naive CPU HPA when defending Deloitte GKE setup.",
  },
  highlights: [
    {
      id: "hl-seed-01",
      sourceType: "fundamental",
      sourceId: "fund-01",
      sourceTitle: "Topic 1: Replication, Consistency & CAP/PACELC",
      href: "/fundamentals/fund-01",
      sectionId: "pattern-3-leaderless--quorum-no-boss--vote-by-majority",
      sectionTitle: "Pattern 3: Leaderless / Quorum (No Boss — Vote by Majority)",
      text: "Because R + W > N (2 + 2 > 3), the servers you read from and the servers you wrote to are guaranteed to overlap by at least 1 server that holds the newest data.",
      prefix: "Alice picks Server 2 and Server 3, ",
      suffix: " When Alice sees that Server 2 has v2",
      color: "emerald",
      note: "Golden formula for leaderless distributed datastores (Cassandra/DynamoDB).",
      createdAt: "2026-11-01T12:00:00.000Z",
    },
    {
      id: "hl-seed-02",
      sourceType: "session",
      sourceId: "session-01",
      sourceTitle: "S01: GKE vs. Cloud Run, Load Balancing & Stateful Backends",
      href: "/roadmap/session-01",
      sectionId: "2-why-gke-for-deloittes-multi-agent-tier",
      sectionTitle: "2. Why GKE for Deloitte's Multi-Agent Tier",
      text: "FastAPI pods hold warm SSE long-lived connections for real-time token streaming",
      prefix: "In production, ",
      suffix: " requiring predictable memory ceilings",
      color: "indigo",
      note: "Key defense for choosing GKE StatefulSets over Cloud Run serverless timeouts.",
      createdAt: "2026-11-01T12:30:00.000Z",
    },
  ],
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          completedSessions: Array.isArray(parsed.completedSessions)
            ? parsed.completedSessions
            : DEFAULT_STATE.completedSessions,
          flashcardRatings:
            parsed.flashcardRatings && typeof parsed.flashcardRatings === "object"
              ? parsed.flashcardRatings
              : DEFAULT_STATE.flashcardRatings,
          scratchpadNotes:
            parsed.scratchpadNotes && typeof parsed.scratchpadNotes === "object"
              ? parsed.scratchpadNotes
              : DEFAULT_STATE.scratchpadNotes,
          highlights: Array.isArray(parsed.highlights)
            ? parsed.highlights
            : DEFAULT_STATE.highlights,
        });
      }
    } catch (e) {
      console.error("Failed to load study progress from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save study progress to localStorage:", e);
    }
  }, [state, isHydrated]);

  const toggleSessionCompleted = (sessionId: string) => {
    setState((prev) => {
      const exists = prev.completedSessions.includes(sessionId);
      const next = exists
        ? prev.completedSessions.filter((id) => id !== sessionId)
        : [...prev.completedSessions, sessionId];
      return { ...prev, completedSessions: next };
    });
  };

  const isSessionCompleted = (sessionId: string) => {
    return state.completedSessions.includes(sessionId);
  };

  const rateFlashcard = (cardId: string, rating: FlashcardRating) => {
    setState((prev) => ({
      ...prev,
      flashcardRatings: {
        ...prev.flashcardRatings,
        [cardId]: rating,
      },
    }));
  };

  const getFlashcardRating = (cardId: string): FlashcardRating => {
    return state.flashcardRatings[cardId] || "unseen";
  };

  const updateScratchpad = (key: string, note: string) => {
    setState((prev) => ({
      ...prev,
      scratchpadNotes: {
        ...prev.scratchpadNotes,
        [key]: note,
      },
    }));
  };

  const addHighlight = (hl: Omit<TextHighlight, "id" | "createdAt">): TextHighlight => {
    const newHighlight: TextHighlight = {
      ...hl,
      id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      highlights: [newHighlight, ...prev.highlights],
    }));
    return newHighlight;
  };

  const updateHighlight = (
    id: string,
    updates: Partial<Pick<TextHighlight, "color" | "note">>
  ) => {
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    }));
  };

  const removeHighlight = (id: string) => {
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h.id !== id),
    }));
  };

  const getHighlightsForSource = (sourceId: string): TextHighlight[] => {
    return state.highlights.filter((h) => h.sourceId === sourceId);
  };

  const exportProgressJson = () => {
    return JSON.stringify(
      {
        ...state,
        exportedAt: new Date().toISOString(),
        candidate: "Lakshya Soni",
      },
      null,
      2
    );
  };

  const importProgressJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== "object") return false;
      setState({
        completedSessions: Array.isArray(parsed.completedSessions)
          ? parsed.completedSessions
          : [],
        flashcardRatings:
          parsed.flashcardRatings && typeof parsed.flashcardRatings === "object"
            ? parsed.flashcardRatings
            : {},
        scratchpadNotes:
          parsed.scratchpadNotes && typeof parsed.scratchpadNotes === "object"
            ? parsed.scratchpadNotes
            : {},
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      });
      return true;
    } catch {
      return false;
    }
  };

  const resetProgress = () => {
    setState({
      completedSessions: [],
      flashcardRatings: {},
      scratchpadNotes: {},
      highlights: [],
    });
  };

  return (
    <ProgressContext.Provider
      value={{
        ...state,
        isHydrated,
        toggleSessionCompleted,
        isSessionCompleted,
        rateFlashcard,
        getFlashcardRating,
        updateScratchpad,
        addHighlight,
        updateHighlight,
        removeHighlight,
        getHighlightsForSource,
        exportProgressJson,
        importProgressJson,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return ctx;
}
