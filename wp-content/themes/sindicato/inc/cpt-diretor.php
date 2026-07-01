<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_diretor() {
    register_post_type( 'diretor', array(
        'labels' => array(
            'name'          => 'Diretoria',
            'singular_name' => 'Diretor(a)',
            'add_new_item'  => 'Adicionar Membro da Diretoria',
            'edit_item'     => 'Editar Membro da Diretoria',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-groups',
        'supports'     => array( 'title', 'thumbnail' ),
    ) );

    register_post_meta( 'diretor', '_sind_cargo', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'diretor', '_sind_ordem', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_diretor' );

function sindicato_metabox_diretor() {
    add_meta_box( 'sindicato_diretor_campos', 'Detalhes do Membro', 'sindicato_render_metabox_diretor', 'diretor', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_diretor' );

function sindicato_render_metabox_diretor( $post ) {
    wp_nonce_field( 'sindicato_salvar_diretor', 'sindicato_diretor_nonce' );
    $cargo = get_post_meta( $post->ID, '_sind_cargo', true );
    $ordem = get_post_meta( $post->ID, '_sind_ordem', true ) ?: 0;
    ?>
    <p><label for="sind_cargo">Cargo</label><br />
        <input type="text" id="sind_cargo" name="sind_cargo" class="large-text" value="<?php echo esc_attr( $cargo ); ?>" /></p>
    <p><label for="sind_ordem">Ordem</label><br />
        <input type="number" id="sind_ordem" name="sind_ordem" value="<?php echo esc_attr( $ordem ); ?>" /></p>
    <?php
}

function sindicato_salvar_diretor( $post_id ) {
    if ( ! isset( $_POST['sindicato_diretor_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_diretor_nonce'], 'sindicato_salvar_diretor' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_cargo'] ) ) {
        update_post_meta( $post_id, '_sind_cargo', sanitize_text_field( wp_unslash( $_POST['sind_cargo'] ) ) );
    }
    if ( isset( $_POST['sind_ordem'] ) ) {
        update_post_meta( $post_id, '_sind_ordem', absint( $_POST['sind_ordem'] ) );
    }
}
add_action( 'save_post_diretor', 'sindicato_salvar_diretor' );
