
export const runtime = 'nodejs';

// Helper to trigger Cloud Run Job via REST API
// Requires: Google Cloud credentials in environment (or automatic on Cloud Run)
// Scopes: https://www.googleapis.com/auth/cloud-platform

import { GoogleAuth } from 'google-auth-library';

export async function triggerComposerJob(jobId: string) {
    try {
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const region = process.env.CLOUD_RUN_REGION || "us-central1";
        const jobName = "jarnazi-composer-job"; // Must match deployed job name

        if (!project) {
            console.warn("Skipping Job Trigger: No GOOGLE_CLOUD_PROJECT env var");
            return false;
        }

        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const url = `https://run.googleapis.com/v2/projects/${project}/locations/${region}/jobs/${jobName}:run`;

        const res = await client.request({
            url,
            method: 'POST',
            data: {
                overrides: {
                    containerOverrides: [
                        {
                            env: [
                                { name: "JOB_ID", value: jobId }
                            ]
                        }
                    ]
                }
            }
        });

        console.log(`Triggered Job for ${jobId}:`, res.status);
        return true;
    } catch (err) {
        console.error("Failed to trigger Cloud Run Job:", err);
        return false;
    }
}
