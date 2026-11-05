# Session 02: Async Queues & Pub/Sub Internals

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 4: Resume Defense & Mocks** | **Week 9** | **Priority:** solid | **Session type:** existing (upgraded scope)
> - **Module:** Module 1: Backend, Caching & Capacity Planning
> - **Resume anchor:** Network18 AI Video Repurposing Engine

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Resume defense: Network18 video engine behind Pub/Sub
- [ ] At-least-once vs exactly-once, DLQ, idempotency, backpressure
- [ ] Generic mapping: Pub/Sub -> Kafka / SQS / Redis streams
- [ ] Redesign for 5,000 concurrent 1-hour uploads (claim-check pattern)

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Async Queues & Pub/Sub Internals: core concept"]
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

TODO: how this applies to production AI systems and to **Network18 AI Video Repurposing Engine**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [multimodal-pipeline](/problems?id=multimodal-pipeline)

## Deliverable (Do This Before Moving On)

- [ ] Redesign of the video pipeline at 100x with queue + GPU workers.

## Socratic Study Prompt

> *"Teach me Pub/Sub internals: at-least-once vs. exactly-once delivery, Dead Letter Queues (DLQs), idempotency, and backpressure. Then ask me to redesign my Network18 AI Video Repurposing Engine (FastAPI + moviepy + Gemini) so it can handle 5,000 editors uploading 1-hour videos simultaneously without timing out."*
