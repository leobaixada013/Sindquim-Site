<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_aviso() {
    register_post_type( 'aviso', array(
        'labels' => array(
            'name'          => 'Avisos',
            'singular_name' => 'Aviso',
            'add_new_item'  => 'Adicionar Aviso',
            'edit_item'     => 'Editar Aviso',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-megaphone',
        'supports'     => array( 'title' ),
    ) );

    $campos_texto = array( '_sind_mensagem_curta', '_sind_link', '_sind_texto_link', '_sind_data_inicio', '_sind_data_fim', '_sind_tipo' );
    foreach ( $campos_texto as $campo ) {
        register_post_meta( 'aviso', $campo, array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => false,
            'sanitize_callback' => 'sanitize_text_field',
        ) );
    }
    register_post_meta( 'aviso', '_sind_prioridade', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'aviso', '_sind_ordem', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'aviso', '_sind_ativo', array( 'type' => 'boolean', 'single' => true, 'sanitize_callback' => 'rest_sanitize_boolean' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_aviso' );

function sindicato_metabox_aviso() {
    add_meta_box( 'sindicato_aviso_campos', 'Detalhes do Aviso', 'sindicato_render_metabox_aviso', 'aviso', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_aviso' );

function sindicato_render_metabox_aviso( $post ) {
    wp_nonce_field( 'sindicato_salvar_aviso', 'sindicato_aviso_nonce' );
    $tipo             = get_post_meta( $post->ID, '_sind_tipo', true ) ?: 'rapido';
    $mensagem_curta   = get_post_meta( $post->ID, '_sind_mensagem_curta', true );
    $link             = get_post_meta( $post->ID, '_sind_link', true );
    $texto_link       = get_post_meta( $post->ID, '_sind_texto_link', true );
    $prioridade       = get_post_meta( $post->ID, '_sind_prioridade', true ) ?: 0;
    $data_inicio      = get_post_meta( $post->ID, '_sind_data_inicio', true );
    $data_fim         = get_post_meta( $post->ID, '_sind_data_fim', true );
    $ativo            = get_post_meta( $post->ID, '_sind_ativo', true );
    $ordem            = get_post_meta( $post->ID, '_sind_ordem', true ) ?: 0;
    ?>
    <p>
        <label for="sind_tipo">Tipo</label><br />
        <select name="sind_tipo" id="sind_tipo">
            <option value="urgente" <?php selected( $tipo, 'urgente' ); ?>>Urgente (faixa vermelha)</option>
            <option value="rapido" <?php selected( $tipo, 'rapido' ); ?>>Rápido (painel lateral)</option>
        </select>
    </p>
    <p><label for="sind_mensagem_curta">Mensagem curta</label><br />
        <input type="text" id="sind_mensagem_curta" name="sind_mensagem_curta" class="large-text" value="<?php echo esc_attr( $mensagem_curta ); ?>" /></p>
    <p><label for="sind_link">Link</label><br />
        <input type="text" id="sind_link" name="sind_link" class="large-text" value="<?php echo esc_attr( $link ); ?>" /></p>
    <p><label for="sind_texto_link">Texto do link</label><br />
        <input type="text" id="sind_texto_link" name="sind_texto_link" value="<?php echo esc_attr( $texto_link ); ?>" /></p>
    <p><label for="sind_prioridade">Prioridade (maior = mais importante)</label><br />
        <input type="number" id="sind_prioridade" name="sind_prioridade" value="<?php echo esc_attr( $prioridade ); ?>" /></p>
    <p><label for="sind_ordem">Ordem (avisos rápidos)</label><br />
        <input type="number" id="sind_ordem" name="sind_ordem" value="<?php echo esc_attr( $ordem ); ?>" /></p>
    <p><label for="sind_data_inicio">Data início</label><br />
        <input type="date" id="sind_data_inicio" name="sind_data_inicio" value="<?php echo esc_attr( $data_inicio ); ?>" /></p>
    <p><label for="sind_data_fim">Data fim</label><br />
        <input type="date" id="sind_data_fim" name="sind_data_fim" value="<?php echo esc_attr( $data_fim ); ?>" /></p>
    <p><label><input type="checkbox" name="sind_ativo" value="1" <?php checked( $ativo, '1' ); ?> /> Ativo</label></p>
    <?php
}

function sindicato_salvar_aviso( $post_id ) {
    if ( ! isset( $_POST['sindicato_aviso_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_aviso_nonce'], 'sindicato_salvar_aviso' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    $campos = array( 'sind_tipo' => '_sind_tipo', 'sind_mensagem_curta' => '_sind_mensagem_curta', 'sind_link' => '_sind_link', 'sind_texto_link' => '_sind_texto_link' );
    foreach ( $campos as $campo_post => $meta_key ) {
        if ( isset( $_POST[ $campo_post ] ) ) {
            update_post_meta( $post_id, $meta_key, sanitize_text_field( wp_unslash( $_POST[ $campo_post ] ) ) );
        }
    }
    if ( isset( $_POST['sind_prioridade'] ) ) {
        update_post_meta( $post_id, '_sind_prioridade', absint( $_POST['sind_prioridade'] ) );
    }
    if ( isset( $_POST['sind_ordem'] ) ) {
        update_post_meta( $post_id, '_sind_ordem', absint( $_POST['sind_ordem'] ) );
    }
    if ( isset( $_POST['sind_data_inicio'] ) ) {
        update_post_meta( $post_id, '_sind_data_inicio', sanitize_text_field( wp_unslash( $_POST['sind_data_inicio'] ) ) );
    }
    if ( isset( $_POST['sind_data_fim'] ) ) {
        update_post_meta( $post_id, '_sind_data_fim', sanitize_text_field( wp_unslash( $_POST['sind_data_fim'] ) ) );
    }
    update_post_meta( $post_id, '_sind_ativo', isset( $_POST['sind_ativo'] ) ? '1' : '0' );
}
add_action( 'save_post_aviso', 'sindicato_salvar_aviso' );
