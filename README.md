# Site Institucional — STI Baixada Santista

Site institucional do Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes da Baixada Santista. O projeto entrega uma experiência mobile-first para notícias, avisos, benefícios, convenções, diretoria, atendimento jurídico, filiação, contato e integração com o programa **Reação Química em Debate**.

A versão atual usa **Astro em modo servidor** para o site público e **Directus** como painel de conteúdo. O deploy homologado roda com Docker em um LXC no Proxmox, preservando banco SQLite e uploads do Directus entre atualizações.

## Visão geral

- **Site público:** Astro 7 com adapter Node standalone.
- **CMS:** Directus 11 com SQLite, uploads locais e painel em português.
- **Conteúdo dinâmico:** notícias, categorias, avisos, documentos, diretoria, páginas institucionais, jurídico, cards de Instagram e configurações gerais.
- **Formulários:** newsletter, contato e triagem jurídica com honeypot antirrobô e gravação no Directus.
- **Mídia:** vídeos recentes do YouTube via RSS público, sem chave de API; cards do Instagram cadastrados manualmente.
- **SEO:** sitemap, robots.txt, feed RSS e metadados base no layout.
- **Deploy:** Docker Compose com serviço `site` e serviço `directus`, além de scripts de backup/deploy para o LXC 200.

## Estrutura do repositório

```text
.
├── site/                       # Aplicação Astro
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── layouts/            # Layout base e metadados
│   │   ├── lib/                # Cliente Directus, cache, tipos e utilitários
│   │   ├── pages/              # Rotas públicas e endpoints API
│   │   └── styles/             # CSS global do site
│   ├── astro.config.mjs        # Astro server output + adapter Node
│   ├── Dockerfile              # Build multi-stage para produção
│   └── package.json            # Scripts e dependências do frontend
├── deploy/                     # Docker Compose, variáveis e notas de deploy
│   ├── docker-compose.yml
│   ├── override-rede-tunnel.yml
│   ├── .env.example
│   └── README.md
├── scripts/                    # Automação do Directus, backup e deploy
├── docs/                       # Documentação técnica e histórico de planos
├── PRODUCT.md                  # Direção de produto
├── DESIGN.md                   # Sistema visual aprovado
├── assets/                     # Assets institucionais de apoio
├── screenshots/                # Capturas usadas para validação visual
└── wp-content/                 # Tema WordPress legado mantido como referência histórica
```

## Stack técnica

### Aplicação

- Node.js `>=22.12.0`
- Astro `^7.0.6`
- `@astrojs/node` em modo `standalone`
- Directus SDK `^23.0.0`
- Vitest para testes automatizados
- `@astrojs/rss` para feed RSS
- `lite-youtube-embed` para embed leve do YouTube

### Infraestrutura

- Docker e Docker Compose
- Directus 11
- SQLite persistido em volume local
- Proxmox/LXC no ambiente de teste atual
- Override opcional para rede externa usada por Cloudflare Tunnel ou Nginx Proxy Manager

## Requisitos locais

- Node.js 22.12 ou superior
- npm
- Docker e Docker Compose, se quiser rodar o Directus localmente pelo `deploy/`

## Como rodar localmente

### Caminho rápido no Windows

Use o script local da raiz do projeto:

```bat
dev-local.cmd
```

Ele abre um menu com opções para:

1. limpar servidores npm/Astro em conflito;
2. abrir o site em modo desenvolvimento;
3. limpar conflitos e abrir o site em modo desenvolvimento.

Ao abrir o site por esse script, o servidor Astro roda na mesma janela. Quando você pressionar `Ctrl+C` ou fechar a janela após verificar as alterações, o servidor npm/Astro será encerrado.

Também é possível chamar diretamente pelo PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/dev-local.ps1
```

### 1. Instalar dependências

```bash
cd site
npm install
```

### 2. Subir o Directus

Crie o arquivo de ambiente do deploy:

```bash
cd ../deploy
cp .env.example .env
```

Preencha no `deploy/.env`:

```env
DIRECTUS_SECRET=<segredo-gerado-com-openssl-rand-hex-32>
DIRECTUS_ADMIN_EMAIL=<email-do-admin>
DIRECTUS_ADMIN_PASSWORD=<senha-do-admin>
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_DIRECTUS_URL=http://localhost:8055
```

Suba o Directus:

```bash
docker compose up -d --build directus
```

Aguarde o health check responder:

```bash
curl http://localhost:8055/server/health
```

### 3. Criar schema e conteúdo inicial

Na raiz do repositório:

```bash
set -a
. deploy/.env
set +a
export DIRECTUS_URL=http://localhost:8055
node scripts/directus-schema.mjs
node scripts/setup-directus-social.mjs
node scripts/directus-analytics-branding.mjs
node scripts/directus-conteudo-exemplo.mjs
```

No PowerShell, defina as variáveis com `$env:NOME = "valor"` antes de rodar os scripts.

### 4. Rodar o Astro

```bash
cd site
npm run dev
```

Acesse:

- Site: <http://localhost:4321>
- Directus: <http://localhost:8055>

## Scripts principais

Dentro de `site/`:

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento do Astro. |
| `npm run build` | Gera o build de produção em `site/dist/`. |
| `npm run preview` | Executa uma prévia local do build. |
| `npm test` | Roda a suíte completa com Vitest, incluindo testes de deploy LXC. |
| `npm run test:local` | Roda a suíte de desenvolvimento local, ignorando o teste `deploy-lxc200.test.mjs`. |
| `npm run astro -- --help` | Exibe ajuda da CLI do Astro. |

Na raiz do repositório:

| Script | Função |
| --- | --- |
| `node scripts/directus-schema.mjs` | Cria/atualiza coleções, campos e permissões do Directus de forma idempotente. |
| `node scripts/setup-directus-social.mjs` | Cria/atualiza a central de posts sociais, role Social Media e preset em cards. |
| `node scripts/directus-analytics-branding.mjs` | Aplica branding visual, URLs oficiais e dashboard de Social Media no Directus. |
| `node scripts/sync-analytics.mjs` | Sincroniza métricas sociais quando houver tokens oficiais das plataformas. |
| `node scripts/directus-conteudo-exemplo.mjs` | Cria conteúdo de demonstração para validar layout e integrações. |
| `node scripts/directus-atualizar-paginas.mjs` | Atualiza páginas institucionais no Directus. |
| `node scripts/directus-atualizar-juridico.mjs` | Atualiza conteúdo do módulo jurídico no Directus. |
| `bash scripts/backup-lxc200-data.sh` | Gera backup remoto dos dados persistentes do Directus. |
| `bash scripts/deploy-lxc200.sh` | Empacota o projeto, faz backup, envia ao LXC e recria os containers. |
| `dev-local.cmd` | Abre o menu local de desenvolvimento no Windows. |
| `powershell -ExecutionPolicy Bypass -File scripts/dev-local.ps1` | Executa o menu local de desenvolvimento pelo PowerShell. |

## Variáveis de ambiente

### Site Astro

| Variável | Uso | Padrão |
| --- | --- | --- |
| `DIRECTUS_URL` | URL interna usada pelo servidor Astro para falar com o Directus. | `http://localhost:8055` |
| `PUBLIC_DIRECTUS_URL` | URL pública usada em assets do Directus. | valor de `DIRECTUS_URL` |
| `PUBLIC_SITE_URL` | URL canônica do site, usada pelo Astro em metadados e build. | `http://localhost:4321` |

### Deploy/Directus

| Variável | Uso |
| --- | --- |
| `DIRECTUS_SECRET` | Segredo interno do Directus. Gere com `openssl rand -hex 32`. |
| `DIRECTUS_ADMIN_EMAIL` | E-mail inicial do administrador do Directus. |
| `DIRECTUS_ADMIN_PASSWORD` | Senha inicial do administrador. |
| `PUBLIC_SITE_URL` | URL pública do site. |
| `PUBLIC_DIRECTUS_URL` | URL pública do painel e dos assets. |
| `INSTAGRAM_URL` | URL oficial opcional usada pelo script de branding/analytics. |
| `YOUTUBE_URL` | URL oficial opcional usada pelo script de branding/analytics. |
| `YOUTUBE_API_KEY` | Opcional; habilita métricas detalhadas via YouTube Data API no `sync-analytics`. |
| `META_ACCESS_TOKEN` | Opcional; habilita métricas via Meta Graph API no `sync-analytics`. |

### Scripts de deploy

| Variável | Padrão |
| --- | --- |
| `DEPLOY_HOST` | `proxmox.home` |
| `DEPLOY_CT` | `200` |
| `DEPLOY_REMOTE_DIR` | `/home/eduardo118/sindquim-astro` |
| `DEPLOY_BACKUP_DIR` | `/home/eduardo118/backups/sindquim-astro` |
| `DEPLOY_BACKUP_KEEP` | `10` |

## Modelo de conteúdo no Directus

O schema atual cria as seguintes coleções:

- `categorias`
- `posts`
- `avisos`
- `proximos_videos`
- `diretores`
- `documentos`
- `cards_instagram`
- `posts_sociais`
- `paginas`
- `pagina_juridico`
- `juridico_direitos`
- `juridico_plantoes`
- `juridico_faq`
- `juridico_campos_formulario`
- `configuracoes`
- `inscricoes_newsletter`
- `mensagens_contato`

As leituras públicas usam cache em memória de curta duração para reduzir impacto quando Directus ou YouTube estão lentos ou indisponíveis.

## Painel administrativo customizado

O Directus opera como API Headless invisível. A interface editorial premium fica no Astro:

- `/admin/login` — login com credenciais do Directus.
- `/admin` — dashboard administrativo customizado.
- `/admin/social` — central de Social Media com leitura de `posts_sociais`, `proximos_videos` e `cards_instagram`, além de criação de post social com upload de mídia.

O painel usa cookie HttpOnly para manter o token no servidor Astro. O navegador não precisa acessar diretamente a porta `8055` do Directus.

## Rotas principais

| Rota | Descrição |
| --- | --- |
| `/` | Home com banner, notícias, avisos, acesso rápido, YouTube, Instagram e CTA de filiação. |
| `/noticias` e `/noticias/[slug]` | Listagem e detalhe de notícias. |
| `/avisos` | Avisos publicados. |
| `/convencoes` | Documentos e convenções coletivas. |
| `/diretoria` | Diretoria cadastrada. |
| `/juridico` | Página jurídica dinâmica, direitos, plantões, FAQ e triagem. |
| `/contato` | Formulário de contato e dados institucionais. |
| `/[slug]` | Páginas institucionais gerenciadas no Directus, como `beneficios` e `filie-se`. |
| `/rss.xml` | Feed RSS das notícias. |
| `/sitemap.xml` | Sitemap. |
| `/robots.txt` | Regras para crawlers. |
| `/api/newsletter` | Recebe inscrição de newsletter. |
| `/api/contato` | Recebe mensagens de contato. |
| `/api/juridico` | Recebe solicitações de triagem jurídica. |

## Deploy

A documentação operacional detalhada está em [`deploy/README.md`](deploy/README.md).

Fluxo resumido para o ambiente atual:

```bash
bash scripts/deploy-lxc200.sh
```

O script:

1. Executa backup remoto de `.env`, banco SQLite, uploads e extensões do Directus.
2. Empacota o repositório sem `.git`, worktrees, `node_modules`, `dist` e cache do graphify.
3. Envia o pacote para o host Proxmox.
4. Extrai no LXC configurado.
5. Preserva dados persistentes do Directus.
6. Recria os containers com `docker compose -f docker-compose.yml -f override-rede-tunnel.yml up -d --build`.
7. Aguarda health check do Directus.
8. Roda `scripts/directus-schema.mjs`.
9. Valida site e painel com `curl`.

Para simular sem aplicar:

```bash
bash scripts/deploy-lxc200.sh --dry-run
```

## Antes de subir para o Git

- Não versionar arquivos `.env`, credenciais, banco SQLite ou uploads do Directus.
- Não versionar `site/node_modules/` nem `site/dist/`.
- Manter `deploy/.env.example` como referência pública das variáveis necessárias.
- Rodar testes e build antes do commit:

```bash
cd site
npm test
npm run build
```

- Se alterar código ou documentação relevante, atualizar o grafo do projeto:

```bash
graphify update .
```

## Documentação adicional

- [`PLANO_PROJETO.md`](PLANO_PROJETO.md) — roteiro de fases e objetivo final do Sindicato Digital.
- [`docs/README.md`](docs/README.md) — índice da documentação técnica.
- [`docs/arquitetura.md`](docs/arquitetura.md) — arquitetura, fluxos e integrações.
- [`docs/desenvolvimento.md`](docs/desenvolvimento.md) — rotina de desenvolvimento local.
- [`docs/conteudo-directus.md`](docs/conteudo-directus.md) — modelo de conteúdo e operação do Directus.
- [`deploy/README.md`](deploy/README.md) — deploy, backup e verificações do ambiente Docker/LXC.
- [`PRODUCT.md`](PRODUCT.md) — diretrizes de produto e público.
- [`DESIGN.md`](DESIGN.md) — sistema visual e regras de design.

## Estado do projeto

Versão atual do pacote Astro: `1.2.0`.

O projeto já possui migração ativa para Astro + Directus, mantendo arquivos do tema WordPress anterior apenas como referência histórica/legado.
