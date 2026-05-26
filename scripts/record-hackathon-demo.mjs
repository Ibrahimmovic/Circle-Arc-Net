/**
 * Generates narrated hackathon demo MP4: TTS + Playwright screen capture.
 * Output: artifacts/agora-forge-hackathon-demo.mp4
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

const SCENES = [
  {
    url: `${BASE}/`,
    dwellMs: 12000,
    line: "Hi. This is Agora Forge — our Agora Agents Hackathon build with Circle and Arc. An adaptive portfolio command desk where AI agents and humans read multichain balances and act on Arc with USDC.",
  },
  {
    url: `${BASE}/portfolio`,
    dwellMs: 14000,
    line: "Portfolio shows net worth, chain allocation, and a real P and L chart from Zerion. Click a chain to see every token on that network, DeBank style.",
  },
  {
    url: `${BASE}/portfolio`,
    dwellMs: 8000,
    line: "The Adaptive tab detects market regime and suggests rebalance actions — Request for Builders zero four, Adaptive Portfolio Manager.",
    action: async (page) => {
      const tab = page.getByRole("button", { name: /Adaptive/i });
      if (await tab.isVisible().catch(() => false)) await tab.click();
    },
  },
  {
    url: `${BASE}/execute`,
    dwellMs: 12000,
    line: "Execute uses Circle App Kit for bridge, swap, and send. On Arc Testnet, settlement is sub-second with fees around one cent in USDC.",
  },
  {
    url: `${BASE}/agent`,
    dwellMs: 10000,
    line: "The agent console closes the loop: read portfolio, reason about allocation, execute through Circle wallets and CCTP on Arc.",
  },
  {
    url: `${BASE}/`,
    dwellMs: 8000,
    line: "Live at circle-arc-net.vercel.app. Repo on GitHub: Circle Arc Net. Built for Canteen, Circle, and Arc. Thanks for watching.",
  },
];

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
  });
}

async function tts(text, outWav) {
  const edge = "/home/ubuntu/.local/bin/edge-tts";
  const py = "python3";
  const tmpMp3 = outWav.replace(/\.wav$/, ".mp3");
  if (fs.existsSync(edge)) {
    await run(edge, [
      "--voice",
      "en-US-GuyNeural",
      "--rate",
      "+5%",
      "--text",
      text,
      "--write-media",
      tmpMp3,
    ]);
  } else {
    await run(py, [
      "-m",
      "edge_tts",
      "--voice",
      "en-US-GuyNeural",
      "--rate",
      "+5%",
      "--text",
      text,
      "--write-media",
      tmpMp3,
    ]);
  }
  await run("ffmpeg", ["-y", "-i", tmpMp3, "-ar", "44100", "-ac", "1", outWav], {
    stdio: "ignore",
  });
}

async function concatAudio(wavs, outPath) {
  const list = path.join(OUT_DIR, "audio-list.txt");
  fs.writeFileSync(list, wavs.map((w) => `file '${w}'`).join("\n"));
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
    outPath,
  ]);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(ROOT, "artifacts"), { recursive: true });

  console.log("Generating narration…");
  const wavs = [];
  for (let i = 0; i < SCENES.length; i++) {
    const wav = path.join(OUT_DIR, `narration-${i}.wav`);
    await tts(SCENES[i].line, wav);
    wavs.push(wav);
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
        code === 0 ? resolve(parseFloat(out.trim()) || 5) : reject(new Error("ffprobe failed")),
      );
    });
  }

  console.log("Recording screen (synced to narration)…");
  const videoDir = path.join(OUT_DIR, "video");
  fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const syncedClips = [];

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const wav = wavs[i];
    const audioSec = await probeDuration(wav);
    const dwellMs = Math.max(scene.dwellMs, Math.ceil(audioSec * 1000) + 500);

    const rawWebm = path.join(OUT_DIR, `raw-${i}.webm`);
    const syncedMp4 = path.join(OUT_DIR, `synced-${i}.mp4`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
    });
    const page = await context.newPage();
    await page.goto(scene.url, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(2000);
    if (scene.action) await scene.action(page).catch(() => {});
    await page.waitForTimeout(dwellMs);
    await context.close();

    const files = fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm"));
    const latest = files
      .map((f) => ({ f, t: fs.statSync(path.join(videoDir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t)[0]?.f;
    if (!latest) continue;
    fs.renameSync(path.join(videoDir, latest), rawWebm);

    await run("ffmpeg", [
      "-y",
      "-i",
      rawWebm,
      "-i",
      wav,
      "-t",
      String(audioSec + 0.3),
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-pix_fmt",
      "yuv420p",
      syncedMp4,
    ], { stdio: "ignore" });
    syncedClips.push(syncedMp4);
  }
  await browser.close();

  const videoList = path.join(OUT_DIR, "video-list.txt");
  fs.writeFileSync(videoList, syncedClips.map((c) => `file '${c}'`).join("\n"));
  const finalMp4 = path.join(ROOT, "artifacts", "agora-forge-hackathon-demo.mp4");
  await run("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    videoList,
    "-c",
    "copy",
    finalMp4,
  ]);

  console.log(`\nDone: ${finalMp4}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
