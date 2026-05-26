/**
 * Fast hackathon demo (~60–75s): TTS + Playwright, submission-focused.
 */
import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "artifacts", "demo-build");
const BASE = process.env.DEMO_URL ?? "https://circle-arc-net.vercel.app";
const FINAL = path.join(ROOT, "artifacts", "agora-forge-hackathon-demo.mp4");

const SCENES = [
  {
    url: `${BASE}/`,
    dwellMs: 7000,
    line: "Agora Forge for the Agora Agents Hackathon. Adaptive portfolio on Arc with Circle USDC settlement.",
  },
  {
    url: `${BASE}/execute`,
    dwellMs: 5000,
    line: "Execute: Circle App Kit. Fund testnet USDC on Arc.",
    action: async (page) => {
      await page.getByRole("button", { name: /^Fund$/i }).click({ timeout: 8000 }).catch(() => {});
    },
  },
  {
    url: `${BASE}/execute`,
    dwellMs: 11000,
    line: "Swap and Bridge in one Exchange flow. CCTP cross-chain USDC and same-chain swaps. Fees on Arc Testnet are about one cent in USDC.",
    action: async (page) => {
      await page.getByRole("button", { name: /^Exchange$/i }).click({ timeout: 8000 }).catch(() => {});
      await page.getByText("Swap & Bridge", { exact: false }).first().scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(800);
    },
  },
  {
    url: `${BASE}/portfolio`,
    dwellMs: 10000,
    line: "Portfolio: multichain net worth, chain allocation donut, and portfolio P and L chart from Zerion.",
    action: async (page) => {
      await page.getByRole("button", { name: /^Portfolio$/i }).first().click({ timeout: 5000 }).catch(() => {});
    },
  },
  {
    url: `${BASE}/portfolio`,
    dwellMs: 9000,
    line: "Adaptive tab: regime detection and rebalance queue. Request for Builders four, Adaptive Portfolio Manager.",
    action: async (page) => {
      await page.getByRole("button", { name: /^Adaptive$/i }).click({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(500);
      const chain = page.locator("text=By chain").first();
      if (await chain.isVisible().catch(() => false)) {
        await page.getByRole("button", { name: /^Portfolio$/i }).click().catch(() => {});
        await page.waitForTimeout(400);
        await page.getByText("By chain").first().scrollIntoViewIfNeeded().catch(() => {});
      }
    },
  },
  {
    url: `${BASE}/agent`,
    dwellMs: 7000,
    line: "Agent console ties portfolio reads to execution on Arc.",
  },
  {
    url: `${BASE}/`,
    dwellMs: 6000,
    line: "Live at circle-arc-net dot vercel dot app. GitHub Circle-Arc-Net. Thank you.",
  },
];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: opts.stdio ?? "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function tts(text, outWav) {
  const tmpMp3 = outWav.replace(/\.wav$/, ".mp3");
  const edge = "/home/ubuntu/.local/bin/edge-tts";
  const args = [
    "--voice",
    "en-US-GuyNeural",
    "--rate",
    "+18%",
    "--text",
    text,
    "--write-media",
    tmpMp3,
  ];
  if (fs.existsSync(edge)) await run(edge, args);
  else await run("python3", ["-m", "edge_tts", ...args]);
  await run("ffmpeg", ["-y", "-i", tmpMp3, "-ar", "44100", "-ac", "1", outWav], { stdio: "ignore" });
}

function probeDuration(file) {
  return new Promise((resolve, reject) => {
    const p = spawn(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
      { stdio: ["ignore", "pipe", "inherit"] },
    );
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", (code) =>
      code === 0 ? resolve(parseFloat(out.trim()) || 4) : reject(new Error("ffprobe")),
    );
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, "artifacts"), { recursive: true });

  console.log("TTS…");
  const wavs = [];
  for (let i = 0; i < SCENES.length; i++) {
    const wav = path.join(OUT_DIR, `n-${i}.wav`);
    await tts(SCENES[i].line, wav);
    wavs.push(wav);
  }

  console.log("Record…");
  const videoDir = path.join(OUT_DIR, "video");
  fs.mkdirSync(videoDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const synced = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const audioSec = await probeDuration(wavs[i]);
    const dwellMs = Math.max(scene.dwellMs, Math.ceil(audioSec * 1000) + 400);
    const raw = path.join(OUT_DIR, `raw-${i}.webm`);
    const out = path.join(OUT_DIR, `s-${i}.mp4`);

    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
    });
    const page = await ctx.newPage();
    await page.goto(scene.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1200);
    if (scene.action) await scene.action(page);
    await page.waitForTimeout(dwellMs);
    await ctx.close();

    const latest = fs
      .readdirSync(videoDir)
      .filter((f) => f.endsWith(".webm"))
      .map((f) => ({ f, t: fs.statSync(path.join(videoDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]?.f;
    if (!latest) continue;
    fs.renameSync(path.join(videoDir, latest), raw);

    await run(
      "ffmpeg",
      [
        "-y",
        "-i",
        raw,
        "-i",
        wavs[i],
        "-t",
        String(audioSec + 0.2),
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "26",
        "-c:a",
        "aac",
        "-pix_fmt",
        "yuv420p",
        out,
      ],
      { stdio: "ignore" },
    );
    synced.push(out);
  }
  await browser.close();

  const list = path.join(OUT_DIR, "concat.txt");
  fs.writeFileSync(list, synced.map((c) => `file '${c}'`).join("\n"));
  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    list,
    "-c",
    "copy",
    "-movflags",
    "+faststart",
    FINAL,
  ]);

  const dur = await probeDuration(FINAL);
  console.log(`\n✓ ${FINAL} (${dur.toFixed(0)}s)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
