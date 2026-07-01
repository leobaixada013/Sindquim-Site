<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
</main>
<footer id="contato" class="footer">
    <div class="container footer__grid">
        <div>
            <a class="brand brand--footer" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                <span class="brand__mark">S</span>
                <span>
                    <strong>Sindicato</strong>
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
            <p>(11) 3333-7777</p>
            <p>(11) 98888-8888 WhatsApp</p>
            <p>contato@sindicato.org.br</p>
            <p>Rua das Indústrias, 123 - São Paulo</p>
        </div>

        <div>
            <h3>Links úteis</h3>
            <a href="<?php echo esc_url( home_url( '/noticias/' ) ); ?>">Notícias</a>
            <a href="#convencoes">Convenções</a>
            <a href="#beneficios">Benefícios</a>
            <a href="#filie-se">Associe-se</a>
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
        <span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Sindicato. Todos os direitos reservados.</span>
        <span>Política de Privacidade | Transparência</span>
    </div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
