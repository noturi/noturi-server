# Node 22 LTS — @sentry/nestjs 11은 Node >=20.19 필요 (Node 18은 2025-04 EOL)
FROM node:22-alpine AS builder
WORKDIR /app
# package.json의 packageManager(pnpm@9.6.0)를 corepack으로 고정 — 이미지 빌드 시 미리 설치해 런타임 다운로드/프롬프트 방지
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install
RUN pnpm install --frozen-lockfile --shamefully-hoist
COPY prisma ./prisma
RUN pnpm run db:generate
COPY . .
RUN pnpm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack install
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "pnpm run db:push && pnpm run start:prod"]
