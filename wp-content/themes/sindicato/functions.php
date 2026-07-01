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

function sindicato_criar_categorias_padrao() {
    $categorias = array( 'Direitos', 'Assembleia', 'Reajuste', 'Benefícios', 'Jurídico', 'Convênios', 'Campanha Salarial', 'Comunicados' );
    foreach ( $categorias as $categoria ) {
        if ( ! term_exists( $categoria, 'category' ) ) {
            wp_insert_term( $categoria, 'category' );
        }
    }
}
add_action( 'after_switch_theme', 'sindicato_criar_categorias_padrao' );
