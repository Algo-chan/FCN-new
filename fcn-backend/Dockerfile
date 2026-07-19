FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY src/prisma ./src/prisma
RUN npm ci

COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN addgroup --system fcn && adduser --system --ingroup fcn fcn

COPY package*.json ./
COPY src/prisma ./src/prisma
RUN npm ci --omit=dev && npx prisma generate && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

RUN chown -R fcn:fcn /app

USER fcn
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
