<?php
get_header();
$diretoria = sindicato_get_diretoria();
?>
<div class="container" style="padding: 40px 0;">
    <?php while ( have_posts() ) : the_post(); ?>
    <h1><?php the_title(); ?></h1>
    <div class="page-content"><?php the_content(); ?></div>
    <?php endwhile; ?>

    <?php if ( $diretoria ) : ?>
    <div class="post-grid" aria-label="Membros da diretoria">
        <?php foreach ( $diretoria as $membro ) : ?>
        <article class="post-card">
            <div class="post-image post-image--document"<?php echo has_post_thumbnail( $membro->ID ) ? ' style="background-image:url(' . esc_url( get_the_post_thumbnail_url( $membro->ID, 'medium' ) ) . ')"' : ''; ?> role="img" aria-label="<?php echo esc_attr( $membro->post_title ); ?>"></div>
            <div class="post-card__body">
                <h3><?php echo esc_html( $membro->post_title ); ?></h3>
                <p><?php echo esc_html( get_post_meta( $membro->ID, '_sind_cargo', true ) ); ?></p>
            </div>
        </article>
        <?php endforeach; ?>
    </div>
    <?php else : ?>
    <p>Em breve, os membros da diretoria serão listados aqui.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
