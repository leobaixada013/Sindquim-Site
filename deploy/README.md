# Deploy do site Astro + Directus

Este diretório sobe o site novo do sindicato em dois serviços Docker:

- `sindquim-directus` — painel de conteúdo em português, banco SQLite e uploads em volume local.
- `sindquim-site` — Astro em modo servidor (Node standalone), lendo conteúdo do Directus em runtime.

## Deploy de teste atual

Ambiente usado em 2026-07-06:

- Proxmox: `ssh proxmox.home` (`192.168.31.97`).
- Container: LXC `200` (`connectai-docker`).
- IP LAN do LXC: `192.168.31.146`.
- Caminho do projeto na VM: `/home/eduardo118/sindquim-astro`.
- Site: `http://192.168.31.146:4321`.
- Painel Directus: `http://192.168.31.146:8055`.

O WordPress antigo continua separado em `/home/eduardo118/sindquim-teste` (`sindquim-wp` e `sindquim-db`). Não pare nem remova esses containers enquanto o site novo estiver em teste.

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Campos obrigatórios:

- `DIRECTUS_SECRET` — gere com `openssl rand -hex 32`.
- `DIRECTUS_ADMIN_EMAIL` — e-mail do administrador do painel.
- `DIRECTUS_ADMIN_PASSWORD` — senha inicial do administrador.
- `PUBLIC_SITE_URL` — URL pública do site.
- `PUBLIC_DIRECTUS_URL` — URL pública do painel e dos assets.

Em produção via Cloudflare Tunnel, troque os IPs por domínios, por exemplo:

```env
PUBLIC_SITE_URL=https://site.seudominio.com.br
PUBLIC_DIRECTUS_URL=https://painel.seudominio.com.br
```

## Subir ou atualizar

Dentro da VM:

```bash
cd /home/eduardo118/sindquim-astro/deploy
docker compose up -d --build
```

Se for conectar o site/painel na rede externa já usada pelo tunnel/Nginx Proxy Manager:

```bash
docker compose -f docker-compose.yml -f override-rede-tunnel.yml up -d --build
```

## Primeiro boot do Directus

O Directus roda como usuário interno `1000`. Se o SQLite falhar com `SQLITE_CANTOPEN`, ajuste os volumes:

```bash
cd /home/eduardo118/sindquim-astro/deploy
mkdir -p directus/database directus/uploads directus/extensions
chown -R 1000:1000 directus
docker restart sindquim-directus
```

## Criar schema e conteúdo inicial

Depois que `http://localhost:8055/server/health` retornar `{"status":"ok"}`:

```bash
cd /home/eduardo118/sindquim-astro
set -a
. deploy/.env
set +a
export DIRECTUS_URL=http://localhost:8055
node scripts/directus-schema.mjs
node scripts/directus-conteudo-exemplo.mjs
```

O conteúdo de exemplo já usa:

- YouTube: `https://www.youtube.com/@Rea%C3%A7%C3%A3oQu%C3%ADmicaemDebate`
- Channel ID: `UC4sw8g2GwkMMikgm4n4fHmQ`
- Instagram: `https://www.instagram.com/reacaoquimicaemdebate/`

## Configurar YouTube e Instagram manualmente

No painel Directus, abra **Configurações do site** e preencha:

- `URL do canal no YouTube`: `https://www.youtube.com/@Rea%C3%A7%C3%A3oQu%C3%ADmicaemDebate`
- `ID do canal`: `UC4sw8g2GwkMMikgm4n4fHmQ`
- `URL do Instagram`: `https://www.instagram.com/reacaoquimicaemdebate/`

O site busca vídeos recentes via RSS público do YouTube. Não precisa de chave de API.
Os cards do Instagram são manuais em **Cards do Instagram** (imagem, legenda e link da publicação), porque feed automático do Instagram exige app Meta, conta Business e token renovável.

## Verificações rápidas

Dentro do LXC 200:

```bash
curl -s http://localhost:8055/server/health
curl -s -o /dev/null -w "site: %{http_code}\n" http://localhost:4321/
curl -s http://localhost:4321/ | grep -E "Reação Química|lite-youtube|Próximo vídeo"
curl -s -o /dev/null -w "matéria: %{http_code}\n" \
  http://localhost:4321/noticias/campanha-salarial-2026-pauta-aprovada
```

Para testar formulário pelo `curl`, inclua `Origin` (Astro bloqueia POST sem origem válida):

```bash
curl -s -X POST \
  -H "Origin: http://192.168.31.146:4321" \
  -d "email=teste@exemplo.com&site=" \
  http://192.168.31.146:4321/api/newsletter \
  -o /dev/null -w "%{http_code}\n"
```

## Backup

Antes de substituir a árvore remota no LXC 200, `scripts/deploy-lxc200.sh` executa `scripts/backup-lxc200-data.sh`.

O backup salva estes dados persistentes em um `.tar.gz` timestampado no diretório remoto de backup:

- `deploy/.env` — segredos e configuração do deploy.
- `deploy/directus/database/` — banco SQLite.
- `deploy/directus/uploads/` — imagens e PDFs.
- `deploy/directus/extensions/` — extensões locais do Directus.

O script valida a leitura do arquivo com `tar -tzf` e aborta o deploy antes de qualquer `rm -rf` se o backup falhar.

```bash
scripts/backup-lxc200-data.sh
```

Variáveis aceitas: `DEPLOY_HOST`, `DEPLOY_CT`, `DEPLOY_REMOTE_DIR`, `DEPLOY_BACKUP_DIR` e `DEPLOY_BACKUP_KEEP`.
