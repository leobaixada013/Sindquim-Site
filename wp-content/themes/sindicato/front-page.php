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
                <div class="post-image post-image--assembly" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
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
                    <div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
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
                    <a href="#">Todos</a>
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
            <a id="beneficios" class="quick-card quick-card--teal" href="#beneficios">
                <span class="quick-card__icon">BEN</span>
                <strong>Benefícios</strong>
                <small>Descontos em saúde, educação, lazer e convênios.</small>
            </a>
            <a class="quick-card" href="<?php echo esc_url( home_url( '/contato/' ) ); ?>">
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
$podcast_destaque = sindicato_get_podcast_destaque();
$podcast_lista    = sindicato_get_podcast_lista( 3 );
$video_destaque   = sindicato_get_video_destaque();
$video_lista      = sindicato_get_video_lista( 2 );
?>
<section id="midia" class="section section--media">
    <div class="container media-grid">
        <div class="media-column">
            <div class="section-heading section-heading--compact">
                <div><p class="section-label">Áudio</p><h2>Podcast do Sindicato</h2></div>
            </div>
            <?php if ( $podcast_destaque ) : ?>
            <article class="podcast-card">
                <div class="podcast-cover"><span>Voz do Trabalhador</span><strong>Podcast</strong></div>
                <div>
                    <p class="post-meta"><span>Episódio <?php echo esc_html( get_post_meta( $podcast_destaque->ID, '_sind_numero_episodio', true ) ); ?></span></p>
                    <h3><?php echo esc_html( $podcast_destaque->post_title ); ?></h3>
                    <a class="button button--small" href="<?php echo esc_url( get_post_meta( $podcast_destaque->ID, '_sind_url_player', true ) ?: '#' ); ?>" target="_blank" rel="noopener">Ouvir agora</a>
                </div>
            </article>
            <div class="episode-list">
                <?php foreach ( $podcast_lista as $episodio ) : ?>
                <a href="<?php echo esc_url( get_post_meta( $episodio->ID, '_sind_url_player', true ) ?: '#' ); ?>" target="_blank" rel="noopener">
                    <span>#<?php echo esc_html( get_post_meta( $episodio->ID, '_sind_numero_episodio', true ) ); ?> <?php echo esc_html( $episodio->post_title ); ?></span>
                    <time><?php echo esc_html( get_post_meta( $episodio->ID, '_sind_duracao', true ) ); ?></time>
                </a>
                <?php endforeach; ?>
            </div>
            <?php else : ?>
            <p>Em breve, novos episódios do podcast do sindicato.</p>
            <?php endif; ?>
        </div>

        <div class="media-column">
            <div class="section-heading section-heading--compact">
                <div><p class="section-label">Vídeos</p><h2>Vídeos do YouTube</h2></div>
            </div>
            <?php if ( $video_destaque ) : ?>
            <article class="video-feature" data-youtube-url="<?php echo esc_url( get_post_meta( $video_destaque->ID, '_sind_url_youtube', true ) ); ?>">
                <div class="video-thumb" role="img" aria-label="<?php echo esc_attr( $video_destaque->post_title ); ?>">
                    <span class="play-button">Play</span>
                </div>
                <h3><?php echo esc_html( $video_destaque->post_title ); ?></h3>
                <a class="text-link" href="<?php echo esc_url( get_post_meta( $video_destaque->ID, '_sind_url_youtube', true ) ); ?>" target="_blank" rel="noopener">Assistir no YouTube</a>
            </article>
            <div class="video-list">
                <?php foreach ( $video_lista as $video ) : ?>
                <a href="<?php echo esc_url( get_post_meta( $video->ID, '_sind_url_youtube', true ) ); ?>" target="_blank" rel="noopener"><span></span><?php echo esc_html( $video->post_title ); ?></a>
                <?php endforeach; ?>
            </div>
            <?php else : ?>
            <p>Em breve, novos vídeos no canal do sindicato. <a href="<?php echo esc_url( sindicato_get_contato( 'youtube_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">Acesse o canal</a>.</p>
            <?php endif; ?>
        </div>
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
        <p>Siga o sindicato no Instagram: <a href="<?php echo esc_url( sindicato_get_contato( 'instagram_url' ) ?: '#' ); ?>" target="_blank" rel="noopener">@sindicato</a>.</p>
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
