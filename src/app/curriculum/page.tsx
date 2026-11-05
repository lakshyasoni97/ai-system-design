"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  GitFork,
  List,
  Search,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Compass,
  Filter,
  Calculator,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import fundamentalsData from "@/data/fundamentals.json";
import flashcardsData from "@/data/flashcards.json";
import projectsData from "@/data/projects.json";
import { useProgress } from "@/components/ProgressProvider";
import RoadmapMindMap from "@/components/RoadmapMindMap";

export default function CurriculumPage() {
  const {
    completedSessions,
    isSessionCompleted,
    toggleSessionCompleted,
    isItemCompleted,
    toggleItemCompleted,
    getFlashcardRating,
  } = useProgress();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"LIST" | "MINDMAP">("LIST");
  const [activeModuleTab, setActiveModuleTab] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TODO" | "DONE">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Flatten all sessions with module metadata
  const allSessions = useMemo(
    () =>
      curriculumData.modules.flatMap((mod) =>
        mod.sessions.map((s) => ({
          ...s,
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleFocus: mod.focus,
        }))
      ),
    []
  );

  const completedFundTopicsCount = useMemo(() => {
    return fundamentalsData.topics.filter((t) => isItemCompleted(t.id) || isSessionCompleted(t.id)).length;
  }, [isItemCompleted, isSessionCompleted]);

  // The single recommended next action
  const nextUpSession = useMemo(() => {
    return allSessions.find((s) => !isSessionCompleted(s.id)) || allSessions[0];
  }, [allSessions, isSessionCompleted]);

  const completionPct = Math.round(
    (completedSessions.length / allSessions.length) * 100
  );

  const handleCopyPrompt = async (id: string, promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggleModuleCollapse = (modId: string) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Filter sessions according to selected module, status, and search query
  const filteredSessions = useMemo(() => {
    return allSessions.filter((s) => {
      if (activeModuleTab !== "ALL" && s.moduleId !== activeModuleTab) {
        return false;
      }
      const done = isSessionCompleted(s.id);
      if (statusFilter === "DONE" && !done) return false;
      if (statusFilter === "TODO" && done) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchTieIn = s.projectTieIn.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        if (!matchTitle && !matchTieIn && !matchId) return false;
      }
      return true;
    });
  }, [allSessions, activeModuleTab, statusFilter, searchQuery, isSessionCompleted]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Curriculum Roadmap
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary">
              {completedSessions.length}/{allSessions.length} Completed ({completionPct}%)
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            31 sessions across 5 modules, sequenced into a 10-week, 5-phase plan. See the Study Plan page for the week-by-week view.
          </p>
        </div>

        {/* View Toggle (List vs Mind Map) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Structured List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("MINDMAP")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "MINDMAP"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Interactive Graph</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-2xs">
        {/* Module Filter Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border/70 pb-2.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveModuleTab("ALL")}
            className={`rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              activeModuleTab === "ALL"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Modules (6)
          </button>
          <button
            type="button"
            onClick={() => setActiveModuleTab("mod-0")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
              activeModuleTab === "mod-0"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>M0</span>
            <span className="hidden md:inline">Fundamentals</span>
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                activeModuleTab === "mod-0"
                  ? "bg-white/20 text-white"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {completedFundTopicsCount}/{fundamentalsData.topics.length}
            </span>
          </button>
          {curriculumData.modules.map((mod, idx) => {
            const isSelected = activeModuleTab === mod.id;
            const completedCount = mod.sessions.filter((s) =>
              isSessionCompleted(s.id)
            ).length;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModuleTab(mod.id)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>M{idx + 1}</span>
                <span className="hidden md:inline">
                  {mod.title.split(":")[1] || mod.title}
                </span>
                <span
                  className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {completedCount}/{mod.sessions.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pt-0.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, architecture, or project..."
              className="w-full rounded-xl border border-border bg-secondary/50 pl-8 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <span className="text-xs text-muted-foreground mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-secondary font-semibold text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("TODO")}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                statusFilter === "TODO"
                  ? "bg-secondary font-semibold text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              To Do
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("DONE")}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                statusFilter === "DONE"
                  ? "bg-secondary font-semibold text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* 3. View Content: Mind Map or Grouped List */}
      {viewMode === "MINDMAP" ? (
        <RoadmapMindMap
          modules={curriculumData.modules}
          allSessions={allSessions}
          nextUpSession={nextUpSession}
          completedSessions={completedSessions}
          isSessionCompleted={isSessionCompleted}
          toggleSessionCompleted={toggleSessionCompleted}
          getFlashcardRating={getFlashcardRating}
          activeModuleTab={activeModuleTab}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
      ) : (
        <div className="space-y-4">
          {/* Module 0: Fundamentals (when ALL or mod-0 is selected) */}
          {(activeModuleTab === "ALL" || activeModuleTab === "mod-0") && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => toggleModuleCollapse("mod-0")}
                className="flex w-full items-center justify-between border-b border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  {collapsedModules["mod-0"] ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent">
                        Module 0
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">
                        Distributed Systems Fundamentals
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {fundamentalsData.focus}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-lg bg-secondary px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                  {completedFundTopicsCount}/{fundamentalsData.topics.length} Completed
                </span>
              </button>

              {!collapsedModules["mod-0"] && (
                <div className="divide-y divide-border/60">
                  {fundamentalsData.topics
                    .filter((t) => {
                      const done = isItemCompleted(t.id) || isSessionCompleted(t.id);
                      if (statusFilter === "DONE" && !done) return false;
                      if (statusFilter === "TODO" && done) return false;
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        if (
                          !t.title.toLowerCase().includes(q) &&
                          !t.aiTieIn.toLowerCase().includes(q) &&
                          !t.id.toLowerCase().includes(q)
                        )
                          return false;
                      }
                      return true;
                    })
                    .map((t) => {
                      const isCompleted = isItemCompleted(t.id) || isSessionCompleted(t.id);
                      return (
                        <div
                          key={t.id}
                          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="pt-0.5">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-accent">
                                  Topic {String(t.number).padStart(2, "0")}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  • Module 0
                                </span>
                              </div>

                              <Link
                                href={`/fundamentals/${t.id}`}
                                className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors"
                              >
                                {t.title}
                              </Link>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                                <span>AI tie-in: {t.aiTieIn}</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {t.readTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <Link
                              href={`/fundamentals/${t.id}`}
                              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors border border-border bg-card text-foreground hover:bg-muted"
                            >
                              <span>{isCompleted ? "Review" : "Study"}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {curriculumData.modules
            .filter(
              (mod) =>
                activeModuleTab === "ALL" || activeModuleTab === mod.id
            )
            .map((mod, modIdx) => {
              const sessionsInMod = filteredSessions.filter(
                (s) => s.moduleId === mod.id
              );
              if (sessionsInMod.length === 0) return null;

              const isCollapsed = collapsedModules[mod.id] || false;
              const completedCount = mod.sessions.filter((s) =>
                isSessionCompleted(s.id)
              ).length;

              return (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs"
                >
                  {/* Module Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleModuleCollapse(mod.id)}
                    className="flex w-full items-center justify-between border-b border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            Module {modIdx + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground truncate">
                            {mod.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {mod.focus}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-lg bg-secondary px-2 py-0.5 font-mono text-[11px] font-semibold text-muted-foreground">
                      {completedCount}/{mod.sessions.length} Completed
                    </span>
                  </button>

                  {/* Sessions List */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/60">
                      {sessionsInMod.map((session) => {
                        const isCompleted = isSessionCompleted(session.id);
                        const isNext = nextUpSession.id === session.id;

                        return (
                          <div
                            key={session.id}
                            className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                              isNext
                                ? "bg-primary/5"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="pt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                ) : isNext ? (
                                  <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                )}
                              </div>

                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-muted-foreground">
                                    Session {String(session.number).padStart(2, "0")}
                                  </span>
                                  {isNext && (
                                    <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary">
                                      Next Up
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground truncate">
                                    • {session.moduleTitle}
                                  </span>
                                </div>

                                <Link
                                  href={`/roadmap/${session.id}`}
                                  className="block text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors"
                                >
                                  {session.title}
                                </Link>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                                  <span>Anchor: {session.projectTieIn}</span>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.estimatedReadTime || "15 min"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyPrompt(session.id, session.studyPrompt)
                                }
                                className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Copy Socratic AI Study Prompt"
                              >
                                {copiedId === session.id ? (
                                  <Check className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <Link
                                href={`/roadmap/${session.id}`}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                                  isNext
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "border border-border bg-card text-foreground hover:bg-muted"
                                }`}
                              >
                                <span>{isCompleted ? "Review" : "Study"}</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {filteredSessions.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No sessions match your search or filter criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
