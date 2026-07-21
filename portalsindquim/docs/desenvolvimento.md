# Desenvolvimento

## Instalação reproduzível

```bash
cp deploy/.env.example deploy/.env
node scripts/bootstrap-local.mjs
```

O comando instala dependências pelo lockfile, sobe PostgreSQL/Directus, aplica schema e menor privilégio, inclui demonstrações, constrói o Astro e executa a integração. Use `--no-demo` para uma base vazia ou `--skip-tests` somente quando estiver diagnosticando uma falha.

## Desenvolvimento do Astro

Com Directus e PostgreSQL em execução:

```bash
npm --prefix site run dev
```

O Astro local usa `DIRECTUS_URL`. O ambiente completo em Docker fica em `http://localhost:4421`.

## Testes obrigatórios

```bash
npm --prefix site run test:ci
node scripts/test-integracao.mjs
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

`test:ci` executa Astro Check, Vitest e build. A integração valida health check, leituras públicas, bloqueio de escrita anônima, tokens de serviço, publicação mínima, slug/data automáticos, proibição de exclusão pelo Editor e ausência de acesso ao antigo módulo público.

## Alterações no schema

Edite os scripts idempotentes em `scripts/` e rode nesta ordem:

```bash
node scripts/directus-schema.mjs
node scripts/setup-configuracoes.mjs
node scripts/setup-formularios.mjs
node scripts/setup-juridico.mjs
```

As credenciais são lidas do ambiente pelo bootstrap; nunca versione `deploy/.env`.

## Conteúdo fictício

```bash
node scripts/directus-conteudo-exemplo.mjs
```

O seed usa somente arquivos locais de `assets/`. Não altere o marcador `[DEMONSTRAÇÃO]` enquanto os dados não forem oficiais.

## Antes de entregar

Procure credenciais, mojibake e referências indevidas, confira a interface em desktop/mobile e atualize o grafo do projeto:

```bash
rg -n "Ã|Â|�" site/src scripts docs README.md
graphify update .
```
