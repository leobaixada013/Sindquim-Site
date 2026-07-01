<?php
get_header();
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
<?php get_footer(); ?>
