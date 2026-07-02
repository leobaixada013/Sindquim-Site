<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
</main>
<footer id="contato" class="footer">
    <div class="container footer__grid">
        <div>
            <a class="brand brand--footer" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                <img class="brand__logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/logo-sindicato.jpeg' ); ?>" alt="Logo do Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista" />
                <span>
                    <strong>STI Baixada Santista</strong>
                    <small>Em defesa dos trabalhadores</small>
                </span>
            </a>
            <p>
                Representamos, defendemos e lutamos por melhores condições de trabalho, salários justos
                e respeito à categoria.
            </p>
        </div>

        <div>
            <h3>Fale conosco</h3>
            <p><a href="<?php echo esc_url( sindicato_link_telefone( sindicato_get_contato( 'telefone' ) ) ); ?>"><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></a></p>
            <p><a href="<?php echo esc_url( sindicato_link_whatsapp( sindicato_get_contato( 'whatsapp' ) ) ); ?>" target="_blank" rel="noopener"><?php echo esc_html( sindicato_get_contato( 'whatsapp' ) ); ?> WhatsApp</a></p>
            <p><?php echo esc_html( sindicato_get_contato( 'email' ) ); ?></p>
            <p><?php echo esc_html( sindicato_get_contato( 'endereco' ) ); ?></p>
        </div>

        <div>
            <h3>Links úteis</h3>
            <a href="<?php echo esc_url( home_url( '/noticias/' ) ); ?>">Notícias</a>
            <a href="<?php echo esc_url( home_url( '/convencoes/' ) ); ?>">Convenções</a>
            <a href="<?php echo esc_url( home_url( '/beneficios/' ) ); ?>">Benefícios</a>
            <a href="<?php echo esc_url( home_url( '/filie-se/' ) ); ?>">Associe-se</a>
        </div>

        <?php if ( shortcode_exists( 'contact-form-7' ) ) : ?>
        <div class="newsletter">
            <h3>Receba novidades</h3>
            <?php echo do_shortcode( '[contact-form-7 title="Newsletter"]' ); ?>
        </div>
        <?php endif; ?>
    </div>
    <div class="container footer__bottom">
        <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista. Todos os direitos reservados.</span>
        <span><a href="<?php echo esc_url( home_url( '/politica-de-privacidade/' ) ); ?>">Política de Privacidade</a> | <a href="<?php echo esc_url( home_url( '/termos-de-uso/' ) ); ?>">Termos de Uso</a> | <a href="<?php echo esc_url( home_url( '/transparencia/' ) ); ?>">Transparência</a></span>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
