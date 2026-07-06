# Migração do site do sindicato: WordPress → Astro + Directus

**Data:** 2026-07-05
**Status:** Aprovado (arquitetura escolhida pelo Eduardo; pesquisa de mercado validou)

## Contexto e motivação

O site atual é um tema WordPress (`wp-content/themes/sindicato`). A dor principal é a
experiência de edição: as ferramentas do WP são pouco intuitivas para os editores,
que são **100% não técnicos**. O site novo será hospedado em **servidor local
atrás de Cloudflare Tunnel**, com custo zero de serviços.

## Decisão de arquitetura

**Astro (modo servidor, adapter Node) + Directus (self-hosted, SQLite) + cloudflared**,
três containers em um único `docker-compose.yml`.

- `directus` — painel de administração em pt-BR, login e-mail/senha, banco SQLite em
  volume, uploads em volume. Publicou → apareceu (sem pipeline de rebuild).
- `astro` — site SSR (Node standalone) buscando conteúdo do Directus a cada requisição
  com cache curto em memória. Degrada graciosamente se o Directus estiver fora.
- `cloudflared` — expõe `site` e `painel` como hostnames do tunnel, sem abrir portas.

Alternativas descartadas: Keystatic (painel em inglês + pipeline de rebuild que confunde
leigos), Sanity (SaaS, contradiz servidor local), Strapi (admin bom, mas é um projeto
Node que o mantenedor passa a possuir — migrações e rebuilds a cada upgrade), Payload
(admin dev-first, exige app Next.js junto), WordPress headless (manteria a dor de edição).

## Modelo de conteúdo (coleções do Directus, campos em pt-BR)

| Coleção | Campos principais |
|---|---|
| `posts` | titulo, slug, resumo, conteudo (WYSIWYG), imagem, categoria (M2O), fixado_banner (bool), status, date_created |
| `categorias` | nome, slug |
| `avisos` | titulo, mensagem_curta, urgente (bool), data_inicio, data_fim, link, texto_link |
| `proximos_videos` | titulo, descricao, data_estreia (datetime), imagem |
| `diretores` | nome, cargo, foto, ordem (sort) |
| `documentos` | titulo, tipo (select: convenção/acordo/ata/edital), ano, arquivo (PDF) |
| `cards_instagram` | imagem, legenda, link |
| `paginas` | titulo, slug, conteudo (WYSIWYG) — filie-se, jurídico, benefícios |
| `configuracoes` (singleton) | telefone, whatsapp, email, endereco, instagram_url, youtube_url, youtube_channel_id |
| `inscricoes_newsletter` | email, date_created — preenchida pelo site |
| `mensagens_contato` | nome, email, mensagem, date_created — preenchida pelo site |

Regras de acesso: role pública só lê conteúdo publicado e cria itens nas duas coleções
de formulário. Editores usam role "Editor" sem acesso a configurações de sistema.
Notificação de e-mail dos formulários: **Flow do Directus** (configurado no painel).

### Banner = post fixado (decisão-chave de UX de edição)

Não existe mais "banner" como tipo separado. O post publicado mais recente com
`fixado_banner = true` vira o hero da home (imagem de fundo, título, resumo, botão
"Ler matéria"). Sem post fixado → o post mais recente assume. Abaixo do hero vêm as
postagens do blog (destaque + grade), como o usuário pediu.

## Site Astro

- Astro `output: 'server'` + `@astrojs/node` standalone. Zero JS por padrão; ilhas
  mínimas (menu mobile, formulários, lite-youtube).
- `src/lib/directus.ts` — cliente `@directus/sdk` + cache em memória (TTL 60 s) +
  fallback: toda busca retorna vazio/null em erro e a seção renderiza estado alternativo.
- `src/lib/youtube.ts` — porta da lógica do RSS do canal (já testável no tema WP):
  parse do feed, `video_id`, thumbnail; cache em memória 30 min. Testes em vitest.
- Páginas: `/` (home), `/noticias` (+ paginação), `/noticias/[slug]`, `/avisos`,
  `/convencoes`, `/diretoria`, `/[slug]` (páginas institucionais: filie-se etc.),
  `/contato`, `404`.
- Formulários: POST para API routes do Astro → grava no Directus (token de serviço
  com permissão só de criação nessas coleções). Honeypot anti-spam simples.
- SEO: sitemap (`@astrojs/sitemap` com filtro), RSS (`@astrojs/rss`) do blog,
  meta/OG por página, JSON-LD `NewsArticle` nos posts. Imagens via transformações
  de asset do Directus (width/height/format) com `srcset`.

## Seção YouTube (requisito de UI/UX)

- **Facade pattern** com `lite-youtube-embed`: thumbnail estática, player carrega só
  no clique via `youtube-nocookie.com` (LCP ~800 ms melhor que iframe direto).
- Layout: vídeo em destaque grande (mais recente) + fileira de vídeos recentes.
- **Anúncios de próximos vídeos** (cadastro manual em `proximos_videos`): card de
  destaque "Próximo vídeo" com contagem de data/hora da estreia; some sozinho quando
  `data_estreia` passa. Vários anúncios futuros são listados em ordem cronológica.

## Migração de conteúdo

Os posts existentes no WordPress são exportados (WXR/REST) e importados no Directus
por script único (`scripts/importar-wp.mjs`), mapeando título/slug/conteúdo/imagem
destacada/categoria. Executado uma vez na implantação.

## Verificação

- `vitest` para `youtube.ts` (parse RSS) e filtro de `proximos_videos` (esconder passados).
- `astro build` sem erros; dev server renderiza home e páginas com Directus offline
  (fallbacks) — este é o modo de desenvolvimento nesta máquina (sem Docker aqui).
- Implantação real (Docker no servidor) segue `infra/README.md`.
