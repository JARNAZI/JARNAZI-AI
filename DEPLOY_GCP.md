
# Deploying Jarnazi DebateAI to Google Cloud Run

This guide will help you deploy your Next.js application to Google Cloud Run and map your custom domain.

## Prerequisites

1.  A Google Cloud Platform (GCP) Project.
2.  Billing enabled on your GCP project.
3.  **Google Cloud Shell** (Recommended) or `gcloud` CLI installed locally.

## Step 1: Prepare Your Environment

Open the [Google Cloud Console](https://console.cloud.google.com/) and activate the **Cloud Shell** (terminal icon in the top right).

Run the following commands in the Cloud Shell:

```bash
# Set your project ID (replace YOUR_PROJECT_ID with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Enable necessary APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com
```

## Step 2: Build and Deploy

Since you have the code locally, you can upload it or clone your repo in Cloud Shell.
**Easiest Method:** Connect your GitHub repo to **Cloud Build** triggers, or use the direct build command if you are in the directory.

If you are using the Cloud Console UI:
1.  Go to **Cloud Run**.
2.  Click **Create Service**.
3.  Select **Continuously deploy new revisions from a source repository**.
4.  Click **Cloud Build** > **Set up with Cloud Build**.
5.  Select your repository (`JARNAZI-AI`) and branch (`main`).
6.  Select **Dockerfile** as the build type and verify the path is `/Dockerfile`.
7.  Click **Save** and then **Next**.

**Configuration:**
*   **Service Name:** `jarnazi-debate-ai`
*   **Region:** Choose a region close to your users (e.g., `us-central1`).
*   **Authentication:** Allow unauthenticated invocations (Check "Allow unauthenticated invocations").
*   **Container Port:** `3000` (Important! The Dockerfile exposes 3000).

**CRITICAL: Build Arguments (Build Variables)**
For the application to build successfully, you MUST provide these variables during the build process (because they are baked into the frontend code).
In the "Build" section or "Edit Trigger" -> "Substitution variables" (or "Build Arguments" depending on the UI):

Add these **Build Arguments**:
*   `NEXT_PUBLIC_SUPABASE_URL`: (Your URL)
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Anon Key)
*   `NEXT_PUBLIC_APP_URL`: (Your App URL, e.g., https://jarnazi.com)
*   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: (Your Turnstile Site Key)

**Runtime Environment Variables (Container Variables):**
In the **Container, Variables & Secrets** tab, you MUST ALSO add the runtime secrets (and repeat the public ones if needed by server code):
*   `NEXT_PUBLIC_SUPABASE_URL`: (Your URL)
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Your Anon Key)
*   `SUPABASE_SERVICE_ROLE_KEY`: (Your Service Role Key - Secret!)
*   `TURNSTILE_SECRET_KEY`: (Your Secret Key)
*   `STRIPE_SECRET_KEY`: (Your Stripe Secret)
*   `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: (Your Site Key)
*   `NEXT_PUBLIC_APP_URL`: (Your URL)

Click **Create**.

## Step 3: Map Your Domain (jarnazi.com)

Once the service is deployed and running:

1.  Go to the **Cloud Run** dashboard.
2.  Click on your service (`jarnazi-debate-ai`).
3.  Click the **Integrations** tab (or "Manage Custom Domains" in older views).
4.  Click **Add Integration** or **Manage Custom Domains**.
5.  Select **Custom Domain**.
6.  Enter `jarnazi.com`.
7.  Click **Continue**.
8.  **DNS Configuration:** Google will provide you with DNS records (usually `A` or `AAAA` records and `TXT` for verification).
9.  Log in to your domain registrar (GoDaddy, Namecheap, etc.) and add these records.
10. Wait for propagation (can take 15 mins to 24 hours).

## Troubleshooting

*   **Build Fails:** Check Cloud Build logs. Ensure `NEXT_PUBLIC_` variables are available at build time if your code relies on them for static generation (Cloud Build allows setting build-time substitution variables). 
    *   *Note:* Our Dockerfile uses standard build. If you need build-time env vars, add `--build-arg` in Docker build command or configure them in the Build Trigger.
*   **500 Errors:** Check Cloud Run logs. It's often missing environment variables (Supabase keys, Stripe keys).

## Manual Build (Alternative)

If you have the code in Cloud Shell:

```bash
# Build the image and submit to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/jarnazi-debate-ai .

# Deploy manually
gcloud run deploy jarnazi-debate-ai \
  --image gcr.io/YOUR_PROJECT_ID/jarnazi-debate-ai \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000
```
