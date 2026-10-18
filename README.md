# NamasteVideo.ai

Local TypeScript prototype foundation for the project described by `PRD.md` and `PIPELINE_TECHNICAL_DESIGN.md`.

## Read these first

- `PRD.md` is the product baseline for the internal V1 application.
- `PIPELINE_TECHNICAL_DESIGN.md` controls the prototype-first implementation sequence.

If implementation details appear to conflict between these two documents, do not silently pick a value. Record the discrepancy and resolve it before the affected live integration.

## Current milestone: P3 — Topic Expansion and Revisions

This milestone delivers:

- Visual components for two new topic types:
  - `ComparisonScene`: Dual elevated card comparison (e.g. RAM vs Storage) with speed, volatility, and capacity differentiation, progressive springs, and comparison badges.
  - `StepSequenceScene`: Algorithmic step-by-step procedure (e.g. Binary Search on `[4, 9, 15, 23, 38, 56, 72, 85, 94]`, target `72`), midpoint calculation, visual elimination of irrelevant half, and O(log n) efficiency badge.
- Deterministic fixtures for `ram-vs-storage.json` and `binary-search.json`.
- Live Gemini storyboard planning, human plan hash approval, ElevenLabs speech synthesis, audio-synchronized Remotion rendering, and media validation across all three core topics.
- Branching revision and recovery engine:
  - Visual-only revisions reusing speech audio artifacts without provider calls.
  - Narration-affecting revisions invalidating audio and requiring explicit re-approval.
  - Narrator change switching voice preset and re-synthesizing audio.
  - Controlled render failure persisting error state and retrying without re-synthesizing valid audio.
- 34 automated unit and integration tests passing.

## Prerequisites

- Node.js 22 (the initial local runtime baseline is recorded in `.nvmrc`).
- npm.

## Setup

```bash
npm install
cp .env.example .env
npm test
```

The fixture path works without provider credentials. Keep API keys in `.env`, which is ignored by Git; never put secrets in fixtures, plans, or generated artifacts intended for source control.

## Commands

Run a local environment check. This command does not call providers:

```bash
npm run pipeline -- preflight
```

Validate the committed fixture contract:

```bash
npm run pipeline -- validate-plan --file fixtures/plans/water-cycle.json
```

Create a local fixture run and its static storyboard review HTML:

```bash
npm run pipeline -- fixture --name water-cycle
```

The command prints the run path and exact SHA-256 plan hash. Open the printed `plan-review.html` path in a browser and review the plan. Then record approval of that exact plan version:

```bash
npm run pipeline -- approve --run local/water-cycle/<version-id> --plan-hash <printed-sha256> --approved-by local-creator
```

Inspect the run state:

```bash
npm run pipeline -- status --run local/water-cycle/<version-id>
```

Replace `<version-id>` and `<printed-sha256>` with the actual values printed by the fixture command. Approval is bound to the exact plan hash; it must not be reused after any plan mutation.

Render the approved storyboard into a real MP4 video:

```bash
npm run pipeline -- render --run local/water-cycle/<version-id>
```

This compiles the timeline, bundles the Remotion composition, renders all 2,040 frames (68 seconds at 30 fps, 1080 × 1920 portrait), saves `output.mp4` to the run directory, runs media QA verification, and saves `qa.json`.

Validate an existing rendered video artifact and view the machine QA report:

```bash
npm run pipeline -- validate --run local/water-cycle/<version-id>
```

Artifacts generated in `runs/local/water-cycle/<version-id>/`:
- `plan.json`: Validated storyboard plan.
- `plan-review.html`: Human-readable visual review artifact.
- `approval.json`: Approval record bound to canonical plan hash.
- `timeline.json`: Compiled deterministic scene and event timeline.
- `captions.json`: Extracted mobile-safe caption cues.
- `output.mp4`: Decodable 1080 × 1920 30 fps h264 video.
- `qa.json`: Automated QA validation report.
- `manifest.json`: Run state and artifact registry.

## Provider configuration status

`.env.example` intentionally leaves `GEMINI_MODEL` blank. The PRD names `gemini-3.8-flash`, while the implementation notes in the pipeline document record a conflicting configured default. Resolve that explicitly before the live P2 step. The shared baseline for narration is `eleven_multilingual_v2`, with actual male/female voice IDs selected by listening tests.

When provider configuration is complete, this checks local values only and still makes no network request:

```bash
npm run pipeline -- preflight --require-live
```

A successful local configuration check does not prove that credentials, model identifiers, voice IDs, or quotas work against the provider. Live generation must be an explicit later step.

## Data and artifact safety

- Runtime artifacts go into `runs/`, which is ignored by Git.
- Every run has a `manifest.json`, `plan.json`, `plan-review.html`, and (after explicit approval) `approval.json`.
- Model output is treated as untrusted structured data and must pass validation before future rendering.
- The initial artifact store is local-only. It will need a storage adapter when the application transitions to MongoDB Atlas, Cloudflare R2, and Inngest as described in the PRD.

## Source documents

The checked-in copies of `PRD.md` and `PIPELINE_TECHNICAL_DESIGN.md` are the uploaded planning documents used as the implementation baseline. Preserve their terminology and decisions. Update the status text in the PRD when implementation has progressed enough that its current planning-only status is no longer accurate.

`PROTOTYPE_STATUS.md` separates historical evidence described in the pipeline document from checks reproduced in this starter package. Historical results are not represented as independently re-run here.
