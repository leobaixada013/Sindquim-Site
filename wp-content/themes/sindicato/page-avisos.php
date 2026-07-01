<?php
get_header();
$avisos = get_posts( array(
    'post_type'      => 'aviso',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'meta_key'       => '_sind_data_inicio',
    'orderby'        => 'meta_value',
    'order'          => 'DESC',
) );
?>
<div class="container" style="padding: 40px 0;">
    <?php while ( have_posts() ) : the_post(); ?>
    <h1><?php the_title(); ?></h1>
    <div class="page-content"><?php the_content(); ?></div>
    <?php endwhile; ?>

    <?php if ( $avisos ) : ?>
    <ul class="notice-list">
        <?php foreach ( $avisos as $aviso ) :
            $data_inicio = get_post_meta( $aviso->ID, '_sind_data_inicio', true );
            $mensagem    = get_post_meta( $aviso->ID, '_sind_mensagem_curta', true );
            $link        = get_post_meta( $aviso->ID, '_sind_link', true );
        ?>
        <li>
            <?php if ( $data_inicio ) : ?>
            <time datetime="<?php echo esc_attr( $data_inicio ); ?>"><?php echo esc_html( date_i18n( 'd/m/Y', strtotime( $data_inicio ) ) ); ?></time>
            <?php endif; ?>
            <span>
                <strong><?php echo esc_html( $aviso->post_title ); ?></strong>
                <?php if ( $mensagem ) : ?> — <?php echo esc_html( $mensagem ); ?><?php endif; ?>
                <?php if ( $link ) : ?> <a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( get_post_meta( $aviso->ID, '_sind_texto_link', true ) ?: 'Saiba mais' ); ?></a><?php endif; ?>
            </span>
        </li>
        <?php endforeach; ?>
    </ul>
    <?php else : ?>
    <p>Nenhum aviso publicado no momento.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
