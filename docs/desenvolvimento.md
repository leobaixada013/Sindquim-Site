# Desenvolvimento

## Pré-requisitos

- Node.js 22.12 ou superior.
- npm.
- Docker e Docker Compose para rodar o Directus localmente.

## Instalação

```bash
cd site
npm install
```

## Ambiente local com Directus

Crie o arquivo `.env` do deploy:

```bash
cd deploy
cp .env.example .env
```

Preencha:

```env
DIRECTUS_SECRET=<segredo>
DIRECTUS_ADMIN_EMAIL=<email>
DIRECTUS_ADMIN_PASSWORD=<senha>
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_DIRECTUS_URL=http://localhost:8055
```

Suba o Directus:

```bash
docker compose up -d --build directus
```

Verifique:

```bash
curl http://localhost:8055/server/health
```

## Criar schema e conteúdo de teste

Na raiz do repositório, em Bash:

```bash
set -a
. deploy/.env
set +a
export DIRECTUS_URL=http://localhost:8055
node scripts/directus-schema.mjs
node scripts/directus-conteudo-exemplo.mjs
```

No PowerShell:

```powershell
$env:DIRECTUS_URL = "http://localhost:8055"
$env:DIRECTUS_ADMIN_EMAIL = "<email>"
$env:DIRECTUS_ADMIN_PASSWORD = "<senha>"
node scripts/directus-schema.mjs
node scripts/directus-conteudo-exemplo.mjs
```

## Rodar o site

```bash
cd site
npm run dev
```

Acesse <http://localhost:4321>.

## Build e testes

```bash
cd site
npm run test:local
npm run build
```

Use `npm run test:local` durante o desenvolvimento local: ele roda Vitest ignorando apenas `src/lib/deploy-lxc200.test.mjs`, que depende dos scripts e comandos do fluxo LXC. Antes de commit, release ou deploy, rode `npm test` para executar a suíte completa.

O build usa `@astrojs/node` em modo standalone e gera a saída em `site/dist/`.

## Variáveis em desenvolvimento

Para desenvolvimento local, normalmente basta:

```bash
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
PUBLIC_SITE_URL=http://localhost:4321
```

`DIRECTUS_URL` é lida em runtime pelo servidor Astro. Isso permite que a imagem Docker use `http://directus:8055` internamente em produção, sem fixar essa URL durante o build.

## Convenções do projeto

- Escrever texto e documentação em português.
- Preservar o sistema visual definido em `DESIGN.md`.
- Priorizar uso mobile e acessibilidade conforme `PRODUCT.md`.
- Não adicionar chaves de API para YouTube: a integração atual usa RSS público.
- Não automatizar Instagram sem decisão explícita sobre app Meta, conta Business e gestão de token.
- Manter scripts do Directus idempotentes sempre que possível.

## Checklist antes de commit

1. Rodar `npm test` dentro de `site/` para validar também o fluxo de deploy LXC.
2. Rodar `npm run build` dentro de `site/`.
3. Conferir se `.env`, banco SQLite, uploads, `node_modules` e `dist` não foram adicionados.
4. Atualizar documentação quando comandos, variáveis, rotas ou coleções mudarem.
5. Atualizar o grafo do projeto com `graphify update .` após alterações relevantes.

## Arquivos que não devem ir para Git

- `deploy/.env`
- `deploy/directus/database/`
- `deploy/directus/uploads/`
- `deploy/directus/extensions/`, se contiver build local ou segredos
- `site/node_modules/`
- `site/dist/`
- arquivos temporários de backup

## Testes existentes

O projeto usa Vitest. Os testes atuais cobrem utilitários como formatação, parsing/resolução de YouTube e comportamento de deploy. Ao adicionar lógica em `site/src/lib/`, prefira criar testes próximos ao arquivo alterado.
