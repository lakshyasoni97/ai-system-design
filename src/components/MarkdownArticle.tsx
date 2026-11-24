"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowRight, BookOpen, ChevronRight, List } from "lucide-react";
import MermaidDiagram from "./MermaidDiagram";
import TradeoffTable from "./TradeoffTable";
import HighlightableArticle from "./HighlightableArticle";
import CodeBlock from "./CodeBlock";
import {
  ActiveRecallProvider,
  ActiveRecallToolbar,
  ClozeCodePill,
  RecallBlockquote,
} from "./ActiveRecallContext";
import {
  CoreStudyTabId,
  parseSectionBlocks,
  parseStudyArticle,
  slugifyHeading,
  STUDY_TABS,
  StudyTabId,
} from "@/lib/parseStudyArticle";
import {
  ExplainInLayersBlock,
  InterviewQAGroup,
  RapidFireBlock,
  SocraticLadderBlock,
  TimestampedTimelineBlock,
} from "./StudyMicroBlocks";

export interface TocQuickJump {
  id: string;
  label: string;
  badge?: string;
  dot?: boolean;
  tone?: "emerald" | "amber" | "primary";
}

interface MarkdownArticleProps {
  content: string;
  diagramTitle?: string;
  sourceType?: "session" | "fundamental";
  sourceId?: string;
  sourceTitle?: string;
  href?: string;
  showToc?: boolean;
  tocQuickJumps?: TocQuickJump[];
  footerContent?: React.ReactNode;
}

export default function MarkdownArticle({
  content,
  diagramTitle = "Diagram",
  sourceType = "fundamental",
  sourceId = "fund-01",
  sourceTitle = "Fundamentals Topic",
  href = "/fundamentals",
  showToc = true,
  tocQuickJumps = [],
  footerContent,
}: MarkdownArticleProps) {
  const parsed = useMemo(() => parseStudyArticle(content), [content]);

  const defaultTab: StudyTabId =
    parsed.availableTabs.length > 0 ? parsed.availableTabs[0] : "all";

  const [activeTab, setActiveTab] = useState<StudyTabId>(defaultTab);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);

  // Reset to first tab when navigating to a different article, respecting deep-links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("highlight")) {
        setActiveTab("all");
        return;
      }
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const targetSection = parsed.sections.find(
          (s) =>
            s.id === hash || s.subHeadings.some((sub) => sub.id === hash)
        );
        if (targetSection) {
          setActiveTab(targetSection.tab);
          setPendingScrollId(hash);
          return;
        }
      }
    }
    setActiveTab(defaultTab);
  }, [sourceId, defaultTab, parsed.sections]);

  // Smooth-scroll after tab switch if needed
  useEffect(() => {
    if (!pendingScrollId) return;
    const t = setTimeout(() => {
      const el = document.getElementById(pendingScrollId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setPendingScrollId(null);
    }, 80);
    return () => clearTimeout(t);
  }, [pendingScrollId, activeTab]);

  // Build flat TOC list with tab metadata
  const tocItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      level: 2 | 3;
      tab: CoreStudyTabId;
    }> = [];
    parsed.sections.forEach((sec) => {
      items.push({ id: sec.id, title: sec.title, level: 2, tab: sec.tab });
      sec.subHeadings.forEach((sub) => {
        items.push({ id: sub.id, title: sub.title, level: 3, tab: sec.tab });
      });
    });
    return items;
  }, [parsed.sections]);

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const headings = document.querySelectorAll<HTMLElement>(
        "article h2, article h3"
      );
      let currentActive = "";
      headings.forEach((h) => {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 150) {
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
  }, [activeTab, parsed.sections]);

  const scrollToElement = (id: string, tab?: CoreStudyTabId) => {
    if (tab && activeTab !== "all" && activeTab !== tab) {
      setActiveTab(tab);
      setPendingScrollId(id);
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const markdownComponents = useMemo<Components>(
    () => ({
      h1: () => null,
      h2: ({ children }) => (
        <h2
          id={slugifyHeading(String(children))}
          className="mt-8 mb-3 border-b border-border pb-2 text-lg sm:text-xl font-bold tracking-tight text-foreground scroll-mt-24"
        >
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3
          id={slugifyHeading(String(children))}
          className="mt-6 mb-2 text-base sm:text-[17px] font-semibold text-foreground scroll-mt-24"
        >
          {children}
        </h3>
      ),
      p: ({ children }) => (
        <p className="my-3.5 max-w-[65ch] text-[15.5px] leading-[1.75] text-foreground/95">
          {children}
        </p>
      ),
      ul: ({ children }) => (
        <ul className="my-3.5 max-w-[65ch] list-disc space-y-2 pl-5 sm:pl-6 text-[15.5px] leading-[1.75] text-foreground/95">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="my-3.5 max-w-[65ch] list-decimal space-y-2 pl-5 sm:pl-6 text-[15.5px] leading-[1.75] text-foreground/95">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
      ),
      blockquote: ({ children }) => <RecallBlockquote>{children}</RecallBlockquote>,
      hr: () => <hr className="my-6 border-border" />,
      pre: ({ children }) => <>{children}</>,
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
        <tr className="transition-colors hover:bg-muted/30">{children}</tr>
      ),
      th: ({ children }) => (
        <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold text-left text-xs sm:text-sm">
          {children}
        </th>
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
          return <MermaidDiagram chart={rawCode} title={diagramTitle} />;
        }
        const isBlock = rawCode.includes("\n") || Boolean(lang);
        if (isBlock) {
          return <CodeBlock language={lang} rawCode={rawCode} />;
        }
        return (
          <ClozeCodePill rawText={rawCode} {...props}>
            {children}
          </ClozeCodePill>
        );
      },
    }),
    [diagramTitle]
  );

  const renderMarkdown = useCallback(
    (md: string) => (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {md}
      </ReactMarkdown>
    ),
    [markdownComponents]
  );

  const visibleSections = useMemo(() => {
    if (activeTab === "all" || parsed.availableTabs.length === 0) {
      return parsed.sections;
    }
    return parsed.sections.filter((s) => s.tab === activeTab);
  }, [activeTab, parsed.sections, parsed.availableTabs.length]);

  const showIntro =
    Boolean(parsed.introMarkdown) &&
    (activeTab === "all" || activeTab === defaultTab);

  const currentTabIdx =
    activeTab === "all" ? -1 : parsed.availableTabs.indexOf(activeTab);
  const nextTabId =
    currentTabIdx >= 0 && currentTabIdx < parsed.availableTabs.length - 1
      ? parsed.availableTabs[currentTabIdx + 1]
      : null;
  const nextTabMeta = nextTabId
    ? STUDY_TABS.find((t) => t.id === nextTabId)
    : null;

  const activeTabMeta =
    activeTab === "all"
      ? null
      : STUDY_TABS.find((t) => t.id === activeTab) || null;

  const mainColumn = (
    <div className="space-y-5 min-w-0">
      {/* Mobile In-Page TOC Accordion (< lg) */}
      {showToc && tocItems.length > 0 && (
        <div className="lg:hidden rounded-2xl border border-border bg-card p-3.5 shadow-sm">
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
            <div className="pt-3 mt-2 border-t border-border space-y-1 max-h-60 overflow-y-auto">
              {tocItems.map((item) => (
                <button
                  key={`${item.id}-${item.level}`}
                  type="button"
                  onClick={() => scrollToElement(item.id, item.tab)}
                  className={`block w-full text-left truncate text-xs py-1 transition-colors ${
                    item.level === 3
                      ? "pl-3 text-muted-foreground"
                      : "font-medium text-foreground"
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
          {/* Focused Study Mode Tabs + Compact Recall Toggle */}
          {parsed.availableTabs.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3.5 py-2.5 shadow-sm">
              <div
                role="tablist"
                aria-label="Study sections"
                className="flex flex-wrap items-center gap-1"
              >
                {parsed.availableTabs.map((tabId) => {
                  const meta = STUDY_TABS.find((t) => t.id === tabId)!;
                  const count = parsed.sections.filter(
                    (s) => s.tab === tabId
                  ).length;
                  const isActive = activeTab === tabId;
                  return (
                    <button
                      key={tabId}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tabId)}
                      title={meta.description}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      <span>{meta.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isActive
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === "all"}
                  onClick={() => setActiveTab("all")}
                  title="Show all sections on one continuous page"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-card text-foreground border border-border font-semibold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Full View</span>
                </button>
              </div>

              <ActiveRecallToolbar compact />
            </div>
          )}

          {parsed.availableTabs.length <= 1 && (
            <div className="flex justify-end">
              <ActiveRecallToolbar compact />
            </div>
          )}

          {activeTabMeta && (
            <p className="px-1 font-mono text-[11px] text-muted-foreground">
              {activeTabMeta.description}
            </p>
          )}

          <HighlightableArticle
            sourceType={sourceType}
            sourceId={sourceId}
            sourceTitle={sourceTitle}
            href={href}
            refreshKey={activeTab}
          >
            <article className="space-y-5">
              {/* Welcome Summary Card */}
              {showIntro && (
                <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-7 shadow-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {renderMarkdown(parsed.introMarkdown)}
                </section>
              )}

              {/* Section Cards */}
              {visibleSections.length > 0 ? (
                visibleSections.map((section) => {
                  const blocks = parseSectionBlocks(section);
                  return (
                    <section
                      key={section.id}
                      className="rounded-2xl border border-border bg-card p-5 sm:p-7 md:p-8 shadow-sm"
                    >
                      <h2
                        id={section.id}
                        className="mb-4 border-b border-border pb-3 text-lg sm:text-xl font-bold tracking-tight text-foreground scroll-mt-24"
                      >
                        {section.title}
                      </h2>

                      <div className="space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {blocks.map((block, bIdx) => {
                          if (block.type === "socratic") {
                            return (
                              <SocraticLadderBlock
                                key={bIdx}
                                id={block.id}
                                heading={block.heading}
                                steps={block.steps}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          }
                          if (block.type === "layers") {
                            return (
                              <ExplainInLayersBlock
                                key={bIdx}
                                id={block.id}
                                heading={block.heading}
                                layers={block.layers}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          }
                          if (block.type === "timeline") {
                            return (
                              <TimestampedTimelineBlock
                                key={bIdx}
                                id={block.id}
                                heading={block.heading}
                                events={block.events}
                                takeawayMarkdown={block.takeawayMarkdown}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          }
                          if (block.type === "interview-qa-group") {
                            return (
                              <InterviewQAGroup
                                key={bIdx}
                                items={block.items}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          }
                          if (block.type === "rapid-fire") {
                            return (
                              <RapidFireBlock
                                key={bIdx}
                                id={block.id}
                                heading={block.heading}
                                items={block.items}
                                renderMarkdown={renderMarkdown}
                              />
                            );
                          }
                          return (
                            <div
                              key={bIdx}
                              className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            >
                              {renderMarkdown(block.markdown)}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              ) : (
                !showIntro && (
                  <section className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                    {renderMarkdown(content)}
                  </section>
                )
              )}

              {/* Guided Next-Tab Stepper */}
              {nextTabMeta && (
                <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/25 px-4 py-3">
                  <span className="text-xs text-muted-foreground">
                    Finished this section? Continue to{" "}
                    <strong className="text-foreground">
                      {nextTabMeta.label}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(nextTabMeta.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/35 bg-primary/10 px-3 py-1.5 font-mono text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  >
                    <span>Next: {nextTabMeta.shortLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </article>
          </HighlightableArticle>
        </div>
      </ActiveRecallProvider>

      {footerContent}
    </div>
  );

  if (!showToc) {
    return mainColumn;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-9 min-w-0">{mainColumn}</div>

      {/* Sticky Right-Rail Table of Contents */}
      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-20 rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
              <List className="h-3.5 w-3.5 text-primary" />
              On this page
            </span>
          </div>

          <nav className="max-h-[calc(100vh-300px)] overflow-y-auto space-y-1 pr-1 text-xs">
            {tocItems.map((item) => {
              const isActive = activeSectionId === item.id;
              const inCurrentTab =
                activeTab === "all" || activeTab === item.tab;
              return (
                <button
                  key={`${item.id}-${item.level}`}
                  type="button"
                  onClick={() => scrollToElement(item.id, item.tab)}
                  className={`block w-full text-left truncate transition-colors py-1 cursor-pointer ${
                    item.level === 3 ? "pl-3 text-[11px]" : "font-medium"
                  } ${
                    isActive
                      ? "text-primary font-semibold border-l-2 border-primary pl-2"
                      : inCurrentTab
                      ? "text-foreground/80 hover:text-foreground border-l-2 border-transparent"
                      : "text-muted-foreground/65 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </nav>

          {tocQuickJumps.length > 0 && (
            <div className="border-t border-border pt-3 space-y-1.5 font-mono text-[11px]">
              {tocQuickJumps.map((jump) => {
                const colorClass =
                  jump.tone === "emerald"
                    ? "text-emerald-500"
                    : jump.tone === "amber"
                    ? "text-amber-500"
                    : "text-primary";
                const badgeBg =
                  jump.tone === "emerald"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : jump.tone === "amber"
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-primary/15 text-primary";
                return (
                  <button
                    key={jump.id}
                    type="button"
                    onClick={() => scrollToElement(jump.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{jump.label}</span>
                      {jump.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${badgeBg}`}
                        >
                          {jump.badge}
                        </span>
                      )}
                      {jump.dot && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </span>
                    <ChevronRight className={`h-3 w-3 ${colorClass}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
