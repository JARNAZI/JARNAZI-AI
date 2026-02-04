
import { GoogleAuth } from 'google-auth-library';

export async function triggerComposerJob(jobId: string) {
    console.log(`[CloudRunJob] Initiating trigger for job: jarnazi-composer-job, ID: ${jobId}`);
    try {
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const region = "europe-west1"; // Required region
        const jobName = "jarnazi-composer-job"; // Required job name

        if (!project) {
            console.warn("[CloudRunJob] Skipping Job Trigger: No GOOGLE_CLOUD_PROJECT environment variable found");
            return false;
        }

        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const url = `https://run.googleapis.com/v2/projects/${project}/locations/${region}/jobs/${jobName}:run`;

        console.log(`[CloudRunJob] Calling API: ${url}`);

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

        if (res.status === 200 || res.status === 202) {
            console.log(`[CloudRunJob] Successfully triggered job for ${jobId}. Status: ${res.status}`);
            return true;
        } else {
            console.error(`[CloudRunJob] Failed to trigger job. Unexpected status: ${res.status}`, res.data);
            return false;
        }
    } catch (err) {
        console.error("[CloudRunJob] Error triggering Cloud Run Job:", err);
        return false;
    }
}
