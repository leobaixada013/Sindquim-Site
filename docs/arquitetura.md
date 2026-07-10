# Arquitetura

## Resumo

O projeto é composto por uma aplicação Astro em modo servidor e um painel Directus. O Astro entrega o site público, consulta conteúdo dinâmico em runtime e expõe endpoints de formulário. O Directus gerencia conteúdo editorial, arquivos, inscrições e mensagens recebidas.

```text
Usuário
  ↓
Site Astro (Node standalone)
  ├─ páginas públicas e SEO
  ├─ endpoints /api/*
  ├─ cache em memória de curta duração
  └─ cliente Directus SDK
       ↓
Directus 11
  ├─ SQLite local
  ├─ uploads locais
  └─ coleções editoriais
```

## Aplicação Astro

A aplicação fica em `site/`.

Arquivos centrais:

- `site/astro.config.mjs` — `output: 'server'`, adapter Node standalone e `server.host: true`.
- `site/src/layouts/Base.astro` — layout base, navegação, metadados, links sociais, RSS e rodapé.
- `site/src/styles/global.css` — sistema visual aplicado ao site.
- `site/src/lib/directus.ts` — cliente Directus, consultas, fallback jurídico e helpers de assets.
- `site/src/lib/cache.ts` — cache simples em memória.
- `site/src/lib/youtube.ts` — leitura do RSS público do YouTube.
- `site/src/lib/tipos.ts` — tipos das coleções usadas pelo site.

## CMS Directus

O Directus roda como serviço Docker `sindquim-directus`, usando:

- imagem `directus/directus:11`;
- banco SQLite em `deploy/directus/database/`;
- uploads em `deploy/directus/uploads/`;
- extensões locais em `deploy/directus/extensions/`.

O schema é criado de forma idempotente por `scripts/directus-schema.mjs`.

## Fluxo de leitura de conteúdo

1. O usuário acessa uma rota do Astro.
2. A página chama funções em `site/src/lib/directus.ts`.
3. As funções consultam o Directus via SDK REST.
4. Respostas de conteúdo público são guardadas em cache por curto período.
5. Assets do Directus são expostos por `PUBLIC_DIRECTUS_URL` com transformação para WebP quando aplicável.

A URL interna do Directus é lida de `DIRECTUS_URL` em runtime para permitir que a imagem Docker seja buildada sem depender do endereço final da rede.

## Fluxo de formulários

Os endpoints ficam em `site/src/pages/api/`:

- `newsletter.ts` — recebe e-mail, valida formato, usa honeypot `site` e grava em `inscricoes_newsletter`.
- `contato.ts` — recebe nome, e-mail e mensagem, usa honeypot `site` e grava em `mensagens_contato`.
- `juridico.ts` — recebe solicitação de triagem jurídica conforme campos configurados no Directus.

Os endpoints redirecionam de volta para a página com parâmetros de sucesso ou erro. Falhas do Directus são tratadas sem expor detalhe técnico ao visitante.

## YouTube e Instagram

A seção de vídeo usa o RSS público do YouTube:

```text
https://www.youtube.com/feeds/videos.xml?channel_id=<CHANNEL_ID>
```

Não há chave de API do YouTube. Quando só há URL de handle, o código tenta resolver o `channel_id`.

O Instagram não é consumido automaticamente. Os cards são cadastrados manualmente na coleção `cards_instagram`, porque feed automático exigiria app Meta, conta Business e token renovável.

## SEO e arquivos públicos

O site possui:

- `/rss.xml` para notícias;
- `/sitemap.xml` para indexação;
- `/robots.txt`;
- tags base de SEO no layout.

A URL canônica depende de `PUBLIC_SITE_URL`.

## Deploy

O deploy de produção/teste usa Docker Compose em `deploy/`:

- `directus` na porta 8055;
- `site` na porta 4321;
- override opcional para conectar ambos à rede externa `connectai_portaria-network`.

O script `scripts/deploy-lxc200.sh` automatiza o deploy no LXC 200:

1. roda backup dos dados persistentes;
2. empacota o repositório;
3. envia o pacote ao host Proxmox;
4. injeta o pacote no container LXC;
5. preserva `.env` e dados do Directus;
6. recria containers;
7. espera o Directus ficar saudável;
8. aplica schema;
9. valida site e painel.

## Dados persistentes

Não devem ser apagados nem versionados:

- `deploy/.env`;
- `deploy/directus/database/`;
- `deploy/directus/uploads/`;
- `deploy/directus/extensions/`.

O backup remoto é feito por `scripts/backup-lxc200-data.sh` antes de substituir a árvore remota.

## Legado WordPress

A pasta `wp-content/` contém o tema WordPress anterior e permanece no repositório como referência histórica. A aplicação ativa documentada aqui é a stack Astro + Directus.
