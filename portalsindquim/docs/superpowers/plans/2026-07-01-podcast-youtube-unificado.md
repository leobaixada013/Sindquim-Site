# Unificação Podcast/YouTube Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir as duas colunas atuais da home ("Podcast do Sindicato" via CPT manual + "Vídeos do YouTube" via CPT manual) por uma única seção "Podcast do Sindicato" que busca os vídeos automaticamente do feed RSS público do canal do YouTube já cadastrado (`youtube_url`), sem cadastro manual por vídeo, com uma opção de anunciar o próximo episódio (imagem + título + descrição + data/hora de estreia) antes dele estar disponível no YouTube.

**Architecture:** Duas fontes de dados novas substituem os CPTs `podcast_episodio` e `video`: (1) `inc/youtube.php` resolve o link de canal cadastrado para um `channel_id` (com cache em `option`) e busca/parseia o feed RSS público do canal (`https://www.youtube.com/feeds/videos.xml?channel_id=...`), com resultado em `transient` (1h sucesso / 10min falha); (2) `inc/settings-proximo-episodio.php` é uma página de configurações nativa (Settings API, mesmo padrão de `settings-contato.php`) para um registro único "Próximo Episódio" com expiração automática por data/hora. `front-page.php` combina as duas fontes numa única seção.

**Tech Stack:** WordPress 7.0 (mesmo ambiente local já provisionado), PHP nativo, `wp_remote_get()` + `simplexml_load_string()` para o feed RSS, Settings API + `wp.media()` para configurações e upload de imagem, WP-CLI (`wp eval`, `wp option`, `wp transient`) para verificação.

## Global Constraints

- Ambiente local já provisionado: WordPress em `C:\xampp\htdocs\sindicato`, admin `admin`/`admin123`, URL `http://localhost/sindicato/`. O tema vive em `wp-content/themes/sindicato/` e está linkado por **junction** do Windows em `C:\xampp\htdocs\sindicato\wp-content\themes\sindicato` — editar em um local reflete no outro instantaneamente.
- Todo comando WP-CLI deve ser executado assim: `"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" <comando> --path="/c/xampp/htdocs/sindicato" --allow-root`
- **Cuidado com o Git Bash (MSYS)**: um argumento de linha de comando que é uma string isolada começando com `/` (ex.: `/noticias/`) é convertido para um caminho de arquivo do Windows antes de chegar ao `wp-cli`, corrompendo o valor. Para valores desse tipo (URLs relativas, `/channel/UC.../`), sempre usar a URL completa (`http://localhost/sindicato/...` ou `https://www.youtube.com/channel/...`) ou rodar via PowerShell em vez de Git Bash.
- Sem PHPUnit neste ambiente. "Teste" = semear estado via WP-CLI (`wp eval`, `wp option update`, `wp transient`) e verificar via `curl -s <url> | grep <marcador>`. Mudanças de layout visual exigem também um screenshot real (headless): Chrome está quebrado nesta máquina (sessões existentes impedem modo headless isolado); usar Microsoft Edge headless — `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --user-data-dir="C:\temp-edge-verify-profile" --screenshot="<caminho>.png" --window-size=1440,1200 <url>`.
- **`get_option()` com default explícito ignora o default de `register_setting()`**: sempre ler configurações via `get_option( 'chave' )` (sem segundo argumento) e aplicar `wp_parse_args()` com uma função `_defaults()` — nunca `get_option( 'chave', array() )`. (Bug real já encontrado neste projeto em `sindicato_contato`; o mesmo padrão de leitura deve ser usado para a nova opção `sindicato_proximo_episodio`.)
- **`WP_Query` com `orderby => meta_value_num` só ordena pelo `meta_key` de nível superior** (não um aninhado em `meta_query`). Não é relevante para este plano (não há nenhuma query desse tipo aqui), mas documentado porque já causou um bug real neste tema.
- **Comparação de data/hora do "Próximo Episódio" deve usar `wp_timezone()` explicitamente**: o campo `data_hora_estreia` vem de um `<input type="datetime-local">`, que não carrega timezone. Comparar com `current_time( 'timestamp' )` (que soma o offset do site a `gmdate()`) enquanto se usa `strtotime()` simples (que assume o timezone padrão do PHP, normalmente UTC) produz resultados incorretos sempre que o timezone do site (`Ajustes > Geral` no WP-Admin) não for UTC. A forma correta e usada neste plano é `date_create_immutable( $valor, wp_timezone() )->getTimestamp()` comparado com `time()` — ambos são timestamps UTC reais, sem ambiguidade de timezone.
- O feed RSS do YouTube é XML Atom com namespaces (`yt:`, `media:`). Usar `libxml_use_internal_errors( true )` antes de `simplexml_load_string()` (o feed pode vir vazio/malformado em erro de rede) e acessar campos do namespace `media` via `$entry->children( 'http://search.yahoo.com/mrss/' )`.
- `youtube_url` (em `sindicato_contato`) deve continuar vazio por padrão neste ambiente — nenhum canal real foi confirmado ainda. Os passos de teste abaixo usam temporariamente um canal público real e estável (NASA, `UCLA_DiR1FfKNvjuUpBHmylQ`) apenas para validar o mecanismo de busca/parse do feed; cada task que usa isso deve terminar limpando o valor de volta para vazio (`wp eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => '')));"`).
- Fora de escopo: YouTube Data API (usa-se RSS público), embed de vídeo inline (mantém-se link "Assistir no YouTube"/thumbnail, sem player embutido), múltiplos "Próximos Episódios" simultâneos (é um registro único, não uma coleção).

---

## Estrutura De Arquivos

```
wp-content/themes/sindicato/
  functions.php                        Remove requires de cpt-podcast.php/cpt-video.php;
                                        adiciona requires de inc/youtube.php e
                                        inc/settings-proximo-episodio.php
  front-page.php                       Seção #midia unificada
  assets/css/main.css                  .podcast-feature / .podcast-list substituem
                                        .media-grid / .podcast-card / .video-feature / .video-list
  inc/
    youtube.php                        [NOVO] sindicato_resolver_youtube_channel_id(),
                                        sindicato_get_youtube_videos()
    settings-proximo-episodio.php      [NOVO] Settings API + sindicato_get_proximo_episodio()
    settings-contato.php                Adiciona aviso de canal não resolvido no campo youtube_url
    template-tags.php                   Remove as 4 funções de podcast/vídeo (obsoletas)
    cpt-podcast.php                     [REMOVER]
    cpt-video.php                       [REMOVER]

(raiz do repo)
  styles.css                           Mantido em sincronia com assets/css/main.css (cópia integral)
```

**Interfaces entre tasks:**
- `sindicato_resolver_youtube_channel_id( string $url )` → `string|null` (Task 1)
- `sindicato_get_youtube_videos( int $limit = 5 )` → `array` de `['titulo' => string, 'link' => string, 'thumbnail_url' => string, 'data_publicacao' => string]` (Task 1)
- `sindicato_get_proximo_episodio()` → `array|null` com `['titulo' => string, 'descricao' => string, 'imagem_url' => string, 'data_hora_estreia' => string]` (Task 2)

---

## Task 1: Resolução De Canal E Busca De Vídeos Do YouTube

**Files:**
- Create: `wp-content/themes/sindicato/inc/youtube.php`
- Modify: `wp-content/themes/sindicato/inc/settings-contato.php`
- Modify: `wp-content/themes/sindicato/functions.php`

**Interfaces:**
- Consumes: `sindicato_get_contato( 'youtube_url' )` (já existe em `inc/settings-contato.php`)
- Produces: `sindicato_resolver_youtube_channel_id( string $url ): string|null`; `sindicato_get_youtube_videos( int $limit = 5 ): array`

- [ ] **Step 1: Criar `inc/youtube.php`**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_resolver_youtube_channel_id( $url ) {
    $url = trim( (string) $url );
    if ( '' === $url ) {
        return null;
    }

    if ( preg_match( '#/channel/(UC[a-zA-Z0-9_-]{10,})#', $url, $match ) ) {
        return $match[1];
    }

    $cache = get_option( 'sindicato_youtube_channel_resolvido' );
    if ( is_array( $cache ) && isset( $cache['url'] ) && $cache['url'] === $url ) {
        if ( ! empty( $cache['channel_id'] ) ) {
            return $cache['channel_id'];
        }
        if ( ! empty( $cache['falhou_em'] ) && ( time() - (int) $cache['falhou_em'] ) < 10 * MINUTE_IN_SECONDS ) {
            return null;
        }
    }

    $resposta = wp_remote_get( $url, array( 'timeout' => 8 ) );
    if ( is_wp_error( $resposta ) || 200 !== wp_remote_retrieve_response_code( $resposta ) ) {
        update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => '', 'falhou_em' => time() ) );
        return null;
    }

    $corpo = wp_remote_retrieve_body( $resposta );
    if ( ! preg_match( '#<link rel="canonical" href="https://www\.youtube\.com/channel/(UC[a-zA-Z0-9_-]{10,})"#', $corpo, $match ) ) {
        update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => '', 'falhou_em' => time() ) );
        return null;
    }

    update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => $match[1], 'falhou_em' => null ) );
    return $match[1];
}

function sindicato_get_youtube_videos( $limit = 5 ) {
    $youtube_url = sindicato_get_contato( 'youtube_url' );
    if ( '' === trim( (string) $youtube_url ) ) {
        return array();
    }

    $channel_id = sindicato_resolver_youtube_channel_id( $youtube_url );
    if ( ! $channel_id ) {
        return array();
    }

    $chave_cache = 'sindicato_youtube_videos_' . md5( $channel_id );
    $cache       = get_transient( $chave_cache );
    if ( is_array( $cache ) ) {
        return array_slice( $cache, 0, $limit );
    }

    $resposta = wp_remote_get( 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode( $channel_id ), array( 'timeout' => 8 ) );
    if ( is_wp_error( $resposta ) || 200 !== wp_remote_retrieve_response_code( $resposta ) ) {
        set_transient( $chave_cache, array(), 10 * MINUTE_IN_SECONDS );
        return array();
    }

    $corpo = wp_remote_retrieve_body( $resposta );
    libxml_use_internal_errors( true );
    $xml = simplexml_load_string( $corpo );
    if ( false === $xml || ! isset( $xml->entry ) ) {
        set_transient( $chave_cache, array(), 10 * MINUTE_IN_SECONDS );
        return array();
    }

    $videos = array();
    foreach ( $xml->entry as $entry ) {
        $media      = $entry->children( 'http://search.yahoo.com/mrss/' );
        $link_attrs = $entry->link->attributes();
        $thumb_url  = '';
        if ( isset( $media->group->thumbnail ) ) {
            $thumb_attrs = $media->group->thumbnail->attributes();
            $thumb_url   = (string) $thumb_attrs['url'];
        }
        $videos[] = array(
            'titulo'          => (string) $entry->title,
            'link'            => (string) $link_attrs['href'],
            'thumbnail_url'   => $thumb_url,
            'data_publicacao' => (string) $entry->published,
        );
    }

    set_transient( $chave_cache, $videos, HOUR_IN_SECONDS );
    return array_slice( $videos, 0, $limit );
}
```

- [ ] **Step 2: Adicionar aviso de canal não resolvido em `inc/settings-contato.php`**

Modificar a função `sindicato_render_campo_contato` (final do arquivo), adicionando o aviso logo após o `printf` existente:

```php
function sindicato_render_campo_contato( $args ) {
    $valores = get_option( 'sindicato_contato' );
    if ( ! is_array( $valores ) ) {
        $valores = array();
    }
    $valores = wp_parse_args( $valores, sindicato_contato_defaults() );
    $chave   = $args['chave'];
    $valor   = isset( $valores[ $chave ] ) ? $valores[ $chave ] : '';
    printf(
        '<input type="text" name="sindicato_contato[%1$s]" value="%2$s" class="regular-text" />',
        esc_attr( $chave ),
        esc_attr( $valor )
    );

    if ( 'youtube_url' === $chave && '' !== trim( (string) $valor ) ) {
        $cache = get_option( 'sindicato_youtube_channel_resolvido' );
        if ( is_array( $cache ) && isset( $cache['url'] ) && $cache['url'] === $valor && empty( $cache['channel_id'] ) && ! empty( $cache['falhou_em'] ) ) {
            printf(
                '<p class="description" style="color:#b32d2e;">%s</p>',
                esc_html__( 'Não foi possível identificar o canal a partir do link informado — tente o formato youtube.com/channel/UC...', 'sindicato' )
            );
        }
    }
}
```

- [ ] **Step 3: Adicionar o require em `functions.php`**

Localizar o bloco de requires (linhas 22-29) e adicionar a nova linha logo após `settings-contato.php`:

```php
require get_template_directory() . '/inc/settings-contato.php';
require get_template_directory() . '/inc/youtube.php';
require get_template_directory() . '/inc/template-tags.php';
```

- [ ] **Step 4: Testar resolução direta por `/channel/UC.../` (cenário 2 da spec) e busca de vídeos**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/channel/UCLA_DiR1FfKNvjuUpBHmylQ')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_resolver_youtube_channel_id(sindicato_get_contato('youtube_url')));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `string(24) "UCLA_DiR1FfKNvjuUpBHmylQ"` (extraído sem chamada de rede, direto do regex).

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(count(sindicato_get_youtube_videos(5)));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `int(5)` (canal da NASA tem centenas de vídeos publicados).

- [ ] **Step 5: Testar resolução via `/@handle` (cenário 3 da spec)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option delete sindicato_youtube_channel_resolvido --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/@NASA')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_resolver_youtube_channel_id(sindicato_get_contato('youtube_url')));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `string(24) "UCLA_DiR1FfKNvjuUpBHmylQ"` (resolvido via busca de página + regex do `link rel="canonical"`).

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option get sindicato_youtube_channel_resolvido --format=json --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: JSON com `"channel_id":"UCLA_DiR1FfKNvjuUpBHmylQ"` e `"falhou_em":null`.

- [ ] **Step 6: Testar link não resolvível (cenário 4 da spec)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/@este-handle-nao-existe-xyz123abc')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_resolver_youtube_channel_id(sindicato_get_contato('youtube_url')));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `NULL`.

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_get_youtube_videos(5));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `array(0) {}`.

Verificar o aviso no admin: acessar `http://localhost/sindicato/wp-admin/options-general.php?page=sindicato-contato` logado como `admin`/`admin123` e confirmar visualmente que aparece o texto "Não foi possível identificar o canal...". (Requer sessão autenticada — não dá para `curl` sem cookies; verificação visual manual ou via `wp eval` checando a condição diretamente é suficiente.)

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "\$c = get_option('sindicato_youtube_channel_resolvido'); var_dump(empty(\$c['channel_id']) && !empty(\$c['falhou_em']));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `bool(true)` (condição que ativa o aviso no admin está satisfeita).

- [ ] **Step 7: Testar durações de cache (cenário 8 da spec)**

Restaurar o canal válido e checar o timeout do transient de sucesso:

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/channel/UCLA_DiR1FfKNvjuUpBHmylQ')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" transient delete --all --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "sindicato_get_youtube_videos(5);" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "\$k = '_transient_timeout_sindicato_youtube_videos_' . md5('UCLA_DiR1FfKNvjuUpBHmylQ'); \$t = (int) get_option(\$k); echo (\$t - time());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: um número próximo de `3600` (1 hora em segundos, com pequena margem pelo tempo de execução).

Forçar uma falha (canal inválido) e checar o timeout do transient de falha:

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/channel/UCinvalidoinvalidoinvalido')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" transient delete --all --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "sindicato_get_youtube_videos(5);" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "\$k = '_transient_timeout_sindicato_youtube_videos_' . md5('UCinvalidoinvalidoinvalido'); \$t = (int) get_option(\$k); echo (\$t - time());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: um número próximo de `600` (10 minutos em segundos).

- [ ] **Step 8: Limpar estado de teste e commitar**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => '')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option delete sindicato_youtube_channel_resolvido --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" transient delete --all --path="/c/xampp/htdocs/sindicato" --allow-root
```

```bash
git add wp-content/themes/sindicato/inc/youtube.php wp-content/themes/sindicato/inc/settings-contato.php wp-content/themes/sindicato/functions.php
git commit -m "feat: resolver channel_id e buscar videos do YouTube via feed RSS"
```

---

## Task 2: Configuração De Próximo Episódio

**Files:**
- Create: `wp-content/themes/sindicato/inc/settings-proximo-episodio.php`
- Modify: `wp-content/themes/sindicato/functions.php`

**Interfaces:**
- Produces: `sindicato_get_proximo_episodio(): array|null`

- [ ] **Step 1: Criar `inc/settings-proximo-episodio.php`**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_proximo_episodio_defaults() {
    return array(
        'titulo'            => '',
        'descricao'         => '',
        'imagem_id'         => 0,
        'data_hora_estreia' => '',
        'ativo'             => '0',
    );
}

function sindicato_get_proximo_episodio_valores() {
    $valores = get_option( 'sindicato_proximo_episodio' );
    if ( ! is_array( $valores ) ) {
        $valores = array();
    }
    return wp_parse_args( $valores, sindicato_proximo_episodio_defaults() );
}

function sindicato_get_proximo_episodio() {
    $valores = sindicato_get_proximo_episodio_valores();

    if ( '1' !== $valores['ativo'] || '' === trim( (string) $valores['data_hora_estreia'] ) ) {
        return null;
    }

    $estreia = date_create_immutable( $valores['data_hora_estreia'], wp_timezone() );
    if ( ! $estreia || time() >= $estreia->getTimestamp() ) {
        return null;
    }

    return array(
        'titulo'            => $valores['titulo'],
        'descricao'         => $valores['descricao'],
        'imagem_url'        => $valores['imagem_id'] ? (string) wp_get_attachment_image_url( (int) $valores['imagem_id'], 'large' ) : '',
        'data_hora_estreia' => $valores['data_hora_estreia'],
    );
}

function sindicato_registrar_configuracoes_proximo_episodio() {
    register_setting( 'sindicato_proximo_episodio_group', 'sindicato_proximo_episodio', array(
        'type'              => 'array',
        'sanitize_callback' => 'sindicato_sanitizar_proximo_episodio',
        'default'           => sindicato_proximo_episodio_defaults(),
    ) );

    add_settings_section( 'sindicato_proximo_episodio_section', 'Próximo Episódio', '__return_false', 'sindicato-proximo-episodio' );

    add_settings_field( 'sind_pe_titulo', 'Título', 'sindicato_render_pe_titulo', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_descricao', 'Descrição', 'sindicato_render_pe_descricao', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_imagem', 'Imagem', 'sindicato_render_pe_imagem', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_data_hora_estreia', 'Data e hora de estreia', 'sindicato_render_pe_data_hora_estreia', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_ativo', 'Ativo', 'sindicato_render_pe_ativo', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
}
add_action( 'admin_init', 'sindicato_registrar_configuracoes_proximo_episodio' );

function sindicato_sanitizar_proximo_episodio( $input ) {
    $input = (array) $input;
    return array(
        'titulo'            => isset( $input['titulo'] ) ? sanitize_text_field( $input['titulo'] ) : '',
        'descricao'         => isset( $input['descricao'] ) ? sanitize_textarea_field( $input['descricao'] ) : '',
        'imagem_id'         => isset( $input['imagem_id'] ) ? absint( $input['imagem_id'] ) : 0,
        'data_hora_estreia' => isset( $input['data_hora_estreia'] ) ? sanitize_text_field( $input['data_hora_estreia'] ) : '',
        'ativo'             => ! empty( $input['ativo'] ) ? '1' : '0',
    );
}

function sindicato_render_pe_titulo() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<input type="text" name="sindicato_proximo_episodio[titulo]" value="%s" class="regular-text" />', esc_attr( $valores['titulo'] ) );
}

function sindicato_render_pe_descricao() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<textarea name="sindicato_proximo_episodio[descricao]" rows="4" class="large-text">%s</textarea>', esc_textarea( $valores['descricao'] ) );
}

function sindicato_render_pe_imagem() {
    $valores   = sindicato_get_proximo_episodio_valores();
    $imagem_id = (int) $valores['imagem_id'];
    wp_enqueue_media();
    ?>
    <input type="hidden" id="sind_pe_imagem_id" name="sindicato_proximo_episodio[imagem_id]" value="<?php echo esc_attr( $imagem_id ); ?>" />
    <button type="button" class="button" id="sind_pe_selecionar_imagem">Selecionar imagem</button>
    <div id="sind_pe_imagem_preview" style="margin-top:10px;">
        <?php if ( $imagem_id ) : ?>
            <img src="<?php echo esc_url( wp_get_attachment_image_url( $imagem_id, 'medium' ) ); ?>" style="max-width:220px;height:auto;display:block;" />
        <?php endif; ?>
    </div>
    <script>
    (function () {
        var botao = document.getElementById('sind_pe_selecionar_imagem');
        if (!botao) { return; }
        botao.addEventListener('click', function (evento) {
            evento.preventDefault();
            var frame = wp.media({ title: 'Selecionar imagem', library: { type: 'image' }, button: { text: 'Usar esta imagem' }, multiple: false });
            frame.on('select', function () {
                var anexo = frame.state().get('selection').first().toJSON();
                document.getElementById('sind_pe_imagem_id').value = anexo.id;
                var preview = document.getElementById('sind_pe_imagem_preview');
                preview.innerHTML = '<img src="' + anexo.url + '" style="max-width:220px;height:auto;display:block;" />';
            });
            frame.open();
        });
    })();
    </script>
    <?php
}

function sindicato_render_pe_data_hora_estreia() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<input type="datetime-local" name="sindicato_proximo_episodio[data_hora_estreia]" value="%s" />', esc_attr( $valores['data_hora_estreia'] ) );
}

function sindicato_render_pe_ativo() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf(
        '<label><input type="checkbox" name="sindicato_proximo_episodio[ativo]" value="1" %s /> Exibir na home</label>',
        checked( $valores['ativo'], '1', false )
    );
}

function sindicato_adicionar_menu_proximo_episodio() {
    add_options_page( 'Próximo Episódio', 'Próximo Episódio', 'manage_options', 'sindicato-proximo-episodio', 'sindicato_renderizar_pagina_proximo_episodio' );
}
add_action( 'admin_menu', 'sindicato_adicionar_menu_proximo_episodio' );

function sindicato_renderizar_pagina_proximo_episodio() {
    ?>
    <div class="wrap">
        <h1>Próximo Episódio</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'sindicato_proximo_episodio_group' );
            do_settings_sections( 'sindicato-proximo-episodio' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

- [ ] **Step 2: Adicionar o require em `functions.php`**

```php
require get_template_directory() . '/inc/settings-contato.php';
require get_template_directory() . '/inc/youtube.php';
require get_template_directory() . '/inc/settings-proximo-episodio.php';
require get_template_directory() . '/inc/template-tags.php';
```

- [ ] **Step 3: Testar estado inativo (default)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option delete sindicato_proximo_episodio --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_get_proximo_episodio());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `NULL`.

- [ ] **Step 4: Testar estado ativo com data futura**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12 - Reforma trabalhista', 'descricao' => 'Um resumo do que muda para a categoria.', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('+2 days')), 'ativo' => '1'));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_get_proximo_episodio());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `array` com `titulo` = "Episódio 12 - Reforma trabalhista" e as demais chaves preenchidas.

- [ ] **Step 5: Testar estado ativo com data passada (expiração automática)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12', 'descricao' => '', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('-2 hours')), 'ativo' => '1'));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_get_proximo_episodio());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `NULL` (data já passou, mesmo com `ativo = '1'`).

- [ ] **Step 6: Testar `ativo = false` com data futura (cancelamento manual)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12', 'descricao' => '', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('+2 days')), 'ativo' => '0'));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "var_dump(sindicato_get_proximo_episodio());" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Esperado: `NULL`.

- [ ] **Step 7: Restaurar estado ativo com data futura (será usado no Task 3) e commitar**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12 - Reforma trabalhista', 'descricao' => 'Um resumo do que muda para a categoria.', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('+2 days')), 'ativo' => '1'));" --path="/c/xampp/htdocs/sindicato" --allow-root
```

```bash
git add wp-content/themes/sindicato/inc/settings-proximo-episodio.php wp-content/themes/sindicato/functions.php
git commit -m "feat: configuracao de proximo episodio com expiracao automatica por data/hora"
```

---

## Task 3: Unificar A Seção Na Home E Remover Os CPTs Antigos

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php`
- Modify: `wp-content/themes/sindicato/inc/template-tags.php`
- Modify: `wp-content/themes/sindicato/functions.php`
- Modify: `wp-content/themes/sindicato/assets/css/main.css`
- Modify: `styles.css` (raiz do repo — cópia integral de `assets/css/main.css`, mantida em sincronia)
- Remove: `wp-content/themes/sindicato/inc/cpt-podcast.php`
- Remove: `wp-content/themes/sindicato/inc/cpt-video.php`

**Interfaces:**
- Consumes: `sindicato_get_proximo_episodio()` (Task 2), `sindicato_get_youtube_videos( int $limit )` (Task 1)

- [ ] **Step 1: Remover funções obsoletas de `inc/template-tags.php`**

Remover do arquivo (linhas 95-117 na versão atual) as quatro funções:

```php
function sindicato_get_podcast_destaque() {
    $episodios = get_posts( array(
        'post_type' => 'podcast_episodio', 'post_status' => 'publish', 'posts_per_page' => 1,
        'meta_key' => '_sind_destaque_home', 'meta_value' => '1',
    ) );
    return $episodios ? $episodios[0] : null;
}

function sindicato_get_podcast_lista( $limit ) {
    return get_posts( array( 'post_type' => 'podcast_episodio', 'post_status' => 'publish', 'posts_per_page' => $limit, 'orderby' => 'date', 'order' => 'DESC' ) );
}

function sindicato_get_video_destaque() {
    $videos = get_posts( array(
        'post_type' => 'video', 'post_status' => 'publish', 'posts_per_page' => 1,
        'meta_key' => '_sind_destaque_home', 'meta_value' => '1',
    ) );
    return $videos ? $videos[0] : null;
}

function sindicato_get_video_lista( $limit ) {
    return get_posts( array( 'post_type' => 'video', 'post_status' => 'publish', 'posts_per_page' => $limit, 'orderby' => 'date', 'order' => 'DESC' ) );
}
```

(A função `sindicato_get_cards_sociais()` logo depois permanece intacta.)

- [ ] **Step 2: Remover os requires dos CPTs antigos em `functions.php` e apagar os arquivos**

Em `functions.php`, remover estas duas linhas do bloco de requires:

```php
require get_template_directory() . '/inc/cpt-podcast.php';
require get_template_directory() . '/inc/cpt-video.php';
```

O bloco de requires final deve ficar:

```php
require get_template_directory() . '/inc/settings-contato.php';
require get_template_directory() . '/inc/youtube.php';
require get_template_directory() . '/inc/settings-proximo-episodio.php';
require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/cpt-aviso.php';
require get_template_directory() . '/inc/cpt-banner.php';
require get_template_directory() . '/inc/cpt-card-social.php';
require get_template_directory() . '/inc/cpt-documento.php';
```

Apagar os arquivos:

```bash
git rm wp-content/themes/sindicato/inc/cpt-podcast.php wp-content/themes/sindicato/inc/cpt-video.php
```

- [ ] **Step 3: Substituir a seção `#midia` em `front-page.php`**

Substituir todo o bloco atual (da linha `<?php $podcast_destaque = ...` até o `</section>` que fecha `id="midia"`, atualmente linhas 137-193) por:

```php
<?php
$proximo_episodio = sindicato_get_proximo_episodio();
$videos_youtube    = sindicato_get_youtube_videos( 6 );
$destaque_video    = null;
if ( ! $proximo_episodio && $videos_youtube ) {
    $destaque_video = array_shift( $videos_youtube );
}
$videos_youtube  = array_slice( $videos_youtube, 0, 5 );
$tem_conteudo    = $proximo_episodio || $destaque_video || $videos_youtube;
?>
<section id="midia" class="section section--media">
    <div class="container">
        <div class="section-heading section-heading--compact">
            <div><p class="section-label">Áudio e vídeo</p><h2>Podcast do Sindicato</h2></div>
        </div>

        <?php if ( $proximo_episodio ) : ?>
        <article class="podcast-feature"<?php echo $proximo_episodio['imagem_url'] ? ' style="background-image:url(' . esc_url( $proximo_episodio['imagem_url'] ) . ')"' : ''; ?>>
            <span class="podcast-feature__tag">Próximo episódio</span>
            <h3><?php echo esc_html( $proximo_episodio['titulo'] ); ?></h3>
            <?php if ( $proximo_episodio['descricao'] ) : ?>
            <p><?php echo esc_html( $proximo_episodio['descricao'] ); ?></p>
            <?php endif; ?>
        </article>
        <?php elseif ( $destaque_video ) : ?>
        <article class="podcast-feature"<?php echo $destaque_video['thumbnail_url'] ? ' style="background-image:url(' . esc_url( $destaque_video['thumbnail_url'] ) . ')"' : ''; ?>>
            <span class="play-button">Play</span>
            <h3><?php echo esc_html( $destaque_video['titulo'] ); ?></h3>
            <a class="text-link" href="<?php echo esc_url( $destaque_video['link'] ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
        </article>
        <?php endif; ?>

        <?php if ( $videos_youtube ) : ?>
        <div class="podcast-list">
            <?php foreach ( $videos_youtube as $video ) : ?>
            <a href="<?php echo esc_url( $video['link'] ); ?>" target="_blank" rel="noopener">
                <span style="background-image:url(<?php echo esc_url( $video['thumbnail_url'] ); ?>)"></span>
                <?php echo esc_html( $video['titulo'] ); ?>
            </a>
            <?php endforeach; ?>
        </div>
        <?php elseif ( ! $tem_conteudo ) : ?>
        <p>Em breve, novos vídeos no canal do sindicato. <a href="<?php echo esc_url( sindicato_get_contato( 'youtube_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Acesse o canal</a>.</p>
        <?php endif; ?>
    </div>
</section>
```

- [ ] **Step 4: Remover classes obsoletas dos grupos de seletores compartilhados em `assets/css/main.css`**

Substituir:

```css
.featured-post,
.post-card,
.notice-panel,
.podcast-card,
.video-feature {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 14px 40px rgba(13, 40, 70, 0.06);
  overflow: hidden;
}
```

por:

```css
.featured-post,
.post-card,
.notice-panel {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 14px 40px rgba(13, 40, 70, 0.06);
  overflow: hidden;
}
```

Substituir:

```css
.post-image--assembly,
.video-thumb,
.insta-card--photo {
  background-image:
    linear-gradient(180deg, rgba(5, 27, 51, 0), rgba(5, 27, 51, 0.72)),
    url("assets/hero-assembleia-sindicato.png");
}
```

por:

```css
.post-image--assembly,
.insta-card--photo {
  background-image:
    linear-gradient(180deg, rgba(5, 27, 51, 0), rgba(5, 27, 51, 0.72)),
    url("assets/hero-assembleia-sindicato.png");
}
```

Substituir:

```css
.featured-post h3,
.post-card h3,
.notice-panel h3,
.podcast-card h3,
.video-feature h3 {
  margin: 0;
  color: var(--navy-950);
  line-height: 1.2;
}
```

por:

```css
.featured-post h3,
.post-card h3,
.notice-panel h3 {
  margin: 0;
  color: var(--navy-950);
  line-height: 1.2;
}
```

Substituir:

```css
.featured-post p,
.post-card p,
.podcast-card p,
.video-feature p,
.footer p {
  color: var(--muted);
}
```

por:

```css
.featured-post p,
.post-card p,
.footer p {
  color: var(--muted);
}
```

- [ ] **Step 5: Substituir o bloco `.media-grid` … `.video-list span` por `.podcast-feature` / `.podcast-list`**

Substituir todo o bloco (atualmente linhas 568-688):

```css
.media-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 38px;
}

.media-column {
  min-width: 0;
}

.podcast-card {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 22px;
  padding: 18px;
}

.podcast-cover {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 210px;
  padding: 22px;
  border-radius: 8px;
  color: #fff;
  background:
    linear-gradient(180deg, rgba(5, 27, 51, 0.2), rgba(5, 27, 51, 0.92)),
    radial-gradient(circle at 72% 30%, rgba(255, 255, 255, 0.34), transparent 18%),
    linear-gradient(135deg, var(--navy-950), var(--navy-700));
}

.podcast-cover span {
  font-size: 1.55rem;
  font-weight: 900;
  line-height: 1.05;
  text-transform: uppercase;
}

.podcast-cover strong {
  color: #ffc247;
  font-size: 1.35rem;
  text-transform: uppercase;
}

.episode-list {
  display: grid;
  margin-top: 14px;
  border-top: 1px solid var(--line);
}

.episode-list button {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 17px 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  color: var(--navy-950);
  background: transparent;
  font-size: 0.9rem;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.episode-list time {
  color: var(--muted);
}

.video-feature {
  padding: 18px;
}

.video-thumb {
  display: grid;
  place-items: center;
  min-height: 280px;
  margin-bottom: 18px;
  border-radius: 8px;
  background-position: center;
  background-size: cover;
}

.play-button {
  display: grid;
  place-items: center;
  width: 72px;
  height: 52px;
  border-radius: 8px;
  color: #fff;
  background: var(--red-600);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.video-list {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.video-list a {
  display: grid;
  grid-template-columns: 88px 1fr;
  align-items: center;
  gap: 14px;
  color: var(--navy-950);
  font-weight: 800;
}

.video-list span {
  height: 54px;
  border-radius: 6px;
  background-image:
    linear-gradient(180deg, rgba(5, 27, 51, 0.1), rgba(5, 27, 51, 0.82)),
    url("assets/hero-assembleia-sindicato.png");
  background-position: center;
  background-size: cover;
}
```

por:

```css
.podcast-feature {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  min-height: 340px;
  padding: 28px;
  border-radius: 8px;
  color: #fff;
  background-color: var(--navy-900);
  background-position: center;
  background-size: cover;
  box-shadow: var(--shadow);
}

.podcast-feature::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(22, 20, 41, 0.15), rgba(22, 20, 41, 0.92));
}

.podcast-feature > * {
  position: relative;
}

.podcast-feature__tag {
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--red-600);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.podcast-feature h3 {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.2;
}

.podcast-feature p {
  color: rgba(255, 255, 255, 0.86);
}

.play-button {
  align-self: flex-start;
  display: grid;
  place-items: center;
  width: 72px;
  height: 52px;
  border-radius: 8px;
  color: #fff;
  background: var(--red-600);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.podcast-list {
  display: grid;
  gap: 12px;
  margin-top: 22px;
}

.podcast-list a {
  display: grid;
  grid-template-columns: 120px 1fr;
  align-items: center;
  gap: 14px;
  color: var(--navy-950);
  font-weight: 800;
}

.podcast-list span {
  height: 68px;
  border-radius: 6px;
  background-color: var(--navy-900);
  background-position: center;
  background-size: cover;
}
```

- [ ] **Step 6: Ajustar o bloco responsivo**

Substituir:

```css
  .media-grid,
  .footer__grid {
    grid-template-columns: 1fr;
  }

  .podcast-card {
    grid-template-columns: 1fr;
  }
```

por:

```css
  .footer__grid {
    grid-template-columns: 1fr;
  }

  .podcast-list a {
    grid-template-columns: 84px 1fr;
  }
```

- [ ] **Step 7: Copiar `assets/css/main.css` para `styles.css` na raiz do repo**

```bash
cp "wp-content/themes/sindicato/assets/css/main.css" "styles.css"
diff "wp-content/themes/sindicato/assets/css/main.css" "styles.css"
```

Esperado: `diff` sem saída (arquivos idênticos).

- [ ] **Step 8: Testar cenário 1 — nenhum canal, sem Próximo Episódio (fallback)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => '')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => '', 'descricao' => '', 'imagem_id' => 0, 'data_hora_estreia' => '', 'ativo' => '0'));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" transient delete --all --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "Em breve, novos vídeos"
```

Esperado: `1`.

- [ ] **Step 9: Testar cenários 5 e 6 — Próximo Episódio ativo, com e sem vídeos reais**

Com Próximo Episódio ativo e SEM canal configurado (cenário 6):

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12 - Reforma trabalhista', 'descricao' => 'Um resumo do que muda para a categoria.', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('+2 days')), 'ativo' => '1'));" --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "Próximo episódio"
curl -s http://localhost/sindicato/ | grep -c "podcast-list"
```

Esperado: primeiro `grep` = `1` (destaque = Próximo Episódio); segundo `grep` = `0` (lista de vídeos não aparece, sem canal configurado).

Com Próximo Episódio ativo E canal configurado com vídeos reais (cenário 5):

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => 'https://www.youtube.com/channel/UCLA_DiR1FfKNvjuUpBHmylQ')));" --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "Próximo episódio"
curl -s http://localhost/sindicato/ | grep -c "podcast-list"
```

Esperado: primeiro `grep` = `1` (destaque continua sendo o Próximo Episódio, não o vídeo mais recente); segundo `grep` = `1` (lista de vídeos reais aparece abaixo).

- [ ] **Step 10: Testar cenário 7 — Próximo Episódio expira e destaque volta a ser o vídeo mais recente**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => 'Episódio 12', 'descricao' => '', 'imagem_id' => 0, 'data_hora_estreia' => date('Y-m-d\TH:i', strtotime('-2 hours')), 'ativo' => '1'));" --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "Próximo episódio"
curl -s http://localhost/sindicato/ | grep -c "Assistir no YouTube"
```

Esperado: primeiro `grep` = `0` (card de Próximo Episódio não aparece mais); segundo `grep` = `1` (destaque volta a ser o vídeo mais recente do canal, com o link "Assistir no YouTube").

- [ ] **Step 11: Screenshot real da home (verificação de layout)**

```bash
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --user-data-dir="C:\temp-edge-verify-profile" --screenshot="C:\temp-edge-verify-profile\home-midia.png" --window-size=1440,1400 http://localhost/sindicato/
```

Abrir `C:\temp-edge-verify-profile\home-midia.png` e confirmar visualmente: uma única seção "Podcast do Sindicato" (sem duas colunas), card de destaque com imagem de fundo cobrindo a área, lista de vídeos abaixo em linha única por item, nenhuma sobreposição/quebra de layout.

- [ ] **Step 12: Restaurar estado de conteúdo real (vazio) e limpar cache**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_contato', array_merge((array) get_option('sindicato_contato'), array('youtube_url' => '')));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval "update_option('sindicato_proximo_episodio', array('titulo' => '', 'descricao' => '', 'imagem_id' => 0, 'data_hora_estreia' => '', 'ativo' => '0'));" --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option delete sindicato_youtube_channel_resolvido --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" transient delete --all --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "Em breve, novos vídeos"
```

Esperado: `1` (site volta ao estado de placeholder, sem canal real nem próximo episódio configurado — nenhum dado de teste fica em produção).

- [ ] **Step 13: Commit final**

```bash
git add wp-content/themes/sindicato/front-page.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/assets/css/main.css styles.css
git commit -m "feat: unificar podcast e videos do YouTube em uma unica secao na home"
```

---

## Self-Review

**Cobertura da spec:**
- Feed RSS + resolução de channel_id (todos os formatos de link) → Task 1.
- Cache de resolução em `option` (10min falha) e de vídeos em `transient` (1h sucesso / 10min falha) → Task 1, Step 7.
- Próximo Episódio com expiração automática por `data_hora_estreia` via `wp_timezone()` → Task 2.
- Aviso no admin de canal não resolvido → Task 1, Step 2.
- Fallback institucional quando não há canal/próximo episódio → Task 3, Step 3 e Step 8.
- Regra de precedência do destaque (Próximo Episódio > vídeo mais recente) → Task 3, Step 3 e Steps 9-10.
- Remoção dos CPTs `podcast_episodio`/`video` e funções obsoletas → Task 3, Steps 1-2.
- Verificação visual via screenshot → Task 3, Step 11.
- Todos os 8 cenários da spec cobertos: 1 (Task 3/Step 8), 2 (Task 1/Step 4), 3 (Task 1/Step 5), 4 (Task 1/Step 6), 5 e 6 (Task 3/Step 9), 7 (Task 3/Step 10), 8 (Task 1/Step 7).
