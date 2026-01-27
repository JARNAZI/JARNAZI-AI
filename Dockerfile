# Use an official Node.js runtime as a parent image
FROM node:20-slim

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

# Expose the port the app runs on
EXPOSE 3000

# Set environment variable for port
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
