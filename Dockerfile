FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --production=false
COPY server/ .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip && pip3 install --break-system-packages --no-cache-dir pypdf==5.1.0 && mkdir -p logs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
ENV NODE_ENV=production
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -q --spider http://localhost:8080/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
