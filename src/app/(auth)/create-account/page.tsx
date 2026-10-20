"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function CreateAccountPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter your full author or educator name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid institutional or workspace email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters with numbers or symbols.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/session/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(
          data?.error?.message || "Registration failed. Please check your information."
        );
        setIsLoading(false);
        return;
      }

      // Successful registration: redirect to first-time welcome page
      router.push("/welcome");
      router.refresh();
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setErrorMessage("Unable to connect to registration desk. Please verify your connection.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);

    try {
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/welcome",
        errorCallbackURL: "/sign-in",
      });

      if (result?.error) {
        setErrorMessage(
          result.error.message ||
            "Google OAuth is not configured in this environment. Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable Google registration."
        );
      }
    } catch {
      setErrorMessage(
        "Google OAuth is not configured in this environment. Missing GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env. Please register with email and password."
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
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm"
              href="/sign-in"
            >
              Sign In
            </Link>
            <Link
              aria-current="page"
              className="font-body-sm transition-colors py-space-xs px-space-sm bg-secondary-container text-on-secondary-container rounded"
              href="/create-account"
            >
              Create Account
            </Link>
            <a
              className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors py-space-xs px-space-sm"
              href="#help"
            >
              Help &amp; Inquiries
            </a>
          </nav>
          <div className="flex items-center gap-space-sm md:gap-space-md">
            <Link
              href="/sign-in"
              className="md:hidden font-label-md text-primary-container font-semibold py-1 px-2.5 rounded bg-surface-container hover:bg-surface-container-high transition-colors text-xs"
            >
              Sign In
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
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-margin-desktop items-stretch">
            {/* Left Column: Registration Form */}
            <div className="lg:col-span-6 flex flex-col justify-between py-space-xs md:pr-gutter">
              <div className="flex flex-col">
                {/* Sub-header brand stamp */}
                <div className="flex items-center gap-space-xs mb-space-lg">
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                  <span className="font-label-code text-label-code text-outline uppercase tracking-widest">
                    VISUTALE • REGISTRATION
                  </span>
                  <span className="font-label-code text-label-code text-on-surface-variant/40 ml-space-xs">
                    REF: VT-2025-A
                  </span>
                </div>

                {/* Headline & Editorial Narrative */}
                <div className="space-y-space-xs mb-space-xl">
                  <h1 className="font-display-lg text-headline-lg md:text-display-lg text-on-surface tracking-tight font-normal">
                    Make something <br />
                    <span className="italic font-light text-primary-container">
                      worth sharing.
                    </span>
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md pt-space-xs font-normal">
                    Start turning your ideas into educational videos with textbook precision and cinematic clarity.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mb-space-md p-space-sm bg-error-container text-on-error-container border border-error/20 rounded flex items-start gap-space-xs font-label-code text-label-code max-w-md">
                    <span className="material-symbols-outlined text-[16px] text-error mt-0.5">
                      error
                    </span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Registration Form Elements */}
                <form
                  className="space-y-space-md w-full max-w-md"
                  id="visutale-reg-form"
                  onSubmit={handleSubmit}
                >
                  {/* Full Name */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-baseline">
                      <label
                        className="font-label-md text-label-md text-on-surface uppercase tracking-wider"
                        htmlFor="fullName"
                      >
                        Full name
                      </label>
                      <span className="font-label-code text-label-code text-outline">
                        Author / Educator
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-body-md placeholder:text-outline/50 shadow-sm transition-all focus:outline-none focus:shadow-[0_0_0_1px_#134e4a] disabled:opacity-60"
                        id="fullName"
                        name="fullName"
                        placeholder="Elena Vance"
                        type="text"
                        value={fullName}
                        disabled={isLoading}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-baseline">
                      <label
                        className="font-label-md text-label-md text-on-surface uppercase tracking-wider"
                        htmlFor="email"
                      >
                        Work or institutional email
                      </label>
                      <span className="font-label-code text-label-code text-outline">
                        Direct Channel
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface px-space-md py-space-sm rounded font-body-md text-body-md placeholder:text-outline/50 shadow-sm transition-all focus:outline-none focus:shadow-[0_0_0_1px_#134e4a] disabled:opacity-60"
                        id="email"
                        name="email"
                        placeholder="name@institute.org"
                        type="email"
                        value={email}
                        disabled={isLoading}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-space-xs text-secondary font-label-code text-label-code pt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-secondary">
                        verified_user
                      </span>
                      <span>Verification link will be sent here upon dispatch</span>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex justify-between items-baseline">
                      <label
                        className="font-label-md text-label-md text-on-surface uppercase tracking-wider"
                        htmlFor="password"
                      >
                        Password
                      </label>
                      <span className="font-label-code text-label-code text-outline">
                        Min. 8 Chars
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface px-space-md py-space-sm pr-10 rounded font-body-md text-body-md placeholder:text-outline/50 shadow-sm transition-all focus:outline-none focus:shadow-[0_0_0_1px_#134e4a] disabled:opacity-60"
                        id="password"
                        name="password"
                        placeholder="••••••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        disabled={isLoading}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-space-sm p-1 text-outline hover:text-on-surface transition-colors flex items-center justify-center focus:outline-none"
                        id="togglePassword"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]" id="eyeIcon">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    <p className="font-label-code text-label-code text-on-surface-variant/80">
                      At least 8 characters with numbers or symbols
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-space-xs space-y-space-sm">
                    <button
                      className="w-full bg-primary-container text-on-primary font-body-md font-medium text-body-md py-space-sm px-space-md rounded shadow-sm hover:bg-primary transition-all duration-150 active:translate-y-0.5 flex items-center justify-center gap-space-xs disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      type="submit"
                    >
                      <span>{isLoading ? "Creating account..." : "Create account"}</span>
                      <span className="material-symbols-outlined text-[16px]">
                        {isLoading ? "sync" : "arrow_forward"}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="relative py-space-xs flex items-center justify-center">
                      <div className="w-full h-px bg-surface-variant"></div>
                      <span className="absolute bg-surface px-space-sm font-label-code text-label-code uppercase tracking-widest text-outline">
                        or
                      </span>
                    </div>

                    {/* Google OAuth Entry */}
                    <button
                      className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md py-space-sm px-space-md rounded shadow-sm hover:bg-surface-container-low transition-all duration-150 flex items-center justify-center gap-space-sm disabled:opacity-60"
                      onClick={handleGoogleSignUp}
                      disabled={isLoading}
                      type="button"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
                          fill="#4285F4"
                        ></path>
                        <path
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.25 21.36 7.34 24 12 24z"
                          fill="#34A853"
                        ></path>
                        <path
                          d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.05 0 12s.45 3.78 1.25 5.39l4.02-3.15z"
                          fill="#FBBC05"
                        ></path>
                        <path
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                          fill="#EA4335"
                        ></path>
                      </svg>
                      <span>Sign up with Google</span>
                    </button>
                  </div>

                  {/* Sign In Redirect */}
                  <div className="pt-space-xs text-center">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Already have an account?
                    </span>
                    <Link
                      className="font-body-sm text-body-sm font-medium text-primary-container hover:underline ml-1"
                      href="/sign-in"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>

              {/* Legal Footnote & Intellectual Property Notice */}
              <div className="pt-space-xl mt-space-lg max-w-md">
                <p className="font-label-code text-label-code text-outline leading-relaxed">
                  By creating an account, you agree to Visutale&apos;s{" "}
                  <a className="underline hover:text-on-surface" href="#terms">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a className="underline hover:text-on-surface" href="#privacy">
                    Privacy Policy
                  </a>
                  . All research, scripts, and synthesized audiovisual assets remain strictly your intellectual property.
                </p>
              </div>
            </div>

            {/* Right Column: Visual Preview Area / Passe-partout Frame */}
            <div className="lg:col-span-6 flex flex-col justify-center items-center lg:items-end mt-space-lg lg:mt-0">
              <div className="w-full max-w-md lg:max-w-lg bg-surface-container-low p-space-md sm:p-space-lg rounded-xl shadow-md flex flex-col gap-space-md">
                {/* Frame Upper Header Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-xs">
                    <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface font-label-code text-label-code uppercase tracking-wider">
                      Plate 04
                    </span>
                    <span className="font-label-code text-label-code text-outline">
                      Optics &amp; Atmosphere
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-outline">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span className="font-label-code text-label-code">4K Master • 9:16</span>
                  </div>
                </div>

                {/* The 9:16 Editorial Artwork Frame (Passe-partout Style) */}
                <div className="relative w-full aspect-[9/16] max-h-[580px] bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col group">
                  {/* Image Layer with Rich Atmospheric Detail */}
                  <img
                    alt="Minimalist scientific educational artwork depicting Rayleigh scattering"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    src="/assets/stitch/create_account_plate04.jpg"
                  />
                  {/* Overlay Minimalist Annotations / Scientific HUD Markers */}
                  <div className="absolute inset-0 p-space-md flex flex-col justify-between pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/20">
                    {/* Upper Overlay Tags */}
                    <div className="flex justify-between items-start">
                      <span className="font-label-code text-label-code text-white/90 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                        λ 380–750 nm
                      </span>
                      <span className="font-label-code text-label-code text-white/80">
                        SEQ_008 • 00:42
                      </span>
                    </div>
                    {/* Lower Diagram Labels */}
                    <div className="space-y-space-xs">
                      <div className="inline-block bg-primary-container/90 backdrop-blur-md px-2 py-1 rounded text-white font-label-code text-label-code">
                        Rayleigh Dispersion Layer
                      </div>
                      <p className="font-headline-sm text-headline-sm text-white drop-shadow-sm font-normal">
                        Why the horizon turns to gold.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Descriptive Metadata Block & Testimonial Callout */}
                <div className="space-y-space-sm pt-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-code text-label-code uppercase tracking-wider text-primary-container font-semibold">
                      Manuscript Engine
                    </span>
                    <span className="font-label-code text-label-code text-outline">
                      Script • Voice • Visual Assembly
                    </span>
                  </div>
                  <blockquote className="font-body-lg text-body-md text-on-surface-variant italic leading-relaxed pl-space-sm bg-surface-container-high/40 rounded-r py-space-xs">
                    “Visutale gave our physics department the ability to explain atmospheric phenomena in 60 seconds with textbook precision.”
                  </blockquote>
                  <div className="flex items-center justify-between font-label-code text-label-code text-outline pt-space-xs">
                    <span>DR. ARTHUR CHEN • CAMBRIDGE LABS</span>
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                      <span>1,420 Manuscripts Published</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

