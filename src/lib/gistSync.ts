/**
 * GitHub Gist Cloud Sync Engine for AI System Design Portal
 *
 * Provides cross-device, offline-first synchronization using a private GitHub Gist.
 * Zero-backend required: all requests run client-side directly against the GitHub REST API.
 */

import { FlashcardRating, TextHighlight } from "@/components/ProgressProvider";

export interface SyncedStudyState {
  version: number;
  completedSessions: string[];
  flashcardRatings: Record<string, FlashcardRating>;
  scratchpadNotes: Record<string, string>;
  highlights: TextHighlight[];
  deletedHighlightIds?: string[];
  lastModifiedAt: string;
  sourceDevice?: string;
}

export interface GitHubUserInfo {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface SyncConfig {
  token: string | null;
  gistId: string | null;
  gistUrl: string | null;
  user: GitHubUserInfo | null;
  lastSyncedAt: string | null;
}

const STORAGE_KEYS = {
  TOKEN: "antigravity_github_sync_token_v1",
  GIST_ID: "antigravity_github_sync_gist_id_v1",
  GIST_URL: "antigravity_github_sync_gist_url_v1",
  USER: "antigravity_github_sync_user_v1",
  LAST_SYNC: "antigravity_github_sync_last_at_v1",
  DELETED_HLS: "antigravity_deleted_hl_ids_v1",
};

export const GIST_FILENAME = "ai-system-design-sync.json";
export const GIST_DESCRIPTION =
  "[AI System Design Portal] Study Progress, Notes & Highlights Cloud Sync";

/**
 * Read current sync configuration from browser localStorage
 */
export function getStoredSyncConfig(): SyncConfig {
  if (typeof window === "undefined") {
    return { token: null, gistId: null, gistUrl: null, user: null, lastSyncedAt: null };
  }

  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const gistId = localStorage.getItem(STORAGE_KEYS.GIST_ID);
    const gistUrl = localStorage.getItem(STORAGE_KEYS.GIST_URL);
    const lastSyncedAt = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
    const user = rawUser ? (JSON.parse(rawUser) as GitHubUserInfo) : null;

    return { token, gistId, gistUrl, user, lastSyncedAt };
  } catch (err) {
    console.error("Error reading sync config from localStorage:", err);
    return { token: null, gistId: null, gistUrl: null, user: null, lastSyncedAt: null };
  }
}

/**
 * Persist sync configuration to browser localStorage
 */
export function saveStoredSyncConfig(
  token: string,
  gistId: string,
  gistUrl: string,
  user: GitHubUserInfo
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token.trim());
    localStorage.setItem(STORAGE_KEYS.GIST_ID, gistId);
    localStorage.setItem(STORAGE_KEYS.GIST_URL, gistUrl);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.error("Error saving sync config:", err);
  }
}

/**
 * Clear stored token and disconnect cloud sync
 */
export function clearStoredSyncConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.GIST_ID);
    localStorage.removeItem(STORAGE_KEYS.GIST_URL);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  } catch (err) {
    console.error("Error clearing sync config:", err);
  }
}

/**
 * Track deleted highlight IDs locally so deletions replicate across devices
 */
export function getLocalDeletedHighlightIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_HLS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDeletedHighlightId(id: string): void {
  try {
    const current = getLocalDeletedHighlightIds();
    if (!current.includes(id)) {
      const updated = [id, ...current].slice(0, 300); // retain last 300 tombstones
      localStorage.setItem(STORAGE_KEYS.DELETED_HLS, JSON.stringify(updated));
    }
  } catch (err) {
    console.error("Error recording deleted highlight tombstone:", err);
  }
}

/**
 * Standard headers for GitHub API
 */
function getHeaders(token: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token.trim()}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * Validate GitHub Personal Access Token and retrieve user profile
 */
export async function validateGitHubToken(token: string): Promise<GitHubUserInfo> {
  const cleanToken = token.trim();
  if (!cleanToken) {
    throw new Error("Token cannot be empty.");
  }

  const res = await fetch("https://api.github.com/user", {
    headers: getHeaders(cleanToken),
  });

  if (res.status === 401) {
    throw new Error("Invalid GitHub token. Please check your Personal Access Token.");
  }

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${res.statusText}`);
  }

  // Check scopes if available
  const scopes = res.headers.get("x-oauth-scopes") || "";
  if (scopes && !scopes.includes("gist")) {
    throw new Error(
      "This token lacks the 'gist' scope. Please generate a token with the 'gist' permission enabled."
    );
  }

  const data = await res.json();
  return {
    login: data.login,
    name: data.name || data.login,
    avatar_url: data.avatar_url,
    html_url: data.html_url,
  };
}

/**
 * Search user's existing gists for our sync file, or create a brand new private gist
 */
export async function findOrCreateSyncGist(
  token: string,
  initialState: SyncedStudyState
): Promise<{ gistId: string; gistUrl: string; remoteState: SyncedStudyState | null }> {
  const headers = getHeaders(token);

  // 1. Search existing gists (pages 1)
  const listRes = await fetch("https://api.github.com/gists?per_page=100", { headers });
  if (!listRes.ok) {
    throw new Error(`Failed to list gists (${listRes.status}): ${listRes.statusText}`);
  }

  const gists: Array<{
    id: string;
    html_url: string;
    description: string;
    files: Record<string, { filename: string; raw_url: string }>;
  }> = await listRes.json();

  const found = gists.find(
    (g) =>
      g.files[GIST_FILENAME] !== undefined ||
      (g.description && g.description.includes("[AI System Design Portal]"))
  );

  if (found) {
    // Fetch full gist details to get file content
    const detailRes = await fetch(`https://api.github.com/gists/${found.id}`, { headers });
    if (detailRes.ok) {
      const detail = await detailRes.json();
      const fileData = detail.files[GIST_FILENAME];
      let remoteState: SyncedStudyState | null = null;
      if (fileData?.content) {
        try {
          remoteState = JSON.parse(fileData.content);
        } catch (e) {
          console.warn("Could not parse existing gist JSON:", e);
        }
      }
      return {
        gistId: found.id,
        gistUrl: found.html_url,
        remoteState,
      };
    }
  }

  // 2. Not found -> create new private gist
  const createRes = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers,
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(initialState, null, 2),
        },
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create private gist (${createRes.status}): ${createRes.statusText}`);
  }

  const newGist = await createRes.json();
  return {
    gistId: newGist.id,
    gistUrl: newGist.html_url,
    remoteState: initialState,
  };
}

/**
 * Fetch remote state from the designated Gist
 */
export async function fetchFromGist(
  token: string,
  gistId: string
): Promise<{ state: SyncedStudyState; gistUrl: string }> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: getHeaders(token),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch gist (${res.status}): ${res.statusText}`);
  }

  const data = await res.json();
  const file = data.files[GIST_FILENAME];
  if (!file || !file.content) {
    throw new Error(`File ${GIST_FILENAME} not found inside gist ${gistId}`);
  }

  const state = JSON.parse(file.content) as SyncedStudyState;
  return { state, gistUrl: data.html_url };
}

/**
 * Push updated study state to the Gist
 */
export async function pushToGist(
  token: string,
  gistId: string,
  state: SyncedStudyState
): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: "PATCH",
    headers: getHeaders(token),
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(state, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update gist (${res.status}): ${res.statusText}`);
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }
}

/**
 * Last-Write-Wins (LWW) conflict resolution between local and remote states
 */
export function mergeStudyStates(
  local: SyncedStudyState,
  remote: SyncedStudyState
): SyncedStudyState {
  // 1. Merge completed sessions (set union)
  const completedSessions = Array.from(
    new Set([...(local.completedSessions || []), ...(remote.completedSessions || [])])
  );

  // 2. Merge flashcard ratings (union, prefer higher or latest)
  const flashcardRatings: Record<string, FlashcardRating> = {
    ...(remote.flashcardRatings || {}),
    ...(local.flashcardRatings || {}),
  };

  // 3. Merge scratchpad notes
  const scratchpadNotes: Record<string, string> = {
    ...(remote.scratchpadNotes || {}),
    ...(local.scratchpadNotes || {}),
  };
  // If remote had a note for a session that local didn't modify or vice versa:
  const allNoteKeys = Array.from(
    new Set([
      ...Object.keys(local.scratchpadNotes || {}),
      ...Object.keys(remote.scratchpadNotes || {}),
    ])
  );
  for (const k of allNoteKeys) {
    const localNote = (local.scratchpadNotes || {})[k] || "";
    const remoteNote = (remote.scratchpadNotes || {})[k] || "";
    if (localNote && !remoteNote) scratchpadNotes[k] = localNote;
    else if (!localNote && remoteNote) scratchpadNotes[k] = remoteNote;
    else if (localNote && remoteNote) {
      // Pick from newer state if different
      const localTime = new Date(local.lastModifiedAt || 0).getTime();
      const remoteTime = new Date(remote.lastModifiedAt || 0).getTime();
      scratchpadNotes[k] = localTime >= remoteTime ? localNote : remoteNote;
    }
  }

  // 4. Merge deleted tombstones
  const localDeleted = local.deletedHighlightIds || getLocalDeletedHighlightIds();
  const remoteDeleted = remote.deletedHighlightIds || [];
  const allDeletedIds = Array.from(new Set([...localDeleted, ...remoteDeleted]));

  // 5. Merge highlights
  const highlightMap = new Map<string, TextHighlight>();

  // Add remote highlights (unless deleted)
  for (const hl of remote.highlights || []) {
    if (!allDeletedIds.includes(hl.id)) {
      highlightMap.set(hl.id, hl);
    }
  }

  // Add / overwrite with local highlights (unless deleted)
  for (const hl of local.highlights || []) {
    if (allDeletedIds.includes(hl.id)) {
      continue;
    }
    const existing = highlightMap.get(hl.id);
    if (!existing) {
      highlightMap.set(hl.id, hl);
    } else {
      // Compare timestamps
      const localHlTime = new Date(hl.createdAt).getTime();
      const existingHlTime = new Date(existing.createdAt).getTime();
      if (localHlTime >= existingHlTime) {
        highlightMap.set(hl.id, hl);
      }
    }
  }

  // Determine latest timestamp
  const localTime = new Date(local.lastModifiedAt || 0).getTime();
  const remoteTime = new Date(remote.lastModifiedAt || 0).getTime();
  const maxTime = Math.max(localTime, remoteTime, Date.now());

  return {
    version: 2,
    completedSessions,
    flashcardRatings,
    scratchpadNotes,
    highlights: Array.from(highlightMap.values()),
    deletedHighlightIds: allDeletedIds.slice(0, 300),
    lastModifiedAt: new Date(maxTime).toISOString(),
    sourceDevice: typeof navigator !== "undefined" ? navigator.userAgent : "web",
  };
}
