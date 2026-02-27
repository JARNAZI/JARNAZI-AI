
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Environment Check
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[CRITICAL] Missing Supabase Credentials (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function run() {
    const jobId = process.env.JOB_ID;
    const runId = process.env.RUN_ID;

    if (!jobId) {
        console.error("[Fatal] No JOB_ID provided. This container must be run as a Cloud Run Job.");
        process.exit(1);
    }

    console.log("---------------------------------------------------------");
    console.log(">> WORKER MODE: jarnazi-composer-job STARTING <<");
    console.log(`>> JobID: ${jobId}`);
    console.log(`>> RunID: ${runId || 'N/A'}`);
    console.log("---------------------------------------------------------");

    try {
        // 1. Update Job/Run Status to Running
        await updateJob(jobId, { status: "composing", error: null });
        if (runId) {
            await supabase.from("job_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", runId);
        }

        // 2. Fetch Job Details
        console.log(`[DB] Fetching job details for ${jobId}`);
        const { data: job, error: jobErr } = await supabase.from("video_jobs").select("*").eq("id", jobId).single();
        if (jobErr || !job) throw new Error(`Job not found: ${jobErr?.message || 'Empty result'}`);

        if (job.status === 'done' && job.output_url) {
            console.log("[Job] Status is already 'done'. Checking if we should re-process...");
            // Optionally exit early if idempotent
        }

        // 3. Fetch Inputs (Metadata from job_runs preferred, fallback to video_shots)
        let inputs = [];
        if (runId) {
            console.log(`[DB] Fetching metadata from job_run ${runId}`);
            const { data: runData } = await supabase.from("job_runs").select("metadata").eq("id", runId).single();
            if (runData?.metadata?.inputUrls) {
                console.log(`[Job] Found ${runData.metadata.inputUrls.length} urls in metadata`);
                inputs = runData.metadata.inputUrls;
            }
        }



        if (inputs.length === 0) {
            throw new Error("No input video segments found for composition");
        }

        // 4. Processing
        console.log(`[Processing] Starting composition of ${inputs.length} segments`);
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "compose-"));
        const outputPath = job.output_url || `composed/${job.user_id}/${job.id}.mp4`;

        try {
            const localPaths = [];
            for (let i = 0; i < inputs.length; i++) {
                const segPath = path.join(tmpDir, `seg_${i}.mp4`);
                const normPath = path.join(tmpDir, `norm_${i}.mp4`);

                console.log(`[Download] Segment ${i + 1}/${inputs.length}`);
                await downloadToFile(inputs[i], segPath);

                console.log(`[FFmpeg] Normalizing segment ${i + 1}`);
                await normalizeSegment(segPath, normPath);
                localPaths.push(normPath);
            }

            console.log("[FFmpeg] Merging all segments...");
            const mergedPath = path.join(tmpDir, "output.mp4");
            await concatSegments(localPaths, mergedPath);

            console.log(`[Storage] Uploading final video to ${outputPath}`);
            const fileContent = fs.readFileSync(mergedPath);
            const { error: upErr } = await supabase.storage.from("videos").upload(outputPath, fileContent, {
                contentType: "video/mp4",
                upsert: true
            });
            if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

            // 5. Finalize
            console.log("[Finalizing] Updating database records");
            const now = new Date().toISOString();

            // Update Job
            await updateJob(jobId, { status: "done", output_url: outputPath, updated_at: now });

            // Update Run
            if (runId) {
                await supabase.from("job_runs").update({ status: "completed", finished_at: now }).eq("id", runId);
            }

            // Create Generated Asset (Logical integration)
            console.log("[DB] Creating generated_assets record");
            const { error: assetErr } = await supabase.from("generated_assets").insert({
                user_id: job.user_id,
                debate_id: job.debate_id,
                job_run_id: runId || null,
                asset_type: "video",
                prompt: "Full Composed Video",
                provider_name: "jarnazi-composer",
                storage_path: outputPath,
                public_url: null, // Will be signed on demand
                created_at: now
            });
            if (assetErr) console.warn(`[Warning] Failed to insert generated_asset: ${assetErr.message}`);

            console.log("---------------------------------------------------------");
            console.log(`>> WORKER MODE: jarnazi-composer-job SUCCESS <<`);
            console.log(`>> Completed Job ${jobId}`);
            console.log("---------------------------------------------------------");
            process.exit(0);

        } finally {
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
        }

    } catch (err) {
        console.error(`[FatalError] Job ${jobId} failed:`, err.message);
        await updateJob(jobId, { status: "failed", error: err.message });
        if (runId) {
            await supabase.from("job_runs").update({
                status: "failed",
                error_message: err.message,
                finished_at: new Date().toISOString()
            }).eq("id", runId);
        }
        process.exit(1);
    }
}

// Helpers
async function updateJob(id, patch) {
    const { error } = await supabase.from("video_jobs").update(patch).eq("id", id);
    if (error) console.error(`[DBError] Failed to update video_job ${id}:`, error.message);
}

async function downloadToFile(url, dest) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Download failed for ${url}: ${r.status}`);
    const arrayBuffer = await r.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(arrayBuffer));
}

function runCmd(cmd, args) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args);
        p.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Command ${cmd} failed with code ${code}`)));
    });
}

async function normalizeSegment(input, output) {
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
    await runCmd("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", output]);
}

run();
