#!/bin/sh
set -e
# SvelteKit checks the Origin header of form submissions against ORIGIN
export ORIGIN="${ORIGIN:-$PUBLIC_URL}"
exec "$@"
