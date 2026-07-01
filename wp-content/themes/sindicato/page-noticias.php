<?php
get_header();

$paged = max( 1, get_query_var( 'paged' ) ? get_query_var( 'paged' ) : ( get_query_var( 'page' ) ? get_query_var( 'page' ) : 1 ) );

$noticias_query = new WP_Query( array(
    'post_type'      => 'post',
    'post_status'    => 'publish',
    'posts_per_page' => 9,
    'paged'          => $paged,
) );
?>
<div class="container" style="padding: 40px 0;">
    <h1>Notícias</h1>
    <?php if ( $noticias_query->have_posts() ) : ?>
        <div class="post-grid">
            <?php while ( $noticias_query->have_posts() ) : $noticias_query->the_post(); ?>
            <article class="post-card">
                <div class="post-image post-image--document" role="img" aria-label="<?php the_title_attribute(); ?>"></div>
                <div class="post-card__body">
                    <div class="post-meta">
                        <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
                        <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
                    </div>
                    <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                    <p><?php echo esc_html( get_the_excerpt() ); ?></p>
                </div>
            </article>
            <?php endwhile; ?>
        </div>
        <?php
        echo paginate_links( array(
            'total'   => $noticias_query->max_num_pages,
            'current' => $paged,
            'format'  => '?paged=%#%',
            'base'    => esc_url( home_url( '/noticias/' ) ) . '%_%',
        ) );
        wp_reset_postdata();
        ?>
    <?php else : ?>
        <p>Nenhuma notícia encontrada.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
