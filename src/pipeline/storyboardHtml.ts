import type { StoryboardPlan } from "../contracts/plan.js";

export function renderStoryboardReviewHtml(plan: StoryboardPlan, planHash: string): string {
  const sceneMarkup = plan.scenes.map((scene, index) => {
    const narration = scene.narration.map((block) => `<p>${escapeHtml(block.text)}</p>`).join("\n");
    const objects = scene.objects.map((object) => `<li><strong>${escapeHtml(object.label)}</strong> <span>${escapeHtml(object.kind)}</span></li>`).join("\n");
    const visibleText = scene.onScreenText.map((text) => `<span class="tag">${escapeHtml(text)}</span>`).join(" ");
    return `<article class="scene">
      <header><span class="number">${index + 1}</span><div><h2>${escapeHtml(scene.type.replaceAll("-", " "))}</h2><p class="purpose">${escapeHtml(scene.purpose)}</p></div><span class="duration">~${(scene.estimatedDurationMs / 1000).toFixed(1)} s</span></header>
      <section><h3>Narration</h3>${narration}</section>
      <section><h3>Visual objects</h3><ul>${objects || "<li>No visual objects configured.</li>"}</ul></section>
      <section><h3>On-screen text</h3><div>${visibleText || "<em>None specified</em>"}</div></section>
      <section><h3>Animation cues</h3><p>${scene.events.length} cue(s), each anchored to approved narration.</p></section>
    </article>`;
  }).join("\n");
  const totalMs = plan.scenes.reduce((sum, scene) => sum + scene.estimatedDurationMs, 0);

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Storyboard review — ${escapeHtml(plan.topic)}</title>
<style>
:root{color-scheme:light;--ink:#1d2630;--muted:#647180;--line:#dce2e8;--accent:#385d78;--paper:#f6f8fa;--white:#fff}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:960px;margin:0 auto;padding:32px 20px 64px}.notice{padding:12px 16px;border-left:4px solid #b7791f;background:#fff8e8;margin:20px 0}.hero{background:var(--white);border:1px solid var(--line);border-radius:18px;padding:26px;margin:16px 0 22px}.eyebrow{text-transform:uppercase;letter-spacing:.1em;font-size:12px;color:var(--accent);font-weight:700}.meta{display:flex;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:14px}.scene{background:var(--white);border:1px solid var(--line);border-radius:16px;padding:20px;margin:14px 0}.scene header{display:flex;align-items:flex-start;gap:12px;border-bottom:1px solid var(--line);padding-bottom:12px}.number{background:var(--accent);color:white;border-radius:50%;width:32px;height:32px;text-align:center;line-height:32px;flex:none}.scene h2{font-size:18px;text-transform:capitalize;margin:0}.purpose{color:var(--muted);margin:3px 0}.duration{margin-left:auto;white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--muted)}h1{line-height:1.15;margin:8px 0 12px;font-size:clamp(28px,5vw,44px)}h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:18px 0 6px}.scene p{margin:6px 0}.scene ul{padding-left:20px;margin:4px 0}.scene li span{font-size:12px;color:var(--muted)}.tag{display:inline-block;padding:4px 9px;margin:2px;border-radius:99px;background:#e9f0f5;color:#2c4b62;font-size:13px}.hash{overflow-wrap:anywhere;font:12px/1.4 ui-monospace,monospace;background:#eef1f4;padding:10px;border-radius:8px}@media(max-width:520px){.wrap{padding:18px 12px}.hero,.scene{padding:16px}.duration{font-size:12px}}
</style></head><body><main class="wrap"><p class="eyebrow">NamasteVideo.ai · Prototype artifact</p><div class="notice"><strong>Review required.</strong> This is a static storyboard summary, not a rendered animation or proof of live AI generation. Check the narration, visual intent, timing, and any warnings before approving it.</div>
<section class="hero"><h1>${escapeHtml(plan.topic)}</h1><p>${escapeHtml(plan.learningObjective)}</p><div class="meta"><span>Audience: ${escapeHtml(plan.audience)}</span><span>Language: English</span><span>Voice preset: ${escapeHtml(plan.voicePreset)}</span><span>Estimated duration: ${(totalMs / 1000).toFixed(1)} s</span></div>${plan.warnings.length ? `<h3>Warnings</h3><ul>${plan.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}</section>
${sceneMarkup}<section class="hero"><h2>Approval identity</h2><p>Approval must reference this exact plan hash. Editing the plan changes its hash and invalidates this approval.</p><div class="hash">${escapeHtml(planHash)}</div></section></main></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
