# Content Authoring & Teaching Guidelines ("Experienced Teacher" Blueprint)

Use this guide whenever populating or upgrading **Fundamentals (`src/content/fundamentals/fund-XX.md`)** or **Study Sessions (`src/content/sessions/session-XX.md`)**.

---

## 1. Core Persona & Teaching Philosophy

Write every topic as a **patient, experienced senior staff engineer and teacher** who is mentoring a smart engineer ahead of high-stakes AI and distributed systems design interviews:

1. **Analogy First, Jargon Second:** Never introduce a distributed systems or AI term (*Linearizability, Quorum, Consistent Hashing, Write Amplification, B-Tree, LSM-Tree, Idempotency, Backpressure, KV-Cache, Speculative Decoding*) without first comparing it to a familiar real-world situation. **Invent a fresh, domain-accurate analogy for each concept** rather than reusing the same restaurant or library analogy across multiple files.
2. **Walk Through Concrete Scenarios ("Alice & Bob"):** Don't just define a rule in the abstract. Show what happens step by step at `12:00:01.000 PM` when Alice clicks a button, a node crashes at `12:00:01.200 PM`, and Bob reads the data at `12:00:01.500 PM`.
3. **Show the Numbers & Ground in Real Engines:** Replace vague words like *"fast"*, *"big"*, or *"many"* with concrete, memorable numbers (e.g., *"`0.5ms` in Redis vs `150ms` cross-region"*, *"100M 768-d float32 vectors = `~307 GB` raw + HNSW graph overhead = `~450 GB` RAM"*). Anchor mechanics in real production systems (e.g., how **DynamoDB, Kafka, RocksDB, Qdrant, or vLLM** actually implement it under the hood) rather than generic theory.
4. **Tie Back to Production AI & Resume Projects Selectively:** Connect every concept to production AI systems (RAG pipelines, Vector DBs, Agent orchestration, LLM serving, Evals). Where architectural fit is genuine, anchor the example to **1 or 2** of Lakshya's 6 flagship projects below. **Never force an unnatural connection**—pick only the project where the underlying engineering pattern truly applies:

### Reference Projects (Select Only 1–2 Relevant Per File)

**AI Engineer | Deloitte USI | Aug 2025 – Present**
* **Multi-Agent Orchestration for Customer Support** *(Gemini, Google ADK, Vertex AI RAG Engine, Pub/Sub, GKE, FastAPI, LLMOps, Evals)*
  * *Architecture:* Production multi-agent system on Vertex AI Agent Engine using Google ADK, deployed on GKE with a FastAPI orchestrator service covering intent classification, task routing to specialized sub-agents, and response synthesis. Cut response time from 24–48 hours to near-instantaneous ($1.3M+ annual savings).
  * *Best fit for:* Async queues (Pub/Sub), orchestration state, retries/idempotency, rate limiting, circuit breakers, agent guardrails, tail latency, and evaluation pipelines.
* **Internal Asset Discovery Chatbot** *(ChromaDB, LangGraph, LangChain, Vision LLMs, Streamlit)*
  * *Architecture:* RAG-powered internal search over presentation libraries. Pipeline converts slides to images, generates structured LLM descriptions per slide, and indexes them with rich metadata in ChromaDB for semantic + metadata querying.
  * *Best fit for:* Vector indexing (HNSW/IVF), hybrid search, chunking/embedding pipelines, metadata filtering, cache invalidation, and ingestion idempotency.

**Data Scientist | Network18 | June 2023 – July 2025**
* **Real-Time Financial News Intelligence Pipeline** *(Hugging Face Transformers, Vertex AI Auto Scheduler, BeautifulSoup, BigQuery, Power BI, Python)*
  * *Architecture:* Automated scraping and NLP pipeline ingesting 600+ articles daily from 12+ sources on an hourly schedule, extracting financial entities via a multilingual Transformer NER model (80–90% F1-score) with parallel processing and post-NER deduplication/cleaning into BigQuery.
  * *Best fit for:* Batch vs. stream scheduling, deduplication, idempotent ingestion, worker parallelism, OLAP storage (BigQuery), and throughput optimization.
* **AI Video Repurposing Engine** *(Gemini API, Prompt Engineering, FastAPI, moviepy, Docker, Google Cloud Run, Streamlit)*
  * *Architecture:* Containerized LLM video processing pipeline on Cloud Run that analyzes long-form video, selects high-value segments (~84% precision), and cuts clips automatically—reducing manual editing effort by ~85%.
  * *Best fit for:* Long-running async jobs, claim-check pattern (blob storage + task pointers), serverless cold starts/autoscaling, and multimodal token budgeting.
* **Sales Intelligence RAG Platform** *(RAG, Web Scraping, Gemini, Streamlit, Docker, Cloud Run)*
  * *Architecture:* GenAI market intelligence tool combining live web scraping, PDF RAG chat, and financial summarization integrated into the internal CMS portal, cutting pre-call research from hours to minutes.
  * *Best fit for:* Low-latency RAG retrieval, prompt caching, context-window management, and multi-source data fusion.
* **Enterprise Reporting Automation Pipeline** *(PySpark, Microsoft Fabric, BigQuery, Vertex AI, Selenium, BeautifulSoup, pywinauto)*
  * *Architecture:* End-to-end distributed data pipelines automating cross-department advertiser analysis, opportunity tracking, and KPI dashboards—saving 3,500+ man-hours annually.
  * *Best fit for:* Distributed data partitioning, shuffle bottlenecks, fault-tolerant ETL, and data warehouse schema design.

---

## 2. Standard 7-Part Article Structure

Every Fundamental (`fund-XX.md`) or Session (`session-XX.md`) file must follow this 7-part structure so it scans cleanly in the portal:

### Part 1: Title, Prerequisites & Quick Summary Callout (`> Blockquote`)
* Start with `# Title` (Note: `MarkdownArticle.tsx` hides `h1` because the page header renders the title, so always follow `# Title` immediately with a `>` blockquote summary).
* Inside the blockquote, include **4 crisp bullet points**:
  * **Prerequisites:** 2–3 foundational concepts to know first (and a 1-line reminder of what they mean).
  * **Plain-English Core:** What this topic is really about in one sentence.
  * **Why Interviewers Care:** Why this makes or breaks an AI System Design interview.
  * **The 10-Second Mental Model:** The golden rule to remember under pressure.

### Part 2: First Principles, Analogies & Capacity Math
* **For `fund-XX.md` (Fundamentals):**
  * Break down foundational concepts one by one (`### 1. Concept Name — "The Everyday Analogy"`).
  * Walk through a timestamped story so the reader *feels* the problem before seeing the engineering solution.
  * Include a **"Back-of-the-Envelope Rule of Thumb"** showing how to estimate memory, latency, or throughput for this component in 15 seconds.
* **For `session-XX.md` (System Design Case Studies):**
  * Define **Functional & Non-Functional Requirements** (latency SLAs, availability vs. consistency, scale).
  * Show full **Capacity & Scale Estimations** (DAU, average/peak QPS, token throughput, vector RAM sizing, and storage math).

### Part 3: Visual Architecture / Concept Blueprint (`mermaid`)
* Walk the reader through the flow with numbered steps (`1 → 2 → 3`) **right above** the diagram.
* Include at least one clean `mermaid` diagram (`flowchart TD` or `flowchart LR`) mapping the data flow, failure recovery, or decision tree.

### Part 4: Side-by-Side Comparison / Trade-Off Table
* Use a Markdown table (rendered by `TradeoffTable.tsx`) comparing the major architectural options.
* Always include an actionable **"When to Pick / Winner"** column and a **"Watch Out For (The Trap)"** column so trade-offs are easy to vocalize in an interview.

### Part 5: Deep-Dive Mechanics & Production Failure Analysis
* **Under-the-Hood Tricks:** Explain the math and edge cases that separate a Junior answer from a Senior Staff answer (e.g., `R + W > N` quorum math, Virtual Nodes on a hash ring, Hot Keys, Write Amplification, Outbox Pattern, Claim-Check Pattern, HNSW `efSearch` vs. recall trade-offs).
* **What Breaks in Production at 2 AM:** Explicitly detail **2 real-world failure modes** (e.g., split-brain, thundering herd, OOM on vector index rebuild, poison pill messages in Pub/Sub), how to detect them via metrics, and the exact mitigation.

### Part 6: Production AI & Resume Tie-In (With Complete Code)
* Show how this pattern operates inside modern AI infrastructure and **1–2 genuinely relevant resume projects** (from Deloitte or Network18).
* Include a **complete, runnable-style Python, SQL, or Redis snippet** (25–45 lines) with heavy inline comments explaining *why* each line exists.
* **Zero Placeholders:** Never write `# TODO` or `# ... rest of implementation here`. Write the actual retry loop, Redis Lua script, async lock, or SQL query.

### Part 7: Common Interview Questions, Follow-Up Probes & Quick Recall
* Include **at least 3 high-signal interview questions** (1 foundational, 1 failure/edge-case, 1 AI-scale trade-off).
* Format each question as a three-part coaching block:
  * **What they are really testing:** 1 sentence revealing the interviewer's hidden signal.
  * **How to answer simply:** A `> "..."` blockquote written in natural, first-person spoken English ready to say word-for-word.
  * **Likely Follow-Up Probe ("The Double-Click"):** The follow-up question a senior interviewer will ask next to test your depth, plus a crisp 2-sentence answer.
* **End with a `### 60-Second Rapid Fire (Self-Check)` block:** 3 ultra-short bulleted Q&As (1 line each) to lock in retention after reading.

---

## 3. Formatting, UI Component & Anti-Laziness Rules

To ensure every file renders cleanly in the Next.js study portal (`MarkdownArticle.tsx`, `MermaidDiagram.tsx`, `TradeoffTable.tsx`):

1. **Headings:**
   * Use `##` for the 7 main parts (renders with a bottom border and anchor slug).
   * Use `###` for sub-sections and individual interview questions.
2. **Callouts (`>`):**
   * Blockquotes (`>`) render as styled emerald/indigo callout cards with a thick left border. Use them for **Quick Summaries**, **Golden Rules**, and **Spoken Interview Answers**.
3. **Mermaid Diagrams (`MermaidDiagram.tsx`):**
   * Only use `flowchart TD` or `flowchart LR`.
   * **Always wrap node labels in double quotes** if they contain parentheses, slashes, colons, or line breaks:
     * Good: `NodeA["Leader DB\n(Handles All Writes)"]`
     * Bad: `NodeA[Leader DB (Handles All Writes)]`
   * **Never use parentheses inside edge labels (`|...|`):** Use hyphens instead:
     * Good: `NodeA -->|Step 1 - Sync Write| NodeB`
     * Avoid: `NodeA -->|Step 1 (Sync Write)| NodeB`
4. **Inline Code & Code Blocks:**
   * Wrap technical metrics, config keys, complexities, formulas, and SQL/Redis commands in single backticks (e.g., `` `R + W > N` ``, `` `SET key val NX EX 30` ``, `` `O(log N)` ``, `` `<150ms` ``) so they render as highlighted pills.
   * Use fenced multi-line code blocks with `python`, `sql`, `bash`, or `text`.
5. **Anti-Laziness & Completeness Guardrails:**
   * **Never truncate or summarize Parts 5, 6, or 7** to save output tokens. Every part must be written at full depth.
   * **No hand-waving in code:** Code snippets must demonstrate real mechanics (e.g., idempotency keys, exponential backoff with jitter, token bucket math), not empty wrapper functions.

---

## 4. Pre-Publish Quality Checklist

Before completing any markdown file, verify:

- [ ] Could an engineer learning this concept for the first time understand every paragraph without Googling a single term?
- [ ] Does Part 1 list prerequisites and a 10-second mental model inside a `>` blockquote?
- [ ] Does every concept use a fresh analogy, a timestamped step-by-step scenario, and concrete numbers grounded in real tools (Kafka, Redis, DynamoDB, Qdrant, vLLM)?
- [ ] Are all Mermaid node labels wrapped in `"..."` and all edge labels `|...|` free of parentheses?
- [ ] Does Part 5 cover both under-the-hood math AND "What Breaks at 2 AM" production failure modes?
- [ ] Does Part 6 connect naturally to AI Systems and 1–2 relevant Deloitte/Network18 projects with a complete, placeholder-free code snippet?
- [ ] Does Part 7 include 3 spoken-English interview answers, follow-up probes, and a 60-second rapid-fire self-check?