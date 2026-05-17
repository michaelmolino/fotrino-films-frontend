#!/bin/sh
set -eu

SAMPLE_CHANNEL_ID="${SAMPLE_CHANNEL_ID:-}"
SAMPLE_CHANNEL_SLUG="${SAMPLE_CHANNEL_SLUG:-Sample-Channel}"

cat > /www/fotrino-films/dist/spa/runtime-config.js <<EOF
window.__APP_CONFIG__ = {
  SAMPLE_CHANNEL_ID: "${SAMPLE_CHANNEL_ID}",
  SAMPLE_CHANNEL_SLUG: "${SAMPLE_CHANNEL_SLUG}"
};
EOF

exec quasar serve -p 4000 -H 0.0.0.0 /www/fotrino-films/dist/spa/ --history
