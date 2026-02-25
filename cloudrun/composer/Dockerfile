# Cloud Run Composer service (FFmpeg merge)
FROM node:20-slim

# Install FFmpeg and certificates
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy all source files (server.js, job.js, etc.)
COPY . .

# Standard Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Default command starts the service. 
# The Cloud Run Job will override this via API args.
CMD ["node", "server.js"]
