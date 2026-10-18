# NamasteVideo.ai — Implementation Status

**Updated:** 17 October 2026  
**Current milestone:** P3 — Topic Expansion and Revisions  
**Status:** P3 Topic Expansion and Revisions completed and verified. The pipeline now supports comparison (RAM vs Storage) and step-sequence (Binary Search) components, deterministic fixtures, live AI generation, human plan hash approval, ElevenLabs speech synthesis, audio-synchronized Remotion rendering, automated QA validation, and branching revisions (visual-only reuse, narration-affecting invalidation, narrator changes, and render failure recovery).

This file records actual implementation progress without silently rewriting the uploaded PRD or pipeline design. The PRD and pipeline document remain the governing specifications.

## Implemented in P0, P1, P2, and P3

- **P0 Foundation:**
  - TypeScript project setup with Node.js 22 runtime baseline.
  - Plan contract with versioning, English-only output, approved voice presets, supported scene types, visual-object registry, narration blocks, events, source references, and warnings.
  - Runtime structural and semantic validation, including duplicate ID checks and phrase/object/narration reference checks.
  - Canonical SHA-256 plan hashing.
  - Local artifact store with atomic file writes, hash support, and path traversal checks.
  - Local run manifest and explicit approval record bound to exact plan hash.
  - Water-cycle fixture plan and static HTML storyboard review artifact.
  - CLI: `preflight`, `validate-plan`, `fixture`, `approve`, and `status`.

- **P1 Visual Skeleton & Visual Quality Pass:**
  - **Timeline Compiler (`src/timing/timelineCompiler.ts`):** Converts approved storyboard plans into deterministic scene timings at 30 fps, ensuring strictly contiguous boundaries without gaps or overlaps.
  - **Phrase Cue Resolution:** Deterministically resolves phrase occurrences into exact millisecond offsets and frame ranges for visual animation events.
  - **Caption Grouper (`src/timing/captionGrouper.ts`):** Splits narration into readable, mobile-safe caption cues with maximum 2 lines and line-length limits.
  - **Visual System & Components (`src/video/`):**
    - `theme.ts`: Refined color palette, typography scale (title 40px, display 52px, caption 38px), mobile safe areas, and consistent elevation shadows.
    - `SceneContainer`: 1080 × 1920 portrait canvas with header, scene progress indicator, global progress bar, safe area margins, and isolated caption zone.
    - `Captions`: High-contrast, clean 2-line caption pill anchored in the bottom safe area.
    - `TitleHookScene`, `EvaporationScene`, `TranspirationScene`, `CondensationScene`, `PrecipitationScene`, `CollectionScene`, `TakeawayScene`.
  - **Preview Frame Capture (`src/pipeline/renderService.ts`):** Midpoint representative PNG stills captured per scene.
  - **Output QA Validator (`src/validation/mediaValidator.ts`):** Machine validation verifying dimensions (1080x1920), frame rate (30 fps), duration bounds (60-90s), AAC audio, seekability, and caption formatting.
  - **CLI Commands:** Added `render` (alias `generate`) and `validate`.

- **P2 Live AI Pipeline:**
  - **Gemini Planner Adapter (`src/providers/geminiPlanner.ts` & `src/planning/plannerPrompt.ts`):** Structured planning with `gemini-3.8-flash`, prompt constraints, schema & semantic validation, application-envelope assignment, and exponential backoff retry.
  - **ElevenLabs Speech Adapter (`src/providers/elevenLabsSpeech.ts`):** Timestamped speech synthesis (`/v1/text-to-speech/{voice_id}/with-timestamps`), character alignment array validation, and duration extraction.
  - **Alignment Mapper (`src/timing/alignmentMapper.ts`):** Maps provider character timestamps to word intervals, narration blocks, and semantic phrase cues.
  - **Timeline Audio Synchronization (`src/timing/timelineCompiler.ts` & `src/video/MainVideo.tsx`):** Synchronizes scene durations, animation events, captions, and playback using real speech audio artifacts.
  - **CLI Commands:** Added `plan` and `speech` (alias `synthesize-speech`).

- **P3 Topic Expansion and Revisions:**
  - **Comparison Component (`src/video/scenes/ComparisonScene.tsx`):**
    - Designed for RAM vs Storage and two-concept comparisons.
    - Dual elevated cards comparing Active Workspace vs Long-Term Filing Cabinet.
    - Visual hierarchy for speed, volatility, and capacity with progressive disclosure springs and comparison highlight badges.
  - **Step Sequence Component (`src/video/scenes/StepSequenceScene.tsx`):**
    - Designed for algorithmic and step-by-step procedures.
    - Trusted deterministic binary search dataset: sorted array `[4, 9, 15, 23, 38, 56, 72, 85, 94]` searching for target `72`.
    - "Requires Sorted Input" badge, dynamic Low/Mid/High pointers.
    - Midpoint calculation, comparison check, and visual diagonal slashes to discard the irrelevant half of the array.
    - Step progression through midpoint 38 (index 4) -> discard left half -> midpoint 72 (index 6) -> target match confirmation with O(log n) efficiency badge.
  - **Deterministic Fixtures:**
    - `fixtures/plans/ram-vs-storage.json`: 5 scenes, 62s duration.
    - `fixtures/plans/binary-search.json`: 6 scenes, 67s duration.
  - **Revision and Recovery Engine (`src/pipeline/runService.ts`):**
    - `createRevisionRun`: Creates child runs with `parentRunId`, computing structural diffs against parent plan.
    - **Visual-only revision:** Reuses parent audio and alignment artifacts across unaffected scenes without calling ElevenLabs; inherits narration approval; advances directly to compile/render.
    - **Narration-affecting revision:** Invalidates affected audio and alignment; enforces explicit creator approval of revised plan hash before speech synthesis.
    - **Narrator change:** Retains approved narration text while invalidating audio artifacts; sets stage to speech for new voice synthesis.
    - **Controlled failure recovery:** Render failures persist `failed` state and error details in manifest.json; retrying renders reuse existing speech artifacts without re-synthesizing.
  - **CLI Command:** Added `npm run pipeline -- revise --run <parent> [--plan-file <file> | --change-narrator <voice> | --increase-labels]`.

## Verification performed in this environment

- TypeScript compilation completed cleanly with TypeScript 5.8.3 (`npm run build`).
- **34 automated tests passing** (`npm test`), covering:
  - Alignment character-to-word mapping and phrase resolution.
  - Canonical JSON ordering and hash stability.
  - Caption wrapping (2-line limit, character bounds) and cue grouping.
  - ElevenLabs alignment validation and input validation.
  - Gemini planner system & user prompt assembly, schema enforcement, and input rejection.
  - Live speech timeline compilation and frame synchronization.
  - Output media validation (file size, dimensions, fps, duration, audio track, gaps/overlaps, captions).
  - Water-cycle, RAM vs Storage, and Binary Search fixture schema validation.
  - Approval state enforcement and plan hash modification detection.
  - Local artifact store atomic writes and path traversal defense.
  - Visual-only revision speech reuse and parent preservation.
  - Narration-affecting revision invalidation and approval requirement.
  - Narrator change audio invalidation and stage routing.
  - Controlled render failure persistence and speech preservation on retry.

- **Verified Rendered Runs:**
  1. **Water-Cycle Explainer (P2 Live Run):**
     - Run ID: `how-the-water-cycle-works-20261017-135348768Z`
     - Duration: 81.67s (2,450 frames), 1080x1920, 30fps, 9.58 MB, QA `overallPassed: true`.
  2. **RAM vs Storage Explainer (P3 Live Run):**
     - Run ID: `explain-the-difference-between-ram-and-s-20261017-171404843Z`
     - Plan Hash: `e51b66cb885543d44b11f01a566781714ccce5fff7d3afed59c4280b18a73f8b` (explicitly approved).
     - Narration: 6 scenes synthesized via ElevenLabs (Bella development voice).
     - Duration: 72.33s (2,170 frames), 1080x1920, 30fps, AAC audio, 6.62 MB, 36 captions, QA `overallPassed: true`.
  3. **Binary Search Explainer (P3 Live Run):**
     - Run ID: `binary-search-20261017-172454920Z`
     - Plan Hash: `4880448d1856298dfa1a74e344fe167f3a055095e178a8bc9e6a969f804521ec` (explicitly approved).
     - Narration: 6 scenes synthesized via ElevenLabs (Bella development voice).
     - Visuals: Sorted array `[4, 9, 15, 23, 38, 56, 72, 85, 94]`, target `72`, midpoint inspection, half eliminated, O(log n) efficiency.
     - Duration: 61.3s (1,839 frames), 1080x1920, 30fps, AAC audio, 5.78 MB, 33 captions, QA `overallPassed: true`.
  4. **RAM vs Storage Visual-Only Revision (P3 Live Run):**
     - Run ID: `explain-the-difference-between-ram-and-s-rev-20261017-173500212Z`
     - Parent Run: `explain-the-difference-between-ram-and-s-20261017-171404843Z` (preserved untouched in `ready-for-review`).
     - Speech API calls: 0 (all 6 scene audio clips reused from parent).
     - Duration: 72.33s (2,170 frames), 1080x1920, 30fps, AAC audio, 6.75 MB, QA `overallPassed: true`.

## Configuration notes & voice limitations

- `GEMINI_MODEL`: Verified operational with `gemini-3.8-flash`.
- `ELEVENLABS_MODEL`: Configured as `eleven_multilingual_v2`.
- **Voice Preset Limitation:** Bella (`hpp4J3VqNfWAUOO0d1Us`) was used as a temporary development voice because library voice access is restricted on free ElevenLabs accounts. Bella has an American accent and **does not** satisfy the final Indian English requirement. Real Indian English voices must be tested and configured when account library permissions are available.

## Cross-Topic Visual Contamination & Scene Mapping Fix (18 October 2026)

- **Problem Diagnosed:**
  - In RAM vs Storage: Scene 1 rendered the Water Cycle title and animated droplet; middle scenes repeated comparison cards due to substring routing (`sceneId.includes("ram")`); Scene 6 rendered Water Cycle takeaway stages (Evaporation, Condensation, Precipitation, Collection).
  - In Binary Search: Scene 1 rendered the Water Cycle title/droplet; Scene 2 (`scene-sorted-array`, `labeled-diagram`) rendered the plant transpiration diagram; Scene 5 (`scene-complexity`, `comparison`) rendered RAM vs Storage properties; Scene 6 rendered the Water Cycle takeaway.
  - In Water Cycle: Verification confirmed plan fidelity, but scene routing relied on ad-hoc fallbacks.

- **Root Causes:**
  1. Substring matching in `src/video/MainVideo.tsx` intercepted non-comparison scenes and forced all hooks/takeaways to hardcoded components.
  2. Switch statement fallbacks routed all generic `labeled-diagram` scenes to `TranspirationScene` and `process-flow` to `EvaporationScene`.
  3. `TitleHookScene`, `TakeawayScene`, and `ComparisonScene` had hardcoded strings, properties, and hero graphics.

- **Architectural Fixes:**
  1. **Topic-Aware Compilation & Routing:** Added `topic` propagation to `CompiledTimeline`, `timelineCompiler.ts`, and `MainVideo.tsx`.
  2. **Dedicated Generic Components:**
     - Created `LabeledDiagramScene.tsx` for structured diagrams (CPU-to-RAM bus architectures, SSD storage layouts, sorted array rules).
     - Created `ProcessFlowScene.tsx` for multi-stage processes.
  3. **Topic Isolation in Scenes:**
     - Refactored `TitleHookScene.tsx` and `TakeawayScene.tsx` to render dynamically from approved scene text and topic-appropriate hero graphics.
     - Refactored `ComparisonScene.tsx` with `resolveComparisonConcepts` and strict contamination guardrails in `validateComparisonData` (rejects hardware properties in algorithmic comparisons, rejects search complexity in hardware comparisons).
  4. **Strict Dispatch:** In `MainVideo.tsx`, handcrafted water-cycle scenes are strictly isolated to the Water Cycle topic; all other scenes dispatch strictly by `scene.type` with exhaustive error handling for unknown types.
  5. **Regression Test Suite:** Added `tests/sceneMappingAndContamination.test.ts` (42 total automated tests passing).

- **Corrected & Verified Revision Runs:**
  1. **RAM vs Storage Revision:**
     - Run ID: `explain-the-difference-between-ram-and-s-rev-20261018-030626442Z`
     - Duration: 72.33s (2,170 frames), 1080x1920, 30fps, 5.58 MB, AAC audio, QA `overallPassed: true`.
     - Visual Verification: Scene 1 renders Phone Spec Sheet (8 GB RAM vs 128 GB Storage); Scene 3 renders CPU-to-RAM direct link diagram; Scene 4 renders SSD storage diagram; Scene 6 renders Working Desk vs Closet takeaway. Zero water cycle elements.
  2. **Binary Search Revision:**
     - Run ID: `binary-search-rev-20261018-030633986Z`
     - Duration: 61.3s (1,839 frames), 1080x1920, 30fps, 4.68 MB, AAC audio, QA `overallPassed: true`.
     - Visual Verification: Scene 1 renders Divide & Conquer hero graphic; Scene 2 renders Sorted Array Rule `[4, 9, 15, 23, 38, 56, 72, 85, 94]`; Scene 5 renders Linear Search O(n) vs Binary Search O(log n); Scene 6 renders the 3 algorithmic takeaways. Zero plant or water cycle elements.
  3. **Water Cycle Revision:**
     - Run ID: `how-the-water-cycle-works-rev-20261018-030641738Z`
     - Duration: 81.67s (2,450 frames), 1080x1920, 30fps, 9.23 MB, AAC audio, QA `overallPassed: true`.
     - Visual Verification: Correctly renders all 4 hydrological stages (Evaporation, Condensation, Precipitation, Collection) and circular planetary takeaway.

## Photosynthesis Scene 2 Diagram Fix (18 October 2026)

- **Problem Diagnosed:**
  - In Photosynthesis run `explain-how-photosynthesis-works-to-a-be-20261018-034337931Z`, Scene 2 ("The 3 Key Ingredients") narrated sunlight, water, and carbon dioxide, but visually rendered computer hardware architecture (CPU Processor, RAM Chip, Ultra-Fast Link, Volatile Memory).
  - The other five scenes (Scene 1 title hero, Scene 3 plant cell/chloroplast cards, Scene 4 reaction flow, Scene 5 plant growth and atmosphere, Scene 6 takeaway) rendered correctly.

- **Root Cause Identified:**
  1. In `src/video/scenes/LabeledDiagramScene.tsx`, variant detection checked:
     `const isRamDetail = scene.sceneId.includes("ram") || scene.objects.some((o) => o.id.includes("ram"));`
     In the approved Scene 2 plan, the container object is `{ id: "obj-plant-diagram", label: "Plant Anatomy Diagram" }`.
     The word `"diagram"` contains the substring `"ram"` (`d-i-a-g-[r-a-m]`), which evaluated to `true` and triggered the CPU/RAM hardware preset.
  2. Additionally, `isEventActive` compared `frame >= ev.startFrame` directly against global timeline frames without subtracting `scene.startFrame`.

- **Architectural Fixes:**
  1. **Typed Diagram Variant Resolver (`resolveDiagramVariant`):**
     - Replaced fragile substring matching with tokenized word boundary analysis (`split(/[^a-z0-9]+/)`). `"diagram"` yields `["diagram"]` and never matches `"ram"`.
     - Added topic context gating: RAM and storage architecture diagrams only trigger if the topic explicitly relates to computer hardware/memory.
     - Implemented the `"plant-ingredients"` variant for botany/photosynthesis ingredient scenes (`obj-water-arrow`, `obj-sun-rays`, `obj-co2-node`, `obj-plant-diagram`).
     - Kept internal cell organelle scenes (such as Scene 3 `scene-chloroplast`) resolving to `"generic"` card layouts.
  2. **Relative Frame Offset Fix:** Corrected `isEventActive` to compute relative scene frames (`ev.startFrame - scene.startFrame`).
  3. **Plant & Raw Inputs SVG Composition:**
     - High-contrast, educational SVG showing root system branching in soil horizon, main stem with animated upward capillary xylem water flow, green foliage with leaf veins and microscopic stomata pores.
     - Radiant Sun in top-left emitting traveling golden rays directed at leaves.
     - Ambient air in top-right with CO2 badges and streaming inflow arrows into leaf stomata.
     - 3 prominent interactive ingredient cards (Sunlight, CO2, Water via Roots) that activate and pulse on their respective narrative cues.
  4. **Regression Tests Added (`tests/sceneMappingAndContamination.test.ts`):** 45 automated tests now passing cleanly.

- **Verified Rendered Revision:**
  - Run ID: `explain-how-photosynthesis-works-to-a-be-rev-20261018-041300615Z`
  - Parent Run: `explain-how-photosynthesis-works-to-a-be-20261018-034337931Z` (preserved untouched in `ready-for-review`).
  - Revision Type: `visual-only` (reused all 6 speech and alignment artifacts; 0 Gemini/ElevenLabs API calls).
  - Duration: 66.2s (1,986 frames), 1080x1920, 30fps, 6.53 MB MP4, AAC audio, QA `overallPassed: true`.
  - Visual Verification:
    - Scene 2 (`scene-2-scene-ingredients.png`) renders the plant anatomy, roots, stem, leaves, sunlight rays, water intake, and CO2 arrows with zero hardware elements.
    - Scenes 1, 3, 4, 5, and 6 verified completely intact and consistent with topic and narration.

## Architectural Refactor: Isolated Visual Modules & Deterministic Scene Rendering (18 October 2026)

- **Objective:**
  Permanently eliminate cross-topic visual contamination, ad-hoc substring heuristics, and monolithic scene switch statements by restructuring `src/video/` into a four-layer architecture with isolated topic modules, an explicit typed visual registry, runtime domain gating, and automated AST/import boundary tests.

- **Architecture Implemented:**
  1. **Core Layer (`src/video/core/`):**
     - Completely topic-independent foundation.
     - `theme.ts`: Typography, palette, safe-area layout dimensions.
     - `SceneContainer.tsx`: Standard 1080x1920 portrait canvas, stage header, progress indicators.
     - `Captions.tsx`: High-contrast, mobile-safe caption overlay.
     - `sharedAnimationUtilities.ts`: Relative event springs (`isEventActiveInScene`, `getEventSpringProgress`).
     - `primitives/CommonPrimitives.tsx`: `VisualStageCard`, `DiagramCard`, `AnimatedBadge`.
     - `primitives/DiagramPrimitives.tsx`: `DiagramNode`, `DiagramArrow`.
     - `generic/`: Clean, topic-independent visual components (`GenericTitleHook`, `GenericLabeledDiagram`, `GenericProcessFlow`, `GenericStepSequence`, `GenericComparison`, `GenericTakeaway`).
  2. **Topic Modules (`src/video/topics/`):**
     - Four isolated domain folders, each with dedicated visual components and a public `index.ts` export boundary:
       - `photosynthesis/`: `PhotosynthesisTitleHook`, `PlantIngredientsDiagram`, `ChloroplastDiagram`, `PhotosynthesisReaction`, `PhotosynthesisImpact`, `PhotosynthesisTakeaway`.
       - `water-cycle/`: `WaterCycleTitleHook`, `EvaporationScene`, `TranspirationScene`, `CondensationScene`, `PrecipitationScene`, `CollectionScene`, `WaterCycleTakeaway`.
       - `computer-architecture/`: `RamStorageTitleHook`, `RamArchitectureDiagram`, `StorageArchitectureDiagram`, `RamStorageComparison`, `RamStorageTakeaway`.
       - `algorithms/`: `BinarySearchTitleHook`, `SortedArrayPrerequisite`, `BinarySearchStepSequence`, `SearchComparison`, `BinarySearchTakeaway`.
     - Peer isolation: No topic module ever imports from another topic module.
  3. **Visual Registry Layer (`src/video/registry/`):**
     - `visualSchema.ts`: Strongly typed `VisualDomain` (`'water-cycle' | 'photosynthesis' | 'computer-architecture' | 'algorithms' | 'generic'`) and `VisualVariantId` union.
     - `visualRegistry.ts`: Static registry mapping 29 variant IDs to metadata and component definitions.
     - `validateVisualSelection.ts`: Runtime domain validation. Throws `CrossTopicContaminationError` if an attempted variant does not match the topic's domain. Generic variants are permitted across all domains.
     - `legacyAdapter.ts`: Deterministic resolver for historical or unadorned plans, guaranteeing that unmatched scenes strictly fall back to `generic.*` and never topic-specific visuals.
  4. **Composition Root (`src/video/MainVideo.tsx`):**
     - Eliminated all topic-specific if/else branches, substring heuristics, and ad-hoc fallbacks.
     - Resolves `scene.visualVariant` (or deterministically via `legacyAdapter`), validates selection, looks up component in the registry, and renders.

- **Contracts and Compilation Updates:**
  - `src/contracts/plan.ts`: Optional `visualVariant` and `visualData` added to `StoryboardScene`.
  - `src/contracts/timeline.ts`: Optional `visualVariant` and `visualData` added to `CompiledScene`.
  - `src/timing/timelineCompiler.ts`: Resolves and validates `visualVariant` at compile time, guaranteeing validated variant metadata on all compiled scenes.
  - `src/planning/plannerPrompt.ts`: Documents optional `visualVariant` in planner JSON schema instructions.

- **Automated Verification:**
  - **54 automated tests passing** cleanly (`npm test`).
  - `tests/architectureImportBoundaries.test.ts`: Automated import analysis ensuring:
    - `core/` never imports from `topics/` or `registry/`.
    - Topic modules never import from peer topic modules.
    - External layers only import topic modules through their public `index.ts` boundaries.
  - `tests/visualRegistry.test.ts`: Validates complete registry population, domain resolution, cross-topic contamination prevention, and deterministic legacy mapping.
  - `tests/sceneMappingAndContamination.test.ts`: Verifies isolated scene routing across all topics.

- **4-Topic Regression Matrix Rendered & Verified:**
  All four topics rendered from clean revision runs without live AI or speech API calls:
  1. **Water Cycle Explainer:**
     - Run ID: `how-the-water-cycle-works-rev-20261018-052619321Z`
     - Duration: 81.67s (2,450 frames), 1080x1920, 30fps, 9.33 MB MP4, AAC audio, QA `overallPassed: true`.
     - Stills verified: Full 4-phase closed hydrological loop intact.
  2. **RAM vs Storage Explainer:**
     - Run ID: `explain-the-difference-between-ram-and-s-rev-20261018-052636386Z`
     - Duration: 72.33s (2,170 frames), 1080x1920, 30fps, 5.78 MB MP4, AAC audio, QA `overallPassed: true`.
     - Stills verified: Spec sheet hero, CPU-to-RAM bus diagram, SSD storage diagram, working desk vs cabinet comparison, takeaway. Zero water cycle or botany elements.
  3. **Binary Search Explainer:**
     - Run ID: `binary-search-rev-20261018-052711635Z`
     - Duration: 61.3s (1,839 frames), 1080x1920, 30fps, 4.54 MB MP4, AAC audio, QA `overallPassed: true`.
     - Stills verified: Divide & Conquer hero, 9 sorted array tiles `[4, 9, 15, 23, 38, 56, 72, 85, 94]`, pointer step sequence, linear vs binary comparison, algorithmic takeaway. Zero water cycle or plant elements.
  4. **Photosynthesis Explainer:**
     - Run ID: `explain-how-photosynthesis-works-to-a-be-rev-20261018-052736185Z`
     - Duration: 66.2s (1,986 frames), 1080x1920, 30fps, 7.00 MB MP4, AAC audio, QA `overallPassed: true`.
     - Stills verified: Solar energy hero, 3 key ingredients diagram (light, CO2, water via roots), cellular chloroplast and thylakoid solar panels, chemical reaction (6 CO2 + 6 H2O -> C6H12O6 + 6 O2), plant fuel & oxygen release, closing summary. Zero CPU/RAM hardware elements.

## Not implemented yet

- Next.js dashboard, Better Auth, MongoDB Atlas, Cloudflare R2, Inngest, Vercel Sandbox, and Instagram publishing/scheduling.

