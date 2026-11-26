"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";

export interface AudioOverviewMeta {
  title: string;
  src: string;
  duration: string;
  format?: string;
}

interface AudioOverviewPlayerProps {
  conceptId: string;
  audio: AudioOverviewMeta;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2] as const;
const SPEED_STORAGE_KEY = "ai-sysdesign-audio-speed";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function AudioOverviewPlayer({
  conceptId,
  audio,
}: AudioOverviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const basePath = process.env.NODE_ENV === "production" ? "/ai-system-design" : "";
  const resolvedSrc = audio.src.startsWith("/") ? `${basePath}${audio.src}` : audio.src;
  const positionKey = `ai-sysdesign-audio-pos:${conceptId}`;

  useEffect(() => {
    try {
      const savedSpeed = Number(localStorage.getItem(SPEED_STORAGE_KEY));
      if (SPEED_OPTIONS.includes(savedSpeed as (typeof SPEED_OPTIONS)[number])) {
        setPlaybackRate(savedSpeed);
      }
      const savedPos = Number(localStorage.getItem(positionKey));
      if (Number.isFinite(savedPos) && savedPos > 0) {
        setCurrentTime(savedPos);
        if (audioRef.current && audioRef.current.readyState >= 1) {
          audioRef.current.currentTime = savedPos;
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, [positionKey]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const persistPosition = (time: number) => {
    try {
      localStorage.setItem(positionKey, String(Math.floor(time)));
    } catch {
      // Ignore storage access errors
    }
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }
    try {
      el.playbackRate = playbackRate;
      await el.play();
      setIsPlaying(true);
    } catch {
      setHasError(true);
    }
  };

  const seekBy = (delta: number) => {
    const el = audioRef.current;
    if (!el) return;
    const max = el.duration || duration || 0;
    const next = Math.max(0, Math.min(max, el.currentTime + delta));
    el.currentTime = next;
    setCurrentTime(next);
    persistPosition(next);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const next = Number(e.target.value);
    if (!el || !Number.isFinite(next)) return;
    el.currentTime = next;
    setCurrentTime(next);
    persistPosition(next);
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(
      playbackRate as (typeof SPEED_OPTIONS)[number]
    );
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage access errors
    }
  };

  const toggleMute = () => {
    const el = audioRef.current;
    if (!el) return;
    const next = !isMuted;
    el.muted = next;
    setIsMuted(next);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration)) {
            setDuration(el.duration);
          }
          el.playbackRate = playbackRate;
          try {
            const savedPos = Number(localStorage.getItem(positionKey));
            if (
              Number.isFinite(savedPos) &&
              savedPos > 0 &&
              savedPos < el.duration - 2
            ) {
              el.currentTime = savedPos;
              setCurrentTime(savedPos);
            }
          } catch {
            // Ignore storage access errors
          }
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setCurrentTime(t);
          if (Math.floor(t) % 5 === 0) {
            persistPosition(t);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          persistPosition(0);
        }}
        onPause={(e) => {
          setIsPlaying(false);
          persistPosition(e.currentTarget.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onError={() => setHasError(true)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                Audio Overview
              </span>
              {audio.format && (
                <span className="rounded-md border border-border bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {audio.format}
                </span>
              )}
            </div>
            <div className="truncate text-sm font-semibold text-foreground">
              {audio.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cycleSpeed}
            title="Change playback speed"
            className="rounded-lg border border-border bg-secondary/70 px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="rounded-lg border border-border bg-secondary/70 p-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <a
            href={resolvedSrc}
            download={`${conceptId}.m4a`}
            aria-label="Download audio overview"
            title="Download .m4a"
            className="rounded-lg border border-border bg-secondary/70 p-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => seekBy(-15)}
          aria-label="Rewind 15 seconds"
          title="Rewind 15s"
          className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">15s</span>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio overview" : "Play audio overview"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => seekBy(15)}
          aria-label="Forward 15 seconds"
          title="Forward 15s"
          className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-secondary/60 px-2 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">15s</span>
        </button>

        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-[width] duration-100"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              onChange={handleSeek}
              aria-label="Seek audio position"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums w-11 shrink-0">
            {duration > 0 ? formatTime(duration) : audio.duration}
          </span>
        </div>
      </div>

      {hasError && (
        <p className="mt-2 font-mono text-xs text-destructive">
          Unable to load audio file ({resolvedSrc}).
        </p>
      )}
    </div>
  );
}
