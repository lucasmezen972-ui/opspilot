#!/usr/bin/env bash
# OpsPilot — Local setup script (run once from your machine)
# Prerequisites: supabase CLI + gh CLI installed
# Usage: bash setup.sh
#
# Set these env vars before running (or the script will prompt for them):
#   SUPABASE_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY

set -euo pipefail

PROJECT_REF="hpqfmuzkkxrqoqoabjmb"
REPO="lucasmezen972-ui/opspilot"

echo "======================================"
echo "  OpsPilot — Setup local"
echo "======================================"

# ── Collect secrets ───────────────────────────────────────────────────────────
if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  read -rsp "SUPABASE_ACCESS_TOKEN (sb_secret_...): " SUPABASE_ACCESS_TOKEN
  echo
fi
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  read -rsp "SUPABASE_SERVICE_ROLE_KEY (eyJ...): " SUPABASE_SERVICE_ROLE_KEY
  echo
fi
if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  read -rsp "STRIPE_SECRET_KEY (sk_test_...): " STRIPE_SECRET_KEY
  echo
fi
export SUPABASE_ACCESS_TOKEN SUPABASE_SERVICE_ROLE_KEY STRIPE_SECRET_KEY PROJECT_REF

# ── 1. Add GitHub Secrets ─────────────────────────────────────────────────────
echo ""
echo "── Étape 1 : GitHub Secrets ──"
gh secret set SUPABASE_ACCESS_TOKEN      --repo "$REPO" --body "$SUPABASE_ACCESS_TOKEN"
gh secret set SUPABASE_SERVICE_ROLE_KEY  --repo "$REPO" --body "$SUPABASE_SERVICE_ROLE_KEY"
gh secret set STRIPE_SECRET_KEY          --repo "$REPO" --body "$STRIPE_SECRET_KEY"
echo "✅ GitHub Secrets configurés"

# ── 2. Apply SQL migrations ───────────────────────────────────────────────────
echo ""
echo "── Étape 2 : Migrations SQL ──"
for f in supabase/migrations/2026*.sql; do
  [ -f "$f" ] || continue
  name=$(basename "$f")
  echo "→ $name"
  python3 - "$f" <<'PYEOF'
import sys, json, urllib.request, os

sql_file = sys.argv[1]
token = os.environ["SUPABASE_ACCESS_TOKEN"]
ref   = os.environ["PROJECT_REF"]
sql   = open(sql_file).read()

data = json.dumps({"query": sql}).encode()
req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{ref}/database/query",
    data=data,
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    },
)
try:
    resp = urllib.request.urlopen(req)
    print(f"✅ OK: {resp.read().decode()[:200]}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    if "already exists" in body or "duplicate" in body.lower():
        print(f"⏭  Déjà appliquée (ignoré): {body[:200]}")
    else:
        print(f"❌ Erreur: {body[:500]}", file=sys.stderr)
        sys.exit(1)
PYEOF
done
echo "✅ Migrations terminées"

# ── 3. Edge Function secrets ──────────────────────────────────────────────────
echo ""
echo "── Étape 3 : Secrets Edge Functions ──"
supabase secrets set \
  --project-ref "$PROJECT_REF" \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  APP_URL="https://lucasmezen972-ui.github.io/opspilot"
echo "✅ Secrets Edge Functions configurés"

# ── 4. Deploy Edge Functions ──────────────────────────────────────────────────
echo ""
echo "── Étape 4 : Déploiement Edge Functions ──"
for dir in supabase/functions/*/; do
  func=$(basename "$dir")
  echo "→ $func"
  supabase functions deploy "$func" \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt
  echo "✅ $func déployé"
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "======================================"
echo "✅ Setup OpsPilot terminé !"
echo "======================================"
echo "• GitHub Secrets configurés"
echo "• Migrations SQL appliquées"
echo "• Edge Functions déployées"
echo ""
echo "Le workflow CI/CD est maintenant opérationnel."
echo "Dashboard : https://github.com/$REPO/actions"
