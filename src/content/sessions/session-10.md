# Session 10: Agent State, Memory Tiers & Durable Execution

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 1: Foundational Building Blocks** | **Week 4** | **Priority:** core | **Session type:** existing (upgraded scope)
> - **Module:** Module 3: Agents, Memory & Latency
> - **Resume anchor:** Deloitte FastAPI Orchestrator on GKE

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Working / episodic / semantic / procedural memory and where each lives
- [ ] Checkpointing and resume semantics (LangGraph checkpointers, Redis/Postgres)
- [ ] Durable execution engines (Temporal-style) vs queue + state machine
- [ ] Memory write policy: what to store, summarise, expire, and verify
- [ ] Retrieval over memory: recency/importance/relevance scoring
- [ ] Multi-session identity, per-user isolation, and privacy/deletion (GDPR)
- [ ] Long-running agent jobs: timeouts, heartbeats, cost caps

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Agent State, Memory Tiers & Durable Execution: core concept"]
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

TODO: how this applies to production AI systems and to **Deloitte FastAPI Orchestrator on GKE**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [ai-memory](/problems?id=ai-memory)
- [deep-research](/problems?id=deep-research)
- [support-agent](/problems?id=support-agent)

## Deliverable (Do This Before Moving On)

- [ ] Memory architecture diagram with write/read/expire policies.

## Socratic Study Prompt

> *"Teach me agent memory and state: working vs episodic vs semantic memory, checkpointing, durable execution (resume after crash), and long-running jobs. Then ask me to design memory for a personal assistant, including how to prevent memory poisoning."*
