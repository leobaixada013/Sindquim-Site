<?php
get_header();

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
    'meta_query'      => $meta_query,
    'orderby'        => 'meta_value_num',
    'meta_key'       => '_sind_ano',
    'order'          => 'DESC',
) );
?>
<div class="container" style="padding: 40px 0;">
    <h1>Convenções e Documentos</h1>
    <form method="get">
        <label>Ano
            <input type="number" name="ano" value="<?php echo esc_attr( $ano_filtro ?: '' ); ?>" />
        </label>
        <label>Tipo
            <select name="tipo">
                <option value="">Todos</option>
                <option value="convencao" <?php selected( $tipo_filtro, 'convencao' ); ?>>Convenção Coletiva</option>
                <option value="acordo" <?php selected( $tipo_filtro, 'acordo' ); ?>>Acordo Coletivo</option>
                <option value="termo_aditivo" <?php selected( $tipo_filtro, 'termo_aditivo' ); ?>>Termo Aditivo</option>
            </select>
        </label>
        <button type="submit" class="button button--primary">Filtrar</button>
    </form>

    <?php if ( $documentos ) : ?>
    <ul>
        <?php foreach ( $documentos as $documento ) :
            $arquivo_id  = get_post_meta( $documento->ID, '_sind_arquivo_pdf', true );
            $arquivo_url = $arquivo_id ? wp_get_attachment_url( $arquivo_id ) : '';
        ?>
        <li>
            <strong><?php echo esc_html( $documento->post_title ); ?></strong>
            (<?php echo esc_html( get_post_meta( $documento->ID, '_sind_ano', true ) ); ?>)
            <?php if ( $arquivo_url ) : ?>
                <a href="<?php echo esc_url( $arquivo_url ); ?>" target="_blank" rel="noopener">Baixar PDF</a>
            <?php endif; ?>
        </li>
        <?php endforeach; ?>
    </ul>
    <?php else : ?>
    <p>Nenhum documento encontrado para o filtro selecionado.</p>
    <?php endif; ?>
</div>
<?php get_footer(); ?>
