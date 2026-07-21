# Unificação Podcast/YouTube Design

## Contexto

Hoje a home tem duas colunas separadas na seção `#midia`: "Podcast do Sindicato" (CPT `podcast_episodio`, cadastro manual por episódio com link de player) e "Vídeos do YouTube" (CPT `video`, cadastro manual por vídeo com URL do YouTube). O sindicato publica o podcast como vídeos no próprio canal do YouTube — não existe um podcast separado em outra plataforma. Isso torna as duas colunas redundantes e exige cadastro manual de cada vídeo, um por um.

## Objetivo

Substituir as duas colunas por uma única seção "Podcast do Sindicato" que busca os vídeos automaticamente a partir do link do canal do YouTube (sem precisar cadastrar cada vídeo manualmente), com uma opção de anunciar o próximo episódio (com imagem e texto) antes dele estar disponível no YouTube.

## Arquitetura E Fluxo De Dados

- Os vídeos vêm do **feed RSS público do canal** (`https://www.youtube.com/feeds/videos.xml?channel_id=UC...`), não da YouTube Data API — evita chave de API, projeto no Google Cloud e cota para manter. Testado neste ambiente: `wp_remote_get()` alcança o feed com sucesso (HTTP 200).
- O campo já existente `youtube_url` (nas configurações de contato) continua sendo onde o editor cola o link do canal, em qualquer formato (`/@handle`, `/channel/UC...`, `/c/nome`, `/user/nome`).
- Como o feed RSS exige um `channel_id` (`UC...`) e o editor pode colar qualquer formato de URL, uma função resolve o link para o `channel_id`:
  - Se a URL já contém `/channel/UC.../`, extrai o ID diretamente (sem chamada de rede).
  - Caso contrário (`@handle`, `/c/nome`, `/user/nome`), busca a página do canal uma vez via `wp_remote_get()` e extrai o `channel_id` canônico do HTML.
  - O `channel_id` resolvido com sucesso fica em cache (opção do WordPress, não transient) associado à URL de origem — só tenta resolver de novo se a URL mudar. Uma **falha** de resolução também fica em cache, mas por apenas 10 minutos (mesmo intervalo curto da falha de busca do feed, abaixo), para não repetir uma requisição de rede lenta a cada carregamento de página enquanto o link estiver com problema.
- A lista de vídeos (resultado do parse do RSS) fica em cache por **1 hora** (`transient` do WordPress). Uma falha de rede/resolução é cacheada por apenas **10 minutos** (tenta de novo em breve), enquanto um resultado válido — mesmo que com zero vídeos — respeita o cache de 1 hora.
- A home mostra até **5 vídeos** recentes na lista, além do destaque.

## Próximo Episódio

Registro único (não é uma coleção/CPT), configurado via uma página de configurações nativa (Settings API, mesmo padrão da página de contato), com os campos:

- `titulo`
- `descricao`
- `imagem` (upload via biblioteca de mídia, mesmo padrão usado no campo de PDF do CPT `documento`)
- `data_hora_estreia` (data e hora em que o episódio estreia no YouTube)
- `ativo` (permite cancelar manualmente antes da data, se necessário)

Regra: o card "Próximo Episódio" aparece na home **somente se** `ativo = true` **e** a data/hora atual for **anterior** a `data_hora_estreia`. Depois que a data/hora passa, o card some automaticamente — não é necessário desativar manualmente, pois a essa altura o vídeo real já deve estar publicado no canal e vai aparecer sozinho na lista buscada do YouTube.

Quando o card está ativo, ele ocupa o **destaque** (posição de maior destaque, no topo da seção), com imagem, título, descrição e o rótulo "Próximo Episódio" — sem link/botão (não há nada para tocar ainda). A lista de vídeos reais do canal continua aparecendo normalmente abaixo. Quando não há Próximo Episódio ativo, o destaque volta a ser o vídeo mais recente do canal (buscado via RSS).

## Fallbacks E Tratamento De Erros

| Situação | Comportamento |
|---|---|
| Nenhum link de canal cadastrado | Mensagem institucional atual ("Em breve, novos vídeos... Acesse o canal") |
| Link cadastrado, mas não foi possível resolver o `channel_id` | Front-end mostra a mesma mensagem de fallback. Na página de configurações, aparece um aviso claro: "Não foi possível identificar o canal a partir do link informado — tente o formato youtube.com/channel/UC...". |
| Canal resolvido, mas a busca do feed falhou (rede/YouTube fora do ar) | Mensagem de fallback no front-end; cache curto de 10 minutos para tentar de novo em breve. |
| Canal resolvido, feed OK, mas zero vídeos publicados | Mensagem de fallback no front-end; cache normal de 1 hora (não é um erro, é um estado válido). |
| Próximo Episódio ativo, mas o canal ainda não tem nenhum vídeo real | Destaque mostra o Próximo Episódio; a lista de vídeos abaixo simplesmente não aparece (sem caixa vazia), como já acontece em outras seções condicionais do site. |

## Estrutura De Arquivos

**Remover:**
- `wp-content/themes/sindicato/inc/cpt-podcast.php`
- `wp-content/themes/sindicato/inc/cpt-video.php`
- Funções `sindicato_get_podcast_destaque()`, `sindicato_get_podcast_lista()`, `sindicato_get_video_destaque()`, `sindicato_get_video_lista()` de `inc/template-tags.php`
- Os dois `require` correspondentes em `functions.php`

**Criar:**
- `wp-content/themes/sindicato/inc/settings-proximo-episodio.php` — página de configurações (Settings API) + `sindicato_get_proximo_episodio()`
- `wp-content/themes/sindicato/inc/youtube.php` — `sindicato_resolver_youtube_channel_id( $url )`, função interna de busca/parse/cache do feed, e `sindicato_get_youtube_videos( $limit )` (função pública usada pelos templates)

**Modificar:**
- `functions.php` — trocar os requires dos CPTs removidos pelos dois novos arquivos
- `front-page.php` — substituir a seção `#midia` de duas colunas por uma única seção "Podcast do Sindicato" (destaque + lista)
- `assets/css/main.css` / `styles.css` — `.media-grid` deixa de ser grid de 2 colunas; pequenos estilos novos para o rótulo "Próximo Episódio" e a capa do destaque (reaproveitando o padrão de imagem de fundo já usado no hero/banner)

**Interfaces:**
- `sindicato_get_proximo_episodio()` → `array|null` com `titulo`, `descricao`, `imagem_url`, `data_hora_estreia`
- `sindicato_resolver_youtube_channel_id( string $url )` → `string|null` (channel_id ou null se não resolveu)
- `sindicato_get_youtube_videos( int $limit )` → `array` de itens com `titulo`, `link`, `thumbnail_url`, `data_publicacao` (vazio se não houver canal configurado, resolução falhar, ou busca falhar)

## Teste

Sem PHPUnit neste ambiente (mesma limitação do restante do projeto) — verificação via WP-CLI (definir a URL do canal, forçar/expirar cache, checar transients) + `curl`/`grep` no HTML renderizado. Como esta é uma mudança de layout visual (fundir duas colunas em uma, reposicionar o destaque), a verificação **também exige um screenshot real** da home (via navegador headless), não apenas checagem por texto — grep sozinho não detecta um layout quebrado.

Cenários obrigatórios:
1. Nenhum canal configurado → mensagem de fallback.
2. Canal configurado com link `/channel/UC.../` (sem precisar resolver) → vídeos aparecem.
3. Canal configurado com link `/@handle` (precisa resolver) → resolução funciona, vídeos aparecem.
4. Link não resolvível → fallback no front-end + aviso no admin.
5. Próximo Episódio ativo, com vídeos reais existentes → destaque = Próximo Episódio, lista = vídeos reais.
6. Próximo Episódio ativo, sem vídeos reais ainda → destaque = Próximo Episódio, lista não aparece.
7. Próximo Episódio com `data_hora_estreia` no passado → não aparece mais, destaque volta a ser o vídeo mais recente.
8. Cache: confirmar que o transient de vídeos expira em 1h (sucesso) e 10min (falha).
