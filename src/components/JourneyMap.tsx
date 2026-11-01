"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Flame,
  Clock,
  Layers,
  GitFork,
  Briefcase,
} from "lucide-react";
import curriculumData from "@/data/curriculum.json";
import { useProgress } from "@/components/ProgressProvider";

export default function JourneyMap() {
  const { isSessionCompleted } = useProgress();

  // Find the single next-up session
  const allSessions = curriculumData.modules.flatMap((m) =>
    m.sessions.map((s) => ({
      ...s,
      moduleId: m.id,
      moduleTitle: m.title,
    }))
  );

  const nextUpSession =
    allSessions.find((s) => !isSessionCompleted(s.id)) || allSessions[0];

  return (
    <div className="space-y-6">
      {/* Header with high-level description & link to full curriculum */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Big Picture Architecture Journey
            </h2>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
              20 Sessions
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            5 progressive modules taking you from classical distributed backends to production multi-agent systems and LLMOps.
          </p>
        </div>

        <Link
          href="/curriculum"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
        >
          <span>Open Full Curriculum & Mind Map</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 5 Module Stages */}
      <div className="space-y-4">
        {curriculumData.modules.map((mod, modIdx) => {
          const completedCount = mod.sessions.filter((s) =>
            isSessionCompleted(s.id)
          ).length;
          const isModuleComplete = completedCount === mod.sessions.length;

          return (
            <div
              key={mod.id}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-colors hover:border-border/80"
            >
              {/* Module Title & Counter Bar */}
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                      isModuleComplete
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    {modIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {mod.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {mod.focus}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(completedCount / mod.sessions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                    {completedCount}/{mod.sessions.length} Done
                  </span>
                </div>
              </div>

              {/* 4 Sessions in this Module */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {mod.sessions.map((s) => {
                  const completed = isSessionCompleted(s.id);
                  const isNext = nextUpSession?.id === s.id;

                  return (
                    <Link
                      key={s.id}
                      href={`/roadmap/${s.id}`}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                        isNext
                          ? "border-primary/50 bg-primary/5 shadow-xs"
                          : completed
                          ? "border-border/60 bg-secondary/30 hover:bg-secondary/60"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span className="font-mono text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                            Session {String(s.number).padStart(2, "0")}
                          </span>

                          <div className="flex items-center gap-1">
                            {isNext && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.2 font-mono text-[10px] font-semibold text-primary-foreground">
                                <Flame className="h-2.5 w-2.5" />
                                Next
                              </span>
                            )}
                            {completed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            ) : !isNext ? (
                              <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                            ) : null}
                          </div>
                        </div>

                        <h4 className="text-xs font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {s.title}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span className="truncate max-w-[120px] opacity-80">
                          {s.projectTieIn.split(" ")[0]}
                        </span>
                        <span className="inline-flex items-center gap-1 opacity-75">
                          <Clock className="h-3 w-3" />
                          {s.estimatedReadTime || "15m"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
