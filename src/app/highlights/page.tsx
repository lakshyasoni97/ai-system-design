"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Highlighter,
  Search,
  ExternalLink,
  Trash2,
  Download,
  Filter,
  Check,
  Tag,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileText,
} from "lucide-react";
import {
  HighlightColor,
  TextHighlight,
  useProgress,
} from "@/components/ProgressProvider";

const COLOR_METAS: Record<
  HighlightColor,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  amber: {
    label: "Key Concept",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    text: "text-amber-500",
    dot: "bg-amber-500",
  },
  emerald: {
    label: "Formula / SLO",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  indigo: {
    label: "Interview Defense",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/40",
    text: "text-indigo-500",
    dot: "bg-indigo-500",
  },
  rose: {
    label: "Trap / Failure Mode",
    bg: "bg-rose-500/15",
    border: "border-rose-500/40",
    text: "text-rose-500",
    dot: "bg-rose-500",
  },
};

export default function HighlightsPage() {
  const {
    highlights,
    updateHighlight,
    removeHighlight,
  } = useProgress();

  const [query, setQuery] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedSourceType, setSelectedSourceType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState("");
  const [copiedExport, setCopiedExport] = useState(false);

  // Filtered highlights
  const filtered = useMemo(() => {
    return highlights
      .filter((h) => {
        if (selectedColor !== "all" && h.color !== selectedColor) return false;
        if (selectedSourceType !== "all" && h.sourceType !== selectedSourceType)
          return false;
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
  }, [highlights, selectedColor, selectedSourceType, query, sortBy]);

  // Counts by category
  const counts = useMemo(() => {
    const res: Record<HighlightColor, number> = {
      amber: 0,
      emerald: 0,
      indigo: 0,
      rose: 0,
    };
    highlights.forEach((h) => {
      if (res[h.color] !== undefined) res[h.color]++;
    });
    return res;
  }, [highlights]);

  // Export highlights to formatted Markdown Study Sheet
  const handleExportMarkdown = () => {
    let md = `# AI System Design — Master Study Sheet & Highlighted Defenses\n\n`;
    md += `Exported on: ${new Date().toLocaleDateString()} • Total Highlights: ${highlights.length}\n\n`;
    md += `---\n\n`;

    const grouped: Record<string, TextHighlight[]> = {};
    highlights.forEach((h) => {
      const key = `${h.sourceTitle}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(h);
    });

    Object.entries(grouped).forEach(([title, items]) => {
      md += `## ${title}\n\n`;
      items.forEach((item) => {
        const tag = COLOR_METAS[item.color].label;
        md += `### [${tag.toUpperCase()}] ${item.sectionTitle}\n`;
        md += `> "${item.text}"\n\n`;
        if (item.note) {
          md += `**Architect Note:** ${item.note}\n\n`;
        }
        md += `*Reference: ${item.href}*\n\n`;
      });
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-system-design-highlights-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
              <Highlighter className="h-3.5 w-3.5" />
              <span>Interactive Knowledge Anchors</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Context Highlights & Architect Notes
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Every highlighted principle, formula, latency number, and interview defense
              linked directly back to its exact surrounding sentence in the curriculum.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={highlights.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 font-mono text-xs font-semibold text-foreground hover:border-primary/40 hover:text-foreground transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {copiedExport ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary">Downloaded Markdown</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-primary" />
                  <span>Export Study Sheet (.md)</span>
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
                onClick={() =>
                  setSelectedColor((prev) => (prev === cKey ? "all" : cKey))
                }
                className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.text}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {counts[cKey]}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    anchors
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search quotes, notes, or section topics..."
            className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Source Type Filter */}
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            aria-label="Filter highlights by source type"
            className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Sources</option>
            <option value="fundamental">Module 0: Fundamentals</option>
            <option value="session">Curriculum Sessions (1-20)</option>
          </select>

          {/* Color Filter */}
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

          {/* Sort order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "oldest")}
            aria-label="Sort highlights by date order"
            className="rounded-xl border border-border bg-card px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 4. Highlight Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Highlighter className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {highlights.length === 0
                ? "No highlights created yet"
                : "No matching highlights found"}
            </h3>
            <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground leading-relaxed">
              {highlights.length === 0
                ? "Select any text in any Session or Fundamentals topic to open the floating highlight toolbar, pick a color tag, and attach notes."
                : "Try clearing your search query or switching your category filter to 'All Tags'."}
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
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((hl) => {
            const meta = COLOR_METAS[hl.color];
            const isEditing = editingNoteId === hl.id;

            return (
              <div
                key={hl.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition-all space-y-4 group"
              >
                {/* Card Top: Source badge + Section breadcrumb */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.text}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(hl.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-1">
                    <div className="font-mono text-[11px] font-semibold text-primary truncate">
                      {hl.sourceTitle}
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                      → {hl.sectionTitle}
                    </div>
                  </div>

                  {/* Highlight Quote */}
                  <blockquote className="rounded-2xl border-l-4 border-primary/50 bg-muted/30 p-3.5 text-xs sm:text-sm text-foreground/90 italic font-serif leading-relaxed">
                    &ldquo;{hl.text}&rdquo;
                  </blockquote>

                  {/* Note Section (Inline view / edit) */}
                  <div className="pt-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          autoFocus
                          rows={2}
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="Jot down personal metrics or interview defense notes..."
                          className="w-full rounded-xl border border-border bg-muted/40 p-2.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            className="rounded-lg px-2.5 py-1 font-mono text-xs text-muted-foreground hover:bg-muted"
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
                            className="rounded-lg bg-primary px-3 py-1 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNoteId(hl.id);
                          setTempNoteText(hl.note || "");
                        }}
                        className="rounded-xl border border-border/80 bg-secondary/30 p-2.5 font-mono text-xs text-foreground cursor-pointer hover:border-primary/40 transition-colors"
                        title="Click to edit annotation note"
                      >
                        {hl.note ? (
                          <div className="flex items-start gap-1.5">
                            <span className="text-muted-foreground font-semibold">
                              Note:
                            </span>
                            <span className="flex-1">{hl.note}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            + Click to attach personal architect note...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Tag Switcher, Delete, and Jump to Text Link */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    {/* Color switcher dots */}
                    {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => updateHighlight(hl.id, { color: cKey })}
                        title={`Change tag to ${COLOR_METAS[cKey].label}`}
                        className={`h-4 w-4 rounded-full transition-all ${
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

                  {/* Deep link back to exact place in text */}
                  <Link
                    href={`${hl.href}?highlight=${hl.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    <span>Jump to exact place in text</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}