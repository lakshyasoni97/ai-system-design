import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import fundamentals from "@/data/fundamentals.json";
import resources from "@/data/resources.json";
import quizzesData from "@/data/quizzes.json";
import FundamentalsStudyClient from "@/components/FundamentalsStudyClient";
import { QuizQuestion } from "@/components/ScenarioQuiz";

export function generateStaticParams() {
  return fundamentals.topics.map((t) => ({ id: t.id }));
}

export default function FundamentalsTopicPage({ params }: { params: { id: string } }) {
  const idx = fundamentals.topics.findIndex((t) => t.id === params.id);
  if (idx === -1) notFound();

  const topic = fundamentals.topics[idx];
  let content = "";
  try {
    content = fs.readFileSync(
      path.join(process.cwd(), "src", "content", "fundamentals", `${topic.id}.md`),
      "utf8"
    );
  } catch {
    content = `# ${topic.title}\n\nContent not found.`;
  }

  const reading =
    (resources.fundamentals as Record<string, { title: string; type: string; why: string; url?: string; href?: string }[]>)[
      topic.id
    ] || [];

  const topicQuizzes = (quizzesData as QuizQuestion[]).filter(
    (q) => q.sourceId === topic.id
  );

  return (
    <FundamentalsStudyClient
      topic={topic}
      content={content}
      reading={reading}
      quizzes={topicQuizzes}
      prev={idx > 0 ? fundamentals.topics[idx - 1] : null}
      next={idx < fundamentals.topics.length - 1 ? fundamentals.topics[idx + 1] : null}
    />
  );
}
