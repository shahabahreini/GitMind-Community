import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import sharp from "sharp";
import { providerGraphic, W, H } from "./design.mjs";
import { adFrame, loadMarks, DURATION } from "./advertisement.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const media = join(root, "media");
const images = join(root, "images");
const render = join(media, ".render");
await mkdir(render, { recursive: true });
await mkdir(join(images, "screenshots"), { recursive: true });
const svg = providerGraphic(join(media, "assets/providers"));
await writeFile(join(images, "all_providers_GitMind.svg"), svg);
await sharp(Buffer.from(svg)).png().toFile(join(images, "all_providers.png"));
await sharp(Buffer.from(svg))
  .jpeg({ quality: 94, chromaSubsampling: "4:4:4" })
  .toFile(join(images, "all_providers_GitMind.jpg"));
await copyFile(
  join(images, "all_providers.png"),
  join(root, "wiki/assets/all-providers.png"),
);
console.log("Provider artwork: SVG, PNG, JPEG and wiki copy.");
if (process.argv.includes("--providers-only")) process.exit(0);
const marks = loadMarks(join(media, "assets/providers"));
await writeFile(
  join(images, "screenshots/hero-generate.svg"),
  adFrame(5.5, marks),
);
await sharp(Buffer.from(adFrame(5.5, marks)))
  .png()
  .toFile(join(images, "screenshots/hero-generate.png"));
for (const [name, t] of [
  ["changes", 3.7],
  ["message", 5.5],
  ["providers", 11],
  ["history", 16],
  ["install", 21],
]) {
  await sharp(Buffer.from(adFrame(t, marks)))
    .resize(960, 540)
    .png()
    .toFile(join(render, name + ".png"));
}
if (process.argv.includes("--stills")) process.exit(0);
const video = join(images, "GitMind-Animation.mp4");
const fps = 30;
const ff = spawn(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "rawvideo",
    "-pix_fmt",
    "rgba",
    "-s",
    `${W}x${H}`,
    "-r",
    String(fps),
    "-i",
    "pipe:0",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "19",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    video,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);
const completion = once(ff, "close");

for (let i = 0; i < DURATION * fps; i++) {
  const t = i / fps;
  const frame = await sharp(Buffer.from(adFrame(t, marks)))
    .ensureAlpha()
    .raw()
    .toBuffer();
  if (!ff.stdin.write(frame)) await once(ff.stdin, "drain");
  if (i % 90 === 0) console.log(`Rendering ${i / fps}/${DURATION} seconds`);
}
ff.stdin.end();
const [code] = await completion;
if (code !== 0) throw new Error(`ffmpeg exited ${code}`);
execFileSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    video,
    "-filter_complex",
    "fps=12,scale=1200:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
    "-loop",
    "0",
    join(images, "screenshots/hero-generate.gif"),
  ],
  { stdio: "inherit" },
);
console.log("Rendered 22-second 1080p MP4, 1200px GIF, and static poster.");
