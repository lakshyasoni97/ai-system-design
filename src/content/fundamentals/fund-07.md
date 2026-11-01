# Back-of-the-Envelope Estimation Toolkit

> **Why this matters for AI systems:** the first 5 minutes of a design interview are estimation. Round aggressively, show your reasoning, and let numbers drive architecture decisions.

## 1. Latency numbers to know (order of magnitude)

| Operation | Approx. time |
| :--- | :--- |
| L1/L2 cache or main-memory reference | ~1 ns – 100 ns |
| SSD random read | ~100 µs |
| Same-datacenter round trip | ~0.5 ms |
| Redis GET (same zone) | ~0.5–1 ms |
| Disk (HDD) seek | ~10 ms |
| Cross-region round trip (US↔EU) | ~80–150 ms |
| ANN vector search (in-memory, 1–10M vectors) | ~5–50 ms |
| Cross-encoder rerank, 50 docs | ~50–300 ms |
| LLM time-to-first-token (hosted, short prompt) | ~300 ms – 1.5 s |
| LLM decode speed (hosted) | ~30–150 tokens/s |

Treat these as ballpark figures and say so out loud.

## 2. Powers of two and scale shortcuts

- 1 day ≈ 86,400 s ≈ **10^5 s**. So 1M requests/day ≈ **~12 QPS average**; peak is commonly 2–5× average.
- 1 KB = 10^3 B, 1 MB = 10^6, 1 GB = 10^9, 1 TB = 10^12 (use decimal for speed).
- Seconds per month ≈ 2.5 × 10^6; per year ≈ 3 × 10^7.

## 3. Estimation recipe

1. **Users → requests:** DAU × requests/user/day ÷ 86,400 = average QPS; multiply by a peak factor.
2. **Payload → bandwidth/storage:** QPS × bytes; retention × daily volume.
3. **Concurrency (Little's Law):** `in-flight = QPS × latency`. 200 QPS at 4 s per request means ~800 concurrent requests.
4. **Cost:** requests × (input tokens × price_in + output tokens × price_out).

## 4. LLM and vector formulas

- **Tokens/sec capacity:** GPUs needed ≈ peak output tokens/s ÷ tokens/s per GPU at your batch size.
- **Cost per 1k requests** = 1000 × (avg_in × price_in + avg_out × price_out). Check current provider pricing before quoting numbers.
- **Embedding storage:** `N × D × bytes` (FP32 = 4 B, FP16 = 2 B, INT8 = 1 B). 100M × 768 × 4 B ≈ 307 GB raw; HNSW graph adds roughly 30–50% overhead.
- **KV cache per token:** `2 × layers × kv_heads × head_dim × bytes`. Multiply by context length × concurrent sequences — this, not model weights, often limits concurrency.
- **Model weights:** parameters × bytes (7B at FP16 ≈ 14 GB; INT4 ≈ 3.5 GB).

## 5. Worked example — enterprise RAG assistant

- 20,000 employees, 30% DAU = 6,000 users × 10 questions/day = 60,000 requests/day ≈ **0.7 QPS avg**, ~**3–4 QPS peak**.
- Each request: 4k input tokens (retrieved context), 400 output tokens.
- Tokens/day ≈ 60,000 × 4,400 ≈ **264M tokens/day** — cost depends on model tier; compare flash vs pro tiers.
- Concurrency at peak with 6 s latency: `4 × 6 = 24` in-flight requests — trivially small, so **bottleneck is quota/cost, not compute**.
- Corpus: 2M chunks × 768 dims × 4 B ≈ 6 GB → fits on one node; no sharding needed yet.

Showing that "this is small" and designing simply is a **senior** signal.

## 6. Interview check

1. 5M requests/day with 1.5 s latency → concurrency?
2. Estimate RAM for 50M × 1,536-dim vectors in FP32 vs INT8.
3. Which resource limits a chat service first: weights, KV cache, or quota? Why?
4. Convert "1,000 concurrent chat users" to tokens/s of decode capacity.
