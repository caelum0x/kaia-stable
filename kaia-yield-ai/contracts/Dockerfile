# Contracts Dockerfile for KAIA YIELD AI
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy contract source code
COPY . .

# Compile contracts
RUN npm run compile

# Create non-root user
RUN addgroup -g 1001 -S hardhat && \
    adduser -S hardhat -u 1001

# Change ownership
RUN chown -R hardhat:hardhat /app
USER hardhat

# Default command
CMD ["npm", "run", "deploy:testnet"]