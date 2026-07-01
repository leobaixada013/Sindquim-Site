<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_contato_defaults() {
    return array(
        'telefone'      => '(11) 3333-7777',
        'whatsapp'      => '(11) 98888-8888',
        'email'         => 'contato@sindicato.org.br',
        'endereco'      => 'Rua das Indústrias, 123 - São Paulo',
        'instagram_url' => '',
        'youtube_url'   => '',
        'podcast_url'   => '',
    );
}

function sindicato_registrar_configuracoes() {
    register_setting( 'sindicato_contato_group', 'sindicato_contato', array(
        'type'              => 'array',
        'sanitize_callback' => 'sindicato_sanitizar_contato',
        'default'           => sindicato_contato_defaults(),
    ) );

    add_settings_section( 'sindicato_contato_section', 'Dados de Contato', '__return_false', 'sindicato-contato' );

    $campos = array(
        'telefone'      => 'Telefone',
        'whatsapp'      => 'WhatsApp',
        'email'         => 'E-mail',
        'endereco'      => 'Endereço',
        'instagram_url' => 'URL do Instagram',
        'youtube_url'   => 'URL do canal do YouTube',
        'podcast_url'   => 'URL do podcast (Spotify/RSS)',
    );

    foreach ( $campos as $chave => $rotulo ) {
        add_settings_field(
            'sindicato_contato_' . $chave,
            $rotulo,
            'sindicato_render_campo_contato',
            'sindicato-contato',
            'sindicato_contato_section',
            array( 'chave' => $chave )
        );
    }
}
add_action( 'admin_init', 'sindicato_registrar_configuracoes' );

function sindicato_sanitizar_contato( $input ) {
    $limpo = array();
    foreach ( (array) $input as $chave => $valor ) {
        $limpo[ sanitize_key( $chave ) ] = sanitize_text_field( $valor );
    }
    return $limpo;
}

function sindicato_render_campo_contato( $args ) {
    $valores = get_option( 'sindicato_contato' );
    if ( ! is_array( $valores ) ) {
        $valores = array();
    }
    $valores = wp_parse_args( $valores, sindicato_contato_defaults() );
    $chave   = $args['chave'];
    $valor   = isset( $valores[ $chave ] ) ? $valores[ $chave ] : '';
    printf(
        '<input type="text" name="sindicato_contato[%1$s]" value="%2$s" class="regular-text" />',
        esc_attr( $chave ),
        esc_attr( $valor )
    );
}

function sindicato_adicionar_menu_configuracoes() {
    add_options_page( 'Dados do Sindicato', 'Dados do Sindicato', 'manage_options', 'sindicato-contato', 'sindicato_renderizar_pagina_configuracoes' );
}
add_action( 'admin_menu', 'sindicato_adicionar_menu_configuracoes' );

function sindicato_renderizar_pagina_configuracoes() {
    ?>
    <div class="wrap">
        <h1>Dados do Sindicato</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields( 'sindicato_contato_group' );
            do_settings_sections( 'sindicato-contato' );
            submit_button();
            ?>
        </form>
    </div>
    <?php
}
