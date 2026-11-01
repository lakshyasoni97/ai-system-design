"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  ShieldCheck,
  Compass,
  Flame,
  X,
  Target,
  ExternalLink,
} from "lucide-react";
import flashcardsData from "@/data/flashcards.json";
import projectsData from "@/data/projects.json";

export interface MindMapSession {
  id: string;
  number: number;
  title: string;
  projectTieIn: string;
  estimatedReadTime?: string;
  studyPrompt: string;
  moduleId: string;
  moduleTitle: string;
  moduleFocus: string;
}

export interface MindMapModule {
  id: string;
  title: string;
  focus: string;
  sessions: {
    id: string;
    number: number;
    title: string;
    projectTieIn: string;
    estimatedReadTime?: string;
    studyPrompt: string;
  }[];
}

interface RoadmapMindMapProps {
  modules: MindMapModule[];
  allSessions: MindMapSession[];
  nextUpSession: MindMapSession;
  completedSessions: string[];
  isSessionCompleted: (sessionId: string) => boolean;
  toggleSessionCompleted: (sessionId: string) => void;
  getFlashcardRating: (cardId: string) => string;
  activeModuleTab: string;
  statusFilter: "ALL" | "TODO" | "DONE";
  searchQuery: string;
}

// Module styling & layout metadata (Radial around center: 1100, 680)
const MODULE_CONFIG: Record<
  string,
  {
    code: string;
    label: string;
    color: string;
    border: string;
    bg: string;
    badgeBg: string;
    badgeText: string;
    pos: { x: number; y: number };
    leafOffsets: { x: number; y: number }[];
  }
> = {
  "mod-1": {
    code: "M1",
    label: "Classical Backend & GCP",
    color: "#059669", // emerald
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/10",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
    pos: { x: 580, y: 340 },
    leafOffsets: [
      { x: -300, y: -160 },
      { x: -300, y: -50 },
      { x: -300, y: 60 },
      { x: -300, y: 170 },
    ],
  },
  "mod-2": {
    code: "M2",
    label: "Enterprise RAG & Search",
    color: "#4f46e5", // indigo
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/10",
    badgeBg: "bg-indigo-500/20",
    badgeText: "text-indigo-400",
    pos: { x: 1620, y: 340 },
    leafOffsets: [
      { x: 300, y: -160 },
      { x: 300, y: -50 },
      { x: 300, y: 60 },
      { x: 300, y: 170 },
    ],
  },
  "mod-3": {
    code: "M3",
    label: "Multi-Agent & State",
    color: "#8b5cf6", // violet
    border: "border-violet-500/40",
    bg: "bg-violet-500/10",
    badgeBg: "bg-violet-500/20",
    badgeText: "text-violet-400",
    pos: { x: 1720, y: 880 },
    leafOffsets: [
      { x: 300, y: -140 },
      { x: 300, y: -40 },
      { x: 300, y: 60 },
      { x: 300, y: 160 },
    ],
  },
  "mod-4": {
    code: "M4",
    label: "High-Throughput & Serving",
    color: "#d97706", // amber
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
    pos: { x: 1100, y: 1120 },
    leafOffsets: [
      { x: -320, y: 140 },
      { x: -110, y: 160 },
      { x: 110, y: 160 },
      { x: 320, y: 140 },
    ],
  },
  "mod-5": {
    code: "M5",
    label: "LLMOps, Evals & Mocks",
    color: "#e11d48", // rose
    border: "border-rose-500/40",
    bg: "bg-rose-500/10",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-400",
    pos: { x: 480, y: 880 },
    leafOffsets: [
      { x: -300, y: -140 },
      { x: -300, y: -40 },
      { x: -300, y: 60 },
      { x: -300, y: 160 },
    ],
  },
};

const CENTER_NODE = { x: 1100, y: 640 };

export default function RoadmapMindMap({
  modules,
  allSessions,
  nextUpSession,
  completedSessions,
  isSessionCompleted,
  toggleSessionCompleted,
  getFlashcardRating,
  activeModuleTab,
  statusFilter,
  searchQuery,
}: RoadmapMindMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected Node for the Inspector Drawer (default to nextUpSession)
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    nextUpSession?.id || "session-01"
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Pan and Zoom Canvas State
  const [zoom, setZoom] = useState<number>(0.72);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: -140, y: -80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Derive selected session details
  const selectedSession = useMemo(() => {
    return (
      allSessions.find((s) => s.id === selectedSessionId) ||
      allSessions[0] ||
      nextUpSession
    );
  }, [allSessions, selectedSessionId, nextUpSession]);

  // Flashcards mastery linked to selected session
  const selectedSessionFlashcards = useMemo(() => {
    if (!selectedSession) return { total: 0, easy: 0, medium: 0, hard: 0, unseen: 0 };
    const cards = flashcardsData.filter((c) => c.sessionId === selectedSession.id);
    let easy = 0,
      medium = 0,
      hard = 0,
      unseen = 0;
    cards.forEach((c) => {
      const r = getFlashcardRating(c.id);
      if (r === "easy") easy++;
      else if (r === "medium") medium++;
      else if (r === "hard") hard++;
      else unseen++;
    });
    return { total: cards.length, easy, medium, hard, unseen };
  }, [selectedSession, getFlashcardRating]);

  // Match test for filtering / search / project highlight
  const isSessionHighlighted = (session: MindMapSession) => {
    if (activeModuleTab !== "ALL" && session.moduleId !== activeModuleTab) {
      return false;
    }
    const isDone = isSessionCompleted(session.id);
    if (statusFilter === "DONE" && !isDone) return false;
    if (statusFilter === "TODO" && isDone) return false;

    if (selectedProjectId) {
      const proj = projectsData.find((p) => p.id === selectedProjectId);
      if (proj) {
        const pTag = proj.company.toLowerCase();
        const sTie = session.projectTieIn.toLowerCase();
        if (!sTie.includes(pTag) && !sTie.includes(proj.tag.toLowerCase())) {
          return false;
        }
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        session.title.toLowerCase().includes(q) ||
        session.projectTieIn.toLowerCase().includes(q) ||
        session.id.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  };

  // Center on next up session or reset view
  const centerOnNextUp = () => {
    if (!nextUpSession) return;
    const modConfig = MODULE_CONFIG[nextUpSession.moduleId];
    if (modConfig) {
      // Find session index in module
      const mod = modules.find((m) => m.id === nextUpSession.moduleId);
      const sIdx = mod?.sessions.findIndex((s) => s.id === nextUpSession.id) ?? 0;
      const offset = modConfig.leafOffsets[sIdx] || { x: 0, y: 0 };
      const targetX = modConfig.pos.x + offset.x;
      const targetY = modConfig.pos.y + offset.y;

      setSelectedSessionId(nextUpSession.id);
      setIsInspectorOpen(true);

      // Center container on this node
      setZoom(0.85);
      setPan({
        x: 450 - targetX * 0.85,
        y: 350 - targetY * 0.85,
      });
    }
  };

  const resetView = () => {
    setZoom(0.72);
    setPan({ x: -140, y: -80 });
  };

  const handleCopyPrompt = async (id: string, promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPromptId(id);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Mouse pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag when clicking canvas background or SVG
    if ((e.target as HTMLElement).closest(".prevent-canvas-pan")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest(".prevent-canvas-pan")) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(1.8, Math.max(0.45, +(prev * zoomFactor).toFixed(2))));
  };

  // Overall Completion stats
  const completionPct = Math.round(
    (completedSessions.length / (allSessions.length || 1)) * 100
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all select-none ${
        isFullscreen ? "fixed inset-2 z-50 rounded-2xl flex flex-col" : "h-[680px] sm:h-[720px]"
      }`}
    >
      {/* 1. TOP CONTROL BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Project Highlighting Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto rounded-2xl border border-border/80 bg-background/90 p-1.5 backdrop-blur-md shadow-xs">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 font-mono text-[11px] font-semibold text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Resume Defense:
          </span>
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className={`rounded-xl px-2.5 py-1 font-mono text-xs font-semibold transition-all cursor-pointer ${
              selectedProjectId === null
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            All Projects
          </button>
          {projectsData.map((p) => {
            const isSel = selectedProjectId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProjectId(isSel ? null : p.id)}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  isSel
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title={p.title}
              >
                <span>{p.company}</span>
                <span className="hidden md:inline text-[10px] opacity-80">
                  ({p.tag.replace("Deloitte ", "").replace("Network18 ", "")})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Canvas Zoom & Viewport Tools */}
        <div className="flex items-center gap-1.5 pointer-events-auto rounded-2xl border border-border/80 bg-background/90 p-1.5 backdrop-blur-md shadow-xs">
          <button
            type="button"
            onClick={centerOnNextUp}
            className="flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            title="Center on Recommended Next Step"
          >
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Focus Next Up</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.45, +(z - 0.12).toFixed(2)))}
            className="rounded-xl border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-mono text-[11px] text-muted-foreground px-1 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.12).toFixed(2)))}
            className="rounded-xl border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-xl border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="rounded-xl border border-border p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mind Map"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. THE PAN/ZOOM CANVAS */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`relative w-full h-full overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)) 1.2px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 140ms ease-out",
            width: "2200px",
            height: "1360px",
          }}
        >
          {/* SVG CONNECTOR LINES */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width="2200"
            height="1360"
            viewBox="0 0 2200 1360"
          >
            <defs>
              <linearGradient id="hubToM1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="hubToM2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="hubToM3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="hubToM4" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="hubToM5" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Hub to 5 Modules Beziers */}
            {modules.map((mod) => {
              const cfg = MODULE_CONFIG[mod.id];
              if (!cfg) return null;
              const completedCount = mod.sessions.filter((s) => isSessionCompleted(s.id)).length;
              const isModCompleted = completedCount === mod.sessions.length;

              const cX1 = CENTER_NODE.x + (cfg.pos.x - CENTER_NODE.x) * 0.45;
              const cY1 = CENTER_NODE.y;
              const cX2 = cfg.pos.x - (cfg.pos.x - CENTER_NODE.x) * 0.2;
              const cY2 = cfg.pos.y;

              return (
                <g key={`hub-${mod.id}`}>
                  <path
                    d={`M ${CENTER_NODE.x} ${CENTER_NODE.y} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${cfg.pos.x} ${cfg.pos.y}`}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth={isModCompleted ? 4 : 2.5}
                    strokeDasharray={isModCompleted ? "none" : "6,6"}
                    strokeOpacity={0.65}
                  />
                  <circle cx={cfg.pos.x} cy={cfg.pos.y} r={6} fill={cfg.color} />
                </g>
              );
            })}

            {/* Modules to Sessions Beziers */}
            {modules.map((mod) => {
              const cfg = MODULE_CONFIG[mod.id];
              if (!cfg) return null;

              return mod.sessions.map((s, idx) => {
                const offset = cfg.leafOffsets[idx] || { x: 0, y: 0 };
                const leafX = cfg.pos.x + offset.x;
                const leafY = cfg.pos.y + offset.y;

                const isDone = isSessionCompleted(s.id);
                const isNext = nextUpSession?.id === s.id;
                const isSelected = selectedSessionId === s.id;

                const cX1 = cfg.pos.x + offset.x * 0.5;
                const cY1 = cfg.pos.y;
                const cX2 = cfg.pos.x + offset.x * 0.7;
                const cY2 = leafY;

                return (
                  <path
                    key={`edge-${s.id}`}
                    d={`M ${cfg.pos.x} ${cfg.pos.y} C ${cX1} ${cY1}, ${cX2} ${cY2}, ${leafX} ${leafY}`}
                    fill="none"
                    stroke={isDone ? cfg.color : isNext || isSelected ? cfg.color : "hsl(var(--border))"}
                    strokeWidth={isSelected ? 3.5 : isNext ? 3 : isDone ? 2.2 : 1.5}
                    strokeDasharray={isDone || isSelected ? "none" : "4,4"}
                    strokeOpacity={isSelected ? 1 : isNext ? 0.9 : isDone ? 0.8 : 0.45}
                  />
                );
              });
            })}
          </svg>

          {/* CENTRAL CORE HUB NODE */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-primary/50 bg-card p-6 shadow-2xl backdrop-blur-md"
            style={{
              left: `${CENTER_NODE.x}px`,
              top: `${CENTER_NODE.y}px`,
              width: "360px",
            }}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold tracking-tight text-foreground">
                      LAKSHYA SONI
                    </span>
                    <span className="rounded bg-primary/20 px-1.5 py-0.2 font-mono text-[10px] font-bold text-primary">
                      100x SCALE
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Senior AI System Design Portal
                  </p>
                </div>
              </div>

              {/* Progress Ring Badge */}
              <div className="flex flex-col items-end">
                <span className="font-mono text-sm font-bold text-primary">
                  {completionPct}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {completedSessions.length}/20 Done
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>5 Core Architecture Modules</span>
                <button
                  type="button"
                  onClick={centerOnNextUp}
                  className="text-primary hover:underline font-mono text-[11px] cursor-pointer"
                >
                  Jump to S{String(nextUpSession?.number || 1).padStart(2, "0")} →
                </button>
              </div>
            </div>
          </div>

          {/* 5 MODULE BRANCH NODES */}
          {modules.map((mod, idx) => {
            const cfg = MODULE_CONFIG[mod.id];
            if (!cfg) return null;
            const completedCount = mod.sessions.filter((s) => isSessionCompleted(s.id)).length;
            const isModActive = activeModuleTab === "ALL" || activeModuleTab === mod.id;

            return (
              <div
                key={mod.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border ${cfg.border} bg-card/95 p-4 shadow-lg backdrop-blur-md transition-all ${
                  isModActive ? "opacity-100" : "opacity-40"
                }`}
                style={{
                  left: `${cfg.pos.x}px`,
                  top: `${cfg.pos.y}px`,
                  width: "280px",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold ${cfg.badgeBg} ${cfg.badgeText}`}
                    >
                      {cfg.code}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      Module {idx + 1}
                    </span>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                    {completedCount}/4 Done
                  </span>
                </div>

                <h4 className="mt-1.5 text-xs font-semibold text-foreground line-clamp-1">
                  {mod.title.split(":")[1] || mod.title}
                </h4>

                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  {mod.focus}
                </p>
              </div>
            );
          })}

          {/* 20 SESSION LEAF NODES */}
          {modules.map((mod) => {
            const cfg = MODULE_CONFIG[mod.id];
            if (!cfg) return null;

            return mod.sessions.map((session, sIdx) => {
              const fullSession = allSessions.find((s) => s.id === session.id) || {
                ...session,
                moduleId: mod.id,
                moduleTitle: mod.title,
                moduleFocus: mod.focus,
              };

              const offset = cfg.leafOffsets[sIdx] || { x: 0, y: 0 };
              const nodeX = cfg.pos.x + offset.x;
              const nodeY = cfg.pos.y + offset.y;

              const isCompleted = isSessionCompleted(session.id);
              const isNext = nextUpSession?.id === session.id;
              const isSelected = selectedSessionId === session.id;
              const isMatching = isSessionHighlighted(fullSession);

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setIsInspectorOpen(true);
                  }}
                  className={`prevent-canvas-pan absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3.5 shadow-sm transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-card scale-105 z-30 shadow-xl"
                      : isNext
                      ? "ring-2 ring-primary/60 border-primary/50 bg-primary/5 z-20 hover:scale-102"
                      : isCompleted
                      ? "border-border/90 bg-card hover:border-primary/40 hover:scale-102"
                      : "border-border bg-card/90 hover:border-border hover:bg-card hover:scale-102"
                  } ${isMatching ? "opacity-100" : "opacity-25 pointer-events-none"}`}
                  style={{
                    left: `${nodeX}px`,
                    top: `${nodeY}px`,
                    width: "250px",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : isNext ? (
                        <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20 shrink-0 animate-pulse" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="font-mono text-[11px] font-bold text-muted-foreground">
                        S{String(session.number).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {session.id === "session-01" && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-primary">
                          Gold
                        </span>
                      )}
                      {isNext && (
                        <span className="rounded bg-accent/20 px-1.5 py-0.2 font-mono text-[9px] font-bold text-accent animate-pulse">
                          Next Up
                        </span>
                      )}
                    </div>
                  </div>

                  <h5 className="mt-1.5 text-xs font-bold text-foreground leading-snug line-clamp-2">
                    {session.title}
                  </h5>

                  <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground font-mono">
                    <span className="truncate max-w-[160px]">{session.projectTieIn.split("(")[0]}</span>
                    <span className="shrink-0">{session.estimatedReadTime || "15m"}</span>
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>

      {/* 3. DOCKED RICH NODE INSPECTOR (Side Sheet Desktop / Bottom Mobile) */}
      {isInspectorOpen && selectedSession && (
        <aside className="absolute right-0 top-0 bottom-0 z-30 w-full max-w-sm sm:max-w-md border-l border-border bg-card/95 p-5 backdrop-blur-xl shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            {/* Inspector Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">
                    Session {String(selectedSession.number).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedSession.moduleTitle}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground leading-snug">
                  {selectedSession.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Close Inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Resume Project Tie-In Card */}
            <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Resume Anchor Tie-In
                </span>
                <Link
                  href="/projects"
                  className="font-mono text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  View 100x Defense <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedSession.projectTieIn}
              </p>
            </div>

            {/* Flashcard Active Recall Status */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  Spaced Repetition Mastery
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {selectedSessionFlashcards.total} Cards Linked
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[11px]">
                <div className="rounded-lg bg-secondary p-1.5">
                  <div className="font-bold text-muted-foreground">{selectedSessionFlashcards.unseen}</div>
                  <div className="text-[9px] text-muted-foreground uppercase">Unseen</div>
                </div>
                <div className="rounded-lg bg-destructive/15 p-1.5">
                  <div className="font-bold text-destructive">{selectedSessionFlashcards.hard}</div>
                  <div className="text-[9px] text-destructive uppercase">Hard</div>
                </div>
                <div className="rounded-lg bg-amber-500/15 p-1.5">
                  <div className="font-bold text-amber-500">{selectedSessionFlashcards.medium}</div>
                  <div className="text-[9px] text-amber-500 uppercase">Med</div>
                </div>
                <div className="rounded-lg bg-primary/15 p-1.5">
                  <div className="font-bold text-primary">{selectedSessionFlashcards.easy}</div>
                  <div className="text-[9px] text-primary uppercase">Easy</div>
                </div>
              </div>
            </div>

            {/* Socratic Study Prompt Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Socratic AI Chat Prompt
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyPrompt(selectedSession.id, selectedSession.studyPrompt)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copiedPromptId === selectedSession.id ? (
                    <>
                      <Check className="h-3 w-3 text-primary" />
                      <span className="text-primary font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-border bg-secondary/50 p-3 max-h-36 overflow-y-auto">
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  &ldquo;{selectedSession.studyPrompt}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="border-t border-border pt-4 mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => toggleSessionCompleted(selectedSession.id)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {isSessionCompleted(selectedSession.id) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Completed (Click to undo)</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-muted-foreground" />
                    <span>Mark Session Completed</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Clock className="h-3.5 w-3.5" />
                <span>{selectedSession.estimatedReadTime || "15 min"}</span>
              </div>
            </div>

            <Link
              href={`/roadmap/${selectedSession.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
            >
              <span>{isSessionCompleted(selectedSession.id) ? "Review Session" : "Start Session"}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      )}

      {/* Floating Inspector Toggle when closed */}
      {!isInspectorOpen && (
        <button
          type="button"
          onClick={() => setIsInspectorOpen(true)}
          className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 rounded-2xl border border-border bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-lg backdrop-blur-md hover:border-primary/40 transition-all cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Open Session Inspector</span>
        </button>
      )}
    </div>
  );
}
