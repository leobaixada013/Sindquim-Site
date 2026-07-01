<?php get_header(); ?>
<section class="section section--filiese">
    <div class="container filiese-container">
        <div class="section-heading">
            <div>
                <p class="section-label">Fortaleça a categoria</p>
                <h2>Filie-se ao Sindicato</h2>
            </div>
        </div>
        <p class="filiese-intro">Associar-se fortalece a categoria nas negociações e garante acesso a benefícios exclusivos para você e sua família.</p>

        <div class="filiese-trust">
            <div class="filiese-trust__item">
                <span class="filiese-trust__label">Mensalidade</span>
                <strong>Valor acessível, definido em assembleia</strong>
                <span class="filiese-trust__nota">Referência: R$ 18,00/mês</span>
            </div>
            <div class="filiese-trust__item">
                <span class="filiese-trust__label">Benefícios inclusos</span>
                <strong><a href="<?php echo esc_url( home_url( '/plano-de-saude/' ) ); ?>">Plano de saúde</a>, <a href="<?php echo esc_url( home_url( '/juridico/' ) ); ?>">atendimento jurídico</a> e <a href="<?php echo esc_url( home_url( '/beneficios/' ) ); ?>">convênios</a></strong>
            </div>
            <div class="filiese-trust__item">
                <span class="filiese-trust__label">Depois de enviar</span>
                <strong>Nossa equipe entra em contato em até 2 dias úteis</strong>
            </div>
        </div>

        <div class="filiese-cta">
            <p class="filiese-cta__kicker">Prefere falar com alguém agora?</p>
            <a class="button button--primary" href="https://wa.me/<?php echo esc_attr( preg_replace( '/\D/', '', sindicato_get_contato( 'whatsapp' ) ) ); ?>?text=<?php echo rawurlencode( 'Olá, quero me filiar ao sindicato.' ); ?>" target="_blank" rel="noopener">Falar no WhatsApp</a>
        </div>

        <div class="filiese-divider"><span>ou preencha seus dados abaixo</span></div>

        <div class="form-card">
            <h3>Quero me associar</h3>
            <?php echo do_shortcode( '[contact-form-7 title="Formulario de Filiacao"]' ); ?>
        </div>
    </div>
</section>
<?php get_footer(); ?>
