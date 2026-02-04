import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth();

/**
 * Gets an ID token for a given audience (service-to-service auth)
 */
export async function getIdToken(audience: string): Promise<string | null> {
    try {
        const client = await auth.getIdTokenClient(audience);
        const headers = await client.getRequestHeaders();
        const authHeader = headers['Authorization'];
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    } catch (err) {
        console.error("[Auth] Failed to get ID token:", err);
        return null;
    }
}

/**
 * Perform an authenticated fetch to another Cloud Run service
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const urlObj = new URL(url);
    const audience = `${urlObj.protocol}//${urlObj.host}`;

    console.log(`[AuthFetch] Preparing authenticated request for audience: ${audience}`);
    const token = await getIdToken(audience);

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        console.warn("[AuthFetch] No ID token obtained, proceeding without Authorization header");
    }

    const start = Date.now();
    console.log(`[Composer] Calling service: ${url} ...`);

    const res = await fetch(url, { ...options, headers });

    const duration = Date.now() - start;
    console.log(`[Composer] Response received: ${res.status} (${duration}ms)`);

    return res;
}

export async function triggerComposerJob(jobId: string, runId?: string) {
    console.log(`[CloudRunJob] Initiating trigger for job: jarnazi-composer-job, ID: ${jobId}${runId ? `, RunID: ${runId}` : ''}`);
    try {
        const project = process.env.GOOGLE_CLOUD_PROJECT;
        const region = "europe-west1"; // Required region
        const jobName = "jarnazi-composer-job"; // Required job name

        if (!project) {
            console.warn("[CloudRunJob] Skipping Job Trigger: No GOOGLE_CLOUD_PROJECT environment variable found");
            return false;
        }

        const client = await auth.getClient();
        const url = `https://run.googleapis.com/v2/projects/${project}/locations/${region}/jobs/${jobName}:run`;

        console.log(`[CloudRunJob] Calling API: ${url}`);

        const envVars = [
            { name: "JOB_ID", value: jobId }
        ];
        if (runId) {
            envVars.push({ name: "RUN_ID", value: runId });
        }

        const res = await client.request({
            url,
            method: 'POST',
            data: {
                overrides: {
                    containerOverrides: [
                        {
                            env: envVars,
                            // CRITICAL: Override command to run worker script and EXIT.
                            // This fixes the issue where executions stay "Running" if they start server.js.
                            args: ["node", "job.js"]
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
