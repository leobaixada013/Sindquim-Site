#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/deploy/docker-compose.yml"
ENV_FILE="${PORTALSINDQUIM_ENV_FILE:-${PROJECT_DIR}/deploy/.env}"
BACKUP_ROOT="${PORTALSINDQUIM_BACKUP_DIR:-${PROJECT_DIR}/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/portalsindquim-backup.XXXXXX")"
ARCHIVE="${BACKUP_ROOT}/portalsindquim-${STAMP}.tar.gz"

cleanup() {
  rm -rf -- "${TEMP_DIR}"
}
trap cleanup EXIT

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Arquivo de ambiente não encontrado: ${ENV_FILE}" >&2
  exit 1
fi

mkdir -p "${BACKUP_ROOT}"
COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")

"${COMPOSE[@]}" exec -T database \
  sh -c 'pg_dump --format=custom --compress=9 --no-owner --no-privileges --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
  > "${TEMP_DIR}/database.dump"

"${COMPOSE[@]}" exec -T directus \
  tar -C /directus/uploads -czf - . > "${TEMP_DIR}/uploads.tar.gz"

"${COMPOSE[@]}" images --format json > "${TEMP_DIR}/images.json"
cp "${PROJECT_DIR}/site/package-lock.json" "${TEMP_DIR}/package-lock.json"
cp "${PROJECT_DIR}/deploy/docker-compose.yml" "${TEMP_DIR}/docker-compose.yml"

cat > "${TEMP_DIR}/manifest.txt" <<EOF
created_at=${STAMP}
project=portalsindquim
database=valor configurado em POSTGRES_DB
directus_expected=11.17.4
site_expected=1.9.0
contents=database.dump,uploads.tar.gz,images.json,package-lock.json,docker-compose.yml
secrets_included=false
EOF

(
  cd "${TEMP_DIR}"
  shasum -a 256 database.dump uploads.tar.gz images.json package-lock.json docker-compose.yml manifest.txt > SHA256SUMS
)

tar -C "${TEMP_DIR}" -czf "${ARCHIVE}" .
shasum -a 256 "${ARCHIVE}" > "${ARCHIVE}.sha256"

echo "Backup concluído: ${ARCHIVE}"
echo "Checksum: ${ARCHIVE}.sha256"
