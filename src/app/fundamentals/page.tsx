"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Circle, Clock, Library } from "lucide-react";
import fundamentals from "@/data/fundamentals.json";
import resources from "@/data/resources.json";
import ReadingList from "@/components/ReadingList";
import { useFundamentalsDone } from "@/components/FundamentalsStudyClient";

export default function FundamentalsIndexPage() {
  const { done } = useFundamentalsDone();
  const pct = Math.round((done.length / fundamentals.topics.length) * 100);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-xs font-semibold text-accent">
          <Library className="h-3.5 w-3.5" />
          Module 0 · Start here
        </div>
        <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {fundamentals.title.replace("Module 0: ", "")}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{fundamentals.focus}</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {done.length}/{fundamentals.topics.length} done
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fundamentals.topics.map((t) => {
          const isDone = done.includes(t.id);
          return (
            <Link
              key={t.id}
              href={`/fundamentals/${t.id}`}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  TOPIC {String(t.number).padStart(2, "0")}
                </span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
              <h2 className="mt-1.5 text-base font-bold text-foreground group-hover:text-primary">{t.title}</h2>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">AI tie-in:</span> {t.aiTieIn}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {t.readTime}
              </span>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" /> Foundational books to own
        </h2>
        <ReadingList items={resources.foundationalBooks} title="Core library" />
      </div>
    </div>
  );
}
