<?php get_header(); ?>
<div class="container" style="padding: 40px 0;">
    <h1>Contato</h1>
    <p>Telefone: <?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></p>
    <p>Endereço: <?php echo esc_html( sindicato_get_contato( 'endereco' ) ); ?></p>
    <p>
        <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, gostaria de falar com o sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>
    </p>
    <iframe
        title="Mapa do endereço do sindicato"
        src="https://maps.google.com/maps?q=<?php echo rawurlencode( sindicato_get_contato( 'endereco' ) ); ?>&output=embed"
        width="100%" height="300" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
    </iframe>
    <?php echo do_shortcode( '[contact-form-7 title="Formulario de Contato"]' ); ?>
</div>
<?php get_footer(); ?>
