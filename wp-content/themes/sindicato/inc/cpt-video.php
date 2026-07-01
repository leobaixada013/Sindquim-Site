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
