"use client";

import React, { useMemo, useState } from "react";
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
  ArrowRight,
  MessageSquare,
  MessageSquarePlus,
  StickyNote,
  LayoutGrid,
  BookOpen,
  Edit3,
  Copy,
  Sparkles,
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
    bg: string;
    border: string;
    text: string;
    dot: string;
    hex: string;
  }
> = {
  amber: {
    label: "Key Concept",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    hex: "#f59e0b",
  },
  emerald: {
    label: "Formula / SLO",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    hex: "#10b981",
  },
  indigo: {
    label: "Interview Defense",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/40",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    hex: "#6366f1",
  },
  rose: {
    label: "Trap / Failure Mode",
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

export default function HighlightsPage() {
  const {
    highlights,
    scratchpadNotes,
    updateHighlight,
    removeHighlight,
  } = useProgress();

  const [viewMode, setViewMode] = useState<"cards" | "study-guide" | "notebooks">("cards");
  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedSourceType, setSelectedSourceType] = useState<string>("all");
  const [onlyWithComments, setOnlyWithComments] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);
  const [selectedNotebookSourceId, setSelectedNotebookSourceId] = useState<string>("session-01");

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
          title: `Session ${String(s.number).padStart(2, "0")}: ${s.title}`,
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
        return {
          ...meta,
          text: text.trim(),
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

  // Grouped by Session / Topic for Study Guide View
  const groupedStudyGuide = useMemo(() => {
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

    // Seed from filtered highlights
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

    // Also include active notebooks that match filter
    if (selectedColor === "all") {
      activeNotebooks.forEach((nb) => {
        if (!groups.has(nb.id)) {
          groups.set(nb.id, {
            sourceId: nb.id,
            sourceTitle: nb.title,
            href: nb.href,
            order: nb.order,
            scratchpad: nb.text,
            items: [],
          });
        }
      });
    }

    return Array.from(groups.values()).sort((a, b) => a.order - b.order);
  }, [filtered, activeNotebooks, scratchpadNotes, sourceCatalog, selectedColor]);

  // Counts by category
  const counts = useMemo(() => {
    const res: Record<HighlightColor, { total: number; commented: number }> = {
      amber: { total: 0, commented: 0 },
      emerald: { total: 0, commented: 0 },
      indigo: { total: 0, commented: 0 },
      rose: { total: 0, commented: 0 },
    };
    highlights.forEach((h) => {
      if (res[h.color]) {
        res[h.color].total++;
        if (h.note?.trim()) res[h.color].commented++;
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
    md += `Exported on: ${new Date().toLocaleDateString()} • Highlights: ${highlights.length} (${totalCommentsCount} with comments) • Notebooks: ${activeNotebooks.length}\n\n`;
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
        md += `### 📓 Personal Architect Notebook\n\n${notebook}\n\n`;
      }

      if (sourceItems.length > 0) {
        sourceItems.forEach((item) => {
          const tag = COLOR_METAS[item.color].label;
          md += `### [${tag.toUpperCase()}] ${item.sectionTitle}\n`;
          md += `> "${item.text}"\n\n`;
          if (item.note) {
            md += `**💬 Architect Comment:** ${item.note}\n\n`;
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

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                <Highlighter className="h-3.5 w-3.5" />
                <span>{highlights.length} Knowledge Anchors</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{totalCommentsCount} Architect Comments</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <StickyNote className="h-3.5 w-3.5" />
                <span>{activeNotebooks.length} Session Notebooks</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Comments, Notes & Knowledge Anchors
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your personal interview synthesis hub: review inline comments attached to exact sentences, browse structured session notebooks, or export a unified study guide.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={highlights.length === 0 && activeNotebooks.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-mono text-xs font-semibold text-foreground hover:border-primary/40 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {copiedExport ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary">Downloaded Study Sheet</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-primary" />
                  <span>Export Master Study Sheet (.md)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Semantic Category KPI Tiles */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => {
            const meta = COLOR_METAS[cKey];
            const isSelected = selectedColor === cKey;
            return (
              <button
                key={cKey}
                type="button"
                onClick={() => {
                  setSelectedColor((prev) => (prev === cKey ? "all" : cKey));
                  if (viewMode === "notebooks") setViewMode("cards");
                }}
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {counts[cKey].total}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {counts[cKey].commented} commented
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. View Switcher, Search & Filter Bar */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          {/* 3 View Modes */}
          <div className="inline-flex flex-wrap items-center rounded-xl border border-border bg-muted/40 p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <span>Annotation Cards ({filtered.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("study-guide")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                viewMode === "study-guide"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
              <span>By Topic Study Guide ({groupedStudyGuide.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("notebooks")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                viewMode === "notebooks"
                  ? "bg-card text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <StickyNote className="h-3.5 w-3.5 text-amber-500" />
              <span>Architect Notebooks ({activeNotebooks.length})</span>
            </button>
          </div>

          {/* Quick toggle: Only with comments */}
          {viewMode !== "notebooks" && (
            <button
              type="button"
              onClick={() => setOnlyWithComments((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                onlyWithComments
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>With Comments Only ({totalCommentsCount})</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search comments, quotes, notebooks, or section topics..."
              className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Type Filter */}
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              aria-label="Filter annotations by source type"
              className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="all">All Sources</option>
              <option value="fundamental">Module 0: Fundamentals</option>
              <option value="session">Curriculum Sessions (1-20)</option>
            </select>

            {viewMode !== "notebooks" && (
              <>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  aria-label="Filter highlights by color tag"
                  className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">All Tags</option>
                  <option value="amber">Key Concepts</option>
                  <option value="emerald">Formulas / SLOs</option>
                  <option value="indigo">Interview Defenses</option>
                  <option value="rose">Traps / Failure Modes</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
                  aria-label="Sort highlights by date order"
                  className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4A. VIEW MODE: ANNOTATION CARDS STREAM */}
      {viewMode === "cards" && (
        <>
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Highlighter className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {highlights.length === 0
                    ? "No highlights or comments created yet"
                    : "No matching annotations found"}
                </h3>
                <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
                  {highlights.length === 0
                    ? "Select any text in any Session or Fundamentals topic to open the floating highlight toolbar, pick a semantic tag, and attach your interview comment."
                    : "Try clearing your search query or switching your filter to 'All Tags'."}
                </p>
              </div>
              {highlights.length === 0 && (
                <div className="pt-2">
                  <Link
                    href="/fundamentals/fund-01"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>Try Highlighting on Fundamentals Topic 1</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {filtered.map((hl) => {
                const meta = COLOR_METAS[hl.color];
                const isEditing = editingNoteId === hl.id;
                const hasNote = Boolean(hl.note?.trim());

                return (
                  <div
                    key={hl.id}
                    className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all space-y-4"
                  >
                    <div className="space-y-3.5">
                      {/* Card Top: Semantic badge + Date + Copy */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(hl.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyItem(hl)}
                            className="rounded-lg border border-border bg-muted/30 p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy quote and comment"
                          >
                            {copiedId === hl.id ? (
                              <Check className="h-3 w-3 text-primary" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Breadcrumb Context */}
                      <div>
                        <Link
                          href={hl.href}
                          className="font-mono text-[11px] font-semibold text-primary hover:underline block truncate"
                        >
                          {hl.sourceTitle}
                        </Link>
                        <div className="text-xs font-medium text-muted-foreground truncate mt-0.5">
                          § {hl.sectionTitle}
                        </div>
                      </div>

                      {/* HERO ELEMENT: Architect Comment / Note (if present or editing) */}
                      {isEditing ? (
                        <div className="rounded-2xl border border-primary/40 bg-muted/20 p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Architect Comment Editor
                            </span>
                          </div>
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
                                updateHighlight(hl.id, {
                                  note: tempNoteText.trim(),
                                });
                                setEditingNoteId(null);
                              }
                            }}
                            placeholder="Write your personal takeaway, metric, or interview defense..."
                            className="w-full rounded-xl border border-border bg-card p-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
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
                                  updateHighlight(hl.id, {
                                    note: tempNoteText.trim(),
                                  });
                                  setEditingNoteId(null);
                                }}
                                className="rounded-xl bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                              >
                                Save Comment
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
                          title="Click to edit your architect comment"
                          className="group/comment relative rounded-2xl border border-primary/25 bg-primary/[0.05] dark:bg-primary/[0.08] p-4 space-y-1.5 cursor-pointer hover:border-primary/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                              <MessageSquare className="h-3 w-3" />
                              Architect Comment
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-card/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground opacity-0 group-hover/comment:opacity-100 transition-opacity">
                              <Edit3 className="h-2.5 w-2.5" />
                              Edit
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">
                            {hl.note}
                          </p>
                        </div>
                      ) : null}

                      {/* Supporting Context Quote Anchor */}
                      <blockquote
                        className="rounded-2xl bg-muted/35 p-3.5 text-xs sm:text-[13px] text-foreground/85 italic font-serif leading-relaxed border-l-3"
                        style={{ borderLeftColor: meta.hex }}
                      >
                        &ldquo;{hl.text}&rdquo;
                      </blockquote>

                      {/* Add Comment Prompt when no comment exists yet */}
                      {!hasNote && !isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNoteId(hl.id);
                            setTempNoteText("");
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/15 py-2 px-3 font-mono text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
                          <span>+ Attach Architect Comment or Interview Defense</span>
                        </button>
                      )}
                    </div>

                    {/* Card Footer: Tag Switcher, Delete, and Deep-Link */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => updateHighlight(hl.id, { color: cKey })}
                            title={`Change tag to ${COLOR_METAS[cKey].label}`}
                            className={`h-4 w-4 rounded-full transition-all cursor-pointer ${
                              COLOR_METAS[cKey].dot
                            } ${
                              hl.color === cKey
                                ? "ring-2 ring-primary ring-offset-1 scale-110"
                                : "opacity-40 hover:opacity-100"
                            }`}
                          />
                        ))}

                        <div className="h-3 w-px bg-border mx-1" />

                        <button
                          type="button"
                          onClick={() => removeHighlight(hl.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Delete this highlight"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Link
                        href={`${hl.href}?highlight=${hl.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        <span>Jump to exact sentence</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 4B. VIEW MODE: STRUCTURED STUDY GUIDE BY TOPIC */}
      {viewMode === "study-guide" && (
        <div className="space-y-6">
          {groupedStudyGuide.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-2">
              <BookOpen className="h-8 w-8 text-primary mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                No study guide entries match your filter
              </h3>
              <p className="text-xs text-muted-foreground">
                Try clearing your search filter or adding highlights and notes inside any Session.
              </p>
            </div>
          ) : (
            groupedStudyGuide.map((group) => (
              <div
                key={group.sourceId}
                className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Topic Synthesis & Annotations
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      {group.sourceTitle}
                    </h2>
                  </div>
                  <Link
                    href={group.href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3.5 py-1.5 font-mono text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
                  >
                    <span>Open Topic Article</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </Link>
                </div>

                {/* Topic Notebook if present */}
                {group.scratchpad && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <StickyNote className="h-3.5 w-3.5" />
                        Personal Architect Notebook
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNotebookSourceId(group.sourceId);
                          setViewMode("notebooks");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Edit3 className="h-3 w-3 text-amber-500" />
                        <span>Edit Notebook</span>
                      </button>
                    </div>
                    <div className="prose-sm max-w-none text-xs sm:text-sm text-foreground/95 leading-relaxed space-y-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {group.scratchpad}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Highlight & Comment items in this topic */}
                {group.items.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Anchored Highlights & Comments ({group.items.length})
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.items.map((hl) => {
                        const meta = COLOR_METAS[hl.color];
                        return (
                          <div
                            key={hl.id}
                            className="flex flex-col justify-between rounded-2xl border border-border bg-muted/15 p-4 space-y-3"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                  {meta.label}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[160px]">
                                  § {hl.sectionTitle}
                                </span>
                              </div>

                              {hl.note?.trim() && (
                                <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-3 space-y-1">
                                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary block">
                                    💬 Architect Comment
                                  </span>
                                  <p className="text-xs sm:text-[13px] font-medium text-foreground leading-relaxed">
                                    {hl.note}
                                  </p>
                                </div>
                              )}

                              <blockquote
                                className="rounded-xl bg-card/80 pl-3 pr-2.5 py-2 text-xs italic text-muted-foreground font-serif border-l-3"
                                style={{ borderLeftColor: meta.hex }}
                              >
                                &ldquo;{hl.text}&rdquo;
                              </blockquote>
                            </div>

                            <div className="flex items-center justify-end pt-2 border-t border-border/60">
                              <Link
                                href={`${hl.href}?highlight=${hl.id}`}
                                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary hover:underline"
                              >
                                <span>Spotlight in text</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 4C. VIEW MODE: ARCHITECT NOTEBOOKS (SCRATCHPADS) */}
      {viewMode === "notebooks" && (
        <div className="space-y-6">
          {/* Quick Selector to Open / Create Notebook for any Session or Fundamental */}
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                  Interactive Notebook Workspace
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Write or Edit Topic Notebook
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedNotebookSourceId}
                  onChange={(e) => setSelectedNotebookSourceId(e.target.value)}
                  aria-label="Select session or fundamental topic notebook"
                  className="rounded-xl border border-border bg-muted/40 px-3 py-2 font-mono text-xs font-semibold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  <optgroup label="Module 0: Distributed Systems Fundamentals">
                    {fundamentalsData.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        Topic {t.number}: {t.title}{" "}
                        {scratchpadNotes[t.id]?.trim() ? "✓" : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Curriculum Sessions (1-20)">
                    {curriculumData.modules.flatMap((m) =>
                      m.sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          S{String(s.number).padStart(2, "0")}: {s.title}{" "}
                          {scratchpadNotes[s.id]?.trim() ? "✓" : ""}
                        </option>
                      ))
                    )}
                  </optgroup>
                </select>

                {sourceCatalog[selectedNotebookSourceId] && (
                  <Link
                    href={sourceCatalog[selectedNotebookSourceId].href}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <span>Go to Topic</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
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

          {/* All Saved Notebooks Grid */}
          {activeNotebooks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                All Saved Topic Notebooks ({activeNotebooks.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {activeNotebooks.map((nb) => (
                  <div
                    key={nb.id}
                    className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-amber-500/40 transition-all space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <StickyNote className="h-3 w-3" />
                          Architect Notebook
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedNotebookSourceId(nb.id);
                            window.scrollTo({ top: 260, behavior: "smooth" });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Edit3 className="h-2.5 w-2.5 text-amber-500" />
                          Edit in Workspace
                        </button>
                      </div>

                      <Link
                        href={nb.href}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors block"
                      >
                        {nb.title}
                      </Link>

                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-1.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {nb.text}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-border/60">
                      <Link
                        href={`${nb.href}#session-scratchpad`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        <span>Open in Session</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
