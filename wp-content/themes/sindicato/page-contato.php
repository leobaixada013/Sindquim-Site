<?php get_header(); ?>
<section class="section section--contato">
    <div class="container">
        <div class="section-heading">
            <div>
                <p class="section-label">Fale com a gente</p>
                <h2>Contato</h2>
            </div>
        </div>
        <p class="contato-intro">Escolha o canal mais rápido para você: ligue, chame no WhatsApp ou envie uma mensagem pelo formulário abaixo.</p>

        <div class="contato-layout">
            <div class="contato-card">
                <h3>Fale rápido</h3>
                <p><a href="tel:<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'telefone' ) ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a></p>
                <p><?php echo esc_html( sindicato_get_contato( 'endereco' ) ); ?></p>
                <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, gostaria de falar com o sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>

                <div class="contato-mapa">
                    <iframe
                        title="Mapa do endereço do sindicato"
                        src="https://maps.google.com/maps?q=<?php echo rawurlencode( sindicato_get_contato( 'endereco' ) ); ?>&output=embed"
                        width="100%" height="240" style="border:0;" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
            </div>

            <div class="form-card">
                <h3>Envie uma mensagem</h3>
                <?php echo do_shortcode( '[contact-form-7 title="Formulario de Contato"]' ); ?>
            </div>
        </div>
    </div>
</section>
<?php get_footer(); ?>
