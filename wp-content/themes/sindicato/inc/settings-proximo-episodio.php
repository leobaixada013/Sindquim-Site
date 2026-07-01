<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_proximo_episodio_defaults() {
    return array(
        'titulo'            => '',
        'descricao'         => '',
        'imagem_id'         => 0,
        'data_hora_estreia' => '',
        'ativo'             => '0',
    );
}

function sindicato_get_proximo_episodio_valores() {
    $valores = get_option( 'sindicato_proximo_episodio' );
    if ( ! is_array( $valores ) ) {
        $valores = array();
    }
    return wp_parse_args( $valores, sindicato_proximo_episodio_defaults() );
}

function sindicato_get_proximo_episodio() {
    $valores = sindicato_get_proximo_episodio_valores();

    if ( '1' !== $valores['ativo'] || '' === trim( (string) $valores['data_hora_estreia'] ) ) {
        return null;
    }

    $estreia = date_create_immutable( $valores['data_hora_estreia'], wp_timezone() );
    if ( ! $estreia || time() >= $estreia->getTimestamp() ) {
        return null;
    }

    return array(
        'titulo'            => $valores['titulo'],
        'descricao'         => $valores['descricao'],
        'imagem_url'        => $valores['imagem_id'] ? (string) wp_get_attachment_image_url( (int) $valores['imagem_id'], 'large' ) : '',
        'data_hora_estreia' => $valores['data_hora_estreia'],
    );
}

function sindicato_registrar_configuracoes_proximo_episodio() {
    register_setting( 'sindicato_proximo_episodio_group', 'sindicato_proximo_episodio', array(
        'type'              => 'array',
        'sanitize_callback' => 'sindicato_sanitizar_proximo_episodio',
        'default'           => sindicato_proximo_episodio_defaults(),
    ) );

    add_settings_section( 'sindicato_proximo_episodio_section', 'Próximo Episódio', '__return_false', 'sindicato-proximo-episodio' );

    add_settings_field( 'sind_pe_titulo', 'Título', 'sindicato_render_pe_titulo', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_descricao', 'Descrição', 'sindicato_render_pe_descricao', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_imagem', 'Imagem', 'sindicato_render_pe_imagem', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_data_hora_estreia', 'Data e hora de estreia', 'sindicato_render_pe_data_hora_estreia', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
    add_settings_field( 'sind_pe_ativo', 'Ativo', 'sindicato_render_pe_ativo', 'sindicato-proximo-episodio', 'sindicato_proximo_episodio_section' );
}
add_action( 'admin_init', 'sindicato_registrar_configuracoes_proximo_episodio' );

function sindicato_sanitizar_proximo_episodio( $input ) {
    $input = (array) $input;
    return array(
        'titulo'            => isset( $input['titulo'] ) ? sanitize_text_field( $input['titulo'] ) : '',
        'descricao'         => isset( $input['descricao'] ) ? sanitize_textarea_field( $input['descricao'] ) : '',
        'imagem_id'         => isset( $input['imagem_id'] ) ? absint( $input['imagem_id'] ) : 0,
        'data_hora_estreia' => isset( $input['data_hora_estreia'] ) ? sanitize_text_field( $input['data_hora_estreia'] ) : '',
        'ativo'             => ! empty( $input['ativo'] ) ? '1' : '0',
    );
}

function sindicato_render_pe_titulo() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<input type="text" name="sindicato_proximo_episodio[titulo]" value="%s" class="regular-text" />', esc_attr( $valores['titulo'] ) );
}

function sindicato_render_pe_descricao() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<textarea name="sindicato_proximo_episodio[descricao]" rows="4" class="large-text">%s</textarea>', esc_textarea( $valores['descricao'] ) );
}

function sindicato_render_pe_imagem() {
    $valores   = sindicato_get_proximo_episodio_valores();
    $imagem_id = (int) $valores['imagem_id'];
    wp_enqueue_media();
    ?>
    <input type="hidden" id="sind_pe_imagem_id" name="sindicato_proximo_episodio[imagem_id]" value="<?php echo esc_attr( $imagem_id ); ?>" />
    <button type="button" class="button" id="sind_pe_selecionar_imagem">Selecionar imagem</button>
    <div id="sind_pe_imagem_preview" style="margin-top:10px;">
        <?php if ( $imagem_id ) : ?>
            <img src="<?php echo esc_url( wp_get_attachment_image_url( $imagem_id, 'medium' ) ); ?>" style="max-width:220px;height:auto;display:block;" />
        <?php endif; ?>
    </div>
    <script>
    (function () {
        var botao = document.getElementById('sind_pe_selecionar_imagem');
        if (!botao) { return; }
        botao.addEventListener('click', function (evento) {
            evento.preventDefault();
            var frame = wp.media({ title: 'Selecionar imagem', library: { type: 'image' }, button: { text: 'Usar esta imagem' }, multiple: false });
            frame.on('select', function () {
                var anexo = frame.state().get('selection').first().toJSON();
                document.getElementById('sind_pe_imagem_id').value = anexo.id;
                var preview = document.getElementById('sind_pe_imagem_preview');
                preview.innerHTML = '<img src="' + anexo.url + '" style="max-width:220px;height:auto;display:block;" />';
            });
            frame.open();
        });
    })();
    </script>
    <?php
}

function sindicato_render_pe_data_hora_estreia() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf( '<input type="datetime-local" name="sindicato_proximo_episodio[data_hora_estreia]" value="%s" />', esc_attr( $valores['data_hora_estreia'] ) );
}

function sindicato_render_pe_ativo() {
    $valores = sindicato_get_proximo_episodio_valores();
    printf(
        '<label><input type="checkbox" name="sindicato_proximo_episodio[ativo]" value="1" %s /> Exibir na home</label>',
        checked( $valores['ativo'], '1', false )
    );
}

function sindicato_adicionar_menu_proximo_episodio() {
    add_options_page( 'Próximo Episódio', 'Próximo Episódio', 'manage_options', 'sindicato-proximo-episodio', 'sindicato_renderizar_pagina_proximo_episodio' );
}
add_action( 'admin_menu', 'sindicato_adicionar_menu_proximo_episodio' );

function sindicato_renderizar_pagina_proximo_episodio() {
    ?>
    <div class="wrap">
        <h1>Próximo Episódio</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'sindicato_proximo_episodio_group' );
            do_settings_sections( 'sindicato-proximo-episodio' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
