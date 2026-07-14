# Aplicação Astro — STI Baixada Santista

Este diretório contém o site público em Astro do projeto STI Baixada Santista.

Para a documentação completa do repositório, veja o [`README.md` da raiz](../README.md) e os guias em [`docs/`](../docs/README.md).

## Stack

- Astro 7
- Adapter `@astrojs/node` em modo `standalone`
- Directus SDK
- Vitest
- RSS via `@astrojs/rss`
- Embed leve do YouTube via `lite-youtube-embed`

## Scripts

No Windows, a partir da raiz do repositório, use:

```bat
dev-local.cmd
```

Se você já estiver dentro da pasta `site/`, use:

```bat
..\dev-local.cmd
```

Ou, dentro de `site/`, use os comandos npm diretamente:

```bash
npm install
npm run dev
npm run test:local
npm test
npm run build
npm run preview
```

## Variáveis usadas pelo site

| Variável | Descrição |
| --- | --- |
| `DIRECTUS_URL` | URL interna usada pelo servidor Astro para consultar o Directus. |
| `PUBLIC_DIRECTUS_URL` | URL pública usada para montar URLs de assets do Directus. |
| `PUBLIC_SITE_URL` | URL canônica do site. |

Em desenvolvimento local:

```bash
DIRECTUS_URL=http://localhost:8055
PUBLIC_DIRECTUS_URL=http://localhost:8055
PUBLIC_SITE_URL=http://localhost:4321
```

## Estrutura

```text
src/
├── components/      # Componentes Astro reutilizáveis
├── layouts/         # Layout base
├── lib/             # Directus, cache, YouTube, tipos e utilitários
├── pages/           # Rotas públicas e endpoints API
└── styles/          # CSS global
```

## Rotas importantes

- `/` — home.
- `/noticias` e `/noticias/[slug]` — notícias.
- `/avisos` — avisos.
- `/convencoes` — documentos.
- `/diretoria` — diretoria.
- `/juridico` — atendimento jurídico.
- `/contato` — contato.
- `/[slug]` — páginas institucionais dinâmicas.
- `/rss.xml`, `/sitemap.xml`, `/robots.txt` — SEO e distribuição.
- `/api/newsletter`, `/api/contato`, `/api/juridico` — endpoints de formulário.

## Build Docker

O `Dockerfile` gera a aplicação em `dist/` e executa:

```bash
node ./dist/server/entry.mjs
```

A porta exposta é `4321`.
