# Session 06: Hybrid Retrieval & Two-Stage Reranking: BM25 + Dense, RRF, Cross-Encoders

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 1: Foundational Building Blocks** | **Week 3** | **Priority:** core | **Session type:** existing (upgraded scope)
> - **Module:** Module 2: RAG, Search & Multimodal
> - **Resume anchor:** Network18 Sales Intelligence RAG & Financial News

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Sparse (BM25/SPLADE) vs dense vs hybrid and Reciprocal Rank Fusion
- [ ] Stage 1 recall (top 100-1000) vs Stage 2 precision (top 5-20)
- [ ] Cross-encoder and LLM rerankers: latency/cost math, batching, distillation
- [ ] Retrieval metrics: recall@k, MRR, nDCG and how to build a labelled set
- [ ] Latency budget allocation across retrieve -> rerank -> generate
- [ ] Caching and early-exit strategies in the rerank stage

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Hybrid Retrieval & Two-Stage Reranking: core concept"]
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

TODO: how this applies to production AI systems and to **Network18 Sales Intelligence RAG & Financial News**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [enterprise-rag](/problems?id=enterprise-rag)
- [answer-engine](/problems?id=answer-engine)
- [llm-search-recsys](/problems?id=llm-search-recsys)

## Deliverable (Do This Before Moving On)

- [ ] Two-stage pipeline diagram with a per-stage latency/cost budget.

## Socratic Study Prompt

> *"Teach me two-stage retrieval: hybrid BM25 + dense recall (RRF), then cross-encoder / LLM reranking. Show the latency and cost math for reranking top-100 and ask me to design the pipeline for a 100M-document corpus under a 1.5s budget."*
