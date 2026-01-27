import express from "express";
import morgan from "morgan";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const app = express();
app.use(morgan("tiny"));
app.use(express.json({ limit: "5mb" }));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.CLOUD_RUN_COMPOSER_SECRET;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL ?? "", SERVICE_ROLE ?? "", { auth: { persistSession: false } });

app.get("/health", (_req, res) => res.json({ ok: true }));

function runFfmpegConcat(inputs, outFile) {
  return new Promise((resolve, reject) => {
    // Use concat demuxer for MP4 (requires same codec params; our segments should match).
    const listFile = outFile + ".txt";
    const list = inputs.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join("\n");
    fs.writeFileSync(listFile, list);

    const args = ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outFile];
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) return resolve({ listFile });
      reject(new Error(`ffmpeg failed (${code}): ${err.slice(-2000)}`));
    });
  });
}

async function downloadToFile(url, filePath) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to download segment: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(filePath, buf);
}

async function setJob(jobId, patch) {
  // video_jobs table used as job tracker
  await supabase.from("video_jobs").update(patch).eq("id", jobId);
}

async function failAndRefund(jobId, errorMsg) {
  try {
    const { data: job, error } = await supabase
      .from("video_jobs")
      .select("user_id,tokens_reserved,refunded")
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      await setJob(jobId, { status: "failed", error: errorMsg });
      return;
    }

    const userId = job?.user_id;
    const tokensReserved = Number(job?.tokens_reserved ?? 0);
    const alreadyRefunded = Boolean(job?.refunded);

    if (userId && tokensReserved > 0 && !alreadyRefunded) {
      // Refund reserved tokens once
      await supabase.rpc("refund_tokens", {
        p_user_id: userId,
        p_tokens: tokensReserved,
        p_reason: "video_compose_failed",
        p_meta: { jobId },
      });
      await setJob(jobId, { status: "failed", refunded: true, error: errorMsg });
    } else {
      await setJob(jobId, { status: "failed", error: errorMsg });
    }
  } catch {
    await setJob(jobId, { status: "failed", error: errorMsg });
  }
}

app.post("/compose", async (req, res) => {
  try {
    const headerSecret = req.header("X-Composer-Secret") ?? "";
    if (!SECRET || headerSecret !== SECRET) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { jobId, inputUrls, outputPath } = req.body ?? {};
    if (!jobId || !Array.isArray(inputUrls) || !inputUrls.length || !outputPath) {
      return res.status(400).json({ ok: false, error: "Missing jobId/inputUrls/outputPath" });
    }

    // Respond immediately; continue in background
    res.status(202).json({ ok: true, accepted: true });

    (async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "compose-"));
      const inputs = [];
      try {
        await setJob(jobId, { status: "running", error: null });

        for (let i = 0; i < inputUrls.length; i++) {
          const f = path.join(tmpDir, `seg_${String(i).padStart(4, "0")}.mp4`);
          await downloadToFile(inputUrls[i], f);
          inputs.push(f);
        }

        const outFile = path.join(tmpDir, "final.mp4");
        const { listFile } = await runFfmpegConcat(inputs, outFile);

        // Upload final.mp4 to Supabase Storage bucket 'videos'
        const fileBytes = fs.readFileSync(outFile);
        const { error: upErr } = await supabase.storage.from("videos").upload(outputPath, fileBytes, {
          contentType: "video/mp4",
          upsert: true,
        });
        if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

        // Update job payload with final_path
        await setJob(jobId, {
          status: "done",
          final_path: outputPath,
          final_bytes: fs.existsSync(outFile) ? fs.statSync(outFile).size : null,
          error: null,
        });

        // Cleanup
        try { fs.unlinkSync(listFile); } catch {}
      } catch (e) {
        const msg = e?.message ?? String(e);
        await failAndRefund(jobId, msg);
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
    })().catch(() => {});
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message ?? "Server error" });
  }
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`composer listening on ${port}`));
