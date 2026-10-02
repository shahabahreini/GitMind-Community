# Execution ledger: GitMind Showreel Film

Plan: `plans/gitmind-showreel-film.md` (v1.1, Reviewed and ready to execute)
Authorization: the owner said "Execute the whole plan" on 2026-09-28. Stop at the owner gates: 2.1 animatic, 4.1 one-bar audio prototype, 5.1 finishing look.
Project: `../GitMind-Film/` (sibling of this repo)

## 1. Coverage ledger
| ID | Task | Pri | Acceptance check | Status | Evidence |
|---|---|---|---|---|---|
| 1.1 | Scaffold Remotion | must | Studio shows the composition; 120 f test render; render time recorded | done (verified) | Studio composition registered; `out/test/t120.mp4` (120 f) rendered in 15 s incl. bundle (A5: est. ≈ 4–6 min @60 fps, ≈ 15–25 min @240 fps master); frame 60 rendered twice = identical SHA1 `52e04783…`. Remotion 4.0.529 pinned. |
| 1.2 | Vector logo rebuild | must | Lobe IoU ≥ 0.95; stroke deviation ≤ 3 px; draw-on works | done (verified) | `scripts/vectorize-logo.py` → `src/brand/logo-data.json`. Lobe-trace IoU 0.9967/0.9968; composite render vs PNG per-color IoU blue 0.9736, gold 0.9678 (≥ 0.95); max stroke deviation 0.78 px (≤ 3). Side-by-side `out/test/logo-side.png` reviewed. Finding: the source's white strokes are transparent cut-outs; arrowhead extracted as a filled shape. |
| 1.3 | Brand motion kit | must | Kit gallery; byte-identical frame re-render | done (verified) | `src/primitives/*`, `src/kit/*`, `KitGallery` still `out/test/kit.png` shows logo draw-on + glow, DrawPath, Typewriter (JetBrains Mono), Camera25D, Grain, Vignette, Outfit label. Determinism: see 1.1 hash (Showreel includes grain). |
| 1.4 | Cue sheet and story data | must | Sum = 2400; grid check; style ids valid | done (verified) | `src/cues.ts`, `src/data/story.ts`; `bun scripts/check-cues.ts` → PASS frames=2400 cues=59 styles=6 providers=22 (style ids read from GitMind-Pro/package.json, pro flags per CommitStyleRenderer.ts). |
| 2.1 | Gray-box animatic | must | 40.00 s animatic; owner approves (GATE) | done (verified) | Animatic rendered (2400 f, contact sheet reviewed). Owner gate 2026-09-28: story/pacing accepted with note — "Some buttons are not designed well" (screenshot: blank green S4 button, detached faint `↑ type` callout). Note folded into Phase 3 as N1. |
| 3.1 | S1 Cold open | must | Stroke complete f 216 ±2 | done (verified) | `src/scenes/Opening.tsx` S1. Draw ends at `CUE.s1StrokeDone` = 3.6 s = f216 by construction; stills f90/f198 reviewed (sheet `out/review/a`). |
| 3.2 | S2 Chaos | must | Strikes on cue ±1 f; legible | done (verified) | S2 in a VS Code diff-editor look. Line reveals on `CUE.s2Lines` (8ths); strikes at bad-message cue + 0.25 s (half-beat); 3-frame local RGB-split at f360. Terminal overlap fixed after sheet a. Legible at f432. |
| 3.3 | S3 Particle assembly | must | Lobes resolve; render cost ≤ 2× kit | done (verified) | S3 canvas particle morph: 7 per glyph from the shared `story.ts` layout into seeded lobe samples; ignite, beam, wordmark + "for VS Code & Open VSX editors". Stills f516–f684 reviewed. Render cost: full film 144 s / 2400 f = 60 ms/f average (S3 not an outlier in the timed draft). |
| 3.4 | S4 Generate | must | Typing f 810–924 ±2; callouts by f 1020 | done (verified) | Rebuilt per N1/N2 (`scenes/Workbench.tsx`, `vscode/*`): the window assembles in 3D, the logo lands on the GitMind icon (`generate.svg`), tooltip "Generate GitMind Commit Message ⌘⌥G", ⌘⌥G keycaps, spinner twin, typing f810→f921 (3 f/char, 38 chars), TYPE/SCOPE/SUBJECT callouts from f990 with the view making room, labeled ✓ Commit split button, staged 3→0. Sheet b reviewed; overlaps fixed. |
| 3.5 | S5 Providers | must | 22 names = README; counter 22; local caption | done (verified) | Now the GitMind Settings Model tab (`SettingsScenes.tsx`): a 3D drum through all 22 README providers (check-cues PASS providers=22), lands on Ollama; caption "22 built-in AI providers."; "No API key needed · runs locally"; Local model discovery; Automatic Recovery (Pro) toggles. Sheets c/d/e reviewed; drum overlap fixed. |
| 3.6 | S6 Styles | must | Real formats; 4 PRO chips; ≥ 48 f holds | done (verified) | Commit Styles tab with real cards (names/descriptions from CommitStyleRenderer.ts:39-50); PRO badges on exactly the 4 Pro styles shown (+ FREE chip on Conventional); LCS character morph ≤ 12 f (0.2 s), holds 48 f; one state per 60 f from f1440. |
| 3.7 | S7 Pro burst | must | Cuts on 1860/1920/1980/2040 ±1; merge at 2159 | done (verified) | Command Palette with real command titles (package.json), then plates Draft Choices / Commit Health (0–100 scale) / Changelog, then graph. Cuts at f1860/1920/1980/2040 by construction (`CUE.s7Cuts`); final merge node at `CUE.s7Merge` = f2159. Branches synced to main after sheet e. |
| 3.8 | S8 Resolve | must | Lockup legible f 2250–2399; claims match README | done (verified) | Graph collapses → logo draw-on (bookend) → fill → lockup f2280+; tagline and Free on VS Code Marketplace / Open VSX / Pro one-time purchase from f2307; fine print "Illustrative product visuals…"; fade from f2385. Legible f2340 (sheet e). |
| 3.9 | Three.js hero shot | could | A/B'd, owner picks | pending | Not built: below cut line (could). The owner approved the 2D look at the 5.1 gate; revisit only on request. |
| 4.1 | Synth score and SFX | must | Prototype approved (GATE); 40.00 s WAV; deterministic hash | done (verified) | Owner approved the prototype 2026-09-28 ("Approve the sound"). Full `public/audio/score.wav` 40.00 s; deterministic (2 runs, SHA1 `9b80db2f…`). Re-run after any cue change. |
| 4.2 | Mix and master | must | -15 to -13 LUFS; TP ≤ -1 dBTP | done (verified) | `scripts/master.sh` two-pass loudnorm → `public/audio/score-master.wav`: I = −14.3 LUFS, true peak −3.0 dBTP (spec −15..−13, ≤ −1). The film now uses the master. |
| 4.3 | Stems | could | Stems sum to master | pending | Not built: below cut line (could). `synth.ts` can emit stems by writing the drums/music/fx buses separately if needed. |
| 5.1 | Finishing pass | must | Render time ≤ 2× A5 estimate; owner approves look (GATE) | done (verified) | Grain (seeded, 30 changes/s at any fps) + vignette; 240 fps + tmix motion blur (D1). Draft render 144 s @60 fps (A5 estimate ≈ 4–6 min → within 2×). Owner gate 2026-09-28: "Approve, render final" on `out/review/draft-v1-master.mp4`. |
| 5.2 | Final render and verify | must | 2400 f / 60 fps / 1080p; loudness; flash; contact sheet; claims | done (verified) | `scripts/render-final.sh v1` (240 fps master 813 s, total 939 s) → `out/final/v1/gitmind-showreel-1080p60.mp4` 34.1 MB. `scripts/verify-final.sh`: 2400 frames, 60/1 fps, 1920×1080, 40.000 s, BT.709 tv; I −14.3 LUFS, peak −2.8 dB; flash PASS (0 flashes, max step 0.033); frame-0 center RGB 12,15,24 vs #0B0F17 (no range lift); contact sheet `out/final/v1/contact.png` no broken frames. Claims: every on-screen claim traced to README / package.json / Settings source (plan §6b, check-cues PASS). |
| 5.3 | Web copy and poster | must | ≤ 16 MB; no macroblocking; TP after encode | done (verified) | `gitmind-showreel-web.mp4` 15.1 MiB (15.84 MB ≤ 16), +faststart; post-encode I −14.3 LUFS, peak −2.7 dB (≤ −1); 100% crops at 7.2/9.4/34.9 s show no macroblocking or banding. Poster `poster.png` from f2300 (lockup). Deviation: web copy made from the same motion-blurred intermediate with master grain (not a separate grain:"web" render) because the crops passed; the `grain` prop remains for a lighter re-encode if needed. |
| 5.4 | 6 s loop | should | Seamless loop | pending | Not built: below cut line (should). A seamless 6 s loop needs a purpose-made loop composition (S8 ends on a fade, so no natural loop point in S6→S8). |
| 5.5 | GIF preview | could | ≤ 5 MB, legible | done (verified) | `out/final/v1/preview.gif` 3.5 MiB (≤ 5 MB), 640 px, 12 fps, S4 typing + S6 styles; frames checked legible. |

## 2. Deviations
- D1 (routine, reversible): Motion blur uses the product-film kit's 240 fps subframe render plus ffmpeg `tmix`, not `CameraMotionBlur`. It gives the same outcome (blur on fast moves) with deterministic, bounded cost. Affects 5.1 and 5.2.
- D3 (storyboard, within change policy): S6 swaps Angular for jQuery, because Angular's format (`feat(auth): …`) is identical to Conventional and the morph would show no change. It is still 4 Pro styles. `story.ts` and `check-cues.ts` validate it.
- D4 (routine): The logo's white strokes are transparent cut-outs in the PNG; the film draws them as light (`#F8FAFC`) lines, matching how the logo reads on white.
- D2 (noted conflict): The product-film skill's quality floor discourages glows and particles. The owner explicitly asked for a showreel ("go all out") and approved a plan that includes them, so the plan wins. Glow and particles stay confined to S1, S3, and S8, in brand colors.

## 2b. Owner notes
- N1 (2.1 gate): Every UI element must be designed, never a blank placeholder: labeled buttons with icons, and callouts attached to their text. S4 is modeled on the real GitMind flow (`images/screenshots/demo-generate.gif`): the SCM title bar with the GitMind AI icon (`resources/dark/generate.svg`) and loading spinner, a message input with placeholder, a `✓ Commit` split button, and staged changes with a badge. Applies to S4, S6, S7, S8.

- N2 (owner, mid-Phase 3): Show the real Settings UI and much more VS Code integration. Resolved by storyboard v1.2 (plan §6b), approved by the owner with the Dark Modern theme. Tasks 3.2–3.8 now build to §6b. The music, grid, and 2.1 timing are unchanged.

## 3. QC results
- Full draft `../GitMind-Film/out/review/draft-v1.mp4`: 2400 f, 60/1 fps, 1920×1080, audio present; render 144 s (A5 holds: ≈ 10 min for a 240 fps master).
- Contact sheet (1 frame/beat) `out/review/draft-v1-contact.png` reviewed: something moves on every beat; no dead bar.
- Flash check `scripts/flash-check.py`: flashes=0, max frame luma step 0.038 → PASS.
- `bun scripts/check-cues.ts` → PASS after every change.

## 4. Unfinished items
- 3.9 Three.js hero shot (could): not built, below cut line; the 2D look was owner-approved.
- 4.3 Stems (could): not built, below cut line.
- 5.4 6 s loop (should): not built, below cut line; needs its own loop composition.
- No `must` task is unfinished. Nothing was committed: the `GitMind-Film` git repo named in plan Task 1.1 was not created. Committing and publishing wait on the owner's say-so, per the product-film rule "ask first before committing".

## 5. Handover summary
- Context: 40 s, 1080p60 GitMind showreel built in Remotion 4.0.529 at `../GitMind-Film/`. Storyboard v1.2 (plan §6b) puts S4–S7 inside VS Code and the real GitMind Settings UI (Dark Modern).
- Decisions: owner — 1080p60; code-synth audio (prototype approved); sibling folder; Remotion free tier; storyboard v1.2; Dark Modern; animatic accepted with N1; final look approved. Execution deviations D1–D4 above.
- State: done — all `must` tasks plus 5.5. Pending — 3.9, 4.3, 5.4 (below cut line). Blocked — none.
- Deliverables: `../GitMind-Film/out/final/v1/` → `gitmind-showreel-1080p60.mp4` (master, 34.1 MB), `gitmind-showreel-web.mp4` (15.1 MB), `poster.png`, `preview.gif`, `contact.png`.
- Remaining tasks: optional 5.4 loop (new composition in `src/Root.tsx`), 4.3 stems (`scripts/synth.ts` bus export), 3.9 (`@remotion/three`). Publishing to the website/README is outside this plan.
- Verification: re-run `bun scripts/check-cues.ts`, `bun scripts/synth.ts && scripts/master.sh`, `scripts/render-final.sh vN`, `scripts/verify-final.sh vN` after any change. Keep versions in `out/final/vN`.
- Risks and how to detect them early: claim drift if the product changes (re-run check-cues, which reads package.json); provider list changes (update `PROVIDERS` + the README count); render time ≈ 16 min per final.
