import { readFileSync } from "node:fs";
import { providers } from "./providers.mjs";

export const W = 1920;
export const H = 1080;
const bg = "#10151c";
const white = "#f3f6fa";
const muted = "#a8b5c6";
const blue = "#69b9ed";
export const xml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const text = (x, y, value, size = 24, fill = white, weight = 400, extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${xml(value)}</text>`;
const rect = (x, y, w, h, fill, r = 0, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const line = (x, y, x2, color = "#2b3542") =>
  `<path d="M${x} ${y}H${x2}" stroke="${color}"/>`;
export const data = (path) => {
  const type = path.endsWith(".svg") ? "image/svg+xml" : "image/png";
  let buf = readFileSync(path);
  // Resolve currentColor for standalone monochrome SVGs; geometry is unchanged.
  if (type === "image/svg+xml")
    buf = Buffer.from(buf.toString().replaceAll("currentColor", white));
  return `data:${type};base64,${buf.toString("base64")}`;
};
const image = (href, x, y, w, h, extra = "") =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" ${extra}/>`;
const document = (body, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img"><title>GitMind — AI commit messages for VS Code</title><g font-family="Lato, DejaVu Sans, sans-serif">${rect(0, 0, W, h, bg)}${body}</g></svg>`;
const brand = () =>
  text(96, 87, "GitMind", 37, white, 800) +
  rect(270, 60, 1, 31, "#394553") +
  text(
    295,
    84,
    "AI COMMIT MESSAGES FOR VS CODE",
    18,
    muted,
    700,
    'letter-spacing="2"',
  );

export function providerGraphic(assetRoot) {
  let body =
    brand() +
    text(96, 201, "Your changes. Your AI.", 78, white, 800) +
    text(96, 270, "Better commits, right in VS Code.", 40, muted, 400);
  body +=
    text(1824, 207, "22", 76, blue, 800, 'text-anchor="end"') +
    text(
      1824,
      252,
      "BUILT-IN PROVIDERS",
      17,
      muted,
      700,
      'text-anchor="end" letter-spacing="1.8"',
    );
  const cellW = 280,
    cellH = 142,
    gap = 10,
    startY = 331;
  const entries = [
    ...providers,
    ["custom", "Custom API", "OpenAI-compatible · Pro"],
    ["workflow", "Your workflow", "Stage. Generate. Review."],
  ];
  entries.forEach(([id, name, caption], i) => {
    const x = 96 + (i % 6) * (cellW + gap),
      y = startY + Math.floor(i / 6) * (cellH + gap);
    body += rect(
      x,
      y,
      cellW,
      cellH,
      i === 22 ? "#152738" : "#171e27",
      12,
      'stroke="#2a3543"',
    );
    if (id === "custom") {
      body +=
        text(x + 22, y + 47, "</>", 31, blue, 700) +
        text(
          x + cellW - 20,
          y + 39,
          "PRO",
          14,
          blue,
          700,
          'text-anchor="end" letter-spacing="1.5"',
        );
    } else if (id === "workflow") {
      body += `<path d="M${x + 26} ${y + 30}h59" stroke="${blue}" stroke-width="2"/>`;
      [26, 55, 85].forEach((dx) => {
        body += `<circle cx="${x + dx}" cy="${y + 30}" r="5" fill="${bg}" stroke="${blue}" stroke-width="2"/>`;
      });
    } else if (id === "minimax") {
      body += image(data(`${assetRoot}/minimax.png`), x + 22, y + 17, 158, 49);
    } else {
      body += image(data(`${assetRoot}/${id}.svg`), x + 22, y + 17, 44, 44);
    }
    body +=
      text(x + 22, y + 96, name, 23, white, 700) +
      text(x + 22, y + 123, caption, 16, muted);
  });
  body += text(
    96,
    978,
    "Choose your provider. Keep your commit style.",
    27,
    white,
    700,
  );
  body += text(
    1824,
    978,
    "Custom API available with GitMind Pro.",
    19,
    muted,
    400,
    'text-anchor="end"',
  );
  body +=
    line(96, 1010, 1824) +
    text(
      96,
      1048,
      "Provider marks identify supported integrations. No endorsement implied.",
      16,
      muted,
    ) +
    text(1824, 1048, "gitmind-pro.com", 21, blue, 700, 'text-anchor="end"');
  return document(body);
}
