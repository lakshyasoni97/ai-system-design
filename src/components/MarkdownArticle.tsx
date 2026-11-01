"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "./MermaidDiagram";
import TradeoffTable from "./TradeoffTable";

export default function MarkdownArticle({
  content,
  diagramTitle = "Diagram",
}: {
  content: string;
  diagramTitle?: string;
}) {
  const slug = (children: React.ReactNode) =>
    String(children)
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  return (
    <article className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: () => null,
          h2: ({ children }) => (
            <h2
              id={slug(children)}
              className="mt-10 mb-4 border-b border-border pb-2.5 text-xl font-bold tracking-tight text-foreground scroll-mt-24"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={slug(children)} className="mt-6 mb-2.5 text-base font-semibold text-foreground scroll-mt-24">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-3.5 max-w-[75ch] text-sm sm:text-base leading-relaxed text-foreground/90">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-3 max-w-[75ch] list-disc space-y-2 pl-6 text-sm sm:text-base text-foreground/90">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 max-w-[75ch] list-decimal space-y-2 pl-6 text-sm sm:text-base text-foreground/90">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-2xl border-l-4 border-primary bg-primary/5 p-5 text-sm sm:text-base text-foreground [&_strong]:text-primary [&_strong]:font-bold">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-8 border-border" />,
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => <TradeoffTable>{children}</TradeoffTable>,
          thead: ({ children }) => (
            <thead className="border-b border-border bg-muted/60 font-mono text-xs uppercase tracking-wider text-foreground">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-border/80">{children}</tbody>,
          tr: ({ children }) => <tr className="transition-colors hover:bg-muted/30">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 font-semibold text-left">{children}</th>,
          td: ({ children }) => (
            <td className="px-4 py-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">{children}</td>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const lang = match?.[1] || "";
            const rawCode = String(children).replace(/\n$/, "");
            if (lang === "mermaid") {
              return <MermaidDiagram chart={rawCode} title={diagramTitle} />;
            }
            if (rawCode.includes("\n") || lang) {
              return (
                <pre className="my-5 overflow-x-auto rounded-2xl border border-border bg-muted/20 p-4 font-mono text-xs leading-relaxed text-foreground">
                  <code>{rawCode}</code>
                </pre>
              );
            }
            return (
              <code
                className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs text-primary font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
