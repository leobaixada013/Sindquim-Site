#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${1:-}" != "--confirm" || -z "${2:-}" ]]; then
  echo "Uso: $0 --confirm /caminho/portalsindquim-AAAAMMDDTHHMMSSZ.tar.gz" >&2
  echo "A restauração substitui o banco e os uploads atuais, após criar um backup de segurança." >&2
  exit 2
fi

ARCHIVE="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/deploy/docker-compose.yml"
ENV_FILE="${PORTALSINDQUIM_ENV_FILE:-${PROJECT_DIR}/deploy/.env}"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portalsindquim-restore.XXXXXX")"

cleanup() {
  rm -rf -- "${TEMP_DIR}"
}
trap cleanup EXIT

[[ -f "${ARCHIVE}" ]] || { echo "Backup não encontrado: ${ARCHIVE}" >&2; exit 1; }
[[ -f "${ARCHIVE}.sha256" ]] || { echo "Checksum externo ausente: ${ARCHIVE}.sha256" >&2; exit 1; }
[[ -f "${ENV_FILE}" ]] || { echo "Arquivo de ambiente ausente: ${ENV_FILE}" >&2; exit 1; }

(cd "$(dirname "${ARCHIVE}")" && shasum -a 256 -c "$(basename "${ARCHIVE}.sha256")")
tar -C "${TEMP_DIR}" -xzf "${ARCHIVE}"
(cd "${TEMP_DIR}" && shasum -a 256 -c SHA256SUMS)

echo "Criando backup de segurança do estado atual..."
"${SCRIPT_DIR}/backup.sh"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")
"${COMPOSE[@]}" stop site directus

"${COMPOSE[@]}" exec -T database \
  sh -c 'pg_restore --clean --if-exists --no-owner --no-privileges --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  < "${TEMP_DIR}/database.dump"

"${COMPOSE[@]}" run --rm --no-deps -T --entrypoint sh directus -c \
  'find /directus/uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +; tar -C /directus/uploads -xzf -' \
  < "${TEMP_DIR}/uploads.tar.gz"

"${COMPOSE[@]}" up -d --wait --wait-timeout 180 directus site
echo "Restauração concluída e serviços saudáveis."
