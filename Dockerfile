# Multi-stage production build for Zenith StudySync
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN npm --prefix server install --omit=dev
RUN npm --prefix client install

# Copy source code
COPY . .

# Build React client bundle
RUN npm --prefix client run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Expose port
EXPOSE 5000

CMD ["node", "server/server.js"]
