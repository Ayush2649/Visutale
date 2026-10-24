"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

type UserView = {
  id: string;
  name: string;
  email: string;
};

export interface VideoItem {
  id: string;
  category: string;
  title: string;
  specs: string;
  duration: string;
  updated: string;
  image: string;
  runPath?: string;
  hasOutputVideo: boolean;
  videoSizeBytes?: number;
  state?: string;
  isSample?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export default function YourVideosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserView | null>(null);
  const [userVideos, setUserVideos] = useState<VideoItem[]>([]);
  const [hasLoadedRuns, setHasLoadedRuns] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "samples" | "empty">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("Newest first");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [previewingVideo, setPreviewingVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchStudioData() {
      try {
        const res = await fetch("/api/studio/runs");
        if (res.status === 401) {
          window.location.href = "/sign-in?callbackUrl=/your-videos";
          return;
        }
        if (res.ok && isMounted) {
          const json = await res.json();
          if (json?.user) {
            setCurrentUser(json.user);
          }
          if (json?.runs && Array.isArray(json.runs)) {
            const mapped: VideoItem[] = json.runs.map((r: any, idx: number) => {
              const topicLower = (r.topic || "").toLowerCase();
              let cat = "Educational Manuscript";
              if (topicLower.includes("water") || topicLower.includes("earth") || topicLower.includes("climate")) {
                cat = "Earth Science";
              } else if (topicLower.includes("ram") || topicLower.includes("binary") || topicLower.includes("network") || topicLower.includes("computer")) {
                cat = "Computer Science";
              } else if (topicLower.includes("physics") || topicLower.includes("sky") || topicLower.includes("light")) {
                cat = "Atmospheric Physics";
              } else if (topicLower.includes("math") || topicLower.includes("fractal")) {
                cat = "Mathematics";
              }

              const sizeMB = r.videoSizeBytes ? (r.videoSizeBytes / (1024 * 1024)).toFixed(1) : undefined;
              const specs = sizeMB ? `${sizeMB} MB • 1080p` : "1080p • 30fps";

              return {
                id: r.runId,
                category: cat,
                title: r.topic || "Untitled Video",
                specs,
                duration: "1:00",
                updated: formatRelativeTime(r.updatedAt || r.createdAt),
                image: r.hasOutputVideo
                  ? `/api/studio/runs/${r.runId}/previews/frame-00001.png`
                  : sampleVideos[idx % sampleVideos.length].image,
                runPath: r.runPath,
                hasOutputVideo: Boolean(r.hasOutputVideo),
                videoSizeBytes: r.videoSizeBytes,
                state: r.state,
                isSample: false,
              };
            });
            setUserVideos(mapped);
            // Default to empty state if user has no runs yet
            if (mapped.length === 0) {
              setViewMode("empty");
            } else {
              setViewMode("grid");
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user runs in your-videos:", err);
      } finally {
        if (isMounted) setHasLoadedRuns(true);
      }
    }
    fetchStudioData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error in your-videos:", err);
    } finally {
      window.location.href = "/sign-in";
    }
  };

  const sampleVideos: VideoItem[] = [
    {
      id: "vid_01",
      category: "Atmospheric Physics",
      title: "Why the sky changes color at twilight",
      specs: "1080p • 60fps",
      duration: "0:58",
      updated: "Updated 2 hours ago",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAVt-ZNYnPBD6xQNwYmCEOLY0h2nLFAUA5oR9VWPNozP7Cby9nnsoCzHbGdZCiSHJdm4fVDaMEKuQbi3CSccI_9pCJM0XnnFYO0E-0IoSIgz0_2-AxoVhNh-isqnhO9EWeBcOgQ3f960pROhvG3_kasiBpGyY96zQ4i1Ze8TO3F1ZR0f2I-FogjKhdKZNkprMigVApjjhMGRhqoeIg_UNvkG0BjV-yzZCsUbYPVkkaDoaFLWDDroux5",
      hasOutputVideo: false,
      isSample: true,
    },
    {
      id: "vid_02",
      category: "Mathematics",
      title: "The mathematics behind fractals",
      specs: "1080p • 60fps",
      duration: "1:14",
      updated: "Updated Yesterday",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCq-eGodPTPBfcqvUqOMQibzvpjZsd6ii1bnG_ResvpwCsTYHduDXgsPEFi50S63NwBx8IjImJSDzxW_ftVETe14uxhT-z-1sKisjlGqRSvAKM0_tkdT3zcxz4Snuh58ltuO0i4Q4t-4wZyuAd7V4CZZT9IW-v0elSp7-XehgI0lNKdMy28lS2vlODD5FuAl4w28j_tKh94W_ejkAuHMkWwpO787yQ9yv_auDKgVZ6evYHTCY6ip6UU",
      hasOutputVideo: false,
      isSample: true,
    },
    {
      id: "vid_03",
      category: "Computer Science",
      title: "How neural networks learn",
      specs: "1080p • 60fps",
      duration: "0:45",
      updated: "Oct 24, 2025",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCLT7S4-BeY9CD56zqkVPYcrQxArZ8gRRs72J0QsdDzrI0K5ERztqrlmdSs5BANP3XFJ9lUHpIEuk1KFe7xJ9Xexb17SENnM0pkCOFe_-eJMXaYIcAAeR0qf2DbTcIbfFsOznNt3ILPk5SQ0V_1hIKO37CFt_0jEw3FSvHdtLAz2U5A1HmoNKjFyT9YUVXrKAKWov3Bc9824epnrg3HBhd3ODpMtWoLzU4r5YVBEpc1lPPrbsPKi2tB",
      hasOutputVideo: false,
      isSample: true,
    },
    {
      id: "vid_04",
      category: "Astrophysics",
      title: "How black holes bend spacetime",
      specs: "1080p • 60fps",
      duration: "1:30",
      updated: "Oct 19, 2025",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD6maoN54GYgHMQG6pbzuvI0izRgBq2YCtvp2aHdshSVrcz2lxSnKG5F7H9RniEWlFqQqcncZlrq4IN9cNuT0BlR6A5bzz6kWu9_mom758DuokH4Pslo3Rjuu_BYQGmPK3D4uLDGOCHWwIEi4GRuuXLmQjLCWC-kBv3ftT720sMpvFJB8lzQ3q0SQU-UZOqca1JJxw2mCshPENOLRpeqawgKN6mYDBeyUtK_bOE3A_PDGFgz6BVIseo",
      hasOutputVideo: false,
      isSample: true,
    },
    {
      id: "vid_05",
      category: "Earth Science",
      title: "Understanding the water cycle",
      specs: "1080p • 60fps",
      duration: "1:02",
      updated: "Oct 12, 2025",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDZddxAPd1PhSt2YxU_fSXLQDSOBSSrL8AmmeUThyyAoaocF8GVfNR49gKqeqKDkxWJ3S247A-AE-osRdoy8DzaC9TuMvOgUSSPSRs9twPnKJy3yAU8_tpnb9EwHDiyEijJ4fb9NGCyj4u3hiYreH5XhLDdSME6bgjlKL3gNWbgPI1-PTGQ1vqaN3AxzN59kSUWMxZPVusRPBFkBHYwR1J4sO-z3iiyEFP2iL6Zg0Jsa2bl1N4OQGPA",
      hasOutputVideo: false,
      isSample: true,
    },
    {
      id: "vid_06",
      category: "History",
      title: "The architecture of ancient Rome",
      specs: "1080p • 60fps",
      duration: "1:20",
      updated: "Sep 28, 2025",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDEZoiWuntIGTxl6k5iUPkaQkAaGpLJ7qt4q-qxb6QkIvYGIyNl4NXewmYVLhTUVQ3Lb9LzpJTTg9nI02IFlAnKUzelf34Q7CdEpsl-5Xe407yrFNATK2QMzgVDMovGPOM17UjVhGx-TQNN0KWkzIiRkJrRbrMdGEBXUJ5_PLlZvOdpEjWH25otNpE3mtqt4srMEXitDOjSpSagfYUyH1AzlCHNH-Erin_dEsEYXiNzAeZFsmQqP2ou",
      hasOutputVideo: false,
      isSample: true,
    },
  ];

  const categories = [
    "all",
    "Physics",
    "Mathematics",
    "Computer Science",
    "Astrophysics",
    "Earth Science",
    "History",
  ];

  const currentSource = viewMode === "samples" ? sampleVideos : userVideos;

  const filteredVideos = currentSource.filter((v) => {
    const matchesCat =
      activeCategory === "all" ||
      v.category.toLowerCase().includes(activeCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <>
      {/* Editorial Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant">
        <div className="h-16 w-full max-w-[1400px] mx-auto px-margin-mobile sm:px-margin flex items-center justify-between">
          <div className="flex items-center gap-space-sm sm:gap-space-md">
            <Link className="flex items-center gap-space-xs group" href="/your-videos">
              <span className="font-headline-md text-headline-md text-primary tracking-tight font-normal">
                Visutale
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container mb-1"></span>
            </Link>
            <div className="hidden sm:block h-4 w-[1px] bg-outline-variant"></div>
            <div className="hidden sm:flex items-center gap-space-xs">
              <span className="font-label-code text-label-code text-on-surface-variant uppercase tracking-wider">
                Workspace /
              </span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">
                Studio Archive
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-space-md sm:gap-gutter h-16">
            <Link
              className="text-on-surface-variant hover:text-on-surface font-title-md text-title-md h-full flex items-center px-space-xs transition-colors border-b-2 border-transparent"
              href="/studio"
            >
              Create
            </Link>
            <Link
              aria-current="page"
              className="h-full flex items-center px-space-xs transition-colors text-primary font-medium border-b-2 border-primary-container shadow-[inset_0_-2px_0_0_#134e4a]"
              href="/your-videos"
            >
              Your Videos
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface font-title-md text-title-md h-full flex items-center px-space-xs transition-colors border-b-2 border-transparent"
              href="#settings"
            >
              Settings
            </Link>
          </nav>
          <div className="flex items-center gap-space-md relative">
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container border border-outline-variant text-on-surface-variant font-label-code text-label-code select-none">
              <kbd className="font-label-code">⌘</kbd>
              <kbd className="font-label-code">K</kbd>
            </div>
            {/* Authenticated User Button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium text-xs border-0 cursor-pointer shadow-sm hover:opacity-90"
              title={currentUser?.email || "User Profile"}
              type="button"
            >
              {currentUser?.name
                ? currentUser.name.charAt(0).toUpperCase()
                : <span className="material-symbols-outlined text-[18px]">person</span>}
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-64 bg-surface-container-lowest rounded-lg shadow-xl border border-outline-variant/40 py-2 z-50">
                <div className="px-3 py-2 border-b border-outline-variant/30">
                  <p className="font-title-md text-title-md text-on-surface truncate">
                    {currentUser?.name || "Author / Educator"}
                  </p>
                  <p className="font-label-code text-[11px] text-outline truncate">
                    {currentUser?.email || "Authenticated Session"}
                  </p>
                  <span className="inline-block mt-1 font-label-code text-[10px] text-primary-container bg-primary-container/10 px-1.5 py-0.5 rounded">
                    MongoDB Verified Session
                  </span>
                </div>
                <Link
                  href="/welcome"
                  className="w-full text-left px-3 py-2 text-body-sm font-body-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Create Video
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className={`w-full text-left px-3 py-2 text-body-sm font-body-sm text-error hover:bg-error-container/20 flex items-center gap-2 bg-transparent border-0 cursor-pointer ${
                    isSigningOut ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSigningOut ? "progress_activity" : "logout"}
                  </span>
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full pt-16 bg-background min-h-screen">
        <div className="flex flex-col w-full">
          <div className="max-w-[1360px] mx-auto w-full px-margin-mobile sm:px-margin py-space-xl">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-lg">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-code text-label-code uppercase tracking-widest text-secondary font-medium">
                    Archive Codex
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-code text-label-code text-on-surface-variant">
                    {viewMode === "empty" || (!userVideos.length && viewMode !== "samples")
                      ? "00 Manifests Synthesized"
                      : `${(viewMode === "samples" ? sampleVideos.length : userVideos.length).toString().padStart(2, "0")} Manifests Synthesized`}
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-normal tracking-tight">
                  Your videos
                </h1>
                <p className="font-body-md text-body-md text-secondary">
                  Every idea you&apos;ve brought to life, indexed as modular cinematic manuscripts.
                </p>
              </div>
              <div className="flex items-center gap-space-sm flex-wrap">
                <button
                  className="inline-flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md px-space-md py-space-sm rounded-lg transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    file_upload
                  </span>
                  <span>Import Script</span>
                </button>
                <Link
                  className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-title-md text-title-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm"
                  href="/welcome"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Create video</span>
                </Link>
              </div>
            </div>

            {/* Action Notice Notification Banner */}
            {actionNotice && (
              <div className="mb-space-md p-space-sm bg-surface-container-high rounded-lg border border-outline-variant/60 flex items-center justify-between text-on-surface font-body-sm text-body-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">
                    info
                  </span>
                  <span>{actionNotice}</span>
                </div>
                <button
                  aria-label="Dismiss notice"
                  className="p-1 rounded text-outline hover:text-on-surface transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center"
                  onClick={() => setActionNotice(null)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Toolbar: Search, Filters & View Mode Segmented Switch */}
            <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm mb-space-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[260px] max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                  search
                </span>
                <input
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low focus:bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-body-sm rounded-lg focus:outline-none transition-all"
                  id="video-search-input"
                  placeholder="Search your videos, topics, or transcripts..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories Filter Pills */}
              <div className="flex items-center gap-space-xs overflow-x-auto py-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`category-btn px-space-md py-1.5 rounded-lg font-body-sm text-body-sm transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? "bg-primary-container text-on-primary"
                        : "text-secondary hover:text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => setActiveCategory(cat)}
                    type="button"
                  >
                    {cat === "all" ? "All" : cat}
                  </button>
                ))}
              </div>

              {/* Right Controls: Sort & Empty State Switcher */}
              <div className="flex items-center gap-space-sm justify-between lg:justify-end">
                <div className="relative">
                  <button
                    className="flex items-center gap-space-xs px-space-sm py-1.5 bg-surface-container-low text-on-surface font-body-sm text-body-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    type="button"
                  >
                    <span className="font-label-code text-label-code text-secondary uppercase">
                      Sort:
                    </span>
                    <span className="font-medium">{sortOption}</span>
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      expand_more
                    </span>
                  </button>
                  {showSortMenu && (
                    <div className="absolute right-0 mt-1 w-44 bg-surface-container-lowest rounded-lg shadow-xl py-1 z-20 border border-outline-variant/30">
                      {["Newest first", "Oldest first", "Longest duration", "Title (A-Z)"].map(
                        (opt) => (
                          <button
                            key={opt}
                            className="w-full text-left px-3 py-1.5 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low flex items-center justify-between cursor-pointer"
                            onClick={() => {
                              setSortOption(opt);
                              setShowSortMenu(false);
                            }}
                            type="button"
                          >
                            <span>{opt}</span>
                            {sortOption === opt && (
                              <span className="material-symbols-outlined text-[16px] text-primary">
                                check
                              </span>
                            )}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Mode Segmented Control */}
                <div className="bg-surface-container-low p-1 rounded-lg flex items-center gap-0.5">
                  <button
                    className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-surface-container-lowest text-on-surface shadow-xs"
                        : "text-secondary hover:text-on-surface"
                    }`}
                    onClick={() => setViewMode("grid")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">grid_view</span>
                    <span className="hidden sm:inline">Your videos</span>
                    <span className="font-label-code text-label-code text-secondary ml-0.5">
                      ({userVideos.length})
                    </span>
                  </button>
                  <button
                    className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "samples"
                        ? "bg-surface-container-lowest text-on-surface shadow-xs"
                        : "text-secondary hover:text-on-surface"
                    }`}
                    onClick={() => setViewMode("samples")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">auto_stories</span>
                    <span className="hidden sm:inline">Samples</span>
                    <span className="font-label-code text-label-code text-secondary ml-0.5">
                      ({sampleVideos.length})
                    </span>
                  </button>
                  <button
                    className={`px-space-sm py-1 rounded font-body-sm text-body-sm font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      viewMode === "empty"
                        ? "bg-surface-container-lowest text-on-surface shadow-xs"
                        : "text-secondary hover:text-on-surface"
                    }`}
                    onClick={() => setViewMode("empty")}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">crop_square</span>
                    <span className="hidden sm:inline">Empty state</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Video Grid View */}
            {(viewMode === "grid" || viewMode === "samples") && filteredVideos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-lg">
                {filteredVideos.map((video) => (
                  <article
                    key={video.id}
                    className="video-card group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Vertical 9:16 aspect preview box */}
                    <div className="relative w-full aspect-[9/16] bg-primary overflow-hidden">
                      <img
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={video.image}
                        onError={(e) => {
                          e.currentTarget.src = "/assets/stitch/studio_finished_video.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none"></div>
                      <div className="absolute top-space-sm left-space-sm right-space-sm flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-label-code text-label-code uppercase tracking-wider">
                          9:16 Vertical
                        </span>
                        <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white font-label-timestamp text-label-timestamp">
                          {video.duration}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/35 backdrop-blur-[2px]">
                        <button
                          aria-label="Play video preview"
                          onClick={() => {
                            if (video.hasOutputVideo) {
                              setPreviewingVideo(video);
                            } else if (video.isSample) {
                              setActionNotice(`Sample benchmark for "${video.title}". Open in Studio to view or render.`);
                            } else {
                              setActionNotice(`Video "${video.title}" is in state '${video.state || "draft"}'. Click 'Open in Studio' to approve and render.`);
                            }
                          }}
                          className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer border-0"
                          type="button"
                        >
                          <span
                            className="material-symbols-outlined text-[26px] ml-0.5"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            play_arrow
                          </span>
                        </button>
                      </div>
                      <div className="absolute bottom-space-sm left-space-sm right-space-sm flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Link
                          href={video.isSample ? "/studio" : `/studio?runPath=${encodeURIComponent(video.runPath || video.id)}`}
                          className="px-2.5 py-1 rounded bg-white/90 hover:bg-white text-on-surface font-body-sm text-body-sm flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">movie</span>
                          <span>Open in Studio</span>
                        </Link>
                        <div className="flex items-center gap-1">
                          {video.hasOutputVideo ? (
                            <a
                              href={`/api/studio/runs/${video.id}/download`}
                              download
                              aria-label="Download MP4"
                              className="w-7 h-7 rounded bg-white/90 hover:bg-white text-on-surface flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                              title="Download MP4"
                            >
                              <span className="material-symbols-outlined text-[15px]">download</span>
                            </a>
                          ) : (
                            <button
                              aria-label="Download MP4"
                              onClick={() => setActionNotice(`Video render has not been completed for "${video.title}".`)}
                              className="w-7 h-7 rounded bg-white/90 hover:bg-white text-on-surface flex items-center justify-center shadow-sm transition-colors cursor-pointer border-0"
                              title="Download MP4"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[15px]">download</span>
                            </button>
                          )}
                          <Link
                            href={`/studio?topic=${encodeURIComponent(video.title)}`}
                            aria-label="Duplicate Script"
                            className="w-7 h-7 rounded bg-white/90 hover:bg-white text-on-surface flex items-center justify-center shadow-sm transition-colors"
                            title="Duplicate Script"
                          >
                            <span className="material-symbols-outlined text-[15px]">content_copy</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Metadata Card Body */}
                    <div className="p-space-md flex flex-col flex-1 justify-between gap-space-sm bg-surface-container-lowest">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-label-code text-label-code uppercase tracking-wider text-primary font-medium">
                            {video.category}
                          </span>
                          <span className="font-label-code text-label-code text-outline uppercase">
                            {video.specs}
                          </span>
                        </div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors leading-snug line-clamp-2 font-normal">
                          {video.title}
                        </h3>
                      </div>
                      <div className="pt-space-xs flex items-center justify-between text-secondary">
                        <div className="flex items-center gap-1.5 font-label-code text-label-code">
                          <span className={`w-1.5 h-1.5 rounded-full ${video.hasOutputVideo ? "bg-primary-container" : "bg-outline"}`}></span>
                          <span>{video.hasOutputVideo ? "Master Verified" : video.updated}</span>
                        </div>
                        <div className="relative">
                          <button
                            aria-label="More options"
                            className="w-7 h-7 rounded hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer"
                            onClick={() =>
                              setActiveCardMenuId(activeCardMenuId === video.id ? null : video.id)
                            }
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                          </button>
                          {activeCardMenuId === video.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-44 bg-surface-container-lowest rounded-lg shadow-xl py-1 z-30 border border-outline-variant/40">
                              <Link
                                href={video.isSample ? "/studio" : `/studio?runPath=${encodeURIComponent(video.runPath || video.id)}`}
                                className="w-full text-left px-3 py-1.5 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer no-underline"
                                onClick={() => setActiveCardMenuId(null)}
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                Open in Studio
                              </Link>
                              {video.hasOutputVideo && (
                                <a
                                  href={`/api/studio/runs/${video.id}/download`}
                                  download
                                  className="w-full text-left px-3 py-1.5 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer no-underline"
                                  onClick={() => setActiveCardMenuId(null)}
                                >
                                  <span className="material-symbols-outlined text-[15px]">download</span>
                                  Download MP4
                                </a>
                              )}
                              <Link
                                href={`/studio?topic=${encodeURIComponent(video.title)}`}
                                className="w-full text-left px-3 py-1.5 text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer no-underline"
                                onClick={() => setActiveCardMenuId(null)}
                              >
                                <span className="material-symbols-outlined text-[15px]">copy_all</span>
                                Duplicate prompt
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Empty State View */}
            {(viewMode === "empty" || (viewMode === "grid" && userVideos.length === 0)) && (
              <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-surface-container-lowest rounded-xl shadow-sm">
                <div className="relative w-44 h-44 mb-space-lg flex items-center justify-center">
                  <svg
                    className="w-full h-full text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 160 160"
                  >
                    <rect
                      height="120"
                      opacity="0.45"
                      rx="4"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                      width="88"
                      x="36"
                      y="20"
                    ></rect>
                    <line opacity="0.25" strokeWidth="1" x1="48" x2="112" y1="44" y2="44"></line>
                    <line opacity="0.25" strokeWidth="1" x1="48" x2="112" y1="60" y2="60"></line>
                    <line opacity="0.25" strokeWidth="1" x1="48" x2="98" y1="76" y2="76"></line>
                    <line opacity="0.25" strokeWidth="1" x1="48" x2="112" y1="92" y2="92"></line>
                    <path d="M26 30 H36 V20" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M134 30 H124 V20" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M26 130 H36 V140" stroke="currentColor" strokeWidth="1.5"></path>
                    <path d="M134 130 H124 V140" stroke="currentColor" strokeWidth="1.5"></path>
                    <circle cx="80" cy="80" opacity="0.7" r="14" stroke="currentColor" strokeWidth="1"></circle>
                    <line strokeWidth="1.2" x1="80" x2="80" y1="60" y2="64"></line>
                    <line strokeWidth="1.2" x1="80" x2="80" y1="96" y2="100"></line>
                    <line strokeWidth="1.2" x1="60" x2="64" y1="80" y2="80"></line>
                    <line strokeWidth="1.2" x1="96" x2="100" y1="80" y2="80"></line>
                  </svg>
                </div>
                <div className="max-w-md mx-auto flex flex-col items-center gap-space-xs mb-space-lg">
                  <span className="font-label-code text-label-code uppercase tracking-widest text-primary font-medium">
                    Canvas Unwritten
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-normal">
                    Your first story starts here.
                  </h2>
                  <p className="font-body-md text-body-md text-secondary">
                    Turn any conceptual question or research paper into an articulate, animated video manuscript.
                  </p>
                </div>
                <div className="flex items-center gap-space-sm flex-wrap justify-center">
                  <Link
                    className="inline-flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-title-md text-title-md px-space-md py-space-sm rounded-lg transition-colors shadow-sm"
                    href="/studio"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Create your first video</span>
                  </Link>
                  <button
                    className="inline-flex items-center gap-space-xs bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-title-md px-space-md py-space-sm rounded-lg transition-colors cursor-pointer"
                    onClick={() => {
                      setViewMode("samples");
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    type="button"
                  >
                    <span>Explore sample archive</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Archive Status Bar / Footer summary */}
            <div className="mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-md text-secondary font-label-code text-label-code">
              <div className="flex items-center gap-space-md">
                <span>STORAGE: {((userVideos.reduce((acc, v) => acc + (v.videoSizeBytes || 0), 0)) / (1024 * 1024)).toFixed(1)} MB / 50 GB ALLOCATED</span>
                <span>•</span>
                <span>OUTPUT: 1080P MASTER ARCHIVE</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span>ALL MANUSCRIPTS SYNCED</span>
                <span className="material-symbols-outlined text-primary text-[14px]">
                  cloud_done
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Video Preview Modal */}
      {previewingVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setPreviewingVideo(null)}
        >
          <div
            className="relative bg-surface-container-lowest rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-outline-variant flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40 bg-surface">
              <div className="min-w-0 pr-2">
                <p className="font-title-md text-title-md text-on-surface truncate font-semibold">
                  {previewingVideo.title}
                </p>
                <p className="font-label-code text-[11px] text-secondary">
                  {previewingVideo.specs} • 9:16 Vertical Master
                </p>
              </div>
              <button
                onClick={() => setPreviewingVideo(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent"
                type="button"
                aria-label="Close video preview"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative w-full aspect-[9/16] bg-black max-h-[70vh]">
              <video
                src={`/api/studio/runs/${previewingVideo.id}/video`}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between p-3 bg-surface-container-low border-t border-outline-variant/40">
              <Link
                href={`/studio?runPath=${encodeURIComponent(previewingVideo.runPath || previewingVideo.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-title-md text-body-sm transition-colors no-underline"
              >
                <span className="material-symbols-outlined text-[16px]">movie</span>
                <span>Open in Studio</span>
              </Link>
              <a
                href={`/api/studio/runs/${previewingVideo.id}/download`}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary-container hover:bg-primary text-on-primary font-title-md text-body-sm transition-colors no-underline shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Colophon Footer */}
      <footer className="w-full bg-surface-container-low py-space-lg border-t border-outline-variant/30">
        <div className="max-w-[1400px] mx-auto px-margin flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code text-label-code uppercase tracking-wider text-outline">
              Edition 01
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              © 2025 Visutale Publishing Architecture. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-space-lg">
            <a
              className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              href="#colophon"
            >
              Colophon
            </a>
            <a
              className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              href="#privacy"
            >
              Privacy Policy
            </a>
            <a
              className="font-label-code text-label-code uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              href="#terms"
            >
              Terms
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

