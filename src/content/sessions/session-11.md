# Session 11: Latency Engineering: TTFT/TPOT Budgets, Streaming & Speculative Tool Calls

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 2: Production Optimization** | **Week 6** | **Priority:** core | **Session type:** existing (upgraded scope)
> - **Module:** Module 3: Agents, Memory & Latency
> - **Resume anchor:** Deloitte Support (24-48h to Near-Instantaneous)

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Latency budget decomposition for agents (guardrail + router + tools + first token)
- [ ] Streaming UX: SSE vs WebSocket, partial results, intermediate thoughts
- [ ] Parallel tool calls and speculative execution
- [ ] Prefetching and precomputation; warm connections
- [ ] Tail latency: hedging, timeouts, and P99 vs P50
- [ ] Voice-grade latency (<800 ms) as the stress test

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Latency Engineering: core concept"]
    C --> T["Trade-offs and numbers"]
    T --> P["Production pattern"]
    P --> R["Resume bridge"]
```

TODO: replace with the real architecture / decision-tree diagram.

## Part 5: Trade-Off Decision Matrix

| Option / Pattern | Latency | Cost | Complexity | When to Pick / Watch Out For |
| :--- | :--- | :--- | :--- | :--- |
| TODO option A | TODO | TODO | TODO | TODO |
| TODO option B | TODO | TODO | TODO | TODO |
| TODO option C | TODO | TODO | TODO | TODO |

## Part 6: Deep-Dive Mechanics & Numbers

TODO: the math, edge cases and "tricks" that separate a senior answer from a mid-level one.

## Part 7: Production AI & Resume Tie-In

TODO: how this applies to production AI systems and to **Deloitte Support (24-48h to Near-Instantaneous)**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [voice-agent](/problems?id=voice-agent)
- [support-agent](/problems?id=support-agent)
- [chat-assistant](/problems?id=chat-assistant)

## Deliverable (Do This Before Moving On)

- [ ] End-to-end latency waterfall for a 3-tool agent turn with a 2s TTFT target.

## Socratic Study Prompt

> *"In my resume, I cut customer support response time from 24–48 hours to near-instantaneous. Teach me techniques to keep multi-agent Time-To-First-Token (TTFT) under 2 seconds—including parallel tool execution, speculative execution, and streaming intermediate thoughts."*
