# YouTube Embutido, Instagram Real, Bugs e Animações — Design

## Contexto

O tema WordPress (`wp-content/themes/sindicato/`) já busca vídeos do canal do YouTube automaticamente via feed RSS (implementado em 2026-07-01), mas os vídeos abrem em outra aba. A seção "No Instagram" é preenchida manualmente via CPT `card_social`. O site tem bugs de navegação e usabilidade, e nenhuma animação. Público mobile-first (ver PRODUCT.md).

Ambiente: WordPress local no XAMPP (`C:\xampp\htdocs\sindicato`, URL `http://localhost/sindicato/`), tema linkado por junction do Windows a partir do repositório. WP-CLI via `"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" <comando> --path="/c/xampp/htdocs/sindicato" --allow-root`. Sem PHPUnit: verificação por seed WP-CLI + `curl | grep` + screenshots reais.

## Objetivo

1. YouTube com player embutido no próprio site (padrão lite embed), mantendo a busca automática via RSS.
2. Feed real do Instagram via plugin Smash Balloon (Instagram Feed), com fallback nos cards manuais.
3. Corrigir os bugs catalogados abaixo.
4. Animações sutis e funcionais em todo o site, respeitando `prefers-reduced-motion`.

## 1. YouTube — Player Embutido (Sem Plugin)

**Dados:** o feed RSS já entrega `yt:videoId` por entrada; hoje é descartado. `sindicato_get_youtube_videos()` passa a incluir `video_id` em cada item. Cache existente (transient 1h/10min) não muda de lógica — apenas o formato dos itens ganha um campo (invalidar/regerar o transient na primeira execução é automático porque itens antigos sem `video_id` devem ser tratados como cache inválido).

**Comportamento (padrão lite embed):**
- Carregamento da página continua leve: só thumbnails, zero JS/iframe do YouTube até o primeiro toque.
- Tocar no destaque injeta `<iframe src="https://www.youtube-nocookie.com/embed/{video_id}?autoplay=1" ...>` no lugar da capa, com transição suave (fade).
- **Lista = playlist:** tocar num item da lista promove o vídeo ao player de destaque e inicia a reprodução; no mobile, a página rola suavemente até o player.
- Link "Assistir no YouTube" permanece como ação secundária no destaque.
- Acessibilidade: os elementos clicáveis viram `<button>`/elementos com `aria-label` descritivo ("Assistir: {título}"); o iframe recebe `title` com o título do vídeo.
- Quando o card "Próximo Episódio" está ativo (sem vídeo real ainda), o comportamento atual se mantém — o player embutido só se aplica a vídeos reais.

**Arquivos:** `inc/youtube.php` (extrair `video_id`), `front-page.php` (marcação com `data-video-id`), `assets/js/main.js` (injeção do iframe + playlist), `assets/css/main.css` (estados do player, proporção 16:9, transição).

## 2. Instagram — Plugin Smash Balloon (Instagram Feed)

- Instalar/ativar via WP-CLI: `wp plugin install instagram-feed --activate`.
- `front-page.php`: a seção "No Instagram" renderiza o feed do plugin (shortcode `[instagram-feed]` via `do_shortcode`) **quando o plugin está ativo e há feed configurado**; caso contrário, mantém os cards manuais atuais (CPT `card_social`) como fallback gracioso. Detecção: `shortcode_exists( 'instagram-feed' )` + saída não vazia.
- Cabeçalho da seção ("No Instagram" + "Ver perfil") permanece o do tema.
- CSS de integração: sobrescrever espaçamento, cantos arredondados e tipografia do widget do plugin para casar com o design system do site (tokens já existentes em `main.css`).
- **Passo manual do usuário:** conectar a conta do Instagram do sindicato no admin do plugin (requer login do Instagram — fora do alcance da automação). Até lá, o fallback manual continua no ar. Documentar o passo na entrega.
- CPT `card_social` **não é removido** — é o fallback permanente.

## 3. Bugs Catalogados

Cada um será reproduzido no site local antes da correção (systematic debugging) e verificado depois.

| # | Bug | Arquivo | Correção |
|---|---|---|---|
| 1 | Links do menu com âncora pura (`#convencoes`, `#midia`, `#contato`) quebram fora da home | `header.php` | Prefixar com `home_url( '/#...' )`; âncoras continuam funcionando na home |
| 2 | Topbar/CTA: `#associado` e `#filie-se` têm o mesmo problema | `header.php` | Idem |
| 3 | Cards de notícia ignoram a imagem destacada do post (arte decorativa fixa) | `front-page.php` | Usar `get_the_post_thumbnail_url()` com fallback na arte decorativa atual quando o post não tem imagem |
| 4 | Telefone e WhatsApp não tocáveis (sem `tel:`/`wa.me`) | `header.php`, `footer.php` | Links `tel:` e `https://wa.me/{número}` (normalizando o número salvo nas configurações) |
| 5 | Newsletter morta (`action="#"`) | `footer.php` | Ligar a um formulário Contact Form 7 dedicado (plugin já no stack); se CF7 não estiver ativo, ocultar o bloco em vez de exibir formulário quebrado |
| 6 | Código morto em `main.js` (`.episode-list` não existe mais) | `assets/js/main.js` | Remover |
| 7 | Hero de 1,6 MB (`hero-assembleia-sindicato.png`) | `assets/img/` | Reduzir dimensões ao necessário e converter para WebP (manter PNG como fallback só se preciso) |
| 8 | Aviso urgente não aparece se o post não tem meta `_sind_prioridade` (o `meta_key` no query exclui posts sem o meta) | `inc/template-tags.php` | Query sem exigir o meta de prioridade (ordenar com `meta_query`/`orderby` tolerante a ausência) |

Bugs adicionais encontrados durante a implementação entram na mesma esteira (reproduzir → corrigir → verificar).

## 4. Animações Sutis

CSS-first + um único `IntersectionObserver` em vanilla JS. **Toda animação dentro de `@media (prefers-reduced-motion: no-preference)`.**

- **Reveal ao rolar:** seções/cards com classe `.reveal` ganham fade + translate leve (~16px, ~400ms) quando entram no viewport; observer remove a classe após animar (anima uma vez só).
- **Cards:** elevação com sombra e translate sutil no hover/touch (notícias, acesso rápido, quick-cards, Instagram).
- **Menu mobile:** transição de abertura (altura/opacidade) em vez de aparecer seco.
- **Alert-strip (comunicado urgente):** uma pulsação única na entrada — não permanente.
- **Player YouTube:** fade thumbnail → iframe.
- **Âncoras:** `scroll-behavior: smooth` (também condicionado a reduced-motion).
- **Botões:** feedback de pressionar (scale ~0.98) e transição de cor.

Nada de parallax, contadores ou animações de entrada no hero (decisão do usuário: sutis e funcionais).

## 5. Verificação

- Seed de conteúdo via WP-CLI conforme convenção do projeto; `curl -s http://localhost/sindicato/ | grep <marcador>` para cada mudança de marcação.
- **Screenshots reais obrigatórios** (headless, viewport mobile 390px e desktop 1280px) para: player embutido aberto, feed/fallback do Instagram, menu mobile, cards com imagem destacada, animações desativadas sob reduced-motion (checagem de classe/CSS).
- Player embutido: verificar no navegador que o clique injeta o iframe e o vídeo reproduz (não dá para verificar por grep).
- Bugs: cada correção tem um passo "antes" (reproduzir) e "depois" (confirmar).
- Regressão: home continua renderizando com plugin do Instagram inativo (fallback) e com canal do YouTube não configurado (mensagem institucional).

## Fora De Escopo

- Conectar a conta do Instagram (passo manual do usuário).
- Mudanças no mockup estático (`index.html` da raiz).
- Redesign visual além das animações e integrações descritas.
