FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src/ ./src/
RUN npm run build

FROM node:20-alpine

# Install compilers and runtimes for local code execution
RUN apk add --no-cache \
    gcc g++ libc-dev \
    python3 \
    openjdk17-jdk \
    bash

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

# Create execution temp directory
RUN mkdir -p /tmp/cba-exec && chmod 777 /tmp/cba-exec

EXPOSE ${PORT:-5001}

CMD ["node", "dist/index.js"]
