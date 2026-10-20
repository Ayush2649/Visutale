"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function WelcomePage() {
  const router = useRouter();
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptNotice, setPromptNotice] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const handleGenerateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    router.push(`/studio?topic=${encodeURIComponent(promptText.trim())}`);
  };

  return (
    <>
      {/* Editorial Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(24,24,27,0.03)]">
        <div className="h-16 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <Link className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-normal italic" href="/your-videos">
              Visutale
            </Link>
            <span className="font-label-code text-label-code text-outline uppercase hidden sm:inline">
              • Precision Narrative Instrument
            </span>
          </div>
          <nav className="flex items-center gap-space-lg">
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm"
              href="/studio"
            >
              Create
            </Link>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm"
              href="/your-videos"
            >
              Your Videos
            </Link>
            <button
              onClick={handleSignOut}
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-error transition-colors py-space-xs px-space-sm bg-transparent border-0 cursor-pointer"
            >
              Sign Out
            </button>
          </nav>
          <div className="flex items-center gap-space-md">
            <Link
              href="/your-videos"
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 bg-surface max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col">
        <div className="flex flex-col w-full">
          {/* Top Subtle Status Ribbon */}
          <div className="w-full flex items-center justify-between pb-space-lg pt-space-xs text-on-surface-variant text-label-code font-label-code uppercase tracking-widest text-[11px]">
            <div className="flex items-center gap-space-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-primary-container"></span>
              <span>Workspace Ready</span>
              <span className="text-outline">/</span>
              <span className="text-on-surface font-semibold">Manuscript Engine 2.4</span>
            </div>
            <div className="hidden sm:flex items-center gap-space-md text-outline">
              <span>Drafting Protocol: Academic · Cinema 9:16</span>
              <span>•</span>
              <span>Session #VT-88092</span>
            </div>
          </div>

          {/* Editorial Welcome Hero Block */}
          <div className="relative w-full py-space-xl flex flex-col items-start gap-space-lg">
            {/* Eyebrow Tag */}
            <div className="flex items-center gap-space-xs bg-surface-container px-space-sm py-space-xs rounded text-primary-container">
              <span className="material-symbols-outlined text-[15px]">auto_stories</span>
              <span className="font-label-code text-label-code uppercase tracking-wider font-medium">
                Welcome to Visutale
              </span>
            </div>

            {/* Editorial Lead Headlines */}
            <div className="max-w-3xl flex flex-col gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg md:text-display-lg md:font-display-lg text-on-surface tracking-tight leading-tight font-normal">
                Your ideas deserve to be seen.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Turn what you know into engaging educational videos without a complicated editing workflow. Where prose, diagrammatic precision, and cinematic vertical motion coalesce.
              </p>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md pt-space-sm w-full sm:w-auto">
              <Link
                className="inline-flex items-center justify-center gap-space-sm bg-primary-container hover:bg-[#114441] active:translate-y-[0.5px] text-surface-container-lowest font-label-md text-title-md px-space-lg py-space-md rounded shadow-sm transition-all group"
                href="/your-videos"
              >
                <span>Create your first video</span>
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </Link>
              <button
                className="inline-flex items-center justify-center gap-space-sm bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-body-md px-space-lg py-space-md rounded shadow-sm transition-all"
                onClick={() => setShowSampleModal(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px] text-primary-container">
                  play_circle
                </span>
                <span>Explore an example</span>
              </button>
              <span className="font-label-code text-label-code text-outline sm:pl-space-sm self-center">
                Avg. creation cycle: ~3.5 min
              </span>
            </div>
          </div>

          {/* Curated 9:16 Vertical Showcase Grid */}
          <section className="w-full py-space-xl">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-sm pb-space-lg">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center gap-space-xs text-outline font-label-code text-label-code uppercase tracking-widest">
                  <span>Plate Archival System</span>
                  <span>•</span>
                  <span>Actual Render Outputs</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-normal">
                  Curated Scientific Narratives
                </h2>
              </div>
              <div className="flex items-center gap-space-sm text-label-code font-label-code text-on-surface-variant text-[12px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>Standard Ratio: 9:16 UHD / 60 FPS</span>
              </div>
            </div>

            {/* 3-Column Asymmetric Card Array */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
              {/* Card 1: Atmospheric Optics */}
              <article className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative w-full aspect-[9/16] bg-surface-container overflow-hidden">
                  <img
                    alt="Editorial infographic diagram showing Rayleigh scattering"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWqP8FzWS5Jhe59_THJOxR8Xp_9HsFRoKHYlS9R6SLgzL6n9IKXykRLk_kO9iAusZwRBBei3DJCo0g0mOaQxeYIBxjvz886hfXdCMMN7_BBB4UsQFMWKuGn9UA8cfyi7XH26luUZI2bIeitfM66LYoRRYq4QVE3J6LrDbDVoE-APT3GGK_gfdeyMB4SrIh7soBPROiUxWJkQX-z7MwLclSvKeho8tk_RoIeMDv06Dcid6aPe3RVQ5n"
                  />
                  <div className="absolute top-space-md left-space-md right-space-md flex items-center justify-between pointer-events-none">
                    <span className="bg-surface-container-lowest/90 backdrop-blur-sm px-space-sm py-space-xs rounded text-primary-container font-label-code text-label-code tracking-wider uppercase font-semibold">
                      Optics 01
                    </span>
                    <span className="bg-inverse-surface/80 backdrop-blur-sm text-surface-container-lowest font-label-timestamp text-label-timestamp px-space-sm py-space-xs rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-tertiary-fixed-dim">
                        timer
                      </span>
                      00:58
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent flex items-end p-space-md">
                    <div className="flex items-center justify-between w-full text-surface-container-lowest">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                          mic
                        </span>
                        <span className="font-label-code text-[11px] tracking-wide">
                          Clara Neural Voice
                        </span>
                      </div>
                      <span className="font-label-code text-[11px] text-outline-variant">
                        Scene 03/05
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-space-lg flex flex-col justify-between flex-1 gap-space-md bg-surface-container-lowest">
                  <div className="space-y-space-xs">
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                      <span>Atmospheric Physics</span>
                      <span>•</span>
                      <span className="text-primary-container font-medium">Wave Dispersion</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors font-normal">
                      Why the sky changes color at twilight
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                      An exploration of Rayleigh scattering, wavelength dissipation, and how solar rays traverse dense lower atmospheric strata.
                    </p>
                  </div>
                  <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                    <span className="font-label-code text-label-code text-outline">
                      Preset: Academic Essay
                    </span>
                    <button
                      onClick={() => setShowSampleModal(true)}
                      className="inline-flex items-center gap-space-xs text-primary-container font-label-md hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      <span>Inspect Script</span>
                      <span className="material-symbols-outlined text-[14px]">north_east</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 2: Solar Radiation & Earth Geometry */}
              <article className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 md:-translate-y-3">
                <div className="relative w-full aspect-[9/16] bg-surface-container overflow-hidden">
                  <img
                    alt="Technical cosmological infographic diagram of planet Earth"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXqDvZS1iDrpMPV_N_pY5lcQiCCVUHB_kumiR3H9ncvI5E7VBlBsFjJMfqNTsop_oflQqBg3paP5CXtoRMQiEQ6abrkydQg3irRAsqJjwW8USCSfDKvUtiAaS7v1oFdv3JF_t1SmiwXLqEY5LGhJ04UYiRRgXnPIIQc-9g35TwQW8N1_WcpVJSfVuMTe38uuCJLDE38ASJ6rngMcwieecQBxOmfcgmgAoYAsCnKv6RhYfrrBieS91S"
                  />
                  <div className="absolute top-space-md left-space-md right-space-md flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-primary-container text-surface-container-lowest px-space-sm py-space-xs rounded font-label-code text-label-code uppercase tracking-wider font-semibold">
                      <span className="material-symbols-outlined text-[13px]">stars</span>
                      <span>Staff Benchmark</span>
                    </div>
                    <span className="bg-inverse-surface/80 backdrop-blur-sm text-surface-container-lowest font-label-timestamp text-label-timestamp px-space-sm py-space-xs rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-tertiary-fixed-dim">
                        timer
                      </span>
                      01:15
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-surface-container-lowest/95 shadow-md flex items-center justify-center text-primary-container transform group-hover:scale-105 transition-transform duration-300">
                      <span className="material-symbols-outlined text-[32px] translate-x-0.5">
                        play_arrow
                      </span>
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent flex items-end p-space-md">
                    <div className="flex items-center justify-between w-full text-surface-container-lowest">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                          graphic_eq
                        </span>
                        <span className="font-label-code text-[11px] tracking-wide">
                          Julian Studio Master
                        </span>
                      </div>
                      <span className="font-label-code text-[11px] text-outline-variant">
                        Scene 01/08
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-space-lg flex flex-col justify-between flex-1 gap-space-md bg-surface-container-lowest">
                  <div className="space-y-space-xs">
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                      <span>Geophysics</span>
                      <span>•</span>
                      <span className="text-primary-container font-medium">Solar Flux</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors font-normal">
                      Solar Radiation &amp; Atmospheric Dispersion
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                      Cross-section mapping from the thermosphere down to ground level detailing orbital flux, angle of incidence, and refraction boundaries.
                    </p>
                  </div>
                  <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                    <span className="font-label-code text-label-code text-outline">
                      Preset: Kinetic Diagram
                    </span>
                    <button
                      onClick={() => setShowSampleModal(true)}
                      className="inline-flex items-center gap-space-xs text-primary-container font-label-md hover:underline font-medium bg-transparent border-0 cursor-pointer"
                    >
                      <span>Clone Storyboard</span>
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </article>

              {/* Card 3: Twilight Ozone Dynamics */}
              <article className="group relative flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative w-full aspect-[9/16] bg-surface-container overflow-hidden">
                  <img
                    alt="Minimalist landscape at deep dusk twilight"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuChNNTzuqMunAqUZvhEoPFMW9kC68emobke4lsGyxH3dQktkR1xghiYP2DvmdiOZulD2ANeqLVwkrjLiGGA3fqYjwpvbAyssbmMSJ1BaeXRAwG8Z1iqtBzKQqh5QrHclxcKW8Yq6zfMR59aWVpvSTX75rxIxX_0zc2L0ecd3zacjyAdHxvlnqryRL36ILFdKu3dcKwjkS2b62GVjfdAB6yoABH40WaSNHwSKiQHK9S4AIjyckR-sZgP"
                  />
                  <div className="absolute top-space-md left-space-md right-space-md flex items-center justify-between pointer-events-none">
                    <span className="bg-surface-container-lowest/90 backdrop-blur-sm px-space-sm py-space-xs rounded text-primary-container font-label-code text-label-code tracking-wider uppercase font-semibold">
                      Cosmos 03
                    </span>
                    <span className="bg-inverse-surface/80 backdrop-blur-sm text-surface-container-lowest font-label-timestamp text-label-timestamp px-space-sm py-space-xs rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-tertiary-fixed-dim">
                        timer
                      </span>
                      00:45
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent flex items-end p-space-md">
                    <div className="flex items-center justify-between w-full text-surface-container-lowest">
                      <div className="flex items-center gap-space-xs">
                        <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
                          sensors
                        </span>
                        <span className="font-label-code text-[11px] tracking-wide">
                          Atmosphere Synth 40Hz
                        </span>
                      </div>
                      <span className="font-label-code text-[11px] text-outline-variant">
                        Scene 04/04
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-space-lg flex flex-col justify-between flex-1 gap-space-md bg-surface-container-lowest">
                  <div className="space-y-space-xs">
                    <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code uppercase tracking-wider">
                      <span>Planetary Science</span>
                      <span>•</span>
                      <span className="text-primary-container font-medium">Chappuis Band</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors font-normal">
                      The Twilight Ozone Transition
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2">
                      Observing Earth&apos;s shadow rise during the blue hour, highlighting Chappuis absorption within the middle stratospheric ozone belt.
                    </p>
                  </div>
                  <div className="pt-space-xs flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                    <span className="font-label-code text-label-code text-outline">
                      Preset: Visual Monograph
                    </span>
                    <button
                      onClick={() => setShowSampleModal(true)}
                      className="inline-flex items-center gap-space-xs text-primary-container font-label-md hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      <span>Inspect Script</span>
                      <span className="material-symbols-outlined text-[14px]">north_east</span>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* Interactive Quick Start Workspace Bar */}
          <section className="w-full my-space-lg bg-surface-container-low rounded-xl p-space-lg md:p-space-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
              <div className="flex flex-col gap-space-xs max-w-xl">
                <span className="font-label-code text-label-code uppercase tracking-widest text-primary-container font-medium">
                  Quick Initialization
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-normal">
                  Start with a single sentence or prompt
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Enter an academic paper title, lecture thesis, or curiosity topic. Visutale will generate the narrative script, voice pacing, and vector storyboard.
                </p>
              </div>

              {/* Quick Input Bar */}
              <div className="flex-1 max-w-md w-full">
                <form
                  onSubmit={handleGenerateDraft}
                  className="flex flex-col sm:flex-row gap-space-xs bg-surface-container-lowest p-space-xs rounded-lg shadow-sm"
                >
                  <div className="flex-1 flex items-center gap-space-xs px-space-sm py-space-xs">
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      edit_note
                    </span>
                    <input
                      className="w-full bg-transparent border-none text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none"
                      placeholder="e.g. Why deep sea trenches never freeze..."
                      type="text"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                    />
                  </div>
                  <button
                    className="bg-primary-container hover:bg-[#114441] text-surface-container-lowest font-label-md text-body-sm px-space-md py-space-sm rounded transition-all whitespace-nowrap"
                    type="submit"
                  >
                    Generate Draft
                  </button>
                </form>
                {promptNotice && (
                  <p className="text-primary-container font-label-code text-label-code pt-1 px-space-xs">
                    {promptNotice}
                  </p>
                )}
                <div className="flex items-center justify-between pt-space-xs px-space-xs text-outline font-label-code text-label-code text-[11px]">
                  <span>Suggestions: Gravitational Lensing, Cellular Respiration</span>
                  <span
                    onClick={() => setPromptText("Gravitational Lensing and Spacetime Curvature")}
                    className="text-primary-container hover:underline cursor-pointer"
                  >
                    Apply Suggestion
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Lower Contextual Section: "From manuscript to broadcast in three deliberate movements" */}
          <section className="w-full py-space-xl mb-space-lg">
            <div className="flex flex-col gap-space-xs pb-space-lg">
              <div className="flex items-center gap-space-xs text-outline font-label-code text-label-code uppercase tracking-widest">
                <span>The Authoring Workflow</span>
                <span>•</span>
                <span>Pedagogy First</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-normal">
                From manuscript to broadcast in three deliberate movements
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
              {/* Step 01 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col justify-between gap-space-md relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <span className="font-headline-lg text-headline-lg text-secondary/30 font-serif">
                    01
                  </span>
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[18px]">subject</span>
                  </div>
                </div>
                <div className="space-y-space-xs">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Input Topic or Abstract
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Paste lecture notes, raw scientific abstracts, or choose guided prompt paths. Visutale extracts key educational tension and builds a cadence-timed outline.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded text-label-code font-label-code text-on-surface-variant text-[11px] flex items-center justify-between">
                  <span>Input modes</span>
                  <span className="text-primary font-medium">Text · PDF · Markdown</span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col justify-between gap-space-md relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <span className="font-headline-lg text-headline-lg text-secondary/30 font-serif">
                    02
                  </span>
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[18px]">layers</span>
                  </div>
                </div>
                <div className="space-y-space-xs">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Refine Script &amp; Storyboard
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Review side-by-side manuscript sentences alongside architectural 9:16 scene plates. Adjust diagrammatic callouts, pacing tokens, and voice inflections.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded text-label-code font-label-code text-on-surface-variant text-[11px] flex items-center justify-between">
                  <span>Editor architecture</span>
                  <span className="text-primary font-medium">Synchronized Line-By-Line</span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-surface-container-lowest p-space-lg rounded-lg shadow-sm flex flex-col justify-between gap-space-md relative overflow-hidden group">
                <div className="flex items-start justify-between">
                  <span className="font-headline-lg text-headline-lg text-secondary/30 font-serif">
                    03
                  </span>
                  <div className="w-8 h-8 rounded bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[18px]">file_download_done</span>
                  </div>
                </div>
                <div className="space-y-space-xs">
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Render &amp; Disseminate
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Produce crisp 1080p 60fps vertical MP4 files complete with synchronized kinetic typography, clean editorial margins, and pristine sound design.
                  </p>
                </div>
                <div className="bg-surface-container-low p-space-sm rounded text-label-code font-label-code text-on-surface-variant text-[11px] flex items-center justify-between">
                  <span>Deliverables</span>
                  <span className="text-primary font-medium">ProRes · MP4 · Captions SRT</span>
                </div>
              </div>
            </div>
          </section>

          {/* Editorial Footnote Quotation Bar */}
          <div className="w-full pb-space-xl pt-space-sm flex flex-col sm:flex-row items-center justify-between gap-space-md text-outline">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span className="font-body-sm text-body-sm italic">
                &quot;Designed to elevate scientific communication from chaotic timeline splicing to pure editorial craftsmanship.&quot;
              </span>
            </div>
            <div className="flex items-center gap-space-md text-label-code font-label-code text-[11px]">
              <span className="text-on-surface font-medium">System Version 1.0.4</span>
              <span>•</span>
              <a className="text-primary-container hover:underline" href="#help">
                Read the Author&apos;s Handbook
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Modal for "Explore an example" */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest max-w-xl w-full rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-space-lg flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-space-xs">
                <span className="font-label-code text-label-code uppercase tracking-wider text-primary-container font-semibold">
                  Manuscript Preview
                </span>
                <span className="text-outline font-label-code text-label-code">• Scene 01</span>
              </div>
              <button
                className="text-on-surface-variant hover:text-on-surface bg-transparent border-0 cursor-pointer"
                onClick={() => setShowSampleModal(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-space-lg flex flex-col gap-space-md">
              <div className="space-y-space-xs">
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-normal">
                  Rayleigh Scattering &amp; The Blue Hour
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Listen to an excerpt of Clara&apos;s neural vocalization paired with the live mathematical simulation vector.
                </p>
              </div>
              <div className="p-space-md bg-surface-container-low rounded font-display-lg text-body-lg text-on-surface italic leading-relaxed">
                “When solar radiation pierces Earth’s protective mantle, shorter blue wavelengths scatter violently against atmospheric nitrogen, while the long warm spectrum sweeps unobstructed toward our horizon.”
              </div>
              <div className="flex items-center justify-between text-label-code font-label-code text-[12px] text-outline pt-space-xs">
                <span>Target Cadence: 132 wpm</span>
                <span>Duration: 00:14.2s</span>
              </div>
            </div>
            <div className="p-space-md bg-surface-container flex items-center justify-end gap-space-sm">
              <button
                className="px-space-md py-space-xs font-label-md text-body-sm text-on-surface-variant hover:text-on-surface bg-transparent border-0 cursor-pointer"
                onClick={() => setShowSampleModal(false)}
                type="button"
              >
                Dismiss
              </button>
              <Link
                className="px-space-md py-space-xs bg-primary-container text-surface-container-lowest font-label-md text-body-sm rounded hover:bg-[#114441]"
                href="/your-videos"
              >
                Open in Studio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Editorial Colophon Footer */}
      <footer className="w-full bg-surface-container-low py-space-lg">
        <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-code text-label-code uppercase tracking-wider text-outline">
              Edition 01
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              © 2025 Visutale Publishing Inc. Crafted for purposeful authorship.
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

