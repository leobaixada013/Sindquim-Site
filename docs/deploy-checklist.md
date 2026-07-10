# Checklist de Deploy

Use este checklist antes de publicar uma nova versão.

## Antes do deploy

- [ ] `deploy/.env` existe no ambiente remoto e está correto.
- [ ] `PUBLIC_SITE_URL` aponta para a URL pública do site.
- [ ] `PUBLIC_DIRECTUS_URL` aponta para a URL pública do Directus/assets.
- [ ] Nenhum segredo foi adicionado ao Git.
- [ ] Testes passaram:

```bash
cd site
npm test
```

- [ ] Build passou:

```bash
cd site
npm run build
```

## Backup

O deploy automatizado já chama `scripts/backup-lxc200-data.sh`, mas é possível rodar manualmente:

```bash
bash scripts/backup-lxc200-data.sh
```

O backup inclui:

- `deploy/.env`;
- `deploy/directus/database/`;
- `deploy/directus/uploads/`;
- `deploy/directus/extensions/`.

## Deploy

Simulação:

```bash
bash scripts/deploy-lxc200.sh --dry-run
```

Execução real:

```bash
bash scripts/deploy-lxc200.sh
```

## Verificações pós-deploy

No LXC ou no host conforme o ambiente:

```bash
curl -s http://localhost:8055/server/health
curl -s -o /dev/null -w "site: %{http_code}\n" http://localhost:4321/
curl -s http://localhost:4321/ | grep -E "Reação Química|lite-youtube|Próximo vídeo"
```

Verifique também:

- [ ] Home abre sem erro.
- [ ] Uma notícia abre em `/noticias/<slug>`.
- [ ] Directus abre e autentica.
- [ ] Imagens do Directus carregam.
- [ ] Formulário de contato retorna sucesso ou erro controlado.
- [ ] Feed `/rss.xml` responde.
- [ ] Sitemap `/sitemap.xml` responde.

## Rollback

Se o deploy falhar após substituir arquivos, restaure o backup mais recente em `DEPLOY_BACKUP_DIR` no ambiente remoto e suba os containers novamente.

A restauração envolve recolocar os caminhos persistentes sob o diretório remoto do projeto:

- `deploy/.env`
- `deploy/directus/database/`
- `deploy/directus/uploads/`
- `deploy/directus/extensions/`

Depois execute:

```bash
cd deploy
docker compose -f docker-compose.yml -f override-rede-tunnel.yml up -d --build
```
