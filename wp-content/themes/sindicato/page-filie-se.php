<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1>Filie-se ao Sindicato</h1>
    <p>Associar-se fortalece a categoria nas negociações e garante acesso a benefícios exclusivos.</p>
    <p>
        <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, quero me filiar ao sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </p>
    <?php echo do_shortcode( '[contact-form-7 title="Formulario de Filiacao"]' ); ?>
</div>
<?php get_footer(); ?>
