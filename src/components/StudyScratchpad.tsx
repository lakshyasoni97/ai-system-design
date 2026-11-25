"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  StickyNote,
  Edit3,
  Eye,
  Columns,
  Copy,
  Check,
  Bold,
  Code,
  List,
  Quote,
  Heading3,
  ShieldCheck,
  Scale,
  Calculator,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useProgress } from "./ProgressProvider";
import CodeBlock from "./CodeBlock";

interface StudyScratchpadProps {
  sourceId: string;
  sourceTitle: string;
  placeholder?: string;
  compact?: boolean;
  collapsibleWhenEmpty?: boolean;
}

const NOTE_TEMPLATES = [
  {
    id: "defense",
    label: "Interview Defense",
    icon: ShieldCheck,
    color: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15",
    snippet: `### 🛡️ Core Architectural Defense
- **Why this choice:** 
- **Alternative rejected:** 

### 📊 Key SLOs & Numbers to Cite
- **Latency / P99 target:** 
- **Throughput / Scale:** 
`,
  },
  {
    id: "tradeoff",
    label: "Trade-off & Failure Mode",
    icon: Scale,
    color: "text-rose-500 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15",
    snippet: `### ⚖️ Critical Trade-off
- **We sacrifice:** 
- **To gain:** 

### ⚠️ Production Failure Mode & Mitigation
- **What breaks at 10x load:** 
- **Circuit breaker / fallback:** 
`,
  },
  {
    id: "math",
    label: "Back-of-Envelope Math",
    icon: Calculator,
    color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15",
    snippet: `### 🧮 Capacity & Sizing Cheat Sheet
- **Memory / VRAM footprint:** 
- **Bandwidth / QPS:** 
- **Cost optimization lever:** 
`,
  },
];

export default function StudyScratchpad({
  sourceId,
  sourceTitle,
  placeholder = "Jot down personal metrics, interview analogies, or architectural trade-offs to remember...",
  compact = false,
  collapsibleWhenEmpty = false,
}: StudyScratchpadProps) {
  const { scratchpadNotes, updateScratchpad } = useProgress();
  const note = scratchpadNotes[sourceId] || "";
  const [expanded, setExpanded] = useState(false);

  // Mode: "preview" when note exists, "edit" when empty or actively editing, "split" for side-by-side
  const [mode, setMode] = useState<"preview" | "edit" | "split">(() =>
    note.trim().length > 0 ? "preview" : "edit"
  );
  const [copied, setCopied] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templatesMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!templatesOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        templatesMenuRef.current &&
        !templatesMenuRef.current.contains(e.target as Node)
      ) {
        setTemplatesOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTemplatesOpen(false);
    };
    window.addEventListener("mousedown", handleOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [templatesOpen]);

  // Sync initial mode once hydrated if note loads from storage
  const hasInitializedMode = useRef(false);
  useEffect(() => {
    if (!hasInitializedMode.current && note.trim().length > 0) {
      setMode("preview");
      hasInitializedMode.current = true;
    }
  }, [note]);

  const handleNoteChange = (val: string) => {
    updateScratchpad(sourceId, val);
    setJustSaved(true);
  };

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1600);
    return () => clearTimeout(t);
  }, [justSaved]);

  const insertFormatting = (prefix: string, suffix: string = "", defaultText: string = "text") => {
    const el = textareaRef.current;
    if (!el) {
      const next = note ? `${note}\n${prefix}${defaultText}${suffix}` : `${prefix}${defaultText}${suffix}`;
      handleNoteChange(next);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = note.substring(start, end) || defaultText;
    const before = note.substring(0, start);
    const after = note.substring(end);
    const updated = `${before}${prefix}${selected}${suffix}${after}`;
    handleNoteChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  const applyTemplate = (snippet: string) => {
    const next = note.trim() ? `${note.trim()}\n\n${snippet}` : snippet;
    handleNoteChange(next);
    if (mode === "preview") {
      setMode("edit");
    }
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 20);
  };

  const handleCopy = async () => {
    if (!note.trim()) return;
    try {
      await navigator.clipboard.writeText(note);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;

  if (collapsibleWhenEmpty && !note.trim() && !expanded) {
    return (
      <div
        id="session-scratchpad"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm scroll-mt-24"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shrink-0">
            <StickyNote className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Personal Architect Notebook
            </h2>
            <p className="text-xs text-muted-foreground">
              Capture interview defense notes, trade-offs, or capacity numbers for {sourceTitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setMode("edit");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-muted transition-colors cursor-pointer"
        >
          <Edit3 className="h-3.5 w-3.5 text-amber-500" />
          <span>+ Add Notes</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="session-scratchpad"
      className={`rounded-3xl border border-border bg-card shadow-sm scroll-mt-24 overflow-hidden transition-all ${
        compact ? "p-4" : "p-6 sm:p-7"
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shrink-0">
            <StickyNote className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Personal Architect Notebook
              </h2>
              {justSaved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
                  <Check className="h-2.5 w-2.5" />
                  Saved
                </span>
              ) : note.trim() ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              ) : null}
            </div>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                Markdown-enabled synthesis & personal interview defense notes for {sourceTitle}
              </p>
            )}
          </div>
        </div>

        {/* Mode Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all cursor-pointer ${
                mode === "preview"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Read formatted note"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Read</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("edit")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all cursor-pointer ${
                mode === "edit"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Edit markdown note"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-500" />
              <span>Write</span>
            </button>
            {!compact && (
              <button
                type="button"
                onClick={() => setMode("split")}
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs transition-all cursor-pointer ${
                  mode === "split"
                    ? "bg-card text-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Side-by-side editor and live preview"
              >
                <Columns className="h-3.5 w-3.5 text-indigo-500" />
                <span>Split</span>
              </button>
            )}
          </div>

          {note.trim() && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                title="Copy note markdown"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span className="text-primary font-semibold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {confirmClear ? (
                <div className="inline-flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleNoteChange("");
                      setConfirmClear(false);
                      setMode("edit");
                    }}
                    className="font-mono text-[11px] font-semibold text-destructive hover:underline cursor-pointer px-1"
                  >
                    Confirm Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="font-mono text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="rounded-xl border border-border bg-card p-1.5 text-muted-foreground hover:border-destructive/40 hover:text-destructive transition-colors cursor-pointer"
                  title="Clear note"
                  aria-label="Clear note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Compact Toolbar: Templates Dropdown + Formatting Icons */}
      {(mode === "edit" || mode === "split" || !note.trim()) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/25 px-2.5 py-1.5">
          <div className="relative" ref={templatesMenuRef}>
            <button
              type="button"
              onClick={() => setTemplatesOpen((v) => !v)}
              aria-expanded={templatesOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[11px] font-medium text-foreground hover:border-primary/40 transition-colors cursor-pointer"
            >
              <span>Templates</span>
              <ChevronDown
                className={`h-3 w-3 text-muted-foreground transition-transform ${
                  templatesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {templatesOpen && (
              <div
                role="menu"
                aria-label="Note structure templates"
                className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl"
              >
                {NOTE_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        applyTemplate(tpl.snippet);
                        setTemplatesOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Formatting mini-toolbar */}
          {(mode === "edit" || mode === "split") && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => insertFormatting("**", "**", "bold point")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Bold"
                aria-label="Insert bold text"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("`", "`", "metric")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Inline Code / Metric"
                aria-label="Insert inline code"
              >
                <Code className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("### ", "", "Key Takeaway")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Heading"
                aria-label="Insert section heading"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("- ", "", "Architectural point")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Bullet list"
                aria-label="Insert bullet list item"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("> ", "", "Crucial interview defense quote")}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Callout quote"
                aria-label="Insert callout quote"
              >
                <Quote className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Body Area: Preview, Edit, or Split */}
      <div className={`mt-4 ${mode === "split" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : ""}`}>
        {/* Editor Pane */}
        {(mode === "edit" || mode === "split") && (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              aria-label="Personal interview scratchpad notes"
              rows={compact ? 5 : 7}
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  setMode("preview");
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-2xl border border-border bg-muted/25 p-4 font-mono text-xs sm:text-sm leading-relaxed text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus-visible:ring-1 focus-visible:ring-primary transition-colors resize-y"
            />
            <div className="flex items-center justify-between px-1 font-mono text-[11px] text-muted-foreground">
              <span>Supports Markdown (`**bold**`, `- lists`, `` `code` ``, `&gt; callouts`)</span>
              {note.trim() && (
                <button
                  type="button"
                  onClick={() => setMode("preview")}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Done Editing (⌘+Enter)
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rendered Preview Pane */}
        {(mode === "preview" || mode === "split") && (
          <div>
            {note.trim() ? (
              <div
                onClick={() => {
                  if (mode === "preview") setMode("edit");
                }}
                title={mode === "preview" ? "Click anywhere to edit note" : undefined}
                className={`group relative rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] p-5 transition-all ${
                  mode === "preview"
                    ? "cursor-pointer hover:border-amber-500/50 hover:shadow-sm"
                    : "h-full"
                }`}
              >
                {mode === "preview" && (
                  <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-lg border border-border bg-card/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Edit3 className="h-3 w-3 text-amber-500" />
                    Click to Edit
                  </span>
                )}

                <div className="prose-sm max-w-none space-y-2.5 text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h3 className="text-base font-bold text-foreground mt-3 mb-1.5 border-b border-border/60 pb-1">
                          {children}
                        </h3>
                      ),
                      h2: ({ children }) => (
                        <h3 className="text-sm font-bold text-foreground mt-3 mb-1.5 border-b border-border/60 pb-1">
                          {children}
                        </h3>
                      ),
                      h3: ({ children }) => (
                        <h4 className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 mt-3 mb-1">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-xs sm:text-sm leading-relaxed text-foreground/95 my-1.5">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-foreground/90 my-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm text-foreground/90 my-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-xs sm:text-sm text-foreground/90">
                          {children}
                        </blockquote>
                      ),
                      code: ({ className, children }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const lang = match?.[1] || "";
                        const rawCode = String(children).replace(/\n$/, "");
                        if (rawCode.includes("\n") || Boolean(lang)) {
                          return <CodeBlock language={lang} rawCode={rawCode} />;
                        }
                        return (
                          <code className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-primary font-semibold">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {note}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setMode("edit")}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
              >
                <StickyNote className="h-6 w-6 text-amber-500 mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  No personal study notes yet for {sourceTitle}
                </p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  Click here or choose one of the structured templates above to record your interview defense points, capacity math, or trade-offs.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
