# Session 30: Online Evaluation & the Data Flywheel: A/B Tests, Implicit Feedback & Production Monitoring

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 2: Production Optimization** | **Week 7** | **Priority:** core | **Session type:** NEW
> - **Module:** Module 5: LLMOps, Evals, Security & Mocks
> - **Resume anchor:** Deloitte multi-agent evals & LLMOps (extend offline story to online)

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Implicit signals: copy, regenerate, edits, abandonment, escalation, thumbs
- [ ] A/B tests for LLM features: metric choice, variance, novelty, guardrail metrics
- [ ] Interleaving and shadow evaluation for retrieval / ranking
- [ ] Sampled production judging and human review queues
- [ ] Drift detection: input, retrieval, output and judge-score drift
- [ ] Canary / shadow / progressive rollout of prompts and models
- [ ] Turning production failures into regression tests (the flywheel)

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Online Evaluation & the Data Flywheel: core concept"]
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

TODO: how this applies to production AI systems and to **Deloitte multi-agent evals & LLMOps (extend offline story to online)**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [eval-platform](/problems?id=eval-platform)
- [llm-search-recsys](/problems?id=llm-search-recsys)
- [chat-assistant](/problems?id=chat-assistant)

## Deliverable (Do This Before Moving On)

- [ ] Experiment design doc: A/B test of a new prompt with metrics, sample size, rollback.

## Socratic Study Prompt

> *"Teach me online evaluation for LLM products: implicit feedback signals, A/B and interleaving tests, sampled production judging, drift detection, canary and shadow rollout, and the data flywheel. Then ask me how I would A/B test a new prompt for 1M users/day."*
