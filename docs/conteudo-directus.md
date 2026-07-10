# Conteúdo no Directus

## Objetivo

O Directus é o painel editorial do site. Ele guarda notícias, avisos, páginas institucionais, documentos, diretoria, dados jurídicos, configurações gerais e mensagens recebidas pelos formulários.

O schema é criado e atualizado por `scripts/directus-schema.mjs`. O script é idempotente: coleções, campos e permissões existentes são mantidos ou pulados quando já existem.

## Coleções

### `categorias`

Categorias usadas em notícias.

Campos principais:

- `nome`
- `slug`

### `posts`

Notícias do blog e matérias do site.

Campos principais:

- `status`
- `titulo`
- `slug`
- `resumo`
- `conteudo`
- `imagem`
- `categoria`
- `fixado_banner`
- `date_created`

A notícia publicada mais recente com `fixado_banner = true` vira o banner principal da home. Se não houver notícia fixada, a notícia publicada mais recente assume esse espaço.

### `avisos`

Avisos rápidos e avisos urgentes.

Campos principais:

- `status`
- `titulo`
- `mensagem_curta`
- `urgente`
- `data_inicio`
- `data_fim`
- `link`
- `texto_link`

Avisos urgentes aparecem na faixa vermelha do topo. Avisos não urgentes aparecem no painel de avisos da home e na rota de avisos.

### `proximos_videos`

Anúncios de próximos vídeos ou transmissões.

Campos principais:

- `status`
- `titulo`
- `descricao`
- `data_estreia`
- `imagem`

### `diretores`

Dados da diretoria.

Campos principais:

- `nome`
- `cargo`
- `foto`
- `ordem`

### `documentos`

Documentos institucionais, convenções, acordos, atas e editais.

Campos principais:

- `titulo`
- `tipo`
- `ano`
- `arquivo`

### `cards_instagram`

Cards manuais para a seção de Reels/Instagram.

Campos principais:

- `imagem`
- `legenda`
- `link`

O feed automático do Instagram não é usado no projeto atual.

### `paginas`

Páginas institucionais dinâmicas acessadas por slug, como `beneficios` e `filie-se`.

Campos principais:

- `titulo`
- `slug`
- `conteudo`

### `pagina_juridico`

Singleton com textos principais da página jurídica.

Controla hero, chamadas, títulos de seções e CTA final. O site possui conteúdo padrão em código para manter a página funcional mesmo se o Directus estiver sem dados.

### `juridico_direitos`

Cards de direitos trabalhistas exibidos na página jurídica.

Campos principais:

- `status`
- `ordem`
- `titulo`
- `sigla`
- `descricao`
- `cor`
- `destaque`
- `urgente`
- `texto_link`

### `juridico_plantoes`

Informações de plantão jurídico.

Campos principais:

- `status`
- `ordem`
- `titulo`
- `local`
- `horario`
- `observacao`

### `juridico_faq`

Perguntas frequentes da área jurídica.

Campos principais:

- `status`
- `ordem`
- `pergunta`
- `resposta`

### `juridico_campos_formulario`

Configuração dinâmica dos campos da triagem jurídica.

Campos principais:

- `status`
- `ordem`
- `chave`
- `rotulo`
- `tipo`
- `obrigatorio`
- `placeholder`
- `opcoes`
- `max_length`

### `configuracoes`

Singleton com dados gerais do site.

Campos principais:

- `telefone`
- `whatsapp`
- `email`
- `endereco`
- `instagram_url`
- `youtube_url`
- `youtube_channel_id`

`youtube_channel_id` evita ter que resolver o canal a partir da URL do YouTube a cada ciclo de cache.

### `inscricoes_newsletter`

Registros gerados pelo endpoint `/api/newsletter`.

Campos principais:

- `email`

### `mensagens_contato`

Registros gerados pelo endpoint `/api/contato`.

Campos principais:

- `nome`
- `email`
- `mensagem`

## Conteúdo de exemplo

O script `scripts/directus-conteudo-exemplo.mjs` cria dados de teste sem duplicar registros conhecidos. Ele inclui:

- categorias;
- notícias;
- aviso urgente;
- avisos rápidos;
- próximo vídeo;
- diretoria;
- documentos;
- cards de Instagram;
- páginas institucionais;
- configurações gerais.

Variáveis opcionais:

```bash
YOUTUBE_URL_EXEMPLO=https://www.youtube.com/@canal
YOUTUBE_CHANNEL_ID_EXEMPLO=UC...
INSTAGRAM_URL_EXEMPLO=https://www.instagram.com/perfil/
```

## Operação editorial

Para publicar conteúdo:

1. Entre no painel Directus.
2. Crie ou edite o item na coleção correspondente.
3. Marque `status` como `published` quando houver campo de status.
4. Confira datas de início/fim em avisos.
5. Use imagens otimizadas; o site solicita WebP com dimensões adequadas via endpoint de assets do Directus.

## Cuidados

- Slugs devem ser únicos por coleção.
- Conteúdo jurídico deve ser revisado antes de publicação.
- Campos de formulário jurídico afetam a experiência pública da página `/juridico`.
- Não remover `configuracoes` sem revisar a home, o layout e a seção de mídia.
- Não apagar uploads usados por posts, documentos ou cards publicados.
