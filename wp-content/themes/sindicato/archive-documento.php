<?php
get_header();

$tipos_labels = array(
    'convencao'     => 'Convenção Coletiva',
    'acordo'        => 'Acordo Coletivo',
    'termo_aditivo' => 'Termo Aditivo',
);

$ano_filtro  = isset( $_GET['ano'] ) ? absint( $_GET['ano'] ) : 0;
$tipo_filtro = isset( $_GET['tipo'] ) ? sanitize_text_field( wp_unslash( $_GET['tipo'] ) ) : '';

$meta_query = array( 'relation' => 'AND' );
if ( $ano_filtro ) {
    $meta_query[] = array( 'key' => '_sind_ano', 'value' => $ano_filtro, 'compare' => '=' );
}
if ( $tipo_filtro ) {
    $meta_query[] = array( 'key' => '_sind_tipo', 'value' => $tipo_filtro, 'compare' => '=' );
}

$documentos = get_posts( array(
    'post_type'      => 'documento',
    'post_status'    => 'publish',
    'posts_per_page' => -1,
    'meta_query'     => $meta_query,
    'orderby'        => 'meta_value_num',
    'meta_key'       => '_sind_ano',
    'order'          => 'DESC',
) );

// Só oferece, no filtro, os anos que realmente têm documento publicado.
$anos = array();
foreach ( get_posts( array( 'post_type' => 'documento', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids' ) ) as $documento_id ) {
    $ano = get_post_meta( $documento_id, '_sind_ano', true );
    if ( $ano ) {
        $anos[ (int) $ano ] = true;
    }
}
krsort( $anos );

$tem_filtro_ativo = (bool) ( $ano_filtro || $tipo_filtro );
?>
<section class="section section--convencoes">
    <div class="container">
        <div class="section-heading">
            <div>
                <p class="section-label">Categoria em dia com seus direitos</p>
                <h2>Convenções e Documentos</h2>
            </div>
        </div>

        <form class="filtro-documentos" method="get">
            <label>
                <span>Ano</span>
                <select name="ano">
                    <option value="">Todos</option>
                    <?php foreach ( array_keys( $anos ) as $ano_opcao ) : ?>
                    <option value="<?php echo esc_attr( $ano_opcao ); ?>" <?php selected( $ano_filtro, $ano_opcao ); ?>><?php echo esc_html( $ano_opcao ); ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label>
                <span>Tipo</span>
                <select name="tipo">
                    <option value="">Todos</option>
                    <?php foreach ( $tipos_labels as $valor => $rotulo ) : ?>
                    <option value="<?php echo esc_attr( $valor ); ?>" <?php selected( $tipo_filtro, $valor ); ?>><?php echo esc_html( $rotulo ); ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <button type="submit" class="button button--primary">Filtrar</button>
            <?php if ( $tem_filtro_ativo ) : ?>
            <a class="text-link filtro-documentos__limpar" href="<?php echo esc_url( home_url( '/convencoes/' ) ); ?>">Limpar filtros</a>
            <?php endif; ?>
        </form>

        <?php if ( $documentos ) : ?>
        <p class="documento-list__resultado">
            <?php echo count( $documentos ); ?> <?php echo 1 === count( $documentos ) ? 'documento encontrado' : 'documentos encontrados'; ?>.
        </p>
        <ul class="documento-list">
            <?php foreach ( $documentos as $documento ) :
                $arquivo_id  = get_post_meta( $documento->ID, '_sind_arquivo_pdf', true );
                $arquivo_url = $arquivo_id ? wp_get_attachment_url( $arquivo_id ) : '';
                $tipo        = get_post_meta( $documento->ID, '_sind_tipo', true );
                $ano         = get_post_meta( $documento->ID, '_sind_ano', true );
            ?>
            <li class="documento-list__item">
                <div class="documento-list__info">
                    <span class="documento-list__tipo"><?php echo esc_html( $tipos_labels[ $tipo ] ?? $tipo ); ?></span>
                    <h3><?php echo esc_html( $documento->post_title ); ?></h3>
                    <span class="documento-list__ano"><?php echo esc_html( $ano ); ?></span>
                </div>
                <?php if ( $arquivo_url ) : ?>
                <a class="button button--small" href="<?php echo esc_url( $arquivo_url ); ?>" target="_blank" rel="noopener">Baixar PDF</a>
                <?php endif; ?>
            </li>
            <?php endforeach; ?>
        </ul>
        <?php else : ?>
        <div class="documento-list__vazio">
            <?php if ( $tem_filtro_ativo ) : ?>
            <p>Nenhum documento encontrado para o filtro selecionado.</p>
            <a class="text-link" href="<?php echo esc_url( home_url( '/convencoes/' ) ); ?>">Ver todos os documentos</a>
            <?php else : ?>
            <p>Nenhum documento publicado ainda. Assim que a diretoria publicar a convenção vigente, ela aparecerá aqui.</p>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
</section>
<?php get_footer(); ?>
