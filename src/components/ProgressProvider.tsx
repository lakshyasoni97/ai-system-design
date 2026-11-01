"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FlashcardRating = "unseen" | "hard" | "medium" | "easy";

interface ProgressState {
  completedSessions: string[];
  flashcardRatings: Record<string, FlashcardRating>;
  scratchpadNotes: Record<string, string>;
}

interface ProgressContextType extends ProgressState {
  isHydrated: boolean;
  toggleSessionCompleted: (sessionId: string) => void;
  isSessionCompleted: (sessionId: string) => boolean;
  rateFlashcard: (cardId: string, rating: FlashcardRating) => void;
  getFlashcardRating: (cardId: string) => FlashcardRating;
  updateScratchpad: (key: string, note: string) => void;
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
