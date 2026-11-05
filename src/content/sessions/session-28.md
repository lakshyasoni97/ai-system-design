# Session 28: Serving Optimization Toolbox: Speculative Decoding, Quantization, Parallelism & Disaggregation

> **Status: SKELETON** (content to be written; follow `CONTENT_GUIDELINES.md`)
> - **Phase 2: Production Optimization** | **Week 5** | **Priority:** core | **Session type:** NEW
> - **Module:** Module 4: Models & Serving
> - **Resume anchor:** Self-hosted GKE models vs Vertex Gemini API decision

---

## Part 1: Quick Summary

> TODO (3-4 bullets): what this is in plain English, why interviewers care, the 10-second mental model.

## Part 2: Topics to Cover (Study Checklist)

- [ ] Speculative decoding (draft model, Medusa, EAGLE): wins at low batch, hurts at high batch
- [ ] Quantization: FP8 / INT8 / INT4 (AWQ, GPTQ): quality vs memory vs throughput
- [ ] Parallelism: tensor vs pipeline vs expert vs data; interconnect (NVLink) constraints
- [ ] Chunked prefill and disaggregated prefill/decode pools
- [ ] Multi-LoRA serving: one base model, many adapters
- [ ] Autoscaling signals for GPUs: queue depth and KV utilisation, not CPU
- [ ] Benchmarking correctly: realistic traffic mix, P99, goodput

## Part 3: First Principles & Analogies

TODO: one everyday analogy per concept above, plus a concrete failure scenario.

## Part 4: Concept Blueprint

```mermaid
flowchart LR
    Q["Interview question"] --> C["Serving Optimization Toolbox: core concept"]
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

TODO: how this applies to production AI systems and to **Self-hosted GKE models vs Vertex Gemini API decision**; include a short annotated code or design snippet.

## Part 8: Interview Questions (Answered Simply)

TODO: 4-6 questions, each with **What they are really testing** and **How to answer simply** (spoken-English blockquote).

## Canonical Problems Unlocked

- [inference-serving](/problems?id=inference-serving)
- [finetune-platform](/problems?id=finetune-platform)
- [code-assistant](/problems?id=code-assistant)
- [voice-agent](/problems?id=voice-agent)

## Deliverable (Do This Before Moving On)

- [ ] Optimization decision tree: symptom (TTFT high / TPOT high / OOM / cost) -> technique.

## Socratic Study Prompt

> *"Teach me the LLM serving optimisation toolbox: speculative decoding, FP8/AWQ/GPTQ quantization, tensor/pipeline/expert parallelism, chunked prefill, disaggregated prefill/decode, and multi-LoRA serving. For each give me when it helps, when it hurts, and the numbers."*
