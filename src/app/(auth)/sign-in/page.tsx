"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, linkSocial } from "@/lib/auth-client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/your-videos";
  const errorParam = searchParams.get("error");
  const isAccountLinkingRequired = errorParam === "account_not_linked";

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  React.useEffect(() => {
    if (errorParam === "account_not_linked") {
      setErrorMessage(
        "An account with this email already exists with passphrase authentication. Please sign in with your email and passphrase to verify your identity and link your Google account."
      );
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your institutional or workspace email.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your passphrase.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/session/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error?.message || "Invalid email or passphrase.");
        setIsLoading(false);
        return;
      }

      // If redirected from Google OAuth with account_not_linked, complete linking now
      if (isAccountLinkingRequired) {
        setInfoMessage("Passphrase verified. Completing secure Google account linking...");
        await linkSocial({
          provider: "google",
          callbackURL: callbackUrl,
        });
        return;
      }

      // Successful sign in: redirect to protected destination
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error("Sign-in submission error:", err);
      setErrorMessage("Unable to connect to authentication desk. Please verify your connection.");
      setIsLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
        errorCallbackURL: "/sign-in",
      });

      if (result?.error) {
        setErrorMessage(
          result.error.message ||
            "Google OAuth is not configured in this environment. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable Google sign-in."
        );
      }
    } catch {
      setErrorMessage(
        "Google OAuth is not configured in this environment. Missing GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. Please sign in with email and passphrase."
      );
    }
  };

  return (
    <>
      {/* Editorial Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-[0_1px_8px_rgba(24,24,27,0.03)]">
        <div className="h-16 max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-normal italic">
              Visutale
            </span>
            <span className="font-label-code text-label-code text-outline uppercase hidden sm:inline">
              • Precision Narrative Instrument
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-space-lg">
            <Link
              aria-current="page"
              className="font-body-sm transition-colors py-space-xs px-space-sm bg-secondary-container text-on-secondary-container rounded"
              href="/sign-in"
            >
              Sign In
            </Link>
            <Link
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm"
              href="/create-account"
            >
              Create Account
            </Link>
            <button
              onClick={() => setShowRecoveryModal(true)}
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm bg-transparent border-0 cursor-pointer"
              type="button"
            >
              Help &amp; Inquiries
            </button>
          </nav>
          <div className="flex items-center gap-space-sm md:gap-space-md">
            <Link
              href="/create-account"
              className="md:hidden font-label-md text-primary-container font-semibold py-1 px-2.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors text-xs"
            >
              Register
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">
                person
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 bg-surface max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop flex flex-col">
        <div className="flex flex-col w-full py-space-md md:py-space-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center min-h-[calc(100vh-10rem)]">
            {/* Left Column: Authentication Panel */}
            <div className="lg:col-span-5 flex flex-col justify-center max-w-md w-full mx-auto lg:mx-0">
              {/* Brand & Section Stamp */}
              <div className="flex items-center gap-space-xs mb-space-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                <span className="font-label-code text-label-code uppercase tracking-widest text-outline">
                  Authentication Desk · Vol. 04
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-space-xs mb-space-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-normal">
                  Welcome back.
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Pick up where your next story begins. Access your manuscripts, scientific schematics, and timeline drafts.
                </p>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="mb-space-md p-space-sm bg-error-container text-on-error-container border border-error/20 rounded flex items-start gap-space-xs font-label-code text-label-code">
                  <span className="material-symbols-outlined text-[16px] text-error mt-0.5">
                    error
                  </span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Info Notice */}
              {infoMessage && (
                <div className="mb-space-md p-space-sm bg-secondary-container/60 border border-secondary-container rounded flex items-center gap-space-xs text-on-secondary-container font-label-code text-label-code">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>{infoMessage}</span>
                </div>
              )}

              {/* Form Container */}
              <form className="space-y-space-md" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    className="block font-label-md text-label-md text-on-surface font-medium"
                    htmlFor="signin-email"
                  >
                    Institutional or Workspace Email
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-space-md py-2.5 bg-surface-container-lowest text-on-surface placeholder:text-outline/60 font-body-sm text-body-sm rounded shadow-sm transition-all duration-150 outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary-container disabled:opacity-60"
                      id="signin-email"
                      placeholder="name@organization.edu or .com"
                      type="email"
                      value={email}
                      disabled={isLoading}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="block font-label-md text-label-md text-on-surface font-medium"
                      htmlFor="signin-password"
                    >
                      Passphrase
                    </label>
                    <button
                      className="font-label-code text-label-code text-on-surface-variant hover:text-primary transition-colors underline decoration-outline-variant underline-offset-4 bg-transparent border-0 p-0 cursor-pointer"
                      onClick={() => setShowRecoveryModal(true)}
                      type="button"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      className="w-full px-space-md py-2.5 bg-surface-container-lowest text-on-surface placeholder:text-outline/60 font-body-sm text-body-sm rounded shadow-sm transition-all duration-150 outline-none focus:ring-1 focus:ring-primary-container pr-10 disabled:opacity-60"
                      id="signin-password"
                      placeholder="••••••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      disabled={isLoading}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 text-outline hover:text-on-surface p-1 rounded transition-colors flex items-center justify-center"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember / Persistence Preference */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-space-xs cursor-pointer select-none">
                    <input
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-sm accent-primary-container cursor-pointer"
                      type="checkbox"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Keep workspace active for 30 days
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    className="w-full py-2.5 px-space-md bg-primary-container hover:bg-primary text-on-primary font-label-md text-title-md rounded shadow-sm transition-all duration-150 flex items-center justify-center gap-space-xs active:translate-y-[0.5px] disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    type="submit"
                  >
                    <span>{isLoading ? "Signing in to Workspace..." : "Sign in to Workspace"}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isLoading ? "sync" : "arrow_forward"}
                    </span>
                  </button>
                </div>

                {/* Soft Typographic Divider */}
                <div className="relative my-space-lg flex items-center justify-center">
                  <div className="w-full h-px bg-surface-variant"></div>
                  <span className="absolute px-space-sm bg-surface font-label-code text-label-code text-outline uppercase tracking-wider">
                    or continue with
                  </span>
                </div>

                {/* SSO Button (Google) */}
                <button
                  className="w-full py-2.5 px-space-md bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-md text-body-sm rounded shadow-sm transition-all duration-150 flex items-center justify-center gap-space-sm disabled:opacity-60"
                  type="button"
                  onClick={handleGoogleSSO}
                  disabled={isLoading}
                >
                  <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                      fill="#4285F4"
                    ></path>
                    <path
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                      fill="#34A853"
                    ></path>
                    <path
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                      fill="#FBBC05"
                    ></path>
                    <path
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      fill="#EA4335"
                    ></path>
                  </svg>
                  <span className="font-medium">Continue with Google SSO</span>
                </button>
              </form>

              {/* Bottom Links & Institutional Notes */}
              <div className="mt-space-lg space-y-space-md">
                <p className="font-body-sm text-body-sm text-on-surface-variant text-center">
                  New to Visutale?{" "}
                  <Link
                    className="font-label-md text-primary-container font-semibold hover:underline ml-1"
                    href="/create-account"
                  >
                    Create an editorial account
                  </Link>
                </p>

                {/* Security and Encryption Trust Stamp */}
                <div className="p-space-sm bg-surface-container-low rounded flex items-center gap-space-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    encrypted
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-code text-label-code uppercase tracking-wider text-secondary">
                      End-to-end editorial workspace encryption
                    </span>
                    <span className="font-body-sm text-label-code text-outline">
                      Local caching complies with Open Science &amp; Research Data protocols
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Architectural Visual Framing (Atmospheric Optical Study) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-space-sm md:p-space-lg">
              {/* Mount Presentation Container */}
              <div className="w-full max-w-xl bg-surface-container-lowest p-space-md md:p-space-lg rounded shadow-sm">
                {/* Framing Header Info (Micro-metadata) */}
                <div className="flex items-center justify-between pb-space-sm mb-space-sm">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-code text-label-code uppercase text-primary font-medium tracking-wider">
                      PROJECT: SCATTER-OPTICS-V8
                    </span>
                    <span className="font-label-code text-label-code text-outline">/ DRAFT 03</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-label-code text-label-code uppercase text-outline">
                      9:16 Canvas Validated
                    </span>
                  </div>
                </div>

                {/* Dual Vertical Gallery Showcase */}
                <div className="grid grid-cols-2 gap-space-sm md:gap-space-md items-center">
                  {/* Image Frame 1: Diagrammatic Ray Dispersion */}
                  <div className="relative group rounded overflow-hidden shadow-sm bg-surface-container aspect-[9/16]">
                    <img
                      alt="Exquisite technical and astronomical infographic of planet Earth illuminated by intense diagonal solar radiation, displaying atmospheric dispersion layers"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="/assets/stitch/sign_in_dispersion.jpg"
                    />
                    {/* Overlay Metadata Plate */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex flex-col justify-end p-space-sm text-on-primary">
                      <span className="font-label-code text-label-code uppercase tracking-widest text-primary-fixed">
                        Dispersion Geometry
                      </span>
                      <span className="font-body-sm text-body-sm font-medium">
                        Solar Flux in Mesosphere
                      </span>
                    </div>
                  </div>

                  {/* Image Frame 2: Sunset Atmospheric Gradient & Typography */}
                  <div className="relative group rounded overflow-hidden shadow-sm bg-surface-container aspect-[9/16]">
                    <img
                      alt="Photographic golden hour horizon showing Rayleigh scattering in the sky with delicate typographic annotations"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      src="/assets/stitch/sign_in_sunset.jpg"
                    />
                    {/* Overlay Metadata Plate */}
                    <div className="absolute inset-0 bg-gradient-to-t from-tertiary/80 via-transparent to-transparent flex flex-col justify-end p-space-sm text-on-primary">
                      <span className="font-label-code text-label-code uppercase tracking-widest text-tertiary-fixed">
                        Wavelength Attenuation
                      </span>
                      <span className="font-body-sm text-body-sm font-medium">
                        450nm Blue vs 700nm Red
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editorial Specimen Caption Strip */}
                <div className="mt-space-md p-space-sm bg-surface-container rounded flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="space-y-0.5">
                    <div className="font-title-md text-title-md text-on-surface flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-primary-container text-[18px]">
                        graphic_eq
                      </span>
                      <span>Rayleigh Scattering &amp; Twilight Optics</span>
                    </div>
                    <p className="font-label-code text-label-code text-on-surface-variant">
                      00:58 Duration · Clara Neural narration · 4K Master Render
                    </p>
                  </div>
                  <div className="flex items-center gap-space-xs shrink-0 self-start sm:self-center">
                    <span className="px-2 py-0.5 bg-surface-container-lowest text-primary font-label-code text-label-code rounded uppercase tracking-wider font-semibold">
                      Live Preview
                    </span>
                  </div>
                </div>

                {/* Philosophical Footer Quote */}
                <div className="mt-space-md pt-space-sm border-t-0 flex items-start gap-space-sm">
                  <span className="font-display-lg text-secondary/30 select-none -mt-3">“</span>
                  <p className="font-body-lg text-body-lg italic text-on-surface-variant leading-relaxed">
                    Designed for educators, researchers, and scientific storytellers turning dense ideas into visual clarity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Operator-Assisted Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full p-space-lg rounded shadow-xl border border-outline-variant/40 space-y-space-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="font-label-code text-label-code uppercase tracking-wider text-outline">
                  Credential Recovery Protocol
                </span>
              </div>
              <button
                className="text-outline hover:text-on-surface"
                onClick={() => setShowRecoveryModal(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-space-xs">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-normal">
                Operator-Assisted Recovery
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Per Visutale institutional data governance (API Section 3), credential reset is operator-assisted to protect research and manuscript integrity.
              </p>
              <div className="p-space-sm bg-surface-container-low rounded border border-outline-variant/20 text-on-surface font-label-code text-label-code space-y-1">
                <div>To rotate your passphrase, contact your workspace administrator:</div>
                <div className="text-primary-container font-semibold">security@visutale.internal</div>
                <div className="text-outline">Include your registered institutional email and organization affiliation.</div>
              </div>
            </div>

            <div className="flex justify-end pt-space-xs">
              <button
                className="py-2 px-space-md bg-primary-container hover:bg-primary text-on-primary font-body-sm rounded text-body-sm transition-all"
                onClick={() => setShowRecoveryModal(false)}
                type="button"
              >
                Acknowledge Protocol
              </button>
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

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <SignInForm />
    </Suspense>
  );
}
