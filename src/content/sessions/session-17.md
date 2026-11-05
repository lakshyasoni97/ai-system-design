# Session 17: Offline Evaluation: Golden Sets, Synthetic Data, Retrieval Metrics, RAG Triad & Judge Calibration

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 2: Production Optimization** | **Week 7** | **Priority:** core | **Session type:** existing (upgraded scope)
> - **Module:** Module 5: LLMOps, Evals, Security & Mocks
> - **Resume anchor:** Deloitte Multi-Agent Evals & LLMOps

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Building golden datasets and synthetic test generation
- [ ] Retrieval metrics (recall@k, MRR, nDCG) vs generation metrics
- [ ] RAG triad: context relevance, groundedness, answer relevance
- [ ] LLM-as-judge: rubric design, position/verbosity bias, calibration (Cohen's kappa)
- [ ] Agent evals: trajectory, tool-call accuracy, task success, cost
- [ ] Regression gates in CI and eval-driven development

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Offline Evaluation: core concept"]
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

TODO: how this applies to production AI systems and to **Deloitte Multi-Agent Evals & LLMOps**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [eval-platform](/problems?id=eval-platform)
- [enterprise-rag](/problems?id=enterprise-rag)
- [support-agent](/problems?id=support-agent)

## Deliverable (Do This Before Moving On)

- [ ] Eval plan for an enterprise RAG: datasets, metrics, thresholds, CI gate.

## Socratic Study Prompt

> *"I have Evals and LLMOps on my resume. Teach me how to design an automated offline + online Evaluation Pipeline: building a Golden Dataset, RAG triad metrics (Context Relevance, Groundedness, Answer Relevance), and fixing LLM-as-a-Judge biases (position bias, verbosity bias)."*
