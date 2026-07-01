<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <?php while ( have_posts() ) : the_post(); ?>
    <article>
        <div class="post-meta">
            <span><?php echo esc_html( get_the_category()[0]->name ?? '' ); ?></span>
            <time datetime="<?php echo esc_attr( get_the_date( 'Y-m-d' ) ); ?>"><?php echo esc_html( get_the_date( 'd/m/Y' ) ); ?></time>
        </div>
        <h1><?php the_title(); ?></h1>
        <?php the_content(); ?>
        <p>
            Compartilhar:
            <a href="https://api.whatsapp.com/send?text=<?php echo rawurlencode( get_the_title() . ' ' . get_permalink() ); ?>" target="_blank" rel="noopener">WhatsApp</a>
            |
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo rawurlencode( get_permalink() ); ?>" target="_blank" rel="noopener">Facebook</a>
        </p>
    </article>
    <?php endwhile; ?>
</div>
<?php get_footer(); ?>
