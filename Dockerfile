FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsdown.config.ts ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable && npm install -g pm2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY ecosystem.config.cjs ./

RUN addgroup -S bridge && adduser -S bridge -G bridge
USER bridge

ENV NODE_ENV=production
EXPOSE 3050

CMD ["pm2-runtime", "ecosystem.config.cjs"]
