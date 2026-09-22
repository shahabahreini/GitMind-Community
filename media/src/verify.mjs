import assert from "node:assert/strict";
import { readFile, access, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { providers } from "./providers.mjs";
import { DURATION } from "./advertisement.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const ids = providers.map(([id]) => (id === "azure" ? "azureopenai" : id));
assert.equal(
  new Set(ids).size,
  22,
  "Provider artwork must contain 22 distinct built-in providers.",
);
if (process.argv[2]) {
  const pkg = JSON.parse(await readFile(resolve(process.argv[2]), "utf8"));
  const actual = pkg.contributes.configuration.properties[
    "gitmind.apiProvider"
  ].enum
    .filter((id) => id !== "custom")
    .sort();
  assert.deepEqual(
    [...ids].sort(),
    actual,
    "Artwork must match the current extension provider catalog.",
  );
}
const provenance = JSON.parse(
  await readFile(
    join(root, "media/assets/providers/asset-sources.json"),
    "utf8",
  ),
);
assert.equal(provenance.assets.length, 22);
for (const asset of provenance.assets) {
  const bytes = await readFile(
    join(root, "media/assets/providers", asset.file),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    asset.sha256,
    `Source changed: ${asset.file}`,
  );
}
for (const file of [
  "all_providers.png",
  "all_providers_GitMind.jpg",
  "screenshots/hero-generate.png",
]) {
  const meta = await sharp(join(root, "images", file)).metadata();
  assert.equal(meta.width, 1920, file);
  assert.equal(meta.height, 1080, file);
}
assert.deepEqual(
  await readFile(join(root, "images/all_providers.png")),
  await readFile(join(root, "wiki/assets/all-providers.png")),
  "Wiki image must match.",
);
const probe = (path) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-count_frames",
        "-show_entries",
        "format=duration:stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames",
        "-of",
        "json",
        path,
      ],
      { encoding: "utf8" },
    ),
  );
const videoPath = join(root, "images/GitMind-Animation.mp4");
const video = probe(videoPath);
assert.equal(
  video.streams.length,
  1,
  "The advertisement is intentionally silent.",
);
assert.equal(video.streams[0].codec_name, "h264");
assert.equal(video.streams[0].pix_fmt, "yuv420p");
assert.equal(video.streams[0].width, 1920);
assert.equal(video.streams[0].height, 1080);
assert.equal(video.streams[0].r_frame_rate, "30/1");
assert.equal(Number(video.streams[0].nb_read_frames), DURATION * 30);
assert.ok(Math.abs(Number(video.format.duration) - DURATION) < 0.05);
const mp4 = await readFile(videoPath);
assert.ok(
  mp4.indexOf(Buffer.from("moov")) < mp4.indexOf(Buffer.from("mdat")),
  "MP4 must start playback before fully downloading.",
);
const gifPath = join(root, "images/screenshots/hero-generate.gif");
const gif = probe(gifPath);
assert.equal(gif.streams[0].width, 1200);
assert.equal(gif.streams[0].height, 675);
assert.equal(Number(gif.streams[0].nb_read_frames), DURATION * 12);
assert.ok(Math.abs(Number(gif.format.duration) - DURATION) < 0.12);
for (const path of [videoPath, gifPath])
  execFileSync(
    "ffmpeg",
    ["-v", "error", "-xerror", "-i", path, "-f", "null", "-"],
    { stdio: "pipe" },
  );
for (const relative of ["README.md", "media/README.md"]) {
  const path = join(root, relative);
  const content = await readFile(path, "utf8");
  const targets = [...content.matchAll(/(?:src="([^"]+)"|\]\(([^)]+)\))/g)].map(
    (m) => m[1] ?? m[2],
  );
  for (const target of targets) {
    if (/^(https?:|#)/.test(target) || target.startsWith("../../")) continue;
    const folder = relative.startsWith("media/") ? join(root, "media") : root;
    await access(resolve(folder, target.split("#")[0]));
  }
}
const mb = async (path) => ((await stat(path)).size / 1024 / 1024).toFixed(2);
console.log(
  `Verified: 22 provider IDs and hashes; 1080p images; ${DURATION}s / ${DURATION * 30} video frames; ${DURATION * 12} GIF frames; full decoding; README links.`,
);
console.log(`MP4 ${await mb(videoPath)} MiB; GIF ${await mb(gifPath)} MiB.`);
