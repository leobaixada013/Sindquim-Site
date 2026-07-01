<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-sindicato.jpeg' ); ?>" />
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<header class="site-header">
    <div class="topbar">
        <div class="container topbar__inner">
            <span>Sindicato forte, trabalhador respeitado.</span>
            <div class="topbar__links" aria-label="Contatos rápidos">
                <a href="#contato"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a>
                <a href="mailto:<?php echo esc_attr( sindicato_get_contato( 'email' ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'email' ) ); ?></a>
                <a href="#associado">Área do Associado</a>
            </div>
        </div>
    </div>

    <div class="mainnav">
        <div class="container mainnav__inner">
            <a class="brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="Página inicial do Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista">
                <img class="brand__logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-sindicato.jpeg' ); ?>" alt="Logo do Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista" />
                <span>
                    <strong>STI Baixada Santista</strong>
                    <small>Em defesa dos trabalhadores</small>
                </span>
            </a>

            <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-menu">
                Menu
            </button>

            <nav id="site-menu" class="nav-links" aria-label="Navegação principal">
                <a href="<?php echo esc_url( home_url( '/contato/' ) ); ?>">O Sindicato</a>
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
