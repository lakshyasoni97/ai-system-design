"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import TradeoffTable from "./TradeoffTable";
import HighlightableArticle from "./HighlightableArticle";
import CodeBlock from "./CodeBlock";
import {
  ActiveRecallProvider,
  ActiveRecallToolbar,
  ClozeCodePill,
  RecallBlockquote,
} from "./ActiveRecallContext";

export default function MarkdownArticle({
  content,
  diagramTitle = "Diagram",
  sourceType = "fundamental",
  sourceId = "fund-01",
  sourceTitle = "Fundamentals Topic",
  href = "/fundamentals",
}: {
  content: string;
  diagramTitle?: string;
  sourceType?: "session" | "fundamental";
  sourceId?: string;
  sourceTitle?: string;
  href?: string;
}) {
  const slug = (children: React.ReactNode) =>
    String(children)
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  return (
    <ActiveRecallProvider>
      <div className="space-y-4">
        <ActiveRecallToolbar />
        <HighlightableArticle
          sourceType={sourceType}
          sourceId={sourceId}
          sourceTitle={sourceTitle}
          href={href}
        >
          <article className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 md:p-8 shadow-xs">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: () => null,
                h2: ({ children }) => (
                  <h2
                    id={slug(children)}
                    className="mt-8 sm:mt-10 mb-3 sm:mb-4 border-b border-border pb-2 sm:pb-2.5 text-lg sm:text-xl font-bold tracking-tight text-foreground scroll-mt-24"
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    id={slug(children)}
                    className="mt-6 sm:mt-7 mb-2 sm:mb-2.5 text-base sm:text-lg font-semibold text-foreground scroll-mt-24"
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="my-3.5 max-w-[75ch] text-base leading-7 sm:leading-relaxed text-foreground/95">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-3.5 max-w-[75ch] list-disc space-y-2 pl-5 sm:pl-6 text-base leading-7 sm:leading-relaxed text-foreground/95">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3.5 max-w-[75ch] list-decimal space-y-2 pl-5 sm:pl-6 text-base leading-7 sm:leading-relaxed text-foreground/95">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                blockquote: ({ children }) => <RecallBlockquote>{children}</RecallBlockquote>,
                hr: () => <hr className="my-6 sm:my-8 border-border" />,
                pre: ({ children }) => <>{children}</>,
                table: ({ children }) => <TradeoffTable>{children}</TradeoffTable>,
                thead: ({ children }) => (
                  <thead className="border-b border-border bg-muted/60 font-mono text-xs uppercase tracking-wider text-foreground">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border/80">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="transition-colors hover:bg-muted/30">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-3.5 py-2.5 sm:px-4 sm:py-3 font-semibold text-left text-xs sm:text-sm">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    {children}
                  </td>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const lang = match?.[1] || "";
                  const rawCode = String(children).replace(/\n$/, "");
                  if (lang === "mermaid") {
                    return <MermaidDiagram chart={rawCode} title={diagramTitle} />;
                  }
                  const isBlock = rawCode.includes("\n") || Boolean(lang);
                  if (isBlock) {
                    return <CodeBlock language={lang} rawCode={rawCode} />;
                  }
                  return (
                    <ClozeCodePill rawText={rawCode} {...props}>
                      {children}
                    </ClozeCodePill>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </article>
        </HighlightableArticle>
      </div>
    </ActiveRecallProvider>
  );
}
