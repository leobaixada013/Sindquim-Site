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

function sindicato_data_em_vigencia( $data_inicio, $data_fim ) {
    $hoje = current_time( 'Y-m-d' );
    if ( $data_inicio && $hoje < $data_inicio ) {
        return false;
    }
    if ( $data_fim && $hoje > $data_fim ) {
        return false;
    }
    return true;
}

function sindicato_get_aviso_urgente_ativo() {
    $avisos = get_posts( array(
        'post_type'      => 'aviso',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_prioridade',
        'orderby'        => 'meta_value_num',
        'meta_query'     => array( array( 'key' => '_sind_tipo', 'value' => 'urgente' ) ),
        'order'          => 'DESC',
    ) );

    foreach ( $avisos as $aviso ) {
        $ativo       = get_post_meta( $aviso->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $aviso->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $aviso->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            return $aviso;
        }
    }
    return null;
}

function sindicato_get_banner_ativo() {
    $banners = get_posts( array(
        'post_type'      => 'banner',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_ordem',
        'orderby'        => 'meta_value_num',
        'order'          => 'ASC',
    ) );

    foreach ( $banners as $banner ) {
        $ativo       = get_post_meta( $banner->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $banner->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $banner->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            return $banner;
        }
    }
    return null;
}

function sindicato_get_avisos_rapidos_ativos( $limit = 5 ) {
    $avisos = get_posts( array(
        'post_type'      => 'aviso',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'meta_key'       => '_sind_ordem',
        'orderby'        => 'meta_value_num',
        'meta_query'     => array( array( 'key' => '_sind_tipo', 'value' => 'rapido' ) ),
        'order'          => 'ASC',
    ) );

    $ativos = array();
    foreach ( $avisos as $aviso ) {
        $ativo       = get_post_meta( $aviso->ID, '_sind_ativo', true );
        $data_inicio = get_post_meta( $aviso->ID, '_sind_data_inicio', true );
        $data_fim    = get_post_meta( $aviso->ID, '_sind_data_fim', true );
        if ( '1' === $ativo && sindicato_data_em_vigencia( $data_inicio, $data_fim ) ) {
            $ativos[] = $aviso;
        }
        if ( count( $ativos ) >= $limit ) {
            break;
        }
    }
    return $ativos;
}

function sindicato_get_cards_sociais( $limit = 5 ) {
    return get_posts( array(
        'post_type' => 'card_social', 'post_status' => 'publish', 'posts_per_page' => $limit,
        'meta_key' => '_sind_ordem', 'orderby' => 'meta_value_num', 'order' => 'ASC',
    ) );
}

function sindicato_get_diretoria() {
    return get_posts( array(
        'post_type' => 'diretor', 'post_status' => 'publish', 'posts_per_page' => -1,
        'meta_key' => '_sind_ordem', 'orderby' => 'meta_value_num', 'order' => 'ASC',
    ) );
}
