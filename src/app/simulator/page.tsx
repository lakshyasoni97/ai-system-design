"use client";

import React, { useEffect, useState } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  FileCode2,
  CheckSquare,
  Square,
  LayoutGrid,
  Calculator,
} from "lucide-react";
import CapacityCalculator from "@/components/CapacityCalculator";
import { useProgress } from "@/components/ProgressProvider";

interface InterviewPhase {
  id: string;
  rangeLabel: string;
  startMin: number;
  endMin: number;
  title: string;
  checklist: string[];
}

const INTERVIEW_PHASES: InterviewPhase[] = [
  {
    id: "phase-1",
    rangeLabel: "00–05m",
    startMin: 0,
    endMin: 5,
    title: "Requirements & Scope",
    checklist: [
      "Clarify Functional Requirements: User personas, core workflows, multimodal inputs/outputs",
      "Lock Non-Functional SLAs: P50/P99 TTFT (<2.0s), Peak QPS, Availability (99.95%), Groundedness target",
      "Define explicit Out-of-Scope boundaries so you don't waste time",
    ],
  },
  {
    id: "phase-2",
    rangeLabel: "05–10m",
    startMin: 5,
    endMin: 10,
    title: "Back-of-the-Envelope & API Contract",
    checklist: [
      "Calculate Peak QPS & Tokens Per Minute (TPM) from DAU",
      "Estimate Vector DB HNSW RAM: N × D × Bytes × 1.5 (FP32 vs INT8 quantization)",
      "Define REST / WebSocket / SSE API endpoints, request/response schemas & auth headers",
    ],
  },
  {
    id: "phase-3",
    rangeLabel: "10–25m",
    startMin: 10,
    endMin: 25,
    title: "High-Level Architecture (Ingest + Inference)",
    checklist: [
      "Draw the Ingestion / Indexing Path: GCS Signed URLs, Pub/Sub decoupling, Delta hashing, Dual Index",
      "Draw the Online Query / Agent Path: Envoy Gateway, Guardrail sidecar, FastAPI on GKE, ADK/LangGraph",
      "Specify Storage Tiers: Redis Cluster (hot state), Vector DB (HNSW), Postgres (audit), BigQuery (evals)",
    ],
  },
  {
    id: "phase-4",
    rangeLabel: "25–40m",
    startMin: 25,
    endMin: 40,
    title: "Deep Dive: Bottlenecks, State, RBAC & Evals",
    checklist: [
      "Agent Reliability: Super-step Redis checkpointing, idempotency keys, recursion limits & circuit breakers",
      "RAG Precision & Security: Hybrid BM25 + Dense + RRF (k=60), Cross-Encoder reranking, RBAC payload bitmaps",
      "LLMOps & Evals: Offline Golden Dataset CI/CD gates + Online sampled RAG Triad (LLM-as-a-Judge)",
    ],
  },
  {
    id: "phase-5",
    rangeLabel: "40–45m",
    startMin: 40,
    endMin: 45,
    title: "Cost Optimization & Executive Wrap-Up",
    checklist: [
      "Model Tiering: Route 75%+ traffic to Gemini Flash; escalate to Pro only on low confidence",
      "Caching Layers: Provider Context Caching + Entity-prefixed Semantic Caching + INT8 Vector Quantization",
      "Summarize key trade-offs and business impact ($1.3M+ savings, 85% effort reduction)",
    ],
  },
];

const MOCK_SCENARIOS = [
  "Design a 10,000 QPS Enterprise Multi-Agent Customer Support System with <2s TTFT (Deloitte 100x)",
  "Design a 50-Million Slide Multimodal RAG Engine with Document-Level RBAC (Deloitte Slide RAG 100x)",
  "Design a Real-Time Global Financial News NER & Alpha Signal Pipeline at 100k Articles/Min (Network18 100x)",
  "Design an AI Video Repurposing Platform handling 5,000 Concurrent 1-Hour 4K Uploads (Network18 Video 100x)",
];

export default function SimulatorPage() {
  const { scratchpadNotes, updateScratchpad } = useProgress();

  const TOTAL_SECONDS = 45 * 60;
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>(
    MOCK_SCENARIOS[0]
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"all" | "timer" | "calc">("all");

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= TOTAL_SECONDS) {
          setIsRunning(false);
          return TOTAL_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, TOTAL_SECONDS]);

  const elapsedMinutes = elapsedSeconds / 60;
  const remainingSeconds = Math.max(0, TOTAL_SECONDS - elapsedSeconds);
  const remMins = Math.floor(remainingSeconds / 60);
  const remSecs = remainingSeconds % 60;
  const elapsedMinsDisplay = Math.floor(elapsedSeconds / 60);
  const elapsedSecsDisplay = elapsedSeconds % 60;

  const activePhase =
    INTERVIEW_PHASES.find(
      (p) => elapsedMinutes >= p.startMin && elapsedMinutes < p.endMin
    ) || INTERVIEW_PHASES[INTERVIEW_PHASES.length - 1];

  const toggleCheck = (itemKey: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const whiteboardText =
    scratchpadNotes["mock-simulator-whiteboard"] ||
    `# Mock Interview Whiteboard
## 1. Requirements & SLAs
- Peak QPS: 
- P99 TTFT Target: < 1.8s
- Availability: 99.95%

## 2. Back-of-the-Envelope Math
- Vector RAM (INT8): 
- Peak TPM: 

## 3. API Contract & Architecture Notes
- POST /v1/agent/stream (SSE)
`;

  return (
    <div className="space-y-8">
      {/* View Mode Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Mock Interview Simulator & Capacity Calculator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discipline your 45-minute interview pacing and run live
            back-of-the-envelope RAM, QPS, and token cost math.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Workbench View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("timer")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "timer"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Timer className="h-3.5 w-3.5" />
            <span>45m Timer Only</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calc")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "calc"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="h-3.5 w-3.5" />
            <span>Capacity Calculator Only</span>
          </button>
        </div>
      </div>

      {/* 1. 45-Minute System Design Mock Interview Timer */}
      {(activeTab === "all" || activeTab === "timer") && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary font-semibold">
                <Timer className="h-3.5 w-3.5" />
                <span>45-Minute System Design Pacing Tracker</span>
              </div>
              <h2 className="mt-2.5 text-xl font-bold text-foreground sm:text-2xl">
                Interview Pacing & Live Checklist
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow standard 5-phase timeline to avoid getting bogged down before architecture and deep dives.
              </p>
            </div>

            {/* Digital Clock & Controls */}
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-secondary p-4 shadow-2xs">
              <div className="pr-3 border-r border-border">
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Elapsed / 45:00
                </div>
                <div className="font-mono text-3xl font-bold text-primary">
                  {String(elapsedMinsDisplay).padStart(2, "0")}:
                  {String(elapsedSecsDisplay).padStart(2, "0")}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Remaining: {String(remMins).padStart(2, "0")}:
                  {String(remSecs).padStart(2, "0")}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunning((r) => !r)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-mono text-xs font-semibold transition-opacity cursor-pointer shadow-xs ${
                    isRunning
                      ? "bg-amber-500 text-zinc-950 hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Start Timer</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setElapsedSeconds(0);
                    setCheckedItems({});
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Scenario Prompt Selector */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label
              htmlFor="scenario-select"
              className="font-mono text-xs font-semibold uppercase tracking-wider text-accent"
            >
              Target Interview Prompt:
            </label>
            <select
              id="scenario-select"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="flex-1 max-w-2xl rounded-xl border border-border bg-secondary px-3.5 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {MOCK_SCENARIOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 5-Phase Visual Timeline */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5">
            {INTERVIEW_PHASES.map((phase) => {
              const isCurrent = activePhase.id === phase.id;
              const isPast = elapsedMinutes >= phase.endMin;

              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setElapsedSeconds(phase.startMin * 60)}
                  className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                    isCurrent
                      ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                      : isPast
                      ? "border-border bg-muted/40 opacity-80"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isPast
                          ? "bg-secondary text-primary font-semibold"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {phase.rangeLabel}
                    </span>
                    {isPast && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="mt-2.5 text-xs font-semibold text-foreground">
                    {phase.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Phase Guidance & Interactive Checklist + Whiteboard */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-center justify-between font-mono text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Phase ({activePhase.rangeLabel}): {activePhase.title}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Click to check off
                </span>
              </div>
              <ul className="mt-3.5 space-y-2.5 text-xs sm:text-sm">
                {activePhase.checklist.map((item, idx) => {
                  const itemKey = `${activePhase.id}-${idx}`;
                  const isChecked = Boolean(checkedItems[itemKey]);

                  return (
                    <li
                      key={itemKey}
                      onClick={() => toggleCheck(itemKey)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border transition-colors cursor-pointer ${
                        isChecked
                          ? "border-primary/40 bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className={`leading-relaxed ${isChecked ? "line-through opacity-80" : ""}`}>
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                  <FileCode2 className="h-4 w-4 text-accent" />
                  Live Interview API & Estimation Scratchpad
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Persisted in localStorage
                </span>
              </div>
              <textarea
                aria-label="Mock interview scratchpad"
                rows={6}
                value={whiteboardText}
                onChange={(e) =>
                  updateScratchpad("mock-simulator-whiteboard", e.target.value)
                }
                className="w-full rounded-xl border border-border bg-muted/20 p-3 font-mono text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Back-of-the-Envelope AI Capacity Calculator */}
      {(activeTab === "all" || activeTab === "calc") && (
        <CapacityCalculator />
      )}
    </div>
  );
}
