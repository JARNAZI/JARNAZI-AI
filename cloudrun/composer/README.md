# Composer (Cloud Run)
This service merges multiple MP4 segments into a single MP4 and supports advanced audio mixing.

## Key Features
- **Normalization**: Every input segment is automatically converted to a standard profile (1280px width, 30 FPS, H.264, AAC 48k). This ensures that clips from different sources (different APIs, resolutions, or framerates) can be merged without glitches.
- **Silent Audio Guard**: If a video segment has no audio track, a silent one is automatically added so the concatenation filter remains in sync.
- **Advanced Concat**: Uses `filter_complex` concatenation for seamless transitions between heterogeneous clips.
- **Audio Mixing**: Supports background music (with looping), voiceovers, and timed SFX layers.

## Env vars
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLOUD_RUN_COMPOSER_SECRET`

## Endpoint
`POST /compose` (Requires header `X-Composer-Secret`)

### Basic Schema
```json
{
  "jobId": "uuid-here",
  "inputUrls": ["https://signed-seg1.mp4", "https://signed-seg2.mp4"],
  "outputPath": "user_123/final/my_video.mp4"
}
```

### Advanced Schema (with Audio Mixing)
```json
{
  "jobId": "uuid-here",
  "inputUrls": ["..."],
  "outputPath": "...",
  "musicUrl": "https://example.com/bgm.mp3",
  "musicVolume": 0.2,
  "voiceUrl": "https://example.com/voice.mp3",
  "voiceVolume": 1.0,
  "sfx": [
    { "url": "https://example.com/bang.wav", "atMs": 1500, "volume": 0.8 }
  ]
}
```

## Internal Workflow
1. **Download**: Fetches all assets to `/tmp`.
2. **Normalize**: Detects audio track; converts to 1280px (even height) @ 30FPS H.264.
3. **Concat**: Merges segments into one stream.
4. **Mix**: Overlays Music/Voice/SFX if provided.
5. **Upload**: Saves final result to Supabase Storage 'videos' bucket.
6. **Report**: Updates the `video_jobs` table entry with the result or error.
