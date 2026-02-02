
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Environment Check
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("CRITICAL: Missing Supabase Credentials");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// Main Job Logic
async function run() {
    const jobId = process.env.JOB_ID || process.argv[2]; // Passed via env or arg
    if (!jobId) {
        console.error("No JOB_ID provided");
        process.exit(1);
    }

    console.log(`Starting Job: ${jobId}`);

    try {
        // 1. Fetch Job
        const { data: job, error } = await supabase.from("video_jobs").select("*").eq("id", jobId).single();
        if (error || !job) throw new Error(`Job not found: ${error?.message}`);

        if (job.status === 'done') {
            console.log("Job already done, exiting.");
            process.exit(0);
        }

        // 2. Fetch Shots
        const { data: shots } = await supabase.from("video_shots").select("*").eq("job_id", jobId).order("metadata->sequence", { ascending: true });
        if (!shots || shots.length === 0) throw new Error("No shots found");

        // Verify all done
        const notDone = shots.filter(s => s.status !== 'done');
        if (notDone.length > 0) throw new Error(`${notDone.length} shots are not ready.`);

        // 3. Prepare Work
        await updateJob(jobId, { status: "composing", error: null });

        // Directory Setup
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "compose-"));
        const outputPath = `composed/${job.user_id}/${job.id}.mp4`;

        try {
            console.log("Downloading assets...");
            const inputs = [];
            for (let i = 0; i < shots.length; i++) {
                if (!shots[i].output_url) continue;
                const localPath = path.join(tmpDir, `seg_${i}.mp4`);
                await downloadToFile(shots[i].output_url, localPath);

                // Normalize (ensure standard fps/res)
                const normPath = path.join(tmpDir, `norm_${i}.mp4`);
                await normalizeSegment(localPath, normPath);
                inputs.push(normPath);
            }

            console.log("Merging...");
            const mergedPath = path.join(tmpDir, "output.mp4");
            await concatSegments(inputs, mergedPath);

            // Upload
            console.log("Uploading...");
            const fileContent = fs.readFileSync(mergedPath);
            const { error: upErr } = await supabase.storage.from("videos").upload(outputPath, fileContent, { contentType: "video/mp4", upsert: true });
            if (upErr) throw upErr;

            // Finalize
            await updateJob(jobId, { status: "done", output_url: outputPath, error: null });
            console.log("Success!");

        } catch (innerErr) {
            throw innerErr;
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }

    } catch (err) {
        console.error("Job Failed:", err);
        await updateJob(jobId, { status: "failed", error: err.message });
        process.exit(1);
    }
}

// Helpers
async function updateJob(id, patch) {
    await supabase.from("video_jobs").update(patch).eq("id", id);
}

async function downloadToFile(url, dest) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buf);
}

function runCmd(cmd, args) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args);
        p.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${cmd}`)));
    });
}

async function normalizeSegment(input, output) {
    // Ensure consistency: 1280x720, 30fps, aac audio (add silence if missing)
    const args = [
        "-y", "-i", input,
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30",
        "-c:v", "libx264", "-preset", "veryfast",
        "-c:a", "aac", "-ar", "44100", "-ac", "2",
        output
    ];
    await runCmd("ffmpeg", args);
}

async function concatSegments(inputs, output) {
    const listPath = output + ".txt";
    const content = inputs.map(p => `file '${p}'`).join("\n");
    fs.writeFileSync(listPath, content);

    // Safe concat
    await runCmd("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", output]);
}

run();
