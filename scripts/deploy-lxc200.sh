#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
DRY_RUN=0
if [[ "$MODE" == "--dry-run" ]]; then
  DRY_RUN=1
elif [[ -n "$MODE" ]]; then
  echo "Uso: scripts/deploy-lxc200.sh [--dry-run]" >&2
  exit 2
fi

HOST="${DEPLOY_HOST:-proxmox.home}"
CT="${DEPLOY_CT:-200}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/home/eduardo118/sindquim-astro}"
TAR_NAME="sindquim-astro-deploy.tgz"
LOCAL_TAR="${TMPDIR:-/tmp}/$TAR_NAME"
HOST_TAR="/tmp/$TAR_NAME"
CT_TAR="/tmp/$TAR_NAME"
HOST_SCRIPT="/tmp/sindquim-deploy-$$.sh"
CT_SCRIPT="/tmp/sindquim-deploy-$$.sh"
LOCAL_SCRIPT="${TMPDIR:-/tmp}/sindquim-deploy-$$.sh"

quote() {
  printf '%q' "$1"
}

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '+ '
    printf '%q ' "$@"
    printf '\n'
  else
    "$@"
  fi
}

remote() {
  run ssh "$HOST" "$@"
}

cleanup() {
  rm -f "$LOCAL_SCRIPT"
}
trap cleanup EXIT

if [[ "$DRY_RUN" == "1" ]]; then
  run bash scripts/backup-lxc200-data.sh --dry-run
else
  run bash scripts/backup-lxc200-data.sh
fi

run tar \
  --exclude='.git' \
  --exclude='.claude/worktrees' \
  --exclude='.claude/worktrees-preserved' \
  --exclude='site/node_modules' \
  --exclude='site/dist' \
  --exclude='graphify-out/cache' \
  --exclude='current-directus-data.db' \
  -czf "$LOCAL_TAR" .

run scp "$LOCAL_TAR" "$HOST:$HOST_TAR"
remote "pct push $CT $HOST_TAR $CT_TAR"

cat >"$LOCAL_SCRIPT" <<'REMOTE_DEPLOY'
#!/usr/bin/env bash
set -euo pipefail

: "${REMOTE_DIR:?REMOTE_DIR obrigatório}"
: "${CT_TAR:?CT_TAR obrigatório}"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

tar --no-same-owner -xzf "$CT_TAR" -C "$tmp"
mkdir -p "$tmp/deploy"

if [[ -f "$REMOTE_DIR/deploy/.env" ]]; then
  cp "$REMOTE_DIR/deploy/.env" "$tmp/deploy/.env"
fi

if [[ -d "$REMOTE_DIR/deploy/directus" ]]; then
  cp -a "$REMOTE_DIR/deploy/directus" "$tmp/deploy/directus"
fi

rm -rf "$REMOTE_DIR"
mkdir -p "$REMOTE_DIR"
cp -a "$tmp/." "$REMOTE_DIR/"
mkdir -p "$REMOTE_DIR/deploy/directus/uploads"
printf 'ok\n' > "$REMOTE_DIR/deploy/directus/uploads/directus-health-file"
chown -R 1000:1000 "$REMOTE_DIR/deploy/directus" 2>/dev/null || true

cd "$REMOTE_DIR/deploy"
docker compose -f docker-compose.yml -f override-rede-tunnel.yml up -d --build

timeout 90 sh -c 'until curl -fsS http://127.0.0.1:8055/server/health; do sleep 2; done'

cd "$REMOTE_DIR"
set -a
. deploy/.env
set +a
DIRECTUS_URL="${DIRECTUS_URL:-http://127.0.0.1:8055}" node scripts/directus-schema.mjs

curl -fsS -o /tmp/sindquim-home.html http://127.0.0.1:4321/
curl -fsS -o /tmp/sindquim-directus-health.json http://127.0.0.1:8055/server/health
cd "$REMOTE_DIR/deploy"
docker compose ps
REMOTE_DEPLOY

if [[ "$DRY_RUN" == "1" ]]; then
  echo "# deploy remoto no LXC $CT em $REMOTE_DIR"
  cat "$LOCAL_SCRIPT"
fi

run scp "$LOCAL_SCRIPT" "$HOST:$HOST_SCRIPT"
remote "pct push $CT $HOST_SCRIPT $CT_SCRIPT && pct exec $CT -- env REMOTE_DIR=$(quote "$REMOTE_DIR") CT_TAR=$(quote "$CT_TAR") bash $CT_SCRIPT; status=\$?; rm -f $HOST_SCRIPT; exit \$status"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry-run do deploy LXC $CT concluído."
else
  echo "Deploy LXC $CT concluído."
fi
