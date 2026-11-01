# Production AI System Design Study Portal (100x Scale Defense)

A fast, local-first, **Git-as-a-Database** interactive study application built for **Lakshya Soni** (Senior AI Engineer — ~3.5 yrs AI/DS + 3 yrs Core Engineering) to prepare for Senior AI System Design interviews covering Distributed Systems, Production RAG, Multi-Agent Orchestration, High-Throughput NLP, and LLMOps.

## Architecture & Core Features

- **Executive Dashboard (`/`)**: Track progress across all 5 Modules and 20 Study Sessions, inspect Flashcard Spaced-Repetition mastery, copy Socratic study prompts in 1 click, and review key formulas.
- **Dynamic Session Study Pages (`/roadmap/[sessionId]`)**: Renders `/src/content/sessions/session-XX.md` with interactive Zoom/Pan `MermaidDiagram` blueprints, `TradeoffTable` matrices, personal scratchpad notes, and session-specific flashcards (`session-01.md` pre-seeded as the gold-standard reference).
- **Spaced-Repetition Flashcard Arena (`/flashcards`)**: Keyboard-first card flipper (`Space` to flip, `1` Hard, `2` Medium, `3` Easy, `←`/`→` navigation) with Module, Project, and Confidence filtering.
- **"Resume Defense" 100x Scale Blueprints (`/projects`)**: Deep-dive defense tabs for Lakshya's 4 flagship projects at **Deloitte** and **Network18**, complete with side-by-side Current vs. 100x Scale Mermaid diagrams, Hard Numbers Cheat Sheets, and Top 5 Hostile Interviewer Q&As.
- **Back-of-the-Envelope Calculator & 45-Min Mock Timer (`/simulator`)**: Interactive Vector DB HNSW RAM Calculator (`N × D × Bytes × 1.5`), LLM QPS/TPM/Cost estimator, and 5-phase 45-minute mock interview pacing tracker.
- **Antigravity Slash Workflow (`.agents/workflows/compile-session.md`)**: Run `/compile-session` after any Socratic study chat to automatically compile notes, diagrams, and flashcards into the repository.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
