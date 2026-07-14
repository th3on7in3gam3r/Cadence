#!/usr/bin/env bash
# Configure matching PULSE_PARTNER_SECRET on Cadence + Pulse (local + optional Render).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PULSE_ROOT="${PULSE_ROOT:-$ROOT/../pulse}"
CADENCE_RENDER_SVC="${CADENCE_RENDER_SVC:-srv-d98jpe67r5hc73d8encg}"
PULSE_RENDER_SVC="${PULSE_RENDER_SVC:-}"

if [[ -n "${1:-}" ]]; then
  SECRET="$1"
else
  SECRET="$(openssl rand -base64 32)"
fi

echo "PULSE_PARTNER_SECRET=$SECRET"
echo ""

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"
  touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname)" == Darwin ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$file"
    fi
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

upsert_env "$ROOT/.env.local" "PULSE_PARTNER_SECRET" "$SECRET"
upsert_env "$ROOT/.env.local" "PULSE_API_URL" "https://pulse-5o1m.onrender.com"
upsert_env "$ROOT/.env.local" "VITE_PULSE_URL" "https://pulse-5o1m.onrender.com"

if [[ -d "$PULSE_ROOT" ]]; then
  upsert_env "$PULSE_ROOT/.env.local" "PULSE_PARTNER_SECRET" "$SECRET"
  echo "Updated $PULSE_ROOT/.env.local"
fi

echo "Updated $ROOT/.env.local"
echo ""
echo "Render (production) — set the SAME value on both services, then redeploy:"
echo "  Cadence: https://dashboard.render.com/web/$CADENCE_RENDER_SVC"
if [[ -n "$PULSE_RENDER_SVC" ]]; then
  echo "  Pulse:   https://dashboard.render.com/web/$PULSE_RENDER_SVC"
else
  echo "  Pulse:   https://dashboard.render.com → web service \"pulse\""
fi
echo ""
echo "After deploy: Cadence → Settings → Integrations → Pulse → Retry sync"
echo ""

if [[ -n "${RENDER_API_KEY:-}" && -n "$PULSE_RENDER_SVC" ]]; then
  echo "Setting Render env vars via API..."
  for svc in "$CADENCE_RENDER_SVC" "$PULSE_RENDER_SVC"; do
    curl -fsS -X PUT \
      -H "Authorization: Bearer $RENDER_API_KEY" \
      -H "Content-Type: application/json" \
      "https://api.render.com/v1/services/$svc/env-vars/PULSE_PARTNER_SECRET" \
      -d "{\"value\":$(python3 -c "import json; print(json.dumps('$SECRET'))")}" \
      >/dev/null
    echo "  set PULSE_PARTNER_SECRET on $svc"
  done
  echo "Trigger manual redeploy on both services from the Render dashboard."
else
  echo "Tip: export RENDER_API_KEY and PULSE_RENDER_SVC=<pulse-srv-id> to auto-set Render env vars."
fi
