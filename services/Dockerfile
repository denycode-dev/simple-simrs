# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# Development stage (used by docker-compose with hot-reload)
FROM base AS development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Build stage
FROM development AS builder
RUN npm run build

# Production stage (minimal image, non-root user, healthcheck)
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "dist/index.js"]
