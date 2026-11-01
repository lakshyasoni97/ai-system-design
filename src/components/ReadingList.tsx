"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Globe, GraduationCap, Link2 } from "lucide-react";

export interface ReadingItem {
  title: string;
  type: string;
  why: string;
  url?: string;
  href?: string;
}

const typeStyles: Record<string, { label: string; icon: React.ElementType }> = {
  book: { label: "Book", icon: BookOpen },
  paper: { label: "Paper", icon: GraduationCap },
  docs: { label: "Docs", icon: FileText },
  article: { label: "Article", icon: Globe },
  internal: { label: "In this app", icon: Link2 },
};

export default function ReadingList({
  items,
  title = "Read & Understand",
}: {
  items: ReadingItem[];
  title?: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Read before the Socratic session. Items without a link: search the exact title.
      </p>
      <ul className="space-y-3">
        {items.map((item, idx) => {
          const style = typeStyles[item.type] || typeStyles.article;
          const Icon = style.icon;
          const body = (
            <>
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3 w-3" />
                  {style.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                {item.url && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {item.why}
              </span>
            </>
          );
          return (
            <li key={`${item.title}-${idx}`}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:border-primary/40"
                >
                  {body}
                </Link>
              ) : item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:border-primary/40"
                >
                  {body}
                </a>
              ) : (
                <div className="rounded-xl border border-border bg-muted/20 p-3">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
