# Observability, SLOs & Percentile Thinking

> **Why this matters for AI systems:** a "working" LLM system can be fast and wrong. You need latency, error, cost **and quality** signals, and you need to debug multi-step agent runs.

## 1. Percentiles, not averages

- Averages hide the tail. Report **P50 / P95 / P99**.
- **Tail amplification:** if one request fans out to 10 backends each with P99 = 1 s, ~10% of requests hit at least one slow call. Mitigate with hedged requests, timeouts, fewer fan-out hops.
- For streaming LLMs track **TTFT**, **inter-token latency**, and **total time** separately.

## 2. SLI → SLO → error budget

- **SLI:** a measured indicator (fraction of requests with TTFT < 2 s).
- **SLO:** target for it (99% over 30 days).
- **Error budget:** `1 − SLO`; spend it on releases/experiments, freeze risky changes when it is burned.
- Alert on **burn rate** (fast + slow windows), not on raw thresholds.

## 3. The three pillars (+ one)

| Signal | Answers | Tools |
| :--- | :--- | :--- |
| **Metrics** | Is something wrong? Trend? | Prometheus, Cloud Monitoring |
| **Logs** | What happened exactly? | Cloud Logging, ELK |
| **Traces** | Where did the time go across services? | OpenTelemetry, Cloud Trace, Jaeger |
| **Profiles / events** | Why is CPU/memory high? | pprof, continuous profilers |

Use **RED** for services (Rate, Errors, Duration) and **USE** for resources (Utilization, Saturation, Errors).

## 4. LLM-specific observability

- **Trace every step of an agent run:** a root span per request, child spans for retrieval, each LLM call, each tool call. Record model, prompt version, token counts, cost, cache hit/miss on span attributes.
- **Cost metrics:** tokens and dollars per tenant / feature / model.
- **Quality signals:** online evals on sampled traffic (groundedness, refusal rate, thumbs up/down, escalation-to-human rate), regression dashboards per prompt/model version.
- **Retrieval health:** empty-result rate, similarity score distribution, reranker agreement.
- **Safety:** guardrail trigger rates, PII detections, prompt-injection flags.
- **Privacy:** redact PII before logging prompts; set retention limits.

## 5. Deployment safety

- **Canary / shadow / blue-green** for prompts and models, not just code. Shadow traffic compares new vs old outputs without user impact.
- Version prompts, retrieval configs and model IDs together so any answer can be reproduced.
- Feature flags allow instant rollback of a model change.

## 6. Debugging flow (say this in interviews)

1. Check dashboards: which SLI moved (latency / errors / quality / cost)?
2. Slice by dimension: model version, tenant, region, route.
3. Open a representative trace → find the slow/failed span.
4. Reproduce with the stored inputs, fix, add an eval/regression test.

## 7. Interview check

1. Why is P99 more important than the mean for user-facing chat?
2. Define an SLO for a RAG assistant that includes quality.
3. What attributes would you put on each span in an agent trace?
4. Quality dropped 5% after a model upgrade, with no error spike. How do you detect and handle it?
