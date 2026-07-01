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
