FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY .npmrc package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
WORKDIR /app

# Build arguments for both client and server API URLs
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ARG API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
