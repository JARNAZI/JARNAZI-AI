# Use an official Node.js runtime as a parent image
FROM node:22-slim

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose the port the app runs on (Cloud Run uses PORT env)
EXPOSE 8080

# Don't hardcode PORT=3000. Cloud Run injects PORT (usually 8080).
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Start the application (force Next to listen on PORT)
CMD ["sh", "-c", "npm start -- -p $PORT -H 0.0.0.0"]
