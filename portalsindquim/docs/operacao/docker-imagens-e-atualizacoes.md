# Docker, imagens e recuperação

## O que é persistente

- `database_data`: PostgreSQL com conteúdo, usuários, papéis e histórico.
- `directus_uploads`: capas, galerias e anexos.

O código não é gravado dentro do container em produção; ele entra na imagem durante o build. Recriar um container preserva volumes, mas remover volumes apaga dados. Não use `docker compose down -v`.

## Como uma alteração vira imagem

1. Faça a alteração nos arquivos do projeto.
2. Rode `npm --prefix site run test:ci`.
3. Execute `./scripts/update-images.sh`.
4. O script cria um backup.
5. Docker recompila `portalsindquim-site:1.5.0` e, se necessário, `portalsindquim-directus:11.17.4-portal3`.
6. Compose recria os containers e espera os health checks.
7. Confira site e painel antes de descartar a imagem anterior.

O cache do Docker reaproveita etapas que não mudaram. Se `site/src` mudou, a etapa de cópia e o build do Astro serão refeitos. Se apenas o Directus extension mudou, reconstrua o serviço Directus.

## Comandos manuais equivalentes

```bash
./scripts/backup.sh
docker compose --env-file deploy/.env -f deploy/docker-compose.yml build --pull
docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --wait --wait-timeout 240
```

## Backup

```bash
./scripts/backup.sh
```

Cada pacote inclui dump PostgreSQL, uploads, inventário de imagens, Compose, lockfile, manifesto e checksums. O `.env` não é incluído. Copie o `.tar.gz` e seu `.sha256` para outro equipamento ou storage de objetos com criptografia.

Sugestão inicial de retenção: 7 diários, 5 semanais e 12 mensais, ajustada ao volume e à política jurídica. Automatize somente depois de validar manualmente o destino externo.

## Restauração

```bash
./scripts/restore.sh --confirm backups/portalsindquim-AAAAMMDDTHHMMSSZ.tar.gz
```

O restore valida checksums, cria um backup de segurança do estado atual, para Site/Directus, restaura banco e uploads e só encerra quando os serviços ficam saudáveis.

## Volta de versão

Se uma imagem nova falhar, preserve o banco/uploads, restaure a tag/digest anterior no Compose e execute `docker compose up -d --wait`. Restaurar dados só é necessário quando houve migração incompatível ou alteração indevida; nesse caso use o pacote criado antes da atualização.

## Monitoramento mínimo

- health checks dos três serviços;
- espaço livre do host e tamanho dos volumes;
- resultado e tamanho do backup;
- validade do certificado HTTPS;
- falhas de login e picos de chamados;
- atualização planejada de dependências, nunca tags flutuantes.
