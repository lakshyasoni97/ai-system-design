"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Highlighter,
  Search,
  ExternalLink,
  Trash2,
  Download,
  Check,
  MessageSquare,
  MessageSquarePlus,
  StickyNote,
  Edit3,
  Copy,
  X,
  ChevronRight,
  Layers,
} from "lucide-react";
import {
  HighlightColor,
  TextHighlight,
  useProgress,
} from "@/components/ProgressProvider";
import curriculumData from "@/data/curriculum.json";
import fundamentalsData from "@/data/fundamentals.json";
import StudyScratchpad from "@/components/StudyScratchpad";

const COLOR_METAS: Record<
  HighlightColor,
  {
    label: string;
    shortLabel: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    hex: string;
  }
> = {
  amber: {
    label: "Key Concept",
    shortLabel: "Concept",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  emerald: {
    label: "Formula / SLO",
    shortLabel: "Formula",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  indigo: {
    label: "Interview Defense",
    shortLabel: "Defense",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/40",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    hex: "#6366f1",
  },
  rose: {
    label: "Trap / Failure Mode",
    shortLabel: "Trap",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    hex: "#f43f5e",
  },
};

const QUICK_COMMENT_PROMPTS = [
  { label: "Defense", prefix: "Interview Defense: " },
  { label: "Why it matters", prefix: "Why it matters: " },
  { label: "Trade-off", prefix: "Trade-off: " },
  { label: "Failure Mode", prefix: "Failure Mode: " },
];

interface SourceCatalogItem {
  id: string;
  type: "fundamental" | "session" | "simulator";
  title: string;
  href: string;
  order: number;
}

function stripMarkdownPreview(md: string): string {
  return md
    .replace(/[#>*_`~\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function HighlightsPage() {
  const {
    highlights,
    scratchpadNotes,
    updateHighlight,
    removeHighlight,
  } = useProgress();

  const [activeTab, setActiveTab] = useState<"highlights" | "notebooks">("highlights");
  const [groupByTopic, setGroupByTopic] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedSourceType, setSelectedSourceType] = useState<string>("all");
  const [onlyWithComments, setOnlyWithComments] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);
  const [selectedNotebookSourceId, setSelectedNotebookSourceId] = useState<string>("session-01");
  const [hasPickedNotebook, setHasPickedNotebook] = useState(false);

  const totalSessions = useMemo(
    () => curriculumData.modules.reduce((acc, m) => acc + m.sessions.length, 0),
    []
  );

  // Build catalog of all sessions & fundamentals for resolving scratchpad titles/links
  const sourceCatalog = useMemo<Record<string, SourceCatalogItem>>(() => {
    const map: Record<string, SourceCatalogItem> = {};
    fundamentalsData.topics.forEach((t, idx) => {
      map[t.id] = {
        id: t.id,
        type: "fundamental",
        title: `Topic ${t.number}: ${t.title}`,
        href: `/fundamentals/${t.id}`,
        order: idx + 1,
      };
    });
    curriculumData.modules.forEach((m) => {
      m.sessions.forEach((s) => {
        map[s.id] = {
          id: s.id,
          type: "session",
          title: `Session ${s.number}: ${s.title}`,
          href: `/roadmap/${s.id}`,
          order: 100 + s.number,
        };
      });
    });
    map["mock-simulator-whiteboard"] = {
      id: "mock-simulator-whiteboard",
      type: "simulator",
      title: "Mock Interview Whiteboard Scratchpad",
      href: "/simulator",
      order: 999,
    };
    return map;
  }, []);

  // Active non-empty scratchpad notes
  const activeNotebooks = useMemo(() => {
    return Object.entries(scratchpadNotes)
      .filter(([, text]) => Boolean(text && text.trim()))
      .map(([sourceId, text]) => {
        const meta = sourceCatalog[sourceId] || {
          id: sourceId,
          type: sourceId.startsWith("fund") ? "fundamental" : "session",
          title: sourceId,
          href: sourceId.startsWith("fund")
            ? `/fundamentals/${sourceId}`
            : `/roadmap/${sourceId}`,
          order: 500,
        };
        const trimmed = text.trim();
        return {
          ...meta,
          text: trimmed,
          wordCount: trimmed.split(/\s+/).length,
          preview: stripMarkdownPreview(trimmed),
        };
      })
      .filter((nb) => {
        if (selectedSourceType !== "all" && nb.type !== selectedSourceType) {
          return false;
        }
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          nb.title.toLowerCase().includes(q) || nb.text.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.order - b.order);
  }, [scratchpadNotes, sourceCatalog, selectedSourceType, query]);

  // Select the first saved notebook automatically on first open if default has no note
  useEffect(() => {
    if (
      !hasPickedNotebook &&
      activeNotebooks.length > 0 &&
      !scratchpadNotes[selectedNotebookSourceId]?.trim()
    ) {
      setSelectedNotebookSourceId(activeNotebooks[0].id);
    }
  }, [activeNotebooks, hasPickedNotebook, scratchpadNotes, selectedNotebookSourceId]);

  // Filtered highlights
  const filtered = useMemo(() => {
    return highlights
      .filter((h) => {
        if (selectedColor !== "all" && h.color !== selectedColor) return false;
        if (selectedSourceType !== "all" && h.sourceType !== selectedSourceType)
          return false;
        if (onlyWithComments && !h.note?.trim()) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          h.text.toLowerCase().includes(q) ||
          (h.note && h.note.toLowerCase().includes(q)) ||
          h.sourceTitle.toLowerCase().includes(q) ||
          h.sectionTitle.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [highlights, selectedColor, selectedSourceType, onlyWithComments, query, sortBy]);

  // Grouped by Session / Topic
  const groupedHighlights = useMemo(() => {
    const groups = new Map<
      string,
      {
        sourceId: string;
        sourceTitle: string;
        href: string;
        order: number;
        scratchpad: string;
        items: TextHighlight[];
      }
    >();

    filtered.forEach((hl) => {
      const cat = sourceCatalog[hl.sourceId];
      const existing = groups.get(hl.sourceId);
      if (existing) {
        existing.items.push(hl);
      } else {
        groups.set(hl.sourceId, {
          sourceId: hl.sourceId,
          sourceTitle: cat?.title || hl.sourceTitle,
          href: cat?.href || hl.href,
          order: cat?.order || 500,
          scratchpad: (scratchpadNotes[hl.sourceId] || "").trim(),
          items: [hl],
        });
      }
    });

    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }, [filtered, scratchpadNotes, sourceCatalog]);

  // Counts by category
  const counts = useMemo(() => {
    const res: Record<HighlightColor, number> = {
      amber: 0,
      emerald: 0,
      indigo: 0,
      rose: 0,
    };
    highlights.forEach((h) => {
      if (res[h.color] !== undefined) {
        res[h.color]++;
      }
    });
    return res;
  }, [highlights]);

  const totalCommentsCount = useMemo(
    () => highlights.filter((h) => Boolean(h.note?.trim())).length,
    [highlights]
  );

  // Export highlights + notebooks to formatted Markdown Study Sheet
  const handleExportMarkdown = () => {
    let md = `# AI System Design — Master Study Sheet, Comments & Architect Notebooks\n\n`;
    md += `Exported on: ${new Date().toLocaleDateString()} | Highlights: ${highlights.length} (${totalCommentsCount} with comments) | Notebooks: ${activeNotebooks.length}\n\n`;
    md += `---\n\n`;

    const allSourceIds = new Set<string>();
    highlights.forEach((h) => allSourceIds.add(h.sourceId));
    Object.entries(scratchpadNotes).forEach(([k, v]) => {
      if (v && v.trim()) allSourceIds.add(k);
    });

    const sortedSources = Array.from(allSourceIds).sort(
      (a, b) => (sourceCatalog[a]?.order || 500) - (sourceCatalog[b]?.order || 500)
    );

    sortedSources.forEach((sourceId) => {
      const cat = sourceCatalog[sourceId];
      const sourceItems = highlights.filter((h) => h.sourceId === sourceId);
      const title = cat?.title || sourceItems[0]?.sourceTitle || sourceId;
      const notebook = (scratchpadNotes[sourceId] || "").trim();

      md += `## ${title}\n\n`;

      if (notebook) {
        md += `### Personal Architect Notebook\n\n${notebook}\n\n`;
      }

      if (sourceItems.length > 0) {
        sourceItems.forEach((item) => {
          const tag = COLOR_METAS[item.color].label;
          md += `### [${tag.toUpperCase()}] ${item.sectionTitle}\n`;
          md += `> "${item.text}"\n\n`;
          if (item.note) {
            md += `**Architect Comment:** ${item.note}\n\n`;
          }
          md += `*Reference: ${item.href}*\n\n`;
        });
      }
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-system-design-study-sheet-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const handleCopyItem = async (hl: TextHighlight) => {
    const content = hl.note?.trim()
      ? `"${hl.text}"\n\nArchitect Comment: ${hl.note}`
      : `"${hl.text}"`;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(hl.id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      // ignore
    }
  };

  const toggleExpandQuote = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderHighlightRow = (hl: TextHighlight, showSourcePrefix: boolean) => {
    const meta = COLOR_METAS[hl.color];
    const isEditing = editingNoteId === hl.id;
    const hasNote = Boolean(hl.note?.trim());
    const isLong = hl.text.length > 240;
    const isExpanded = Boolean(expandedIds[hl.id]);

    return (
      <div
        key={hl.id}
        className="reveal-host flex gap-3.5 px-5 py-4 transition-colors hover:bg-muted/20"
      >
        <div
          className={`w-[3px] shrink-0 rounded-full ${meta.dot}`}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1 space-y-2">
          {/* Meta row + Progressive-disclosure Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`${hl.href}?highlight=${hl.id}`}
                className="group/link inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                title="Jump to exact sentence in article"
              >
                <span className="truncate">
                  {showSourcePrefix ? `${hl.sourceTitle} · ` : ""}§ {hl.sectionTitle}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </Link>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/70">
                · {meta.shortLabel} · {new Date(hl.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="reveal-actions flex shrink-0 items-center gap-1">
              {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => updateHighlight(hl.id, { color: cKey })}
                  title={`Tag as ${COLOR_METAS[cKey].label}`}
                  aria-label={`Change tag to ${COLOR_METAS[cKey].label}`}
                  className={`h-3 w-3 rounded-full transition-transform cursor-pointer ${
                    COLOR_METAS[cKey].dot
                  } ${
                    hl.color === cKey
                      ? "ring-2 ring-primary ring-offset-1 scale-110"
                      : "opacity-35 hover:opacity-100"
                  }`}
                />
              ))}

              <div className="mx-1 h-3 w-px bg-border" />

              <button
                type="button"
                onClick={() => {
                  setEditingNoteId(hl.id);
                  setTempNoteText(hl.note || "");
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title={hasNote ? "Edit comment" : "Add comment"}
                aria-label={hasNote ? "Edit comment" : "Add comment"}
              >
                {hasNote ? (
                  <Edit3 className="h-3.5 w-3.5" />
                ) : (
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopyItem(hl)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Copy quote and comment"
                aria-label="Copy quote and comment"
              >
                {copiedId === hl.id ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => removeHighlight(hl.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                title="Delete highlight"
                aria-label="Delete highlight"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quote */}
          <div>
            <p
              className={`text-sm text-foreground/85 leading-relaxed ${
                isLong && !isExpanded ? "line-clamp-3" : ""
              }`}
            >
              &ldquo;{hl.text}&rdquo;
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => toggleExpandQuote(hl.id)}
                className="mt-1 font-mono text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Inline Comment Editor or Comment Display */}
          {isEditing ? (
            <div className="rounded-xl border border-primary/35 bg-muted/20 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-1">
                {QUICK_COMMENT_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() =>
                      setTempNoteText((prev) =>
                        prev.trim() ? `${prev} ${qp.prefix}` : qp.prefix
                      )
                    }
                    className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                  >
                    + {qp.label}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                rows={3}
                value={tempNoteText}
                onChange={(e) => setTempNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    updateHighlight(hl.id, { note: tempNoteText.trim() });
                    setEditingNoteId(null);
                  }
                }}
                placeholder="Write your takeaway, metric, or interview defense..."
                className="w-full rounded-lg border border-border bg-card p-2.5 font-mono text-xs text-foreground focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  ⌘+Enter to save
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNoteId(null)}
                    className="rounded-lg px-2.5 py-1 font-mono text-xs text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateHighlight(hl.id, { note: tempNoteText.trim() });
                      setEditingNoteId(null);
                    }}
                    className="rounded-lg bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : hasNote ? (
            <div
              onClick={() => {
                setEditingNoteId(hl.id);
                setTempNoteText(hl.note || "");
              }}
              title="Click to edit comment"
              className="border-l-2 border-primary/40 pl-3 text-sm text-foreground leading-relaxed whitespace-pre-wrap cursor-pointer hover:border-primary transition-colors"
            >
              {hl.note}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Compact Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notes &amp; Highlights
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {highlights.length} {highlights.length === 1 ? "highlight" : "highlights"} ·{" "}
            {totalCommentsCount} {totalCommentsCount === 1 ? "comment" : "comments"} ·{" "}
            {activeNotebooks.length} {activeNotebooks.length === 1 ? "notebook" : "notebooks"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportMarkdown}
          disabled={highlights.length === 0 && activeNotebooks.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs font-semibold text-foreground hover:border-primary/40 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {copiedExport ? (
            <>
              <Check className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary">Exported .md</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5 text-primary" />
              <span>Export .md</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Unified Single Toolbar */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 2 Primary Tabs */}
          <div
            role="tablist"
            aria-label="Notes and highlights sections"
            className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1 gap-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "highlights"}
              onClick={() => setActiveTab("highlights")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                activeTab === "highlights"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Highlighter className="h-3.5 w-3.5 text-primary" />
              <span>Highlights ({filtered.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "notebooks"}
              onClick={() => setActiveTab("notebooks")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                activeTab === "notebooks"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <StickyNote className="h-3.5 w-3.5 text-amber-500" />
              <span>Notebooks ({activeNotebooks.length})</span>
            </button>
          </div>

          {/* Compact View Toggles */}
          {activeTab === "highlights" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setGroupByTopic((v) => !v)}
                aria-pressed={groupByTopic}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                  groupByTopic
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Group by topic</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyWithComments((v) => !v)}
                aria-pressed={onlyWithComments}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                  onlyWithComments
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Commented ({totalCommentsCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Search + Tag Chips + Source / Sort */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-border/60">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === "highlights"
                  ? "Search highlights, comments, or topics..."
                  : "Filter notebooks..."
              }
              className="w-full rounded-xl border border-border bg-muted/30 py-1.5 pl-8 pr-8 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {activeTab === "highlights" && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedColor("all")}
                className={`rounded-lg border px-2.5 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                  selectedColor === "all"
                    ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({highlights.length})
              </button>
              {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => {
                const meta = COLOR_METAS[cKey];
                const isSelected = selectedColor === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() =>
                      setSelectedColor((prev) => (prev === cKey ? "all" : cKey))
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                      isSelected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <span>{meta.shortLabel}</span>
                    <span className="opacity-70">{counts[cKey]}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              aria-label="Filter by source type"
              className="rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary cursor-pointer"
            >
              <option value="all">All sources</option>
              <option value="fundamental">Fundamentals</option>
              <option value="session">Sessions (1–{totalSessions})</option>
            </select>

            {activeTab === "highlights" && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                aria-label="Sort highlights"
                className="rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 3A. HIGHLIGHTS TAB */}
      {activeTab === "highlights" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center space-y-3">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Highlighter className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {highlights.length === 0
                    ? "No highlights or comments yet"
                    : "No matching highlights"}
                </h2>
                <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
                  {highlights.length === 0
                    ? "Select any sentence inside a Session or Fundamentals topic to highlight it and attach an interview note."
                    : "Try clearing your search query or switching your tag filter back to All."}
                </p>
              </div>
              {highlights.length === 0 && (
                <div className="pt-1">
                  <Link
                    href="/fundamentals/fund-01"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    Try Highlighting on Topic 1
                  </Link>
                </div>
              )}
            </div>
          ) : groupByTopic ? (
            <div className="space-y-5">
              {groupedHighlights.map((group) => (
                <section
                  key={group.sourceId}
                  className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  {/* Slim Topic Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-muted/20 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Link
                        href={group.href}
                        className="truncate text-sm font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {group.sourceTitle}
                      </Link>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {group.items.length}
                      </span>
                    </div>

                    {group.scratchpad && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNotebookSourceId(group.sourceId);
                          setHasPickedNotebook(true);
                          setActiveTab("notebooks");
                        }}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <StickyNote className="h-3 w-3" />
                        <span>Edit notebook</span>
                      </button>
                    )}
                  </div>

                  {/* Collapsible Notebook Preview (starts closed) */}
                  {group.scratchpad && (
                    <details className="border-b border-border/60 bg-amber-500/[0.03] px-5 py-2.5">
                      <summary className="flex items-center gap-1.5 cursor-pointer list-none font-mono text-xs font-medium text-amber-600 dark:text-amber-400">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform [details[open]_&]:rotate-90" />
                        <span>Notebook preview</span>
                      </summary>
                      <div className="mt-2.5 pb-1 prose-sm max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-1.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {group.scratchpad}
                        </ReactMarkdown>
                      </div>
                    </details>
                  )}

                  {/* Divided Highlight Rows */}
                  <div className="divide-y divide-border/60">
                    {group.items.map((hl) => renderHighlightRow(hl, false))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border/60">
              {filtered.map((hl) => renderHighlightRow(hl, true))}
            </div>
          )}
        </>
      )}

      {/* 3B. NOTEBOOKS TAB (Master-Detail Split) */}
      {activeTab === "notebooks" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Left Pane: Topic Picker + Saved Notebooks List */}
          <aside className="lg:col-span-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="space-y-2.5 border-b border-border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold text-foreground">
                  Saved Notebooks ({activeNotebooks.length})
                </h2>
              </div>
              <select
                value={selectedNotebookSourceId}
                onChange={(e) => {
                  setSelectedNotebookSourceId(e.target.value);
                  setHasPickedNotebook(true);
                }}
                aria-label="Open or create notebook for topic"
                className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary cursor-pointer"
              >
                <optgroup label="Module 0: Fundamentals">
                  {fundamentalsData.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      Topic {t.number}: {t.title}{" "}
                      {scratchpadNotes[t.id]?.trim() ? "✓" : ""}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Curriculum Sessions">
                  {curriculumData.modules.flatMap((m) =>
                    m.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        S{s.number}: {s.title}{" "}
                        {scratchpadNotes[s.id]?.trim() ? "✓" : ""}
                      </option>
                    ))
                  )}
                </optgroup>
              </select>
            </div>

            {activeNotebooks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No saved notebooks match your filter. Pick any topic above to start writing.
              </div>
            ) : (
              <div className="max-h-[540px] overflow-y-auto divide-y divide-border/60">
                {activeNotebooks.map((nb) => {
                  const isActive = selectedNotebookSourceId === nb.id;
                  return (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => {
                        setSelectedNotebookSourceId(nb.id);
                        setHasPickedNotebook(true);
                      }}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer space-y-1 ${
                        isActive
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "hover:bg-muted/30 border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs font-semibold ${
                            isActive ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {nb.title}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                          {nb.wordCount}w
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {nb.preview}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Right Pane: Single Active Notebook Editor/Reader */}
          <div className="lg:col-span-8 space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-3 px-1">
              <h2 className="truncate text-sm font-bold text-foreground">
                {sourceCatalog[selectedNotebookSourceId]?.title ||
                  selectedNotebookSourceId}
              </h2>
              {sourceCatalog[selectedNotebookSourceId] && (
                <Link
                  href={`${sourceCatalog[selectedNotebookSourceId].href}#session-scratchpad`}
                  className="inline-flex shrink-0 items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline"
                >
                  <span>Open Topic</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            <StudyScratchpad
              key={selectedNotebookSourceId}
              sourceId={selectedNotebookSourceId}
              sourceTitle={
                sourceCatalog[selectedNotebookSourceId]?.title ||
                selectedNotebookSourceId
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
