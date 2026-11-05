"use client";

import React, { useMemo, useState } from "react";
import hljs from "highlight.js";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  rawCode: string;
  filename?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python",
  py: "Python",
  sql: "SQL",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  html: "HTML",
  css: "CSS",
  rust: "Rust",
  rs: "Rust",
  go: "Go",
  golang: "Go",
  docker: "Dockerfile",
  dockerfile: "Dockerfile",
  markdown: "Markdown",
  md: "Markdown",
};

export default function CodeBlock({
  language = "",
  rawCode,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const cleanLang = language.toLowerCase().trim();
  const displayLanguage =
    LANGUAGE_LABELS[cleanLang] ||
    (cleanLang ? cleanLang.charAt(0).toUpperCase() + cleanLang.slice(1) : "Code");

  const lines = useMemo(() => rawCode.split("\n"), [rawCode]);
  const linesCount = lines.length;

  // Syntax highlighting via highlight.js
  const highlightedHtml = useMemo(() => {
    try {
      if (cleanLang && hljs.getLanguage(cleanLang)) {
        return hljs.highlight(rawCode, {
          language: cleanLang,
          ignoreIllegals: true,
        }).value;
      }
      return hljs.highlightAuto(rawCode).value;
    } catch {
      // Fallback: simple HTML escape
      return rawCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [rawCode, cleanLang]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const showGutter = linesCount >= 2;

  return (
    <div className="code-editor my-5 sm:my-6 overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 bg-[#0d1117] text-[#e6edf3] shadow-lg">
      {/* Editor Title Bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#161b22] px-3.5 py-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* macOS Window Traffic Lights */}
          <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>

          <span className="h-3 w-px bg-white/10 shrink-0" aria-hidden="true" />

          {/* Language / Filename Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Terminal className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-semibold text-zinc-200 truncate">
              {filename || displayLanguage}
            </span>
            {linesCount > 1 && (
              <span className="hidden sm:inline font-mono text-[11px] text-zinc-500 shrink-0">
                • {linesCount} lines
              </span>
            )}
          </div>
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 font-mono text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
          title="Copy code to clipboard"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Editor Body */}
      <div className="flex overflow-hidden">
        {/* Line Numbers Gutter */}
        {showGutter && (
          <div
            aria-hidden="true"
            className="select-none py-3.5 sm:py-4 pl-3.5 pr-3 text-right font-mono text-xs sm:text-sm leading-relaxed text-zinc-500/50 border-r border-white/5 bg-[#0d1117] shrink-0"
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Highlighted Code */}
        <pre className="flex-1 overflow-x-auto p-3.5 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-[#e6edf3] bg-[#0d1117]">
          <code
            className={`hljs language-${cleanLang || "text"}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
}
