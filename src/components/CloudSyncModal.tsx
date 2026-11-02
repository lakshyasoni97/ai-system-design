"use client";

import React, { useState } from "react";
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Key,
  Shield,
  Download,
  Upload,
  X,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  Smartphone,
  Laptop,
} from "lucide-react";
import { useProgress } from "./ProgressProvider";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const {
    isSyncConfigured,
    isSyncing,
    lastSyncedAt,
    syncError,
    gistUrl,
    githubUser,
    connectSync,
    disconnectSync,
    triggerSyncNow,
    exportProgressJson,
    importProgressJson,
    highlights,
    completedSessions,
  } = useProgress();

  const [activeTab, setActiveTab] = useState<"cloud" | "file">("cloud");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [importJsonText, setImportJsonText] = useState("");
  const [fileRestoreStatus, setFileRestoreStatus] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!tokenInput.trim()) {
      setLocalError("Please enter your GitHub Personal Access Token.");
      return;
    }
    setConnecting(true);
    const success = await connectSync(tokenInput.trim());
    setConnecting(false);
    if (success) {
      setTokenInput("");
    }
  };

  const handleDownloadFile = () => {
    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(exportProgressJson());
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `ai-system-design-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = () => {
    if (!importJsonText.trim()) return;
    const ok = importProgressJson(importJsonText);
    if (ok) {
      setFileRestoreStatus("Progress successfully restored!");
      setImportJsonText("");
      setTimeout(() => setFileRestoreStatus(null), 3000);
    } else {
      setFileRestoreStatus("Error: Invalid JSON structure.");
    }
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return "Never";
    const date = new Date(iso);
    const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
    if (diffSec < 5) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Cross-Device Cloud Sync
              </h2>
              <p className="text-xs text-muted-foreground">
                Sync highlights & notes across laptop, tablet, and phone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close sync modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-muted/60 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("cloud")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all cursor-pointer ${
              activeTab === "cloud"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cloud className="h-3.5 w-3.5 text-primary" />
            <span>GitHub Gist Sync</span>
            {isSyncConfigured && (
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all cursor-pointer ${
              activeTab === "file"
                ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            <span>Offline JSON Backup</span>
          </button>
        </div>

        {/* Tab 1: Cloud Sync (GitHub Gist) */}
        {activeTab === "cloud" && (
          <div className="space-y-4">
            {isSyncConfigured ? (
              // Connected State
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {githubUser?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={githubUser.avatar_url}
                          alt={githubUser.login}
                          className="h-10 w-10 rounded-full border border-emerald-500/40"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 font-bold font-mono">
                          GH
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-foreground">
                            {githubUser?.name || githubUser?.login}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            @{githubUser?.login}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Connected to Private Gist</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={disconnectSync}
                      className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card/80 px-2.5 py-1 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer"
                      title="Disconnect and remove token from this device"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Disconnect</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 font-mono text-xs">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">
                        Last Synced:
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatLastSync(lastSyncedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[11px] block">
                        Current Store:
                      </span>
                      <span className="font-semibold text-foreground">
                        {highlights.length} highlights • {completedSessions.length} done
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Banner if any */}
                {(syncError || localError) && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{syncError || localError}</span>
                  </div>
                )}

                {/* Sync Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerSyncNow}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                    />
                    <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                  </button>

                  {gistUrl && (
                    <a
                      href={gistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      title="Open private Gist on GitHub"
                    >
                      <span>View Gist</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/30 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 text-primary shrink-0">
                    <Laptop className="h-4 w-4" />
                    <span className="text-[10px]">↔</span>
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Edits made on this device automatically sync to your Gist within 2 seconds. When you open another device with the same token, updates merge instantly.
                  </p>
                </div>
              </div>
            ) : (
              // Setup / Disconnected State
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="rounded-2xl border border-border bg-secondary/30 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>How Cross-Device Sync Works:</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your highlights, study notes, and flashcard progress are stored in a <strong>private GitHub Gist</strong> under your personal GitHub account. No third-party servers or databases involved.
                  </p>
                  <div className="pt-1">
                    <a
                      href="https://github.com/settings/tokens/new?description=AI+System+Design+Study+Portal+Sync&scopes=gist"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-primary hover:underline"
                    >
                      <span>1. Click here to generate a GitHub Token (pre-filled with `gist` scope)</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>2. Paste your Personal Access Token:</span>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {showToken ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={tokenInput}
                      onChange={(e) => {
                        setTokenInput(e.target.value);
                        setLocalError(null);
                      }}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-3.5 pr-10 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <Key className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  </div>
                </div>

                {(localError || syncError) && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{localError || syncError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={connecting || !tokenInput.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Validating & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Connect & Sync This Device</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-muted-foreground text-center">
                  Your token is stored safely in your browser&apos;s localStorage and is only used to communicate with api.github.com.
                </p>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Offline File Backup */}
        {activeTab === "file" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              If you prefer not to use cloud sync, you can manually export your study data as a JSON file and restore it on any device.
            </p>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Progress JSON ({highlights.length} highlights)</span>
            </button>

            <div className="space-y-2 pt-3 border-t border-border">
              <label className="text-xs font-medium text-foreground">
                Restore from JSON Backup:
              </label>
              <textarea
                rows={3}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste your exported progress JSON here..."
                className="w-full rounded-xl border border-border bg-secondary/40 p-2.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportFile}
                disabled={!importJsonText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Restore Progress</span>
              </button>

              {fileRestoreStatus && (
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 font-mono text-xs text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{fileRestoreStatus}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
