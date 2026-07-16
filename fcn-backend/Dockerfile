FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY src/prisma ./src/prisma
RUN npm ci

COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S fcn && adduser -S fcn -G fcn

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/prisma ./src/prisma
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

USER fcn
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://localhost:5000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
