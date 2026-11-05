"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Clock,
  ArrowLeft,
  ArrowRight,
  Layers,
  StickyNote,
  Terminal,
  Briefcase,
  List,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";
import TradeoffTable from "./TradeoffTable";
import FlashcardPlayer, { FlashcardItem } from "./FlashcardPlayer";
import ReadingList from "./ReadingList";
import HighlightableArticle from "./HighlightableArticle";
import StudyScratchpad from "./StudyScratchpad";
import CodeBlock from "./CodeBlock";
import resourcesData from "@/data/resources.json";
import { useProgress } from "./ProgressProvider";
import {
  ActiveRecallProvider,
  ActiveRecallToolbar,
  ClozeCodePill,
  RecallBlockquote,
} from "./ActiveRecallContext";

interface SessionMeta {
  id: string;
  number: number;
  title: string;
  projectTieIn: string;
  estimatedReadTime?: string;
  studyPrompt: string;
  moduleId: string;
  moduleTitle: string;
}

interface SessionStudyClientProps {
  session: SessionMeta;
  markdownContent: string;
  sessionFlashcards: FlashcardItem[];
  prevSession: { id: string; number: number; title: string } | null;
  nextSession: { id: string; number: number; title: string } | null;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export default function SessionStudyClient({
  session,
  markdownContent,
  sessionFlashcards,
  prevSession,
  nextSession,
}: SessionStudyClientProps) {
  const {
    isSessionCompleted,
    toggleSessionCompleted,
    scratchpadNotes,
    getHighlightsForSource,
  } = useProgress();

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const completed = isSessionCompleted(session.id);
  const personalNote = scratchpadNotes[session.id] || "";
  const sessionHighlights = getHighlightsForSource(session.id);

  // Extract Table of Contents from markdown headings
  const tocItems = useMemo<TocItem[]>(() => {
    const lines = markdownContent.split("\n");
    const items: TocItem[] = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const text = h2Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        items.push({ id, title: text, level: 2 });
      } else if (h3Match) {
        const text = h3Match[1].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        items.push({ id, title: text, level: 3 });
      }
    });

    return items;
  }, [markdownContent]);

  // Track scroll position for active TOC section
  useEffect(() => {
    const handleScroll = () => {
      // Check which heading is currently in view
      const headings = document.querySelectorAll<HTMLElement>("article h2, article h3");
      let currentActive = "";
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActive = h.id;
        }
      });
      if (currentActive) {
        setActiveSectionId(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocItems]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(session.studyPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  const scrollToElement = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="relative space-y-8">
      {/* 1. Header Bar */}
      <div className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/curriculum"
              className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Session {String(session.number).padStart(2, "0")} of 31
            </Link>
            <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {session.estimatedReadTime || "15 min read"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary font-semibold">
              <Briefcase className="h-3.5 w-3.5" />
              {session.projectTieIn}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 font-mono text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-primary font-semibold">Prompt Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-muted-foreground" />
                  <span>Copy Socratic Prompt</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleSessionCompleted(session.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                completed
                  ? "border-primary/50 bg-primary/20 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {completed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 text-muted-foreground/60" />
                  <span>Mark as Completed</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {session.moduleTitle}
          </div>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl tracking-tight">
            {session.title}
          </h1>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Article + Sticky Right-Rail TOC) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Markdown Article (lg:col-span-9) */}
        <div className="lg:col-span-9 space-y-8 min-w-0">
          {/* Mobile In-Page TOC Accordion (< lg) */}
          {tocItems.length > 0 && (
            <div className="lg:hidden rounded-2xl border border-border bg-card p-3.5 shadow-2xs">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none font-mono text-xs font-semibold text-foreground">
                  <span className="flex items-center gap-2">
                    <List className="h-4 w-4 text-primary" />
                    <span>On This Page ({tocItems.length} sections)</span>
                  </span>
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">
                    ▾
                  </span>
                </summary>
                <div className="pt-3 mt-2 border-t border-border space-y-1.5 max-h-60 overflow-y-auto">
                  {tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToElement(item.id)}
                      className={`block w-full text-left truncate text-xs py-1 transition-colors ${
                        item.level === 3 ? "pl-3 text-muted-foreground" : "font-medium text-foreground"
                      } hover:text-primary`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          )}

          <ActiveRecallProvider>
            <div className="space-y-4">
              <ActiveRecallToolbar />
              <HighlightableArticle
                sourceType="session"
                sourceId={session.id}
                sourceTitle={`Session ${String(session.number).padStart(2, "0")}: ${session.title}`}
                href={`/roadmap/${session.id}`}
              >
                <article className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                    h1: ({ children }) => {
                      // Suppress redundant H1 since it repeats the header above
                      return null;
                    },
                    h2: ({ children }) => {
                      const text = String(children);
                      const id = text
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "-");
                      return (
                        <h2
                          id={id}
                          className="mt-8 sm:mt-10 mb-3 sm:mb-4 flex items-center gap-2 border-b border-border pb-2 sm:pb-2.5 text-lg sm:text-xl font-bold tracking-tight text-foreground scroll-mt-24"
                        >
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children }) => {
                      const text = String(children);
                      const id = text
                        .toLowerCase()
                        .replace(/[^\w\s-]/g, "")
                        .replace(/\s+/g, "-");
                      return (
                        <h3
                          id={id}
                          className="mt-6 sm:mt-7 mb-2 sm:mb-2.5 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
                        >
                          {children}
                        </h3>
                      );
                    },
                    p: ({ children }) => (
                      <p className="my-3.5 max-w-[75ch] text-base leading-7 sm:leading-relaxed text-foreground/95">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-3.5 max-w-[75ch] list-disc space-y-2 pl-5 sm:pl-6 text-base leading-7 sm:leading-relaxed text-foreground/95">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="my-3.5 max-w-[75ch] list-decimal space-y-2 pl-5 sm:pl-6 text-base leading-7 sm:leading-relaxed text-foreground/95">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">
                        {children}
                      </strong>
                    ),
                    blockquote: ({ children }) => (
                      <RecallBlockquote>{children}</RecallBlockquote>
                    ),
                    hr: () => <hr className="my-6 sm:my-8 border-border" />,
                    table: ({ children }) => <TradeoffTable>{children}</TradeoffTable>,
                    thead: ({ children }) => (
                      <thead className="border-b border-border bg-muted/60 font-mono text-xs uppercase tracking-wider text-foreground">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-border/80">{children}</tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="transition-colors hover:bg-muted/30">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold text-left text-xs sm:text-sm">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                        {children}
                      </td>
                    ),
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const lang = match?.[1] || "";
                      const rawCode = String(children).replace(/\n$/, "");

                      if (lang === "mermaid") {
                        return (
                          <MermaidDiagram
                            chart={rawCode}
                            title={`Session ${String(session.number).padStart(2, "0")} — Architecture`}
                          />
                        );
                      }

                      const isBlock = rawCode.includes("\n") || Boolean(lang);
                      if (isBlock) {
                        return (
                          <CodeBlock language={lang} rawCode={rawCode} />
                        );
                      }

                      return (
                        <ClozeCodePill rawText={rawCode} {...props}>
                          {children}
                        </ClozeCodePill>
                      );
                    },
                  }}
                >
                  {markdownContent}
                </ReactMarkdown>
              </article>
            </HighlightableArticle>
          </div>
        </ActiveRecallProvider>

          {/* Reading list */}
          <ReadingList
            items={
              (resourcesData.sessions as Record<string, { title: string; type: string; why: string; url?: string; href?: string }[]>)[
                session.id
              ] || []
            }
          />

          {/* 3. Personal Session Scratchpad */}
          <StudyScratchpad
            sourceId={session.id}
            sourceTitle={`Session ${String(session.number).padStart(2, "0")}: ${session.title}`}
            placeholder="Jot down personal metrics, interview analogies, or trade-offs to remember for this session..."
          />

          {/* 4. Check Your Understanding — Session Flashcards */}
          <div
            id="session-flashcards"
            className="rounded-3xl border border-border bg-card p-6 shadow-xs scroll-mt-24"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Check Your Understanding
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Active recall testing on the key architectural trade-offs of {session.title}
                  </p>
                </div>
              </div>
              <Link
                href="/flashcards"
                className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/20 transition-colors font-semibold"
              >
                All Flashcards →
              </Link>
            </div>

            <FlashcardPlayer cards={sessionFlashcards} compact />
          </div>

          {/* 5. Prev / Next Session Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            {prevSession ? (
              <Link
                href={`/roadmap/${prevSession.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">
                    Previous Session
                  </div>
                  <div className="font-semibold text-foreground">
                    S{String(prevSession.number).padStart(2, "0")}:{" "}
                    {prevSession.title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextSession && (
              <Link
                href={`/roadmap/${nextSession.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-right text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors shadow-2xs"
              >
                <div>
                  <div className="font-mono text-[10px] uppercase text-primary font-semibold">
                    Next Session
                  </div>
                  <div className="font-semibold text-foreground">
                    S{String(nextSession.number).padStart(2, "0")}:{" "}
                    {nextSession.title}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            )}
          </div>
        </div>

        {/* Sticky Right-Rail Table of Contents (lg:col-span-3) */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-4 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                <List className="h-3.5 w-3.5 text-primary" />
                On This Page
              </span>
            </div>

            {/* Headings Nav List */}
            <nav className="max-h-[calc(100vh-280px)] overflow-y-auto space-y-1 pr-1 text-xs">
              {tocItems.map((item) => {
                const isActive = activeSectionId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToElement(item.id)}
                    className={`block w-full text-left truncate transition-colors py-1 cursor-pointer ${
                      item.level === 3 ? "pl-3 text-[11px]" : "font-medium"
                    } ${
                      isActive
                        ? "text-primary font-semibold border-l-2 border-primary pl-2"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }`}
                  >
                    {item.title}
                  </button>
                );
              })}
            </nav>

            {/* Quick Jumps */}
            <div className="border-t border-border pt-3 space-y-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => scrollToElement("page-highlights-drawer")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>Highlights & Comments</span>
                  {sessionHighlights.length > 0 && (
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-500">
                      {sessionHighlights.length}
                    </span>
                  )}
                </span>
                <ChevronRight className="h-3 w-3 text-emerald-500" />
              </button>
              <button
                type="button"
                onClick={() => scrollToElement("session-scratchpad")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <span>Architect Notebook</span>
                  {personalNote.trim() && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </span>
                <ChevronRight className="h-3 w-3 text-amber-500" />
              </button>
              <button
                type="button"
                onClick={() => scrollToElement("session-flashcards")}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <span>Flashcards</span>
                <ChevronRight className="h-3 w-3 text-primary" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
