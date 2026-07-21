# Deploy Docker do Portal Sindquim

Esta pasta define três serviços do release 1.5:

- `database`: PostgreSQL 17 com volume nomeado;
- `directus`: Directus 11.17.4, uploads persistentes e hook editorial;
- `site`: Astro 7 em modo servidor.

## Ambiente local

Na pasta `portalsindquim`:

```bash
cp deploy/.env.example deploy/.env
openssl rand -hex 32
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build --wait
```

Preencha antes todos os valores obrigatórios de `deploy/.env`. O site usa a porta `4421` e o Directus usa `8155` por padrão.

Depois do primeiro boot, aplique o schema e as permissões:

```bash
set -a
. deploy/.env
set +a
DIRECTUS_URL=http://localhost:${DIRECTUS_PORT:-8155} node scripts/directus-schema.mjs
```

## Produção com Cloudflare Tunnel

A rede externa é opcional e fica somente no override de produção:

```bash
docker compose \
  --env-file deploy/.env \
  -f deploy/docker-compose.yml \
  -f deploy/override-rede-tunnel.yml \
  up -d --build --wait
```

O override conecta os aliases `sindquim-site` e `sindquim-directus` à rede externa `connectai_portaria-network`. A configuração principal continua funcionando em qualquer computador sem essa rede.

## Atualização segura

Use:

```bash
./scripts/update-images.sh
```

O script detecta a rede externa quando ela existe, cria backup, reconstrói as imagens versionadas, recria os containers e aguarda os health checks. Não use `down -v`: os volumes contêm o PostgreSQL e os uploads.

## Backup e restauração

```bash
./scripts/backup.sh
./scripts/restore.sh --confirm backups/portalsindquim-AAAAMMDDTHHMMSSZ.tar.gz
```

Cada backup contém dump do PostgreSQL, uploads, Compose, lockfile, inventário de imagens e checksums; segredos ficam fora do arquivo. Consulte `../docs/operacao/docker-imagens-e-atualizacoes.md` para o procedimento completo e ensaio de restauração.
