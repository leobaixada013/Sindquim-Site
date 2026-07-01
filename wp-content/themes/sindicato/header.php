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
