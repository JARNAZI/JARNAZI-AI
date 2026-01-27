# Composer (Cloud Run)
This service merges multiple MP4 segments into a single MP4 using FFmpeg (concat demuxer) and uploads it to Supabase Storage.

## Env vars
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- CLOUD_RUN_COMPOSER_SECRET

## Endpoint
POST /compose (requires header X-Composer-Secret)

Body:
{
  "jobId": "<uuid>",
  "inputUrls": ["https://signed-seg1", ...],
  "outputPath": "<userId>/final/<jobId>.mp4"
}

The service updates `public.pending_requests` row with `status=done/failed` and payload.final_path.
