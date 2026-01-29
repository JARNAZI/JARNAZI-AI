# Cloud Run Composer service (FFmpeg merge)
FROM node:20-slim

# Install FFmpeg and certificates
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# IMPORTANT: In Cloud Run "Source" deployments, the build context is usually the repository root.
# We copy the files specifically from the cloudrun/composer directory.
COPY cloudrun/composer/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source from the subfolder
COPY cloudrun/composer/server.js ./

# Standard Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Use node directly for better process management and logs
CMD ["node", "server.js"]
