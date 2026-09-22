import { data, xml, W, H } from "./design.mjs";

export const DURATION = 22;
const C = {
  bg: "#10151c",
  panel: "#171e27",
  line: "#303d4d",
  white: "#f3f6fa",
  muted: "#a8b5c6",
  blue: "#69b9ed",
  green: "#90d8b5",
};
const text = (x, y, s, size = 28, color = C.white, weight = 400, extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${xml(s)}</text>`;
const rect = (x, y, w, h, fill = C.panel, r = 16, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const image = (href, x, y, w, h) =>
  `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const ease = (n) => {
  n = Math.max(0, Math.min(1, n));
  return n * n * (3 - 2 * n);
};
const enter = (time, start, content, travel = 18) => {
  const a = ease((time - start) / 0.5);
  return `<g opacity="${a}" transform="translate(0 ${travel * (1 - a)})">${content}</g>`;
};
const pill = (x, y, w, label) =>
  rect(x, y, w, 47, "#203141", 23) +
  text(x + w / 2, y + 31, label, 20, C.blue, 700, 'text-anchor="middle"');
const brand = () =>
  text(96, 85, "GitMind", 38, C.white, 800) +
  rect(272, 57, 1, 31, "#394553", 0) +
  text(
    298,
    82,
    "AI COMMIT MESSAGES FOR VS CODE",
    18,
    C.muted,
    700,
    'letter-spacing="2"',
  );
const card = (x, y, w, h) =>
  rect(x, y, w, h, C.panel, 16, `stroke="${C.line}" stroke-width="2"`);
const code = (x, y, s, color = C.white) =>
  text(x, y, s, 25, color, 400, 'font-family="DejaVu Sans Mono, monospace"');

export function loadMarks(assetRoot) {
  return Object.fromEntries(
    [
      "copilot",
      "openai",
      "anthropic",
      "gemini",
      "deepseek",
      "nvidia",
      "ollama",
      "lmstudio",
    ].map((id) => [id, data(`${assetRoot}/${id}.svg`)]),
  );
}

function transformation(t) {
  let s = "";
  const title =
    t < 4.2
      ? ["You wrote the code.", "Let GitMind explain the change."]
      : ["From code changes", "to a commit worth reading."];
  const titleTime = t < 4.2 ? t : t - 4.2;
  const headline =
    text(96, 206, title[0], 78, C.white, 800) +
    text(96, 297, title[1], 78, C.blue, 800);
  s += t < 4.2 ? headline : enter(titleTime, 0, headline);
  s += enter(
    t,
    -0.5,
    card(96, 371, 795, 435) +
      text(
        128,
        417,
        "YOUR STAGED DIFF",
        18,
        C.muted,
        700,
        'letter-spacing="2"',
      ) +
      text(128, 475, "checkout.js", 28, C.white, 700) +
      code(128, 549, "for (const item of cart) {", C.muted) +
      rect(112, 570, 763, 48, "#3d242a", 5) +
      code(128, 603, "− total += item.price;", "#edafb4") +
      rect(112, 628, 763, 48, "#20382e", 5) +
      code(128, 661, "+ total += item.price * item.quantity;", C.green) +
      code(128, 719, "}", C.muted) +
      text(128, 772, "The change is the context.", 22, C.muted),
  );
  const progress = ease((t - 1.8) / 1.1);
  s += `<path d="M911 587H1009" stroke="${C.line}" stroke-width="3"/>`;
  s += `<path d="M911 587H1009" stroke="${C.blue}" stroke-width="3" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - progress}"/>`;
  s += `<path d="M997 576l12 11-12 11" fill="none" stroke="${C.blue}" stroke-width="3" opacity="${progress}"/>`;
  let result =
    card(1029, 371, 795, 435) +
    text(
      1061,
      417,
      "YOUR COMMIT MESSAGE",
      18,
      C.muted,
      700,
      'letter-spacing="2"',
    );
  const a = 1 - ease((t - 2.3) / 0.3);
  result +=
    `<g opacity="${a}">` +
    text(1061, 552, "Give the next developer", 36, C.muted) +
    text(1061, 601, "a useful starting point.", 36, C.muted) +
    "</g>";
  result += enter(
    t,
    2.4,
    text(1061, 516, "fix(checkout):", 35, C.blue, 700) +
      text(1061, 567, "account for item quantities", 35, C.white, 700),
  );
  result += enter(
    t,
    2.9,
    text(1061, 636, "Multiply each price by its quantity", 26, C.muted) +
      text(1061, 674, "when calculating the order total.", 26, C.muted),
  );
  result += enter(t, 3.3, pill(1061, 726, 257, "Conventional Commit"));
  s += result;
  s += enter(
    t,
    3.7,
    text(96, 903, "Stage your changes.", 31, C.white, 700) +
      text(655, 903, "Generate with GitMind.", 31, C.white, 700) +
      text(1264, 903, "Review. Refine. Commit.", 31, C.white, 700),
  );
  s += text(
    1824,
    959,
    "Illustrative code and message",
    17,
    C.muted,
    400,
    'text-anchor="end"',
  );
  return s;
}

function providerChoice(t, marks) {
  let s = enter(
    t,
    0,
    text(96, 207, "Your favorite AI.", 82, C.white, 800) +
      text(96, 299, "Already part of your workflow.", 78, C.blue, 800),
  );
  const brands = [
    ["copilot", "GitHub Copilot"],
    ["openai", "OpenAI"],
    ["anthropic", "Anthropic"],
    ["gemini", "Gemini"],
    ["deepseek", "DeepSeek"],
    ["nvidia", "NVIDIA NIM"],
  ];
  let tiles = "";
  brands.forEach(([id, label], i) => {
    const x = 96 + i * 290;
    tiles +=
      card(x, 379, 270, 166) +
      image(marks[id], x + 24, 402, 54, 54) +
      text(x + 24, 511, label, 27, C.white, 700);
  });
  s += enter(t, 0.35, tiles);
  s += enter(
    t,
    0.65,
    card(96, 582, 846, 292) +
      text(
        128,
        635,
        "PREFER TO KEEP IT LOCAL?",
        20,
        C.muted,
        700,
        'letter-spacing="1.6"',
      ) +
      image(marks.ollama, 132, 675, 56, 56) +
      text(210, 714, "Ollama", 31, C.white, 700) +
      image(marks.lmstudio, 483, 675, 56, 56) +
      text(562, 714, "LM Studio", 31, C.white, 700) +
      text(128, 796, "Use local models on your machine.", 29, C.white),
  );
  s += enter(
    t,
    0.85,
    card(974, 582, 850, 292) +
      text(1006, 684, "22", 79, C.blue, 800) +
      text(1133, 676, "built-in AI providers", 33, C.white, 700) +
      text(1006, 753, "Choose your provider. Choose your model.", 28, C.muted) +
      text(1006, 811, "Custom API available with Pro.", 24, C.muted),
  );
  s += text(
    96,
    948,
    "Cloud APIs, editor sign-in, or local models — the choice is yours.",
    28,
    C.muted,
  );
  return s;
}

function history(t) {
  let s = enter(
    t,
    0,
    text(96, 205, "Make your history", 82, C.white, 800) +
      text(96, 299, "easier to understand.", 82, C.blue, 800),
  );
  s += enter(
    t,
    0.3,
    text(96, 410, "Clear structure.", 36, C.white, 700) +
      text(96, 462, "Useful context.", 36, C.white, 700) +
      text(96, 514, "Your team’s conventions.", 36, C.white, 700) +
      text(96, 625, "Basic & Conventional Commits", 27, C.muted) +
      text(96, 674, "More commit styles with Pro", 27, C.muted),
  );
  const rows = [
    ["fix(checkout):", "account for item quantities"],
    ["feat(search):", "add filters for saved projects"],
    ["docs(setup):", "clarify local model configuration"],
  ];
  let timeline = `<path d="M920 421V765" stroke="${C.line}" stroke-width="3"/>`;
  rows.forEach(([prefix, message], i) => {
    const y = 387 + i * 143;
    timeline += enter(
      t,
      0.45 + i * 0.18,
      `<circle cx="920" cy="${y + 33}" r="9" fill="${C.bg}" stroke="${C.blue}" stroke-width="3"/>` +
        card(962, y, 862, 116) +
        text(995, y + 43, prefix, 28, C.blue, 700) +
        text(995, y + 85, message, 28, C.white),
    );
  });
  s +=
    timeline +
    enter(
      t,
      1.1,
      pill(96, 815, 545, "You review the message before committing."),
    );
  s += text(
    1824,
    959,
    "Illustrative commit history",
    17,
    C.muted,
    400,
    'text-anchor="end"',
  );
  return s;
}

function install(t) {
  let s = enter(
    t,
    0,
    text(96, 264, "Better commits.", 104, C.white, 800) +
      text(96, 389, "Without breaking your flow.", 88, C.blue, 800),
  );
  s += enter(
    t,
    0.25,
    text(100, 489, "AI commit messages, right inside VS Code.", 36, C.muted),
  );
  s += enter(
    t,
    0.55,
    rect(100, 581, 469, 91, "#2380b9", 12) +
      text(
        335,
        639,
        "Install GitMind",
        34,
        "#fff",
        700,
        'text-anchor="middle"',
      ) +
      text(607, 618, "VS Code Marketplace", 27, C.white, 700) +
      text(607, 659, "Also available on Open VSX", 23, C.muted),
  );
  s += enter(
    t,
    0.8,
    text(100, 811, "Your code.", 31, C.white, 700) +
      text(460, 811, "Your AI.", 31, C.white, 700) +
      text(777, 811, "Your commit style.", 31, C.white, 700),
  );
  s += enter(t, 1.05, text(100, 915, "gitmind-pro.com", 38, C.blue, 700));
  return s;
}

export function adFrame(t, marks) {
  const scenes = [
    { start: 0, end: 8, fn: transformation },
    { start: 8, end: 13, fn: (x) => providerChoice(x, marks) },
    { start: 13, end: 18, fn: history },
    { start: 18, end: 22, fn: install },
  ];
  const scene = scenes.find((x) => t >= x.start && t < x.end) ?? scenes.at(-1);
  const local = t - scene.start;
  const fadeOut =
    scene.end < 22 ? 1 - ease((t - (scene.end - 0.25)) / 0.25) : 1;
  const body = brand() + `<g opacity="${fadeOut}">${scene.fn(local)}</g>`;
  const foot =
    `<path d="M96 997H1824" stroke="${C.line}"/>` +
    text(96, 1038, "Built for your Git workflow.", 21, C.muted) +
    text(1824, 1038, "gitmind-pro.com", 21, C.muted, 400, 'text-anchor="end"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>GitMind — Better commits, inside VS Code</title><g font-family="Lato, DejaVu Sans, sans-serif">${rect(0, 0, W, H, C.bg, 0)}${body}${foot}</g></svg>`;
}
