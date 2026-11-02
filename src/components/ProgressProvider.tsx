"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  clearStoredSyncConfig,
  fetchFromGist,
  findOrCreateSyncGist,
  getStoredSyncConfig,
  GitHubUserInfo,
  mergeStudyStates,
  pushToGist,
  recordDeletedHighlightId,
  saveStoredSyncConfig,
  SyncedStudyState,
  validateGitHubToken,
} from "@/lib/gistSync";

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
  updatedAt?: string;
}

interface ProgressState {
  completedSessions: string[];
  flashcardRatings: Record<string, FlashcardRating>;
  scratchpadNotes: Record<string, string>;
  highlights: TextHighlight[];
  lastModifiedAt?: string;
}

interface ProgressContextType extends ProgressState {
  isHydrated: boolean;
  // Cloud Sync state
  isSyncConfigured: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
  gistUrl: string | null;
  githubUser: GitHubUserInfo | null;
  connectSync: (token: string) => Promise<boolean>;
  disconnectSync: () => void;
  triggerSyncNow: () => Promise<void>;
  // Existing study actions
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
  lastModifiedAt: "2026-11-01T12:30:00.000Z",
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cloud Sync state
  const [isSyncConfigured, setIsSyncConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<GitHubUserInfo | null>(null);

  // Active sync credentials in memory
  const syncCredsRef = useRef<{ token: string; gistId: string } | null>(null);
  const syncDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial hydration from localStorage & sync config initialization
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
          lastModifiedAt: parsed.lastModifiedAt || new Date().toISOString(),
        });
      }

      // Read sync credentials
      const conf = getStoredSyncConfig();
      if (conf.token && conf.gistId) {
        syncCredsRef.current = { token: conf.token, gistId: conf.gistId };
        setIsSyncConfigured(true);
        setGistUrl(conf.gistUrl);
        setGithubUser(conf.user);
        setLastSyncedAt(conf.lastSyncedAt);
      }
    } catch (e) {
      console.error("Failed to load study progress from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Persist state to localStorage on modification
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save study progress to localStorage:", e);
    }
  }, [state, isHydrated]);

  // Helper to convert state to SyncedStudyState
  const toSyncedState = useCallback(
    (s: ProgressState): SyncedStudyState => ({
      version: 2,
      completedSessions: s.completedSessions,
      flashcardRatings: s.flashcardRatings,
      scratchpadNotes: s.scratchpadNotes,
      highlights: s.highlights,
      lastModifiedAt: s.lastModifiedAt || new Date().toISOString(),
    }),
    []
  );

  // Perform a full pull and merge from Gist
  const pullAndMerge = useCallback(
    async (token: string, gistId: string) => {
      setIsSyncing(true);
      setSyncError(null);
      try {
        const { state: remoteState, gistUrl: url } = await fetchFromGist(token, gistId);
        setGistUrl(url);

        setState((currentLocal) => {
          const merged = mergeStudyStates(toSyncedState(currentLocal), remoteState);

          // After merging, push back the unified state so both sides are in sync
          pushToGist(token, gistId, merged).catch((err) =>
            console.error("Error writing unified state back to Gist:", err)
          );

          const nowIso = new Date().toISOString();
          setLastSyncedAt(nowIso);

          return {
            completedSessions: merged.completedSessions,
            flashcardRatings: merged.flashcardRatings,
            scratchpadNotes: merged.scratchpadNotes,
            highlights: merged.highlights,
            lastModifiedAt: merged.lastModifiedAt,
          };
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Failed to pull from Gist:", msg);
        setSyncError(msg);
      } finally {
        setIsSyncing(false);
      }
    },
    [toSyncedState]
  );

  // 3. Auto-sync on startup if credentials exist
  useEffect(() => {
    if (!isHydrated) return;
    const creds = syncCredsRef.current;
    if (creds?.token && creds?.gistId) {
      pullAndMerge(creds.token, creds.gistId);
    }
  }, [isHydrated, pullAndMerge]);

  // 4. Debounced auto-push when user makes edits
  useEffect(() => {
    if (!isHydrated || !isSyncConfigured) return;
    const creds = syncCredsRef.current;
    if (!creds?.token || !creds?.gistId) return;

    if (syncDebounceTimerRef.current) {
      clearTimeout(syncDebounceTimerRef.current);
    }

    syncDebounceTimerRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        await pushToGist(creds.token, creds.gistId, toSyncedState(state));
        const nowIso = new Date().toISOString();
        setLastSyncedAt(nowIso);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Auto-sync push failed:", msg);
        setSyncError(msg);
      } finally {
        setIsSyncing(false);
      }
    }, 2200);

    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
    };
  }, [state, isHydrated, isSyncConfigured, toSyncedState]);

  // Connect user's GitHub Personal Access Token
  const connectSync = async (token: string): Promise<boolean> => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const user = await validateGitHubToken(token);
      const { gistId, gistUrl: url, remoteState } = await findOrCreateSyncGist(
        token,
        toSyncedState(state)
      );

      saveStoredSyncConfig(token, gistId, url, user);
      syncCredsRef.current = { token, gistId };

      setGithubUser(user);
      setGistUrl(url);
      setIsSyncConfigured(true);

      if (remoteState) {
        const merged = mergeStudyStates(toSyncedState(state), remoteState);
        await pushToGist(token, gistId, merged);
        setState({
          completedSessions: merged.completedSessions,
          flashcardRatings: merged.flashcardRatings,
          scratchpadNotes: merged.scratchpadNotes,
          highlights: merged.highlights,
          lastModifiedAt: merged.lastModifiedAt,
        });
      }

      const nowIso = new Date().toISOString();
      setLastSyncedAt(nowIso);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect sync
  const disconnectSync = () => {
    clearStoredSyncConfig();
    syncCredsRef.current = null;
    setIsSyncConfigured(false);
    setGithubUser(null);
    setGistUrl(null);
    setLastSyncedAt(null);
    setSyncError(null);
  };

  // Manual Trigger Sync Now
  const triggerSyncNow = async () => {
    const creds = syncCredsRef.current;
    if (!creds?.token || !creds?.gistId) return;
    await pullAndMerge(creds.token, creds.gistId);
  };

  // State mutations with automatic timestamp tracking
  const toggleSessionCompleted = (sessionId: string) => {
    setState((prev) => {
      const exists = prev.completedSessions.includes(sessionId);
      const next = exists
        ? prev.completedSessions.filter((id) => id !== sessionId)
        : [...prev.completedSessions, sessionId];
      return {
        ...prev,
        completedSessions: next,
        lastModifiedAt: new Date().toISOString(),
      };
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
      lastModifiedAt: new Date().toISOString(),
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
      lastModifiedAt: new Date().toISOString(),
    }));
  };

  const addHighlight = (hl: Omit<TextHighlight, "id" | "createdAt">): TextHighlight => {
    const nowIso = new Date().toISOString();
    const newHighlight: TextHighlight = {
      ...hl,
      id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setState((prev) => ({
      ...prev,
      highlights: [newHighlight, ...prev.highlights],
      lastModifiedAt: nowIso,
    }));
    return newHighlight;
  };

  const updateHighlight = (
    id: string,
    updates: Partial<Pick<TextHighlight, "color" | "note">>
  ) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h) =>
        h.id === id ? { ...h, ...updates, updatedAt: nowIso } : h
      ),
      lastModifiedAt: nowIso,
    }));
  };

  const removeHighlight = (id: string) => {
    recordDeletedHighlightId(id);
    setState((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((h) => h.id !== id),
      lastModifiedAt: new Date().toISOString(),
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
        lastModifiedAt: new Date().toISOString(),
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
      lastModifiedAt: new Date().toISOString(),
    });
  };

  return (
    <ProgressContext.Provider
      value={{
        ...state,
        isHydrated,
        isSyncConfigured,
        isSyncing,
        lastSyncedAt,
        syncError,
        gistUrl,
        githubUser,
        connectSync,
        disconnectSync,
        triggerSyncNow,
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
