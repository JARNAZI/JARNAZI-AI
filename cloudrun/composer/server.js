import express from "express";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const app = express();
app.use(morgan("tiny"));
app.use(express.json({ limit: "10mb" }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.CLOUD_RUN_COMPOSER_SECRET;

console.log("Starting advanced composer service...");
console.log("PORT:", process.env.PORT);
console.log("Environment Check:");
console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? `Present (${process.env.SUPABASE_URL.substring(0, 10)}...)` : "MISSING");
console.log("- SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Present (Hidden)" : "MISSING");
console.log("- CLOUD_RUN_COMPOSER_SECRET:", process.env.CLOUD_RUN_COMPOSER_SECRET ? "Present (Hidden)" : "MISSING");

let supabase = null;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("CRITICAL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("The service will start but /compose will fail.");
} else {
  try {
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    console.log("Supabase client initialized successfully.");
  } catch (err) {
    console.error("FATAL: Failed to initialize Supabase client:", err.message);
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    config: {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SERVICE_ROLE,
      hasSecret: !!SECRET
    }
  });
});

/**
 * Run a command and return stdout/stderr
 */
function runCmd(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${cmd} ${args.join(" ")}`);
    const p = spawn(cmd, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd} failed (${code}): ${err.slice(-1000)}`));
    });
  });
}

/**
 * Detect if a video file has an audio stream
 */
async function hasAudio(filePath) {
  try {
    const out = await runCmd("ffprobe", [
      "-v", "error",
      "-show_entries", "stream=codec_type",
      "-of", "csv=p=0",
      filePath
    ]);
    return out.includes("audio");
  } catch (e) {
    console.warn(`ffprobe failed for ${filePath}, assuming no audio.`, e.message);
    return false;
  }
}

/**
 * Normalize a single segment
 */
async function normalizeSegment(input, output, index) {
  console.log(`[Stage: Normalize] Segment ${index}`);
  const audioPresent = await hasAudio(input);

  const args = ["-y", "-i", input];

  if (!audioPresent) {
    // Add silent audio if missing
    args.push("-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000");
    args.push("-shortest");
  }

  // Video: libx264, 30fps, 1280 width (height even), yuv420p
  // Audio: aac, 48k, stereo, 192k
  args.push(
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-vf", "scale=1280:trunc(ow/a/2)*2,fps=30,format=yuv420p",
    "-c:a", "aac",
    "-ar", "48000",
    "-ac", "2",
    "-b:a", "192k",
    output
  );

  await runCmd("ffmpeg", args);
}

/**
 * Concat normalized segments using filter_complex
 */
async function concatSegments(inputs, output) {
  console.log(`[Stage: Concat] Merging ${inputs.length} segments`);
  const args = ["-y"];
  for (const inp of inputs) {
    args.push("-i", inp);
  }

  let filter = "";
  for (let i = 0; i < inputs.length; i++) {
    filter += `[${i}:v][${i}:a]`;
  }
  filter += `concat=n=${inputs.length}:v=1:a=1[v][a]`;

  args.push("-filter_complex", filter, "-map", "[v]", "-map", "[a]", output);
  await runCmd("ffmpeg", args);
}

/**
 * Mix background music, voice, and SFX
 */
async function mixAudio(videoIn, audioOut, music, voice, sfx) {
  console.log("[Stage: Mix] Mixing audio layers");
  const inputs = ["-i", videoIn];
  if (music) inputs.push("-i", music.path);
  if (voice) inputs.push("-i", voice.path);

  const sfxStartIdx = (music ? 1 : 0) + (voice ? 1 : 0) + 1;
  for (const s of sfx) {
    inputs.push("-i", s.path);
  }

  let filter = "";
  let lastAudio = "[0:a]"; // Original video audio

  // 1. Process Voice (Delay)
  if (voice) {
    const delay = voice.atMs || 0;
    filter += `[2:a]adelay=${delay}|${delay}[vce];`;
    // Ducking: reduce video audio when voice is active? 
    // Simpler: just mix with specific volumes
  }

  // 2. Process Music (Loop + Ducking if voice exists)
  if (music) {
    const duckVol = voice ? (music.volume || 0.25) * 0.2 : (music.volume || 0.25);
    filter += `[1:a]aloop=loop=-1:size=2e9,volume=${duckVol}[bgm];`;
  }

  // 3. Process SFX (Delay/Volume)
  for (let i = 0; i < sfx.length; i++) {
    const s = sfx[i];
    const idx = sfxStartIdx + i;
    const delay = s.atMs || 0;
    filter += `[${idx}:a]adelay=${delay}|${delay},volume=${s.volume || 1.0}[sfx${i}];`;
  }

  // 4. Combine all layers
  const videoVol = voice ? 0.3 : 1.0;
  let mixInputs = `[0:a]volume=${videoVol}`;
  if (voice) mixInputs += "[vce]";
  if (music) mixInputs += "[bgm]";
  for (let i = 0; i < sfx.length; i++) mixInputs += `[sfx${i}]`;

  const count = 1 + (voice ? 1 : 0) + (music ? 1 : 0) + sfx.length;
  filter += `${mixInputs}amix=inputs=${count}:duration=first:dropout_transition=2[outa]`;

  const args = ["-y", ...inputs, "-filter_complex", filter, "-map", "0:v", "-map", "[outa]", "-c:v", "copy", "-c:a", "aac", audioOut];
  await runCmd("ffmpeg", args);
}

async function downloadToFile(url, filePath) {
  console.log(`Downloading: ${url} -> ${filePath}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to download: ${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(filePath, buf);
}

async function setJob(jobId, patch) {
  if (!supabase) return;
  await supabase.from("video_jobs").update(patch).eq("id", jobId);
}

async function failAndRefund(jobId, errorMsg) {
  console.error(`Job ${jobId} failed: ${errorMsg}`);
  if (!supabase) return;
  try {
    const { data: job } = await supabase.from("video_jobs").select("*").eq("id", jobId).maybeSingle();
    const userId = job?.user_id;
    const tokens = Number(job?.tokens_reserved ?? 0);
    if (userId && tokens > 0 && !job?.refunded) {
      await supabase.rpc("refund_tokens", { p_user_id: userId, p_tokens: tokens, p_reason: "video_compose_failed", p_meta: { jobId } });
      await setJob(jobId, { status: "failed", refunded: true, error: errorMsg });
    } else {
      await setJob(jobId, { status: "failed", error: errorMsg });
    }
  } catch (e) {
    await setJob(jobId, { status: "failed", error: errorMsg });
  }
}

app.post("/compose", async (req, res) => {
  try {
    const headerSecret = req.header("X-Composer-Secret") ?? "";
    if (!SECRET || headerSecret !== SECRET) return res.status(401).json({ error: "Unauthorized" });

    const { jobId, inputUrls, outputPath, musicUrl, musicVolume, voiceUrl, voiceVolume, sfx } = req.body ?? {};
    if (!jobId || !Array.isArray(inputUrls) || !inputUrls.length || !outputPath) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    res.status(202).json({ ok: true, accepted: true });

    (async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "compose-"));
      try {
        await setJob(jobId, { status: "running", error: null });

        // 1. Download segments
        const segments = [];
        for (let i = 0; i < inputUrls.length; i++) {
          const p = path.join(tmpDir, `orig_${i}.mp4`);
          await downloadToFile(inputUrls[i], p);
          segments.push(p);
        }

        // 2. Normalize segments
        const normalized = [];
        for (let i = 0; i < segments.length; i++) {
          const p = path.join(tmpDir, `norm_${i}.mp4`);
          await normalizeSegment(segments[i], p, i);
          normalized.push(p);
        }

        // 3. Concat
        const mergedPath = path.join(tmpDir, "merged_video.mp4");
        await concatSegments(normalized, mergedPath);

        // 4. Audio Mixing (Optional)
        let finalVideo = mergedPath;
        if (musicUrl || voiceUrl || (Array.isArray(sfx) && sfx.length > 0)) {
          const music = musicUrl ? { path: path.join(tmpDir, "music.mp3"), volume: musicVolume } : null;
          if (music) await downloadToFile(musicUrl, music.path);

          const voice = voiceUrl ? { path: path.join(tmpDir, "voice.mp3"), volume: voiceVolume, atMs: 0 } : null;
          if (voice) await downloadToFile(voiceUrl, voice.path);

          const sfxItems = [];
          if (Array.isArray(sfx)) {
            for (let i = 0; i < sfx.length; i++) {
              const s = sfx[i];
              if (!s.url) continue;
              const sp = path.join(tmpDir, `sfx_${i}.mp3`);
              await downloadToFile(s.url, sp);
              sfxItems.push({ path: sp, volume: s.volume, atMs: s.atMs });
            }
          }

          const mixedPath = path.join(tmpDir, "final_mixed.mp4");
          await mixAudio(mergedPath, mixedPath, music, voice, sfxItems);
          finalVideo = mixedPath;
        }

        // 5. Upload
        console.log(`[Stage: Upload] Sending to Supabase: ${outputPath}`);
        const fileContent = fs.readFileSync(finalVideo);
        const { error: upErr } = await supabase.storage.from("videos").upload(outputPath, fileContent, {
          contentType: "video/mp4",
          upsert: true,
        });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

        await setJob(jobId, {
          status: "done",
          final_path: outputPath,
          final_bytes: fs.statSync(finalVideo).size,
          error: null
        });

      } catch (err) {
        await failAndRefund(jobId, err.message);
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
      }
    })().catch(console.error);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, "0.0.0.0", () => console.log(`Composer active on port ${port}`));
