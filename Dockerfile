# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=""
ARG BUILD_DATE=""
ENV GIT_SHA=$GIT_SHA BUILD_DATE=$BUILD_DATE
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8347 \
    HOST=0.0.0.0 \
    MIGRATIONS_DIR=/app/drizzle \
    UPLOAD_DIR=/data/uploads \
    BODY_SIZE_LIMIT=16M
# wget is part of busybox in the alpine image and used by the healthcheck
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
COPY docker-entrypoint.sh /usr/local/bin/
# the entrypoint starts as root only to fix the rights of the upload folder, the app runs as "node"
RUN apk add --no-cache su-exec && mkdir -p /data/uploads && chown -R node:node /data && chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 8347
VOLUME /data/uploads
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "build"]
