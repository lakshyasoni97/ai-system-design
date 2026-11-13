import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import curriculumData from "@/data/curriculum.json";
import flashcardsData from "@/data/flashcards.json";
import quizzesData from "@/data/quizzes.json";
import SessionStudyClient from "@/components/SessionStudyClient";
import { QuizQuestion } from "@/components/ScenarioQuiz";

export function generateStaticParams() {
  return curriculumData.modules.flatMap((mod) =>
    mod.sessions.map((s) => ({
      sessionId: s.id,
    }))
  );
}

export default function SessionRoadmapPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const allSessions = curriculumData.modules.flatMap((mod) =>
    mod.sessions.map((s) => ({
      ...s,
      moduleId: mod.id,
      moduleTitle: mod.title,
    }))
  );

  const currentIdx = allSessions.findIndex((s) => s.id === params.sessionId);
  if (currentIdx === -1) {
    notFound();
  }

  const session = allSessions[currentIdx];
  const prevSession = currentIdx > 0 ? allSessions[currentIdx - 1] : null;
  const nextSession =
    currentIdx < allSessions.length - 1 ? allSessions[currentIdx + 1] : null;

  // Read Markdown file from src/content/sessions/{sessionId}.md
  const mdPath = path.join(
    process.cwd(),
    "src",
    "content",
    "sessions",
    `${session.id}.md`
  );

  let markdownContent = "";
  try {
    markdownContent = fs.readFileSync(mdPath, "utf8");
  } catch {
    markdownContent = `# ${session.title}\n\nSession notes not yet compiled. Run \`/compile-session\` in chat to generate.`;
  }

  // Filter flashcards linked to this session (or fallback to same module so preview is always rich)
  const exactCards = flashcardsData.filter((c) => c.sessionId === session.id);
  const modNumber = session.moduleId.replace("mod-", "Module ");
  const moduleCards = flashcardsData.filter((c) => c.module === modNumber);
  const sessionFlashcards = exactCards.length > 0 ? exactCards : moduleCards;

  // Filter scenario quizzes linked to this session (or fallback to same module)
  const typedQuizzes = quizzesData as QuizQuestion[];
  const exactQuizzes = typedQuizzes.filter((q) => q.sourceId === session.id);
  const moduleQuizzes = typedQuizzes.filter((q) => q.module === modNumber);
  const sessionQuizzes = exactQuizzes.length > 0 ? exactQuizzes : moduleQuizzes;

  return (
    <SessionStudyClient
      session={session}
      markdownContent={markdownContent}
      sessionFlashcards={sessionFlashcards}
      sessionQuizzes={sessionQuizzes}
      prevSession={prevSession}
      nextSession={nextSession}
    />
  );
}
