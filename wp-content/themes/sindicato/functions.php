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

require get_template_directory() . '/inc/settings-contato.php';
require get_template_directory() . '/inc/template-tags.php';
require get_template_directory() . '/inc/cpt-aviso.php';
require get_template_directory() . '/inc/cpt-banner.php';
require get_template_directory() . '/inc/cpt-podcast.php';
require get_template_directory() . '/inc/cpt-video.php';
require get_template_directory() . '/inc/cpt-card-social.php';
require get_template_directory() . '/inc/cpt-documento.php';

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

function sindicato_criar_categorias_padrao() {
    $categorias = array( 'Direitos', 'Assembleia', 'Reajuste', 'Benefícios', 'Jurídico', 'Convênios', 'Campanha Salarial', 'Comunicados' );
    foreach ( $categorias as $categoria ) {
        if ( ! term_exists( $categoria, 'category' ) ) {
            wp_insert_term( $categoria, 'category' );
        }
    }
}
add_action( 'after_switch_theme', 'sindicato_criar_categorias_padrao' );
