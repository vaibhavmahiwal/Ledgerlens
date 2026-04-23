# 1. Build Stage
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

# --- FIX START ---
# Copy prisma folder and generate client before copying source code
COPY prisma ./prisma/
RUN npx prisma generate
# --- FIX END ---

COPY . .
RUN npm run build

# 2. Runtime Stage
FROM node:18-alpine
WORKDIR /app

# Copy built code and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000