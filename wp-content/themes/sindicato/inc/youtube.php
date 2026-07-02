<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function sindicato_resolver_youtube_channel_id( $url ) {
    $url = trim( (string) $url );
    if ( '' === $url ) {
        return null;
    }

    if ( preg_match( '#/channel/(UC[a-zA-Z0-9_-]{10,})#', $url, $match ) ) {
        return $match[1];
    }

    $cache = get_option( 'sindicato_youtube_channel_resolvido' );
    if ( is_array( $cache ) && isset( $cache['url'] ) && $cache['url'] === $url ) {
        if ( ! empty( $cache['channel_id'] ) ) {
            return $cache['channel_id'];
        }
        if ( ! empty( $cache['falhou_em'] ) && ( time() - (int) $cache['falhou_em'] ) < 10 * MINUTE_IN_SECONDS ) {
            return null;
        }
    }

    $resposta = wp_remote_get( $url, array( 'timeout' => 8 ) );
    if ( is_wp_error( $resposta ) || 200 !== wp_remote_retrieve_response_code( $resposta ) ) {
        update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => '', 'falhou_em' => time() ) );
        return null;
    }

    $corpo = wp_remote_retrieve_body( $resposta );
    if ( ! preg_match( '#<link rel="canonical" href="https://www\.youtube\.com/channel/(UC[a-zA-Z0-9_-]{10,})"#', $corpo, $match ) ) {
        update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => '', 'falhou_em' => time() ) );
        return null;
    }

    update_option( 'sindicato_youtube_channel_resolvido', array( 'url' => $url, 'channel_id' => $match[1], 'falhou_em' => null ) );
    return $match[1];
}

function sindicato_get_youtube_videos( $limit = 5 ) {
    $youtube_url = sindicato_get_contato( 'youtube_url' );
    if ( '' === trim( (string) $youtube_url ) ) {
        return array();
    }

    $channel_id = sindicato_resolver_youtube_channel_id( $youtube_url );
    if ( ! $channel_id ) {
        return array();
    }

    $chave_cache = 'sindicato_youtube_videos_' . md5( $channel_id );
    $cache       = get_transient( $chave_cache );
    if ( is_array( $cache ) && ( empty( $cache ) || isset( $cache[0]['video_id'] ) ) ) {
        return array_slice( $cache, 0, $limit );
    }

    $resposta = wp_remote_get( 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode( $channel_id ), array( 'timeout' => 8 ) );
    if ( is_wp_error( $resposta ) || 200 !== wp_remote_retrieve_response_code( $resposta ) ) {
        set_transient( $chave_cache, array(), 10 * MINUTE_IN_SECONDS );
        return array();
    }

    $corpo  = wp_remote_retrieve_body( $resposta );
    $videos = sindicato_parse_youtube_feed( $corpo );
    if ( null === $videos ) {
        set_transient( $chave_cache, array(), 10 * MINUTE_IN_SECONDS );
        return array();
    }

    set_transient( $chave_cache, $videos, HOUR_IN_SECONDS );
    return array_slice( $videos, 0, $limit );
}

function sindicato_parse_youtube_feed( $xml_string ) {
    libxml_use_internal_errors( true );
    $xml = simplexml_load_string( (string) $xml_string );
    if ( false === $xml || ! isset( $xml->entry ) ) {
        return null;
    }

    $videos = array();
    foreach ( $xml->entry as $entry ) {
        $media      = $entry->children( 'http://search.yahoo.com/mrss/' );
        $yt         = $entry->children( 'http://www.youtube.com/xml/schemas/2015' );
        $link_attrs = $entry->link->attributes();
        $thumb_url  = '';
        if ( isset( $media->group->thumbnail ) ) {
            $thumb_attrs = $media->group->thumbnail->attributes();
            $thumb_url   = (string) $thumb_attrs['url'];
        }
        $videos[] = array(
            'titulo'          => (string) $entry->title,
            'link'            => (string) $link_attrs['href'],
            'video_id'        => (string) $yt->videoId,
            'thumbnail_url'   => $thumb_url,
            'data_publicacao' => (string) $entry->published,
        );
    }

    return $videos;
}
