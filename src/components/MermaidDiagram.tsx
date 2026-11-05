"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

function sanitizeMermaidChart(rawChart: string): string {
  // Replace unquoted pipe labels containing parentheses: |...(...)...| -> safely replace parens with hyphens
  return rawChart.replace(/\|([^|\n]+)\|/g, (match, label) => {
    if (/[()]/.test(label)) {
      const sanitized = label
        .replace(/\(<([^)]+)\)/g, "- sub-$1")
        .replace(/\(([^)]+)\)/g, "- $1");
      return `|${sanitized}|`;
    }
    return match;
  });
}

// Module-level serialized queue to prevent concurrent mermaid initialization & DOM collisions
let mermaidRenderQueue = Promise.resolve();

function enqueueMermaidRender<T>(task: () => Promise<T>): Promise<T> {
  const result = mermaidRenderQueue.then(task, task);
  mermaidRenderQueue = result.then(
    () => {},
    () => {}
  );
  return result;
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const uniqueId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { resolvedTheme } = useTheme();
  const [svgContent, setSvgContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const renderId = `mermaid-svg-${uniqueId}-${Date.now()}`;
    let tempContainer: HTMLDivElement | null = null;

    async function doRender() {
      if (!chart?.trim()) return;

      try {
        setRenderError(null);

        // Render inside serialized queue so Mermaid never collides with concurrent renders or theme resets
        await enqueueMermaidRender(async () => {
          if (!isMounted) return;

          const mermaidModule = await import("mermaid");
          const mermaid = mermaidModule.default;
          const isDark = resolvedTheme === "dark";

          mermaid.initialize({
            startOnLoad: false,
            suppressErrorRendering: true,
            theme: isDark ? "dark" : "base",
            securityLevel: "loose",
            fontFamily: "JetBrains Mono, IBM Plex Sans, monospace",
            themeVariables: isDark
              ? {
                  darkMode: true,
                  background: "#09090b",
                  primaryColor: "#18181b",
                  primaryTextColor: "#f4f4f5",
                  primaryBorderColor: "#10b981",
                  lineColor: "#818cf8",
                  secondaryColor: "#1e1b4b",
                  tertiaryColor: "#09090b",
                  clusterBkg: "#09090b",
                  clusterBorder: "#27272a",
                  edgeLabelBackground: "#18181b",
                  textColor: "#e4e4e7",
                }
              : {
                  darkMode: false,
                  background: "#ffffff",
                  primaryColor: "#f8fafc",
                  primaryTextColor: "#0f172a",
                  primaryBorderColor: "#059669",
                  lineColor: "#4f46e5",
                  secondaryColor: "#e0e7ff",
                  tertiaryColor: "#f1f5f9",
                  clusterBkg: "#f8fafc",
                  clusterBorder: "#cbd5e1",
                  edgeLabelBackground: "#ffffff",
                  textColor: "#0f172a",
                },
          });

          // Dedicated isolated offscreen container for this diagram's render
          tempContainer = document.createElement("div");
          tempContainer.id = `mermaid-temp-box-${renderId}`;
          tempContainer.style.position = "absolute";
          tempContainer.style.top = "-9999px";
          tempContainer.style.left = "-9999px";
          tempContainer.style.visibility = "hidden";
          document.body.appendChild(tempContainer);

          const sanitizedChart = sanitizeMermaidChart(chart.trim());
          const { svg } = await mermaid.render(renderId, sanitizedChart, tempContainer);

          if (isMounted) {
            setSvgContent(svg);
            setShowRaw(false);
          }
        });
      } catch (err: unknown) {
        console.error("Mermaid render error:", err);
        if (isMounted) {
          setRenderError(
            err instanceof Error ? err.message : "Failed to parse Mermaid diagram syntax."
          );
          setShowRaw(true);
        }
      } finally {
        if (tempContainer && tempContainer.parentNode) {
          tempContainer.parentNode.removeChild(tempContainer);
        }
        // Purge only elements specifically belonging to this renderId, never blanket remove other renders
        const strayEl = document.getElementById(renderId);
        if (strayEl?.parentNode) strayEl.parentNode.removeChild(strayEl);
        const strayDiv = document.getElementById(`d${renderId}`);
        if (strayDiv?.parentNode) strayDiv.parentNode.removeChild(strayDiv);
      }
    }

    doRender();

    return () => {
      isMounted = false;
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      const strayEl = document.getElementById(renderId);
      if (strayEl?.parentNode) strayEl.parentNode.removeChild(strayEl);
      const strayDiv = document.getElementById(`d${renderId}`);
      if (strayDiv?.parentNode) strayDiv.parentNode.removeChild(strayDiv);
    };
  }, [chart, uniqueId, resolvedTheme, retryNonce]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (showRaw) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (showRaw || e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`my-5 rounded-2xl border border-border bg-card shadow-md overflow-hidden transition-all ${
        isExpanded ? "fixed inset-4 z-50 flex flex-col bg-card" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
            {title || "System Architecture Blueprint (Mermaid.js)"}
          </span>
          {!showRaw && (
            <span className="hidden sm:inline-block rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              Drag to Pan • {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!showRaw && !renderError && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
                className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
                className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                title="Reset Zoom & Pan"
                aria-label="Reset Zoom and Pan"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
                title={isExpanded ? "Exit Fullscreen" : "Expand Diagram"}
                aria-label={isExpanded ? "Exit Fullscreen" : "Expand Diagram"}
              >
                {isExpanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowRaw((r) => !r)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-colors cursor-pointer ${
              showRaw
                ? "border-accent/50 bg-accent/15 text-accent font-semibold"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>{showRaw ? "View Diagram" : "Raw Code"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-primary" />
                <span className="text-primary font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {renderError && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
            <span>
              Mermaid syntax fallback active — showing raw diagram definition ({renderError}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRetryNonce((n) => n + 1)}
            className="flex items-center gap-1 rounded-md border border-destructive/40 bg-card px-2 py-0.5 font-mono text-[11px] text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry Render</span>
          </button>
        </div>
      )}

      {/* Body */}
      {showRaw ? (
        <pre className="overflow-x-auto bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
          <code>{chart.trim()}</code>
        </pre>
      ) : (
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative overflow-hidden p-6 select-none touch-none ${
            isExpanded ? "flex-1 flex items-center justify-center" : "min-h-[260px]"
          } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          style={{
            backgroundImage: resolvedTheme === "dark"
              ? "radial-gradient(#27272a 1px, transparent 1px)"
              : "radial-gradient(#cbd5e1 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          {svgContent ? (
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 120ms ease-out",
              }}
              className="flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex h-48 items-center justify-center font-mono text-xs text-muted-foreground">
              Rendering architecture diagram...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
