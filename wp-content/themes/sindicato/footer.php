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
            <p><?php echo esc_html( sindicato_get_contato( 'telefone' ) ); ?></p>
            <p><?php echo esc_html( sindicato_get_contato( 'whatsapp' ) ); ?> WhatsApp</p>
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

        <form class="newsletter" action="#" method="post">
            <h3>Receba novidades</h3>
            <label for="email">Seu melhor e-mail</label>
            <div>
                <input id="email" name="email" type="email" placeholder="email@exemplo.com" />
                <button class="button button--primary" type="submit">Cadastrar</button>
            </div>
        </form>
    </div>
    <div class="container footer__bottom">
        <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista. Todos os direitos reservados.</span>
        <span><a href="<?php echo esc_url( home_url( '/politica-de-privacidade/' ) ); ?>">Política de Privacidade</a> | <a href="<?php echo esc_url( home_url( '/termos-de-uso/' ) ); ?>">Termos de Uso</a> | <a href="<?php echo esc_url( home_url( '/transparencia/' ) ); ?>">Transparência</a></span>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
