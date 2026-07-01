<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_get_contato( $chave ) {
    $valores = get_option( 'sindicato_contato' );
    if ( ! is_array( $valores ) ) {
        $valores = array();
    }
    $valores = wp_parse_args( $valores, sindicato_contato_defaults() );
    return isset( $valores[ $chave ] ) ? $valores[ $chave ] : '';
}
