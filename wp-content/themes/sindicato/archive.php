<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1><?php single_cat_title(); ?></h1>
    <?php if ( have_posts() ) : ?>
        <div class="post-grid">
            <?php while ( have_posts() ) : the_post(); ?>
            <article class="post-card">
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
        <?php the_posts_pagination(); ?>
    <?php else : ?>
        <p>Nenhuma notícia encontrada.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
