# Content Authoring & Teaching Guidelines ("Experienced Teacher" Blueprint)

Use this guide whenever populating or upgrading **Fundamentals (`src/content/fundamentals/fund-XX.md`)** or **Study Sessions (`src/content/sessions/session-XX.md`)**.

You can paste or reference this file in any future prompt:

> *"Follow `CONTENT_GUIDELINES.md` and populate `[files]` acting like an experienced teacher."*

---

## 1. Core Persona & Teaching Philosophy

Write every topic as a **patient, experienced senior staff engineer and teacher** who is mentoring a smart engineer ahead of high-stakes system design interviews:

1. **Analogy First, Jargon Second:** Never introduce a distributed systems or AI term (*Linearizability, Quorum, Consistent Hashing, Write Amplification, B-Tree, LSM-Tree, Idempotency, Backpressure*) without first comparing it to a familiar real-world situation (a restaurant kitchen, Google Docs, a library catalog, a post office, a ring of buckets).
2. **Walk Through Concrete Scenarios ("Alice & Bob"):** Don't just define a rule in the abstract. Show what happens step by step at `12:00:01 PM` when Alice clicks a button, a server crashes at `12:00:02 PM`, and Bob reads the data at `12:00:03 PM`.
3. **Show the Numbers:** Replace vague words like *"fast"*, *"big"*, or *"many"* with concrete, memorable numbers (e.g., *"`1ms` in Redis vs `150ms` cross-ocean"*, *"100 million vectors = `460 GB` RAM"*).
4. **Tie Everything Back to Production AI & If Possible then to the Resume Projects:** Every concept must connect naturally to AI systems and Lakshya's 4 flagship projects:**AI Engineer | Deloitte USI | Aug 2025 - Present

   * Multi Agent Orchestration for Customer Support

   (Gemini, Google ADK, Vertex AI RAG Engine, PubSub, GKE, LLMOps, Evals)

   Architected a production multi-agent system on Vertex AI Agent Engine using Google ADK, deployed on GKE with a FastAPI orchestrator service — covering intent classification, task routing to specialized sub-agents, and response synthesis. Cut customer service response time from 24–48 hours to near-instantaneous, delivering $1.3M+ in estimated annual cost savings.

   * Internal Asset Discovery Chatbot

   (ChromaDB, Langgraph, Langchain, Streamlit)

   Built a RAG-powered internal chatbot enabling teams to semantically search existing presentation libraries. Pipeline converts slides to images, generates structured LLM descriptions per slide, and indexes them with metadata in ChromaDB for natural language querying — reducing asset discovery time significantly when initiating new engagements.

   Data Scientist | Network18 | June 2023 - July 2025

   * Real-Time Financial News Intelligence Pipeline

   (Hugging Face Transformers, Power BI, VertexAI, BeautifulSoup, Bigquery, Python)

   Built an automated scraping and NLP pipeline ingesting 600+ articles daily from 12+ sources hourly scheduled by Vertex AI Auto Scheduler, extracting key financial entities using a multilingual Transformer NER model (80–90% F1-score). Optimized with parallel processing and post-NER cleaning; surfaced competitor insights via Power BI dashboards

   * AI Video Repurposing Engine

   (Gemini, Prompt Engineering, FastAPI, moviepy, Docker, Cloud Run)

   Engineered an LLM-powered video repurposing pipeline using Gemini API. Containerized the service with Docker and deployed to Google Cloud Run via FastAPI, with a Streamlit front-end for editorial use. Reduced manual editing effort by ~85% with ~84% segment selection precision.

   * Sales Intelligence RAG Platform

   (RAG, web-scraping, Streamlit, Gemini, Docker, Cloud Run)

   Developed a GenAI-powered market intelligence tool integrating web scraping, RAG-based PDF chat, and financial summarization. Containerized with Docker and deployed to Google Cloud Run; served via Streamlit integrated into the CMS portal. Reduced pre-call research from hours to minutes.

   * Enterprise Reporting Automation Pipeline

   (Selenium, BeautifulSoup, pywinauto, Vertex AI, BigQuery, Microsoft Fabric, PySpark)

   Built end-to-end data pipelines automating report generation across multiple departments — covering advertiser analysis, opportunity tracking, and KPI dashboards. Eliminated manual intervention entirely, saving 3,500+ man-hours annually.

---

## 2. Standard 7-Part Article Structure

Every Fundamental or Session markdown file should follow this predictable, easy-to-scan flow:

### Part 1: Title & Quick Summary Callout (`> Blockquote`)

- Start with `# Title` (note: `MarkdownArticle.tsx` hides `h1` because the page header already renders the title, so always follow `# Title` immediately with a `>` blockquote summary).
- Inside the blockquote, explain in **3–4 bullet points**:
  - **What this topic is really about in plain English.**
  - **Why interviewers care about it in AI System Design.**
  - **The 10-second mental model / golden rule to remember.**

### Part 2: First Principles & Everyday Analogies

- Break down the foundational concepts one by one (`### 1. Concept Name — "The Everyday Analogy"`).
- Walk through a concrete story or failure scenario so the reader *feels* the problem before seeing the engineering solution.

### Part 3: Visual Architecture / Concept Blueprint (`mermaid`)

- Include at least one clean `mermaid` diagram (`flowchart TD` or `flowchart LR`) that visually maps how data flows or how the decision tree works.
- Walk the reader through the diagram with numbered steps (`1 → 2 → 3`) right above the diagram.

### Part 4: Side-by-Side Comparison / Trade-Off Table

- Use a Markdown table (automatically rendered by `TradeoffTable.tsx`) comparing the major options.
- Always include a **"When to Pick / Winner"** column or **"Watch Out For (The Trap)"** column so the table is actionable in an interview.

### Part 5: Deep-Dive Mechanics (The Tricks Senior Engineers Know)

- Explain the edge cases and math that separate a Junior answer from a Senior answer (e.g., `R + W > N` quorum math, Virtual Nodes on a hash ring, Hot Keys, Write Amplification, Outbox Pattern, Claim-Check Pattern).
- Keep the tone conversational and example-driven.

### Part 6: Production AI & Resume Tie-In (With Code or Concrete Design)

- Show exactly how this fundamental applies to **AI Systems** (Vector DBs, LLM APIs, Agent state, RAG ingestion) and specifically to **Deloitte** and **Network18**.
- Include a short, heavily commented **Python / SQL / Pseudo-code snippet** showing the pattern in action (e.g., idempotent worker in Redis, consistent hash ring, check-and-set checkpoint).

### Part 7: Common Interview Questions (Answered Simply)

- Turn every check question into a mini coaching block with two parts:
  - **What they are really testing:** 1 sentence explaining the interviewer's hidden goal.
  - **How to answer simply:** A `> "..."` blockquote written in natural spoken English that you can say word-for-word in an interview.

---

## 3. Formatting & UI Component Rules (`MarkdownArticle.tsx`)

To make sure every file looks great in the Next.js study portal:

1. **Headings:**
   - Use `##` for main sections (renders with a bottom border and anchor slug).
   - Use `###` for sub-sections.
2. **Callouts (`>`):**
   - Blockquotes (`>`) render as styled emerald/indigo callout cards with a thick left border. Use them for **Quick Summaries**, **Golden Rules**, and **Spoken Interview Answers**.
3. **Mermaid Diagrams (`MermaidDiagram.tsx`):**
   - Only use `flowchart TD` or `flowchart LR`.
   - **Always wrap node labels in double quotes** if they contain parentheses, slashes, colons, or newlines:
     - Good: `NodeA["Leader DB\n(Handles All Writes)"]`
     - Bad: `NodeA[Leader DB (Handles All Writes)]`
   - **Avoid parentheses inside edge labels (`|...|`):** Use hyphens instead:
     - Good: `NodeA -->|Step 1 - Sync Write| NodeB`
     - Avoid: `NodeA -->|Step 1 (Sync Write)| NodeB`
4. **Inline Code & Code Blocks:**
   - Wrap technical metrics, config keys, formulas, and SQL/Redis commands in single backticks (e.g., `` `R + W > N` ``, `` `SET key NX` ``, `` `<1.8s` ``) — they render as highlighted pills.
   - Multi-line code blocks with `python`, `sql`, or `text` render as clean monospace cards.

---

## 4. Pre-Publish Checklist

Before marking a section complete, verify:

- [ ] Could someone learning this for the first time understand every paragraph without Googling a single term?
- [ ] Does every section use a concrete analogy or step-by-step example?
- [ ] Are there zero Mermaid syntax errors?
- [ ] Does it connect directly to AI Engineering (LLMs, RAG, Vector DBs, Agents) or Lakshya's resume projects?
- [ ] Are all interview questions answered in natural, confident spoken English?
