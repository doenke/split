#!/bin/sh
set -e
# SvelteKit checks the Origin header of form submissions against ORIGIN
export ORIGIN="${ORIGIN:-$PUBLIC_URL}"
UPLOAD_DIR="${UPLOAD_DIR:-/data/uploads}"
# started as root: make the upload folder writable (bind mounts are often owned by root), then drop privileges
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$UPLOAD_DIR"
  chown -R node:node "$UPLOAD_DIR" 2>/dev/null || echo "Warnung: Rechte für $UPLOAD_DIR konnten nicht gesetzt werden" >&2
  exec su-exec node "$@"
fi
exec "$@"
