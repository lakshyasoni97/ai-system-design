"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  ShieldCheck,
  Calculator,
  GitFork,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  Search,
  Terminal,
  Menu,
  X,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight as BreadcrumbSeparator,
  ArrowRight,
  Command,
  Settings,
  Target,
  Library,
  ListChecks,
  Highlighter,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import projectsData from "@/data/projects.json";
import flashcardsData from "@/data/flashcards.json";
import { useProgress } from "./ProgressProvider";
import { useTheme } from "./ThemeProvider";

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const {
    completedSessions,
    isSessionCompleted,
    exportProgressJson,
    importProgressJson,
    highlights,
  } = useProgress();

  // Desktop sidebar collapse state
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [paletteQuery, setPaletteQuery] = useState<string>("");
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState<number>(0);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Active session context
  const activeSessionId = pathname.startsWith("/roadmap/")
    ? pathname.replace("/roadmap/", "")
    : null;

  const allSessions = useMemo(() => {
    return curriculumData.modules.flatMap((m) =>
      m.sessions.map((s) => ({ ...s, moduleId: m.id, moduleTitle: m.title }))
    );
  }, []);

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    return allSessions.find((s) => s.id === activeSessionId) || null;
  }, [activeSessionId, allSessions]);

  const activeModule = useMemo(() => {
    if (!activeSession) return null;
    return curriculumData.modules.find((m) => m.id === activeSession.moduleId) || null;
  }, [activeSession]);

  const completionPct = Math.round(
    (completedSessions.length / allSessions.length) * 100
  );

  // Keyboard shortcut listener for Cmd+K and Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        setPaletteQuery("");
      } else if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setCollapsed((prev) => !prev);
      } else if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setShowSyncModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Command palette search results
  const paletteResults = useMemo(() => {
    const q = paletteQuery.toLowerCase().trim();
    if (!q) {
      return [
        {
          id: "nav-roles",
          category: "Navigation",
          title: "Go to Target Roles",
          subtitle: "Role tracks, study weights & 8-week plan",
          onSelect: () => router.push("/roles"),
        },
        {
          id: "nav-fundamentals",
          category: "Navigation",
          title: "Go to Fundamentals (Module 0)",
          subtitle: "Distributed systems building blocks",
          onSelect: () => router.push("/fundamentals"),
        },
        {
          id: "nav-problems",
          category: "Navigation",
          title: "Go to Problem Bank",
          subtitle: "Standard AI system design problems",
          onSelect: () => router.push("/problems"),
        },
        {
          id: "nav-highlights",
          category: "Navigation",
          title: "Go to Context Highlights",
          subtitle: `${highlights.length} saved knowledge anchors & interview defenses`,
          onSelect: () => router.push("/highlights"),
        },
        {
          id: "nav-curriculum",
          category: "Navigation",
          title: "Go to Curriculum Roadmap",
          subtitle: "Explore all 20 sessions & interactive graph",
          onSelect: () => router.push("/curriculum"),
        },
        {
          id: "nav-flashcards",
          category: "Navigation",
          title: "Go to Flashcards",
          subtitle: "Practice spaced-repetition architecture cards",
          onSelect: () => router.push("/flashcards"),
        },
        {
          id: "nav-projects",
          category: "Navigation",
          title: "Go to Projects",
          subtitle: "100x scale resume architecture defense",
          onSelect: () => router.push("/projects"),
        },
        {
          id: "nav-simulator",
          category: "Navigation",
          title: "Launch Mock Interview Simulator",
          subtitle: "45-minute pacing timer & capacity calculator",
          onSelect: () => router.push("/simulator"),
        },
        {
          id: "action-theme",
          category: "Preferences",
          title: `Switch Theme to ${resolvedTheme === "dark" ? "Light" : "Dark"} Mode`,
          subtitle: "Toggle visual contrast",
          onSelect: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
        },
      ];
    }

    const results: Array<{
      id: string;
      category: string;
      title: string;
      subtitle: string;
      onSelect: () => void;
    }> = [];

    // Search sessions
    allSessions.forEach((s) => {
      if (
        s.title.toLowerCase().includes(q) ||
        s.projectTieIn.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.moduleTitle.toLowerCase().includes(q)
      ) {
        results.push({
          id: `session-${s.id}`,
          category: "Sessions",
          title: `Session ${String(s.number).padStart(2, "0")}: ${s.title}`,
          subtitle: `${s.moduleTitle} • ${s.projectTieIn}`,
          onSelect: () => router.push(`/roadmap/${s.id}`),
        });
      }
    });

    // Search Resume Projects
    projectsData.forEach((p) => {
      if (
        p.title.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        p.tag.toLowerCase().includes(q)
      ) {
        results.push({
          id: `project-${p.id}`,
          category: "Projects",
          title: `${p.company}: ${p.title}`,
          subtitle: p.elevatorPitch.slice(0, 75) + "...",
          onSelect: () => router.push(`/projects?tab=${p.id}`),
        });
      }
    });

    // Search Formulas
    curriculumData.quickRevisionMetrics.forEach((m) => {
      if (
        m.title.toLowerCase().includes(q) ||
        m.formula.toLowerCase().includes(q) ||
        m.detail.toLowerCase().includes(q)
      ) {
        results.push({
          id: `metric-${m.id}`,
          category: "Formulas",
          title: `${m.title}: ${m.formula}`,
          subtitle: m.detail,
          onSelect: () => router.push("/simulator"),
        });
      }
    });

    // Search Highlights
    highlights.forEach((h) => {
      if (
        h.text.toLowerCase().includes(q) ||
        (h.note && h.note.toLowerCase().includes(q)) ||
        h.sourceTitle.toLowerCase().includes(q) ||
        h.sectionTitle.toLowerCase().includes(q)
      ) {
        results.push({
          id: `hl-${h.id}`,
          category: "Highlights",
          title: h.text.length > 60 ? h.text.slice(0, 60) + "..." : h.text,
          subtitle: `${h.sourceTitle} • ${h.note || h.sectionTitle}`,
          onSelect: () => router.push(`${h.href}?highlight=${h.id}`),
        });
      }
    });

    // Search Flashcard topics
    flashcardsData.slice(0, 20).forEach((fc) => {
      if (
        fc.question.toLowerCase().includes(q) ||
        fc.answer.toLowerCase().includes(q)
      ) {
        results.push({
          id: `fc-${fc.id}`,
          category: "Flashcards",
          title: fc.question,
          subtitle: `${fc.module} • ${fc.projectTag}`,
          onSelect: () => router.push("/flashcards"),
        });
      }
    });

    return results.slice(0, 10);
  }, [paletteQuery, allSessions, router, setTheme, resolvedTheme]);

  useEffect(() => {
    setSelectedPaletteIndex(0);
  }, [paletteQuery]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedPaletteIndex((prev) =>
        prev < paletteResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedPaletteIndex((prev) =>
        prev > 0 ? prev - 1 : paletteResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = paletteResults[selectedPaletteIndex];
      if (target) {
        target.onSelect();
        setCommandPaletteOpen(false);
      }
    }
  };

  const handleDownloadJson = () => {
    const json = exportProgressJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lakshya-ai-study-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncStatus("Exported progress JSON file.");
  };

  const handleImportJson = () => {
    if (!importText.trim()) return;
    const ok = importProgressJson(importText);
    if (ok) {
      setSyncStatus("Progress restored successfully!");
      setImportText("");
      setTimeout(() => setShowSyncModal(false), 900);
    } else {
      setSyncStatus("Invalid JSON structure. Please check the payload.");
    }
  };

  // Clean Breadcrumbs Generator
  const breadcrumbs = useMemo(() => {
    if (pathname === "/") {
      return [{ label: "Home", href: "/" }];
    }
    if (pathname.startsWith("/curriculum")) {
      return [{ label: "Curriculum", href: "/curriculum" }];
    }
    if (pathname.startsWith("/roles")) {
      return [{ label: "Target Roles", href: "/roles" }];
    }
    if (pathname.startsWith("/fundamentals")) {
      return [{ label: "Fundamentals", href: "/fundamentals" }];
    }
    if (pathname.startsWith("/problems")) {
      return [{ label: "Problem Bank", href: "/problems" }];
    }
    if (pathname.startsWith("/highlights")) {
      return [{ label: "Highlights", href: "/highlights" }];
    }
    if (pathname.startsWith("/projects")) {
      return [{ label: "Projects", href: "/projects" }];
    }
    if (pathname.startsWith("/flashcards")) {
      return [{ label: "Flashcards", href: "/flashcards" }];
    }
    if (pathname.startsWith("/simulator")) {
      return [{ label: "Mock Interview", href: "/simulator" }];
    }
    if (pathname.startsWith("/roadmap/")) {
      const sessionId = pathname.replace("/roadmap/", "");
      const session = allSessions.find((s) => s.id === sessionId);
      if (session) {
        return [
          { label: "Curriculum", href: "/curriculum" },
          {
            label: `S${String(session.number).padStart(2, "0")}: ${session.title}`,
            href: `/roadmap/${session.id}`,
          },
        ];
      }
    }
    return [{ label: "Home", href: "/" }];
  }, [pathname, allSessions]);

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/roles",
      label: "Target Roles",
      icon: Target,
    },
    {
      href: "/fundamentals",
      label: "Fundamentals",
      icon: Library,
    },
    {
      href: "/curriculum",
      label: "Curriculum",
      icon: GitFork,
    },
    {
      href: "/problems",
      label: "Problem Bank",
      icon: ListChecks,
    },
    {
      href: "/highlights",
      label: "Highlights",
      icon: Highlighter,
      badge: highlights.length > 0 ? String(highlights.length) : undefined,
    },
    {
      href: "/flashcards",
      label: "Flashcards",
      icon: Layers,
    },
    {
      href: "/projects",
      label: "Projects",
      icon: ShieldCheck,
    },
    {
      href: "/simulator",
      label: "Mock Interview",
      icon: Calculator,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col bg-card text-card-foreground border-r border-border">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold tracking-tight text-foreground">
                AI.SYS.DESIGN
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Study & Interview Portal
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary Navigation */}
      <div className="p-3 border-b border-border">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Global Overall Readiness Meter (Single Source of Truth) */}
      <div className="px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-medium text-foreground">Readiness</span>
          <span className="font-mono text-[11px] font-semibold text-primary">
            {completedSessions.length} / {allSessions.length} ({completionPct}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      {/* Contextual Content: Active Module Sessions (if studying) OR Quick Access */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeModule ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current Module
              </span>
              <span className="font-mono text-[11px] font-semibold text-primary">
                {activeModule.sessions.filter((s) => isSessionCompleted(s.id)).length}/
                {activeModule.sessions.length}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card/60 p-2 space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-foreground truncate">
                {activeModule.title}
              </div>

              <div className="space-y-0.5 pt-1">
                {activeModule.sessions.map((s) => {
                  const sessionHref = `/roadmap/${s.id}`;
                  const active = pathname === sessionHref;
                  const done = isSessionCompleted(s.id);

                  return (
                    <Link
                      key={s.id}
                      href={sessionHref}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors ${
                        active
                          ? "bg-primary/15 text-primary font-semibold border border-primary/30"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-[10px] text-muted-foreground mr-1">
                          S{String(s.number).padStart(2, "0")}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <Link
              href="/curriculum"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>View all 5 modules</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-2 text-xs">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Curriculum Summary
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              20 sessions across Distributed Backends, RAG, Agents, NLP, and LLMOps.
            </p>
            <Link
              href="/curriculum"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <span>Explore Curriculum Roadmap</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Footer: Data Sync & Settings */}
      <div className="border-t border-border bg-muted/40 p-3">
        <button
          type="button"
          onClick={() => {
            setSyncStatus(null);
            setShowSyncModal(true);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>Export / Import Progress</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col transition-all duration-200 ${
          collapsed ? "lg:w-0 -translate-x-full overflow-hidden" : "lg:w-64 translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 flex w-64 flex-col border-r border-border bg-card shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area + Top Command Bar */}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          collapsed ? "lg:pl-0" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Open Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
              title={collapsed ? "Expand Sidebar (Cmd+B)" : "Collapse Sidebar for Focus (Cmd+B)"}
              aria-label="Toggle sidebar collapse"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4 text-primary" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            {/* Breadcrumb Navigation Trail */}
            <nav
              aria-label="Breadcrumbs"
              className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground truncate"
            >
              {breadcrumbs.map((bc, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={bc.href + idx}>
                    {idx > 0 && (
                      <BreadcrumbSeparator className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                    )}
                    {isLast ? (
                      <span className="font-semibold text-foreground truncate">
                        {bc.label}
                      </span>
                    ) : (
                      <Link
                        href={bc.href}
                        className="hover:text-foreground transition-colors truncate"
                      >
                        {bc.label}
                      </Link>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Command Palette Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setCommandPaletteOpen(true);
                setPaletteQuery("");
              }}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Search and command palette"
            >
              <Search className="h-3.5 w-3.5 text-primary" />
              <span className="hidden md:inline">Search sessions & topics...</span>
              <kbd className="hidden sm:inline rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
              title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle color theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Bar */}
            <div className="relative flex items-center border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-primary shrink-0" />
              <input
                autoFocus
                type="text"
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                onKeyDown={handlePaletteKeyDown}
                placeholder="Search sessions (HNSW, GKE), projects, formulas, or flashcards..."
                className="w-full bg-transparent px-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none"
              />
              <kbd className="hidden sm:inline rounded bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                Esc
              </kbd>
            </div>

            {/* Results List */}
            <div className="max-h-96 overflow-y-auto p-2">
              {paletteResults.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No matching sessions or formulas found. Try searching &ldquo;RAG&rdquo;, &ldquo;GKE&rdquo;, or &ldquo;Deloitte&rdquo;.
                </div>
              ) : (
                <div className="space-y-1">
                  {paletteResults.map((item, idx) => {
                    const isSelected = idx === selectedPaletteIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          item.onSelect();
                          setCommandPaletteOpen(false);
                        }}
                        onMouseEnter={() => setSelectedPaletteIndex(idx)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-medium text-foreground">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {item.subtitle}
                          </div>
                        </div>
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shrink-0">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export / Import Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                Progress Backup & Sync
              </h3>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your study completions, ratings, and scratchpad notes are saved in your browser&apos;s localStorage.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download Progress JSON</span>
              </button>

              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-medium text-foreground">
                  Restore from JSON:
                </label>
                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your exported progress JSON here..."
                  className="w-full rounded-xl border border-border bg-secondary/40 p-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  <span>Restore Progress</span>
                </button>
              </div>

              {syncStatus && (
                <div className="rounded-lg bg-secondary p-2 text-center font-mono text-xs text-primary">
                  {syncStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
