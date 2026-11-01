"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Highlighter,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  HighlightColor,
  TextHighlight,
  useProgress,
} from "./ProgressProvider";

interface HighlightableArticleProps {
  sourceType: "session" | "fundamental";
  sourceId: string;
  sourceTitle: string;
  href: string;
  children: React.ReactNode;
}

const COLOR_METAS: Record<
  HighlightColor,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  amber: {
    label: "Key Concept",
    bg: "bg-amber-500/20",
    border: "border-amber-500",
    text: "text-amber-500",
    dot: "bg-amber-500",
  },
  emerald: {
    label: "Formula / SLO",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
  },
  indigo: {
    label: "Interview Defense",
    bg: "bg-indigo-500/20",
    border: "border-indigo-500",
    text: "text-indigo-500",
    dot: "bg-indigo-500",
  },
  rose: {
    label: "Trap / Failure Mode",
    bg: "bg-rose-500/20",
    border: "border-rose-500",
    text: "text-rose-500",
    dot: "bg-rose-500",
  },
};

export default function HighlightableArticle({
  sourceType,
  sourceId,
  sourceTitle,
  href,
  children,
}: HighlightableArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    highlights,
    addHighlight,
    updateHighlight,
    removeHighlight,
    getHighlightsForSource,
  } = useProgress();

  const pageHighlights = getHighlightsForSource(sourceId);

  // Floating toolbar for new selection
  const [selectionBox, setSelectionBox] = useState<{
    text: string;
    prefix: string;
    suffix: string;
    sectionId: string;
    sectionTitle: string;
    top: number;
    left: number;
  } | null>(null);

  const [toolbarNoteOpen, setToolbarNoteOpen] = useState(false);
  const [toolbarNoteText, setToolbarNoteText] = useState("");
  const [toolbarCopied, setToolbarCopied] = useState(false);

  // Popover for existing clicked highlight
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activePopoverPos, setActivePopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  // In-page highlights drawer collapse state
  const [inPageDrawerOpen, setInPageDrawerOpen] = useState(false);

  // Find nearest preceding h2 or h3 heading to given DOM node
  const findPrecedingHeading = (node: Node | null): { id: string; title: string } => {
    let curr: Node | null = node;
    const headings = Array.from(
      containerRef.current?.querySelectorAll("h2, h3") || []
    ) as HTMLElement[];

    if (!headings.length) {
      return { id: "top", title: sourceTitle };
    }

    while (curr && curr !== containerRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as HTMLElement;
        if (el.tagName === "H2" || el.tagName === "H3") {
          return { id: el.id || "section", title: el.innerText.trim() };
        }
      }
      // Check previous siblings
      let prev = curr.previousSibling;
      while (prev) {
        if (prev.nodeType === Node.ELEMENT_NODE) {
          const el = prev as HTMLElement;
          const subHeadings = Array.from(el.querySelectorAll("h2, h3")) as HTMLElement[];
          if (subHeadings.length > 0) {
            const last = subHeadings[subHeadings.length - 1];
            return { id: last.id || "section", title: last.innerText.trim() };
          }
          if (el.tagName === "H2" || el.tagName === "H3") {
            return { id: el.id || "section", title: el.innerText.trim() };
          }
        }
        prev = prev.previousSibling;
      }
      curr = curr.parentNode;
    }

    // Default to the first heading or general page
    return {
      id: headings[0]?.id || "top",
      title: headings[0]?.innerText?.trim() || sourceTitle,
    };
  };

  // Listen for user text selections inside the article
  const handleMouseUp = () => {
    // Small delay to let selection finalize
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setSelectionBox(null);
        setToolbarNoteOpen(false);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setSelectionBox(null);
        setToolbarNoteOpen(false);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setSelectionBox(null);
        setToolbarNoteOpen(false);
        return;
      }

      // Compute bounding box relative to container
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Heading context
      const heading = findPrecedingHeading(range.startContainer);

      // Extract context prefix & suffix for robust anchoring
      const fullContent = containerRef.current.innerText || "";
      const textIndex = fullContent.indexOf(text);
      const prefix =
        textIndex > 0 ? fullContent.slice(Math.max(0, textIndex - 35), textIndex) : "";
      const suffix =
        textIndex !== -1
          ? fullContent.slice(
              textIndex + text.length,
              Math.min(fullContent.length, textIndex + text.length + 35)
            )
          : "";

      setSelectionBox({
        text,
        prefix,
        suffix,
        sectionId: heading.id,
        sectionTitle: heading.title,
        top: rect.top - containerRect.top + containerRef.current.offsetTop - 52,
        left: Math.max(
          10,
          rect.left -
            containerRect.left +
            containerRef.current.offsetLeft +
            rect.width / 2 -
            140
        ),
      });
      setToolbarNoteOpen(false);
      setToolbarNoteText("");
    }, 10);
  };

  // Create a new highlight from the selection toolbar
  const handleCreateHighlight = (color: HighlightColor) => {
    if (!selectionBox) return;

    const newHl = addHighlight({
      sourceType,
      sourceId,
      sourceTitle,
      href,
      sectionId: selectionBox.sectionId,
      sectionTitle: selectionBox.sectionTitle,
      text: selectionBox.text,
      prefix: selectionBox.prefix,
      suffix: selectionBox.suffix,
      color,
      note: toolbarNoteText.trim() || undefined,
    });

    window.getSelection()?.removeAllRanges();
    setSelectionBox(null);
    setToolbarNoteOpen(false);
    setToolbarNoteText("");

    // Pulse the newly created highlight
    setTimeout(() => {
      triggerSpotlight(newHl.id);
    }, 100);
  };

  const handleCopySelection = async () => {
    if (!selectionBox) return;
    try {
      await navigator.clipboard.writeText(selectionBox.text);
      setToolbarCopied(true);
      setTimeout(() => setToolbarCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // Re-apply DOM marks whenever highlights for this page change
  const applyHighlightsToDom = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;

    // 1. Remove existing mark wrappers safely
    const existingMarks = root.querySelectorAll("mark[data-highlight-id]");
    existingMarks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
      }
    });

    if (pageHighlights.length === 0) return;

    // 2. Walk text nodes and apply highlights
    pageHighlights.forEach((hl) => {
      const targetText = hl.text.trim();
      if (!targetText) return;

      // Find text nodes that contain targetText
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          // Skip if inside code blocks, diagrams, or buttons
          const p = node.parentElement;
          if (
            p &&
            (p.tagName === "PRE" ||
              p.tagName === "BUTTON" ||
              p.closest(".mermaid-diagram-wrap") ||
              p.closest("[data-no-highlight]"))
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      // Gather all text nodes and their cumulative text
      const textNodes: Text[] = [];
      let fullArticleText = "";
      const nodeOffsets: { node: Text; start: number; end: number }[] = [];

      let currentNode = walker.nextNode() as Text | null;
      while (currentNode) {
        const val = currentNode.nodeValue || "";
        const start = fullArticleText.length;
        fullArticleText += val;
        nodeOffsets.push({
          node: currentNode,
          start,
          end: start + val.length,
        });
        textNodes.push(currentNode);
        currentNode = walker.nextNode() as Text | null;
      }

      // Search for position of targetText
      let matchIdx = fullArticleText.indexOf(targetText);
      // If disambiguation prefix is given, prefer match after prefix
      if (hl.prefix && fullArticleText.includes(hl.prefix)) {
        const prefixIdx = fullArticleText.indexOf(hl.prefix);
        const candidateIdx = fullArticleText.indexOf(targetText, prefixIdx);
        if (candidateIdx !== -1) {
          matchIdx = candidateIdx;
        }
      }

      if (matchIdx === -1) return;

      const matchStart = matchIdx;
      const matchEnd = matchIdx + targetText.length;

      // Find text nodes covering matchStart to matchEnd
      const affected = nodeOffsets.filter(
        (entry) => entry.end > matchStart && entry.start < matchEnd
      );

      let isFirstFragment = true;
      affected.forEach((entry) => {
        const node = entry.node;
        const sliceStart = Math.max(0, matchStart - entry.start);
        const sliceEnd = Math.min(node.length, matchEnd - entry.start);

        if (sliceEnd <= sliceStart) return;

        try {
          const range = document.createRange();
          range.setStart(node, sliceStart);
          range.setEnd(node, sliceEnd);

          const mark = document.createElement("mark");
          mark.className = `text-highlight text-highlight-${hl.color}`;
          mark.setAttribute("data-highlight-id", hl.id);
          mark.setAttribute("data-color", hl.color);
          if (isFirstFragment) {
            mark.id = `highlight-${hl.id}`;
            isFirstFragment = false;
          }
          mark.title = hl.note
            ? `[${COLOR_METAS[hl.color].label}] ${hl.note}`
            : `[${COLOR_METAS[hl.color].label}] Click to edit`;

          mark.onclick = (e) => {
            e.stopPropagation();
            const rect = mark.getBoundingClientRect();
            const cRect = root.getBoundingClientRect();
            setActiveHighlightId(hl.id);
            setEditNoteText(hl.note || "");
            setActivePopoverPos({
              top: rect.bottom - cRect.top + root.offsetTop + 8,
              left: Math.max(
                10,
                rect.left - cRect.left + root.offsetLeft + rect.width / 2 - 140
              ),
            });
          };

          range.surroundContents(mark);
        } catch {
          // If surroundContents fails due to cross-element splitting, continue gracefully
        }
      });
    });
  }, [pageHighlights]);

  // Apply on mount and whenever pageHighlights change
  useEffect(() => {
    applyHighlightsToDom();
  }, [applyHighlightsToDom]);

  // Deep-link scroll and spotlight pulse
  const triggerSpotlight = (highlightId: string) => {
    const el = document.getElementById(`highlight-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const marks = containerRef.current?.querySelectorAll(
        `mark[data-highlight-id="${highlightId}"]`
      );
      marks?.forEach((m) => m.classList.add("highlight-spotlight"));
      setTimeout(() => {
        marks?.forEach((m) => m.classList.remove("highlight-spotlight"));
      }, 3600);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const hlParam = urlParams.get("highlight");
    if (hlParam) {
      // Delay slightly for DOM mark rendering
      const timer = setTimeout(() => {
        triggerSpotlight(hlParam);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pageHighlights]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest("[data-highlight-toolbar]") &&
        !target.closest("[data-highlight-popover]") &&
        !target.closest("mark[data-highlight-id]")
      ) {
        setActiveHighlightId(null);
        setActivePopoverPos(null);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeHighlight = highlights.find((h) => h.id === activeHighlightId);

  return (
    <div className="relative">
      {/* Article Content Container */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="relative selection:bg-primary/25"
      >
        {children}
      </div>

      {/* 1. Floating Selection Toolbar (When User Selects Text) */}
      {selectionBox && (
        <div
          data-highlight-toolbar
          style={{ top: `${selectionBox.top}px`, left: `${selectionBox.left}px` }}
          className="absolute z-40 flex flex-col rounded-2xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 px-2 font-mono text-[10px] uppercase font-semibold text-muted-foreground">
              <Highlighter className="h-3 w-3 text-primary" />
              Highlight
            </span>

            {/* 4 Semantic Color Choices */}
            {(Object.keys(COLOR_METAS) as HighlightColor[]).map((colorKey) => {
              const meta = COLOR_METAS[colorKey];
              return (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => handleCreateHighlight(colorKey)}
                  title={`Tag as ${meta.label}`}
                  className="group relative flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-muted/40 hover:scale-105 hover:border-primary/50 transition-all cursor-pointer"
                >
                  <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                </button>
              );
            })}

            <div className="h-4 w-px bg-border mx-1" />

            {/* + Note Toggle */}
            <button
              type="button"
              onClick={() => setToolbarNoteOpen((v) => !v)}
              className={`flex items-center gap-1 rounded-xl px-2 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
                toolbarNoteOpen
                  ? "bg-primary/20 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>+ Note</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopySelection}
              className="flex items-center gap-1 rounded-xl px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {toolbarCopied ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>

            {/* Close Toolbar */}
            <button
              type="button"
              onClick={() => setSelectionBox(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Inline Note Expand Box */}
          {toolbarNoteOpen && (
            <div className="mt-2 border-t border-border pt-2 px-1">
              <textarea
                autoFocus
                rows={2}
                value={toolbarNoteText}
                onChange={(e) => setToolbarNoteText(e.target.value)}
                placeholder="Attach an interview note or analogy to this highlight..."
                className="w-full rounded-xl border border-border bg-muted/40 p-2 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Select a color dot above to save</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Existing Highlight Popover (On Click Existing Mark) */}
      {activeHighlight && activePopoverPos && (
        <div
          data-highlight-popover
          style={{ top: `${activePopoverPos.top}px`, left: `${activePopoverPos.left}px` }}
          className="absolute z-40 w-72 rounded-2xl border border-border bg-card p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-100 space-y-2.5"
        >
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold ${
                COLOR_METAS[activeHighlight.color].bg
              } ${COLOR_METAS[activeHighlight.color].text}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  COLOR_METAS[activeHighlight.color].dot
                }`}
              />
              {COLOR_METAS[activeHighlight.color].label}
            </span>

            <button
              type="button"
              onClick={() => {
                setActiveHighlightId(null);
                setActivePopoverPos(null);
              }}
              className="rounded-lg p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Switcher */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              Tag:
            </span>
            <div className="flex items-center gap-1">
              {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => updateHighlight(activeHighlight.id, { color: cKey })}
                  title={COLOR_METAS[cKey].label}
                  className={`h-5 w-5 rounded-full border transition-all ${
                    COLOR_METAS[cKey].dot
                  } ${
                    activeHighlight.color === cKey
                      ? "ring-2 ring-primary ring-offset-1 scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase text-muted-foreground">
              Annotation Note:
            </label>
            <textarea
              rows={2}
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              onBlur={() =>
                updateHighlight(activeHighlight.id, { note: editNoteText.trim() })
              }
              placeholder="Jot down why you highlighted this..."
              className="w-full rounded-xl border border-border bg-muted/40 p-2 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Popover Footer: Delete & Section context */}
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[170px]">
              {activeHighlight.sectionTitle}
            </span>
            <button
              type="button"
              onClick={() => {
                removeHighlight(activeHighlight.id);
                setActiveHighlightId(null);
                setActivePopoverPos(null);
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. In-Page Highlights Accordion / Strip */}
      {pageHighlights.length > 0 && (
        <div
          id="page-highlights-drawer"
          className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm scroll-mt-24"
        >
          <button
            type="button"
            onClick={() => setInPageDrawerOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                Highlights on this page
              </span>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                {pageHighlights.length}
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <span>{inPageDrawerOpen ? "Collapse" : "Show All"}</span>
              {inPageDrawerOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {inPageDrawerOpen && (
            <div className="mt-4 grid gap-3 pt-3 border-t border-border sm:grid-cols-2">
              {pageHighlights.map((hl) => {
                const meta = COLOR_METAS[hl.color];
                return (
                  <div
                    key={hl.id}
                    className="flex flex-col justify-between rounded-xl border border-border bg-muted/20 p-3 text-xs space-y-2 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[130px]">
                          {hl.sectionTitle}
                        </span>
                      </div>
                      <p className="line-clamp-3 text-foreground/90 italic font-serif">
                        &ldquo;{hl.text}&rdquo;
                      </p>
                      {hl.note && (
                        <div className="rounded-lg bg-card border border-border/80 p-2 font-mono text-[11px] text-foreground">
                          {hl.note}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => triggerSpotlight(hl.id)}
                        className="flex items-center gap-1 font-mono text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <span>Jump to text</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeHighlight(hl.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Remove highlight"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}