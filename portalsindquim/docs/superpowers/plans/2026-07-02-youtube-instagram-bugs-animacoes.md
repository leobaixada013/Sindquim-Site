# YouTube Embutido, Instagram Real, Bugs e Animações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Player do YouTube embutido no site (lite embed), feed real do Instagram via Smash Balloon com fallback, correção de 8 bugs catalogados e animações sutis com `prefers-reduced-motion`.

**Architecture:** Tema WordPress clássico (PHP puro) em `wp-content/themes/sindicato/`, linkado por junction em `C:\xampp\htdocs\sindicato\wp-content\themes\sindicato`. Vídeos vêm do RSS do YouTube já implementado em `inc/youtube.php` (cache via transient); o player é injetado no cliente só após o toque. Instagram usa o plugin Smash Balloon renderizado condicionalmente com fallback nos cards manuais (CPT `card_social`).

**Tech Stack:** WordPress 7.0 (XAMPP: PHP 8.2, MariaDB 10.4), WP-CLI, Contact Form 7 (já instalado), Smash Balloon Instagram Feed (a instalar), CSS/JS vanilla.

## Global Constraints

- Todo comando WP-CLI: `"/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" <comando> --path="/c/xampp/htdocs/sindicato" --allow-root` (usar o Bash tool; nos passos abaixo, `WP` = esse prefixo).
- O tema no repositório e o do XAMPP são o MESMO diretório (junction) — nunca copiar arquivos entre os dois caminhos.
- Sem PHPUnit: teste = seed via WP-CLI + `curl -s http://localhost/sindicato/... | grep <marcador>` + screenshot headless (`msedge --headless`) para mudanças visuais.
- Screenshot headless: `& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="<caminho>" --window-size=390,844 http://localhost/sindicato/` (mobile) e `--window-size=1280,900` (desktop). Salvar em `screenshots/`.
- Todo texto visível ao usuário em pt-BR com acentuação correta.
- Saída sempre escapada: `esc_html`, `esc_attr`, `esc_url` (exceto HTML gerado por plugin, explicitamente marcado).
- Toda animação/transição CSS dentro de `@media (prefers-reduced-motion: no-preference)`.
- Commit ao final de cada task com `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Após a última task, rodar `graphify update .`.

---

### Task 1: Bug 8 — Aviso urgente some sem meta de prioridade

**Files:**
- Modify: `wp-content/themes/sindicato/inc/template-tags.php:26-46` (função `sindicato_get_aviso_urgente_ativo`)

**Interfaces:**
- Produces: `sindicato_get_aviso_urgente_ativo()` mantém a mesma assinatura (`→ WP_Post|null`); posts sem `_sind_prioridade` agora contam como prioridade 0.

- [ ] **Step 1: Reproduzir o bug**

```bash
WP() { "/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" "$@" --path="/c/xampp/htdocs/sindicato" --allow-root; }
# garantir que não há outro aviso urgente ativo interferindo
WP post list --post_type=aviso --format=table --fields=ID,post_title
ID=$(WP post create --post_type=aviso --post_status=publish --post_title="Aviso teste sem prioridade" --porcelain)
WP post meta set "$ID" _sind_tipo urgente
WP post meta set "$ID" _sind_ativo 1
curl -s http://localhost/sindicato/ | grep -c "Aviso teste sem prioridade"
```

Expected: `0` — o aviso NÃO aparece (bug reproduzido), porque a query usa `meta_key => '_sind_prioridade'` que exclui posts sem esse meta.
(Se existirem outros avisos urgentes ativos da base de testes, desativá-los antes: `WP post meta set <ID> _sind_ativo 0`.)

- [ ] **Step 2: Corrigir a query**

Em `inc/template-tags.php`, substituir a função inteira:

```php
function sindicato_get_aviso_urgente_ativo() {
    $avisos = get_posts( array(
        'post_type'      => 'aviso',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_query'     => array( array( 'key' => '_sind_tipo', 'value' => 'urgente' ) ),
    ) );

    usort( $avisos, function ( $a, $b ) {
        $prioridade_a = (int) get_post_meta( $a->ID, '_sind_prioridade', true );
        $prioridade_b = (int) get_post_meta( $b->ID, '_sind_prioridade', true );
        return $prioridade_b - $prioridade_a;
    } );

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
```

- [ ] **Step 3: Verificar a correção**

```bash
curl -s http://localhost/sindicato/ | grep -c "Aviso teste sem prioridade"
```

Expected: `1`.

Também verificar que a prioridade continua respeitada: criar um segundo aviso urgente ativo com prioridade maior e confirmar que ele vence:

```bash
ID2=$(WP post create --post_type=aviso --post_status=publish --post_title="Aviso prioritario teste" --porcelain)
WP post meta set "$ID2" _sind_tipo urgente
WP post meta set "$ID2" _sind_ativo 1
WP post meta set "$ID2" _sind_prioridade 10
curl -s http://localhost/sindicato/ | grep -c "Aviso prioritario teste"   # Expected: 1
curl -s http://localhost/sindicato/ | grep -c "Aviso teste sem prioridade" # Expected: 0
```

- [ ] **Step 4: Limpar seeds e commitar**

```bash
WP post delete "$ID" --force
WP post delete "$ID2" --force
cd "C:/Users/Eduardo/OneDrive/Documentos/site sindicato"
git add wp-content/themes/sindicato/inc/template-tags.php
git commit -m "fix: aviso urgente aparece mesmo sem meta de prioridade

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Bugs 1+2 — Âncoras do menu quebradas fora da home

**Files:**
- Modify: `wp-content/themes/sindicato/header.php:19,41,43,44,47`

**Interfaces:**
- Produces: nenhuma API; apenas hrefs absolutos `home_url( '/#ancora' )`.

- [ ] **Step 1: Reproduzir o bug**

```bash
curl -s http://localhost/sindicato/noticias/ | grep -c 'href="#convencoes"'
```

Expected: `1` (âncora pura — em `/noticias/` esse link não leva a lugar nenhum).

- [ ] **Step 2: Corrigir os cinco links**

Em `header.php`, trocar:

```php
<a href="#associado">Área do Associado</a>
```
por
```php
<a href="<?php echo esc_url( home_url( '/#associado' ) ); ?>">Área do Associado</a>
```

```php
<a href="#convencoes">Convenções</a>
```
por
```php
<a href="<?php echo esc_url( home_url( '/#convencoes' ) ); ?>">Convenções</a>
```

```php
<a href="#midia">Mídia</a>
```
por
```php
<a href="<?php echo esc_url( home_url( '/#midia' ) ); ?>">Mídia</a>
```

```php
<a href="#contato">Contato</a>
```
por
```php
<a href="<?php echo esc_url( home_url( '/#contato' ) ); ?>">Contato</a>
```

```php
<a class="button button--primary nav-cta" href="#filie-se">Filie-se</a>
```
por
```php
<a class="button button--primary nav-cta" href="<?php echo esc_url( home_url( '/#filie-se' ) ); ?>">Filie-se</a>
```

(O `<a href="#contato">` do telefone na topbar NÃO entra aqui — vira link `tel:` na Task 3.)

- [ ] **Step 3: Verificar**

```bash
curl -s http://localhost/sindicato/noticias/ | grep -c 'href="http://localhost/sindicato/#convencoes"'  # Expected: 1
curl -s http://localhost/sindicato/noticias/ | grep -c 'href="#convencoes"'                              # Expected: 0
curl -s http://localhost/sindicato/ | grep -c 'href="http://localhost/sindicato/#midia"'                 # Expected: 1
```

- [ ] **Step 4: Commit**

```bash
git add wp-content/themes/sindicato/header.php
git commit -m "fix: links de âncora do menu funcionam fora da home

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Bug 4 — Telefone e WhatsApp tocáveis (tel:/wa.me)

**Files:**
- Modify: `wp-content/themes/sindicato/inc/template-tags.php` (adicionar 2 helpers no fim do arquivo)
- Modify: `wp-content/themes/sindicato/header.php:17` (telefone da topbar)
- Modify: `wp-content/themes/sindicato/footer.php:21-22` (telefone e WhatsApp)

**Interfaces:**
- Produces: `sindicato_link_telefone( string $numero ) → string` (`tel:+55...` ou `''`); `sindicato_link_whatsapp( string $numero ) → string` (`https://wa.me/55...` ou `''`).

- [ ] **Step 1: Reproduzir**

```bash
curl -s http://localhost/sindicato/ | grep -c 'href="tel:'          # Expected: 0
curl -s http://localhost/sindicato/ | grep -c 'https://wa.me/'      # Expected: 0
```

- [ ] **Step 2: Adicionar helpers em `inc/template-tags.php`**

```php
function sindicato_normalizar_digitos_telefone( $numero ) {
    $digitos = preg_replace( '/\D+/', '', (string) $numero );
    if ( '' === $digitos ) {
        return '';
    }
    if ( strlen( $digitos ) <= 11 ) {
        $digitos = '55' . $digitos;
    }
    return $digitos;
}

function sindicato_link_telefone( $numero ) {
    $digitos = sindicato_normalizar_digitos_telefone( $numero );
    return $digitos ? 'tel:+' . $digitos : '';
}

function sindicato_link_whatsapp( $numero ) {
    $digitos = sindicato_normalizar_digitos_telefone( $numero );
    return $digitos ? 'https://wa.me/' . $digitos : '';
}
```

- [ ] **Step 3: Usar nos templates**

`header.php` — trocar:
```php
<a href="#contato"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a>
```
por:
```php
<a href="<?php echo esc_url( sindicato_link_telefone( sindicato_get_contato( 'telefone' ) ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a>
```

`footer.php` — trocar:
```php
<p><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></p>
<p><?php echo esc_html( sindicato_get_contato( 'whatsapp' ) ); ?> WhatsApp</p>
```
por:
```php
<p><a href="<?php echo esc_url( sindicato_link_telefone( sindicato_get_contato( 'telefone' ) ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a></p>
<p><a href="<?php echo esc_url( sindicato_link_whatsapp( sindicato_get_contato( 'whatsapp' ) ) ); ?>" target="_blank" rel="noopener"><?php echo esc_html( sindicato_get_contato( 'whatsapp' ) ); ?> WhatsApp</a></p>
```

- [ ] **Step 4: Verificar**

Com os defaults `(13) 3222-4455` e `(13) 99988-7766`:

```bash
curl -s http://localhost/sindicato/ | grep -c 'href="tel:+551332224455"'      # Expected: 1
curl -s http://localhost/sindicato/ | grep -c 'https://wa.me/5513999887766'   # Expected: 1
```

(Se as opções tiverem sido alteradas na base local, conferir o valor atual com `WP option get sindicato_contato` e ajustar o número esperado do grep.)

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/sindicato/inc/template-tags.php wp-content/themes/sindicato/header.php wp-content/themes/sindicato/footer.php
git commit -m "fix: telefone e WhatsApp viram links tocáveis (tel:/wa.me)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Bug 3 — Cards de notícia usam a imagem destacada real

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php:54,70`
- Modify: `wp-content/themes/sindicato/assets/css/main.css` (garantia de `background-size` no `.post-image`)

**Interfaces:**
- Consumes: `get_the_post_thumbnail_url( $post, 'large' )` (WordPress core).

- [ ] **Step 1: Reproduzir**

```bash
WP() { "/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" "$@" --path="/c/xampp/htdocs/sindicato" --allow-root; }
POST_ID=$(WP post list --post_type=post --posts_per_page=1 --format=ids)
WP media import "C:/xampp/htdocs/sindicato/wp-content/themes/sindicato/assets/img/logo-sindicato.jpeg" --post_id="$POST_ID" --featured_image --porcelain
curl -s http://localhost/sindicato/ | grep -o 'class="post-image[^"]*"[^>]*' | grep -c 'wp-content/uploads'
```

Expected: `0` — a imagem destacada existe mas não é usada (bug).

- [ ] **Step 2: Corrigir os dois pontos em `front-page.php`**

Destaque (linha 54) — trocar:
```php
<div class="post-image post-image--assembly" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
```
por:
```php
<?php $thumb_destaque = get_the_post_thumbnail_url( $post, 'large' ); ?>
<div class="post-image post-image--assembly" role="img" aria-label="<?php the_title_attribute(); ?>"<?php echo $thumb_destaque ? ' style="background-image:url(' . esc_url( $thumb_destaque ) . ')"' : ''; ?>></div>
```

Grid (linha 70) — trocar:
```php
<div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
```
por:
```php
<?php $thumb_card = get_the_post_thumbnail_url( $post, 'medium_large' ); ?>
<div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"<?php echo $thumb_card ? ' style="background-image:url(' . esc_url( $thumb_card ) . ')"' : ''; ?>></div>
```

- [ ] **Step 3: Garantir cover no CSS**

Em `assets/css/main.css`, logo antes do bloco `.featured-post .post-image` (linha ~378), adicionar:

```css
.post-image {
  background-position: center;
  background-size: cover;
}
```

- [ ] **Step 4: Verificar**

```bash
curl -s http://localhost/sindicato/ | grep -o 'class="post-image[^"]*"[^>]*' | grep -c 'wp-content/uploads'
```

Expected: `1` ou mais (o post com thumbnail agora mostra a imagem real; os sem thumbnail mantêm a arte decorativa).

Screenshot de confirmação visual:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task4-noticias-thumbnail.png" --window-size=1280,900 http://localhost/sindicato/
```

Ler o PNG e confirmar que o card de notícia mostra a imagem importada.

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/sindicato/front-page.php wp-content/themes/sindicato/assets/css/main.css
git commit -m "fix: cards de notícia exibem a imagem destacada do post

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Bug 5 — Newsletter funcional via Contact Form 7

**Files:**
- Modify: `wp-content/themes/sindicato/footer.php:35-42`
- Modify: `wp-content/themes/sindicato/assets/css/main.css` (estilos do formulário CF7 no rodapé)

**Interfaces:**
- Consumes: shortcode `[contact-form-7 title="Newsletter"]` (CF7); `shortcode_exists( 'contact-form-7' )`.

- [ ] **Step 1: Ativar CF7 e criar o formulário**

```bash
WP() { "/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" "$@" --path="/c/xampp/htdocs/sindicato" --allow-root; }
WP plugin activate contact-form-7
WP eval '
$existente = function_exists( "wpcf7_get_contact_form_by_title" ) ? wpcf7_get_contact_form_by_title( "Newsletter" ) : null;
if ( $existente ) { echo "ja existe: " . $existente->id(); return; }
$form = WPCF7_ContactForm::get_template( array( "title" => "Newsletter" ) );
$props = $form->get_properties();
$props["form"] = "<label>Seu melhor e-mail\n[email* seu-email placeholder \"email@exemplo.com\"]</label>\n[submit \"Cadastrar\"]";
$form->set_properties( $props );
$form->save();
echo "criado: " . $form->id();
'
```

Expected: `criado: <número>` (ou `ja existe`).

- [ ] **Step 2: Trocar o formulário morto no `footer.php`**

Substituir o bloco inteiro:
```php
<form class="newsletter" action="#" method="post">
    <h3>Receba novidades</h3>
    <label for="email">Seu melhor e-mail</label>
    <div>
        <input id="email" name="email" type="email" placeholder="email@exemplo.com" />
        <button class="button button--primary" type="submit">Cadastrar</button>
    </div>
</form>
```
por:
```php
<?php if ( shortcode_exists( 'contact-form-7' ) ) : ?>
<div class="newsletter">
    <h3>Receba novidades</h3>
    <?php echo do_shortcode( '[contact-form-7 title="Newsletter"]' ); ?>
</div>
<?php endif; ?>
```

- [ ] **Step 3: Estilizar o CF7 para casar com o rodapé**

Em `assets/css/main.css`, após o bloco `.newsletter input` (linha ~872), adicionar:

```css
.newsletter .wpcf7 p {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 10px;
  margin: 12px 0 0;
}

.newsletter .wpcf7 label {
  color: #c6d5e3;
}

.newsletter .wpcf7-form-control-wrap {
  display: block;
  margin-top: 8px;
}

.newsletter .wpcf7 input[type="email"] {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0 14px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.newsletter .wpcf7 input[type="submit"] {
  min-height: 46px;
  border: 0;
  border-radius: 6px;
  padding: 0 18px;
  color: #fff;
  background: var(--red-700);
  box-shadow: 0 12px 26px rgba(211, 26, 31, 0.24);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
  cursor: pointer;
}

.newsletter .wpcf7-response-output {
  margin: 10px 0 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.82rem;
}
```

E no bloco `@media (max-width: 860px)` (junto do `.newsletter div` existente, linha ~1233):

```css
  .newsletter .wpcf7 p {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 4: Verificar**

```bash
curl -s http://localhost/sindicato/ | grep -c 'wpcf7'            # Expected: >= 1
curl -s http://localhost/sindicato/ | grep -c 'action="#"'       # Expected: 0
WP plugin deactivate contact-form-7
curl -s http://localhost/sindicato/ | grep -c 'Receba novidades' # Expected: 0 (bloco some, nada quebra)
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/  # Expected: 200
WP plugin activate contact-form-7
```

- [ ] **Step 5: Commit**

```bash
git add wp-content/themes/sindicato/footer.php wp-content/themes/sindicato/assets/css/main.css
git commit -m "fix: newsletter do rodapé envia de verdade via Contact Form 7

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Bug 7 — Otimizar hero de 1,6 MB para WebP

**Files:**
- Create: `wp-content/themes/sindicato/assets/img/hero-assembleia-sindicato.webp`
- Delete: `wp-content/themes/sindicato/assets/img/hero-assembleia-sindicato.png`
- Modify: `wp-content/themes/sindicato/assets/css/main.css:216,1213` (duas referências)

- [ ] **Step 1: Converter com PHP GD (XAMPP)**

Criar script temporário no scratchpad e rodar:

```bash
cat > "$SCRATCHPAD/otimizar-hero.php" <<'PHP'
<?php
$src = 'C:/Users/Eduardo/OneDrive/Documentos/site sindicato/wp-content/themes/sindicato/assets/img/hero-assembleia-sindicato.png';
$dest = str_replace( '.png', '.webp', $src );
if ( ! function_exists( 'imagewebp' ) ) { fwrite( STDERR, "GD sem suporte a WebP\n" ); exit( 1 ); }
$img = imagecreatefrompng( $src );
$w = imagesx( $img ); $h = imagesy( $img );
if ( $w > 1920 ) { $img = imagescale( $img, 1920, (int) round( $h * 1920 / $w ), IMG_BICUBIC ); }
imagewebp( $img, $dest, 78 ) ? print( "ok: " . filesize( $dest ) . " bytes\n" ) : exit( 1 );
PHP
"/c/xampp/php/php.exe" "$SCRATCHPAD/otimizar-hero.php"
```

Expected: `ok: <bytes>` com tamanho **< 300000** bytes. (Se GD não tiver WebP — improvável no XAMPP 8.2 — usar `imagejpeg( $img, str_replace('.png','.jpg',$src), 80 )` e ajustar as referências para `.jpg`.)

- [ ] **Step 2: Trocar as duas referências no CSS**

Em `assets/css/main.css`, linhas ~216 e ~1213, trocar `url("../img/hero-assembleia-sindicato.png")` por `url("../img/hero-assembleia-sindicato.webp")` (nas DUAS ocorrências).

- [ ] **Step 3: Remover o PNG e verificar**

```bash
rm "C:/Users/Eduardo/OneDrive/Documentos/site sindicato/wp-content/themes/sindicato/assets/img/hero-assembleia-sindicato.png"
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/wp-content/themes/sindicato/assets/img/hero-assembleia-sindicato.webp  # Expected: 200
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/css/main.css | grep -c "hero-assembleia-sindicato.webp"           # Expected: 2
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/css/main.css | grep -c "hero-assembleia-sindicato.png"            # Expected: 0
```

Screenshot para confirmar que o hero continua íntegro:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task6-hero-webp.png" --window-size=390,844 http://localhost/sindicato/
```

Ler o PNG e confirmar o hero com a foto de fundo.

- [ ] **Step 4: Commit**

```bash
git add -A wp-content/themes/sindicato/assets/img wp-content/themes/sindicato/assets/css/main.css
git commit -m "perf: hero convertido para WebP (1,6 MB -> <300 KB)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: YouTube — expor `video_id` no RSS

**Files:**
- Modify: `wp-content/themes/sindicato/inc/youtube.php:53-57,82-88`

**Interfaces:**
- Produces: itens de `sindicato_get_youtube_videos( $limit )` ganham a chave `video_id` (string, 11 chars). Task 8 depende disso.

- [ ] **Step 1: Salvar estado atual e testar a ausência**

```bash
WP() { "/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" "$@" --path="/c/xampp/htdocs/sindicato" --allow-root; }
URL_ORIGINAL=$(WP eval 'echo (string) sindicato_get_contato( "youtube_url" );')
echo "URL atual: $URL_ORIGINAL"
WP option patch update sindicato_contato youtube_url "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw" 2>/dev/null || WP eval '$o = get_option("sindicato_contato"); $o = is_array($o) ? $o : array(); $o["youtube_url"] = "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw"; update_option("sindicato_contato", $o); echo "ok";'
WP transient delete --all
WP eval '$v = sindicato_get_youtube_videos( 1 ); echo isset( $v[0]["video_id"] ) ? "TEM video_id" : "SEM video_id";'
```

Expected: `SEM video_id`.

- [ ] **Step 2: Extrair o `yt:videoId` e invalidar cache antigo**

Em `inc/youtube.php`:

(a) Trocar o bloco de leitura do cache (linhas 54-57):
```php
    $cache = get_transient( $chave_cache );
    if ( is_array( $cache ) ) {
        return array_slice( $cache, 0, $limit );
    }
```
por:
```php
    $cache = get_transient( $chave_cache );
    if ( is_array( $cache ) && ( empty( $cache ) || isset( $cache[0]['video_id'] ) ) ) {
        return array_slice( $cache, 0, $limit );
    }
```

(b) No loop `foreach ( $xml->entry as $entry )`, trocar a montagem do item:
```php
        $videos[] = array(
            'titulo'          => (string) $entry->title,
            'link'            => (string) $link_attrs['href'],
            'thumbnail_url'   => $thumb_url,
            'data_publicacao' => (string) $entry->published,
        );
```
por:
```php
        $yt = $entry->children( 'http://www.youtube.com/xml/schemas/2015' );

        $videos[] = array(
            'titulo'          => (string) $entry->title,
            'link'            => (string) $link_attrs['href'],
            'video_id'        => (string) $yt->videoId,
            'thumbnail_url'   => $thumb_url,
            'data_publicacao' => (string) $entry->published,
        );
```

- [ ] **Step 3: Verificar**

```bash
WP transient delete --all
WP eval '$v = sindicato_get_youtube_videos( 2 ); echo isset( $v[0]["video_id"] ) && strlen( $v[0]["video_id"] ) === 11 ? "TEM video_id valido: " . $v[0]["video_id"] : "FALHOU"; '
```

Expected: `TEM video_id valido: <11 chars>`.

Testar também que cache velho (sem `video_id`) é descartado:

```bash
WP eval '
$ch = sindicato_resolver_youtube_channel_id( sindicato_get_contato( "youtube_url" ) );
set_transient( "sindicato_youtube_videos_" . md5( $ch ), array( array( "titulo" => "velho", "link" => "x", "thumbnail_url" => "", "data_publicacao" => "" ) ), HOUR_IN_SECONDS );
$v = sindicato_get_youtube_videos( 1 );
echo isset( $v[0]["video_id"] ) ? "cache velho descartado" : "FALHOU: serviu cache velho";
'
```

Expected: `cache velho descartado`.

- [ ] **Step 4: Restaurar a URL original (se havia) e commitar**

```bash
if [ -n "$URL_ORIGINAL" ]; then WP eval '$o = get_option("sindicato_contato"); $o["youtube_url"] = "'"$URL_ORIGINAL"'"; update_option("sindicato_contato", $o); echo "restaurado";'; fi
git add wp-content/themes/sindicato/inc/youtube.php
git commit -m "feat: RSS do YouTube expõe video_id para o player embutido

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(Se a URL original estava vazia e o canal do sindicato ainda não foi configurado, MANTER o canal de teste até o fim da Task 8 e limpar lá.)

---

### Task 8: YouTube — player lite-embed com lista-playlist

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php:161-177` (destaque e lista)
- Modify: `wp-content/themes/sindicato/assets/js/main.js` (remover código morto + player)
- Modify: `wp-content/themes/sindicato/assets/css/main.css` (estados do player)
- Modify: `wp-content/themes/sindicato/functions.php:17-18` (bump de versão dos assets para invalidar cache do navegador)

**Interfaces:**
- Consumes: `video_id` dos itens de `sindicato_get_youtube_videos()` (Task 7).
- Produces: comportamento de front-end apenas; sem JS os links continuam abrindo o YouTube (progressive enhancement).

- [ ] **Step 1: Remover código morto do `main.js`**

Apagar o bloco inteiro (o seletor `.episode-list` não existe mais no HTML):

```js
document.querySelectorAll(".episode-list button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".episode-list button").forEach((item) => {
      item.classList.remove("is-active");
    });
    button.classList.add("is-active");
  });
});
```

- [ ] **Step 2: Marcação do destaque e da lista em `front-page.php`**

Trocar o bloco do destaque (`elseif ( $destaque_video )`):
```php
        <?php elseif ( $destaque_video ) : ?>
        <article class="podcast-feature"<?php echo $destaque_video['thumbnail_url'] ? ' style="background-image:url(' . esc_url( $destaque_video['thumbnail_url'] ) . ')"' : ''; ?>>
            <span class="play-button">Play</span>
            <h3><?php echo esc_html( $destaque_video['titulo'] ); ?></h3>
            <a class="text-link" href="<?php echo esc_url( $destaque_video['link'] ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
        </article>
        <?php endif; ?>
```
por:
```php
        <?php elseif ( $destaque_video ) : ?>
        <article class="podcast-feature" data-player<?php echo $destaque_video['thumbnail_url'] ? ' style="background-image:url(' . esc_url( $destaque_video['thumbnail_url'] ) . ')"' : ''; ?>>
            <div class="podcast-feature__player" data-player-slot hidden></div>
            <button class="play-button" type="button" data-video-id="<?php echo esc_attr( $destaque_video['video_id'] ); ?>" data-video-title="<?php echo esc_attr( $destaque_video['titulo'] ); ?>" aria-label="Assistir: <?php echo esc_attr( $destaque_video['titulo'] ); ?>">Play</button>
            <h3 data-player-title><?php echo esc_html( $destaque_video['titulo'] ); ?></h3>
            <a class="text-link" data-player-link href="<?php echo esc_url( $destaque_video['link'] ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
        </article>
        <?php endif; ?>
```

Trocar o item da lista:
```php
            <a href="<?php echo esc_url( $video['link'] ); ?>" target="_blank" rel="noopener">
                <span style="background-image:url(<?php echo esc_url( $video['thumbnail_url'] ); ?>)"></span>
                <?php echo esc_html( $video['titulo'] ); ?>
            </a>
```
por:
```php
            <a href="<?php echo esc_url( $video['link'] ); ?>" data-video-id="<?php echo esc_attr( $video['video_id'] ); ?>" data-video-title="<?php echo esc_attr( $video['titulo'] ); ?>" data-video-thumb="<?php echo esc_url( $video['thumbnail_url'] ); ?>" target="_blank" rel="noopener">
                <span style="background-image:url(<?php echo esc_url( $video['thumbnail_url'] ); ?>)"></span>
                <?php echo esc_html( $video['titulo'] ); ?>
            </a>
```

- [ ] **Step 3: Player em `main.js`**

Adicionar ao final do arquivo (DOM APIs, sem innerHTML com dados do feed):

```js
const player = document.querySelector("[data-player]");

const reproduzirVideo = (videoId, titulo, link, thumb) => {
  if (!player || !videoId) {
    return false;
  }
  const slot = player.querySelector("[data-player-slot]");
  if (!slot) {
    return false;
  }

  const iframe = document.createElement("iframe");
  iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(videoId) + "?autoplay=1&rel=0";
  iframe.title = titulo || "Vídeo do sindicato";
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.allowFullscreen = true;
  slot.replaceChildren(iframe);
  slot.hidden = false;

  const tituloEl = player.querySelector("[data-player-title]");
  if (tituloEl && titulo) {
    tituloEl.textContent = titulo;
  }
  const linkEl = player.querySelector("[data-player-link]");
  if (linkEl && link) {
    linkEl.href = link;
  }
  if (thumb) {
    player.style.backgroundImage = "url(" + thumb + ")";
  }
  player.classList.add("podcast-feature--playing");
  return true;
};

if (player) {
  const playButton = player.querySelector(".play-button[data-video-id]");
  if (playButton) {
    playButton.addEventListener("click", () => {
      reproduzirVideo(playButton.dataset.videoId, playButton.dataset.videoTitle);
    });
  }

  document.querySelectorAll(".podcast-list a[data-video-id]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const abriu = reproduzirVideo(
        link.dataset.videoId,
        link.dataset.videoTitle,
        link.href,
        link.dataset.videoThumb,
      );
      if (abriu) {
        event.preventDefault();
        player.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}
```

Observação: quando o card "Próximo Episódio" está ativo, não existe `[data-player]` na página — os links da lista continuam abrindo no YouTube (comportamento correto por spec).

- [ ] **Step 4: Estados do player em `main.css`**

Adicionar após o bloco `.podcast-list span` (linha ~763):

```css
.podcast-feature__player {
  width: 100%;
}

.podcast-feature__player iframe {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 0;
  border-radius: 8px;
}

.podcast-feature--playing {
  background-image: none !important;
  background-color: var(--navy-950);
}

.podcast-feature--playing::before {
  display: none;
}

.podcast-feature--playing .play-button {
  display: none;
}
```

- [ ] **Step 5: Bump de versão dos assets**

Em `functions.php`, trocar `'0.1.0'` por `'0.2.0'` nas DUAS chamadas (`wp_enqueue_style` e `wp_enqueue_script`).

- [ ] **Step 6: Verificar marcação e comportamento**

```bash
WP transient delete --all
curl -s http://localhost/sindicato/ | grep -c 'data-video-id'        # Expected: >= 1 (com canal configurado)
curl -s http://localhost/sindicato/ | grep -c 'data-player-slot'     # Expected: 1
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/js/main.js | grep -c 'episode-list'      # Expected: 0 (código morto removido)
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/js/main.js | grep -c 'youtube-nocookie'  # Expected: 1
```

Screenshot da seção:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task8-podcast-player.png" --window-size=390,844 "http://localhost/sindicato/#midia"
```

**Verificação manual obrigatória (não automatizável por curl):** abrir `http://localhost/sindicato/#midia` no navegador, clicar no Play do destaque → o iframe carrega e o vídeo reproduz no site; clicar num item da lista → o vídeo sobe para o destaque e reproduz. Registrar o resultado na resposta ao usuário.

Regressão sem canal:

```bash
WP eval '$o = get_option("sindicato_contato"); $u = $o["youtube_url"]; $o["youtube_url"] = ""; update_option("sindicato_contato", $o); echo $u;'
# guardar a saída (URL) para restaurar
curl -s http://localhost/sindicato/ | grep -c "Em breve, novos vídeos"   # Expected: 1
# restaurar:
WP eval '$o = get_option("sindicato_contato"); $o["youtube_url"] = "<URL guardada>"; update_option("sindicato_contato", $o); echo "ok";'
```

- [ ] **Step 7: Commit**

```bash
git add wp-content/themes/sindicato/front-page.php wp-content/themes/sindicato/assets/js/main.js wp-content/themes/sindicato/assets/css/main.css wp-content/themes/sindicato/functions.php
git commit -m "feat: player do YouTube embutido (lite embed) com lista-playlist

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Instagram — Smash Balloon com fallback nos cards manuais

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php:183-210` (seção Instagram)
- Modify: `wp-content/themes/sindicato/assets/css/main.css` (CSS de integração do widget)

**Interfaces:**
- Consumes: shortcode `[instagram-feed]` (plugin `instagram-feed`); `sindicato_get_cards_sociais( 5 )` (fallback existente).

- [ ] **Step 1: Instalar e ativar o plugin**

```bash
WP() { "/c/xampp/php/php.exe" "/c/xampp/wp-cli/wp-cli.phar" "$@" --path="/c/xampp/htdocs/sindicato" --allow-root; }
WP plugin install instagram-feed --activate
WP plugin list --format=table | grep instagram
```

Expected: `instagram-feed ... active`.

- [ ] **Step 2: Renderização condicional em `front-page.php`**

Trocar o bloco entre `<?php $cards_sociais = ... ?>` e o fim da seção Instagram por:

```php
<?php
$cards_sociais       = sindicato_get_cards_sociais( 5 );
$instagram_feed_html = '';
if ( shortcode_exists( 'instagram-feed' ) ) {
    $render = trim( (string) do_shortcode( '[instagram-feed]' ) );
    if ( false !== strpos( $render, 'sbi_item' ) ) {
        $instagram_feed_html = $render;
    }
}
?>
<section class="section section--instagram" aria-labelledby="instagram-title">
    <div class="container">
        <div class="section-heading">
            <div><p class="section-label">Redes sociais</p><h2 id="instagram-title">No Instagram</h2></div>
            <a class="text-link" href="<?php echo esc_url( sindicato_get_contato( 'instagram_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Ver perfil</a>
        </div>
        <?php if ( $instagram_feed_html ) : ?>
        <div class="instagram-plugin-feed"><?php echo $instagram_feed_html; // phpcs:ignore WordPress.Security.EscapeOutput -- HTML gerado pelo plugin Smash Balloon. ?></div>
        <?php elseif ( $cards_sociais ) : ?>
        <div class="instagram-grid">
            <?php foreach ( $cards_sociais as $card ) : ?>
            <article class="insta-card <?php echo has_post_thumbnail( $card->ID ) ? 'insta-card--photo' : 'insta-card--type'; ?>"<?php echo has_post_thumbnail( $card->ID ) ? ' style="background-image:url(' . esc_url( get_the_post_thumbnail_url( $card->ID, 'medium_large' ) ) . ')"' : ''; ?>>
                <?php if ( has_post_thumbnail( $card->ID ) ) : ?>
                <span><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></span>
                <?php else : ?>
                <strong><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></strong>
                <?php endif; ?>
            </article>
            <?php endforeach; ?>
        </div>
        <?php else : ?>
        <?php
        $instagram_url    = sindicato_get_contato( 'instagram_url' );
        $instagram_handle = $instagram_url ? '@' . trim( (string) wp_parse_url( $instagram_url, PHP_URL_PATH ), '/' ) : '@sindicato';
        ?>
        <p>Siga o sindicato no Instagram: <a href="<?php echo esc_url( $instagram_url ?: '#' ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $instagram_handle ); ?></a>.</p>
        <?php endif; ?>
    </div>
</section>
```

(Nota: este bloco também corrige de passagem os `insta-card--photo` que nunca recebiam a imagem destacada do card — mesmo padrão do bug 3.)

- [ ] **Step 3: CSS de integração do widget**

Em `assets/css/main.css`, após o bloco `.insta-card--type strong` (linha ~798), adicionar:

```css
.instagram-plugin-feed #sb_instagram {
  padding: 0 !important;
}

.instagram-plugin-feed #sb_instagram #sbi_images {
  gap: 16px !important;
  padding: 0 !important;
}

.instagram-plugin-feed #sb_instagram .sbi_item {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.instagram-plugin-feed #sb_instagram .sbi_photo {
  border-radius: 8px;
}
```

- [ ] **Step 4: Verificar (plugin ativo, conta ainda NÃO conectada)**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/   # Expected: 200 (sem fatal)
curl -s http://localhost/sindicato/ | grep -c 'sbi_item'             # Expected: 0 (não conectado)
curl -s http://localhost/sindicato/ | grep -c 'instagram-grid\|Siga o sindicato no Instagram'  # Expected: >= 1 (fallback no ar)
WP plugin deactivate instagram-feed
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/   # Expected: 200 (fallback com plugin inativo)
WP plugin activate instagram-feed
```

Screenshot:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task9-instagram-fallback.png" --window-size=1280,900 http://localhost/sindicato/
```

- [ ] **Step 5: Commit + documentar passo manual**

```bash
git add wp-content/themes/sindicato/front-page.php wp-content/themes/sindicato/assets/css/main.css
git commit -m "feat: seção Instagram usa Smash Balloon com fallback nos cards manuais

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Registrar para o relatório final: **passo manual do usuário** — no admin (`http://localhost/sindicato/wp-admin/` → Instagram Feed → Settings → "Connect an Instagram Account"), conectar a conta do sindicato. Até lá o fallback continua no ar.

---

### Task 10: Animações sutis com `prefers-reduced-motion`

**Files:**
- Modify: `wp-content/themes/sindicato/assets/css/main.css:23-26` (scroll-behavior) e final do arquivo (bloco de animações)
- Modify: `wp-content/themes/sindicato/assets/js/main.js` (IntersectionObserver)
- Modify: `wp-content/themes/sindicato/functions.php` (bump `0.2.0` → `0.3.0`)

**Interfaces:**
- Produces: classes `.reveal`/`.is-visible` aplicadas via JS (sem JS, nada muda — conteúdo sempre visível).

- [ ] **Step 1: Condicionar o smooth scroll existente**

Em `main.css`, trocar:
```css
html {
  scroll-behavior: smooth;
  overflow-x: hidden;
}
```
por:
```css
html {
  overflow-x: hidden;
}

@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

- [ ] **Step 2: Bloco de animações no final do `main.css`**

```css
/* ===== Animações (somente sem preferência por movimento reduzido) ===== */
@media (prefers-reduced-motion: no-preference) {
  .reveal {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.45s ease, transform 0.45s ease;
  }

  .reveal.is-visible {
    opacity: 1;
    transform: none;
  }

  .quick-card,
  .post-card,
  .insta-card,
  .featured-post,
  .podcast-list a {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .quick-card:hover,
  .post-card:hover,
  .insta-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 60px rgba(4, 21, 40, 0.22);
  }

  .podcast-list a:hover {
    transform: translateX(4px);
  }

  .button {
    transition: background-color 0.2s ease, transform 0.15s ease;
  }

  .button:active {
    transform: scale(0.97);
  }

  .text-link,
  #site-menu a,
  .topbar a {
    transition: color 0.2s ease;
  }

  #site-menu.is-open {
    animation: menu-entrar 0.25s ease;
  }

  .alert-strip {
    animation: alerta-pulsar 1.1s ease 0.4s 1;
  }

  .podcast-feature__player iframe {
    animation: player-surgir 0.3s ease;
  }
}

@keyframes menu-entrar {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes alerta-pulsar {
  50% {
    filter: brightness(1.18);
  }
}

@keyframes player-surgir {
  from {
    opacity: 0;
  }
}
```

- [ ] **Step 3: Reveal ao rolar em `main.js`**

Adicionar ao final:

```js
const prefereMenosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefereMenosMovimento && "IntersectionObserver" in window) {
  const alvosReveal = document.querySelectorAll(
    ".section-heading, .featured-post, .post-card, .quick-card, .insta-card, .podcast-feature, .notice-panel, .cta-band__inner",
  );
  const observadorReveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observadorReveal.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  alvosReveal.forEach((alvo) => {
    alvo.classList.add("reveal");
    observadorReveal.observe(alvo);
  });
}
```

- [ ] **Step 4: Bump de versão**

Em `functions.php`, trocar `'0.2.0'` por `'0.3.0'` nas duas chamadas de enqueue.

- [ ] **Step 5: Verificar**

```bash
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/css/main.css | grep -c "prefers-reduced-motion: no-preference"  # Expected: 2
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/css/main.css | grep -c "scroll-behavior: smooth"                # Expected: 1 (dentro da media query)
curl -s http://localhost/sindicato/wp-content/themes/sindicato/assets/js/main.js | grep -c "IntersectionObserver"                     # Expected: 2 (checagem + uso)
curl -s http://localhost/sindicato/ | grep -c 'class="reveal'   # Expected: 0 (classe só entra via JS — sem JS nada fica invisível)
```

Screenshots (desktop e mobile) para conferir que nada sumiu ou quebrou:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task10-animacoes-desktop.png" --window-size=1280,900 http://localhost/sindicato/
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\task10-animacoes-mobile.png" --window-size=390,844 http://localhost/sindicato/
```

Atenção: no screenshot headless os elementos observados podem aparecer com opacidade 0 se o observer ainda não disparou — se isso ocorrer, é o comportamento esperado do reveal (validar visualmente no navegador que o conteúdo aparece ao rolar).

**Verificação manual:** abrir a home no navegador, rolar a página (seções surgem suavemente), abrir o menu mobile (transição), passar o mouse nos cards (elevação).

- [ ] **Step 6: Commit**

```bash
git add wp-content/themes/sindicato/assets/css/main.css wp-content/themes/sindicato/assets/js/main.js wp-content/themes/sindicato/functions.php
git commit -m "feat: animações sutis (reveal, hover, menu) com prefers-reduced-motion

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Verificação final e atualização do grafo

**Files:**
- Modify: `graphify-out/` (via `graphify update .`)

- [ ] **Step 1: Regressão completa da home**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/            # 200
curl -s -o /dev/null -w "%{http_code}" http://localhost/sindicato/noticias/   # 200
curl -s http://localhost/sindicato/ | grep -c "Podcast do Sindicato"          # 1
curl -s http://localhost/sindicato/ | grep -c "No Instagram"                  # 1
curl -s http://localhost/sindicato/ | grep -c "wpcf7"                         # >= 1
curl -s http://localhost/sindicato/ | grep -c 'href="tel:'                    # >= 1
curl -s http://localhost/sindicato/ | grep -c "hero-assembleia-sindicato.png" # 0
```

- [ ] **Step 2: Screenshots finais (mobile + desktop) e leitura**

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\final-home-mobile.png" --window-size=390,844 http://localhost/sindicato/
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --screenshot="C:\Users\Eduardo\OneDrive\Documentos\site sindicato\screenshots\final-home-desktop.png" --window-size=1280,900 http://localhost/sindicato/
```

Ler ambos os PNGs e confirmar visualmente: hero íntegro, seções presentes, nada sobreposto.

- [ ] **Step 3: Atualizar grafo e commit final**

```bash
cd "C:/Users/Eduardo/OneDrive/Documentos/site sindicato"
graphify update .
git add screenshots/ graphify-out/
git commit -m "chore: screenshots de verificação e atualização do grafo

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Relatório ao usuário**

Informar: bugs corrigidos (com evidência), player funcionando (resultado do teste manual), passo manual pendente do Instagram (conectar conta no admin), e sugestão de testar no celular real.
