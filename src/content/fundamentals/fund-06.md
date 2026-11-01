# Caching & Rate Limiting Fundamentals

> **Why this matters for AI systems:** cost and latency are dominated by repeated, expensive model calls — caching and quotas are your two biggest levers.

## 1. Cache patterns

| Pattern | Flow | Trade-off |
| :--- | :--- | :--- |
| **Cache-aside** | App checks cache; on miss loads from source and fills | Simple; stale data and thundering herd on miss |
| **Read-through** | Cache itself loads on miss | Cleaner app code; cache is on critical path |
| **Write-through** | Write to cache and DB together | Fresh reads, slower writes |
| **Write-back** | Write to cache, flush async | Fast, risk of loss |

## 2. Invalidation and hard problems

- **TTL** is the default; choose it from how stale an answer can be.
- **Event-based invalidation** (document updated → delete keys) for correctness-critical data.
- **Thundering herd / stampede:** many misses at once. Use request coalescing (single-flight), jittered TTLs, or serve-stale-while-revalidate.
- **Hit rate math:** `avg_latency = hit * t_cache + (1 - hit) * (t_cache + t_origin)` — a cache with 30% hit rate on a 5 ms origin is pointless; on a 3 s LLM call it is gold.

## 3. LLM-specific caches

1. **Exact response cache:** hash(normalized prompt + params + model version). Cheap, low hit rate for free-form chat, high for templated queries.
2. **Semantic cache:** embed the query, nearest neighbour within a similarity threshold → reuse answer. Risks: false positives (wrong answer returned), cost/latency of embedding lookup, and **per-tenant/permission leakage** — always scope by tenant and access level.
3. **Provider prompt/prefix caching:** reuse the KV state for a long static prefix (system prompt, documents) — lowers cost and TTFT; put stable content first, variable content last.
4. **Retrieval / embedding cache:** cache embeddings of repeated texts and top-k results for popular queries.

## 4. Rate limiting algorithms

| Algorithm | Idea | Notes |
| :--- | :--- | :--- |
| **Fixed window** | Count per time bucket | Bursts at window edges (2× limit) |
| **Sliding window log/counter** | Smooth window | More memory / approximation |
| **Token bucket** | Refill `r` tokens/s up to capacity `b` | Allows bursts; most common (API gateways) |
| **Leaky bucket** | Constant outflow rate | Smooths traffic into a steady stream |
| **Concurrency limit** | Max in-flight requests | Ideal for slow LLM calls |

Distributed implementation: Redis atomic ops / Lua script keyed by `(tenant, route)`; or local buckets with periodic sync if approximate is fine.

## 5. Quotas for LLMs are two-dimensional

- Limits are usually **requests/min AND tokens/min**. You often know input tokens up front but output tokens only afterwards → **reserve** an estimate, then reconcile after the response.
- Add **per-tenant fairness** (weighted fair queuing or reserved + burst pools) and **priority lanes** so batch jobs never starve interactive chat.
- Return `429` with `Retry-After`; clients use backoff with jitter.

## 6. Interview check

1. When does a semantic cache lose money?
2. Token bucket vs leaky bucket — which for a Gemini TPM quota shared by 10 teams?
3. How do you stop cached answers leaking across tenants?
4. How do you rate-limit by tokens when output length is unknown?
