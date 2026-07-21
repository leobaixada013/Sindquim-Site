#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PORTALSINDQUIM_ENV_FILE:-${PROJECT_DIR}/deploy/.env}"
COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${PROJECT_DIR}/deploy/docker-compose.yml")

[[ -f "${ENV_FILE}" ]] || { echo "Crie ${ENV_FILE} a partir de deploy/.env.example." >&2; exit 1; }

"${SCRIPT_DIR}/backup.sh"
"${COMPOSE[@]}" build --pull site directus
"${COMPOSE[@]}" up -d --remove-orphans --wait --wait-timeout 180
"${COMPOSE[@]}" ps

echo "Imagens reconstruídas, containers recriados e healthchecks aprovados."
