# Session 27: Model Adaptation: Prompt vs RAG vs LoRA/QLoRA vs DPO vs Distillation

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 1: Foundational Building Blocks** | **Week 4** | **Priority:** core | **Session type:** NEW
> - **Module:** Module 4: Models & Serving
> - **Resume anchor:** Network18 multilingual Transformer NER (fine-tuning) -> LLM fine-tuning generalisation

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Decision ladder: prompt -> few-shot -> RAG -> SFT (LoRA/QLoRA) -> preference tuning (DPO) -> distillation
- [ ] LoRA/QLoRA mechanics: rank, adapters, memory savings, multi-adapter serving
- [ ] SFT vs preference optimisation (RLHF/DPO) vs RL on verifiable rewards: what each fixes
- [ ] Data: how much, quality > quantity, synthetic data pipelines, contamination
- [ ] Distilling a big model into a small one for cost/latency (classification, routing, extraction)
- [ ] Eval gates, regression tests and rollback for fine-tuned models
- [ ] Catastrophic forgetting, over-fitting, and knowledge vs behaviour (what fine-tuning can't add)

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Model Adaptation: core concept"]
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

TODO: how this applies to production AI systems and to **Network18 multilingual Transformer NER (fine-tuning) -> LLM fine-tuning generalisation**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [finetune-platform](/problems?id=finetune-platform)
- [content-moderation](/problems?id=content-moderation)
- [inference-serving](/problems?id=inference-serving)

## Deliverable (Do This Before Moving On)

- [ ] Decision matrix: prompt/RAG/fine-tune/distill by task type, data size and cost.

## Socratic Study Prompt

> *"Give me a decision framework for prompt engineering vs RAG vs fine-tuning vs distillation. Teach LoRA/QLoRA, SFT vs DPO, data requirements, and eval gates. Then ask me: 'When would you fine-tune instead of using RAG?' and grill my answer."*
