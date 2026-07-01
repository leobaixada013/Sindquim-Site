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
