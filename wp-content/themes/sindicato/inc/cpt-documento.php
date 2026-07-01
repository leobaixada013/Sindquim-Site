<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_registrar_cpt_documento() {
    register_post_type( 'documento', array(
        'labels' => array(
            'name'          => 'Documentos',
            'singular_name' => 'Documento',
            'add_new_item'  => 'Adicionar Documento',
            'edit_item'     => 'Editar Documento',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-media-document',
        'supports'     => array( 'title', 'editor' ),
        'has_archive'  => false,
    ) );

    register_post_meta( 'documento', '_sind_tipo', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_ano', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
    register_post_meta( 'documento', '_sind_vigencia_inicio', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_vigencia_fim', array( 'type' => 'string', 'single' => true, 'sanitize_callback' => 'sanitize_text_field' ) );
    register_post_meta( 'documento', '_sind_arquivo_pdf', array( 'type' => 'integer', 'single' => true, 'sanitize_callback' => 'absint' ) );
}
add_action( 'init', 'sindicato_registrar_cpt_documento' );

function sindicato_metabox_documento() {
    add_meta_box( 'sindicato_documento_campos', 'Detalhes do Documento', 'sindicato_render_metabox_documento', 'documento', 'normal', 'high' );
}
add_action( 'add_meta_boxes', 'sindicato_metabox_documento' );

function sindicato_render_metabox_documento( $post ) {
    wp_nonce_field( 'sindicato_salvar_documento', 'sindicato_documento_nonce' );
    $tipo             = get_post_meta( $post->ID, '_sind_tipo', true ) ?: 'convencao';
    $ano              = get_post_meta( $post->ID, '_sind_ano', true );
    $vigencia_inicio  = get_post_meta( $post->ID, '_sind_vigencia_inicio', true );
    $vigencia_fim     = get_post_meta( $post->ID, '_sind_vigencia_fim', true );
    $arquivo_pdf      = get_post_meta( $post->ID, '_sind_arquivo_pdf', true );
    wp_enqueue_media();
    ?>
    <p>
        <label for="sind_tipo">Tipo</label><br />
        <select name="sind_tipo" id="sind_tipo">
            <option value="convencao" <?php selected( $tipo, 'convencao' ); ?>>Convenção Coletiva</option>
            <option value="acordo" <?php selected( $tipo, 'acordo' ); ?>>Acordo Coletivo</option>
            <option value="termo_aditivo" <?php selected( $tipo, 'termo_aditivo' ); ?>>Termo Aditivo</option>
        </select>
    </p>
    <p><label for="sind_ano">Ano</label><br />
        <input type="number" id="sind_ano" name="sind_ano" value="<?php echo esc_attr( $ano ); ?>" /></p>
    <p><label for="sind_vigencia_inicio">Vigência início</label><br />
        <input type="date" id="sind_vigencia_inicio" name="sind_vigencia_inicio" value="<?php echo esc_attr( $vigencia_inicio ); ?>" /></p>
    <p><label for="sind_vigencia_fim">Vigência fim</label><br />
        <input type="date" id="sind_vigencia_fim" name="sind_vigencia_fim" value="<?php echo esc_attr( $vigencia_fim ); ?>" /></p>
    <p>
        <label>Arquivo PDF</label><br />
        <input type="hidden" id="sind_arquivo_pdf" name="sind_arquivo_pdf" value="<?php echo esc_attr( $arquivo_pdf ); ?>" />
        <button type="button" class="button" id="sind_selecionar_pdf">Selecionar PDF</button>
        <span id="sind_pdf_nome"><?php echo $arquivo_pdf ? esc_html( basename( get_attached_file( $arquivo_pdf ) ) ) : 'Nenhum arquivo selecionado'; ?></span>
    </p>
    <script>
    (function () {
        var botao = document.getElementById('sind_selecionar_pdf');
        if (!botao) { return; }
        botao.addEventListener('click', function (evento) {
            evento.preventDefault();
            var frame = wp.media({ title: 'Selecionar PDF', library: { type: 'application/pdf' }, button: { text: 'Usar este arquivo' }, multiple: false });
            frame.on('select', function () {
                var anexo = frame.state().get('selection').first().toJSON();
                document.getElementById('sind_arquivo_pdf').value = anexo.id;
                document.getElementById('sind_pdf_nome').textContent = anexo.filename;
            });
            frame.open();
        });
    })();
    </script>
    <?php
}

function sindicato_salvar_documento( $post_id ) {
    if ( ! isset( $_POST['sindicato_documento_nonce'] ) || ! wp_verify_nonce( $_POST['sindicato_documento_nonce'], 'sindicato_salvar_documento' ) ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }
    if ( isset( $_POST['sind_tipo'] ) ) {
        update_post_meta( $post_id, '_sind_tipo', sanitize_text_field( wp_unslash( $_POST['sind_tipo'] ) ) );
    }
    if ( isset( $_POST['sind_ano'] ) ) {
        update_post_meta( $post_id, '_sind_ano', absint( $_POST['sind_ano'] ) );
    }
    if ( isset( $_POST['sind_vigencia_inicio'] ) ) {
        update_post_meta( $post_id, '_sind_vigencia_inicio', sanitize_text_field( wp_unslash( $_POST['sind_vigencia_inicio'] ) ) );
    }
    if ( isset( $_POST['sind_vigencia_fim'] ) ) {
        update_post_meta( $post_id, '_sind_vigencia_fim', sanitize_text_field( wp_unslash( $_POST['sind_vigencia_fim'] ) ) );
    }
    if ( isset( $_POST['sind_arquivo_pdf'] ) ) {
        update_post_meta( $post_id, '_sind_arquivo_pdf', absint( $_POST['sind_arquivo_pdf'] ) );
    }
}
add_action( 'save_post_documento', 'sindicato_salvar_documento' );
