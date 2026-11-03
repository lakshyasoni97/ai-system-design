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
  MessageSquarePlus,
  Copy,
  Check,
  Trash2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  StickyNote,
  Sparkles,
  PanelRightOpen,
} from "lucide-react";
import {
  HighlightColor,
  useProgress,
} from "./ProgressProvider";
import StudyScratchpad from "./StudyScratchpad";

interface HighlightableArticleProps {
  sourceType: "session" | "fundamental";
  sourceId: string;
  sourceTitle: string;
  href: string;
  children: React.ReactNode;
}

export const COLOR_METAS: Record<
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
    scratchpadNotes,
    addHighlight,
    updateHighlight,
    removeHighlight,
    getHighlightsForSource,
  } = useProgress();

  const pageHighlights = getHighlightsForSource(sourceId);
  const pageCommentsCount = pageHighlights.filter((h) => Boolean(h.note?.trim())).length;
  const hasScratchpad = Boolean(scratchpadNotes[sourceId]?.trim());

  // Display mode for inline contextual comments right inside the article
  const [showInlineCallouts, setShowInlineCallouts] = useState(true);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Slide-over side drawer for reading + taking notes simultaneously
  const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
  const [sideDrawerTab, setSideDrawerTab] = useState<"comments" | "notebook">("comments");

  // Floating toolbar for new text selection
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
  const [toolbarSelectedColor, setToolbarSelectedColor] = useState<HighlightColor>("indigo");
  const [toolbarNoteText, setToolbarNoteText] = useState("");
  const [toolbarCopied, setToolbarCopied] = useState(false);

  // Popover for existing clicked highlight or inline comment
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activePopoverPos, setActivePopoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [isEditingPopoverNote, setIsEditingPopoverNote] = useState(false);
  const [popoverCopied, setPopoverCopied] = useState(false);
  const [popoverSavedToast, setPopoverSavedToast] = useState(false);

  // Bottom in-page highlights drawer state (defaults to open so notes aren't hidden!)
  const [inPageDrawerOpen, setInPageDrawerOpen] = useState(true);
  const [drawerFilter, setDrawerFilter] = useState<"all" | "comments">("all");
  const [inlineEditingCardId, setInlineEditingCardId] = useState<string | null>(null);
  const [inlineEditingCardText, setInlineEditingCardText] = useState("");

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

    return {
      id: headings[0]?.id || "top",
      title: headings[0]?.innerText?.trim() || sourceTitle,
    };
  };

  // Clamp horizontal popover coordinate inside container
  const computeClampedLeft = (rect: DOMRect, cRect: DOMRect, offsetLeft: number, widthPx: number) => {
    const rawLeft = rect.left - cRect.left + offsetLeft + rect.width / 2 - widthPx / 2;
    const maxLeft = Math.max(12, cRect.width - widthPx - 12);
    return Math.min(maxLeft, Math.max(12, rawLeft));
  };

  // Open the inspector popover for a specific highlight
  const openHighlightPopover = useCallback(
    (hlId: string, anchorEl: HTMLElement) => {
      const root = containerRef.current;
      if (!root) return;
      const hl = pageHighlights.find((h) => h.id === hlId);
      if (!hl) return;

      const rect = anchorEl.getBoundingClientRect();
      const cRect = root.getBoundingClientRect();
      setActiveHighlightId(hl.id);
      setEditNoteText(hl.note || "");
      setIsEditingPopoverNote(!hl.note?.trim());
      setActivePopoverPos({
        top: rect.bottom - cRect.top + root.offsetTop + 10,
        left: computeClampedLeft(rect, cRect, root.offsetLeft, 340),
      });
    },
    [pageHighlights]
  );

  // Listen for user text selections inside the article
  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current) {
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        return;
      }

      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        return;
      }

      // Ignore selections inside injected badges/callouts
      const startEl =
        range.startContainer.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as HTMLElement)
          : range.startContainer.parentElement;
      if (startEl?.closest("[data-no-highlight]")) {
        return;
      }

      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const heading = findPrecedingHeading(range.startContainer);

      let prefix = "";
      let suffix = "";
      try {
        const walker = document.createTreeWalker(containerRef.current, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
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

        let accumulated = "";
        let selStart = -1;
        let curr = walker.nextNode() as Text | null;
        while (curr) {
          if (curr === range.startContainer) {
            selStart = accumulated.length + range.startOffset;
          }
          accumulated += curr.nodeValue || "";
          curr = walker.nextNode() as Text | null;
        }

        if (selStart !== -1) {
          const rawText = selection.toString();
          const lead = rawText.indexOf(text);
          const start = selStart + (lead > 0 ? lead : 0);
          const end = start + text.length;
          prefix = accumulated.slice(Math.max(0, start - 40), start);
          suffix = accumulated.slice(end, Math.min(accumulated.length, end + 40));
        } else {
          const pre = range.cloneRange();
          pre.selectNodeContents(containerRef.current);
          pre.setEnd(range.startContainer, range.startOffset);
          prefix = pre.toString().slice(-40);

          const post = range.cloneRange();
          post.selectNodeContents(containerRef.current);
          post.setStart(range.endContainer, range.endOffset);
          suffix = post.toString().slice(0, 40);
        }
      } catch {
        const fullContent = containerRef.current.innerText || "";
        const textIndex = fullContent.indexOf(text);
        if (textIndex !== -1) {
          prefix = textIndex > 0 ? fullContent.slice(Math.max(0, textIndex - 35), textIndex) : "";
          suffix = fullContent.slice(
            textIndex + text.length,
            Math.min(fullContent.length, textIndex + text.length + 35)
          );
        }
      }

      const rawTop = rect.top - containerRect.top + containerRef.current.offsetTop - 56;
      const safeTop = rawTop < 10 ? rect.bottom - containerRect.top + containerRef.current.offsetTop + 10 : rawTop;

      setSelectionBox({
        text,
        prefix,
        suffix,
        sectionId: heading.id,
        sectionTitle: heading.title,
        top: safeTop,
        left: computeClampedLeft(rect, containerRect, containerRef.current.offsetLeft, 340),
      });
      setToolbarNoteOpen(false);
      setToolbarNoteText("");
      setActiveHighlightId(null);
      setActivePopoverPos(null);
    }, 15);
  };

  // Create a new highlight (and optional comment) from the selection toolbar
  const handleCreateHighlight = (color: HighlightColor, forceSaveNote = false) => {
    if (!selectionBox) return;

    // If the user has opened the comment input and clicks a color dot, just switch the selected color unless forceSaveNote is true
    if (toolbarNoteOpen && !forceSaveNote) {
      setToolbarSelectedColor(color);
      return;
    }

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

  // Re-apply DOM marks, inline comment badges, and inline comment callouts whenever highlights change
  const applyHighlightsToDom = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;

    // 1. Remove previously injected inline comment badges and callout cards first
    root
      .querySelectorAll("[data-highlight-badge], [data-highlight-inline-note]")
      .forEach((el) => el.remove());

    // 2. Unwrap existing mark wrappers safely
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

    // 3. Walk text nodes and apply highlights + inline comment affordances
    pageHighlights.forEach((hl) => {
      const targetText = hl.text.trim();
      if (!targetText) return;

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
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
        currentNode = walker.nextNode() as Text | null;
      }

      let matchIdx = -1;
      if (hl.prefix && fullArticleText.includes(hl.prefix + targetText)) {
        matchIdx = fullArticleText.indexOf(hl.prefix + targetText) + hl.prefix.length;
      } else if (hl.suffix && fullArticleText.includes(targetText + hl.suffix)) {
        matchIdx = fullArticleText.indexOf(targetText + hl.suffix);
      } else if (hl.prefix && fullArticleText.includes(hl.prefix)) {
        const prefixIdx = fullArticleText.indexOf(hl.prefix);
        const candidateIdx = fullArticleText.indexOf(targetText, prefixIdx);
        if (candidateIdx !== -1) {
          matchIdx = candidateIdx;
        }
      } else {
        matchIdx = fullArticleText.indexOf(targetText);
      }

      if (matchIdx === -1) return;

      const matchStart = matchIdx;
      const matchEnd = matchIdx + targetText.length;

      const affected = nodeOffsets.filter(
        (entry) => entry.end > matchStart && entry.start < matchEnd
      );

      let isFirstFragment = true;
      let lastCreatedMark: HTMLElement | null = null;

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
          const hasNote = Boolean(hl.note?.trim());
          mark.className = `text-highlight text-highlight-${hl.color}${
            hasNote ? " has-note" : ""
          }`;
          mark.setAttribute("data-highlight-id", hl.id);
          mark.setAttribute("data-color", hl.color);
          if (isFirstFragment) {
            mark.id = `highlight-${hl.id}`;
            isFirstFragment = false;
          }
          mark.title = hasNote
            ? `[${COLOR_METAS[hl.color].label}] ${hl.note}`
            : `[${COLOR_METAS[hl.color].label}] Click to add a comment or change tag`;

          mark.onclick = (e) => {
            e.stopPropagation();
            openHighlightPopover(hl.id, mark);
          };

          range.surroundContents(mark);
          lastCreatedMark = mark;
        } catch {
          // Continue gracefully if cross-element split fails
        }
      });

      // 4. If this highlight has a comment/note, inject an inline Comment Badge + optional Inline Callout Card
      if (lastCreatedMark && hl.note?.trim()) {
        const markEl = lastCreatedMark as HTMLElement;

        // 4a. Inline pill badge right after the mark
        const badge = document.createElement("span");
        badge.setAttribute("data-highlight-badge", hl.id);
        badge.setAttribute("data-no-highlight", "true");
        badge.className = `highlight-comment-badge highlight-comment-badge-${hl.color}`;
        badge.title = `Comment: ${hl.note}`;
        badge.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Note</span>`;
        badge.onclick = (e) => {
          e.stopPropagation();
          openHighlightPopover(hl.id, badge);
        };
        markEl.insertAdjacentElement("afterend", badge);

        // 4b. Contextual Inline Comment Callout right below the host paragraph/block
        if (showInlineCallouts) {
          const hostBlock = markEl.closest("p, li, blockquote, h2, h3") as HTMLElement | null;
          if (hostBlock && root.contains(hostBlock)) {
            const callout = document.createElement("div");
            callout.setAttribute("data-highlight-inline-note", hl.id);
            callout.setAttribute("data-no-highlight", "true");
            callout.className = `highlight-inline-callout highlight-inline-callout-${hl.color}`;
            callout.title = "Click to edit or manage this comment";

            const leftCol = document.createElement("div");
            leftCol.className = "space-y-1 min-w-0 flex-1";

            const headerRow = document.createElement("div");
            headerRow.className = "flex items-center gap-2";

            const tagSpan = document.createElement("span");
            tagSpan.className = "font-mono text-[10px] font-bold uppercase tracking-wider opacity-85";
            tagSpan.style.color = COLOR_METAS[hl.color].hex;
            tagSpan.textContent = `💬 ${COLOR_METAS[hl.color].label} Note`;

            headerRow.appendChild(tagSpan);

            const bodyText = document.createElement("div");
            bodyText.className = "text-xs sm:text-[13px] font-medium text-foreground/95 leading-relaxed break-words";
            bodyText.textContent = hl.note;

            leftCol.appendChild(headerRow);
            leftCol.appendChild(bodyText);

            const actionHint = document.createElement("span");
            actionHint.className =
              "shrink-0 rounded-lg border border-border/80 bg-card/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors";
            actionHint.textContent = "Edit";

            callout.appendChild(leftCol);
            callout.appendChild(actionHint);

            callout.onclick = (e) => {
              e.stopPropagation();
              openHighlightPopover(hl.id, callout);
            };

            hostBlock.insertAdjacentElement("afterend", callout);
          }
        }
      }
    });
  }, [pageHighlights, showInlineCallouts, openHighlightPopover]);

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

  const stepToHighlight = (direction: "prev" | "next") => {
    if (pageHighlights.length === 0) return;
    const nextIdx =
      direction === "next"
        ? (stepIndex + 1) % pageHighlights.length
        : (stepIndex - 1 + pageHighlights.length) % pageHighlights.length;
    setStepIndex(nextIdx);
    triggerSpotlight(pageHighlights[nextIdx].id);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const hlParam = urlParams.get("highlight");
    if (hlParam) {
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
        !target.closest("mark[data-highlight-id]") &&
        !target.closest("[data-highlight-badge]") &&
        !target.closest("[data-highlight-inline-note]")
      ) {
        setActiveHighlightId(null);
        setActivePopoverPos(null);
        if (!window.getSelection()?.toString().trim()) {
          setSelectionBox(null);
          setToolbarNoteOpen(false);
        }
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeHighlight = highlights.find((h) => h.id === activeHighlightId);

  const handleSavePopoverNote = () => {
    if (!activeHighlight) return;
    updateHighlight(activeHighlight.id, { note: editNoteText.trim() });
    setIsEditingPopoverNote(false);
    setPopoverSavedToast(true);
    setTimeout(() => setPopoverSavedToast(false), 1500);
  };

  const handleCopyPopoverNote = async () => {
    if (!activeHighlight) return;
    const textToCopy = activeHighlight.note
      ? `"${activeHighlight.text}"\n\nNote: ${activeHighlight.note}`
      : activeHighlight.text;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setPopoverCopied(true);
      setTimeout(() => setPopoverCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const filteredDrawerHighlights = pageHighlights.filter((hl) =>
    drawerFilter === "comments" ? Boolean(hl.note?.trim()) : true
  );

  return (
    <div className="relative space-y-4">
      {/* 0. Top-of-Article Annotations & Comments Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/90 px-4 py-2.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
            <Highlighter className="h-3.5 w-3.5 text-primary" />
            <span>Page Annotations</span>
          </span>

          {pageHighlights.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                {pageHighlights.length} {pageHighlights.length === 1 ? "highlight" : "highlights"}
              </span>
              {pageCommentsCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <MessageSquare className="h-3 w-3" />
                  {pageCommentsCount} {pageCommentsCount === 1 ? "comment" : "comments"}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              Select any text in the article below to highlight or attach an interview comment.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pageCommentsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowInlineCallouts((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-mono text-[11px] transition-all cursor-pointer ${
                showInlineCallouts
                  ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                  : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle inline comment cards directly beneath annotated paragraphs"
            >
              {showInlineCallouts ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span>Inline Notes</span>
            </button>
          )}

          {pageHighlights.length > 0 && (
            <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                onClick={() => stepToHighlight("prev")}
                className="rounded-lg p-1 text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer"
                title="Previous highlight on page"
                aria-label="Previous highlight on page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[10px] text-muted-foreground">
                Jump
              </span>
              <button
                type="button"
                onClick={() => stepToHighlight("next")}
                className="rounded-lg p-1 text-muted-foreground hover:bg-card hover:text-foreground transition-colors cursor-pointer"
                title="Next highlight on page"
                aria-label="Next highlight on page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setSideDrawerTab(pageHighlights.length > 0 ? "comments" : "notebook");
              setSideDrawerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1 font-mono text-[11px] font-semibold text-foreground hover:border-primary/40 hover:bg-muted/40 transition-all cursor-pointer"
          >
            <PanelRightOpen className="h-3.5 w-3.5 text-primary" />
            <span>Notes Drawer</span>
            {(pageHighlights.length > 0 || hasScratchpad) && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </div>

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
          className="absolute z-40 w-[336px] sm:w-[360px] flex flex-col rounded-2xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between gap-1">
            {/* 4 Semantic Color Choices with labels */}
            <div className="flex items-center gap-1">
              {(Object.keys(COLOR_METAS) as HighlightColor[]).map((colorKey) => {
                const meta = COLOR_METAS[colorKey];
                const isSelected = toolbarNoteOpen && toolbarSelectedColor === colorKey;
                return (
                  <button
                    key={colorKey}
                    type="button"
                    onClick={() => handleCreateHighlight(colorKey, false)}
                    title={
                      toolbarNoteOpen
                        ? `Tag comment as ${meta.label}`
                        : `Highlight as ${meta.label}`
                    }
                    className={`group flex items-center gap-1 rounded-xl border px-2 py-1 font-mono text-[10px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${meta.bg} ${meta.border} ${meta.text} ring-1 ring-primary`
                        : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.dot}`} />
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-0.5">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopySelection}
                title="Copy selected text"
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {toolbarCopied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Close Toolbar */}
              <button
                type="button"
                onClick={() => {
                  setSelectionBox(null);
                  setToolbarNoteOpen(false);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close highlight toolbar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Toggle to attach a comment */}
          {!toolbarNoteOpen ? (
            <div className="mt-2 flex items-center justify-between border-t border-border/70 pt-2 px-0.5">
              <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                Click a tag above for 1-click highlight
              </span>
              <button
                type="button"
                onClick={() => setToolbarNoteOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="h-3 w-3" />
                <span>+ Add Comment</span>
              </button>
            </div>
          ) : (
            /* Expanded Comment Composer */
            <div className="mt-2.5 border-t border-border pt-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-mono text-[10px] text-muted-foreground mr-0.5">
                  Prompt:
                </span>
                {QUICK_COMMENT_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() =>
                      setToolbarNoteText((prev) =>
                        prev.trim() ? `${prev} ${qp.prefix}` : qp.prefix
                      )
                    }
                    className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                  >
                    + {qp.label}
                  </button>
                ))}
              </div>

              <textarea
                autoFocus
                rows={3}
                value={toolbarNoteText}
                onChange={(e) => setToolbarNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleCreateHighlight(toolbarSelectedColor, true);
                  }
                }}
                placeholder="Write your architect comment, interview defense, or analogy..."
                className="w-full rounded-xl border border-border bg-muted/30 p-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  ⌘+Enter to save
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setToolbarNoteOpen(false)}
                    className="rounded-lg px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateHighlight(toolbarSelectedColor, true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1 font-mono text-[11px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
                  >
                    <Check className="h-3 w-3" />
                    <span>Save Comment</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Existing Highlight & Comment Inspector Popover */}
      {activeHighlight && activePopoverPos && (
        <div
          data-highlight-popover
          style={{ top: `${activePopoverPos.top}px`, left: `${activePopoverPos.left}px` }}
          className="absolute z-40 w-[336px] sm:w-[360px] rounded-2xl border border-border bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-100 space-y-3"
        >
          {/* Header: Semantic Badge + Section + Close */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[11px] font-semibold shrink-0 ${
                  COLOR_METAS[activeHighlight.color].bg
                } ${COLOR_METAS[activeHighlight.color].border} ${
                  COLOR_METAS[activeHighlight.color].text
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    COLOR_METAS[activeHighlight.color].dot
                  }`}
                />
                {COLOR_METAS[activeHighlight.color].label}
              </span>
              {popoverSavedToast && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-500">
                  <Check className="h-3 w-3" />
                  Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyPopoverNote}
                title="Copy quote & comment"
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                {popoverCopied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveHighlightId(null);
                  setActivePopoverPos(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Close annotation popover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quoted Excerpt Preview */}
          <blockquote
            className="line-clamp-2 rounded-xl bg-muted/40 pl-3 pr-2.5 py-1.5 text-xs italic text-muted-foreground border-l-3"
            style={{ borderLeftColor: COLOR_METAS[activeHighlight.color].hex }}
          >
            &ldquo;{activeHighlight.text}&rdquo;
          </blockquote>

          {/* Comment Display vs Editor */}
          {!isEditingPopoverNote && activeHighlight.note?.trim() ? (
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                  <MessageSquare className="h-3 w-3" />
                  Architect Comment
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditNoteText(activeHighlight.note || "");
                    setIsEditingPopoverNote(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <Edit3 className="h-2.5 w-2.5" />
                  Edit
                </button>
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
                {activeHighlight.note}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeHighlight.note?.trim() ? "Edit Comment:" : "Attach Architect Comment:"}
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {QUICK_COMMENT_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() =>
                      setEditNoteText((prev) =>
                        prev.trim() ? `${prev} ${qp.prefix}` : qp.prefix
                      )
                    }
                    className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                  >
                    + {qp.label}
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                rows={3}
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleSavePopoverNote();
                  }
                }}
                placeholder="Why did you highlight this? Add an interview defense or metric..."
                className="w-full rounded-xl border border-border bg-muted/30 p-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">
                  ⌘+Enter to save
                </span>
                <div className="flex items-center gap-1.5">
                  {activeHighlight.note?.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditNoteText(activeHighlight.note || "");
                        setIsEditingPopoverNote(false);
                      }}
                      className="rounded-lg px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSavePopoverNote}
                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-1 font-mono text-[11px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Check className="h-3 w-3" />
                    <span>Save Comment</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer: Tag Switcher & Delete */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground mr-0.5">
                Tag:
              </span>
              {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => updateHighlight(activeHighlight.id, { color: cKey })}
                  title={COLOR_METAS[cKey].label}
                  className={`h-4 w-4 rounded-full transition-all cursor-pointer ${
                    COLOR_METAS[cKey].dot
                  } ${
                    activeHighlight.color === cKey
                      ? "ring-2 ring-primary ring-offset-1 scale-110"
                      : "opacity-45 hover:opacity-100"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                removeHighlight(activeHighlight.id);
                setActiveHighlightId(null);
                setActivePopoverPos(null);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[10px] font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Bottom In-Page Highlights & Comments Panel */}
      {pageHighlights.length > 0 && (
        <div
          id="page-highlights-drawer"
          className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs scroll-mt-24"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setInPageDrawerOpen((v) => !v)}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    Page Highlights & Architect Comments
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                    {pageHighlights.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click any card to spotlight its exact sentence in the article or edit your comment inline
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              {inPageDrawerOpen && pageCommentsCount > 0 && (
                <div className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-0.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDrawerFilter("all")}
                    className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      drawerFilter === "all"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All ({pageHighlights.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerFilter("comments")}
                    className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      drawerFilter === "comments"
                        ? "bg-card text-foreground font-semibold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    With Comments ({pageCommentsCount})
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setInPageDrawerOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <span>{inPageDrawerOpen ? "Collapse" : "Expand"}</span>
                {inPageDrawerOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {inPageDrawerOpen && (
            <div className="mt-5 grid gap-4 pt-4 border-t border-border sm:grid-cols-2">
              {filteredDrawerHighlights.map((hl) => {
                const meta = COLOR_METAS[hl.color];
                const isEditingCard = inlineEditingCardId === hl.id;

                return (
                  <div
                    key={hl.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 text-xs space-y-3 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <div className="space-y-2.5">
                      {/* Header badge + section */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[160px]">
                          {hl.sectionTitle}
                        </span>
                      </div>

                      {/* Quoted anchor text */}
                      <blockquote
                        className="line-clamp-3 rounded-xl bg-muted/35 pl-3 pr-2.5 py-2 text-xs text-foreground/85 italic font-serif leading-relaxed border-l-3"
                        style={{ borderLeftColor: meta.hex }}
                      >
                        &ldquo;{hl.text}&rdquo;
                      </blockquote>

                      {/* Architect Comment (Hero Callout or Inline Editor) */}
                      {isEditingCard ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            autoFocus
                            rows={2}
                            value={inlineEditingCardText}
                            onChange={(e) => setInlineEditingCardText(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                updateHighlight(hl.id, {
                                  note: inlineEditingCardText.trim(),
                                });
                                setInlineEditingCardId(null);
                              }
                            }}
                            placeholder="Write your architect comment or defense note..."
                            className="w-full rounded-xl border border-border bg-muted/30 p-2.5 font-mono text-xs text-foreground focus:border-primary focus:bg-card focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInlineEditingCardId(null)}
                              className="rounded-lg px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateHighlight(hl.id, {
                                  note: inlineEditingCardText.trim(),
                                });
                                setInlineEditingCardId(null);
                              }}
                              className="rounded-lg bg-primary px-2.5 py-1 font-mono text-[11px] font-semibold text-primary-foreground hover:opacity-90 cursor-pointer"
                            >
                              Save Comment
                            </button>
                          </div>
                        </div>
                      ) : hl.note?.trim() ? (
                        <div
                          onClick={() => {
                            setInlineEditingCardId(hl.id);
                            setInlineEditingCardText(hl.note || "");
                          }}
                          title="Click to edit comment"
                          className="group/note rounded-xl border border-border bg-secondary/35 p-3 space-y-1 cursor-pointer hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                              <MessageSquare className="h-2.5 w-2.5" />
                              Architect Comment
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground opacity-0 group-hover/note:opacity-100 transition-opacity">
                              Edit
                            </span>
                          </div>
                          <p className="text-xs sm:text-[13px] font-medium text-foreground leading-relaxed">
                            {hl.note}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setInlineEditingCardId(hl.id);
                            setInlineEditingCardText("");
                          }}
                          className="flex w-full items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 font-mono text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                        >
                          <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
                          <span>+ Add comment or interview takeaway...</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => triggerSpotlight(hl.id)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <span>Spotlight in article</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {(Object.keys(COLOR_METAS) as HighlightColor[]).map((cKey) => (
                          <button
                            key={cKey}
                            type="button"
                            onClick={() => updateHighlight(hl.id, { color: cKey })}
                            title={`Switch tag to ${COLOR_METAS[cKey].label}`}
                            className={`h-3 w-3 rounded-full transition-all cursor-pointer ${
                              COLOR_METAS[cKey].dot
                            } ${
                              hl.color === cKey
                                ? "ring-2 ring-primary ring-offset-1"
                                : "opacity-35 hover:opacity-100"
                            }`}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => removeHighlight(hl.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Delete highlight"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Floating Quick-Access Button (Bottom-Right) for Side-by-Side Notes & Comments */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          type="button"
          onClick={() => setSideDrawerOpen(true)}
          className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-card/95 backdrop-blur-md px-4 py-2.5 font-mono text-xs font-semibold text-foreground shadow-xl hover:border-primary hover:scale-[1.02] transition-all cursor-pointer"
          title="Open Page Comments & Personal Notebook Drawer"
        >
          <StickyNote className="h-4 w-4 text-amber-500" />
          <span>Notes & Comments</span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
            {pageHighlights.length + (hasScratchpad ? 1 : 0)}
          </span>
        </button>
      </div>

      {/* 5. Slide-Over Side Drawer for Reading + Taking Notes Simultaneously */}
      {sideDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-xs"
            onClick={() => setSideDrawerOpen(false)}
          />
          <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Study Companion Drawer
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground truncate max-w-[340px]">
                  {sourceTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSideDrawerOpen(false)}
                className="rounded-xl border border-border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Close notes drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-2.5">
              <button
                type="button"
                onClick={() => setSideDrawerTab("comments")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  sideDrawerTab === "comments"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>In-Text Comments ({pageHighlights.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSideDrawerTab("notebook")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                  sideDrawerTab === "notebook"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <StickyNote className="h-3.5 w-3.5" />
                <span>Architect Notebook</span>
                {hasScratchpad && (
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                )}
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {sideDrawerTab === "notebook" ? (
                <StudyScratchpad
                  sourceId={sourceId}
                  sourceTitle={sourceTitle}
                  compact
                />
              ) : pageHighlights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
                  <Highlighter className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-sm font-semibold text-foreground">
                    No highlights or comments on this page yet
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Close this drawer and select any sentence in the article to highlight it or attach an interview defense comment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageHighlights.map((hl) => {
                    const meta = COLOR_METAS[hl.color];
                    return (
                      <div
                        key={hl.id}
                        className="rounded-2xl border border-border bg-muted/15 p-4 space-y-2.5 hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${meta.bg} ${meta.border} ${meta.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {hl.sectionTitle}
                          </span>
                        </div>

                        <blockquote
                          className="rounded-xl bg-muted/40 pl-3 pr-2.5 py-2 text-xs italic text-foreground/85 font-serif border-l-3"
                          style={{ borderLeftColor: meta.hex }}
                        >
                          &ldquo;{hl.text}&rdquo;
                        </blockquote>

                        <div className="space-y-1">
                          <label className="font-mono text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Architect Comment
                          </label>
                          <textarea
                            rows={2}
                            defaultValue={hl.note || ""}
                            onBlur={(e) =>
                              updateHighlight(hl.id, { note: e.target.value.trim() })
                            }
                            placeholder="Click to add a personal comment or interview defense..."
                            className="w-full rounded-xl border border-border bg-card p-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSideDrawerOpen(false);
                              setTimeout(() => triggerSpotlight(hl.id), 150);
                            }}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <span>Jump to sentence</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeHighlight(hl.id)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete highlight"
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
          </div>
        </div>
      )}
    </div>
  );
}
