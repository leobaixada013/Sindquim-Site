<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <?php while ( have_posts() ) : the_post(); ?>
    <h1><?php the_title(); ?></h1>
    <div class="page-content"><?php the_content(); ?></div>
    <?php endwhile; ?>
</div>
<?php get_footer(); ?>
