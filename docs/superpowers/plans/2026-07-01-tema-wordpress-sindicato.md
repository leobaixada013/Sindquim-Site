# Tema WordPress Customizado do Sindicato Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar o mockup estático (`index.html`, `styles.css`, `script.js`) para um tema WordPress customizado funcional, com os tipos de conteúdo e a lógica condicional (avisos, banner, podcast, vídeo, notícias) descritos no plano estratégico `docs/superpowers/plans/2026-06-30-site-sindicato-desenvolvimento.md`, seções 6 e 7.

**Architecture:** WordPress tradicional com tema customizado `sindicato`. Tipos de conteúdo (`aviso`, `banner`, `documento`, `podcast_episodio`, `video`, `card_social`) são registrados no próprio tema via `register_post_type` + `register_post_meta`, com meta boxes nativos do WordPress para edição no admin — sem dependência de plugin pago (ACF Pro não é necessário para este escopo: sem repeaters, sem options pages). Dados de contato globais (telefone, WhatsApp, e-mail, endereço, redes sociais) ficam numa página de configurações nativa (Settings API) em vez de post type, porque são valores únicos e globais, não uma coleção de itens. Notícias usam o post type nativo `post` com uma taxonomia de categorias pré-cadastrada. Formulários de contato e filiação usam o plugin gratuito Contact Form 7 (padrão de mercado para o "plugin de formulário com armazenamento e SMTP" recomendado na seção 5.1 do plano estratégico), com os formulários e mensagens de sucesso semeados via WP-CLI para ficarem reproduzíveis.

**Tech Stack:** WordPress 7.0 (local, XAMPP: PHP 8.2, MariaDB 10.4, Apache), PHP nativo (sem framework de templates), CSS/JS herdados do mockup, WP-CLI para automação/verificação, plugin Contact Form 7.

## Global Constraints

- Ambiente local já provisionado: WordPress em `C:\xampp\htdocs\sindicato`, banco `sindicato_wp`, admin `admin`/`admin123`, URL `http://localhost/sindicato/`, permalinks `/%postname%/` ativos.
- O tema vive no repositório git em `wp-content/themes/sindicato/` e está linkado por **junction** do Windows em `C:\xampp\htdocs\sindicato\wp-content\themes\sindicato` — editar em um local reflete no outro instantaneamente. Não copiar arquivos manualmente entre os dois caminhos.
- Todo comando WP-CLI deve ser executado assim (caminho completo do PHP do XAMPP, sem depender de PATH persistente):
  `"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" <comando> --path="/c/xampp/htdocs/sindicato" --allow-root`
- Não existe PHPUnit/harness de teste automatizado neste ambiente. "Teste" para cada tarefa = semear conteúdo via WP-CLI (`wp post create`, `wp post meta set` etc.) e verificar o HTML renderizado via `curl -s http://localhost/sindicato/... | grep <marcador esperado>`. Isso substitui TDD clássico neste projeto — cada passo de teste deve mostrar o comando `curl`/`wp` exato e o texto esperado no output.
- Paleta de cores do mockup (já em `styles.css`, não recriar): `--navy-950:#051b33 --navy-900:#082441 --navy-800:#0b3158 --navy-700:#113f6e --red-600:#e9292f --red-700:#c71921 --teal-600:#049b8f --teal-700:#02786f --paper:#ffffff --mist:#f2f5f8 --line:#d9e1e8 --text:#102033 --muted:#607084`.
- Prefixo de meta keys customizadas: `_sind_` (ex.: `_sind_ativo`, `_sind_prioridade`) para não colidir com meta nativo do WordPress ou de plugins.
- Todos os textos institucionais reais (nome do sindicato, logo, contatos, redes sociais) ainda **não foram confirmados** (pendências da seção 16 do plano estratégico). Usar placeholders idênticos ao mockup atual (`Sindicato`, `(11) 3333-7777`, `contato@sindicato.org.br`, etc.) em todo o tema — não inventar dados novos.
- Fora de escopo deste plano (não criar tarefas para isso): deploy/hospedagem de produção, domínio, SSL, treinamento editorial, conteúdo institucional final, Instagram embed oficial (usar apenas cards curados manuais), newsletter (apenas o formulário estático do mockup, sem integração de envio).
- **Cuidado com o Git Bash (MSYS) ao rodar WP-CLI**: quando um argumento de linha de comando é uma string isolada começando com `/` (ex.: `"/noticias/"`), o Git Bash converte automaticamente para um caminho de arquivo do Windows (ex.: `C:/Program Files/Git/noticias/`) antes de passar para o `wp-cli`, corrompendo o valor salvo no banco. Isso já causou corrupção real do `permalink_structure` numa task anterior. Ao testar valores desse tipo via WP-CLI em comandos de verificação, usar a URL completa (`http://localhost/sindicato/noticias/`) em vez do caminho relativo (`/noticias/`), ou rodar o comando via PowerShell em vez de Git Bash.

---

## Estrutura De Arquivos

```
wp-content/themes/sindicato/
  style.css                     Cabeçalho do tema exigido pelo WP + reset mínimo
  functions.php                 Enqueue de assets, registro de CPTs, meta, settings page, menus
  header.php                    Topbar + mainnav + menu mobile (markup do mockup)
  footer.php                    Footer com dados de contato dinâmicos + newsletter estático
  front-page.php                Home: monta hero/banner, aviso urgente, notícias, avisos rápidos,
                                 acesso rápido, mídia (podcast+vídeo), instagram, CTA
  single.php                    Notícia individual
  archive.php                   Listagem de notícias (posts nativos) com paginação, categoria, busca
  archive-documento.php         Listagem de convenções/documentos com filtro por ano e tipo
  page-filie-se.php             Página de filiação com formulário CF7 + WhatsApp
  page-contato.php              Página de contato com formulário CF7 + WhatsApp
  inc/
    cpt-aviso.php                register_post_type + meta + meta box para "aviso"
    cpt-banner.php                idem para "banner"
    cpt-documento.php             idem para "documento"
    cpt-podcast.php               idem para "podcast_episodio"
    cpt-video.php                 idem para "video"
    cpt-card-social.php           idem para "card_social"
    settings-contato.php          Settings API: telefone, whatsapp, email, endereço, redes sociais
    template-tags.php             Funções auxiliares de query/render usadas pelos templates
  assets/
    css/main.css                 Cópia integral de styles.css (raiz do repo)
    js/main.js                   Menu mobile + seleção de episódio (sem mais lógica de avisos —
                                  isso passa a ser renderizado no servidor)
    img/                          (vazio por enquanto; imagens via uploads do WP)
  screenshot.png                 Cópia de design/referencia-home-sindicato.png (preview do admin)
```

**Interfaces entre arquivos (funções que os templates consomem):**
- `sindicato_get_aviso_urgente_ativo()` → retorna `WP_Post|null` (em `inc/template-tags.php`, criada na Task 4)
- `sindicato_get_avisos_rapidos_ativos( int $limit = 5 )` → retorna `WP_Post[]` (Task 4)
- `sindicato_get_banner_ativo()` → retorna `WP_Post|null` (Task 6)
- `sindicato_get_podcast_destaque()` → retorna `WP_Post|null`; `sindicato_get_podcast_lista( int $limit )` → `WP_Post[]` (Task 8)
- `sindicato_get_video_destaque()` → retorna `WP_Post|null`; `sindicato_get_video_lista( int $limit )` → `WP_Post[]` (Task 9)
- `sindicato_get_cards_sociais( int $limit = 5 )` → `WP_Post[]` (Task 10)
- `sindicato_get_contato( string $chave )` → `string` lê da options page (Task 3)

---

## Task 1: Scaffold Do Tema Base

**Files:**
- Create: `wp-content/themes/sindicato/style.css`
- Create: `wp-content/themes/sindicato/functions.php`
- Create: `wp-content/themes/sindicato/index.php`
- Create: `wp-content/themes/sindicato/screenshot.png` (copiar de `design/referencia-home-sindicato.png`)
- Create: `wp-content/themes/sindicato/assets/css/main.css` (copiar de `styles.css` da raiz do repo, sem alterações)
- Create: `wp-content/themes/sindicato/assets/js/main.js`

**Interfaces:**
- Produces: enqueue de `assets/css/main.css` e `assets/js/main.js` em todas as páginas do tema.

- [ ] **Step 1: Criar o cabeçalho do tema em `style.css`**

```css
/*
Theme Name: Sindicato
Theme URI: https://localhost/sindicato/
Author: Sindicato
Description: Tema institucional customizado baseado no mockup aprovado.
Version: 0.1.0
Text Domain: sindicato
*/
```

- [ ] **Step 2: Copiar o CSS do mockup para o tema**

```bash
cp "styles.css" "wp-content/themes/sindicato/assets/css/main.css"
```

Verificar: `diff "styles.css" "wp-content/themes/sindicato/assets/css/main.css"` não deve mostrar diferenças.

- [ ] **Step 3: Copiar o screenshot do tema**

```bash
cp "design/referencia-home-sindicato.png" "wp-content/themes/sindicato/screenshot.png"
```

- [ ] **Step 4: Criar `assets/js/main.js` com o menu mobile e seleção de episódio (sem a lógica de avisos, que passa a ser server-side)**

```javascript
const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#site-menu");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll(".episode-list button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".episode-list button").forEach((item) => {
      item.classList.remove("is-active");
    });
    button.classList.add("is-active");
  });
});
```

- [ ] **Step 5: Criar `functions.php` com enqueue de assets e setup básico de tema**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );
    register_nav_menus( array(
        'primary' => __( 'Menu Principal', 'sindicato' ),
    ) );
}
add_action( 'after_setup_theme', 'sindicato_setup' );

function sindicato_enqueue_assets() {
    wp_enqueue_style( 'sindicato-main', get_template_directory_uri() . '/assets/css/main.css', array(), '0.1.0' );
    wp_enqueue_script( 'sindicato-main', get_template_directory_uri() . '/assets/js/main.js', array(), '0.1.0', true );
}
add_action( 'wp_enqueue_scripts', 'sindicato_enqueue_assets' );
```

- [ ] **Step 6: Criar `index.php` mínimo exigido pelo WordPress (fallback genérico)**

```php
<?php get_header(); ?>
<main class="container" style="padding: 40px 0;">
    <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <h1><?php the_title(); ?></h1>
        <div><?php the_content(); ?></div>
    <?php endwhile; endif; ?>
</main>
<?php get_footer(); ?>
```

- [ ] **Step 7: Ativar o tema via WP-CLI**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" theme activate sindicato --path="/c/xampp/htdocs/sindicato" --allow-root
```

Expected: `Success: Switched to 'Sindicato' theme.`

- [ ] **Step 8: Verificar que o tema carrega e o CSS é servido**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" theme list --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/css/main.css | grep -c "navy-950"
```

Expected: tema `sindicato` com status `active`; o grep retorna `1` ou mais (confirma que a variável de cor do mockup está no CSS servido).

- [ ] **Step 9: Commit**

```bash
git add wp-content/themes/sindicato/style.css wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/index.php wp-content/themes/sindicato/screenshot.png wp-content/themes/sindicato/assets
git commit -m "feat: scaffold do tema sindicato com assets do mockup"
```

---

## Task 2: Header E Footer Estáticos (Sem Dados Dinâmicos Ainda)

**Files:**
- Create: `wp-content/themes/sindicato/header.php`
- Create: `wp-content/themes/sindicato/footer.php`

**Interfaces:**
- Consumes: nada ainda (dados de contato reais chegam na Task 3).
- Produces: `header.php`/`footer.php` chamáveis via `get_header()`/`get_footer()` por qualquer template.

- [ ] **Step 1: Criar `header.php` portando o markup de `index.html` linhas 14-52 (topbar + mainnav)**

```php
<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header">
    <div class="topbar">
        <div class="container topbar__inner">
            <span>Sindicato forte, trabalhador respeitado.</span>
            <div class="topbar__links" aria-label="Contatos rápidos">
                <a href="#contato">(11) 3333-7777</a>
                <a href="mailto:contato@sindicato.org.br">contato@sindicato.org.br</a>
                <a href="#associado">Área do Associado</a>
            </div>
        </div>
    </div>

    <div class="mainnav">
        <div class="container mainnav__inner">
            <a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="Página inicial do Sindicato">
                <span class="brand__mark">S</span>
                <span>
                    <strong>Sindicato</strong>
                    <small>Em defesa dos trabalhadores</small>
                </span>
            </a>

            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">
                Menu
            </button>

            <nav id="site-menu" class="nav-links" aria-label="Navegação principal">
                <a href="#sindicato">O Sindicato</a>
                <a href="<?php echo esc_url( home_url( '/noticias/' ) ); ?>">Notícias</a>
                <a href="#convencoes">Convenções</a>
                <a href="#beneficios">Benefícios</a>
                <a href="#midia">Mídia</a>
                <a href="#contato">Contato</a>
            </nav>

            <a class="button button--primary nav-cta" href="#filie-se">Filie-se</a>
        </div>
    </div>
</header>
<main>
```

- [ ] **Step 2: Criar `footer.php` portando o markup de `index.html` linhas 289-337 (footer)**

```php
<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
</main>
<footer id="contato" class="footer">
    <div class="container footer__grid">
        <div>
            <a class="brand brand--footer" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                <span class="brand__mark">S</span>
                <span>
                    <strong>Sindicato</strong>
                    <small>Em defesa dos trabalhadores</small>
                </span>
            </a>
            <p>
                Representamos, defendemos e lutamos por melhores condições de trabalho, salários justos
                e respeito à categoria.
            </p>
        </div>

        <div>
            <h3>Fale conosco</h3>
            <p>(11) 3333-7777</p>
            <p>(11) 98888-8888 WhatsApp</p>
            <p>contato@sindicato.org.br</p>
            <p>Rua das Indústrias, 123 - São Paulo</p>
        </div>

        <div>
            <h3>Links úteis</h3>
            <a href="<?php echo esc_url( home_url( '/noticias/' ) ); ?>">Notícias</a>
            <a href="#convencoes">Convenções</a>
            <a href="#beneficios">Benefícios</a>
            <a href="#filie-se">Associe-se</a>
        </div>

        <form class="newsletter" action="#" method="post">
            <h3>Receba novidades</h3>
            <label for="email">Seu melhor e-mail</label>
            <div>
                <input id="email" name="email" type="email" placeholder="email@exemplo.com" />
                <button class="button button--primary" type="submit">Cadastrar</button>
            </div>
        </form>
    </div>
    <div class="container footer__bottom">
        <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Sindicato. Todos os direitos reservados.</span>
        <span>Política de Privacidade | Transparência</span>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
```

- [ ] **Step 3: Criar `front-page.php` temporário que só chama header/footer, para permitir teste imediato**

```php
<?php get_header(); ?>
<div class="container" style="padding: 40px 0;"><p>Home em construção.</p></div>
<?php get_footer(); ?>
```

- [ ] **Step 4: Testar que header e footer renderizam sem erro fatal**

```bash
curl -s http://localhost/sindicato/ | grep -c "Sindicato forte, trabalhador respeitado."
curl -s http://localhost/sindicato/ | grep -c "Todos os direitos reservados"
```

Expected: ambos retornam `1`.

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/sindicato/header.php wp-content/themes/sindicato/footer.php wp-content/themes/sindicato/front-page.php
git commit -m "feat: header e footer estaticos do tema sindicato"
```

---

## Task 3: Página De Configurações Globais (Contato) + Footer Dinâmico

**Files:**
- Create: `wp-content/themes/sindicato/inc/settings-contato.php`
- Create: `wp-content/themes/sindicato/inc/template-tags.php`
- Modify: `wp-content/themes/sindicato/functions.php` (incluir os dois arquivos de `inc/`)
- Modify: `wp-content/themes/sindicato/header.php` (telefone/email dinâmicos na topbar)
- Modify: `wp-content/themes/sindicato/footer.php` (telefone/whatsapp/email/endereço dinâmicos)

**Interfaces:**
- Produces: `sindicato_get_contato( string $chave )` em `inc/template-tags.php`, chaves válidas: `telefone`, `whatsapp`, `email`, `endereco`, `instagram_url`, `youtube_url`, `podcast_url`.
- Consumes: nada.

- [ ] **Step 1: Criar `inc/settings-contato.php` com uma página de configurações nativa (Settings API)**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_configuracoes() {
    register_setting( 'sindicato_contato_group', 'sindicato_contato', array(
        'type'              => 'array',
        'sanitize_callback' => 'sindicato_sanitizar_contato',
        'default'           => array(
            'telefone'      => '(11) 3333-7777',
            'whatsapp'      => '(11) 98888-8888',
            'email'         => 'contato@sindicato.org.br',
            'endereco'      => 'Rua das Indústrias, 123 - São Paulo',
            'instagram_url' => '',
            'youtube_url'   => '',
            'podcast_url'   => '',
        ),
    ) );

    add_settings_section( 'sindicato_contato_section', 'Dados de Contato', '__return_false', 'sindicato-contato' );

    $campos = array(
        'telefone'      => 'Telefone',
        'whatsapp'      => 'WhatsApp',
        'email'         => 'E-mail',
        'endereco'      => 'Endereço',
        'instagram_url' => 'URL do Instagram',
        'youtube_url'   => 'URL do canal do YouTube',
        'podcast_url'   => 'URL do podcast (Spotify/RSS)',
    );

    foreach ( $campos as $chave => $rotulo ) {
        add_settings_field(
            'sindicato_contato_' . $chave,
            $rotulo,
            'sindicato_render_campo_contato',
            'sindicato-contato',
            'sindicato_contato_section',
            array( 'chave' => $chave )
        );
    }
}
add_action( 'admin_init', 'sindicato_registrar_configuracoes' );

function sindicato_sanitizar_contato( $input ) {
    $limpo = array();
    foreach ( (array) $input as $chave => $valor ) {
        $limpo[ sanitize_key( $chave ) ] = sanitize_text_field( $valor );
    }
    return $limpo;
}

function sindicato_render_campo_contato( $args ) {
    $valores = get_option( 'sindicato_contato', array() );
    $chave   = $args['chave'];
    $valor   = isset( $valores[ $chave ] ) ? $valores[ $chave ] : '';
    printf(
        '<input type="text" name="sindicato_contato[%1$s]" value="%2$s" class="regular-text" />',
        esc_attr( $chave ),
        esc_attr( $valor )
    );
}

function sindicato_adicionar_menu_configuracoes() {
    add_options_page( 'Dados do Sindicato', 'Dados do Sindicato', 'manage_options', 'sindicato-contato', 'sindicato_renderizar_pagina_configuracoes' );
}
add_action( 'admin_menu', 'sindicato_adicionar_menu_configuracoes' );

function sindicato_renderizar_pagina_configuracoes() {
    ?>
    <div class="wrap">
        <h1>Dados do Sindicato</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'sindicato_contato_group' );
            do_settings_sections( 'sindicato-contato' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
```

- [ ] **Step 2: Criar `inc/template-tags.php` com a função de leitura**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_get_contato( $chave ) {
    $valores = get_option( 'sindicato_contato', array() );
    return isset( $valores[ $chave ] ) ? $valores[ $chave ] : '';
}
```

- [ ] **Step 3: Incluir os dois arquivos em `functions.php`**

```php
require get_template_directory() . '/inc/settings-contato.php';
require get_template_directory() . '/inc/template-tags.php';
```

- [ ] **Step 4: Atualizar `header.php` para usar telefone/e-mail dinâmicos na topbar**

Substituir:
```php
<span>Sindicato forte, trabalhador respeitado.</span>
<div class="topbar__links" aria-label="Contatos rápidos">
    <a href="#contato">(11) 3333-7777</a>
    <a href="mailto:contato@sindicato.org.br">contato@sindicato.org.br</a>
    <a href="#associado">Área do Associado</a>
</div>
```
por:
```php
<span>Sindicato forte, trabalhador respeitado.</span>
<div class="topbar__links" aria-label="Contatos rápidos">
    <a href="#contato"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a>
    <a href="mailto:<?php echo esc_attr( sindicato_get_contato( 'email' ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'email' ) ); ?></a>
    <a href="#associado">Área do Associado</a>
</div>
```

- [ ] **Step 5: Atualizar `footer.php` para usar telefone/whatsapp/email/endereço dinâmicos**

Substituir:
```php
<h3>Fale conosco</h3>
<p>(11) 3333-7777</p>
<p>(11) 98888-8888 WhatsApp</p>
<p>contato@sindicato.org.br</p>
<p>Rua das Indústrias, 123 - São Paulo</p>
```
por:
```php
<h3>Fale conosco</h3>
<p><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></p>
<p><?php echo esc_html( sindicato_get_contato( 'whatsapp' ) ); ?> WhatsApp</p>
<p><?php echo esc_html( sindicato_get_contato( 'email' ) ); ?></p>
<p><?php echo esc_html( sindicato_get_contato( 'endereco' ) ); ?></p>
```

- [ ] **Step 6: Testar valores default e alteração via WP-CLI**

```bash
curl -s http://localhost/sindicato/ | grep -c "(11) 3333-7777"

"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option patch update sindicato_contato telefone "(11) 4444-0000" --path="/c/xampp/htdocs/sindicato" --allow-root
curl -s http://localhost/sindicato/ | grep -c "(11) 4444-0000"

"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" option patch update sindicato_contato telefone "(11) 3333-7777" --path="/c/xampp/htdocs/sindicato" --allow-root
```

Expected: primeiro grep `1` (valor default), segundo grep `1` depois de alterar (confirma que o dado é dinâmico), depois reverte para o valor original.

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/sindicato/inc/settings-contato.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/header.php wp-content/themes/sindicato/footer.php
git commit -m "feat: pagina de configuracoes de contato e footer dinamico"
```

---

## Task 4: Custom Post Type `aviso` (Urgente E Rápido) + Lógica Condicional

**Files:**
- Create: `wp-content/themes/sindicato/inc/cpt-aviso.php`
- Modify: `wp-content/themes/sindicato/functions.php` (incluir `inc/cpt-aviso.php`)
- Modify: `wp-content/themes/sindicato/inc/template-tags.php` (adicionar funções de query)

**Interfaces:**
- Consumes: `sindicato_get_contato()` não é usado aqui.
- Produces: `sindicato_get_aviso_urgente_ativo()` → `WP_Post|null`; `sindicato_get_avisos_rapidos_ativos( int $limit = 5 )` → `WP_Post[]`.

Campos meta do CPT `aviso` (prefixo `_sind_`): `_sind_tipo` (`urgente`|`rapido`), `_sind_mensagem_curta`, `_sind_link`, `_sind_texto_link`, `_sind_prioridade` (int), `_sind_data_inicio` (`Y-m-d`), `_sind_data_fim` (`Y-m-d`), `_sind_ativo` (`1`|`0`), `_sind_ordem` (int).

- [ ] **Step 1: Criar `inc/cpt-aviso.php` com `register_post_type`, `register_post_meta` e meta box**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_aviso() {
    register_post_type( 'aviso', array(
        'labels' => array(
            'name'          => 'Avisos',
            'singular_name' => 'Aviso',
            'add_new_item'  => 'Adicionar Aviso',
            'edit_item'     => 'Editar Aviso',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-megaphone',
        'supports'     => array( 'title' ),
    ) );

    $campos_texto = array( '_sind_mensagem_curta', '_sind_link', '_sind_texto_link', '_sind_data_inicio', '_sind_data_fim', '_sind_tipo' );
    foreach ( $campos_texto as $campo ) {
        register_post_meta( 'aviso', $campo, array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => false,
            'sanitize_callback' => 'sanitize_text_field',
        ) );
    }
    register_post_meta( 'aviso', '_sind_prioridade', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'aviso', '_sind_ordem', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'aviso', '_sind_ativo', array( 'type' => 'boolean', 'single' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_aviso' );

function sindicato_metabox_aviso() {
    add_meta_box( 'sindicato_aviso_campos', 'Detalhes do Aviso', 'sindicato_render_metabox_aviso', 'aviso', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_aviso' );

function sindicato_render_metabox_aviso( $post ) {
    wp_nonce_field( 'sindicato_salvar_aviso', 'sindicato_aviso_nonce' );
    $tipo             = get_post_meta( $post->ID, '_sind_tipo', true ) ?: 'rapido';
    $mensagem_curta   = get_post_meta( $post->ID, '_sind_mensagem_curta', true );
    $link             = get_post_meta( $post->ID, '_sind_link', true );
    $texto_link       = get_post_meta( $post->ID, '_sind_texto_link', true );
    $prioridade       = get_post_meta( $post->ID, '_sind_prioridade', true ) ?: 0;
    $data_inicio      = get_post_meta( $post->ID, '_sind_data_inicio', true );
    $data_fim         = get_post_meta( $post->ID, '_sind_data_fim', true );
    $ativo            = get_post_meta( $post->ID, '_sind_ativo', true );
    $ordem            = get_post_meta( $post->ID, '_sind_ordem', true ) ?: 0;
    ?>
    <p>
        <label for="sind_tipo">Tipo</label><br />
        <select name="sind_tipo" id="sind_tipo">
            <option value="urgente" <?php selected( $tipo, 'urgente' ); ?>>Urgente (faixa vermelha)</option>
            <option value="rapido" <?php selected( $tipo, 'rapido' ); ?>>Rápido (painel lateral)</option>
        </select>
    </p>
    <p><label for="sind_mensagem_curta">Mensagem curta</label><br />
        <input type="text" id="sind_mensagem_curta" name="sind_mensagem_curta" class="large-text" value="<?php echo esc_attr( $mensagem_curta ); ?>" /></p>
    <p><label for="sind_link">Link</label><br />
        <input type="text" id="sind_link" name="sind_link" class="large-text" value="<?php echo esc_attr( $link ); ?>" /></p>
    <p><label for="sind_texto_link">Texto do link</label><br />
        <input type="text" id="sind_texto_link" name="sind_texto_link" value="<?php echo esc_attr( $texto_link ); ?>" /></p>
    <p><label for="sind_prioridade">Prioridade (maior = mais importante)</label><br />
        <input type="number" id="sind_prioridade" name="sind_prioridade" value="<?php echo esc_attr( $prioridade ); ?>" /></p>
    <p><label for="sind_ordem">Ordem (avisos rápidos)</label><br />
        <input type="number" id="sind_ordem" name="sind_ordem" value="<?php echo esc_attr( $ordem ); ?>" /></p>
    <p><label for="sind_data_inicio">Data início</label><br />
        <input type="date" id="sind_data_inicio" name="sind_data_inicio" value="<?php echo esc_attr( $data_inicio ); ?>" /></p>
    <p><label for="sind_data_fim">Data fim</label><br />
        <input type="date" id="sind_data_fim" name="sind_data_fim" value="<?php echo esc_attr( $data_fim ); ?>" /></p>
    <p><label><input type="checkbox" name="sind_ativo" value="1" <?php checked( $ativo, '1' ); ?> /> Ativo</label></p>
    <?php
}

function sindicato_salvar_aviso( $post_id ) {
    if ( ! isset( $_POST['sindicato_aviso_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_aviso_nonce'], 'sindicato_salvar_aviso' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    $campos = array( 'sind_tipo' => '_sind_tipo', 'sind_mensagem_curta' => '_sind_mensagem_curta', 'sind_link' => '_sind_link', 'sind_texto_link' => '_sind_texto_link' );
    foreach ( $campos as $campo_post => $meta_key ) {
        if ( isset( $_POST[ $campo_post ] ) ) {
            update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $campo_post ] ) ) );
        }
    }
    if ( isset( $_POST['sind_prioridade'] ) ) {
        update_post_meta( $post_id, '_sind_prioridade', absint( $_POST['sind_prioridade'] ) );
    }
    if ( isset( $_POST['sind_ordem'] ) ) {
        update_post_meta( $post_id, '_sind_ordem', absint( $_POST['sind_ordem'] ) );
    }
    if ( isset( $_POST['sind_data_inicio'] ) ) {
        update_post_meta( $post_id, '_sind_data_inicio', sanitize_text_field( wp_unslash( $_POST['sind_data_inicio'] ) ) );
    }
    if ( isset( $_POST['sind_data_fim'] ) ) {
        update_post_meta( $post_id, '_sind_data_fim', sanitize_text_field( wp_unslash( $_POST['sind_data_fim'] ) ) );
    }
    update_post_meta( $post_id, '_sind_ativo', isset( $_POST['sind_ativo'] ) ? '1' : '0' );
}
add_action( 'save_post_aviso', 'sindicato_salvar_aviso' );
```

- [ ] **Step 2: Adicionar as funções de query em `inc/template-tags.php`**

```php
function sindicato_data_em_vigencia( $data_inicio, $data_fim ) {
    $hoje = current_time( 'Y-m-d' );
    if ( $data_inicio && $hoje < $data_inicio ) {
        return false;
    }
    if ( $data_fim && $hoje > $data_fim ) {
        return false;
    }
    return true;
}

function sindicato_get_aviso_urgente_ativo() {
    $avisos = get_posts( array(
        'post_type'      => 'aviso',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_tipo',
        'meta_value'     => 'urgente',
        'orderby'        => 'meta_value_num',
        'meta_query'     => array( array( 'key' => '_sind_prioridade', 'type' => 'NUMERIC' ) ),
        'order'          => 'DESC',
    ) );

    foreach ( $avisos as $aviso ) {
        $ativo       = get_post_meta( $aviso->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $aviso->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $aviso->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            return $aviso;
        }
    }
    return null;
}

function sindicato_get_avisos_rapidos_ativos( $limit = 5 ) {
    $avisos = get_posts( array(
        'post_type'      => 'aviso',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_tipo',
        'meta_value'     => 'rapido',
        'orderby'        => 'meta_value_num',
        'meta_query'     => array( array( 'key' => '_sind_ordem', 'type' => 'NUMERIC' ) ),
        'order'          => 'ASC',
    ) );

    $ativos = array();
    foreach ( $avisos as $aviso ) {
        $ativo       = get_post_meta( $aviso->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $aviso->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $aviso->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            $ativos[] = $aviso;
        }
        if ( count( $ativos ) >= $limit ) {
            break;
        }
    }
    return $ativos;
}
```

- [ ] **Step 3: Incluir `inc/cpt-aviso.php` em `functions.php`**

```php
require get_template_directory() . '/inc/cpt-aviso.php';
```

- [ ] **Step 4: Adicionar o markup condicional em `front-page.php` (faixa de aviso urgente + painel de avisos rápidos), substituindo o placeholder da Task 2**

```php
<?php
get_header();
$aviso_urgente  = sindicato_get_aviso_urgente_ativo();
$avisos_rapidos = sindicato_get_avisos_rapidos_ativos( 5 );
?>
<?php if ( $aviso_urgente ) : ?>
<section class="alert-strip" aria-label="Comunicado urgente">
    <div class="container alert-strip__inner">
        <strong><?php echo esc_html( $aviso_urgente->post_title ); ?></strong>
        <span><?php echo esc_html( get_post_meta( $aviso_urgente->ID, '_sind_mensagem_curta', true ) ); ?></span>
        <a href="<?php echo esc_url( get_post_meta( $aviso_urgente->ID, '_sind_link', true ) ?: '#' ); ?>">
            <?php echo esc_html( get_post_meta( $aviso_urgente->ID, '_sind_texto_link', true ) ?: 'Ver comunicados' ); ?>
        </a>
    </div>
</section>
<?php endif; ?>

<section id="noticias" class="section section--news">
    <div class="container">
        <div class="news-layout<?php echo empty( $avisos_rapidos ) ? ' news-layout--without-notices' : ''; ?>">
            <p>Notícias entram na Task 5.</p>

            <?php if ( ! empty( $avisos_rapidos ) ) : ?>
            <aside id="avisos" class="notice-panel" aria-label="Avisos rápidos">
                <div class="notice-panel__header">
                    <h3>Avisos rápidos</h3>
                    <a href="#">Todos</a>
                </div>
                <ul class="notice-list">
                    <?php foreach ( $avisos_rapidos as $aviso ) : ?>
                    <li>
                        <time datetime="<?php echo esc_attr( get_post_meta( $aviso->ID, '_sind_data_inicio', true ) ); ?>">
                            <?php echo esc_html( date_i18n( 'd/m', strtotime( get_post_meta( $aviso->ID, '_sind_data_inicio', true ) ) ) ); ?>
                        </time>
                        <span><?php echo esc_html( $aviso->post_title ); ?></span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </aside>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php get_footer(); ?>
```

- [ ] **Step 5: Testar cenário SEM avisos**

```bash
curl -s http://localhost/sindicato/ | grep -c "alert-strip"
curl -s http://localhost/sindicato/ | grep -c "notice-panel"
curl -s http://localhost/sindicato/ | grep -c "news-layout--without-notices"
```

Expected: `0`, `0`, `1` (nenhum aviso cadastrado ainda, então nada aparece e a classe de layout sem avisos está presente).

- [ ] **Step 6: Semear um aviso urgente ativo e um aviso rápido ativo via WP-CLI, depois testar**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

ID_URGENTE=$($PHP $WP post create --post_type=aviso --post_title="Assembleia geral" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_URGENTE _sind_tipo urgente $PATHARG
$PHP $WP post meta update $ID_URGENTE _sind_mensagem_curta "Assembleia geral nesta quinta, às 18h, na sede." $PATHARG
$PHP $WP post meta update $ID_URGENTE _sind_ativo 1 $PATHARG
$PHP $WP post meta update $ID_URGENTE _sind_prioridade 10 $PATHARG

ID_RAPIDO=$($PHP $WP post create --post_type=aviso --post_title="Plantao juridico" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_RAPIDO _sind_tipo rapido $PATHARG
$PHP $WP post meta update $ID_RAPIDO _sind_ativo 1 $PATHARG
$PHP $WP post meta update $ID_RAPIDO _sind_ordem 1 $PATHARG
$PHP $WP post meta update $ID_RAPIDO _sind_data_inicio "$(date +%Y-%m-%d)" $PATHARG

curl -s http://localhost/sindicato/ | grep -c "Assembleia geral nesta quinta"
curl -s http://localhost/sindicato/ | grep -c "Plantao juridico"
curl -s http://localhost/sindicato/ | grep -c "news-layout--without-notices"
```

Expected: primeiros dois greps `1` cada (aviso urgente e aviso rápido aparecem), terceiro grep `0` (classe de "sem avisos" não deve mais estar presente).

- [ ] **Step 7: Testar expiração — setar `_sind_data_fim` no passado e confirmar que o aviso rápido some**

```bash
$PHP $WP post meta update $ID_RAPIDO _sind_data_fim "2020-01-01" $PATHARG
curl -s http://localhost/sindicato/ | grep -c "Plantao juridico"
curl -s http://localhost/sindicato/ | grep -c "news-layout--without-notices"
```

Expected: primeiro grep `0` (expirado, não aparece), segundo grep `1` (painel some, layout reorganiza).

- [ ] **Step 8: Commit**

```bash
git add wp-content/themes/sindicato/inc/cpt-aviso.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/front-page.php
git commit -m "feat: cpt aviso com regra condicional de urgente e rapido"
```

---

## Task 5: Notícias Na Home (Post Nativo + Categorias) E Templates De Listagem/Single

**Files:**
- Modify: `wp-content/themes/sindicato/functions.php` (criar categorias padrão na ativação do tema)
- Modify: `wp-content/themes/sindicato/front-page.php` (bloco de notícias real)
- Create: `wp-content/themes/sindicato/archive.php`
- Create: `wp-content/themes/sindicato/single.php`

**Interfaces:**
- Consumes: `WP_Query` nativo do WordPress (sem função helper nova).
- Produces: nada consumido por tasks futuras.

- [ ] **Step 1: Registrar categorias padrão em `functions.php`, criadas apenas se não existirem**

```php
function sindicato_criar_categorias_padrao() {
    $categorias = array( 'Direitos', 'Assembleia', 'Reajuste', 'Benefícios', 'Jurídico', 'Convênios', 'Campanha Salarial', 'Comunicados' );
    foreach ( $categorias as $categoria ) {
        if ( ! term_exists( $categoria, 'category' ) ) {
            wp_insert_term( $categoria, 'category' );
        }
    }
}
add_action( 'after_switch_theme', 'sindicato_criar_categorias_padrao' );
```

- [ ] **Step 2: Rodar a criação de categorias manualmente (o hook só dispara ao trocar de tema, e o tema já está ativo)**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" eval 'sindicato_criar_categorias_padrao();' --path="/c/xampp/htdocs/sindicato" --allow-root
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" term list category --path="/c/xampp/htdocs/sindicato" --allow-root --format=csv
```

Expected: lista inclui `Direitos, Assembleia, Reajuste, Benefícios, Jurídico, Convênios, Campanha Salarial, Comunicados` além de `Uncategorized`.

- [ ] **Step 3: Substituir o placeholder `<p>Notícias entram na Task 5.</p>` em `front-page.php` pelo bloco real (post em destaque + grid de posts + o aside de avisos rápidos da Task 4 continua logo depois)**

```php
<?php
$noticia_destaque = get_posts( array( 'posts_per_page' => 1, 'post_status' => 'publish' ) );
$noticias_grid    = get_posts( array( 'posts_per_page' => 3, 'offset' => 1, 'post_status' => 'publish' ) );
?>
<?php if ( $noticia_destaque ) : $post = $noticia_destaque[0]; setup_postdata( $post ); ?>
<article class="featured-post">
    <div class="post-image post-image--assembly" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
    <div class="featured-post__body">
        <div class="post-meta">
            <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
            <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
        </div>
        <h3><?php the_title(); ?></h3>
        <p><?php echo esc_html( get_the_excerpt() ); ?></p>
        <a class="text-link" href="<?php the_permalink(); ?>">Leia mais</a>
    </div>
</article>
<?php wp_reset_postdata(); endif; ?>

<div class="post-grid" aria-label="Posts recentes do blog">
    <?php foreach ( $noticias_grid as $post ) : setup_postdata( $post ); ?>
    <article class="post-card">
        <div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
        <div class="post-card__body">
            <div class="post-meta">
                <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
                <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
            </div>
            <h3><?php the_title(); ?></h3>
            <p><?php echo esc_html( get_the_excerpt() ); ?></p>
        </div>
    </article>
    <?php endforeach; wp_reset_postdata(); ?>
</div>
```

- [ ] **Step 4: Criar `archive.php` com listagem paginada**

```php
<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1><?php single_cat_title(); ?></h1>
    <?php if ( have_posts() ) : ?>
        <div class="post-grid">
            <?php while ( have_posts() ) : the_post(); ?>
            <article class="post-card">
                <div class="post-card__body">
                    <div class="post-meta">
                        <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
                        <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
                    </div>
                    <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    <p><?php echo esc_html( get_the_excerpt() ); ?></p>
                </div>
            </article>
            <?php endwhile; ?>
        </div>
        <?php the_posts_pagination(); ?>
    <?php else : ?>
        <p>Nenhuma notícia encontrada.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
```

- [ ] **Step 5: Criar `single.php` com metadados e compartilhamento social (links estáticos, sem SDK externo)**

```php
<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <?php while ( have_posts() ) : the_post(); ?>
    <article>
        <div class="post-meta">
            <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
            <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
        </div>
        <h1><?php the_title(); ?></h1>
        <?php the_content(); ?>
        <p>
            Compartilhar:
            <a href="https://api.whatsapp.com/send?text=<?php echo rawurlencode( get_the_title() . ' ' . get_permalink() ); ?>" target="_blank" rel="noopener">WhatsApp</a>
            |
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo rawurlencode( get_permalink() ); ?>" target="_blank" rel="noopener">Facebook</a>
        </p>
    </article>
    <?php endwhile; ?>
</div>
<?php get_footer(); ?>
```

- [ ] **Step 6: Semear uma notícia de teste e verificar home, listagem e single**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

ID_NOTICIA=$($PHP $WP post create --post_type=post --post_title="Categoria aprova pauta de reivindicacoes" --post_content="Texto de teste da noticia." --post_excerpt="Resumo de teste." --post_status=publish --porcelain $PATHARG)
$PHP $WP post term set $ID_NOTICIA category "Assembleia" $PATHARG

curl -s http://localhost/sindicato/ | grep -c "Categoria aprova pauta de reivindicacoes"
SLUG=$($PHP $WP post get $ID_NOTICIA --field=post_name $PATHARG)
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/sindicato/$SLUG/"
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/sindicato/category/assembleia/"
```

Expected: primeiro grep `1`; ambas as requisições HTTP retornam `200`.

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/front-page.php wp-content/themes/sindicato/archive.php wp-content/themes/sindicato/single.php
git commit -m "feat: home com noticias reais, listagem e single de noticias"
```

---

## Task 6: Custom Post Type `banner` (Hero Da Home)

**Files:**
- Create: `wp-content/themes/sindicato/inc/cpt-banner.php`
- Modify: `wp-content/themes/sindicato/functions.php`
- Modify: `wp-content/themes/sindicato/inc/template-tags.php`
- Modify: `wp-content/themes/sindicato/front-page.php`

**Interfaces:**
- Produces: `sindicato_get_banner_ativo()` → `WP_Post|null`.

Campos meta (prefixo `_sind_`): `_sind_subtitulo`, `_sind_cta_texto`, `_sind_cta_link`, `_sind_ordem`, `_sind_data_inicio`, `_sind_data_fim`, `_sind_ativo`. Imagem usa o **featured image** nativo do post (não precisa de campo meta próprio).

- [ ] **Step 1: Criar `inc/cpt-banner.php` seguindo o mesmo padrão de `inc/cpt-aviso.php` (register_post_type + register_post_meta + meta box + save)**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_banner() {
    register_post_type( 'banner', array(
        'labels' => array(
            'name'          => 'Banners',
            'singular_name' => 'Banner',
            'add_new_item'  => 'Adicionar Banner',
            'edit_item'     => 'Editar Banner',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-format-image',
        'supports'     => array( 'title', 'thumbnail' ),
    ) );

    register_post_meta( 'banner', '_sind_subtitulo', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'banner', '_sind_cta_texto', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'banner', '_sind_cta_link', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'esc_url_raw' ) );
    register_post_meta( 'banner', '_sind_ordem', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'banner', '_sind_data_inicio', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'banner', '_sind_data_fim', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'banner', '_sind_ativo', array( 'type' => 'boolean', 'single' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_banner' );

function sindicato_metabox_banner() {
    add_meta_box( 'sindicato_banner_campos', 'Detalhes do Banner', 'sindicato_render_metabox_banner', 'banner', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_banner' );

function sindicato_render_metabox_banner( $post ) {
    wp_nonce_field( 'sindicato_salvar_banner', 'sindicato_banner_nonce' );
    $subtitulo   = get_post_meta( $post->ID, '_sind_subtitulo', true );
    $cta_texto   = get_post_meta( $post->ID, '_sind_cta_texto', true );
    $cta_link    = get_post_meta( $post->ID, '_sind_cta_link', true );
    $ordem       = get_post_meta( $post->ID, '_sind_ordem', true ) ?: 0;
    $data_inicio = get_post_meta( $post->ID, '_sind_data_inicio', true );
    $data_fim    = get_post_meta( $post->ID, '_sind_data_fim', true );
    $ativo       = get_post_meta( $post->ID, '_sind_ativo', true );
    ?>
    <p><label for="sind_subtitulo">Subtítulo</label><br />
        <input type="text" id="sind_subtitulo" name="sind_subtitulo" class="large-text" value="<?php echo esc_attr( $subtitulo ); ?>" /></p>
    <p><label for="sind_cta_texto">Texto do botão</label><br />
        <input type="text" id="sind_cta_texto" name="sind_cta_texto" value="<?php echo esc_attr( $cta_texto ); ?>" /></p>
    <p><label for="sind_cta_link">Link do botão</label><br />
        <input type="text" id="sind_cta_link" name="sind_cta_link" class="large-text" value="<?php echo esc_attr( $cta_link ); ?>" /></p>
    <p><label for="sind_ordem">Ordem</label><br />
        <input type="number" id="sind_ordem" name="sind_ordem" value="<?php echo esc_attr( $ordem ); ?>" /></p>
    <p><label for="sind_data_inicio">Data início</label><br />
        <input type="date" id="sind_data_inicio" name="sind_data_inicio" value="<?php echo esc_attr( $data_inicio ); ?>" /></p>
    <p><label for="sind_data_fim">Data fim</label><br />
        <input type="date" id="sind_data_fim" name="sind_data_fim" value="<?php echo esc_attr( $data_fim ); ?>" /></p>
    <p><label><input type="checkbox" name="sind_ativo" value="1" <?php checked( $ativo, '1' ); ?> /> Ativo</label></p>
    <?php
}

function sindicato_salvar_banner( $post_id ) {
    if ( ! isset( $_POST['sindicato_banner_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_banner_nonce'], 'sindicato_salvar_banner' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    $campos_texto = array( 'sind_subtitulo' => '_sind_subtitulo', 'sind_cta_texto' => '_sind_cta_texto', 'sind_data_inicio' => '_sind_data_inicio', 'sind_data_fim' => '_sind_data_fim' );
    foreach ( $campos_texto as $campo_post => $meta_key ) {
        if ( isset( $_POST[ $campo_post ] ) ) {
            update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $campo_post ] ) ) );
        }
    }
    if ( isset( $_POST['sind_cta_link'] ) ) {
        update_post_meta( $post_id, '_sind_cta_link', esc_url_raw( wp_unslash( $_POST['sind_cta_link'] ) ) );
    }
    if ( isset( $_POST['sind_ordem'] ) ) {
        update_post_meta( $post_id, '_sind_ordem', absint( $_POST['sind_ordem'] ) );
    }
    update_post_meta( $post_id, '_sind_ativo', isset( $_POST['sind_ativo'] ) ? '1' : '0' );
}
add_action( 'save_post_banner', 'sindicato_salvar_banner' );
```

- [ ] **Step 2: Adicionar `sindicato_get_banner_ativo()` em `inc/template-tags.php`**

```php
function sindicato_get_banner_ativo() {
    $banners = get_posts( array(
        'post_type'      => 'banner',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_ordem',
        'orderby'        => 'meta_value_num',
        'order'          => 'ASC',
    ) );

    foreach ( $banners as $banner ) {
        $ativo       = get_post_meta( $banner->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $banner->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $banner->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            return $banner;
        }
    }
    return null;
}
```

- [ ] **Step 3: Incluir `inc/cpt-banner.php` em `functions.php`**

```php
require get_template_directory() . '/inc/cpt-banner.php';
```

- [ ] **Step 4: Adicionar a seção `<section class="hero">` em `front-page.php`, logo após a linha `get_header();` e antes do bloco `$aviso_urgente = sindicato_get_aviso_urgente_ativo();` da Task 4 (o hero nunca foi portado antes desta task — ele fica entre o header e a faixa de aviso urgente, igual à ordem do mockup)**

```php
<?php $banner = sindicato_get_banner_ativo(); ?>
<section class="hero" aria-labelledby="hero-title">
    <div class="hero__media" aria-hidden="true"<?php echo $banner && has_post_thumbnail( $banner->ID ) ? ' style="background-image:url(' . esc_url( get_the_post_thumbnail_url( $banner->ID, 'full' ) ) . ')"' : ''; ?>></div>
    <div class="container hero__content">
        <div class="hero__copy">
            <?php if ( $banner ) : ?>
                <p class="section-label"><?php echo esc_html( get_post_meta( $banner->ID, '_sind_subtitulo', true ) ); ?></p>
                <h1 id="hero-title"><?php echo esc_html( $banner->post_title ); ?></h1>
                <div class="hero__actions">
                    <a class="button button--primary" href="<?php echo esc_url( get_post_meta( $banner->ID, '_sind_cta_link', true ) ?: '#' ); ?>">
                        <?php echo esc_html( get_post_meta( $banner->ID, '_sind_cta_texto', true ) ?: 'Saiba mais' ); ?>
                    </a>
                </div>
            <?php else : ?>
                <p class="section-label">Campanha salarial 2026</p>
                <h1 id="hero-title">Nosso trabalho tem valor. Nossos direitos não são negociáveis.</h1>
                <p>Informação oficial, mobilização e atendimento para fortalecer a categoria em cada negociação.</p>
                <div class="hero__actions">
                    <a class="button button--primary" href="#noticias">Ler comunicado</a>
                    <a class="button button--ghost" href="#filie-se">Participar das assembleias</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
```

- [ ] **Step 5: Testar fallback (sem banner cadastrado) e depois com banner ativo**

```bash
curl -s http://localhost/sindicato/ | grep -c "Nosso trabalho tem valor"

PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'
ID_BANNER=$($PHP $WP post create --post_type=banner --post_title="Campanha Salarial 2026: juntos somos mais fortes" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_BANNER _sind_subtitulo "Campanha salarial 2026" $PATHARG
$PHP $WP post meta update $ID_BANNER _sind_cta_texto "Ler comunicado" $PATHARG
$PHP $WP post meta update $ID_BANNER _sind_cta_link "http://localhost/sindicato/noticias/" $PATHARG
$PHP $WP post meta update $ID_BANNER _sind_ordem 1 $PATHARG
$PHP $WP post meta update $ID_BANNER _sind_ativo 1 $PATHARG

curl -s http://localhost/sindicato/ | grep -c "Campanha Salarial 2026: juntos somos mais fortes"
curl -s http://localhost/sindicato/ | grep -c "Nosso trabalho tem valor"
```

Expected: primeiro grep `1` (fallback aparece sem banner); depois de criar o banner, segundo grep `1` (banner aparece) e terceiro grep `0` (fallback não aparece mais).

- [ ] **Step 6: Commit**

```bash
git add wp-content/themes/sindicato/inc/cpt-banner.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/front-page.php
git commit -m "feat: cpt banner com fallback institucional no hero da home"
```

---

## Task 7: Custom Post Types `podcast_episodio` E `video` (Bloco De Mídia Na Home)

**Files:**
- Create: `wp-content/themes/sindicato/inc/cpt-podcast.php`
- Create: `wp-content/themes/sindicato/inc/cpt-video.php`
- Modify: `wp-content/themes/sindicato/functions.php`
- Modify: `wp-content/themes/sindicato/inc/template-tags.php`
- Modify: `wp-content/themes/sindicato/front-page.php`

**Interfaces:**
- Produces: `sindicato_get_podcast_destaque()` → `WP_Post|null`; `sindicato_get_podcast_lista( $limit )` → `WP_Post[]`; `sindicato_get_video_destaque()` → `WP_Post|null`; `sindicato_get_video_lista( $limit )` → `WP_Post[]`.

Campos `podcast_episodio` (prefixo `_sind_`): `_sind_numero_episodio` (int), `_sind_url_player`, `_sind_plataforma`, `_sind_duracao`, `_sind_destaque_home` (`1`|`0`).
Campos `video` (prefixo `_sind_`): `_sind_url_youtube`, `_sind_destaque_home` (`1`|`0`).

- [ ] **Step 1: Criar `inc/cpt-podcast.php` (mesmo padrão das tasks anteriores: register_post_type com `supports => array('title','editor')`, register_post_meta para os 4 campos de texto/número + destaque_home boolean, meta box e save)**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_podcast() {
    register_post_type( 'podcast_episodio', array(
        'labels' => array(
            'name'          => 'Podcast',
            'singular_name' => 'Episódio',
            'add_new_item'  => 'Adicionar Episódio',
            'edit_item'     => 'Editar Episódio',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-microphone',
        'supports'     => array( 'title', 'editor' ),
    ) );

    register_post_meta( 'podcast_episodio', '_sind_numero_episodio', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'podcast_episodio', '_sind_url_player', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'esc_url_raw' ) );
    register_post_meta( 'podcast_episodio', '_sind_plataforma', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'podcast_episodio', '_sind_duracao', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'podcast_episodio', '_sind_destaque_home', array( 'type' => 'boolean', 'single' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_podcast' );

function sindicato_metabox_podcast() {
    add_meta_box( 'sindicato_podcast_campos', 'Detalhes do Episódio', 'sindicato_render_metabox_podcast', 'podcast_episodio', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_podcast' );

function sindicato_render_metabox_podcast( $post ) {
    wp_nonce_field( 'sindicato_salvar_podcast', 'sindicato_podcast_nonce' );
    $numero      = get_post_meta( $post->ID, '_sind_numero_episodio', true );
    $url_player  = get_post_meta( $post->ID, '_sind_url_player', true );
    $plataforma  = get_post_meta( $post->ID, '_sind_plataforma', true );
    $duracao     = get_post_meta( $post->ID, '_sind_duracao', true );
    $destaque    = get_post_meta( $post->ID, '_sind_destaque_home', true );
    ?>
    <p><label for="sind_numero_episodio">Número do episódio</label><br />
        <input type="number" id="sind_numero_episodio" name="sind_numero_episodio" value="<?php echo esc_attr( $numero ); ?>" /></p>
    <p><label for="sind_url_player">URL do player (Spotify/YouTube/RSS)</label><br />
        <input type="text" id="sind_url_player" name="sind_url_player" class="large-text" value="<?php echo esc_attr( $url_player ); ?>" /></p>
    <p><label for="sind_plataforma">Plataforma</label><br />
        <input type="text" id="sind_plataforma" name="sind_plataforma" value="<?php echo esc_attr( $plataforma ); ?>" /></p>
    <p><label for="sind_duracao">Duração</label><br />
        <input type="text" id="sind_duracao" name="sind_duracao" value="<?php echo esc_attr( $duracao ); ?>" /></p>
    <p><label><input type="checkbox" name="sind_destaque_home" value="1" <?php checked( $destaque, '1' ); ?> /> Destacar na home</label></p>
    <?php
}

function sindicato_salvar_podcast( $post_id ) {
    if ( ! isset( $_POST['sindicato_podcast_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_podcast_nonce'], 'sindicato_salvar_podcast' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_numero_episodio'] ) ) {
        update_post_meta( $post_id, '_sind_numero_episodio', absint( $_POST['sind_numero_episodio'] ) );
    }
    if ( isset( $_POST['sind_url_player'] ) ) {
        update_post_meta( $post_id, '_sind_url_player', esc_url_raw( wp_unslash( $_POST['sind_url_player'] ) ) );
    }
    if ( isset( $_POST['sind_plataforma'] ) ) {
        update_post_meta( $post_id, '_sind_plataforma', sanitize_text_field( wp_unslash( $_POST['sind_plataforma'] ) ) );
    }
    if ( isset( $_POST['sind_duracao'] ) ) {
        update_post_meta( $post_id, '_sind_duracao', sanitize_text_field( wp_unslash( $_POST['sind_duracao'] ) ) );
    }
    update_post_meta( $post_id, '_sind_destaque_home', isset( $_POST['sind_destaque_home'] ) ? '1' : '0' );
}
add_action( 'save_post_podcast_episodio', 'sindicato_salvar_podcast' );
```

- [ ] **Step 2: Criar `inc/cpt-video.php` seguindo o mesmo padrão, com campos `_sind_url_youtube` e `_sind_destaque_home`**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_video() {
    register_post_type( 'video', array(
        'labels' => array(
            'name'          => 'Vídeos',
            'singular_name' => 'Vídeo',
            'add_new_item'  => 'Adicionar Vídeo',
            'edit_item'     => 'Editar Vídeo',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-video-alt3',
        'supports'     => array( 'title', 'editor' ),
    ) );

    register_post_meta( 'video', '_sind_url_youtube', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'esc_url_raw' ) );
    register_post_meta( 'video', '_sind_destaque_home', array( 'type' => 'boolean', 'single' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_video' );

function sindicato_metabox_video() {
    add_meta_box( 'sindicato_video_campos', 'Detalhes do Vídeo', 'sindicato_render_metabox_video', 'video', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_video' );

function sindicato_render_metabox_video( $post ) {
    wp_nonce_field( 'sindicato_salvar_video', 'sindicato_video_nonce' );
    $url_youtube = get_post_meta( $post->ID, '_sind_url_youtube', true );
    $destaque    = get_post_meta( $post->ID, '_sind_destaque_home', true );
    ?>
    <p><label for="sind_url_youtube">URL do YouTube</label><br />
        <input type="text" id="sind_url_youtube" name="sind_url_youtube" class="large-text" value="<?php echo esc_attr( $url_youtube ); ?>" /></p>
    <p><label><input type="checkbox" name="sind_destaque_home" value="1" <?php checked( $destaque, '1' ); ?> /> Destacar na home</label></p>
    <?php
}

function sindicato_salvar_video( $post_id ) {
    if ( ! isset( $_POST['sindicato_video_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_video_nonce'], 'sindicato_salvar_video' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_url_youtube'] ) ) {
        update_post_meta( $post_id, '_sind_url_youtube', esc_url_raw( wp_unslash( $_POST['sind_url_youtube'] ) ) );
    }
    update_post_meta( $post_id, '_sind_destaque_home', isset( $_POST['sind_destaque_home'] ) ? '1' : '0' );
}
add_action( 'save_post_video', 'sindicato_salvar_video' );
```

- [ ] **Step 3: Adicionar as 4 funções de query em `inc/template-tags.php`**

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

- [ ] **Step 4: Incluir os dois novos arquivos em `functions.php`**

```php
require get_template_directory() . '/inc/cpt-podcast.php';
require get_template_directory() . '/inc/cpt-video.php';
```

- [ ] **Step 5: Adicionar o bloco de mídia em `front-page.php`, logo antes do `<?php get_footer(); ?>` final, com fallback institucional quando vazio**

```php
<?php
$podcast_destaque = sindicato_get_podcast_destaque();
$podcast_lista    = sindicato_get_podcast_lista( 3 );
$video_destaque   = sindicato_get_video_destaque();
$video_lista      = sindicato_get_video_lista( 2 );
?>
<section id="midia" class="section section--media">
    <div class="container media-grid">
        <div class="media-column">
            <div class="section-heading section-heading--compact">
                <div><p class="section-label">Áudio</p><h2>Podcast do Sindicato</h2></div>
            </div>
            <?php if ( $podcast_destaque ) : ?>
            <article class="podcast-card">
                <div class="podcast-cover"><span>Voz do Trabalhador</span><strong>Podcast</strong></div>
                <div>
                    <p class="post-meta"><span>Episódio <?php echo esc_html( get_post_meta( $podcast_destaque->ID, '_sind_numero_episodio', true ) ); ?></span></p>
                    <h3><?php echo esc_html( $podcast_destaque->post_title ); ?></h3>
                    <a class="button button--small" href="<?php echo esc_url( get_post_meta( $podcast_destaque->ID, '_sind_url_player', true ) ?: '#' ); ?>" target="_blank" rel="noopener">Ouvir agora</a>
                </div>
            </article>
            <div class="episode-list">
                <?php foreach ( $podcast_lista as $episodio ) : ?>
                <a href="<?php echo esc_url( get_post_meta( $episodio->ID, '_sind_url_player', true ) ?: '#' ); ?>" target="_blank" rel="noopener">
                    <span>#<?php echo esc_html( get_post_meta( $episodio->ID, '_sind_numero_episodio', true ) ); ?> <?php echo esc_html( $episodio->post_title ); ?></span>
                    <time><?php echo esc_html( get_post_meta( $episodio->ID, '_sind_duracao', true ) ); ?></time>
                </a>
                <?php endforeach; ?>
            </div>
            <?php else : ?>
            <p>Em breve, novos episódios do podcast do sindicato.</p>
            <?php endif; ?>
        </div>

        <div class="media-column">
            <div class="section-heading section-heading--compact">
                <div><p class="section-label">Vídeos</p><h2>Vídeos do YouTube</h2></div>
            </div>
            <?php if ( $video_destaque ) : ?>
            <article class="video-feature" data-youtube-url="<?php echo esc_url( get_post_meta( $video_destaque->ID, '_sind_url_youtube', true ) ); ?>">
                <div class="video-thumb" role="img" aria-label="<?php echo esc_attr( $video_destaque->post_title ); ?>">
                    <span class="play-button">Play</span>
                </div>
                <h3><?php echo esc_html( $video_destaque->post_title ); ?></h3>
                <a class="text-link" href="<?php echo esc_url( get_post_meta( $video_destaque->ID, '_sind_url_youtube', true ) ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
            </article>
            <div class="video-list">
                <?php foreach ( $video_lista as $video ) : ?>
                <a href="<?php echo esc_url( get_post_meta( $video->ID, '_sind_url_youtube', true ) ); ?>" target="_blank" rel="noopener"><span></span><?php echo esc_html( $video->post_title ); ?></a>
                <?php endforeach; ?>
            </div>
            <?php else : ?>
            <p>Em breve, novos vídeos no canal do sindicato. <a href="<?php echo esc_url( sindicato_get_contato( 'youtube_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Acesse o canal</a>.</p>
            <?php endif; ?>
        </div>
    </div>
</section>
```

- [ ] **Step 6: Testar fallback e depois com conteúdo cadastrado**

```bash
curl -s http://localhost/sindicato/ | grep -c "Em breve, novos episódios"
curl -s http://localhost/sindicato/ | grep -c "Em breve, novos vídeos"

PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

ID_EP=$($PHP $WP post create --post_type=podcast_episodio --post_title="Campanha salarial: unidade para avancar" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_EP _sind_numero_episodio 42 $PATHARG
$PHP $WP post meta update $ID_EP _sind_url_player "https://open.spotify.com/show/exemplo" $PATHARG
$PHP $WP post meta update $ID_EP _sind_duracao "24:10" $PATHARG
$PHP $WP post meta update $ID_EP _sind_destaque_home 1 $PATHARG

ID_VID=$($PHP $WP post create --post_type=video --post_title="Campanha Salarial 2026: juntos somos mais fortes" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_VID _sind_url_youtube "https://www.youtube.com/watch?v=exemplo" $PATHARG
$PHP $WP post meta update $ID_VID _sind_destaque_home 1 $PATHARG

curl -s http://localhost/sindicato/ | grep -c "Campanha salarial: unidade para avancar"
curl -s http://localhost/sindicato/ | grep -c "Campanha Salarial 2026: juntos somos mais fortes"
```

Expected: primeiros dois greps `1` (fallback visível sem conteúdo); depois de cadastrar, os dois últimos greps `1` cada.

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/sindicato/inc/cpt-podcast.php wp-content/themes/sindicato/inc/cpt-video.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/front-page.php
git commit -m "feat: cpt podcast e video com destaque na home e fallback institucional"
```

---

## Task 8: Custom Post Type `card_social` (Bloco Instagram Curado)

**Files:**
- Create: `wp-content/themes/sindicato/inc/cpt-card-social.php`
- Modify: `wp-content/themes/sindicato/functions.php`
- Modify: `wp-content/themes/sindicato/inc/template-tags.php`
- Modify: `wp-content/themes/sindicato/front-page.php`

**Interfaces:**
- Produces: `sindicato_get_cards_sociais( $limit = 5 )` → `WP_Post[]`.

Campos (prefixo `_sind_`): `_sind_legenda`, `_sind_link`, `_sind_ordem`. Imagem usa featured image nativo (opcional — cards sem imagem viram cards "tipo texto", como no mockup `.insta-card--type`).

- [ ] **Step 1: Criar `inc/cpt-card-social.php` seguindo o padrão das tasks anteriores**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_card_social() {
    register_post_type( 'card_social', array(
        'labels' => array(
            'name'          => 'Cards Sociais',
            'singular_name' => 'Card Social',
            'add_new_item'  => 'Adicionar Card Social',
            'edit_item'     => 'Editar Card Social',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-camera',
        'supports'     => array( 'title', 'thumbnail' ),
    ) );

    register_post_meta( 'card_social', '_sind_legenda', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'card_social', '_sind_link', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'esc_url_raw' ) );
    register_post_meta( 'card_social', '_sind_ordem', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_card_social' );

function sindicato_metabox_card_social() {
    add_meta_box( 'sindicato_card_social_campos', 'Detalhes do Card', 'sindicato_render_metabox_card_social', 'card_social', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_card_social' );

function sindicato_render_metabox_card_social( $post ) {
    wp_nonce_field( 'sindicato_salvar_card_social', 'sindicato_card_social_nonce' );
    $legenda = get_post_meta( $post->ID, '_sind_legenda', true );
    $link    = get_post_meta( $post->ID, '_sind_link', true );
    $ordem   = get_post_meta( $post->ID, '_sind_ordem', true ) ?: 0;
    ?>
    <p><label for="sind_legenda">Legenda</label><br />
        <input type="text" id="sind_legenda" name="sind_legenda" class="large-text" value="<?php echo esc_attr( $legenda ); ?>" /></p>
    <p><label for="sind_link">Link (post do Instagram)</label><br />
        <input type="text" id="sind_link" name="sind_link" class="large-text" value="<?php echo esc_attr( $link ); ?>" /></p>
    <p><label for="sind_ordem">Ordem</label><br />
        <input type="number" id="sind_ordem" name="sind_ordem" value="<?php echo esc_attr( $ordem ); ?>" /></p>
    <?php
}

function sindicato_salvar_card_social( $post_id ) {
    if ( ! isset( $_POST['sindicato_card_social_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_card_social_nonce'], 'sindicato_salvar_card_social' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_legenda'] ) ) {
        update_post_meta( $post_id, '_sind_legenda', sanitize_text_field( wp_unslash( $_POST['sind_legenda'] ) ) );
    }
    if ( isset( $_POST['sind_link'] ) ) {
        update_post_meta( $post_id, '_sind_link', esc_url_raw( wp_unslash( $_POST['sind_link'] ) ) );
    }
    if ( isset( $_POST['sind_ordem'] ) ) {
        update_post_meta( $post_id, '_sind_ordem', absint( $_POST['sind_ordem'] ) );
    }
}
add_action( 'save_post_card_social', 'sindicato_salvar_card_social' );
```

- [ ] **Step 2: Adicionar `sindicato_get_cards_sociais()` em `inc/template-tags.php`**

```php
function sindicato_get_cards_sociais( $limit = 5 ) {
    return get_posts( array(
        'post_type' => 'card_social', 'post_status' => 'publish', 'posts_per_page' => $limit,
        'meta_key' => '_sind_ordem', 'orderby' => 'meta_value_num', 'order' => 'ASC',
    ) );
}
```

- [ ] **Step 3: Incluir `inc/cpt-card-social.php` em `functions.php`**

```php
require get_template_directory() . '/inc/cpt-card-social.php';
```

- [ ] **Step 4: Adicionar o bloco de Instagram em `front-page.php`, entre o bloco de mídia (Task 7) e `get_footer()`, com fallback para link de perfil quando vazio**

```php
<?php $cards_sociais = sindicato_get_cards_sociais( 5 ); ?>
<section class="section section--instagram" aria-labelledby="instagram-title">
    <div class="container">
        <div class="section-heading">
            <div><p class="section-label">Redes sociais</p><h2 id="instagram-title">No Instagram</h2></div>
            <a class="text-link" href="<?php echo esc_url( sindicato_get_contato( 'instagram_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Ver perfil</a>
        </div>
        <?php if ( $cards_sociais ) : ?>
        <div class="instagram-grid">
            <?php foreach ( $cards_sociais as $card ) : ?>
            <article class="insta-card <?php echo has_post_thumbnail( $card->ID ) ? 'insta-card--photo' : 'insta-card--type'; ?>">
                <?php if ( has_post_thumbnail( $card->ID ) ) : ?>
                <span><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></span>
                <?php else : ?>
                <strong><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></strong>
                <?php endif; ?>
            </article>
            <?php endforeach; ?>
        </div>
        <?php else : ?>
        <p>Siga o sindicato no Instagram: <a href="<?php echo esc_url( sindicato_get_contato( 'instagram_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">@sindicato</a>.</p>
        <?php endif; ?>
    </div>
</section>
```

- [ ] **Step 5: Testar fallback e depois com um card cadastrado**

```bash
curl -s http://localhost/sindicato/ | grep -c "Siga o sindicato no Instagram"

PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'
ID_CARD=$($PHP $WP post create --post_type=card_social --post_title="Assembleia lotada" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_CARD _sind_legenda "Assembleia lotada e categoria mobilizada" $PATHARG
$PHP $WP post meta update $ID_CARD _sind_ordem 1 $PATHARG

curl -s http://localhost/sindicato/ | grep -c "Assembleia lotada e categoria mobilizada"
curl -s http://localhost/sindicato/ | grep -c "Siga o sindicato no Instagram"
```

Expected: primeiro grep `1` (fallback sem cards); depois de cadastrar, segundo grep `1` e terceiro grep `0`.

- [ ] **Step 6: Commit**

```bash
git add wp-content/themes/sindicato/inc/cpt-card-social.php wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/front-page.php
git commit -m "feat: cpt card social com fallback de link para o perfil"
```

---

## Task 9: Custom Post Type `documento` + Listagem Com Filtro Por Ano E Tipo

**Files:**
- Create: `wp-content/themes/sindicato/inc/cpt-documento.php`
- Modify: `wp-content/themes/sindicato/functions.php`
- Create: `wp-content/themes/sindicato/archive-documento.php`

**Interfaces:**
- Produces: nada consumido por outras tasks (a listagem é a única consumidora).

Campos (prefixo `_sind_`): `_sind_tipo` (`convencao`|`acordo`|`termo_aditivo`), `_sind_ano` (int), `_sind_vigencia_inicio`, `_sind_vigencia_fim`, `_sind_arquivo_pdf` (attachment ID via mídia do WP). Status usa o status nativo do post (`publish`/`draft`).

- [ ] **Step 1: Criar `inc/cpt-documento.php` com upload de PDF via `wp_enqueue_media` e um campo de attachment ID**

```php
<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_documento() {
    register_post_type( 'documento', array(
        'labels' => array(
            'name'          => 'Documentos',
            'singular_name' => 'Documento',
            'add_new_item'  => 'Adicionar Documento',
            'edit_item'     => 'Editar Documento',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-media-document',
        'supports'     => array( 'title', 'editor' ),
        'has_archive'  => false,
    ) );

    register_post_meta( 'documento', '_sind_tipo', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_ano', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'documento', '_sind_vigencia_inicio', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_vigencia_fim', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_arquivo_pdf', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_documento' );

function sindicato_metabox_documento() {
    add_meta_box( 'sindicato_documento_campos', 'Detalhes do Documento', 'sindicato_render_metabox_documento', 'documento', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_documento' );

function sindicato_render_metabox_documento( $post ) {
    wp_nonce_field( 'sindicato_salvar_documento', 'sindicato_documento_nonce' );
    $tipo             = get_post_meta( $post->ID, '_sind_tipo', true ) ?: 'convencao';
    $ano              = get_post_meta( $post->ID, '_sind_ano', true );
    $vigencia_inicio  = get_post_meta( $post->ID, '_sind_vigencia_inicio', true );
    $vigencia_fim     = get_post_meta( $post->ID, '_sind_vigencia_fim', true );
    $arquivo_pdf      = get_post_meta( $post->ID, '_sind_arquivo_pdf', true );
    wp_enqueue_media();
    ?>
    <p>
        <label for="sind_tipo">Tipo</label><br />
        <select name="sind_tipo" id="sind_tipo">
            <option value="convencao" <?php selected( $tipo, 'convencao' ); ?>>Convenção Coletiva</option>
            <option value="acordo" <?php selected( $tipo, 'acordo' ); ?>>Acordo Coletivo</option>
            <option value="termo_aditivo" <?php selected( $tipo, 'termo_aditivo' ); ?>>Termo Aditivo</option>
        </select>
    </p>
    <p><label for="sind_ano">Ano</label><br />
        <input type="number" id="sind_ano" name="sind_ano" value="<?php echo esc_attr( $ano ); ?>" /></p>
    <p><label for="sind_vigencia_inicio">Vigência início</label><br />
        <input type="date" id="sind_vigencia_inicio" name="sind_vigencia_inicio" value="<?php echo esc_attr( $vigencia_inicio ); ?>" /></p>
    <p><label for="sind_vigencia_fim">Vigência fim</label><br />
        <input type="date" id="sind_vigencia_fim" name="sind_vigencia_fim" value="<?php echo esc_attr( $vigencia_fim ); ?>" /></p>
    <p>
        <label>Arquivo PDF</label><br />
        <input type="hidden" id="sind_arquivo_pdf" name="sind_arquivo_pdf" value="<?php echo esc_attr( $arquivo_pdf ); ?>" />
        <button type="button" class="button" id="sind_selecionar_pdf">Selecionar PDF</button>
        <span id="sind_pdf_nome"><?php echo $arquivo_pdf ? esc_html( basename( get_attached_file( $arquivo_pdf ) ) ) : 'Nenhum arquivo selecionado'; ?></span>
    </p>
    <script>
    (function () {
        var botao = document.getElementById('sind_selecionar_pdf');
        if (!botao) { return; }
        botao.addEventListener('click', function (evento) {
            evento.preventDefault();
            var frame = wp.media({ title: 'Selecionar PDF', library: { type: 'application/pdf' }, button: { text: 'Usar este arquivo' }, multiple: false });
            frame.on('select', function () {
                var anexo = frame.state().get('selection').first().toJSON();
                document.getElementById('sind_arquivo_pdf').value = anexo.id;
                document.getElementById('sind_pdf_nome').textContent = anexo.filename;
            });
            frame.open();
        });
    })();
    </script>
    <?php
}

function sindicato_salvar_documento( $post_id ) {
    if ( ! isset( $_POST['sindicato_documento_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_documento_nonce'], 'sindicato_salvar_documento' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_tipo'] ) ) {
        update_post_meta( $post_id, '_sind_tipo', sanitize_text_field( wp_unslash( $_POST['sind_tipo'] ) ) );
    }
    if ( isset( $_POST['sind_ano'] ) ) {
        update_post_meta( $post_id, '_sind_ano', absint( $_POST['sind_ano'] ) );
    }
    if ( isset( $_POST['sind_vigencia_inicio'] ) ) {
        update_post_meta( $post_id, '_sind_vigencia_inicio', sanitize_text_field( wp_unslash( $_POST['sind_vigencia_inicio'] ) ) );
    }
    if ( isset( $_POST['sind_vigencia_fim'] ) ) {
        update_post_meta( $post_id, '_sind_vigencia_fim', sanitize_text_field( wp_unslash( $_POST['sind_vigencia_fim'] ) ) );
    }
    if ( isset( $_POST['sind_arquivo_pdf'] ) ) {
        update_post_meta( $post_id, '_sind_arquivo_pdf', absint( $_POST['sind_arquivo_pdf'] ) );
    }
}
add_action( 'save_post_documento', 'sindicato_salvar_documento' );
```

- [ ] **Step 2: Incluir `inc/cpt-documento.php` em `functions.php`**

```php
require get_template_directory() . '/inc/cpt-documento.php';
```

- [ ] **Step 3: Criar `archive-documento.php` com filtro por ano e tipo via query string (`?ano=2026&tipo=convencao`)**

```php
<?php
get_header();

$ano_filtro  = isset( $_GET['ano'] ) ? absint( $_GET['ano'] ) : 0;
$tipo_filtro = isset( $_GET['tipo'] ) ? sanitize_text_field( wp_unslash( $_GET['tipo'] ) ) : '';

$meta_query = array( 'relation' => 'AND' );
if ( $ano_filtro ) {
    $meta_query[] = array( 'key' => '_sind_ano', 'value' => $ano_filtro, 'compare' => '=' );
}
if ( $tipo_filtro ) {
    $meta_query[] = array( 'key' => '_sind_tipo', 'value' => $tipo_filtro, 'compare' => '=' );
}

$documentos = get_posts( array(
    'post_type'      => 'documento',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'meta_query'      => $meta_query,
    'orderby'        => 'meta_value_num',
    'meta_key'       => '_sind_ano',
    'order'          => 'DESC',
) );
?>
<div class="container" style="padding: 40px 0;">
    <h1>Convenções e Documentos</h1>
    <form method="get">
        <label>Ano
            <input type="number" name="ano" value="<?php echo esc_attr( $ano_filtro ?: '' ); ?>" />
        </label>
        <label>Tipo
            <select name="tipo">
                <option value="">Todos</option>
                <option value="convencao" <?php selected( $tipo_filtro, 'convencao' ); ?>>Convenção Coletiva</option>
                <option value="acordo" <?php selected( $tipo_filtro, 'acordo' ); ?>>Acordo Coletivo</option>
                <option value="termo_aditivo" <?php selected( $tipo_filtro, 'termo_aditivo' ); ?>>Termo Aditivo</option>
            </select>
        </label>
        <button type="submit" class="button button--primary">Filtrar</button>
    </form>

    <?php if ( $documentos ) : ?>
    <ul>
        <?php foreach ( $documentos as $documento ) :
            $arquivo_id  = get_post_meta( $documento->ID, '_sind_arquivo_pdf', true );
            $arquivo_url = $arquivo_id ? wp_get_attachment_url( $arquivo_id ) : '';
        ?>
        <li>
            <strong><?php echo esc_html( $documento->post_title ); ?></strong>
            (<?php echo esc_html( get_post_meta( $documento->ID, '_sind_ano', true ) ); ?>)
            <?php if ( $arquivo_url ) : ?>
                <a href="<?php echo esc_url( $arquivo_url ); ?>" target="_blank" rel="noopener">Baixar PDF</a>
            <?php endif; ?>
        </li>
        <?php endforeach; ?>
    </ul>
    <?php else : ?>
    <p>Nenhum documento encontrado para o filtro selecionado.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
```

- [ ] **Step 4: Criar a página `/convencoes/` no WP-admin apontando para esse template (via `page_template` custom, mais simples: rewrite rule direta)**

Adicionar em `functions.php`:

```php
function sindicato_rewrite_convencoes() {
    add_rewrite_rule( '^convencoes/?$', 'index.php?pagename=convencoes-documentos', 'top' );
}
add_action( 'init', 'sindicato_rewrite_convencoes' );

function sindicato_template_convencoes( $template ) {
    if ( is_page( 'convencoes-documentos' ) ) {
        $arquivo = get_template_directory() . '/archive-documento.php';
        if ( file_exists( $arquivo ) ) {
            return $arquivo;
        }
    }
    return $template;
}
add_filter( 'template_include', 'sindicato_template_convencoes' );
```

- [ ] **Step 5: Criar a página `convencoes-documentos` via WP-CLI e atualizar rewrite rules**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

$PHP $WP post create --post_type=page --post_title="Convenções e Documentos" --post_name="convencoes-documentos" --post_status=publish $PATHARG
$PHP $WP rewrite flush --hard $PATHARG
```

- [ ] **Step 6: Semear um documento de teste e verificar filtro**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

ID_DOC=$($PHP $WP post create --post_type=documento --post_title="Convencao Coletiva 2026" --post_status=publish --porcelain $PATHARG)
$PHP $WP post meta update $ID_DOC _sind_tipo convencao $PATHARG
$PHP $WP post meta update $ID_DOC _sind_ano 2026 $PATHARG

curl -s "http://localhost/sindicato/convencoes/" | grep -c "Convencao Coletiva 2026"
curl -s "http://localhost/sindicato/convencoes/?ano=2025" | grep -c "Convencao Coletiva 2026"
curl -s "http://localhost/sindicato/convencoes/?ano=2026&tipo=convencao" | grep -c "Convencao Coletiva 2026"
```

Expected: primeiro grep `1`, segundo grep `0` (filtro por ano diferente exclui o documento), terceiro grep `1` (filtro correto inclui).

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/sindicato/inc/cpt-documento.php wp-content/themes/sindicato/functions.php wp-content/themes/sindicato/archive-documento.php
git commit -m "feat: cpt documento com upload de pdf e listagem filtravel por ano e tipo"
```

---

## Task 10: Formulários De Contato E Filiação (Contact Form 7 + LGPD)

**Files:**
- Create: `wp-content/themes/sindicato/page-filie-se.php`
- Create: `wp-content/themes/sindicato/page-contato.php`
- Create: `docs/lgpd/campos-formularios.md`

**Interfaces:** nenhuma nova função PHP — os formulários usam o shortcode `[contact-form-7]` do plugin.

- [ ] **Step 1: Instalar e ativar o Contact Form 7 via WP-CLI**

```bash
"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" plugin install contact-form-7 --activate --path="/c/xampp/htdocs/sindicato" --allow-root
```

Expected: `Plugin 'contact-form-7' activated.`

- [ ] **Step 2: Criar o formulário de contato via `wp eval` (idempotente — só cria se não existir)**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

$PHP $WP eval '
$existente = get_page_by_title( "Formulario de Contato", OBJECT, "wpcf7_contact_form" );
if ( ! $existente ) {
    $form = WPCF7_ContactForm::get_template( array( "title" => "Formulario de Contato" ) );
    $form->set_properties( array(
        "form" => "[text* seu-nome placeholder \"Seu nome\"]\n[email* seu-email placeholder \"Seu e-mail\"]\n[select setor \"Atendimento geral\" \"Juridico\" \"Filiacao\" \"Beneficios\"]\n[textarea sua-mensagem placeholder \"Sua mensagem\"]\n[acceptance aceite-lgpd] Li e concordo com a Politica de Privacidade. [/acceptance]\n[submit \"Enviar\"]",
        "mail" => array(
            "subject" => "[Contato do site] [seu-nome]",
            "sender" => "[seu-nome] <wordpress@localhost>",
            "recipient" => "contato@sindicato.org.br",
            "body" => "Nome: [seu-nome]\nE-mail: [seu-email]\nSetor: [setor]\nMensagem:\n[sua-mensagem]",
            "additional_headers" => "Reply-To: [seu-email]",
            "attachments" => "",
            "use_html" => false,
            "exclude_blank" => false,
        ),
        "messages" => array_merge( $form->prop( "messages" ), array(
            "mail_sent_ok" => "Mensagem enviada com sucesso. Retornaremos em breve.",
            "invalid_required" => "Preencha este campo obrigatorio.",
            "accept_terms" => "E necessario aceitar os termos para enviar.",
        ) ),
    ) );
    $form->save();
    echo "Formulario de Contato criado: " . $form->id() . PHP_EOL;
} else {
    echo "Formulario de Contato ja existe: " . $existente->ID . PHP_EOL;
}
' $PATHARG
```

- [ ] **Step 3: Criar o formulário de filiação da mesma forma**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

$PHP $WP eval '
$existente = get_page_by_title( "Formulario de Filiacao", OBJECT, "wpcf7_contact_form" );
if ( ! $existente ) {
    $form = WPCF7_ContactForm::get_template( array( "title" => "Formulario de Filiacao" ) );
    $form->set_properties( array(
        "form" => "[text* seu-nome placeholder \"Seu nome completo\"]\n[email* seu-email placeholder \"Seu e-mail\"]\n[tel* seu-telefone placeholder \"Seu telefone\"]\n[text empresa placeholder \"Empresa onde trabalha\"]\n[acceptance aceite-lgpd] Li e concordo com a Politica de Privacidade. [/acceptance]\n[submit \"Quero me associar\"]",
        "mail" => array(
            "subject" => "[Interesse em filiacao] [seu-nome]",
            "sender" => "[seu-nome] <wordpress@localhost>",
            "recipient" => "contato@sindicato.org.br",
            "body" => "Nome: [seu-nome]\nE-mail: [seu-email]\nTelefone: [seu-telefone]\nEmpresa: [empresa]",
            "additional_headers" => "Reply-To: [seu-email]",
            "attachments" => "",
            "use_html" => false,
            "exclude_blank" => false,
        ),
        "messages" => array_merge( $form->prop( "messages" ), array(
            "mail_sent_ok" => "Recebemos seu interesse em se associar. Entraremos em contato em breve.",
            "invalid_required" => "Preencha este campo obrigatorio.",
            "accept_terms" => "E necessario aceitar os termos para enviar.",
        ) ),
    ) );
    $form->save();
    echo "Formulario de Filiacao criado: " . $form->id() . PHP_EOL;
} else {
    echo "Formulario de Filiacao ja existe: " . $existente->ID . PHP_EOL;
}
' $PATHARG
```

- [ ] **Step 4: Criar `page-contato.php` com o shortcode, WhatsApp e dados de contato dinâmicos**

```php
<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1>Contato</h1>
    <p>Telefone: <?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></p>
    <p>Endereço: <?php echo esc_html( sindicato_get_contato( 'endereco' ) ); ?></p>
    <p>
        <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, gostaria de falar com o sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </p>
    <iframe
        title="Mapa do endereço do sindicato"
        src="https://maps.google.com/maps?q=<?php echo rawurlencode( sindicato_get_contato( 'endereco' ) ); ?>&output=embed"
        width="100%" height="300" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
    </iframe>
    <?php echo do_shortcode( '[contact-form-7 title="Formulario de Contato"]' ); ?>
</div>
<?php get_footer(); ?>
```

- [ ] **Step 5: Criar `page-filie-se.php` com o shortcode de filiação, benefícios e WhatsApp**

```php
<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1>Filie-se ao Sindicato</h1>
    <p>Associar-se fortalece a categoria nas negociações e garante acesso a benefícios exclusivos.</p>
    <p>
        <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, quero me filiar ao sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </p>
    <?php echo do_shortcode( '[contact-form-7 title="Formulario de Filiacao"]' ); ?>
</div>
<?php get_footer(); ?>
```

- [ ] **Step 6: Criar as páginas `/contato/` e `/filie-se/` no WP e vincular aos templates**

```bash
PHP="/c/xampp/php/php.exe"
WP="/c/xampp/wp-cli/wp-cli.phar"
PATHARG='--path=/c/xampp/htdocs/sindicato --allow-root'

$PHP $WP post create --post_type=page --post_title="Contato" --post_name="contato" --post_status=publish $PATHARG
$PHP $WP post create --post_type=page --post_title="Filie-se" --post_name="filie-se" --post_status=publish $PATHARG
```

(`page-contato.php` e `page-filie-se.php` são escolhidos automaticamente pelo WordPress via convenção de nome de arquivo `page-{slug}.php`, sem necessidade de configurar template manualmente.)

- [ ] **Step 7: Testar que as páginas renderizam os formulários com o campo de consentimento LGPD**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/sindicato/contato/"
curl -s "http://localhost/sindicato/contato/" | grep -c "wpcf7-form"
curl -s "http://localhost/sindicato/contato/" | grep -c "Li e concordo com a Politica de Privacidade"
curl -s "http://localhost/sindicato/contato/" | grep -c "maps.google.com/maps"

curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/sindicato/filie-se/"
curl -s "http://localhost/sindicato/filie-se/" | grep -c "wpcf7-form"
curl -s "http://localhost/sindicato/filie-se/" | grep -c "Li e concordo com a Politica de Privacidade"
```

Expected: os dois status HTTP `200`; os cinco greps de conteúdo `1` cada (formulário presente com o checkbox de consentimento em ambas as páginas, mapa presente na página de contato).

- [ ] **Step 8: Documentar os campos coletados e a base legal (rascunho para revisão jurídica futura) em `docs/lgpd/campos-formularios.md`**

```markdown
# Campos Coletados Nos Formulários

## Formulário de Contato
- Nome (obrigatório)
- E-mail (obrigatório)
- Setor de atendimento (obrigatório)
- Mensagem (obrigatório)
- Consentimento LGPD (obrigatório, checkbox)

## Formulário de Filiação
- Nome completo (obrigatório)
- E-mail (obrigatório)
- Telefone (obrigatório)
- Empresa (opcional)
- Consentimento LGPD (obrigatório, checkbox)

## Pendências
- Texto final da Política de Privacidade ainda não existe — o link nos formulários aponta para `/politica-de-privacidade/`, página a ser criada quando o time jurídico aprovar o texto (fora do escopo deste plano).
- Configuração de SMTP autenticado para envio real de e-mail ainda não foi feita (sem SMTP configurado, o Contact Form 7 usa `wp_mail` padrão do PHP, que não entrega e-mail em produção sem um plugin de SMTP).
```

- [ ] **Step 9: Commit**

```bash
git add wp-content/themes/sindicato/page-contato.php wp-content/themes/sindicato/page-filie-se.php docs/lgpd/campos-formularios.md
git commit -m "feat: formularios de contato e filiacao com consentimento lgpd via contact form 7"
```

---

## Task 11: Seções Estáticas Restantes (Acesso Rápido E CTA De Associação)

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php`

**Interfaces:** nenhuma — seções estáticas, sem CPT (o mockup e o plano estratégico não definem essas seções como conteúdo gerenciável, apenas como navegação institucional fixa).

Estas duas seções do mockup (`index.html` linhas 157-189 e 278-286) ainda não foram portadas para `front-page.php` nas tasks anteriores. Os links devem apontar para as páginas reais já criadas nas Tasks 9 e 10 (`/convencoes/`, `/filie-se/`, `/contato/`) em vez das âncoras `#` do mockup.

- [ ] **Step 1: Adicionar a seção "Acesso rápido" em `front-page.php`, logo após a seção `#noticias` (depois do bloco fechado na Task 4/5) e antes da seção `#midia` da Task 7**

```php
<section id="convencoes" class="section section--quick">
    <div class="container">
        <div class="section-heading">
            <div>
                <p class="section-label">Serviços para a categoria</p>
                <h2>Acesso rápido</h2>
            </div>
        </div>

        <div class="quick-grid">
            <a class="quick-card" href="<?php echo esc_url( home_url( '/convencoes/' ) ); ?>">
                <span class="quick-card__icon">CCT</span>
                <strong>Convenção coletiva</strong>
                <small>Consulte a convenção vigente, cláusulas e documentos.</small>
            </a>
            <a id="beneficios" class="quick-card quick-card--teal" href="#beneficios">
                <span class="quick-card__icon">BEN</span>
                <strong>Benefícios</strong>
                <small>Descontos em saúde, educação, lazer e convênios.</small>
            </a>
            <a class="quick-card" href="<?php echo esc_url( home_url( '/contato/' ) ); ?>">
                <span class="quick-card__icon">JUR</span>
                <strong>Atendimento jurídico</strong>
                <small>Orientação sobre direitos trabalhistas e acordos.</small>
            </a>
            <a id="filie-se" class="quick-card quick-card--red" href="<?php echo esc_url( home_url( '/filie-se/' ) ); ?>">
                <span class="quick-card__icon">SIM</span>
                <strong>Associe-se</strong>
                <small>Fortaleça o sindicato e tenha mais representatividade.</small>
            </a>
        </div>
    </div>
</section>
```

- [ ] **Step 2: Adicionar a seção "CTA de associação" em `front-page.php`, logo após a seção Instagram da Task 8 e antes de `get_footer()`**

```php
<section id="associado" class="cta-band">
    <div class="container cta-band__inner">
        <div>
            <p class="section-label">Fortaleça sua representação</p>
            <h2>Associe-se ao sindicato e acompanhe tudo em primeira mão.</h2>
        </div>
        <a class="button button--primary" href="<?php echo esc_url( home_url( '/contato/' ) ); ?>">Quero me associar</a>
    </div>
</section>
```

- [ ] **Step 3: Testar que as duas seções aparecem na home com os links corretos**

```bash
curl -s http://localhost/sindicato/ | grep -c "quick-grid"
curl -s http://localhost/sindicato/ | grep -c "cta-band"
curl -s http://localhost/sindicato/ | grep -c "href=\"http://localhost/sindicato/convencoes/\""
curl -s http://localhost/sindicato/ | grep -c "href=\"http://localhost/sindicato/filie-se/\""
```

Expected: todos os quatro greps `1` ou mais.

- [ ] **Step 4: Commit**

```bash
git add wp-content/themes/sindicato/front-page.php
git commit -m "feat: portar acesso rapido e cta de associacao do mockup para a home"
```

---

## Nota Final De Escopo

Este plano cobre a Fase 3 (tema customizado), Fase 4 (tipos de conteúdo e campos), parte da Fase 5 (templates dinâmicos da home, notícias, documentos) e parte da Fase 6 (formulários com consentimento LGPD) do plano estratégico. **Não cobre**: menu mobile via `wp_nav_menu` configurável no admin (o menu principal continua com âncoras fixas do mockup), página de institucional/diretoria (dependem de conteúdo real ainda não aprovado), texto final de política de privacidade, SMTP de produção, SEO/acessibilidade/performance (Fase 7), segurança/backup/deploy (Fase 8 e 11) e conteúdo institucional real (Fase 9) — todos bloqueados por decisões pendentes na seção 16 do plano estratégico ou por exigirem ambiente de produção. Recomenda-se um plano de continuação após essas decisões serem tomadas.
