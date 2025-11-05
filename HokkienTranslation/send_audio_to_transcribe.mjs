#!/usr/bin/env node
// send_audio_to_transcribe.mjs
// Usage:
//   node send_audio_to_transcribe.mjs ./clip.m4a --url http://127.0.0.1:8000/transcribe --timeout 300

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname } from "node:path";
import process from "node:process";

// Built-in in Node 18+: fetch, FormData, Blob

const MIME_OVERRIDES = {
  ".m4a": "audio/mp4",   // m4a = MP4 container (AAC)
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
};

function guessMime(path) {
  const ext = extname(path).toLowerCase();
  return MIME_OVERRIDES[ext] || "application/octet-stream";
}

function parseArgs(argv) {
  const out = { url: "http://127.0.0.1:8000/transcribe", timeout: 300 };
  const args = [...argv];
  out.file = args.shift(); // first positional
  while (args.length) {
    const k = args.shift();
    if (k === "--url") out.url = args.shift();
    else if (k === "--timeout") out.timeout = Number(args.shift());
    else if (k && !out.file) out.file = k; // fallback if user passed url first
  }
  return out;
}

async function main() {
  const [, , ...argv] = process.argv;

  if (argv.length === 0) {
    console.log(`Usage:
  node send_audio_to_transcribe.mjs <audio-file> [--url http://127.0.0.1:8000/transcribe] [--timeout 300]

Examples:
  node send_audio_to_transcribe.mjs ./clip.m4a
  node send_audio_to_transcribe.mjs ./clip.m4a --url http://SERVER_IP:8000/transcribe`);
    process.exit(0);
  }

  const { file, url, timeout } = parseArgs(argv);
  if (!file || !existsSync(file)) {
    console.error(`ERROR: file not found: ${file ?? "(none)"}`);
    process.exit(1);
  }

  const filename = basename(file);
  const mime = guessMime(file);

  let bytes;
  try {
    bytes = await readFile(file);
  } catch (err) {
    console.error("ERROR: unable to read file:", err?.message || err);
    process.exit(2);
  }

  const blob = new Blob([bytes], { type: mime });
  const form = new FormData();
  // 3rd argument ensures filename is sent; Blob type sets the Content-Type for the part
  form.append("file", blob, filename);

  console.log(`-> POST ${url}`);
  console.log(`   sending ${filename} (${mime}) ...`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout * 1000);

  let res;
  const t0 = Date.now();
  try {
    res = await fetch(url, { method: "POST", body: form, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      console.error(`REQUEST TIMEOUT after ${timeout}s`);
    } else {
      console.error("REQUEST FAILED:", err?.message || err);
    }
    process.exit(3);
  } finally {
    clearTimeout(timer);
  }

  const dt = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`<– HTTP ${res.status} in ${dt}s`);

  const ctype = res.headers.get("content-type") || "";
  if (!res.ok) {
    const text = await res.text();
    console.error("SERVER ERROR BODY:");
    console.error(text);
    process.exit(4);
  }

  if (ctype.includes("application/json")) {
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    if (data && typeof data === "object" && "text" in data) {
      console.log("\nTRANSCRIPT:");
      console.log(data.text);
    }
  } else {
    const text = await res.text();
    console.log(text.length > 2000 ? text.slice(0, 2000) + "\n...[truncated]..." : text);
  }
}

main().catch((e) => {
  console.error("UNEXPECTED ERROR:", e?.stack || e?.message || e);
  process.exit(5);
});
