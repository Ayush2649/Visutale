"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut, linkSocial } from "@/lib/auth-client";
import type { StoryboardPlan } from "@/contracts/plan";
import type { RunManifest } from "@/contracts/manifest";
import type { StudioJob } from "@/studio/studioJobManager";
import type { StudioRunSummary, AvailableFixture } from "@/studio/studioService";

type StudioViewMode = "creation" | "manuscript" | "progress" | "ready" | "failed";

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center font-body-md text-on-surface-variant">Loading Studio Workspace...</div>}>
      <StudioPageContent />
    </Suspense>
  );
}

function StudioPageContent() {
  const searchParams = useSearchParams();
  const queryTopic = searchParams.get("topic") || "";
  const queryFixture = searchParams.get("fixture") || "";
  const queryRunPath = searchParams.get("runPath") || "";
  const queryMode = searchParams.get("mode") as StudioViewMode | null;

  // View state
  const [viewMode, setViewMode] = useState<StudioViewMode>(queryMode || "creation");
  const [isMobileMode, setIsMobileMode] = useState<"hybrid" | "script" | "board">("hybrid");
  const [storyboardView, setStoryboardView] = useState<"sequence" | "grid">("sequence");
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Creation form state
  const [topicInput, setTopicInput] = useState(queryTopic || "Why the sky changes color at twilight");
  const [aspectRatio, setAspectRatio] = useState<"vertical" | "square" | "landscape">("vertical");
  const [targetDuration, setTargetDuration] = useState<"60" | "90">("60");
  const [voicePreset, setVoicePreset] = useState("indian-english-female");
  const [creationMode, setCreationMode] = useState<"quick" | "guided">("guided");

  // Run & Manuscript state
  const [activeRunPath, setActiveRunPath] = useState<string | null>(queryRunPath || null);
  const [plan, setPlan] = useState<StoryboardPlan | null>(null);
  const [manifest, setManifest] = useState<RunManifest | null>(null);
  const activeRunId = manifest?.runId || (activeRunPath ? (activeRunPath.includes("/") ? activeRunPath.split("/").pop()! : activeRunPath) : "");
  const [planHash, setPlanHash] = useState<string>("");
  const [jobStatus, setJobStatus] = useState<StudioJob | null>(null);
  const [recentRuns, setRecentRuns] = useState<StudioRunSummary[]>([]);
  const [availableFixtures, setAvailableFixtures] = useState<AvailableFixture[]>([]);
  const [activeSceneIndex, setActiveSceneIndex] = useState(1);
  const [loading, setLoading] = useState(false);
  const [autosavedTime, setAutosavedTime] = useState("Just now");

  // Video Player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(58);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Fetch recent runs & fixtures & user session in a single consolidated request on mount
  useEffect(() => {
    let isMounted = true;
    fetch("/api/studio/runs")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !isMounted) return;
        if (data.runs) setRecentRuns(data.runs);
        if (data.fixtures) setAvailableFixtures(data.fixtures);
        if (data.user) setCurrentUser(data.user);

        // If queryRunPath was passed, load it
        if (queryRunPath) {
          loadRun(queryRunPath);
        } else if (queryFixture) {
          handleCreateFromFixture(queryFixture);
        } else if (data.runs && data.runs.length > 0) {
          // If runs exist and no query, default load the latest run
          loadRun(data.runs[0].runId || data.runs[0].runPath);
        }
      })
      .catch((err) => {
        console.error("Studio initial load error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [queryRunPath, queryFixture]);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Studio sign out error:", err);
    } finally {
      window.location.href = "/sign-in";
    }
  };

  // Polling for progress when in progress mode
  useEffect(() => {
    if (!activeRunId || viewMode !== "progress" || queryMode) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/studio/runs/${activeRunId}/status`);
        if (res.ok) {
          const status: StudioJob = await res.json();
          setJobStatus(status);

          if (status.status === "completed") {
            setViewMode("ready");
            setNotice("Master 1080x1920 video render completed and verified.");
          } else if (status.status === "failed") {
            setViewMode("failed");
          }
        }
      } catch {
        // ignore polling network errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRunId, viewMode]);

  // Load an existing run
  const loadRun = async (identifier: string) => {
    setLoading(true);
    const cleanId = identifier.includes("/") ? identifier.split("/").pop()! : identifier;
    try {
      const res = await fetch(`/api/studio/runs/${cleanId}`);
      if (res.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!res.ok) throw new Error("Could not load run");
      const data = await res.json();
      setActiveRunPath(cleanId);
      setPlan(data.plan);
      setManifest(data.manifest);
      setPlanHash(data.manifest.planHash || "");
      setJobStatus(data.jobStatus);

      if (queryMode) {
        setViewMode(queryMode);
      } else if (data.jobStatus?.status === "completed" || data.manifest.artifacts.outputVideo) {
        setViewMode("ready");
      } else if (data.manifest.state === "failed") {
        setViewMode("failed");
      } else if (data.manifest.state === "approved" && data.jobStatus?.status === "running") {
        setViewMode("progress");
      } else {
        setViewMode("manuscript");
      }
    } catch (err: any) {
      setNotice(err.message || "Failed to load run");
    } finally {
      setLoading(false);
    }
  };

  // Create new run from topic or fixture
  const handleCreateDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topicInput.trim() || loading) return;

    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/studio/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicInput.trim(),
          voicePreset,
        }),
      });

      if (res.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data?.error?.message || (typeof data?.error === "string" ? data.error : "Failed to create draft");
        throw new Error(errorMsg);
      }

      setActiveRunPath(data.runPath);
      setPlan(data.plan);
      setManifest(data.manifest);
      setPlanHash(data.planHash);
      setViewMode("manuscript");
      setNotice(`Manuscript drafted for "${data.plan.topic}". Review and approve scenes.`);
    } catch (err: any) {
      setNotice(err.message || "Failed to create draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromFixture = async (fixtureId: string) => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/studio/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId }),
      });

      if (res.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load benchmark fixture");

      setActiveRunPath(data.runPath);
      setPlan(data.plan);
      setManifest(data.manifest);
      setPlanHash(data.planHash);
      setViewMode("manuscript");
      setNotice(`Benchmark fixture "${fixtureId}" loaded into Studio Manuscript.`);
    } catch (err: any) {
      setNotice(err.message || "Failed to load fixture");
    } finally {
      setLoading(false);
    }
  };

  // Editing narration
  const handleNarrationChange = (sceneIndex: number, newText: string) => {
    if (!plan) return;
    const updatedScenes = [...plan.scenes];
    const scene = { ...updatedScenes[sceneIndex] };
    const narration = [...scene.narration];
    if (narration.length > 0) {
      narration[0] = { ...narration[0], text: newText };
    } else {
      narration.push({ id: `line-${scene.id}`, text: newText });
    }
    scene.narration = narration;
    updatedScenes[sceneIndex] = scene;

    setPlan({ ...plan, scenes: updatedScenes });
    setAutosavedTime("Modified just now (Unapproved)");
  };

  // Save / Revise manuscript
  const handleSaveRevision = async () => {
    if (!activeRunId || !plan) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/runs/${activeRunId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modifiedPlan: plan }),
      });

      if (res.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save revision");

      const nextId = data.newManifest?.runId || (data.newRunPath.includes("/") ? data.newRunPath.split("/").pop()! : data.newRunPath);
      setActiveRunPath(nextId);
      setPlan(data.newPlan);
      setManifest(data.newManifest);
      setPlanHash(data.newPlanHash);
      setAutosavedTime("Auto-saved just now");
      setNotice(`Manuscript updated (Rev: ${data.revisionType}). New canonical hash generated.`);
    } catch (err: any) {
      setNotice(err.message || "Revision update error");
    } finally {
      setLoading(false);
    }
  };

  // Approve & Generate Video
  const handleApproveAndRender = async () => {
    if (!activeRunId || !planHash) return;
    setLoading(true);
    setNotice(null);

    try {
      // 1. Approve run
      const approveRes = await fetch(`/api/studio/runs/${activeRunId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planHash }),
      });

      if (approveRes.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const approveData = await approveRes.json();
      if (!approveRes.ok) throw new Error(approveData.error || "Approval failed");

      setManifest(approveData.manifest);

      // 2. Dispatch non-blocking render
      const renderRes = await fetch(`/api/studio/runs/${activeRunId}/render`, {
        method: "POST",
      });

      if (renderRes.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const renderData = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderData.error || "Render dispatch failed");

      setJobStatus(renderData.job);
      setViewMode("progress");
      setNotice("Video generation dispatched. Progress tracked in real-time.");
    } catch (err: any) {
      setNotice(err.message || "Generation initiation failed");
    } finally {
      setLoading(false);
    }
  };

  // Retry from preserved checkpoint
  const handleRetry = async () => {
    if (!activeRunId || loading || jobStatus?.status === "running") return;
    setLoading(true);
    setNotice(null);

    try {
      // If the run is in awaiting-approval and hasn't been approved yet, approve it
      if (manifest?.state === "awaiting-approval" && planHash) {
        const approveRes = await fetch(`/api/studio/runs/${activeRunId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planHash }),
        });

        if (approveRes.status === 401) {
          window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
          return;
        }

        const approveData = await approveRes.json();
        if (!approveRes.ok) throw new Error(approveData.error || "Approval failed");
        setManifest(approveData.manifest);
      }

      // Dispatch render directly to resume from checkpoint without re-approving
      const renderRes = await fetch(`/api/studio/runs/${activeRunId}/render`, {
        method: "POST",
      });

      if (renderRes.status === 401) {
        window.location.href = `/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }

      const renderData = await renderRes.json();
      if (!renderRes.ok) throw new Error(renderData.error || "Render dispatch failed");

      setJobStatus(renderData.job);
      setViewMode("progress");
      setNotice("Video generation resumed from saved checkpoint.");
    } catch (err: any) {
      setNotice(err.message || "Retry initiation failed");
    } finally {
      setLoading(false);
    }
  };

  // Video transport toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 58);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper images
  const sceneThumbnails = [
    "/assets/stitch/studio_scene_01.jpg",
    "/assets/stitch/studio_scene_02.jpg",
    "/assets/stitch/studio_scene_03.jpg",
  ];

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col justify-between">
      {/* Stitch Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div className="h-16 w-full max-w-[1400px] mx-auto px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <Link className="flex items-center gap-space-xs group" href="/your-videos">
              <span className="font-headline-md text-headline-md text-primary tracking-tight">Visutale</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container mb-1"></span>
            </Link>
            <div className="h-4 w-[1px] bg-outline-variant hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-space-xs">
              <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                Workspace /
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                {viewMode === "creation"
                  ? "Prompt Studio"
                  : viewMode === "manuscript"
                  ? "Studio Manuscript"
                  : viewMode === "ready"
                  ? "Finished Video Studio"
                  : viewMode === "failed"
                  ? "Generation Recovery"
                  : "Production Studio"}
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-gutter h-16">
            <button
              onClick={() => setViewMode("creation")}
              className={`h-full flex items-center px-space-xs font-title-md text-title-md transition-colors border-b-2 bg-transparent cursor-pointer ${
                viewMode === "creation" || viewMode === "manuscript"
                  ? "text-on-surface border-primary-container font-semibold"
                  : "text-on-surface-variant hover:text-on-surface border-transparent"
              }`}
            >
              Create
            </button>
            <Link
              className="text-on-surface-variant hover:text-on-surface font-title-md text-title-md h-full flex items-center px-space-xs transition-colors border-b-2 border-transparent"
              href="/your-videos"
            >
              Your Videos
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface font-title-md text-title-md h-full flex items-center px-space-xs transition-colors border-b-2 border-transparent"
              href="/welcome"
            >
              Welcome
            </Link>
          </nav>

          <div className="flex items-center gap-space-sm md:gap-space-md">
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container border border-outline-variant text-on-surface-variant font-label-code text-label-code cursor-pointer hover:bg-surface-container-high transition-colors">
              <kbd className="font-label-code">⌘</kbd>
              <kbd className="font-label-code">K</kbd>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary cursor-pointer border-0 font-title-md text-sm font-semibold select-none shadow-sm"
              >
                {currentUser?.name ? (
                  currentUser.name.charAt(0).toUpperCase()
                ) : (
                  <span className="material-symbols-outlined text-[18px]">person</span>
                )}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg p-2 z-50">
                  <div className="px-3 py-2 border-b border-outline-variant/60">
                    <p className="font-title-md text-on-surface font-semibold text-sm truncate">
                      {currentUser?.name || "Author"}
                    </p>
                    <p className="font-body-sm text-secondary text-xs truncate">
                      {currentUser?.email || ""}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await linkSocial({ provider: "google", callbackURL: window.location.href });
                    }}
                    className="w-full mt-1 px-3 py-2 text-left font-body-sm text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    <span>Link Google Account</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`w-full mt-1 px-3 py-2 text-left font-body-sm text-error hover:bg-error-container/20 rounded-lg flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors ${
                      isSigningOut ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isSigningOut ? "progress_activity" : "logout"}
                    </span>
                    <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full pt-16 bg-background min-h-screen flex-1">
        {/* Global Notification Banner */}
        {notice && (
          <div className="max-w-[1400px] mx-auto px-margin pt-space-sm">
            <div className="p-space-sm bg-surface-container-high border border-primary-container/30 rounded-lg flex items-center justify-between font-body-sm text-body-sm text-on-surface">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary-container text-[18px]">info</span>
                <span>{notice}</span>
              </div>
              <button
                onClick={() => setNotice(null)}
                className="text-outline hover:text-on-surface p-1 cursor-pointer bg-transparent border-0"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 1: CREATION / PROMPT DRAFTING (Stitch mobile & prompt) */}
        {/* ======================================================== */}
        {viewMode === "creation" && (
          <div className="max-w-[1280px] w-full mx-auto px-margin py-space-lg">
            {/* Studio Draft Engine Sub-header */}
            <div className="flex items-center justify-between py-space-sm mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                <span className="font-label-code text-label-code uppercase tracking-wider text-secondary">
                  Studio Draft Engine
                </span>
              </div>
              <div className="inline-flex p-0.5 bg-surface-container rounded-full">
                <button
                  type="button"
                  onClick={() => setCreationMode("quick")}
                  className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-all ${
                    creationMode === "quick"
                      ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  Quick Create
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode("guided")}
                  className={`px-space-md py-1 rounded-full font-label-md text-label-md transition-all ${
                    creationMode === "guided"
                      ? "bg-surface-container-lowest text-primary shadow-sm font-semibold"
                      : "text-secondary hover:text-on-surface"
                  }`}
                >
                  Guided Create
                </button>
              </div>
            </div>

            {/* Editorial Headline */}
            <div className="mb-space-lg">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Compose your narrative thesis.
              </h1>
              <p className="font-body-lg text-body-lg text-secondary mt-1">
                Translate abstract manuscripts, historical chronicles, or physics paradoxes into cinematic scripts.
              </p>
            </div>

            {/* Prompt Input Form */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm mb-space-lg border border-outline-variant/60">
              <div className="flex items-center justify-between mb-space-xs">
                <label className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold" htmlFor="topic-input">
                  Topic or manuscript premise
                </label>
                <span className="font-label-code text-label-code text-secondary tracking-normal">
                  {topicInput.split(/\s+/).filter(Boolean).length} words · {topicInput.length} chars
                </span>
              </div>
              <textarea
                id="topic-input"
                className="w-full bg-transparent resize-none p-0 text-on-surface font-body-lg text-body-lg placeholder:text-outline-variant focus:outline-none leading-relaxed"
                rows={4}
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g., Why the sky changes color at twilight, or paste an educational abstract..."
              />

              {/* Active Drafting Telemetry Ribbon */}
              <div className="mt-space-md pt-space-sm bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-secondary">
                  <span className="material-symbols-outlined text-[16px] text-primary">auto_read_play</span>
                  <span className="font-label-code text-label-code">Pacing: 140 wpm</span>
                </div>
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span className="font-label-code text-label-code text-on-surface font-medium">
                    Est. ~{Math.max(15, Math.round((topicInput.split(/\s+/).filter(Boolean).length / 140) * 60))}s runtime
                  </span>
                </div>
              </div>
            </div>

            {/* Configuration Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-space-xl">
              {/* Aspect Ratio */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-medium">Canvas Aspect Ratio</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio("vertical")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-label-md text-label-md transition-all ${
                      aspectRatio === "vertical"
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container-lowest text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">stay_current_portrait</span>
                    <span>9:16</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("square")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-label-md text-label-md transition-all ${
                      aspectRatio === "square"
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container-lowest text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">crop_square</span>
                    <span>1:1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatio("landscape")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-label-md text-label-md transition-all ${
                      aspectRatio === "landscape"
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container-lowest text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">crop_16_9</span>
                    <span>16:9</span>
                  </button>
                </div>
              </div>

              {/* Target Duration */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-medium">Target Duration</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetDuration("60")}
                    className={`flex items-center justify-between py-2.5 px-3.5 rounded-lg font-label-md text-label-md transition-all ${
                      targetDuration === "60"
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container-lowest text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">timer</span>
                      <span>~60s Short</span>
                    </div>
                    <span className="font-label-code text-[11px] opacity-80">3-4 Acts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetDuration("90")}
                    className={`flex items-center justify-between py-2.5 px-3.5 rounded-lg font-label-md text-label-md transition-all ${
                      targetDuration === "90"
                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                        : "bg-surface-container-lowest text-secondary hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">timelapse</span>
                      <span>~90s In-depth</span>
                    </div>
                    <span className="font-label-code text-[11px] opacity-80">6 Acts</span>
                  </button>
                </div>
              </div>

              {/* Voice Preset */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface font-medium">Voice Model</span>
                <div className="bg-surface-container-lowest rounded-lg p-space-sm flex items-center justify-between shadow-sm border border-outline-variant/60">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">record_voice_over</span>
                    <div className="flex flex-col">
                      <span className="font-title-md text-body-sm font-semibold text-on-surface">
                        Clara · Neural Narration
                      </span>
                      <span className="font-label-code text-[11px] text-on-surface-variant">
                        Indian English Female (Calibrated)
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                </div>
              </div>
            </div>

            {/* Submit Action Deck */}
            <div className="flex items-center justify-between gap-space-md pt-space-xs">
              <div className="flex items-center gap-space-sm">
                <span className="font-label-code text-label-code text-outline uppercase tracking-wider">
                  Preset Benchmarks:
                </span>
                {availableFixtures.map((fix) => (
                  <button
                    key={fix.id}
                    type="button"
                    onClick={() => handleCreateFromFixture(fix.id)}
                    className="font-label-code text-[11px] px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-medium transition-colors"
                  >
                    {fix.name}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCreateDraft()}
                disabled={loading}
                className="inline-flex items-center gap-2 px-space-xl py-space-sm rounded bg-primary-container text-on-primary font-title-md text-title-md hover:bg-primary transition-all shadow-md active:translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? "Generating Manuscript..." : "Generate Script & Storyboard"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: GUIDED MANUSCRIPT & STORYBOARD (Stitch desktop)  */}
        {/* ======================================================== */}
        {viewMode === "manuscript" && plan && (
          <div className="flex flex-col w-full">
            {/* Top Workspace Context Header */}
            <section className="w-full bg-surface-bright/80 backdrop-blur-sm border-b border-outline-variant/60 sticky top-16 z-30 transition-all">
              <div className="max-w-[1400px] mx-auto px-margin py-space-md flex flex-col md:flex-row md:items-center justify-between gap-space-md">
                {/* Breadcrumb & Title Area */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code">
                    <button
                      onClick={() => setViewMode("creation")}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors bg-transparent border-0 cursor-pointer text-inherit"
                    >
                      <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                      <span>Studio</span>
                    </button>
                    <span>/</span>
                    <span className="text-on-surface">Guided Manuscript</span>
                    <span className="mx-1 text-outline">·</span>
                    <span className="text-primary font-medium">{manifest?.runId || "MS-DRAFT"}</span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-x-space-md gap-y-1">
                    <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                      {plan.topic}
                    </h1>
                    <span className="font-label-code text-label-code text-on-surface-variant">v1.4 draft</span>
                  </div>
                  {/* Metadata Badges Row */}
                  <div className="flex flex-wrap items-center gap-space-xs pt-1">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container border border-outline-variant/80 text-on-surface text-label-code font-label-code">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                      <span>Script ready</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/60 text-on-surface-variant text-label-code font-label-code">
                      <span className="material-symbols-outlined text-[13px]">stay_current_portrait</span>
                      <span>Vertical 9:16</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/60 text-on-surface-variant text-label-code font-label-code">
                      <span className="material-symbols-outlined text-[13px]">schedule</span>
                      <span>{Math.round(plan.scenes.reduce((acc, s) => acc + (s.estimatedDurationMs || 15000), 0) / 1000)}s ({plan.scenes.length} scenes)</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-low border border-outline-variant/60 text-on-surface-variant text-label-code font-label-code">
                      <span className="material-symbols-outlined text-[13px]">record_voice_over</span>
                      <span>Voice: Clara (Neutral Academic)</span>
                    </div>
                  </div>
                </div>

                {/* Action Group */}
                <div className="flex items-center gap-space-sm self-start md:self-center">
                  <button
                    onClick={() => handleCreateDraft()}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-space-md py-space-xs rounded bg-surface-container-lowest border border-outline-variant text-on-surface font-title-md text-body-sm hover:bg-surface-container transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    <span>Regenerate script</span>
                  </button>
                  <button
                    onClick={handleApproveAndRender}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-space-lg py-space-xs rounded bg-primary-container text-on-primary font-title-md text-body-sm hover:bg-primary transition-all shadow-sm active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                    type="button"
                  >
                    <span>{loading ? "Validating & Compiling..." : "Generate video"}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Main Editorial Workspace: Asymmetric Two-Column Split */}
            <div className="max-w-[1400px] w-full mx-auto px-margin py-space-lg">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
                {/* Left Column: SCRIPT MANUSCRIPT (~58% / 7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-space-lg">
                  {/* Script Section Header */}
                  <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/80">
                    <div className="flex items-center gap-space-sm">
                      <span className="font-headline-sm text-headline-sm text-on-surface">Script Manuscript</span>
                      <span className="font-label-code text-label-code px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                        {plan.scenes.length} blocks
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button
                        onClick={handleSaveRevision}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors text-body-sm font-title-md cursor-pointer bg-transparent border-0"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">tune</span>
                        <span>Save revision</span>
                      </button>
                      <div className="h-3 w-[1px] bg-outline-variant"></div>
                      <button
                        onClick={() => {
                          const newScene = {
                            id: `scene-${plan.scenes.length + 1}`,
                            type: "concept-explainer" as any,
                            purpose: "Supplemental pedagogical takeaway",
                            estimatedDurationMs: 12000,
                            narration: [{ id: `line-${plan.scenes.length + 1}`, text: "Additional observations and analytical conclusion." }],
                            objects: [],
                            events: [],
                            onScreenText: ["Conclusion"],
                            sourceRefs: [],
                          };
                          setPlan({ ...plan, scenes: [...plan.scenes, newScene] });
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container-low hover:bg-surface-container text-on-surface transition-colors text-body-sm font-title-md cursor-pointer border-0"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add scene</span>
                      </button>
                    </div>
                  </div>

                  {/* Scene Cards Stack */}
                  {plan.scenes.map((scene, idx) => {
                    const isActive = activeSceneIndex === idx;
                    const narrationText = scene.narration.map((n) => n.text).join(" ");
                    const wordCount = narrationText.split(/\s+/).filter(Boolean).length;
                    const estSec = Math.round((scene.estimatedDurationMs || 15000) / 1000);

                    return (
                      <article
                        key={scene.id}
                        onClick={() => setActiveSceneIndex(idx)}
                        className={`group relative rounded-xl bg-surface-container-lowest transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "border-2 border-primary-container shadow-md"
                            : "border border-outline-variant hover:border-outline"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute -left-[2px] top-4 bottom-4 w-1 bg-primary-container rounded-r"></div>
                        )}
                        <div className="p-space-lg flex flex-col gap-space-md">
                          {/* Scene Header Bar */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-space-sm">
                              <span
                                className={`font-label-code text-label-code font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                  isActive
                                    ? "bg-primary-container text-on-primary"
                                    : "bg-surface-container text-on-surface-variant font-semibold"
                                }`}
                              >
                                Scene {String(idx + 1).padStart(2, "0")}
                              </span>
                              <span className="font-title-md text-title-md text-on-surface font-semibold">
                                {scene.purpose || `Scene ${idx + 1}`}
                              </span>
                              <span className="font-label-timestamp text-label-timestamp text-secondary bg-secondary-container/40 px-2 py-0.5 rounded">
                                {estSec}s duration
                              </span>
                              {isActive && (
                                <span className="hidden sm:inline-flex items-center gap-1 font-label-code text-label-code text-primary px-1.5 py-0.2 rounded bg-surface-container">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                  Active Focus
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors bg-transparent border-0"
                                title="Auto fix visual cue"
                              >
                                <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                              </button>
                              <button
                                className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors bg-transparent border-0"
                                title="Scene options"
                              >
                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                              </button>
                            </div>
                          </div>

                          {/* Visual Cue Annotation Box */}
                          <div className="flex items-start gap-2.5 px-space-md py-space-xs rounded bg-surface-container-low border border-outline-variant/50 text-on-surface-variant">
                            <span className="material-symbols-outlined text-primary-container text-[17px] mt-0.5 shrink-0">
                              camera
                            </span>
                            <p className="font-label-code text-label-code leading-relaxed">
                              <strong className="font-semibold text-primary">VISUAL DIRECTION:</strong>{" "}
                              {scene.visualVariant || scene.onScreenText.join(" • ") || "Minimalist atmospheric diagrammatic overlay with scientific annotations."}
                            </p>
                          </div>

                          {/* Editorial Narration Field */}
                          <div className="relative pt-1">
                            <label className="sr-only" htmlFor={`script-scene-${idx}`}>
                              Scene {idx + 1} Narration
                            </label>
                            <textarea
                              id={`script-scene-${idx}`}
                              className="w-full resize-none bg-transparent font-body-lg text-body-lg text-on-surface leading-relaxed focus:outline-none placeholder:text-outline-variant selection:bg-secondary-container"
                              rows={3}
                              value={narrationText}
                              onChange={(e) => handleNarrationChange(idx, e.target.value)}
                              placeholder="Write narration text..."
                            />
                          </div>

                          {/* Scene Footer Micro-meta */}
                          <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-on-surface-variant font-label-code text-label-code">
                            <div className="flex items-center gap-space-sm">
                              <span className="font-medium text-on-surface">{wordCount} words</span>
                              <span>·</span>
                              <span className="text-secondary">Estimated: {Math.round((wordCount / 135) * 60)}s (135 wpm)</span>
                            </div>
                            <div className="flex items-center gap-1 text-primary-container">
                              <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                              <span>Acoustic Synced</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {/* Manuscript Bottom Metrics & Control Bar */}
                  <div className="p-space-md rounded-lg bg-surface-container-low border border-outline-variant/60 flex flex-wrap items-center justify-between gap-space-sm">
                    <div className="flex items-center gap-space-md font-label-code text-label-code text-on-surface-variant">
                      <span className="flex items-center gap-1.5 text-primary">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                        {autosavedTime}
                      </span>
                      <span>·</span>
                      <span>
                        {plan.scenes.reduce((acc, s) => acc + s.narration.map((n) => n.text).join(" ").split(/\s+/).filter(Boolean).length, 0)} total words
                      </span>
                      <span>·</span>
                      <span>138 wpm pacing</span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button
                        onClick={handleSaveRevision}
                        className="px-2.5 py-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded font-title-md text-body-sm transition-colors bg-transparent border-0 cursor-pointer"
                        type="button"
                      >
                        Compute Plan Hash
                      </button>
                      <button
                        onClick={() => {
                          const text = plan.scenes.map((s, i) => `SCENE ${i + 1}\n${s.narration.map((n) => n.text).join("\n")}`).join("\n\n");
                          navigator.clipboard.writeText(text);
                          setNotice("Script copied to clipboard in Fountain format.");
                        }}
                        className="px-3 py-1 bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container rounded font-title-md text-body-sm transition-colors cursor-pointer"
                        type="button"
                      >
                        Export Script (.fountain)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: VISUAL STORYBOARD (~42% / 5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-space-lg">
                  {/* Storyboard Header */}
                  <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/80">
                    <div className="flex items-center gap-space-sm">
                      <span className="font-headline-sm text-headline-sm text-on-surface">Visual Storyboard</span>
                      <span className="font-label-code text-label-code text-on-surface-variant">
                        {plan.scenes.length} vertical assets
                      </span>
                    </div>
                    <div className="inline-flex items-center p-0.5 rounded bg-surface-container border border-outline-variant/70 text-on-surface-variant font-label-code text-label-code">
                      <button
                        onClick={() => setStoryboardView("sequence")}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          storyboardView === "sequence"
                            ? "bg-surface-container-lowest text-on-surface font-medium shadow-sm"
                            : "hover:text-on-surface"
                        }`}
                        type="button"
                      >
                        Sequence
                      </button>
                      <button
                        onClick={() => setStoryboardView("grid")}
                        className={`px-2 py-0.5 rounded transition-colors ${
                          storyboardView === "grid"
                            ? "bg-surface-container-lowest text-on-surface font-medium shadow-sm"
                            : "hover:text-on-surface"
                        }`}
                        type="button"
                      >
                        Grid
                      </button>
                    </div>
                  </div>

                  {/* Sequential Storyboard Stack */}
                  <div className={`flex ${storyboardView === "grid" ? "grid grid-cols-2 gap-space-sm" : "flex-col gap-space-md"}`}>
                    {plan.scenes.map((scene, idx) => {
                      const imgUrl = sceneThumbnails[idx % sceneThumbnails.length];
                      const estSec = Math.round((scene.estimatedDurationMs || 15000) / 1000);

                      return (
                        <div
                          key={scene.id}
                          onClick={() => setActiveSceneIndex(idx)}
                          className={`group relative rounded-xl bg-surface-container-lowest border transition-all p-space-md flex gap-space-md items-start cursor-pointer ${
                            activeSceneIndex === idx
                              ? "border-primary-container shadow-md"
                              : "border-outline-variant hover:border-outline hover:shadow-sm"
                          }`}
                        >
                          {/* Drag handle */}
                          <div className="pt-2 text-outline-variant hover:text-on-surface-variant">
                            <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                          </div>

                          {/* 9:16 Vertical Thumbnail Preview */}
                          <div className="relative w-28 h-48 rounded-lg overflow-hidden shrink-0 border border-outline-variant/80 bg-surface-container">
                            <img
                              alt={scene.purpose}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              src={imgUrl}
                            />
                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-inverse-surface/80 backdrop-blur-sm text-inverse-on-surface font-label-timestamp text-[10px]">
                              00:{String(estSec).padStart(2, "0")}
                            </div>
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded bg-surface-container-lowest/90 text-on-surface flex items-center justify-center shadow">
                                <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                              </div>
                            </div>
                          </div>

                          {/* Scene Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-label-code text-label-code text-outline uppercase">
                                Plate {String(idx + 1).padStart(2, "0")}
                              </span>
                              <h4 className="font-title-md text-title-md text-on-surface line-clamp-1 font-semibold">
                                {scene.purpose || `Sequence ${idx + 1}`}
                              </h4>
                              <p className="font-label-code text-label-code text-on-surface-variant line-clamp-3 leading-relaxed mt-1">
                                {scene.onScreenText.join(" · ") || scene.visualVariant}
                              </p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 text-on-surface-variant font-label-code text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-surface-container font-medium text-primary">
                                9:16 Vertical
                              </span>
                              <span className="text-secondary">{estSec}s render</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 3: LIVE GENERATION PROGRESS (Stitch progress view)  */}
        {/* ======================================================== */}
        {viewMode === "progress" && (
          <div className="w-full max-w-[1280px] mx-auto px-margin py-space-lg">
            {/* Top Utility Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg">
              <div className="flex flex-wrap items-center gap-space-xs text-on-surface-variant font-label-code text-label-code">
                <button
                  onClick={() => setViewMode("manuscript")}
                  className="font-body-sm text-body-sm hover:text-on-surface transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer text-inherit"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Manuscript</span>
                </button>
                <span className="text-outline">/</span>
                <span className="font-body-sm text-body-sm text-on-surface">Production Studio</span>
                <span className="text-outline">/</span>
                <span className="bg-surface-container px-2 py-0.5 rounded text-secondary font-medium tracking-wide">
                  {manifest?.runId || "JOB-2025-08X"}
                </span>
              </div>

              {/* State Toggle Simulator */}
              <div className="flex items-center gap-space-xs bg-surface-container-low p-1 rounded-xl shadow-sm">
                <button
                  type="button"
                  className="flex items-center gap-2 px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-primary font-title-md text-body-sm shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-surface-tint animate-pulse"></span>
                  <span>Active Generation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("ready")}
                  className="flex items-center gap-2 px-space-md py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface font-title-md text-body-sm"
                >
                  <span className="material-symbols-outlined text-[15px] text-outline">check_circle</span>
                  <span>Preview Ready State</span>
                </button>
              </div>
            </div>

            {/* Editorial Title & Status Scrim */}
            <div className="relative bg-surface-container-lowest rounded-xl p-space-lg md:p-space-xl shadow-sm mb-space-xl overflow-hidden border border-outline-variant/50">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-space-xs px-2.5 py-1 bg-surface-container rounded-md mb-space-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-tint animate-ping"></span>
                  <span className="font-label-code text-label-code text-primary uppercase font-medium tracking-wider">
                    ● Production in progress ({jobStatus?.percent ?? 45}%)
                  </span>
                </div>
                <h1 className="font-display-lg text-headline-lg lg:text-display-lg text-primary tracking-tight mb-space-xs font-normal">
                  Bringing your story to life.
                </h1>
                <p className="font-headline-md text-headline-sm text-on-surface-variant italic mb-space-sm">
                  &ldquo;{plan?.topic || "Why the sky changes color at twilight"}&rdquo;
                </p>
                <p className="font-body-lg text-body-md text-secondary max-w-2xl">
                  Synthesizing manuscript prose, atmospheric spectral graphics, and neural acoustics into a master 9:16 vertical video.
                </p>
              </div>
            </div>

            {/* 5-Stage Editorial Production Sequence Track */}
            <div className="mb-space-xl">
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant font-medium">
                  Production Sequence
                </span>
                <span className="font-label-timestamp text-label-timestamp text-secondary">
                  Phase IV of V · Rendering
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm">
                {/* Stage 1 */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 border border-outline-variant/60">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code text-outline uppercase">01 / Manuscript</span>
                    <span className="material-symbols-outlined text-[18px] text-surface-tint">check_circle</span>
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface font-semibold">Script</p>
                    <p className="font-label-timestamp text-label-timestamp text-on-surface-variant">Approved manuscript</p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 border border-outline-variant/60">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code text-outline uppercase">02 / Art Plates</span>
                    <span className="material-symbols-outlined text-[18px] text-surface-tint">check_circle</span>
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface font-semibold">Visuals</p>
                    <p className="font-label-timestamp text-label-timestamp text-on-surface-variant">Scene plates rendered</p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 border border-outline-variant/60">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code text-outline uppercase">03 / Voiceover</span>
                    <span className="material-symbols-outlined text-[18px] text-surface-tint">check_circle</span>
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-surface font-semibold">Narration</p>
                    <p className="font-label-timestamp text-label-timestamp text-on-surface-variant">Acoustics &amp; voice synced</p>
                  </div>
                </div>

                {/* Stage 4: Active Stage */}
                <div className="bg-primary-container text-on-primary p-space-md rounded-xl shadow-md flex flex-col justify-between h-28 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code text-on-primary-container uppercase">04 / Compositor</span>
                    <span className="material-symbols-outlined text-[18px] text-on-primary-container animate-spin">sync</span>
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-on-primary font-semibold">Rendering</p>
                    <p className="font-label-timestamp text-label-timestamp text-on-primary-container">
                      {jobStatus?.currentMessage || "Compiling frames & sync"}
                    </p>
                  </div>
                </div>

                {/* Stage 5: Pending */}
                <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm flex flex-col justify-between h-28 opacity-70">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code text-outline uppercase">05 / Packaging</span>
                    <span className="material-symbols-outlined text-[18px] text-outline">hourglass_empty</span>
                  </div>
                  <div>
                    <p className="font-title-md text-title-md text-secondary font-semibold">Ready</p>
                    <p className="font-label-timestamp text-label-timestamp text-outline">Final delivery</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Phase Dispatch Alert */}
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg border border-outline-variant/60">
              <div className="flex items-start gap-space-md">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-[20px]">layers</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-title-md text-title-md text-primary font-semibold">
                      Active Engine: Frame Assembly &amp; Spectral Layers
                    </span>
                    <span className="px-2 py-0.5 rounded bg-surface-container font-label-code text-label-code text-secondary">
                      Thread #4
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                    Compositing 1080x1920 vertical frames with synchronized Rayleigh wavelength diagrams and Clara&apos;s calibrated 48kHz acoustic narration track.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-space-sm shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLogDrawer(!showLogDrawer)}
                  className="px-space-md py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-title-md text-body-sm transition-colors flex items-center gap-1.5 cursor-pointer border-0"
                >
                  <span className="material-symbols-outlined text-[16px]">terminal</span>
                  <span>{showLogDrawer ? "Hide render logs" : "View render logs"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("manuscript")}
                  className="px-space-md py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-highest text-secondary hover:text-error font-title-md text-body-sm transition-colors cursor-pointer border-0"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Minimalist Collapsible Log Drawer */}
            {showLogDrawer && (
              <div className="bg-surface-container-low rounded-xl p-space-lg shadow-inner mb-space-lg border border-outline-variant/60">
                <div className="flex items-center justify-between mb-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">terminal</span>
                    <span className="font-label-code text-label-code uppercase tracking-wider text-on-surface font-semibold">
                      Internal Telemetry &amp; Pipeline Log
                    </span>
                  </div>
                  <span className="font-label-code text-label-code text-outline">Node #local-worker</span>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-lg font-label-code text-label-code text-on-surface-variant space-y-1 max-h-48 overflow-y-auto">
                  {jobStatus?.telemetryLogs.map((log, i) => (
                    <p key={i}>
                      <span className="text-outline">[{log.tag}]</span> {log.message}
                    </p>
                  )) || (
                    <p className="text-outline">Initializing render worker telemetry...</p>
                  )}
                </div>
              </div>
            )}

            {/* Scene Assembly Grid (3 Cards 9:16) */}
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary">Scene Plate Composition</h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    3 narrative sequences formatted in 9:16 cinematic vertical aspect ratio.
                  </p>
                </div>
                <span className="font-label-code text-label-code text-outline uppercase tracking-wider">
                  Target: 1080 × 1920 • 30 FPS
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
                {/* Scene 01 */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/50">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-tint"></span>
                        <span className="font-label-code text-label-code text-primary font-medium">SCENE 01 / 03</span>
                      </div>
                      <span className="font-label-timestamp text-label-timestamp text-secondary">00:00 - 00:18 (18s)</span>
                    </div>
                    <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-surface-container mb-space-sm shadow-inner">
                      <img
                        alt="Rayleigh Dispersion"
                        className="w-full h-full object-cover"
                        src="/assets/stitch/studio_scene_01.jpg"
                      />
                      <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded text-primary font-label-code text-label-code shadow-sm">
                        Synced ✓
                      </div>
                    </div>
                  </div>
                  <div className="pt-space-xs">
                    <p className="font-title-md text-title-md text-on-surface font-semibold mb-0.5">Rayleigh Dispersion</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic line-clamp-2">
                      &ldquo;When sunlight reaches our planet, the shorter wavelengths encounter dense atmospheric molecules...&rdquo;
                    </p>
                    <div className="mt-space-sm flex items-center justify-between text-secondary pt-space-xs border-t border-outline-variant/30">
                      <span className="font-label-code text-label-code uppercase text-outline">Waveform Synced</span>
                      <span className="font-label-timestamp text-label-timestamp text-primary font-medium">Plate Ready</span>
                    </div>
                  </div>
                </div>

                {/* Scene 02 (Rendering Now) */}
                <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col justify-between ring-2 ring-primary-container relative">
                  <div className="absolute -top-2.5 left-6 bg-primary text-on-primary font-label-code text-label-code px-2.5 py-0.5 rounded-md shadow-sm">
                    Rendering Now
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-space-sm mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-tint animate-ping"></span>
                        <span className="font-label-code text-label-code text-primary font-medium">SCENE 02 / 03</span>
                      </div>
                      <span className="font-label-timestamp text-label-timestamp text-secondary">00:18 - 00:40 (22s)</span>
                    </div>
                    <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-surface-container mb-space-sm shadow-inner">
                      <img
                        alt="Planetary Cutaway"
                        className="w-full h-full object-cover"
                        src="/assets/stitch/studio_scene_02.jpg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-container/20 to-transparent animate-pulse pointer-events-none"></div>
                      <div className="absolute bottom-3 left-3 right-3 bg-surface/90 backdrop-blur-md p-2 rounded-lg flex items-center justify-between shadow-sm">
                        <span className="font-label-code text-label-code text-primary">Frame 1,140 / 1,320</span>
                        <span className="font-label-timestamp text-label-timestamp text-surface-tint font-medium">Compositing</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-space-xs">
                    <p className="font-title-md text-title-md text-on-surface font-semibold mb-0.5">Planetary Cutaway</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic line-clamp-2">
                      &ldquo;As the sun dips lower below the horizon line, its beams traverse ten times more air mass...&rdquo;
                    </p>
                    <div className="mt-space-sm flex items-center justify-between text-secondary pt-space-xs border-t border-outline-variant/30">
                      <span className="font-label-code text-label-code uppercase text-outline">Neural Voice Track</span>
                      <span className="font-label-timestamp text-label-timestamp text-surface-tint font-medium">Temporal Sync</span>
                    </div>
                  </div>
                </div>

                {/* Scene 03 (Staged) */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/50">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                        <span className="font-label-code text-label-code text-secondary font-medium">SCENE 03 / 03</span>
                      </div>
                      <span className="font-label-timestamp text-label-timestamp text-secondary">00:40 - 00:58 (18s)</span>
                    </div>
                    <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-surface-container mb-space-sm shadow-inner">
                      <img
                        alt="Dusk Horizon Stratification"
                        className="w-full h-full object-cover"
                        src="/assets/stitch/studio_scene_03.jpg"
                      />
                      <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-md px-2 py-0.5 rounded text-secondary font-label-code text-label-code shadow-sm">
                        Staged
                      </div>
                    </div>
                  </div>
                  <div className="pt-space-xs">
                    <p className="font-title-md text-title-md text-on-surface font-semibold mb-0.5">Dusk Horizon Stratification</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant italic line-clamp-2">
                      &ldquo;Leaving only the resilient amber and crimson spectra to reach the human eye before nightfall.&rdquo;
                    </p>
                    <div className="mt-space-sm flex items-center justify-between text-secondary pt-space-xs border-t border-outline-variant/30">
                      <span className="font-label-code text-label-code uppercase text-outline">Assets Pre-Cached</span>
                      <span className="font-label-timestamp text-label-timestamp text-outline font-medium">Awaiting Phase V</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: FINISHED VIDEO STUDIO / READY (Stitch finished)  */}
        {/* ======================================================== */}
        {viewMode === "ready" && (
          <div className="max-w-[1400px] w-full mx-auto px-margin py-space-lg flex flex-col gap-space-lg">
            {/* Breadcrumb & Workspace Header Status */}
            <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded shadow-sm border border-outline-variant/50">
              <div className="flex items-center gap-space-sm min-w-0">
                <button
                  onClick={() => setViewMode("manuscript")}
                  className="inline-flex items-center gap-1 text-secondary hover:text-primary transition-colors font-label-md text-label-md group bg-transparent border-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
                    arrow_back
                  </span>
                  <span>Manuscript</span>
                </button>
                <span className="text-outline text-label-code">/</span>
                <h1 className="font-title-md text-title-md text-on-surface truncate font-semibold">
                  {plan?.topic || "Why the sky changes color at twilight"}
                </h1>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-fixed-variant font-label-code text-label-code">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                  <span>● Video ready</span>
                </div>
                <div className="hidden md:flex items-center gap-1 text-secondary font-label-code text-label-code">
                  <span>Asset: {manifest?.runId || "ast_2025_08x_fin"}</span>
                </div>
              </div>
            </div>

            {/* Main Studio Split Viewport (Player + Inspector) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: 9:16 Vertical Video Monitor & Precision Transport (5 cols) */}
              <div className="lg:col-span-5 xl:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-md p-space-sm flex flex-col border border-outline-variant/60">
                  {/* Inner Cinema Frame (9:16 aspect ratio) */}
                  <div className="relative w-full aspect-[9/16] rounded overflow-hidden bg-primary shadow-inner select-none group">
                    {/* HTML5 Video Element */}
                    {activeRunId ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        src={`/api/studio/runs/${activeRunId}/video`}
                        poster="/assets/stitch/studio_finished_video.jpg"
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-cover bg-center relative"
                        style={{ backgroundImage: `url('/assets/stitch/studio_finished_video.jpg')` }}
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent pointer-events-none"></div>

                    {/* Top Educational Header */}
                    <div className="absolute top-0 left-0 right-0 p-space-lg flex flex-col items-center text-center pointer-events-none">
                      <span className="font-label-code text-label-code text-primary-fixed uppercase tracking-widest text-[10px] mb-1">
                        Optics &amp; Atmospheric Physics
                      </span>
                      <span className="font-headline-lg text-headline-lg text-surface-container-lowest tracking-tight font-normal">
                        Rayleigh Scattering
                      </span>
                      <div className="w-12 h-[1px] bg-surface-container-lowest/30 my-2"></div>
                      <span className="font-label-code text-label-code text-surface-container-lowest/80 text-[11px] max-w-[240px]">
                        λ⁻⁴ Wavelength Dispersion Model
                      </span>
                    </div>

                    {/* Video Narrative Overlay Card (Subtitle Box) */}
                    <div className="absolute bottom-4 inset-x-4 pointer-events-none">
                      <div className="bg-surface/90 backdrop-blur-md p-space-sm rounded shadow-sm flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                            <span className="font-label-code text-label-code text-on-surface-variant font-medium">
                              Clara · Neutral Academic
                            </span>
                          </div>
                          <span className="font-label-timestamp text-label-timestamp text-secondary">
                            {formatTime(currentTime)}
                          </span>
                        </div>
                        <p className="font-body-md text-body-md text-on-surface leading-snug">
                          &ldquo;At sunset, sunlight passes through up to ten times more atmosphere, allowing warmer amber and crimson spectra to dominate.&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Center Interactive Play Overlay on Hover */}
                    <button
                      aria-label="Toggle playback"
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 backdrop-blur-[2px] cursor-pointer border-0"
                    >
                      <div className="w-14 h-14 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isPlaying ? "pause" : "play_arrow"}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Video Transport Bar & Scrubbing Rails */}
                  <div className="pt-space-sm px-space-xs flex flex-col gap-2">
                    {/* Timeline Track Scrubber */}
                    <div
                      onClick={handleSeek}
                      className="relative w-full h-4 flex items-center cursor-pointer group/scrub"
                    >
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden relative">
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-primary-container rounded-full"
                          style={{ width: `${(currentTime / Math.max(1, duration)) * 100}%` }}
                        ></div>
                      </div>
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-primary rounded-full shadow transition-transform group-hover/scrub:scale-125"
                        style={{ left: `${(currentTime / Math.max(1, duration)) * 100}%` }}
                      ></div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-secondary pt-0.5">
                      <div className="flex items-center gap-space-sm">
                        <button
                          onClick={togglePlay}
                          className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isPlaying ? "pause" : "play_arrow"}
                          </span>
                        </button>
                        <div className="font-label-timestamp text-label-timestamp flex items-center gap-1">
                          <span className="text-on-surface font-medium">{formatTime(currentTime)}</span>
                          <span className="text-outline">/</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-sm">
                        <span className="font-label-code text-label-code text-primary font-medium">1080 × 1920</span>
                        <button
                          onClick={() => {
                            if (videoRef.current?.requestFullscreen) videoRef.current.requestFullscreen();
                          }}
                          className="hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                        >
                          <span className="material-symbols-outlined text-[18px]">fullscreen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Asset Inspector, Specs & Actions (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-space-lg">
                {/* Primary Action Card: Download Master */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/60 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary-container text-[20px]">verified</span>
                      <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                        Master Render Verified
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Production quality vertical MP4 validated against timeline schemas and Remotion 4.0 standards.
                    </p>
                  </div>
                  {activeRunId && (
                    <a
                      href={`/api/studio/runs/${activeRunId}/download`}
                      download
                      className="inline-flex items-center justify-center gap-2 px-space-lg py-space-sm rounded bg-primary-container text-on-primary font-title-md text-body-sm hover:bg-primary transition-all shadow-sm shrink-0 no-underline"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Download Master (.mp4)</span>
                    </a>
                  )}
                </div>

                {/* Technical Specifications Deck */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/60">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-space-md pb-space-xs border-b border-outline-variant/40">
                    Master Technical Specifications
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md font-label-code text-label-code">
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Aspect Ratio</span>
                      <span className="text-on-surface font-semibold text-body-sm">9:16 Vertical</span>
                    </div>
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Resolution</span>
                      <span className="text-on-surface font-semibold text-body-sm">1080 × 1920</span>
                    </div>
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Frame Rate</span>
                      <span className="text-on-surface font-semibold text-body-sm">30.00 FPS</span>
                    </div>
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Video Codec</span>
                      <span className="text-on-surface font-semibold text-body-sm">H.264 / AVC</span>
                    </div>
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Audio Format</span>
                      <span className="text-on-surface font-semibold text-body-sm">48 kHz Stereo AAC</span>
                    </div>
                    <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container-low">
                      <span className="text-outline uppercase">Renderer</span>
                      <span className="text-on-surface font-semibold text-body-sm">Remotion Engine</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Scene Breakdown */}
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-outline-variant/60">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-space-md pb-space-xs border-b border-outline-variant/40">
                    Narrative Structure &amp; Scene Breakdown
                  </h3>
                  <div className="flex flex-col gap-space-sm">
                    {plan?.scenes.map((scene, idx) => (
                      <div
                        key={scene.id}
                        className="flex items-center justify-between p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-colors"
                      >
                        <div className="flex items-center gap-space-sm">
                          <span className="font-label-code text-label-code font-semibold px-2 py-0.5 rounded bg-surface-container-high text-primary">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="font-body-md text-body-md font-medium text-on-surface">
                            {scene.purpose || `Scene ${idx + 1}`}
                          </span>
                        </div>
                        <span className="font-label-timestamp text-label-timestamp text-secondary">
                          00:{String(Math.round((scene.estimatedDurationMs || 15000) / 1000)).padStart(2, "0")}s
                        </span>
                      </div>
                    )) || (
                      <p className="text-on-surface-variant font-body-sm">Standard 3-scene educational sequence.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 5: GENERATION FAILED / RECOVERY (Stitch failed view) */}
        {/* ======================================================== */}
        {viewMode === "failed" && (
          <div className="w-full max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-xl">
            {/* Top Navigation & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-sm flex-wrap font-label-code text-label-code">
                <button
                  onClick={() => setViewMode("manuscript")}
                  className="flex items-center gap-space-xs uppercase tracking-wider text-secondary hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Manuscript</span>
                </button>
                <span className="text-outline-variant">/</span>
                <span className="text-outline tracking-wider">Production Studio</span>
                <span className="text-outline-variant">·</span>
                <span className="bg-surface-container px-space-xs py-0.5 rounded text-on-surface font-medium">
                  {manifest?.runId || "JOB-FAILED"}
                </span>
              </div>
              <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-surface-container-high text-on-surface shadow-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                <span className="font-label-code text-label-code tracking-widest uppercase font-medium text-tertiary">
                  Generation Interrupted · Saved Work Preserved
                </span>
              </div>
            </div>

            {/* Architectural Heading & Intent */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              <div className="lg:col-span-8 flex flex-col gap-space-md">
                <div className="flex items-center gap-space-xs text-outline font-label-code text-label-code uppercase tracking-wider">
                  <span>Topic Ledger</span>
                  <span>—</span>
                  <span className="text-on-surface font-medium">{plan?.topic || "Why the sky changes color at twilight"}</span>
                </div>
                <h1 className="font-display-lg text-display-lg text-primary tracking-tight font-normal">
                  We couldn’t finish this video.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                  Something interrupted the generation process. Your saved work is still available in the local scratch cache and ready to resume immediately.
                </p>
                <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
                  <button
                    onClick={handleRetry}
                    disabled={loading || jobStatus?.status === "running"}
                    className="flex items-center gap-space-xs px-space-lg py-space-md rounded bg-primary-container text-on-primary font-title-md text-title-md hover:bg-primary transition-all shadow-sm active:translate-y-0.5 cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">replay</span>
                    <span>{loading ? "Resuming..." : "Retry generation"}</span>
                  </button>
                  <button
                    onClick={() => setViewMode("manuscript")}
                    className="flex items-center gap-space-xs px-space-lg py-space-md rounded bg-surface-container-lowest text-on-surface font-title-md text-title-md hover:bg-surface-container transition-colors shadow-sm cursor-pointer border-0"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    <span>Review script &amp; storyboard</span>
                  </button>
                  <Link
                    className="px-space-md py-space-md font-body-md text-body-md text-secondary hover:text-primary transition-colors underline-offset-4 hover:underline"
                    href="/your-videos"
                  >
                    Return to library
                  </Link>
                </div>
              </div>

              {/* Pipeline Diagnostic Summary */}
              <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded shadow-sm flex flex-col gap-space-md border border-outline-variant/60">
                <div className="flex items-center justify-between pb-space-xs">
                  <span className="font-label-code text-label-code uppercase tracking-widest text-outline font-medium">
                    Checkpoint Telemetry
                  </span>
                  <span className="font-label-timestamp text-label-timestamp text-tertiary">
                    {manifest?.error?.code || (jobStatus?.error?.toLowerCase().includes("timeout") ? "ERR_FRAME_TIMEOUT" : "CHECKPOINT_SAVED")}
                  </span>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Asset Integrity</span>
                    <span className="font-label-code text-label-code text-primary font-medium">
                      {jobStatus?.checkpoint?.hasAudio ? "100% Intact" : "Preserved"}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
                    <div className="bg-primary-container h-full w-[86%] transition-all duration-500"></div>
                  </div>
                </div>
                <div className="font-label-code text-label-code text-on-surface-variant leading-relaxed">
                  {jobStatus?.checkpoint?.hasAudio ? (
                    `Stage checkpoint preserved: The script (${jobStatus.checkpoint.wordCount} words), ${jobStatus.checkpoint.totalScenes} scene visuals, and verified voiceover (${jobStatus.checkpoint.voiceName || manifest?.provenance?.voiceName || "Neural Voice"}) are safely saved in your workspace archive. Retrying will resume directly without regenerating your script or audio.`
                  ) : jobStatus?.checkpoint?.missingArtifacts && jobStatus.checkpoint.missingArtifacts.length > 0 ? (
                    `Stage checkpoint: The script (${jobStatus.checkpoint.wordCount || plan?.scenes?.reduce((acc, s) => acc + s.narration.map((n) => n.text).join(" ").split(/\s+/).filter(Boolean).length, 0) || 0} words) and storyboard are preserved. Missing artifacts: ${jobStatus.checkpoint.missingArtifacts.join(", ")}. Retrying will resume from the last valid stage.`
                  ) : (
                    `Stage checkpoint preserved: The script (${plan?.scenes?.reduce((acc, s) => acc + s.narration.map((n) => n.text).join(" ").split(/\s+/).filter(Boolean).length, 0) || 0} words) and storyboard scenes are safely saved in your workspace archive. Retrying will resume directly.`
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
