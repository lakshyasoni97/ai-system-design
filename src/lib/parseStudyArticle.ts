export type StudyTabId =
  | "intuition"
  | "architecture"
  | "deep-dive"
  | "interview"
  | "all";

export type CoreStudyTabId = Exclude<StudyTabId, "all">;

export interface StudyTabMeta {
  id: CoreStudyTabId;
  label: string;
  shortLabel: string;
  description: string;
}

export const STUDY_TABS: StudyTabMeta[] = [
  {
    id: "intuition",
    label: "1. Intuition",
    shortLabel: "Intuition",
    description: "Problem setup, Socratic walkthrough & plain-English layers",
  },
  {
    id: "architecture",
    label: "2. Core & Architecture",
    shortLabel: "Architecture",
    description: "Mental models, capacity math, diagrams & trade-off tables",
  },
  {
    id: "deep-dive",
    label: "3. Deep Dive & Code",
    shortLabel: "Deep Dive",
    description: "Under-the-hood mechanics, failure modes & production code",
  },
  {
    id: "interview",
    label: "4. Interview Drill",
    shortLabel: "Interview",
    description: "Coaching answers, follow-up probes & rapid-fire recall",
  },
];

export interface ArticleSubHeading {
  id: string;
  title: string;
}

export interface ArticleSection {
  id: string;
  title: string;
  markdown: string;
  tab: CoreStudyTabId;
  subHeadings: ArticleSubHeading[];
}

export interface ParsedArticle {
  introMarkdown: string;
  sections: ArticleSection[];
  availableTabs: CoreStudyTabId[];
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function stripTrailingRule(md: string): string {
  return md.replace(/(?:\r?\n\s*---\s*)+$/g, "").trim();
}

function isFenceLine(line: string): boolean {
  return /^\s*(```|~~~)/.test(line);
}

function classifyHeading(
  rawHeading: string,
  index: number,
  total: number
): CoreStudyTabId {
  const h = rawHeading.toLowerCase();

  if (
    /interview|rapid\s*fire|quick\s*recall|canonical\s*problems|deliverable|socratic\s*study\s*prompt|\bsection\s*f\b|\bsection\s*g\b|\bpart\s*8\b/.test(
      h
    )
  ) {
    return "interview";
  }

  if (
    /deep[-\s]?dive|failure|production\s*ai|resume|\bcode\b|\bmechanics\b|\bsection\s*e\b|\bpart\s*[67]\b/.test(
      h
    )
  ) {
    return "deep-dive";
  }

  if (
    /build\s*it\s*from\s*zero|quick\s*summary|topics\s*to\s*cover|why\s*do\s*we\s*copy|jargon\s*translated|\bsection\s*a\b|\bpart\s*[12]\b/.test(
      h
    )
  ) {
    return "intuition";
  }

  if (
    /first\s*principles|analogies|capacity|visual|blueprint|architecture|diagram|comparison|trade[-\s]?off|decision|choose\s*your|topologies|synchronous|consistency|\bcap\b|pacelc|consistent\s*hashing|row[-\s]?oriented|b-tree|how\s*databases|\bsection\s*[bcd]\b|\bpart\s*[345]\b/.test(
      h
    )
  ) {
    return "architecture";
  }

  if (index === 0) return "intuition";
  if (index < Math.ceil(total / 2)) return "architecture";
  return "deep-dive";
}

function extractSubHeadings(markdown: string): ArticleSubHeading[] {
  const lines = markdown.split(/\r?\n/);
  const result: ArticleSubHeading[] = [];
  let inFence = false;

  for (const line of lines) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^###\s+(.+)$/);
    if (match) {
      const title = match[1].trim();
      result.push({ id: slugifyHeading(title), title });
    }
  }

  return result;
}

export function parseStudyArticle(content: string): ParsedArticle {
  const lines = content.split(/\r?\n/);
  let startIdx = 0;

  // Skip leading H1 (page header renders title)
  while (startIdx < lines.length && lines[startIdx].trim() === "") {
    startIdx++;
  }
  if (startIdx < lines.length && /^#\s+/.test(lines[startIdx])) {
    startIdx++;
  }

  const introLines: string[] = [];
  const rawSections: Array<{ title: string; lines: string[] }> = [];
  let currentSection: { title: string; lines: string[] } | null = null;
  let inFence = false;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (isFenceLine(line)) {
      inFence = !inFence;
    }

    if (!inFence) {
      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        if (currentSection) {
          rawSections.push(currentSection);
        }
        currentSection = { title: h2Match[1].trim(), lines: [] };
        continue;
      }
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (currentSection) {
    rawSections.push(currentSection);
  }

  const introMarkdown = stripTrailingRule(introLines.join("\n"));

  const sections: ArticleSection[] = rawSections.map((sec, idx) => {
    const markdown = stripTrailingRule(sec.lines.join("\n"));
    return {
      id: slugifyHeading(sec.title),
      title: sec.title,
      markdown,
      tab: classifyHeading(sec.title, idx, rawSections.length),
      subHeadings: extractSubHeadings(markdown),
    };
  });

  const presentTabs = new Set(sections.map((s) => s.tab));
  const availableTabs = STUDY_TABS.map((t) => t.id).filter((id) =>
    presentTabs.has(id)
  );

  return {
    introMarkdown,
    sections,
    availableTabs,
  };
}

// --- Sub-block parsing for interactive micro-UI ---

export interface SocraticStep {
  question: string;
  answerMarkdown: string;
}

export interface ExplainLayer {
  label: string;
  shortLabel: string;
  bodyMarkdown: string;
}

export interface TimelineEvent {
  time: string;
  bodyMarkdown: string;
}

export interface InterviewQAItem {
  id: string;
  title: string;
  bodyMarkdown: string;
}

export interface RapidFireItem {
  prompt: string;
  answer: string;
}

export type SectionBlock =
  | { type: "markdown"; markdown: string }
  | {
      type: "socratic";
      id: string;
      heading: string;
      steps: SocraticStep[];
    }
  | {
      type: "layers";
      id: string;
      heading: string;
      layers: ExplainLayer[];
    }
  | {
      type: "timeline";
      id: string;
      heading: string;
      events: TimelineEvent[];
      takeawayMarkdown?: string;
    }
  | {
      type: "interview-qa-group";
      items: InterviewQAItem[];
    }
  | {
      type: "rapid-fire";
      id: string;
      heading: string;
      items: RapidFireItem[];
    };

function splitByH3(markdown: string): Array<{
  heading: string | null;
  body: string;
}> {
  const lines = markdown.split(/\r?\n/);
  const parts: Array<{ heading: string | null; lines: string[] }> = [];
  let current: { heading: string | null; lines: string[] } = {
    heading: null,
    lines: [],
  };
  let inFence = false;

  for (const line of lines) {
    if (isFenceLine(line)) {
      inFence = !inFence;
    }
    if (!inFence) {
      const m = line.match(/^###\s+(.+)$/);
      if (m) {
        if (current.heading !== null || current.lines.join("\n").trim() !== "") {
          parts.push(current);
        }
        current = { heading: m[1].trim(), lines: [] };
        continue;
      }
    }
    current.lines.push(line);
  }
  if (current.heading !== null || current.lines.join("\n").trim() !== "") {
    parts.push(current);
  }

  return parts.map((p) => ({
    heading: p.heading,
    body: p.lines.join("\n").trim(),
  }));
}

function tryParseSocraticLadder(
  heading: string,
  body: string
): SocraticStep[] | null {
  if (!/socratic\s*ladder/i.test(heading)) return null;

  const lines = body.split(/\r?\n/);
  const steps: SocraticStep[] = [];
  let currentQ: string | null = null;
  let answerLines: string[] = [];

  for (const line of lines) {
    const qMatch = line.match(/^\*\*🤔\s*(.+?)\*\*\s*$/);
    if (qMatch) {
      if (currentQ) {
        steps.push({
          question: currentQ,
          answerMarkdown: answerLines.join("\n").trim(),
        });
      }
      currentQ = qMatch[1].trim();
      answerLines = [];
    } else if (currentQ) {
      answerLines.push(line);
    }
  }

  if (currentQ) {
    steps.push({
      question: currentQ,
      answerMarkdown: answerLines.join("\n").trim(),
    });
  }

  return steps.length >= 2 ? steps : null;
}

function shortenLayerLabel(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("12-year")) return "12-Year-Old";
  if (lower.includes("non-backend") || lower.includes("non-tech"))
    return "Non-Backend";
  if (lower.includes("engineer")) return "Engineer";
  return label.replace(/\s*\([^)]*\)/g, "").trim() || label;
}

function tryParseExplainInLayers(
  heading: string,
  body: string
): ExplainLayer[] | null {
  if (!/explain\s*it\s*in\s*layers/i.test(heading)) return null;

  const lines = body.split(/\r?\n/);
  const layers: ExplainLayer[] = [];
  let current: { label: string; lines: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(/^-\s+\*\*([^*:]+):?\*\*:?\s*(.*)$/);
    if (m) {
      if (current) {
        layers.push({
          label: current.label,
          shortLabel: shortenLayerLabel(current.label),
          bodyMarkdown: current.lines.join("\n").trim(),
        });
      }
      const cleanLabel = m[1].replace(/:$/, "").trim();
      current = {
        label: cleanLabel,
        lines: m[2] ? [m[2].trim()] : [],
      };
    } else if (current && line.trim()) {
      current.lines.push(line.trim());
    }
  }

  if (current) {
    layers.push({
      label: current.label,
      shortLabel: shortenLayerLabel(current.label),
      bodyMarkdown: current.lines.join("\n").trim(),
    });
  }

  return layers.length >= 2 ? layers : null;
}

function tryParseTimestampedStory(
  heading: string,
  body: string
): { events: TimelineEvent[]; takeawayMarkdown?: string } | null {
  if (!/timestamped|alice\s*&\s*bob/i.test(heading)) return null;

  const lines = body.split(/\r?\n/);
  const events: TimelineEvent[] = [];
  const trailingLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Must be a top-level bullet starting with backticked timestamp
    const timeMatch = line.match(/^-\s+`([^`]+)`\s*[—–-]\s*(.+)$/);
    if (timeMatch) {
      events.push({
        time: timeMatch[1].trim(),
        bodyMarkdown: timeMatch[2].trim(),
      });
    } else if (events.length > 0) {
      trailingLines.push(line);
    } else {
      // Intro prose before bullets means mixed structure (like fund-04); keep normal markdown
      return null;
    }
  }

  if (events.length < 2) return null;

  return {
    events,
    takeawayMarkdown: trailingLines.length
      ? trailingLines.join("\n").trim()
      : undefined,
  };
}

function tryParseRapidFire(
  heading: string,
  body: string
): RapidFireItem[] | null {
  if (!/rapid\s*fire/i.test(heading)) return null;

  const lines = body.split(/\r?\n/);
  const items: RapidFireItem[] = [];
  let currentPrompt: string | null = null;
  let answerLines: string[] = [];

  for (const line of lines) {
    const qLine = line.match(/^-\s+\*\*Q:\s*(.+?)\*\*\s*(.*)$/i);
    if (qLine) {
      if (currentPrompt) {
        items.push({
          prompt: currentPrompt,
          answer: answerLines.join(" ").trim(),
        });
      }
      currentPrompt = qLine[1].trim();
      answerLines = qLine[2]?.trim() ? [qLine[2].trim()] : [];
      continue;
    }

    const aLine = line.match(/^\s*-\s+\*\*A:\*\*\s*(.+)$/i);
    if (aLine && currentPrompt) {
      answerLines.push(aLine[1].trim());
      continue;
    }

    // Single-line format: - **Prompt?** — Answer or - **Q:** ...
    const singleBullet = line.match(/^-\s+(.+)$/);
    if (singleBullet && !currentPrompt) {
      const raw = singleBullet[1].trim();
      const splitDash = raw.split(/\s+[—–]\s+/);
      if (splitDash.length >= 2) {
        items.push({
          prompt: splitDash[0].replace(/\*\*/g, "").trim(),
          answer: splitDash.slice(1).join(" — ").trim(),
        });
      }
    } else if (currentPrompt && line.trim()) {
      answerLines.push(line.trim());
    }
  }

  if (currentPrompt) {
    items.push({
      prompt: currentPrompt,
      answer: answerLines.join(" ").trim(),
    });
  }

  return items.length >= 2 ? items : null;
}

function isInterviewQuestionHeading(heading: string): boolean {
  return /^(Q\d+|Question\s*\d+)\s*[:.—–-]/i.test(heading);
}

export function parseSectionBlocks(section: ArticleSection): SectionBlock[] {
  const parts = splitByH3(section.markdown);
  const blocks: SectionBlock[] = [];
  let pendingQAItems: InterviewQAItem[] = [];

  const flushQAItems = () => {
    if (pendingQAItems.length > 0) {
      blocks.push({
        type: "interview-qa-group",
        items: pendingQAItems,
      });
      pendingQAItems = [];
    }
  };

  for (const part of parts) {
    if (!part.heading) {
      flushQAItems();
      if (part.body) {
        blocks.push({ type: "markdown", markdown: part.body });
      }
      continue;
    }

    const socratic = tryParseSocraticLadder(part.heading, part.body);
    if (socratic) {
      flushQAItems();
      blocks.push({
        type: "socratic",
        id: slugifyHeading(part.heading),
        heading: part.heading,
        steps: socratic,
      });
      continue;
    }

    const layers = tryParseExplainInLayers(part.heading, part.body);
    if (layers) {
      flushQAItems();
      blocks.push({
        type: "layers",
        id: slugifyHeading(part.heading),
        heading: part.heading,
        layers,
      });
      continue;
    }

    const timeline = tryParseTimestampedStory(part.heading, part.body);
    if (timeline) {
      flushQAItems();
      blocks.push({
        type: "timeline",
        id: slugifyHeading(part.heading),
        heading: part.heading,
        events: timeline.events,
        takeawayMarkdown: timeline.takeawayMarkdown,
      });
      continue;
    }

    const rapidFire = tryParseRapidFire(part.heading, part.body);
    if (rapidFire) {
      flushQAItems();
      blocks.push({
        type: "rapid-fire",
        id: slugifyHeading(part.heading),
        heading: part.heading,
        items: rapidFire,
      });
      continue;
    }

    if (
      section.tab === "interview" &&
      isInterviewQuestionHeading(part.heading) &&
      part.body
    ) {
      pendingQAItems.push({
        id: slugifyHeading(part.heading),
        title: part.heading,
        bodyMarkdown: part.body,
      });
      continue;
    }

    flushQAItems();
    const md = `### ${part.heading}\n\n${part.body}`.trim();
    blocks.push({ type: "markdown", markdown: md });
  }

  flushQAItems();
  return blocks;
}
