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
