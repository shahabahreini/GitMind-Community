# Plan: GitMind Showreel Film (40 s motion graphics)

| Field | Value |
|---|---|
| Objective | Produce a 40-second, 1080p60, code-built motion graphics film about GitMind that reads as a top-tier motion designer's showreel while every claim stays true to the product. |
| Status | Reviewed and ready to execute |
| Version | 1.2 (owner storyboard revision 2026-09-28, during execution) |
| Created | 2026-09-28 |

## 1. Objective & Definition of Done
- Goal: A showreel-grade product film ("From diff to meaning") that shows GitMind turning messy code changes into clean commit history. It should show off craft through its range: stroke draw-ons, kinetic typography, particle morphs, match cuts, 2.5D camera moves, and an audio-synced edit.
- Done when:
  - `GitMind-Film/out/gitmind-showreel-1080p60.mp4` exists: H.264, 1920×1080, 60 fps, 2400 frames (40.00 s ±1 frame), with AAC stereo audio synthesized in code.
  - Every shot in the Section 6 storyboard is present and hits its beat marks within ±2 frames.
  - The final review (Task 5.2) passes: no garbled text, no off-brand color, no false claim, no dropped frames, a flash check, and loudness around -14 LUFS integrated with a true peak of -1 dBTP or lower (re-measured after every encode).
  - Poster frame (PNG) and a web-optimized copy (≤ 16 MB) are exported.
- Success measures: The owner watches it and judges it showreel quality. Every frame, read as a still, is a finished composition. The text is crisp and legible when paused.
- Must not happen:
  - Invented features or counts. Claims are limited to the README / `package.json`: 22 built-in providers, Copilot/Ollama/LM Studio need no key, local models keep code on the machine, Pro is a one-time purchase, and the style enums are `basic`, `conventional`, `conventional-no-scope`, `angular`, `ember`, `emojigit`, `gitmoji`, `semantic`, `commitizen`, `karma`, `linux`, `jquery` (`package.json:438-450`). Only `basic` and `conventional` are free; the other 10 are Pro (`src/webview/settings/components/renderers/CommitStyleRenderer.ts:39-50`).
  - Pro-only features shown as free.
  - Photosensitive hazards: more than 3 full-screen flashes in any 1-second window, or saturated-red flashes (WCAG 2.3.1).
  - Third-party brand logos. Providers appear as typeset names only.
  - Garbled AI-generated text, like in the existing Veo clip.
  - Any change to the extension build or VSIX.

## 2. Context & Constraints
- Background (observed):
  - GitMind is a VS Code extension, v6.3.0 (`package.json`). The README positions it as "From code changes to clear commits. Your AI, your commit style, inside VS Code."
  - The existing "advertisement" `GitMind-Community/images/GitMind-Animation.mp4` is actually 8 s, 1280×720, 24 fps, and Veo-generated with garbled text ("Git developjment"). The new film replaces the Veo look with precise, code-rendered type and motion.
  - Logo `images/logo.png` is a split brain: left lobe blue ≈ `#3682AE`, right lobe gold ≈ `#BF9525`, with white branch strokes that loop and merge into an upward arrow. The white strokes are the brand's signature motion device (a git branch that becomes an arrow).
  - Website tokens (`GitMind-Pro_Website/src/css/01-tokens.css`): accent emerald `#059669`, cyan `#0284c7`, text `#0f172a`, danger `#e11d48`, OK `#10b981`, warning `#f59e0b`. Fonts are Outfit (display) and JetBrains Mono (code).
  - No SVG logo exists anywhere (searched the GitMind-Pro, GitMind-Community, and Website repos). It must be vectorized.
  - Toolchain: Node v24.14.0 and ffmpeg 9.0.2 are installed. Remotion is not installed yet.
- Constraints: 1920×1080, 60 fps, 40 s. Audio is synthesized in code (no licensed music, no samples). The project lives in the sibling folder `../GitMind-Film/`, outside the extension repo.
- Stakeholders: the owner (Shahab) approves the creative and publishes to the website, README, and Marketplace listing.
- Open questions and decision points: none blocking. Defaults are recorded in Section 5.

## 3. Strategy
- Chosen path: Remotion (React + TypeScript), with every visual authored as SVG/DOM/Canvas and driven by frame-exact springs and eases on a 120 BPM beat grid. A deterministic Node script synthesizes the score and SFX into a WAV, from the same cue sheet the visuals read. Follow the `product-film` skill workflow for design discovery, review loops, and the verified render.
- Why it wins: Frame-exact and deterministic, so re-renders match. Text is real type, so it's always crisp. One cue sheet drives both picture and sound, so sync can't drift. TypeScript is already the owner's stack.
- Alternatives rejected:
  - After Effects: not reproducible or reviewable in code, and not available here.
  - AI video generation: garbled text; this is the exact problem with the current ad.
  - Pure CSS/HTML screen capture: dropped frames, no frame-exact audio sync.
  - Three.js full 3D: heavy for 40 s. Use 2.5D (CSS perspective + parallax layers) instead, with one optional Three.js shot below the cut line.

### Timing grid (the backbone)
120 BPM at 60 fps gives beat = 30 f, bar = 120 f, 40 s = 20 bars = 2400 f. All cuts land on beats; accents land on half-beats (15 f).

## 4. Scope
- New:
  - The `GitMind-Film` Remotion project.
  - A vector logo rebuild.
  - A brand motion kit (tokens, easing curves, reusable primitives).
  - 8 scenes, a code-synthesized score and SFX, and the final renders.
- Updates to existing: none required. The README/website embed is a follow-up, outside this plan.
- Explicitly out of scope:
  - 9:16 vertical and 4K versions (the project stays aspect-aware so these can be added later).
  - Voice-over and localization.
  - Publishing to the Marketplace or website.
  - Replacing the existing 8 s clip in the READMEs.
- Change policy: Storyboard changes that keep the 20-bar grid are allowed during Phase 3. Changing length, fps, or aspect ratio requires re-running Task 1.4 and the audio pass.
- Cut line: every `must` task is above it. Below it: 3.9 (Three.js hero shot, could), 4.3 (stems and alternate mix, could), 5.4 (6 s loop cut-down, should), 5.5 (GIF preview, could).

## 5. Assumptions
| # | Assumption | Validated by |
|---|---|---|
| A1 | The owner qualifies for Remotion's free license (individual or company of 3 or fewer people). | **Confirmed by owner 2026-09-28.** |
| A2 | The logo can be rebuilt faithfully: lobes by tracing, white strokes as hand-authored paths. | Task 1.2: overlay the rebuilt SVG on the PNG, with IoU ≥ 0.95 on the lobe masks. |
| A3 | Outfit and JetBrains Mono (OFL) can be bundled into the render. | Both are OFL. Vendor the WOFF2 files into `public/fonts/` and load them with `@remotion/fonts`, so renders need no network. |
| A4 | Code-synthesized audio can sound produced, not like a toy. | Task 4.1 prototype: a 1-bar loop gets owner approval before the full score. |
| A5 | Rendering 2400 frames at 1080p runs in reasonable time locally. | Task 1.1 test render of 120 f. Extrapolate, then set concurrency. |
| A6 | Stylized, built-in-code VS Code chrome (not a screenshot) is acceptable. | Default: a stylized SCM panel, labeled "illustrative" in the end-card fine print, matching README precedent. Revisit if the owner wants a real capture. |
| A7 | Provider names as plain type do not need logo permissions. | Names only, no marks. Nominative use matches the README table. |

## 6. Storyboard (bars at 120 BPM; f = frame at 60 fps)

| # | Bars / frames | Shot | Showreel technique | Truth anchor |
|---|---|---|---|---|
| S1 | 1–2 · 0–239 | Cold open. Black. One white hairline draws on with a traveling glow head, forks into two branches (git branch), curls into the logo's S-loops, then freezes as a silhouette. | Path draw-on with variable stroke width, glow trail, eased speed ramp | The logo's own strokes |
| S2 | 3–4 · 240–479 | Chaos. Diff lines (`+`/`-`, red/green) cascade in on each beat. Bad commit messages ("wip", "fix", "asdf", "final_final_v2") flicker in and are struck through on half-beats. | Kinetic typography, staggered masks, smash-strikethroughs, RGB-split glitch on the downbeat | The problem statement |
| S3 | 5–6 · 480–719 | Assembly. Every diff glyph becomes a particle and flies into two lobes (blue/gold). The S1 strokes ignite and the arrow fires upward. The "GitMind" wordmark resolves in Outfit. | Glyph-to-particle morph (~1,500 particles, seeded), anticipation → overshoot spring, light sweep | The logo |
| S4 | 7–9 · 720–1079 | Generate. A 2.5D camera push onto a stylized VS Code Source Control panel. Cursor click with a ripple (f 780). A commit message types itself, `feat(auth): add OAuth2 PKCE login flow`, at 3 f/char (38 chars ≈ 114 f, f 810–924). Then each token (type / scope / subject) lifts and gets a callout label. | Camera dolly with parallax layers, typewriter with a synthesized tick per character (not locked to hats), token explode-and-label | Core feature; Conventional is free |
| S5 | 10–12 · 1080–1439 | Your AI. Provider names orbit in 3 perspective rings. A counter ticks 0→22 on the beat. The rings collapse onto "Ollama · LM Studio", a shield closes, and a caption reads "Runs locally. Your code stays on your machine." | Orbital typography with depth blur, count-up, match-cut ring→shield | 22 providers; local models |
| S6 | 13–15 · 1440–1799 | Your style. The same story diff produces 6 states, 60 f (2 beats) each: Conventional (free) → Gitmoji (PRO) → Angular (PRO) → Linux Kernel (PRO) → Ember (PRO) → Conventional (free). Each morph takes ≤ 12 f and the message then holds ≥ 48 f so it can be read. Only the characters that change animate (shared characters stay put). "PRO" chips appear on the 4 Pro styles. | Character-level diff morph (FLIP), whip-pan transitions on the bar downbeats | `CommitStyleRenderer.ts:39-50` |
| S7 | 16–18 · 1800–2159 | Pro burst. Full-frame hard cuts, 60 f each: (a) f 1800–1859 three draft cards fan out, (b) f 1860–1919 a Commit Health gauge (0–100, the real score range) sweeps to 92, (c) f 1920–1979 a changelog assembles from version-grouped commits. Then f 1980–2039 a three-panel split screen recaps a/b/c, and f 2040–2159 the panels collapse into a clean git graph where branches merge. | Split-screen choreography, gauge sweep, list build, graph merge | README Pro list |
| S8 | 19–20 · 2160–2399 | Resolve. The graph lines converge and become the logo's white strokes (match cut back to S1), and the lobes fill. Lockup: "GitMind — Your AI. Your commit style." Sub-line: "Free on VS Code Marketplace & Open VSX · Pro: one-time purchase". Hold for 1.25 s, then fade out on the final hit. | Bookend match cut, restrained hold (negative space as a skill) | README tagline and pricing |

Color script: S1–S2 dark and desaturated with red/green diff accents. S3 introduces blue/gold. S4–S6 use a neutral dark UI with emerald `#059669` highlights. S7 is the brightest and highest-energy. S8 returns to black with the full-color logo.

### 6b. Storyboard v1.2 (owner-approved 2026-09-28, supersedes the S2–S8 content above; grid, windows, and music unchanged)
Reason: the owner said "I cannot see the real Settings UI design in the video to show its features and also Compatibility with VS Code is missing much! Think deeper", plus the 2.1 gate note on undesigned buttons.
- S2: chaos in a VS Code diff-editor look.
- S3: + "for VS Code & Open VSX editors" (README: VS Code 1.101+, VSCodium and other Open VSX editors).
- S4: the logo flies into a full VS Code window (Dark Modern): title bar, activity bar (SCM badge), Source Control with the GitMind AI icon (`resources/dark/generate.svg`), ⌘⌥G keycap (`package.json` keybinding `cmd+alt+g`), a frame-driven twin of the `loading-spin.svg` spinner, the message typed into the input, a labeled `✓ Commit` split button, staged changes, and a status bar.
- S5: the GitMind Settings webview in an editor tab. Model Settings tab and Current Configuration card. The provider dropdown fans out all 22 providers, then selects Ollama: "No API key needed · runs locally", local model discovery, then Automatic Recovery (Pro) toggles on.
- S6: the Commit Styles tab with real style cards and PRO badges (`#6366f1→#a855f7`). The selection check hops Conventional→Gitmoji→Ember→Linux Kernel→jQuery→Conventional while the live message morphs.
- S7: Command Palette "GitMind:" showing real Pro commands (Draft Choices, Review Changes, Generate Changelog, Compose Atomic Commit Series), then Draft Choices, Commit Health (0–100), Changelog, and the graph merge.
- S8: graph → logo; lockup, Marketplace & Open VSX badges, "Pro: one-time purchase".
- Theme: Settings rendered in VS Code Dark Modern (the webview follows `--vscode-*` theme variables; `src/webview/settings/styles`).

## 7. Phases & Tasks

### Phase 1: Foundation & de-risk
Checkpoint: the rebuilt logo passes the overlay check, a 120-frame test render works, and the cue sheet exists. Stop and replan if A1, A2, or A5 fails.

**Task 1.1 — Scaffold the Remotion project**
- What: A Remotion TS project with the `GitMindShowreel` composition (1920×1080, 60 fps, 2400 frames).
- How: `npx create-video@latest` (blank TS template). Add `@remotion/google-fonts`, `@remotion/paths`, `@remotion/noise`. Commit to a fresh git repo.
- Where: `../GitMind-Film/` (`src/Root.tsx`, `src/Showreel.tsx`)
- Depends on: A1 confirmed
- Skills: product-film
- Parallel: no
- Effort: S
- Priority: must
- Done when: `npx remotion studio` shows the composition, and `npx remotion render --frames=0-119` outputs an MP4. Render time is recorded for A5.

**Task 1.2 — Vector logo rebuild**
- What: A layered `logo.svg` with `lobeLeft`, `lobeRight`, and `strokes` (the white strokes as open centerline paths suitable for draw-on).
- How: Trace the lobes from color masks of `images/logo.png` (potrace, or hand-authored Béziers if tracing is rough). Hand-author the white strokes as centerlines with stroke width, not outlines.
- Where: `../GitMind-Film/src/assets/logo.svg` and `src/brand/Logo.tsx`
- Depends on: 1.1
- Skills: None
- Parallel: yes (with 1.3, 1.4)
- Effort: M
- Priority: must
- Done when: a difference overlay against the PNG at 1024 px shows lobe IoU ≥ 0.95 and stroke deviation ≤ 3 px, and `evolvePath` animates the strokes from 0→1 cleanly.

**Task 1.3 — Brand motion kit**
- What: Tokens and primitives:
  - Colors: blue `#3682AE`, gold `#BF9525`, emerald `#059669`, cyan `#0284c7`, diff red `#e11d48`, diff green `#10b981`, ink `#0B0F17`.
  - Fonts: Outfit, JetBrains Mono.
  - Easings: `expoOut`, `backOut(1.4)`, a snappy spring preset.
  - Primitives: `<DrawPath>`, `<KineticLine>`, `<Typewriter>`, `<Particles seed>`, `<Camera25D>`, `<Grain>`, `<Glow>`.
- How: Pure functions of `useCurrentFrame()`, with no `Math.random` (seeded noise only).
- Where: `../GitMind-Film/src/brand/`, `src/primitives/`
- Depends on: 1.1
- Skills: product-film
- Parallel: yes
- Effort: M
- Priority: must
- Done when: a `Kit` gallery composition shows every primitive, and rendering the same frame twice produces byte-identical PNGs.

**Task 1.4 — Cue sheet and story data (single source of timing and content)**
- What: A `cues.ts` exporting BPM, frames-per-beat, the S1–S8 frame ranges, and every named hit (cuts, accents, typewriter ticks, the counter, whooshes). Also a `story.ts` holding the one diff used in S2, S4, and S6, its per-style messages, and a deterministic glyph layout function shared by S2 and S3.
- How: Typed constants derived from the Section 6 grid. Visuals import them, and the audio script (4.1) imports the same file.
- Where: `../GitMind-Film/src/cues.ts`
- Depends on: 1.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: scene durations sum to exactly 2400. A unit check asserts that every structural cue (cuts, impacts, whooshes) sits on the beat or half-beat grid; typewriter ticks are exempt. A second check asserts that every `story.ts` style sample uses a real style id from `package.json`.

### Phase 2: Animatic
Checkpoint: the owner approves a full-length gray-box animatic with a click track. This is the last cheap point to change the story.

**Task 2.1 — Gray-box animatic**
- What: All 8 scenes as blocking: placeholder shapes, final timing, and camera moves, with a metronome audio track.
- How: `<Series>` of scene components reading `cues.ts`. The click comes from 4.1's generator in "click only" mode, or an ffmpeg `sine` fallback.
- Where: `../GitMind-Film/src/scenes/S1…S8.tsx`
- Depends on: 1.3, 1.4
- Skills: product-film
- Parallel: no
- Effort: M
- Priority: must
- Done when: `out/animatic.mp4` (40.00 s) plays, and the owner approves the pacing or gives notes that are applied.

### Phase 3: Scene build (final look)
Checkpoint: each scene passes the per-scene review (Section 8) before it counts as done.

**Task 3.1 — S1 Cold open draw-on**
- What: The draw-on with a glow head and fork, as in the storyboard.
- How: `<DrawPath>` on `strokes`. Tapered stroke via a dash-offset mask. The glow head is a blurred circle positioned with `getPointAtLength`.
- Where: `src/scenes/S1ColdOpen.tsx`
- Depends on: 1.2, 2.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: the stroke completes on f 216 ±2, and no aliasing is visible at 100% zoom.

**Task 3.2 — S2 Chaos kinetic type**
- What: The diff cascade and bad-message strikethroughs.
- How: `<KineticLine>` with mask reveals, strikes on half-beats, and a 3-frame RGB-split on the bar-4 downbeat. The glitch is a local offset only, not a full-frame luminance flash. Glyph positions come from `story.ts` so S3 can reuse them.
- Where: `src/scenes/S2Chaos.tsx`
- Depends on: 2.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: every strike lands on its cue ±1 f, and all text is legible when paused.

**Task 3.3 — S3 Particle assembly**
- What: The glyph-to-particle morph into the lobes and the arrow fire.
- How: Canvas layer, redrawn synchronously per frame. Sample target points from the lobe paths. Source points come from the shared `story.ts` glyph layout (not measured from the S2 DOM). Seeded easing per particle, with staggered delays.
- Where: `src/scenes/S3Assembly.tsx`
- Depends on: 1.2, 3.2
- Skills: None
- Parallel: no
- Effort: L
- Priority: must
- Done when: particles resolve into lobes that match the logo, and a 60 f render averages ≤ 2× the kit frame time.

**Task 3.4 — S4 Generate in SCM panel**
- What: The stylized VS Code SCM panel, the 2.5D push, the typewriter, and the token callouts.
- How: DOM layers inside `<Camera25D>`. `<Typewriter>` ticks on hi-hat cues. Tokens lift with the spring preset, and callouts draw on.
- Where: `src/scenes/S4Generate.tsx`
- Depends on: 2.1
- Skills: product-film
- Parallel: yes
- Effort: L
- Priority: must
- Done when: typing runs f 810–924 ±2, the callouts read "type / scope / subject" by f 1020, and there are no real third-party UI screenshots or Microsoft logos.

**Task 3.5 — S5 Provider orbit**
- What: 3 rings of provider names (the exact 22 from the README table), a 0→22 counter, and the local-models shield.
- How: CSS 3D rings with depth-based blur and opacity. The counter steps on the beat. Match cut from ring to shield.
- Where: `src/scenes/S5Providers.tsx`
- Depends on: 2.1
- Skills: None
- Parallel: yes
- Effort: M
- Priority: must
- Done when: the list matches the README table exactly (22 names, excluding Custom API), the counter ends at 22, and the local caption is correct.

**Task 3.6 — S6 Style morph**
- What: One diff shown in 6 style renderings (Conventional, Gitmoji, Angular, Linux Kernel, Ember, Conventional), with per-character FLIP morphs and PRO chips.
- How: Precompute character alignments (a simple LCS) between consecutive messages. Shared characters glide, new ones pop in, removed ones fall away. Whip-pan blur on downbeats.
- Where: `src/scenes/S6Styles.tsx`, `src/data/styleSamples.ts`
- Depends on: 2.1
- Skills: None
- Parallel: yes
- Effort: L
- Priority: must
- Done when: each sample matches the example format for its style in `CommitStyleRenderer.ts`, PRO chips appear on exactly the 4 Pro styles, and each state holds for ≥ 48 f fully legible.

**Task 3.7 — S7 Pro burst**
- What: The draft fan, the Health gauge, the changelog build, and the collapse into the git graph.
- How: Three `<Sequence>` panels with hard cuts every 60 f. The graph uses `<DrawPath>` for branches and merges.
- Where: `src/scenes/S7Pro.tsx`
- Depends on: 2.1
- Skills: None
- Parallel: yes
- Effort: L
- Priority: must
- Done when: every feature shown is in the README Pro list, the gauge label matches the product ("Commit Health", 0–100), cuts land on f 1860/1920/1980/2040 ±1, and the graph's final merge lands at f 2159.

**Task 3.8 — S8 Resolve and lockup**
- What: The match cut from graph to logo strokes, the lobe fill, the tagline, the availability line, and the fine print ("Illustrative product visuals").
- How: Reuse S1's strokes for the bookend. Type the lockup in Outfit and let it hold.
- Where: `src/scenes/S8Resolve.tsx`
- Depends on: 3.1, 3.7
- Skills: None
- Parallel: no
- Effort: M
- Priority: must
- Done when: the lockup is legible from f 2250 to f 2399, and the claims match the README wording.

**Task 3.9 — Optional Three.js hero shot (below cut line)**
- What: Replace the S3 lobes with an extruded 3D logo and a rim light.
- How: `@remotion/three`.
- Where: `src/scenes/S3Assembly.tsx`
- Depends on: 3.3
- Skills: None
- Parallel: no
- Effort: L
- Priority: could
- Done when: it's A/B'd against the 2D version and the owner picks one.

### Phase 4: Sound
Checkpoint: the score and SFX are approved against the animatic, and loudness is within spec.

**Task 4.1 — Code-synthesized score and SFX**
- What: A deterministic WAV at 48 kHz stereo:
  - 120 BPM pulse: sub kick, filtered bass, hats, clap on 2/4.
  - Riser into S3.
  - Impacts on S3, S6, and S8.
  - Whooshes on whip-pans.
  - Tick SFX on typewriter cues.
  - Swell and tail on the final hit.
- How: A Node script (`scripts/synth.ts`). Oscillators, noise, envelopes, and a simple Schroeder reverb written directly to Float32 PCM, with a seeded RNG. It imports `cues.ts`, so sync is guaranteed. Prototype a 1-bar loop first (validates A4).
- Where: `../GitMind-Film/scripts/synth.ts` → `public/audio/score.wav`
- Depends on: 1.4
- Skills: None
- Parallel: yes (with Phase 3)
- Effort: L
- Priority: must
- Done when: the owner approves the 1-bar prototype and the full 40.00 s WAV is generated, and two runs produce identical output hashes.

**Task 4.2 — Mix and master**
- What: Loudness normalization and limiting.
- How: `ffmpeg -af loudnorm=I=-14:TP=-1:LRA=7` (two-pass), then verify with `ebur128`.
- Where: `scripts/master.sh` → `public/audio/score-master.wav`
- Depends on: 4.1
- Skills: None
- Parallel: no
- Effort: S
- Priority: must
- Done when: the measured integrated loudness is between -15 and -13 LUFS and the true peak is -1 dBTP or lower.

**Task 4.3 — Stems / alternate mix (below cut line)**
- What: A music-only mix and an SFX-only stem.
- How: Flags in `synth.ts`.
- Where: `public/audio/`
- Depends on: 4.1
- Skills: None
- Parallel: yes
- Effort: S
- Priority: could
- Done when: both files render, and summing them matches the master within -60 dB residual.

### Phase 5: Polish, render, verify
Checkpoint: Task 5.2 passes, and then the deliverables are exported.

**Task 5.1 — Finishing pass**
- What: Global film grain, a subtle vignette, motion blur on fast moves, and color-script consistency.
- How: `<Grain>` overlay with seeded noise and a `grain` prop (`master` | `web` | `off`). Use `@remotion/motion-blur` (`CameraMotionBlur`, ≤ 8 samples) only inside the whip frame ranges of S4, S6, and S7, never across a whole scene, because it multiplies render cost by the sample count.
- Where: `src/Showreel.tsx`
- Depends on: 3.1–3.8, 4.2
- Skills: product-film
- Parallel: no
- Effort: M
- Priority: must
- Done when: the full-length render time stays within 2× the A5 estimate, and the owner approves the look.

**Task 5.2 — Final render and verification**
- What: The master render plus automated checks.
- How:
  - Render: `npx remotion render GitMindShowreel out/gitmind-showreel-1080p60.mp4 --codec=h264 --crf=16`.
  - Probe with `ffprobe` for duration, frames, and fps.
  - Extract a contact sheet of 1 frame per beat and a per-scene stills check.
  - Run `ebur128`.
  - Flash check: a per-frame mean luminance script via ffmpeg `signalstats`, counting swings over 20% of full scale; at most 3 per any 60-frame window.
  - Watch the full film at 100% for legibility and claim accuracy.
- Where: `../GitMind-Film/out/`
- Depends on: 5.1
- Skills: product-film, verify-and-stop
- Parallel: no
- Effort: M
- Priority: must
- Done when: 2400 frames, 60/1 fps, 1920×1080, audio present, loudness in spec, the flash check passes, the contact sheet has no broken frames, and the claim checklist (Section 1) passes.

**Task 5.3 — Web copy and poster**
- What: A web MP4 (≤ 16 MB, `+faststart`) and a poster PNG from S8 f 2300.
- How: A separate render with `grain: "web"` (grain at ~40% strength, because full grain at ≈ 3 Mbps turns into macroblocking), then ffmpeg two-pass H.264 plus `remotion still`. Re-run `ebur128` on the encoded file.
- Where: `out/gitmind-showreel-web.mp4`, `out/poster.png`
- Depends on: 5.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: must
- Done when: both files exist, the web file is ≤ 16 MB, there's no visible banding or macroblocking in S2/S3/S7 stills, and the true peak after encoding is still -1 dBTP or lower.

**Task 5.4 — 6 s loop cut-down (below cut line)**
- What: A seamless S6 → S8 loop for the landing page hero.
- How: A new composition reusing the scenes.
- Where: `src/Root.tsx`
- Depends on: 5.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: should
- Done when: the loop point has no visible jump.

**Task 5.5 — README GIF preview (below cut line)**
- What: An 800 px GIF of S4 + S6.
- How: ffmpeg palettegen/paletteuse.
- Where: `out/preview.gif`
- Depends on: 5.2
- Skills: None
- Parallel: yes
- Effort: S
- Priority: could
- Done when: ≤ 5 MB and legible.

## 8. Risks & Countermeasures
| Risk | Impact | Countermeasure |
|---|---|---|
| Logo rebuild looks off-brand | Undermines the whole film | Task 1.2 overlay gate before any scene work; hand-author the strokes |
| Synth audio sounds cheap | Kills the "showreel" feel | Approve the 1-bar prototype first; layer saturation, sidechain ducking, and reverb; fall back to minimal SFX-only over silence if not approved |
| Particle scene too slow to render | Long iterations | Canvas instead of DOM, capped particle count, cached target sampling, render S3 in isolation |
| Claims drift from the product | Misleading ad | Truth-anchor column plus the claim checklist in 5.2; data files cite README lines |
| Overstuffed edit (too many ideas in 40 s) | Reads as noise, not craft | Animatic gate (2.1); each scene has one idea; S8 holds on negative space |
| Non-determinism (`Math.random`, dates) | Flicker between chunks | Seeded noise only; the byte-identical frame check in 1.3 |
| Remotion license mismatch | Legal | A1 confirmed by owner 2026-09-28; re-check if the team grows past 3 |
| Flashing or strobing during the glitch and Pro burst | Viewer harm; platform rejection | No full-frame flashes; flash check in 5.2 |
| Motion blur blows up render time | Missed iteration loops | Limited to whip ranges, ≤ 8 samples; check against the A5 budget in 5.1 |
| Web encode artifacts from grain | Cheap-looking hero video | `grain` prop, separate web render, stills check in 5.3 |
| Font loading race causes fallback-font frames | Wrong type in the render | `@remotion/google-fonts` `loadFont` + `waitUntilDone`; check S4 frames in 5.2 |

## 9. Verification & Replanning
- Per task: its "Done when" check, plus a per-scene still review at 3 frames (in, mid, out) at 100% for legibility, brand color, and alignment to cues.
- Overall: Task 5.2's automated probes, a contact sheet, a loudness report, a claim checklist, and an owner viewing.
- Replan when:
  - A1, A2, A4, or A5 fails.
  - The animatic is rejected on story (not just pacing).
  - The owner changes length, fps, or aspect ratio.
  - A full render exceeds 3× the A5 estimate.

## 10. Traceability
| Objective | Covered by tasks |
|---|---|
| 40 s, 1080p60 master | 1.1, 1.4, 5.2 |
| Showreel-grade craft range | 1.3, 3.1–3.8, 5.1 (3.9 optional) |
| Brand fidelity | 1.2, 1.3, 3.3, 3.8 |
| Truthful claims | 3.5, 3.6, 3.7, 3.8, 5.2 |
| Code-synthesized sound, synced | 1.4, 4.1, 4.2 |
| Web-ready deliverables | 5.3 (5.4, 5.5 optional) |
| No impact on the extension repo | 1.1 (sibling folder) |

## 11. Handover Summary
- Context: GitMind v6.3.0 is a VS Code AI commit message extension. The current promo is an 8 s Veo clip with garbled text. The brand is a blue/gold split brain with white branch-to-arrow strokes, plus emerald accents, Outfit, and JetBrains Mono.
- Decisions (owner, 2026-09-28): 16:9 1080p60; code-synthesized score and SFX; project in sibling `../GitMind-Film/`; Remotion free tier confirmed (A1). Defaults: Remotion, 120 BPM grid, stylized (not captured) UI, provider names without logos.
- State: done — research, plan, and expert review. Pending — all tasks. Blocked — none.
- Remaining tasks: Phases 1–5 above. Each task lists what, how, and where.
- Verification: the Section 1 Done-when list, and the 5.2 automated checks plus owner review.
- Risks and how to detect them early: logo fidelity (1.2 overlay), audio quality (4.1 prototype), render cost (1.1 test render), story overload (2.1 animatic).

## 12. Review appendix
- Findings (fixed in place):
  1. **ESLint listed as a commit style.** It isn't one; it came from the ESLint dev dependency. The real enum is at `package.json:438-450`. This would have been a false claim on screen. S6 now uses Conventional, Gitmoji, Angular, Linux Kernel, Ember. — proven
  2. **Free/Pro split was vague.** Only `basic` and `conventional` are free (`CommitStyleRenderer.ts:39-50`). PRO chips are now on exactly 4 styles. — proven
  3. **S6 timing couldn't work.** "One change per beat" with 6 states over 12 beats didn't add up, and 1 beat is too short to read a commit message. Now 60 f per state, with ≤ 12 f morph and ≥ 48 f hold. — proven
  4. **S4 typewriter overran its shot.** Typing on 8th-note hats (15 f) × 38 chars = 570 f, but the shot is 360 f. Now 3 f/char with per-character ticks. — proven
  5. **S7 was ambiguous.** "Split screen" and "hard cut every 2 beats" contradicted each other. It now has an explicit frame timeline. — proven
  6. **S3 relied on DOM measurements from another scene.** Positions from S2's DOM aren't available inside S3's sequence. Now a shared deterministic layout in `story.ts`, and one story diff runs through S2, S4, and S6. — likely
  7. **Photosensitivity risk.** The glitch and fast cuts had no flash limit. Added a must-not and an automated flash check. — possible, high severity
  8. **Web copy target too small for grain.** ≤ 12 MB at 60 fps with grain would macroblock. Now a separate web render with lighter grain, ≤ 16 MB, and a stills check. — likely
  9. **Motion blur cost uncapped.** `CameraMotionBlur` multiplies render cost by its sample count. Now limited to whip ranges with ≤ 8 samples. — likely
  10. **True peak after encoding.** AAC encoding can push peaks over -1 dBTP. Now re-measured after every encode. — likely
  11. **Fonts fetched over the network at render time.** Font files are now vendored locally. — possible
- Decisions: A1 is confirmed (Remotion free tier). Storyboard, grid, and scope are unchanged apart from the fixes above. Task IDs are unchanged; 1.4 was broadened to include `story.ts` (reason: findings 6 and 1).
- Remaining risks: synth audio quality (gated by the 4.1 prototype), logo rebuild fidelity (gated by 1.2), particle render cost (1.1/3.3), and whether the creative lands as a showreel (gated by the 2.1 animatic). None are blockers.
- Applicable checks and evidence:
  - Claims checked against `README.md`, `package.json:438-450`, `CommitStyleRenderer.ts:39-50`, and `src/commit-intelligence/validation.ts:71-93` (Commit Health 0–100).
  - The 22-provider count was checked against the README table.
  - Frame arithmetic re-verified: S1–S8 sum to 2400.
  - This is a reviewed plan; nothing has been rendered or tested yet.
- Non-applicable checks and reasons: deployment/rollback of production systems, security/data handling, and concurrency don't apply (standalone offline video project, no user data, no change to the extension). Rollback is simply git in `GitMind-Film`.
- Blockers and resolution needed: none.
