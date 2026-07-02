<?php
get_header();
?>
<?php $banner = sindicato_get_banner_ativo(); ?>
<section class="hero" aria-labelledby="hero-title">
    <div class="hero__media" aria-hidden="true"<?php echo $banner && has_post_thumbnail( $banner->ID ) ? ' style="background-image:url(' . esc_url( get_the_post_thumbnail_url( $banner->ID, 'full' ) ) . ')"' : ''; ?>></div>
    <div class="container hero__content">
        <div class="hero__copy">
            <?php if ( $banner ) : ?>
                <p class="section-label"><?php echo esc_html( get_post_meta( $banner->ID, '_sind_subtitulo', true ) ); ?></p>
                <h1 id="hero-title"><?php echo esc_html( $banner->post_title ); ?></h1>
                <div class="hero__actions">
                    <a class="button button--primary" href="<?php echo esc_url( get_post_meta( $banner->ID, '_sind_cta_link', true ) ?: '#' ); ?>">
                        <?php echo esc_html( get_post_meta( $banner->ID, '_sind_cta_texto', true ) ?: 'Saiba mais' ); ?>
                    </a>
                </div>
            <?php else : ?>
                <p class="section-label">Campanha salarial 2026</p>
                <h1 id="hero-title">Nosso trabalho tem valor. Nossos direitos não são negociáveis.</h1>
                <p>Informação oficial, mobilização e atendimento para fortalecer a categoria em cada negociação.</p>
                <div class="hero__actions">
                    <a class="button button--primary" href="#noticias">Ler comunicado</a>
                    <a class="button button--ghost" href="#filie-se">Participar das assembleias</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php
$aviso_urgente  = sindicato_get_aviso_urgente_ativo();
$avisos_rapidos = sindicato_get_avisos_rapidos_ativos( 5 );
?>
<?php if ( $aviso_urgente ) : ?>
<section class="alert-strip" aria-label="Comunicado urgente">
    <div class="container alert-strip__inner">
        <strong><?php echo esc_html( $aviso_urgente->post_title ); ?></strong>
        <span><?php echo esc_html( get_post_meta( $aviso_urgente->ID, '_sind_mensagem_curta', true ) ); ?></span>
        <a href="<?php echo esc_url( get_post_meta( $aviso_urgente->ID, '_sind_link', true ) ?: '#' ); ?>">
            <?php echo esc_html( get_post_meta( $aviso_urgente->ID, '_sind_texto_link', true ) ?: 'Ver comunicados' ); ?>
        </a>
    </div>
</section>
<?php endif; ?>

<section id="noticias" class="section section--news">
    <div class="container">
        <div class="news-layout<?php echo empty( $avisos_rapidos ) ? ' news-layout--without-notices' : ''; ?>">
            <?php
            $noticia_destaque = get_posts( array( 'posts_per_page' => 1, 'post_status' => 'publish' ) );
            $noticias_grid    = get_posts( array( 'posts_per_page' => 3, 'offset' => 1, 'post_status' => 'publish' ) );
            ?>
            <?php if ( $noticia_destaque ) : $post = $noticia_destaque[0]; setup_postdata( $post ); ?>
            <article class="featured-post">
                <?php $thumb_destaque = get_the_post_thumbnail_url( $post, 'large' ); ?>
                <div class="post-image post-image--assembly" role="img" aria-label="<?php the_title_attribute(); ?>"<?php echo $thumb_destaque ? ' style="background-image:url(' . esc_url( $thumb_destaque ) . ')"' : ''; ?>></div>
                <div class="featured-post__body">
                    <div class="post-meta">
                        <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
                        <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
                    </div>
                    <h3><?php the_title(); ?></h3>
                    <p><?php echo esc_html( get_the_excerpt() ); ?></p>
                    <a class="text-link" href="<?php the_permalink(); ?>">Leia mais</a>
                </div>
            </article>
            <?php wp_reset_postdata(); endif; ?>

            <div class="post-grid" aria-label="Posts recentes do blog">
                <?php foreach ( $noticias_grid as $post ) : setup_postdata( $post ); ?>
                <article class="post-card">
                    <?php $thumb_card = get_the_post_thumbnail_url( $post, 'medium_large' ); ?>
                    <div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"<?php echo $thumb_card ? ' style="background-image:url(' . esc_url( $thumb_card ) . ')"' : ''; ?>></div>
                    <div class="post-card__body">
                        <div class="post-meta">
                            <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
                            <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
                        </div>
                        <h3><?php the_title(); ?></h3>
                        <p><?php echo esc_html( get_the_excerpt() ); ?></p>
                    </div>
                </article>
                <?php endforeach; wp_reset_postdata(); ?>
            </div>

            <?php if ( ! empty( $avisos_rapidos ) ) : ?>
            <aside id="avisos" class="notice-panel" aria-label="Avisos rápidos">
                <div class="notice-panel__header">
                    <h3>Avisos rápidos</h3>
                    <a href="<?php echo esc_url( home_url( '/avisos/' ) ); ?>">Todos</a>
                </div>
                <ul class="notice-list">
                    <?php foreach ( $avisos_rapidos as $aviso ) : ?>
                    <li>
                        <time datetime="<?php echo esc_attr( get_post_meta( $aviso->ID, '_sind_data_inicio', true ) ); ?>">
                            <?php echo esc_html( date_i18n( 'd/m', strtotime( get_post_meta( $aviso->ID, '_sind_data_inicio', true ) ) ) ); ?>
                        </time>
                        <span><?php echo esc_html( $aviso->post_title ); ?></span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </aside>
            <?php endif; ?>
        </div>
    </div>
</section>
<section id="convencoes" class="section section--quick">
    <div class="container">
        <div class="section-heading">
            <div>
                <p class="section-label">Serviços para a categoria</p>
                <h2>Acesso rápido</h2>
            </div>
        </div>

        <div class="quick-grid">
            <a class="quick-card" href="<?php echo esc_url( home_url( '/convencoes/' ) ); ?>">
                <span class="quick-card__icon">CCT</span>
                <strong>Convenção coletiva</strong>
                <small>Consulte a convenção vigente, cláusulas e documentos.</small>
            </a>
            <a id="beneficios" class="quick-card quick-card--teal" href="<?php echo esc_url( home_url( '/beneficios/' ) ); ?>">
                <span class="quick-card__icon">BEN</span>
                <strong>Benefícios</strong>
                <small>Descontos em saúde, educação, lazer e convênios.</small>
            </a>
            <a class="quick-card" href="<?php echo esc_url( home_url( '/juridico/' ) ); ?>">
                <span class="quick-card__icon">JUR</span>
                <strong>Atendimento jurídico</strong>
                <small>Orientação sobre direitos trabalhistas e acordos.</small>
            </a>
            <a id="filie-se" class="quick-card quick-card--red" href="<?php echo esc_url( home_url( '/filie-se/' ) ); ?>">
                <span class="quick-card__icon">SIM</span>
                <strong>Associe-se</strong>
                <small>Fortaleça o sindicato e tenha mais representatividade.</small>
            </a>
        </div>
    </div>
</section>
<?php
$proximo_episodio = sindicato_get_proximo_episodio();
$videos_youtube    = sindicato_get_youtube_videos( 6 );
$destaque_video    = null;
if ( ! $proximo_episodio && $videos_youtube ) {
    $destaque_video = array_shift( $videos_youtube );
}
$videos_youtube  = array_slice( $videos_youtube, 0, 5 );
$tem_conteudo    = $proximo_episodio || $destaque_video || $videos_youtube;
?>
<section id="midia" class="section section--media">
    <div class="container">
        <div class="section-heading section-heading--compact">
            <div><p class="section-label">Áudio e vídeo</p><h2>Podcast do Sindicato</h2></div>
        </div>

        <?php if ( $proximo_episodio ) : ?>
        <article class="podcast-feature"<?php echo $proximo_episodio['imagem_url'] ? ' style="background-image:url(' . esc_url( $proximo_episodio['imagem_url'] ) . ')"' : ''; ?>>
            <span class="podcast-feature__tag">Próximo episódio</span>
            <h3><?php echo esc_html( $proximo_episodio['titulo'] ); ?></h3>
            <?php if ( $proximo_episodio['descricao'] ) : ?>
            <p><?php echo esc_html( $proximo_episodio['descricao'] ); ?></p>
            <?php endif; ?>
        </article>
        <?php elseif ( $destaque_video ) : ?>
        <article class="podcast-feature"<?php echo $destaque_video['thumbnail_url'] ? ' style="background-image:url(' . esc_url( $destaque_video['thumbnail_url'] ) . ')"' : ''; ?>>
            <span class="play-button">Play</span>
            <h3><?php echo esc_html( $destaque_video['titulo'] ); ?></h3>
            <a class="text-link" href="<?php echo esc_url( $destaque_video['link'] ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
        </article>
        <?php endif; ?>

        <?php if ( $videos_youtube ) : ?>
        <div class="podcast-list">
            <?php foreach ( $videos_youtube as $video ) : ?>
            <a href="<?php echo esc_url( $video['link'] ); ?>" target="_blank" rel="noopener">
                <span style="background-image:url(<?php echo esc_url( $video['thumbnail_url'] ); ?>)"></span>
                <?php echo esc_html( $video['titulo'] ); ?>
            </a>
            <?php endforeach; ?>
        </div>
        <?php elseif ( ! $tem_conteudo ) : ?>
        <p>Em breve, novos vídeos no canal do sindicato. <a href="<?php echo esc_url( sindicato_get_contato( 'youtube_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Acesse o canal</a>.</p>
        <?php endif; ?>
    </div>
</section>
<?php $cards_sociais = sindicato_get_cards_sociais( 5 ); ?>
<section class="section section--instagram" aria-labelledby="instagram-title">
    <div class="container">
        <div class="section-heading">
            <div><p class="section-label">Redes sociais</p><h2 id="instagram-title">No Instagram</h2></div>
            <a class="text-link" href="<?php echo esc_url( sindicato_get_contato( 'instagram_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Ver perfil</a>
        </div>
        <?php if ( $cards_sociais ) : ?>
        <div class="instagram-grid">
            <?php foreach ( $cards_sociais as $card ) : ?>
            <article class="insta-card <?php echo has_post_thumbnail( $card->ID ) ? 'insta-card--photo' : 'insta-card--type'; ?>">
                <?php if ( has_post_thumbnail( $card->ID ) ) : ?>
                <span><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></span>
                <?php else : ?>
                <strong><?php echo esc_html( get_post_meta( $card->ID, '_sind_legenda', true ) ); ?></strong>
                <?php endif; ?>
            </article>
            <?php endforeach; ?>
        </div>
        <?php else : ?>
        <?php
        $instagram_url    = sindicato_get_contato( 'instagram_url' );
        $instagram_handle = $instagram_url ? '@' . trim( (string) wp_parse_url( $instagram_url, PHP_URL_PATH ), '/' ) : '@sindicato';
        ?>
        <p>Siga o sindicato no Instagram: <a href="<?php echo esc_url( $instagram_url ?: '#' ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $instagram_handle ); ?></a>.</p>
        <?php endif; ?>
    </div>
</section>
<section id="associado" class="cta-band">
    <div class="container cta-band__inner">
        <div>
            <p class="section-label">Fortaleça sua representação</p>
            <h2>Associe-se ao sindicato e acompanhe tudo em primeira mão.</h2>
        </div>
        <a class="button button--primary" href="<?php echo esc_url( home_url( '/contato/' ) ); ?>">Quero me associar</a>
    </div>
</section>
<?php get_footer(); ?>
