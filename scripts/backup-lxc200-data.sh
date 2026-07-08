#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
DRY_RUN=0
if [[ "$MODE" == "--dry-run" ]]; then
  DRY_RUN=1
elif [[ -n "$MODE" ]]; then
  echo "Uso: scripts/backup-lxc200-data.sh [--dry-run]" >&2
  exit 2
fi

HOST="${DEPLOY_HOST:-proxmox.home}"
CT="${DEPLOY_CT:-200}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/home/eduardo118/sindquim-astro}"
BACKUP_DIR="${DEPLOY_BACKUP_DIR:-/home/eduardo118/backups/sindquim-astro}"
BACKUP_KEEP="${DEPLOY_BACKUP_KEEP:-10}"
HOST_SCRIPT="/tmp/sindquim-backup-$$.sh"
CT_SCRIPT="/tmp/sindquim-backup-$$.sh"
LOCAL_SCRIPT="${TMPDIR:-/tmp}/sindquim-backup-$$.sh"

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

cat >"$LOCAL_SCRIPT" <<'REMOTE_BACKUP'
#!/usr/bin/env bash
set -euo pipefail

: "${REMOTE_DIR:?REMOTE_DIR obrigatório}"
: "${BACKUP_DIR:?BACKUP_DIR obrigatório}"
BACKUP_KEEP="${BACKUP_KEEP:-10}"

timestamp=$(date +%Y%m%d-%H%M%S)
archive="$BACKUP_DIR/sindquim-directus-$timestamp.tar.gz"

if [[ ! -d "$REMOTE_DIR" ]]; then
  echo "Diretório remoto não existe: $REMOTE_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

paths=()
[[ -f "$REMOTE_DIR/deploy/.env" ]] && paths+=("deploy/.env")
[[ -d "$REMOTE_DIR/deploy/directus/database" ]] && paths+=("deploy/directus/database")
[[ -d "$REMOTE_DIR/deploy/directus/uploads" ]] && paths+=("deploy/directus/uploads")
[[ -d "$REMOTE_DIR/deploy/directus/extensions" ]] && paths+=("deploy/directus/extensions")

if (( ${#paths[@]} == 0 )); then
  echo "Nada para salvar em $REMOTE_DIR/deploy (.env/directus ausentes)." >&2
  exit 1
fi

cd "$REMOTE_DIR"
tar -czf "$archive" "${paths[@]}"
tar -tzf "$archive" >/dev/null

if [[ "$BACKUP_KEEP" =~ ^[0-9]+$ ]] && (( BACKUP_KEEP > 0 )); then
  mapfile -t antigos < <(ls -1t "$BACKUP_DIR"/sindquim-directus-*.tar.gz 2>/dev/null | tail -n +$((BACKUP_KEEP + 1)) || true)
  if (( ${#antigos[@]} > 0 )); then
    rm -f "${antigos[@]}"
  fi
fi

echo "Backup criado: $archive"
REMOTE_BACKUP

if [[ "$DRY_RUN" == "1" ]]; then
  echo "# host: $HOST"
  echo "# pct exec $CT"
  echo "# env REMOTE_DIR=$REMOTE_DIR BACKUP_DIR=$BACKUP_DIR BACKUP_KEEP=$BACKUP_KEEP"
  cat "$LOCAL_SCRIPT"
fi

run scp "$LOCAL_SCRIPT" "$HOST:$HOST_SCRIPT"
remote "pct push $CT $HOST_SCRIPT $CT_SCRIPT && pct exec $CT -- env REMOTE_DIR=$(quote "$REMOTE_DIR") BACKUP_DIR=$(quote "$BACKUP_DIR") BACKUP_KEEP=$(quote "$BACKUP_KEEP") bash $CT_SCRIPT; status=\$?; rm -f $HOST_SCRIPT; exit \$status"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry-run do backup LXC $CT concluído."
fi
