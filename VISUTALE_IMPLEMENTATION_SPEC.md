# Visutale — Implementation Specification

**Purpose:** A source-grounded contract for implementing the Visutale web application around the existing TypeScript video pipeline, using the supplied Google Stitch exports as the visual source of truth.

**Status:** Specification draft based on the two supplied ZIP archives and the user's confirmed product decisions. This document does not claim that any new application code or cloud infrastructure already exists.

## 1. Product decisions confirmed by the user

- Every user must authenticate before using the application.
- Sign-in options: Google sign-in and an email/account registration flow.
- Both Quick Create and Guided Create are required.
- Use free tiers/local services where practical during development; upgrade to paid infrastructure when justified.
- Stitch designs are not inspiration or a loose visual foundation: reproduce their typography, colors, spacing, geometry, borders, shadows, iconography, and responsive behavior as faithfully as possible.
- Preserve the existing pipeline; do not rewrite or duplicate its planning, speech, timing, rendering, validation, and revision logic.

## 2. Supplied Stitch screen inventory

The ZIP contains the following named folders. Each screen folder includes `code.html` and `screen.png`; `editorial_studio_canvas/DESIGN.md` provides design tokens. Use the actual folder names below rather than assuming Stitch labels screens with numeric IDs.

1. `visutale_script_storyboard_studio` — Desktop storyboard/script editor.
2. `visutale_your_videos` — Video library (populated).
3. `visutale_video_generation_progress_ready` — Generation progress and ready state.
4. `visutale_finished_video_studio` — Finished video preview/download.
5. `visutale_publishing_studio` — Publishing studio.
6. `visutale_first_time_welcome` — First-time welcome.
7. `visutale_settings` — Settings.
8. `visutale_create_account` — Create account.
9. `visutale_sign_in` — Sign in.
10. `visutale_creation_studio_mobile` — Mobile creation studio.
11. `visutale_finished_video_studio_mobile` — Mobile finished video.
12. `visutale_script_storyboard_studio_mobile` — Mobile storyboard.
13. `visutale_video_generation_failed` — Generation failure.
14. `visutale_publishing_unavailable` — Publishing unavailable.
15. `visutale_download_failed` — Download failure.

### Visual source-of-truth rules

- Treat each supplied `screen.png` as the visual comparison target for the corresponding viewport.
- Treat each `code.html` as the primary source for exact markup structure, Tailwind utility usage, typography imports, token values, and visual details.
- Treat `editorial_studio_canvas/DESIGN.md` as the shared design-token reference, then verify screen-specific overrides in each HTML file.
- Do not invent replacement typography, colors, icons, spacing, page hierarchy, or new UI patterns when the supplied source already defines them.
- Reuse supplied assets and icon conventions. Preserve visible text and control states unless product/API requirements require a behavior change; if a visual-vs-functional conflict occurs, preserve appearance and document the behavior adaptation.
- The mobile screens are explicit design references. Do not merely shrink desktop layouts; reproduce the supplied mobile composition and safe-area behavior.
- Match the reference viewport when taking screenshot comparisons. Browser/font rendering may cause small platform differences; resolve meaningful layout and spacing drift before acceptance.


## 3. Design tokens extracted from `DESIGN.md`

The following palette and typography declarations are present in the supplied Stitch design file. Keep the original token names/values in the app's token layer where feasible; do not silently normalize them into a different palette.

```yaml
colors:
  surface: '#fbf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fbf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f6'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e5'
  on-surface: '#1b1b1e'
  on-surface-variant: '#404847'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#707977'
  outline-variant: '#bfc8c6'
  surface-tint: '#316763'
  primary: '#003633'
  on-primary: '#ffffff'
  primary-container: '#134e4a'
  on-primary-container: '#87beb8'
  inverse-primary: '#9ad1cb'
  secondary: '#52625a'
  on-secondary: '#ffffff'
  secondary-container: '#d3e4da'
  on-secondary-container: '#57665f'
  tertiary: '#492800'
  on-tertiary: '#ffffff'
  tertiary-container: '#653d0e'
  on-tertiary-container: '#e2a971'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b5ede7'
  primary-fixed-dim: '#9ad1cb'
  on-primary-fixed: '#00201e'
  on-primary-fixed-variant: '#144f4b'
  secondary-fixed: '#d6e6dd'
  secondary-fixed-dim: '#bacac1'
  on-secondary-fixed: '#101e19'
  on-secondary-fixed-variant: '#3b4a43'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#f6bb81'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#663e0f'
  background: '#fbf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e5'

typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-timestamp:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an editorial, tactile, and craft-first aesthetic tailored for thoughtful educators, curators, researchers, and cinematic creators. It rejects modern SaaS tropes—such as neon gradients, glowing synthetic orbs, and generic saturated purple fills—in favor of the tactile dignity of fine publishing, architectural blueprints, and precision creative instruments.

The core philosophy blends:
- **Kinfolk / Print Editorial sensibility:** Deliberate whitespace, considered typographic hierarchies, and restrained linen surfaces that treat educational video scripting like literature.
- **Precision Swiss Utility:** Crisp hairline structure, meticulous micro-typography, mono-spaced metadata readouts, and quiet functional states modeled after high-end creative workbenches like iA Writer, Linear, and Figma.
- **Warm Tactility:** Cream-paper canvases, deep carbon inks, and understated mineral teal accents that evoke fountain pens, bookcloth binding, and drafting tables.

## Colors

The palette draws inspiration from traditional publishing houses, bookbinding cloth, and archival inks, calibrated strictly for a natural warm-light canvas.

- **Canvas & Surfaces:**
  - `canvas-default`: `#FBF9F5` — Warm linen tone serving as the outer bedrock.
  - `surface-elevated`: `#FFFFFF` — Pure sheet white reserved for floating cards, active panels, and inspect sheets.
  - `surface-subtle`: `#F5F2EB` — Warm paper stock for toolbars, sidebars, and nested editor blocks.
  - `surface-muted`: `#EFECE3` — Recessed tracks, scrubbers, and inactive inputs.

- **Inks & Text (Neutrals):**
  - `ink-primary`: `#18181B` — Deep carbon black for headlines, key titles, and definitive weights.
  - `ink-secondary`: `#3F3F46` — Neutral charcoal for body paragraphs and long-form voiceover copy.
  - `ink-tertiary`: `#71717A` — Muted slate-pencil for secondary labels, hotkey indicators, and timestamps.
  - `ink-subtle`: `#A1A1AA` — Placeholder tokens, inactive metadata glyphs, and timeline grids.

- **Hairlines & Dividers:**
  - `border-default`: `#E4DFD5` — Baseline hairline divider separating tool rails and timeline segments.
  - `border-strong`: `#D8D2C6` — Structural borders framing cards, modals, and preview displays.

- **Accent (Mineral Slate-Teal):**
  - `accent-primary`: `#134E4A` — Deep forest/mineral teal; used for critical calls-to-action, active playhead states, and confirmed keyframes.
  - `accent-surface`: `#EEF4F2` — Soft sage wash for selections, chip highlights, and active audio tracks.
  - `accent-hover`: `#114441` — Deepened ink-teal for interactive pressure.

- **Utility & Warning Accents:**
  - `accent-amber`: `#9A6A38` (Sepia/Ochre) — Subtle warning, bookmarking, and script revision flags.
  - `accent-error`: `#9F2E2E` (Burgundy) — Replaces harsh red with a classic editorial crimson.

## Typography

The typography creates a deliberate tension between the literary gravitas of serif book type and the clinical precision of architectural grotesk and monospaced data counters.

- **Display & Headlines (`Newsreader`):** Used with italic accents for emotional weight, chapter titling, educational hypotheses, and essay-level screen headers. It brings an intellectual, publication-grade presence to video creation.
- **Interface & Content (`Hanken Grotesk`):** Clean, structural, and neutral. Anchors the actual tool logic, parameter trees, script input bars, and inspector panels without drawing attention to itself.
- **Micro-Data & Metrology (`JetBrains Mono`):** Strictly reserved for timeline counters (e.g., `00:04:12:08`), aspect ratio badges (`16:9`, `9:16`), frame rates (`24fps`), and export dimension readouts. Set in uppercase or tabular numerals with increased tracking.

## Layout & Spacing

This design system uses an asymmetrical, content-first layout architecture balancing a literary reading column with high-density workspace docking.

- **Grid Philosophy:**
  - **Studio Workspace:** Multi-pane fluid viewport layout (script rail, viewport monitor, inspector panel, and timeline footers) anchored by strict 1px hairlines. Panes respect fixed minimum dimensions (e.g., sidebar: 320px, inspector: 280px) while the video canvas expands dynamically.
  - **Gallery & Editorial Views:** A classic 12-column modular grid with generous 3rem outer margins on desktop, focusing the content footprint at a maximum container width of `1280px` (or `740px` for pure script/essay authoring).
- **Rhythm & Safe Areas:**
  - Spacing derives strictly from an 8pt base unit with 4pt micro-adjustments for tight UI surfaces.
  - Generous vertical breathing room (`space-xl` and above) around manuscript blocks prevents the UI from feeling like a crowded traditional NLE (video editor), while tool parameters pack efficiently into `space-xs` and `space-sm` increments.

## Elevation & Depth

Visual hierarchy rejects blurry dropshadows and glassy neon blooms, utilizing **tactile sheet layering and hairline definition** to separate surfaces.

- **Layer 0 (Bedrock):** `#FBF9F5` (Linen). Outer background, surrounding tool gutters, and blank canvas states.
- **Layer 1 (Recessed/Tool Rails):** `#F5F2EB` (Subtle warm wash). Left-hand script sidebar, timeline tracks, and parameter wells. Bounded by a 1px solid border of `#E4DFD5`.
- **Layer 2 (Sheets & Active Stage):** `#FFFFFF` (Pristine paper). Video preview card, active floating popovers, and focused script segment cards. Bound by `#D8D2C6`.
- **Shadow Profile (Architectural Paper Lift):**
  - Floating sheets, dropdowns, and context menus receive a single, extremely refined shadow that mimics paper resting slightly above a drafting desk:
    `box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04), 0 4px 12px rgba(24, 24, 27, 0.03);`
  - Zero colored shadows or diffuse spreads over 16px. Depth is felt through boundary lines, not ambient fog.

## Shapes

The geometry uses a restrained, tailored corner radius (`roundedness: 1` — Soft, 4px to 8px max).
- Standard buttons, text fields, chips, and segment tabs use `0.25rem` (4px) to retain an architectural, print-like edge.
- Viewport preview screens, media cards, and modal dialogs peak at `0.5rem` (8px).
- Capsule/pill-shaped radii are prohibited except for miniature numerical badges or playhead needles. Clean rectilinearity preserves the sense of a physical typesetting shop.

## Components

### Buttons
- **Primary Action (Render, Export, Create):** Solid `#134E4A` fill, `#FFFFFF` text in `Hanken Grotesk` Medium, `border: 1px solid transparent`, corner radius 4px. On hover: shifts subtly to `#114441`. Subtle tactile active state (`transform: translateY(0.5px)`).
- **Secondary (Editorial / Outline):** Background `#FFFFFF`, text `#18181B`, border `1px solid #D8D2C6`. Hover: `#F5F2EB`.
- **Ghost (Timeline Controls, Media Navigation):** Transparent background, text `#3F3F46`, hover: `#EFECE3` wash.

### Form Inputs & Script Editors
- **Text Inputs:** Paper white surface (`#FFFFFF`), bounded by 1px `#E4DFD5`, interior text `Hanken Grotesk`. Focus ring: no thick glow, just a crisp 1px stroke shift to `#134E4A` accompanied by an imperceptible `0 0 0 1px #134E4A`.
- **Narrative Script Block:** Borderless surface blending into `#FBF9F5` until hovered or active. Text set in `Newsreader` (18px) to encourage narrative prose, accompanied by a discreet `JetBrains Mono` line and duration counter on the margin.

### Chips & Metadata Tags
- Flat, non-pill rectangles (radius 3px). Background `#F5F2EB`, border `1px solid #E4DFD5`, text `JetBrains Mono` uppercase 11px in `#3F3F46`.
- **Active / Selected Script State:** Background `#EEF4F2`, border `1px solid #134E4A`, text `#134E4A`.

### Cards & Media Blocks
- Surface `#FFFFFF`, border `1px solid #E4DFD5`, radius 8px. Zero elevation at rest.
- Hover state: Border shifts to `#D8D2C6`, subtle lift `box-shadow: 0 2px 8px rgba(24, 24, 27, 0.04)`.
- Video thumbnail containers maintain a crisp 1px inner hairline to visually dock media into the linen interface.

### Checkboxes & Radios
- Small, precise 14px boxes. Checkboxes feature a sharp 2px radius; radios are circular.
- Border `1.5px solid #D8D2C6`, background `#FFFFFF`. Active checked state fills with `#134E4A` with a crisp white tick or inner core.

### Timeline & Playhead (Domain Specific)
- **Track Bed:** `#F5F2EB` background with `#E4DFD5` 1-second interval ruler ticks.
- **Audio & Clip Segments:** Rounded 4px rects with `#FFFFFF` background, fine `#D8D2C6` border, subtle waveform rendered in `#76867E`.
- **Playhead Needle:** 1px vertical blade in `#134E4A`, capped by a tiny 8px rectangular flag housing the current timestamp in `JetBrains Mono`.
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system embodies an editorial, tactile, and craft-first aesthetic tailored for thoughtful educators, curators, researchers, and cinematic creators. It rejects modern SaaS tropes—such as neon gradients, glowing synthetic orbs, and generic saturated purple fills—in favor of the tactile dignity of fine publishing, architectural blueprints, and precision creative instruments.

The core philosophy blends:
- **Kinfolk / Print Editorial sensibility:** Deliberate whitespace, considered typographic hierarchies, and restrained linen surfaces that treat educational video scripting like literature.
- **Precision Swiss Utility:** Crisp hairline structure, meticulous micro-typography, mono-spaced metadata readouts, and quiet functional states modeled after high-end creative workbenches like iA Writer, Linear, and Figma.
- **Warm Tactility:** Cream-paper canvases, deep carbon inks, and understated mineral teal accents that evoke fountain pens, bookcloth binding, and drafting tables.

## Colors

The palette draws inspiration from traditional publishing houses, bookbinding cloth, and archival inks, calibrated strictly for a natural warm-light canvas.

- **Canvas & Surfaces:**
  - `canvas-default`: `#FBF9F5` — Warm linen tone serving as the outer bedrock.
  - `surface-elevated`: `#FFFFFF` — Pure sheet white reserved for floating cards, active panels, and inspect sheets.
  - `surface-subtle`: `#F5F2EB` — Warm paper stock for toolbars, sidebars, and nested editor blocks.
  - `surface-muted`: `#EFECE3` — Recessed tracks, scrubbers, and inactive inputs.

- **Inks & Text (Neutrals):**
  - `ink-primary`: `#18181B` — Deep carbon black for headlines, key titles, and definitive weights.
  - `ink-secondary`: `#3F3F46` — Neutral charcoal for body paragraphs and long-form voiceover copy.
  - `ink-tertiary`: `#71717A` — Muted slate-pencil for secondary labels, hotkey indicators, and timestamps.
  - `ink-subtle`: `#A1A1AA` — Placeholder tokens, inactive metadata glyphs, and timeline grids.

- **Hairlines & Dividers:**
  - `border-default`: `#E4DFD5` — Baseline hairline divider separating tool rails and timeline segments.
  - `border-strong`: `#D8D2C6` — Structural borders framing cards, modals, and preview displays.

- **Accent (Mineral Slate-Teal):**
  - `accent-primary`: `#134E4A` — Deep forest/mineral teal; used for critical calls-to-action, active playhead states, and confirmed keyframes.
  - `accent-surface`: `#EEF4F2` — Soft sage wash for selections, chip highlights, and active audio tracks.
  - `accent-hover`: `#114441` — Deepened ink-teal for interactive pressure.

- **Utility & Warning Accents:**
  - `accent-amber`: `#9A6A38` (Sepia/Ochre) — Subtle warning, bookmarking, and script revision flags.
  - `accent-error`: `#9F2E2E` (Burgundy) — Replaces harsh red with a classic editorial crimson.

## Typography

The typography creates a deliberate tension between the literary gravitas of serif book type and the clinical precision of architectural grotesk and monospaced data counters.

- **Display & Headlines (`Newsreader`):** Used with italic accents for emotional weight, chapter titling, educational hypotheses, and essay-level screen headers. It brings an intellectual, publication-grade presence to video creation.
- **Interface & Content (`Hanken Grotesk`):** Clean, structural, and neutral. Anchors the actual tool logic, parameter trees, script input bars, and inspector panels without drawing attention to itself.
- **Micro-Data & Metrology (`JetBrains Mono`):** Strictly reserved for timeline counters (e.g., `00:04:12:08`), aspect ratio badges (`16:9`, `9:16`), frame rates (`24fps`), and export dimension readouts. Set in uppercase or tabular numerals with increased tracking.

## Layout & Spacing

This design system uses an asymmetrical, content-first layout architecture balancing a literary reading column with high-density workspace docking.

- **Grid Philosophy:**
  - **Studio Workspace:** Multi-pane fluid viewport layout (script rail, viewport monitor, inspector panel, and timeline footers) anchored by strict 1px hairlines. Panes respect fixed minimum dimensions (e.g., sidebar: 320px, inspector: 280px) while the video canvas expands dynamically.
  - **Gallery & Editorial Views:** A classic 12-column modular grid with generous 3rem outer margins on desktop, focusing the content footprint at a maximum container width of `1280px` (or `740px` for pure script/essay authoring).
- **Rhythm & Safe Areas:**
  - Spacing derives strictly from an 8pt base unit with 4pt micro-adjustments for tight UI surfaces.
  - Generous vertical breathing room (`space-xl` and above) around manuscript blocks prevents the UI from feeling like a crowded traditional NLE (video editor), while tool parameters pack efficiently into `space-xs` and `space-sm` increments.

## Elevation & Depth

Visual hierarchy rejects blurry dropshadows and glassy neon blooms, utilizing **tactile sheet layering and hairline definition** to separate surfaces.

- **Layer 0 (Bedrock):** `#FBF9F5` (Linen). Outer background, surrounding tool gutters, and blank canvas states.
- **Layer 1 (Recessed/Tool Rails):** `#F5F2EB` (Subtle warm wash). Left-hand script sidebar, timeline tracks, and parameter wells. Bounded by a 1px solid border of `#E4DFD5`.
- **Layer 2 (Sheets & Active Stage):** `#FFFFFF` (Pristine paper). Video preview card, active floating popovers, and focused script segment cards. Bound by `#D8D2C6`.
- **Shadow Profile (Architectural Paper Lift):**
  - Floating sheets, dropdowns, and context menus receive a single, extremely refined shadow that mimics paper resting slightly above a drafting desk:
    `box-shadow: 0 1px 2px rgba(24, 24, 27, 0.04), 0 4px 12px rgba(24, 24, 27, 0.03);`
  - Zero colored shadows or diffuse spreads over 16px. Depth is felt through boundary lines, not ambient fog.

## Shapes

The geometry uses a restrained, tailored corner radius (`roundedness: 1` — Soft, 4px to 8px max).
- Standard buttons, text fields, chips, and segment tabs use `0.25rem` (4px) to retain an architectural, print-like edge.
- Viewport preview screens, media cards, and modal dialogs peak at `0.5rem` (8px).
- Capsule/pill-shaped radii are prohibited except for miniature numerical badges or playhead needles. Clean rectilinearity preserves the sense of a physical typesetting shop.

## Components

### Buttons
- **Primary Action (Render, Export, Create):** Solid `#134E4A` fill, `#FFFFFF` text in `Hanken Grotesk` Medium, `border: 1px solid transparent`, corner radius 4px. On hover: shifts subtly to `#114441`. Subtle tactile active state (`transform: translateY(0.5px)`).
- **Secondary (Editorial / Outline):** Background `#FFFFFF`, text `#18181B`, border `1px solid #D8D2C6`. Hover: `#F5F2EB`.
- **Ghost (Timeline Controls, Media Navigation):** Transparent background, text `#3F3F46`, hover: `#EFECE3` wash.

### Form Inputs & Script Editors
- **Text Inputs:** Paper white surface (`#FFFFFF`), bounded by 1px `#E4DFD5`, interior text `Hanken Grotesk`. Focus ring: no thick glow, just a crisp 1px stroke shift to `#134E4A` accompanied by an imperceptible `0 0 0 1px #134E4A`.
- **Narrative Script Block:** Borderless surface blending into `#FBF9F5` until hovered or active. Text set in `Newsreader` (18px) to encourage narrative prose, accompanied by a discreet `JetBrains Mono` line and duration counter on the margin.

### Chips & Metadata Tags
- Flat, non-pill rectangles (radius 3px). Background `#F5F2EB`, border `1px solid #E4DFD5`, text `JetBrains Mono` uppercase 11px in `#3F3F46`.
- **Active / Selected Script State:** Background `#EEF4F2`, border `1px solid #134E4A`, text `#134E4A`.

### Cards & Media Blocks
- Surface `#FFFFFF`, border `1px solid #E4DFD5`, radius 8px. Zero elevation at rest.
- Hover state: Border shifts to `#D8D2C6`, subtle lift `box-shadow: 0 2px 8px rgba(24, 24, 27, 0.04)`.
- Video thumbnail containers maintain a crisp 1px inner hairline to visually dock media into the linen interface.

### Checkboxes & Radios
- Small, precise 14px boxes. Checkboxes feature a sharp 2px radius; radios are circular.
- Border `1.5px solid #D8D2C6`, background `#FFFFFF`. Active checked state fills with `#134E4A` with a crisp white tick or inner core.

### Timeline & Playhead (Domain Specific)
- **Track Bed:** `#F5F2EB` background with `#E4DFD5` 1-second interval ruler ticks.
- **Audio & Clip Segments:** Rounded 4px rects with `#FFFFFF` background, fine `#D8D2C6` border, subtle waveform rendered in `#76867E`.
- **Playhead Needle:** 1px vertical blade in `#134E4A`, capped by a tiny 8px rectangular flag housing the current timestamp in `JetBrains Mono`.
```

The supplied HTML imports `Newsreader`, `Hanken Grotesk`, `JetBrains Mono`, and Material Symbols Outlined in various combinations. Use each screen's actual font import and class/style usage as the authority; do not replace these with Inter/system fonts. If the shared design file and an individual screen differ, record the conflict and preserve that screen's observed appearance pending review.


## 4. Existing repository: verified baseline from the supplied source ZIP

- Package name: `namastevideo-ai`; version `0.1.0`.

- Runtime engine range: `>=22 <25`.

- Existing scripts: `{"build": "tsc --project tsconfig.json", "test": "npm run build && node --test dist/tests/*.test.js", "pipeline": "npm run build && node --env-file-if-exists=.env dist/src/cli/index.js"}`.

- The supplied source package is a TypeScript/Node pipeline project, not an existing Next.js application. The root package scripts compile TypeScript, run Node tests, and invoke a CLI pipeline.

- Existing package dependencies include Remotion renderer/bundler/media utilities and React; no Next.js, database adapter, auth provider, or job-orchestration dependency appears in the supplied root `package.json`.

- The source archive contains `src/`, `tests/`, `dist/`, PRD/system/API/database/pipeline documentation, and no application `app/` or `pages/` frontend tree at the root.

- `dist/` is compiled output. Treat `src/` as the source of truth; do not edit `dist/` manually.

- The archive includes generated `dist/` files. Do not assume those compiled artifacts are proof that a fresh build passes; run the documented checks in the user's environment before accepting a milestone.


### Existing TypeScript source files included

- `src/cli/index.ts`
- `src/config/env.ts`
- `src/contracts/alignment.ts`
- `src/contracts/manifest.ts`
- `src/contracts/plan.ts`
- `src/contracts/qa.ts`
- `src/contracts/timeline.ts`
- `src/pipeline/canonicalHash.ts`
- `src/pipeline/renderService.ts`
- `src/pipeline/runService.ts`
- `src/pipeline/storyboardHtml.ts`
- `src/planning/plannerPrompt.ts`
- `src/providers/elevenLabsSpeech.ts`
- `src/providers/geminiPlanner.ts`
- `src/storage/assetOwnershipValidator.ts`
- `src/storage/index.ts`
- `src/storage/localArtifactStore.ts`
- `src/timing/alignmentMapper.ts`
- `src/timing/captionGrouper.ts`
- `src/timing/timelineCompiler.ts`
- `src/validation/mediaValidator.ts`
- `src/validation/semanticValidator.ts`
- `src/video/index.ts`
- `src/video/theme.ts`
- `src/video/core/index.ts`
- `src/video/core/sharedAnimationUtilities.ts`
- `src/video/core/theme.ts`
- `src/video/core/contracts/visualTypes.ts`
- `src/video/core/generic/index.ts`
- `src/video/registry/index.ts`
- `src/video/registry/legacyAdapter.ts`
- `src/video/registry/validateVisualSelection.ts`
- `src/video/registry/visualRegistry.ts`
- `src/video/registry/visualSchema.ts`
- `src/video/topics/algorithms/index.ts`
- `src/video/topics/computer-architecture/index.ts`
- `src/video/topics/photosynthesis/index.ts`
- `src/video/topics/water-cycle/index.ts`

### Existing automated test files included

- `tests/adversarialAndDynamicTopics.test.ts`
- `tests/alignmentMapper.test.ts`
- `tests/architectureImportBoundaries.test.ts`
- `tests/canonicalHash.test.ts`
- `tests/captionGrouper.test.ts`
- `tests/elevenLabsSpeech.test.ts`
- `tests/geminiPlanner.test.ts`
- `tests/liveSpeechTimeline.test.ts`
- `tests/mediaValidator.test.ts`
- `tests/plan.test.ts`
- `tests/renderService.test.ts`
- `tests/revisionAndRecovery.test.ts`
- `tests/runAndSceneIsolation.test.ts`
- `tests/runService.test.ts`
- `tests/sceneMappingAndContamination.test.ts`
- `tests/storage.test.ts`
- `tests/timelineCompiler.test.ts`
- `tests/visualRegistry.test.ts`

**Verification rule:** The supplied `IMPLEMENTATION_STATUS.md` reports prior milestones and tests, but this specification does not claim those tests were run during this audit. Run `npm test` before and after any integration work, and report the actual output.


## 5. Existing pipeline boundaries to preserve

The implementation status and technical design describe an existing pipeline with the following capabilities; verify each interface in source before calling it from the web application:

- Gemini-based storyboard planning and plan validation.
- Canonical SHA-256 plan hashing and explicit approval bound to a plan hash.
- ElevenLabs speech generation and timestamp/alignment processing.
- Timeline compilation, caption grouping, and synchronized animation.
- Remotion rendering and media QA validation.
- Local artifact storage, run manifests, revision/reuse behavior, and render failure recovery.

### Integration rule

Create a narrow server-only application service adapter around the existing pipeline. Do not duplicate planning, narration, timeline, rendering, or QA logic in React components or Next.js route handlers. The browser must never receive provider API keys or direct authority over filesystem paths, run IDs, artifact paths, ownership, plan hashes, approval actors, or job state.

Because the existing pipeline is CLI/local-artifact oriented, design the adapter against real exported functions and contracts discovered in `src/`. Avoid shelling out to the CLI from HTTP request handlers unless the pipeline architecture explicitly requires it and the execution is isolated; do not run long renders inside a normal request lifecycle.


## 6. Proposed application architecture (not yet implemented)

Start as a modular monolith unless repository verification demonstrates a reason to split services:

- **Web:** Next.js App Router + React + TypeScript.
- **Styling:** Tailwind CSS configured to reproduce the Stitch HTML, with a token file and reusable primitives. Keep original visual behavior, not generic defaults.
- **Validation:** schema validation at every untrusted API boundary (Zod is a candidate, subject to dependency review).
- **Authentication:** select a maintained provider/adapter supporting Google OAuth and email/password or the exact email flow represented in the designs. Server-side session is the authority; never trust a client-supplied owner ID.
- **Persistence:** proposed MongoDB Atlas based on `DB_DESIGN.md`, but it is not provisioned according to that document. Keep repository/service interfaces testable locally.
- **Private asset storage:** Cloudflare R2 is proposed in the design docs, not proven provisioned. Use a local adapter for development if appropriate; private assets must not be publicly exposed by guessing object URLs.
- **Long-running jobs:** durable orchestration (Inngest is proposed in `SYSTEM_DESIGN.md`) should be added when required by the chosen deployment. Do not pretend a free-tier deployment can run unbounded Remotion renders reliably. Benchmark actual render workload and deployment limits first.
- **Video generation:** the existing pipeline is the implementation to reuse.


### Suggested code boundaries (adapt to the repo; not a command to blindly scaffold)

```text
src/                         # existing pipeline; preserve its public contracts
web/ or app/                 # new Next.js application (choose one convention)
  app/                       # routes, layouts, server route handlers
  components/                # faithful Stitch components
  features/                  # auth, creation, storyboard, generation, library
  server/                    # auth, repositories, application services
  styles/                    # exact tokens, fonts, global styles
  tests/                     # web/domain integration tests
```

Avoid merging the pipeline and web app in a way that breaks its current TypeScript build/test scripts. Decide whether to use a workspace/monorepo layout or integrate Next.js at the root only after checking `tsconfig`, module boundaries, and Remotion bundling constraints.


## 7. Required user journeys

### Authentication gate
1. Unauthenticated visitors can reach the sign-in/create-account screens only.
2. Support Google OAuth and email registration/sign-in, with clear loading/error states consistent with the designs.
3. Protect every project, generation, video, and settings route server-side.
4. On successful authentication, route to the first-time welcome/onboarding screen when appropriate, then the creation studio.
5. Store user-specific projects/videos under the authenticated server session. Authorization checks must happen on every read/write/download; opaque IDs are not access controls.

### Quick Create
1. User enters a topic and supported options from the exact creation screen.
2. Submit a validated request to the server.
3. Server creates a project/version and invokes the existing planning pipeline through the application service.
4. Follow the exact product behavior defined by the creation design; Quick Create may reduce manual steps, but it must not bypass any pipeline-required approval invariant. If current pipeline requires explicit plan-hash approval, implement a clear server-controlled approval flow or reconcile the product requirement before automating approval.
5. Track job status, allow safe recovery, and route to the ready/preview screen when a verified artifact exists.

### Guided Create
1. User enters a topic.
2. Server creates a storyboard draft using existing planner functionality.
3. User reviews/edits the storyboard using the exact desktop/mobile Stitch screens and supported controls.
4. Any mutation invalidates prior approval where required. Approval is tied to the exact canonical plan hash, not a mutable project pointer.
5. Generate narration/render through the existing pipeline, with status and failure recovery.
6. Preview and download only an artifact whose status and ownership have been verified server-side.

### Library, settings, and publishing
- Library is scoped to the signed-in user's projects/videos; include populated and empty states from the designs.
- Settings must reflect only implemented account capabilities; do not display working toggles for unimplemented behavior.
- Publishing screens are visual designs, not evidence that provider integration is implemented. The unavailable state must remain truthful until publishing is built and credentials/permissions verified.
- Download-failure screen must only claim the master is preserved if the server verifies the artifact identity and hash. Do not trust client-supplied status text.


## 8. Data and security invariants

- Server session determines user ownership; ignore client-supplied `ownerId`/user IDs for authorization.
- Every project, draft, version, job, artifact, and download must enforce ownership on the server.
- Store provider credentials only in server-side environment configuration. Never include `.env`, secrets, API keys, or production credentials in the repository or output ZIP.
- Use private object storage and short-lived signed access where applicable.
- Treat generated storyboard content and any AI-produced URLs/text as untrusted data; never execute generated HTML/JS/shell/SQL.
- Job creation must be idempotent or protected against duplicate submissions; status transitions must be validated.
- Preserve previous successful videos when a later generation/revision fails.
- Do not make public signup or team/org features beyond the user's confirmed individual-account requirement unless product decisions change.
- Do not add billing/credits UI in the first version unless explicitly requested.


## 9. Important unresolved conflicts to record (do not silently decide)

1. **Product/PRD vs Stitch options:** `SYSTEM_DESIGN.md` describes English educational explainers at 60–90 seconds, vertical 1080×1920 at 30 fps, and specific voice/model decisions. Some Stitch screens expose broader aspect-ratio/duration/voice options. Keep the supplied visual controls faithful, but do not enable an option the pipeline cannot honor. Before wiring controls, document whether the control is disabled, narrowed, or supported by a later pipeline change.

2. **Quick Create vs explicit plan approval:** pipeline contracts bind approval to a canonical plan hash; Quick Create must not quietly violate this invariant. Define the user-visible approval semantics and record them.

3. **Auth provider:** system docs propose Better Auth, while the user decision only specifies Google and email/account sign-in. Verify compatibility and maintenance before selecting a package; do not assume auth exists.

4. **Database/storage/jobs:** MongoDB Atlas, Cloudflare R2, and Inngest are documented proposals, not confirmed provisioned services. Build interfaces and local testing paths before requiring paid infrastructure.

5. **Fonts/icons:** Stitch HTML uses Google Fonts and Material Symbols. Decide whether to load via network or bundle permitted font assets locally; whichever is chosen must preserve appearance and respect deployment/privacy constraints.

6. **Design token variants:** different HTML files contain overlapping but not always byte-identical Tailwind color maps/font imports. Compare each screen's actual CSS/markup and the shared `DESIGN.md`; do not assume one token map completely describes every screen.


## 10. Implementation milestones and acceptance criteria

### Milestone 0 — Baseline audit (read-only)
- Map existing exports/functions for pipeline entry points, artifact store, run state, plan approval, render, and QA.
- Inspect `tsconfig.json`, package scripts, and import-boundary tests.
- Extract screen screenshots, HTML, fonts, assets, and design tokens into a stable reference folder or maintain them as external references.
- Record all product/UI/API conflicts before coding.
- Run `npm test` in a controlled local environment and report actual pass/fail output; do not call live AI providers.

### Milestone 1 — Foundation + visual fidelity
- Add the application framework without breaking the existing pipeline build/test commands.
- Implement exact global fonts, colors, tokens, app shell, and auth screens from Stitch.
- Add Google and email auth with server-side route protection.
- Compare screenshots at the same viewport and resolve material differences.
- No fake successful login, fake user persistence, or nonfunctional controls.

### Milestone 2 — Creation + storyboard
- Implement both Quick and Guided Create using exact Stitch screens.
- Wire creation and storyboard routes to server-only application services.
- Persist drafts/version/approval state according to approved contracts.
- Verify approval/hash invalidation on edits.

### Milestone 3 — Generation + preview/download
- Add durable or appropriately isolated job processing, progress tracking, retries, and failure state.
- Reuse existing pipeline; do not duplicate its work.
- Verify output existence, ownership, hash/QA status before marking ready.
- Preview/download from a protected server-mediated route or short-lived signed URL.

### Milestone 4 — Library + settings + remaining states
- Populate and empty library states, settings, publishing studio/unavailable, generation failure, download failure, welcome, and mobile screens.
- Ensure the visual output remains faithful at the design viewport and responsive behavior works beyond it.

### Acceptance gates for each milestone
- Existing pipeline test suite still passes (actual result recorded).
- New tests cover server authorization, invalid input, job idempotency/state transitions, and relevant domain invariants.
- No secrets in source or generated archive.
- No UI control falsely claims unsupported functionality.
- Screenshot comparison uses supplied references; visual differences are documented and fixed, not waved away as “inspired by.”
- User-facing loading, empty, error, success, and mobile states match the supplied designs where available.


## 11. First coding-agent task (read-only; do this before implementation)

```text
You are auditing the Visutale repository. READ ONLY. Do not edit files, install packages, scaffold Next.js, run migrations, contact external AI providers, deploy, or overwrite the existing pipeline.

Inputs:
- Existing source ZIP/repository containing the TypeScript pipeline and docs.
- Stitch export ZIP containing each screen's code.html and screen.png plus editorial_studio_canvas/DESIGN.md.
- VISUTALE_IMPLEMENTATION_SPEC.md (this file).

User decisions:
- Exact Stitch visual reproduction is required; the designs are not loose inspiration.
- Every user must authenticate; support Google sign-in and email account creation/sign-in.
- Both Quick Create and Guided Create are required.
- Prefer free/local infrastructure for testing, upgrade when needed.
- Preserve the existing video pipeline.

Tasks:
1. Map the current source files and identify real callable pipeline APIs for planning, plan approval, speech, rendering, status, artifacts, validation, revisions, and recovery. Cite file paths and exported symbols.
2. Inspect the current TypeScript build/test constraints and propose the safest way to add Next.js without breaking the pipeline.
3. Map each Stitch screen folder to its visual purpose, viewport, fonts, tokens, and important interactions. Identify per-screen differences from shared DESIGN.md.
4. Compare PRD.md, SYSTEM_DESIGN.md, API_DESIGN.md, DB_DESIGN.md, PIPELINE_TECHNICAL_DESIGN.md, and the Stitch screens. List conflicts, especially format/duration/voice options, Quick Create approval behavior, auth, storage, and background jobs. Do not silently resolve them.
5. Separate implemented facts from proposed architecture and unverified claims.
6. Recommend a minimal, testable first implementation milestone and list the exact files likely to be added/changed, but do not make changes.
7. Report which commands were actually run and their exact results. Do not claim tests passed unless executed. Do not print secrets.

Return a concise audit report with paths/symbols, risks, unresolved decisions, and a proposed sequence. STOP and wait for approval before writing code.
```


## 12. Non-goals for the first implementation

- Do not rebuild the Gemini/ElevenLabs/Remotion pipeline.
- Do not treat Stitch HTML as a production app to paste wholesale without adapting asset paths, semantics, security, and framework constraints.
- Do not invent a new visual design system.
- Do not add publishing integration, billing, teams, or production infrastructure merely because a screen or proposal mentions it.
- Do not run paid provider calls as part of baseline tests.
- Do not claim production readiness before authentication, ownership isolation, storage privacy, job recovery, and media verification are tested.
