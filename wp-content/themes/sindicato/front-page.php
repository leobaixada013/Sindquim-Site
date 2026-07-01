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
            <p>Notícias entram na Task 5.</p>

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
