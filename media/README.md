# GitMind promotional media

A restrained, silent-friendly product advertisement and provider artwork for the community hub, Marketplace listing, and social sharing. These are designed illustrations, not a recording of the extension interface.

## Contents

- [Assets](#assets)
- [Rebuild](#rebuild)
- [Video story](#video-story)
- [Brand sources](#brand-sources)
- [Maintenance](#maintenance)

## Assets

| Asset                                                            | Purpose                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [GitMind-Animation.mp4](../images/GitMind-Animation.mp4)         | 22-second, 1920 × 1080, 30 fps H.264 advertisement; fast-start playback |
| [hero-generate.gif](../images/screenshots/hero-generate.gif)     | 1200 px, 12 fps animation for GitHub and Marketplace README rendering   |
| [hero-generate.png](../images/screenshots/hero-generate.png)     | Static alternative for readers who prefer no motion                     |
| [hero-generate.svg](../images/screenshots/hero-generate.svg)     | Editable advertisement poster                                           |
| [all_providers.png](../images/all_providers.png)                 | Full provider artwork, 1920 × 1080                                      |
| [all_providers_GitMind.jpg](../images/all_providers_GitMind.jpg) | Compatibility replacement for the previous JPEG                         |
| [all_providers_GitMind.svg](../images/all_providers_GitMind.svg) | Editable provider artwork with embedded marks                           |
| [Wiki artwork](../wiki/assets/all-providers.png)                 | Same provider image at the existing wiki path                           |

The existing `hero-generate` filename is retained for compatibility with the extension listing. Its content is an advertisement, not a live demo. The video contains no audio and communicates through visible text. GitHub GIF embeds cannot honor reduced-motion preferences, so the README includes a static alternative and a separate MP4 link.

## Rebuild

Use Node.js 22 or newer, FFmpeg with `libx264`, and the Lato and DejaVu Sans Mono fonts (the common Linux packages are `fonts-lato` and `fonts-dejavu-core`).

```sh
cd media
npm ci
npm run build
npm run verify
```

Render only the provider graphic or preview stills:

```sh
npm run build -- --providers-only
npm run build -- --stills
```

The build is deterministic, uses bundled assets, and needs no browser, extension instance, AI service, API key, or network connection after dependency installation. It refreshes the wiki image automatically. Preview frames are written to the ignored `.render/` directory. Do not edit exported PNG/JPEG/GIF/MP4 files directly; update `src/` and rebuild.

To also compare provider IDs with an extension checkout:

```sh
npm run verify -- /path/to/GitMind-Pro/package.json
```

## Video story

| Time          | Message                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0–8 seconds   | A staged quantity-calculation fix becomes a clear Conventional Commit; review stays with the developer.                                |
| 8–13 seconds  | Choose among 22 built-in providers, including GitHub Copilot and local Ollama / LM Studio; Custom API is Pro.                          |
| 13–18 seconds | Structured messages make Git history easier to understand. Basic and Conventional styles are distinguished from additional Pro styles. |
| 18–22 seconds | Install GitMind for VS Code through the Marketplace or Open VSX.                                                                       |

Code, commit messages, and history are illustrative. The animation is explanatory and makes no inference-speed claim. Product facts were checked against the GitMind 6.2.0 source checkout on September 22, 2026. No unreleased model names, performance numbers, or subscription prices appear in the assets.

## Brand sources

Names and marks identify supported integrations; they do not imply endorsement. Bundled third-party marks remain the property of their owners. The provider catalog uses **GitHub Copilot**, not Microsoft Copilot; **xAI Grok** and **Groq** are separate entries. Azure OpenAI uses the Azure platform mark, and Cloudflare is explicitly labeled Workers AI / AI Gateway.

The following marks were obtained directly from official assets:

| Provider   | Asset source                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| OpenRouter | [Brand assets](https://openrouter.ai/brand), `brand/logos/transparent/glyph/svg/glyph-cloud.svg`                         |
| MiniMax    | [Official brand book](https://www.minimax.io/brand-vi), `MiniMax_Logo_Asset.zip` → `png/Horizontal/BrandColor_White.png` |
| LM Studio  | [Brand guidelines](https://lmstudio.ai/brand), `assets/marketing/brand/download/logos/lm-studio-icon-color.svg`          |
| Z.ai       | [Official site](https://z.ai), [official logo SVG](https://z-cdn.chatglm.cn/z-ai/static/logo.svg)                        |

The remaining vector marks are from [Lobe Icons](https://github.com/lobehub/lobe-icons), package `@lobehub/icons-static-svg` **1.95.1**. They are curated vector artwork, not generated logo approximations. The original icon filenames and SHA-256 hashes are recorded in [asset-sources.json](assets/providers/asset-sources.json); the package's [MIT license](assets/providers/LOBE-ICONS-LICENSE) is retained. Shapes and aspect ratios are preserved. Monochrome `currentColor` marks are rendered in a light foreground for the dark background; supplied multicolor artwork is preserved.

## Maintenance

- `src/providers.mjs`: provider names, order, and short setup captions.
- `src/design.mjs`: shared vector helpers and provider image layout.
- `src/advertisement.mjs`: copy, motion, timings, and the illustrative video scenes.
- `src/build.mjs`: image, poster, MP4, GIF, and wiki exports.
- `src/verify.mjs`: provider coverage, asset integrity, media decoding, and local README links.

When providers or brands change, refresh the bundled source asset and provenance record before rebuilding. Update the all-provider image, video claims, README copy, and corresponding extension listing together. Review preview frames at 960 px and watch the exported MP4 before publishing. No release or publication is performed by this build.
