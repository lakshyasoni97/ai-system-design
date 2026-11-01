"use client";

import React, { useMemo, useState } from "react";
import { Database, Cpu, DollarSign, Activity, HardDrive, Zap } from "lucide-react";

type QuantizationType = "FP32" | "FP16" | "INT8" | "PQ";
type ModelTier = "gemini-flash" | "gemini-pro" | "vllm-self-hosted";

const QUANTIZATION_BYTES: Record<
  QuantizationType,
  { bytes: number; label: string; recallNote: string }
> = {
  FP32: {
    bytes: 4,
    label: "FP32 (4 Bytes / dim)",
    recallNote: "100% baseline recall; highest memory footprint",
  },
  FP16: {
    bytes: 2,
    label: "FP16 / BF16 (2 Bytes / dim)",
    recallNote: "~99.9% recall; 2x memory savings with zero retraining",
  },
  INT8: {
    bytes: 1,
    label: "INT8 Scalar Quantization (1 Byte / dim)",
    recallNote: "~98.8% recall; 4x memory savings (pair with Cross-Encoder reranker)",
  },
  PQ: {
    bytes: 0.25,
    label: "Product Quantization PQ-8x (0.25 Bytes / dim)",
    recallNote: "~92–95% recall; 16x compression (requires disk rescoring)",
  },
};

const MODEL_PRICING: Record<
  ModelTier,
  {
    name: string;
    inputPer1M: number;
    outputPer1M: number;
    ttftNote: string;
  }
> = {
  "gemini-flash": {
    name: "Gemini 1.5 / 2.0 Flash",
    inputPer1M: 0.1,
    outputPer1M: 0.4,
    ttftNote: "~220ms P50 TTFT • Ideal for Intent Routers & High-QPS RAG",
  },
  "gemini-pro": {
    name: "Gemini 1.5 Pro",
    inputPer1M: 1.25,
    outputPer1M: 5.0,
    ttftNote: "~680ms P50 TTFT • Ideal for Complex Multi-Hop Synthesis",
  },
  "vllm-self-hosted": {
    name: "Self-Hosted vLLM (Llama-3-70B on GKE)",
    inputPer1M: 0.35,
    outputPer1M: 0.9,
    ttftNote: "~310ms P50 TTFT • Fixed GPU Node Pool OpEx at high sustained QPS",
  },
};

export default function CapacityCalculator() {
  // Vector DB Calculator State
  const [numVectorsMillions, setNumVectorsMillions] = useState<number>(50);
  const [dimensions, setDimensions] = useState<number>(1536);
  const [quantization, setQuantization] = useState<QuantizationType>("INT8");

  // LLM QPS & Cost Calculator State
  const [dau, setDau] = useState<number>(50000);
  const [requestsPerUser, setRequestsPerUser] = useState<number>(8);
  const [avgInputTokens, setAvgInputTokens] = useState<number>(1800);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(350);
  const [modelTier, setModelTier] = useState<ModelTier>("gemini-flash");
  const [cacheHitRate, setCacheHitRate] = useState<number>(35);

  const vectorMetrics = useMemo(() => {
    const vectors = numVectorsMillions * 1_000_000;
    const dtypeBytes = QUANTIZATION_BYTES[quantization].bytes;
    const rawBytes = vectors * dimensions * dtypeBytes;
    const totalBytesWithHnsw = rawBytes * 1.5; // 1.5x HNSW graph link overhead
    const rawGB = rawBytes / 1_000_000_000;
    const totalGB = totalBytesWithHnsw / 1_000_000_000;

    let engineRecommendation = "Single-Node ChromaDB / pgvector (< 16 GB RAM)";
    if (totalGB >= 16 && totalGB < 96) {
      engineRecommendation =
        "Qdrant / Milvus Single-Shard or Vertex AI Vector Search (64–128 GB RAM Node)";
    } else if (totalGB >= 96) {
      const shards = Math.ceil(totalGB / 64);
      engineRecommendation = `Distributed Qdrant / Vertex AI Vector Search (${shards}x 64GB Shards + Replication Factor 2)`;
    }

    const comparison = (["FP32", "FP16", "INT8", "PQ"] as QuantizationType[]).map(
      (q) => ({
        type: q,
        gb: (vectors * dimensions * QUANTIZATION_BYTES[q].bytes * 1.5) / 1_000_000_000,
      })
    );

    return {
      rawGB,
      totalGB,
      engineRecommendation,
      comparison,
    };
  }, [numVectorsMillions, dimensions, quantization]);

  const llmMetrics = useMemo(() => {
    const dailyRequests = dau * requestsPerUser;
    const avgQps = dailyRequests / 86400;
    const peakQps = avgQps * 3.2; // Standard enterprise peak-to-average ratio

    const totalDailyInputTokens = dailyRequests * avgInputTokens;
    const totalDailyOutputTokens = dailyRequests * avgOutputTokens;

    const avgTpm = ((totalDailyInputTokens + totalDailyOutputTokens) / 1440);
    const peakTpm = avgTpm * 3.2;

    const pricing = MODEL_PRICING[modelTier];
    const effectiveInputMultiplier =
      (1 - cacheHitRate / 100) * 1.0 + (cacheHitRate / 100) * 0.25;

    const dailyInputCost =
      (totalDailyInputTokens / 1_000_000) *
      pricing.inputPer1M *
      effectiveInputMultiplier;
    const dailyOutputCost =
      (totalDailyOutputTokens / 1_000_000) * pricing.outputPer1M;

    const dailyTotalCost = dailyInputCost + dailyOutputCost;
    const monthlyTotalCost = dailyTotalCost * 30;
    const costPer1kRequests = (dailyTotalCost / Math.max(1, dailyRequests)) * 1000;

    return {
      dailyRequests,
      avgQps,
      peakQps,
      avgTpm,
      peakTpm,
      dailyTotalCost,
      monthlyTotalCost,
      costPer1kRequests,
    };
  }, [
    dau,
    requestsPerUser,
    avgInputTokens,
    avgOutputTokens,
    modelTier,
    cacheHitRate,
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* 1. Vector DB RAM Estimator */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Vector DB HNSW RAM Estimator
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                RAM = N_vectors × D_dims × Bytes_dtype × 1.5
              </p>
            </div>
          </div>
          <span className="rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary font-semibold">
            1.5x HNSW Overhead
          </span>
        </div>

        <div className="space-y-4">
          {/* Number of Vectors */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="vectors-input"
                className="font-medium text-foreground"
              >
                Number of Vectors (Millions)
              </label>
              <span className="font-mono font-semibold text-primary">
                {numVectorsMillions}M Vectors
              </span>
            </div>
            <input
              id="vectors-input"
              type="range"
              min={1}
              max={250}
              step={1}
              value={numVectorsMillions}
              onChange={(e) => setNumVectorsMillions(Number(e.target.value))}
              className="w-full accent-emerald-600 dark:accent-emerald-500 cursor-pointer"
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[1, 10, 50, 100, 200].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNumVectorsMillions(preset)}
                  className={`rounded-lg border px-2 py-0.5 font-mono text-[11px] transition-colors cursor-pointer ${
                    numVectorsMillions === preset
                      ? "border-primary/50 bg-primary/15 text-primary font-semibold"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {preset}M
                </button>
              ))}
            </div>
          </div>

          {/* Dimensions & Quantization */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="dims-select"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Embedding Dimensions (D)
              </label>
              <select
                id="dims-select"
                value={dimensions}
                onChange={(e) => setDimensions(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value={384}>384 (MiniLM / Fast BGE)</option>
                <option value={768}>768 (Vertex Gecko / MPNet)</option>
                <option value={1024}>1024 (BGE-Large / Cohere v3)</option>
                <option value={1536}>1536 (Vertex / OpenAI Large)</option>
                <option value={3072}>3072 (text-embedding-3-large)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quant-select"
                className="mb-1.5 block text-xs font-medium text-foreground"
              >
                Quantization Strategy
              </label>
              <select
                id="quant-select"
                value={quantization}
                onChange={(e) =>
                  setQuantization(e.target.value as QuantizationType)
                }
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {(Object.keys(QUANTIZATION_BYTES) as QuantizationType[]).map(
                  (q) => (
                    <option key={q} value={q}>
                      {QUANTIZATION_BYTES[q].label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Primary Output Display */}
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Total HNSW Memory Required
                </span>
                <div className="mt-1 font-mono text-3xl font-bold text-primary">
                  {vectorMetrics.totalGB.toFixed(1)} GB RAM
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  Raw Vectors: {vectorMetrics.rawGB.toFixed(1)} GB + Graph Links:{" "}
                  {(vectorMetrics.totalGB - vectorMetrics.rawGB).toFixed(1)} GB
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-mono text-xs text-foreground font-semibold">
                  <HardDrive className="h-3.5 w-3.5 text-accent" />
                  {QUANTIZATION_BYTES[quantization].bytes}B / dim
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-primary/20 pt-2.5 text-xs text-foreground/90">
              <strong className="text-primary font-bold">Recall Note:</strong>{" "}
              {QUANTIZATION_BYTES[quantization].recallNote}
            </div>
            <div className="mt-1.5 text-xs text-foreground/90">
              <strong className="text-accent font-bold">Recommended Tier:</strong>{" "}
              {vectorMetrics.engineRecommendation}
            </div>
          </div>

          {/* Quantization Comparison Bar */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            {vectorMetrics.comparison.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setQuantization(item.type)}
                className={`rounded-xl border p-2.5 text-left transition-colors cursor-pointer ${
                  quantization === item.type
                    ? "border-primary bg-primary/15 shadow-2xs"
                    : "border-border bg-secondary hover:border-primary/40"
                }`}
              >
                <div className="font-mono text-xs font-semibold text-foreground">
                  {item.type}
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-primary">
                  {item.gb.toFixed(1)} GB
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. LLM Token, QPS & Cost Estimator */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                LLM QPS, TPM & Token Cost Estimator
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                Peak QPS = (DAU × Req/Day ÷ 86,400) × 3.2 Peak Factor
              </p>
            </div>
          </div>
          <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-xs text-accent font-semibold">
            Quota & FinOps
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label
                htmlFor="dau-input"
                className="mb-1 block text-xs font-medium text-foreground"
              >
                Daily Active Users
              </label>
              <input
                id="dau-input"
                type="number"
                min={100}
                step={1000}
                value={dau}
                onChange={(e) => setDau(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="req-input"
                className="mb-1 block text-xs font-medium text-foreground"
              >
                Reqs / User / Day
              </label>
              <input
                id="req-input"
                type="number"
                min={1}
                max={500}
                value={requestsPerUser}
                onChange={(e) =>
                  setRequestsPerUser(Math.max(1, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="in-tokens-input"
                className="mb-1 block text-xs font-medium text-foreground"
              >
                Avg Input Tokens
              </label>
              <input
                id="in-tokens-input"
                type="number"
                min={50}
                step={100}
                value={avgInputTokens}
                onChange={(e) =>
                  setAvgInputTokens(Math.max(10, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="out-tokens-input"
                className="mb-1 block text-xs font-medium text-foreground"
              >
                Avg Output Tokens
              </label>
              <input
                id="out-tokens-input"
                type="number"
                min={20}
                step={50}
                value={avgOutputTokens}
                onChange={(e) =>
                  setAvgOutputTokens(Math.max(10, Number(e.target.value)))
                }
                className="w-full rounded-xl border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="model-tier-select"
                className="mb-1 block text-xs font-medium text-foreground"
              >
                LLM Serving Tier
              </label>
              <select
                id="model-tier-select"
                value={modelTier}
                onChange={(e) => setModelTier(e.target.value as ModelTier)}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              >
                {(Object.keys(MODEL_PRICING) as ModelTier[]).map((t) => (
                  <option key={t} value={t}>
                    {MODEL_PRICING[t].name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <label
                  htmlFor="cache-slider"
                  className="font-medium text-foreground"
                >
                  Prompt / Semantic Cache Hit %
                </label>
                <span className="font-mono text-accent font-semibold">{cacheHitRate}%</span>
              </div>
              <input
                id="cache-slider"
                type="range"
                min={0}
                max={80}
                step={5}
                value={cacheHitRate}
                onChange={(e) => setCacheHitRate(Number(e.target.value))}
                className="mt-1.5 w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Output KPI Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span>Peak QPS</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-foreground">
                {llmMetrics.peakQps.toFixed(1)}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                Avg: {llmMetrics.avgQps.toFixed(1)} QPS
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Peak TPM Quota</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-amber-600 dark:text-amber-400">
                {(llmMetrics.peakTpm / 1000).toFixed(0)}k
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                Avg: {(llmMetrics.avgTpm / 1000).toFixed(0)}k TPM
              </div>
            </div>

            <div className="rounded-xl border border-accent/30 bg-accent/10 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <DollarSign className="h-3.5 w-3.5 text-accent" />
                <span>Monthly Cost</span>
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-accent">
                ${llmMetrics.monthlyTotalCost.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground">
                ${llmMetrics.costPer1kRequests.toFixed(2)} / 1k reqs
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground/90">
            <span className="font-mono font-semibold text-accent">
              {MODEL_PRICING[modelTier].name}:
            </span>{" "}
            {MODEL_PRICING[modelTier].ttftNote}
          </div>
        </div>
      </div>
    </div>
  );
}
