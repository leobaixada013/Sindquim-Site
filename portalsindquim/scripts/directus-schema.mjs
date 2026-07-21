/**
 * Bootstrap do schema do Directus para o site do sindicato.
 * Idempotente: coleções/campos/permissões já existentes são pulados.
 *
 * Uso:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/directus-schema.mjs
 */

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  process.exit(1);
}

let token = '';

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  if (!resposta.ok) {
    const erro = new Error(
      `${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`,
    );
    erro.status = resposta.status;
    throw erro;
  }
  return json.data;
}

function campoTexto(nome, rotulo, opcoes = {}) {
  return {
    field: nome,
    type: opcoes.tipo ?? 'string',
    schema: { is_nullable: !opcoes.obrigatorio, ...(opcoes.schema ?? {}) },
    meta: {
      interface: opcoes.interface ?? 'input',
      options: opcoes.options ?? {},
      required: Boolean(opcoes.obrigatorio),
      note: opcoes.nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
      ...(opcoes.meta ?? {}),
    },
  };
}

function campoStatus() {
  return {
    field: 'status',
    type: 'string',
    schema: { default_value: 'draft', is_nullable: false },
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      note: 'Rascunho não aparece no site. Publicado entra no ar ao salvar. Agendado entra no ar na data escolhida.',
      translations: [{ language: 'pt-BR', translation: 'Situação' }],
      options: {
        choices: [
          { text: 'Publicado', value: 'published', color: 'var(--theme--primary)' },
          { text: 'Rascunho', value: 'draft', color: 'var(--theme--foreground-subdued)' },
          { text: 'Agendado', value: 'scheduled', color: 'var(--theme--warning)' },
          { text: 'Arquivado', value: 'archived', color: 'var(--theme--warning)' },
        ],
      },
    },
  };
}

function campoBooleano(nome, rotulo, nota) {
  return {
    field: nome,
    type: 'boolean',
    schema: { default_value: false, is_nullable: false },
    meta: {
      interface: 'boolean',
      width: 'half',
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoData(nome, rotulo, comHora = false, opcoes = {}) {
  return {
    field: nome,
    type: comHora ? 'timestamp' : 'date',
    schema: {},
    meta: {
      interface: 'datetime',
      width: 'half',
      note: opcoes.nota,
      readonly: Boolean(opcoes.somenteLeitura),
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoArquivo(nome, rotulo, imagem = true, opcoes = {}) {
  return {
    field: nome,
    type: 'uuid',
    schema: { is_nullable: !opcoes.obrigatorio, ...(opcoes.schema ?? {}) },
    meta: {
      interface: imagem ? 'file-image' : 'file',
      special: ['file'],
      required: Boolean(opcoes.obrigatorio),
      note: opcoes.nota,
      options: opcoes.options ?? {},
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoDataCriacao() {
  return {
    field: 'date_created',
    type: 'timestamp',
    schema: {},
    meta: {
      interface: 'datetime',
      special: ['date-created'],
      readonly: true,
      hidden: true,
      width: 'half',
    },
  };
}

function campoDataAtualizacao() {
  return {
    field: 'date_updated',
    type: 'timestamp',
    schema: {},
    meta: {
      interface: 'datetime',
      special: ['date-updated'],
      readonly: true,
      hidden: true,
      width: 'half',
    },
  };
}

function campoUsuarioSistema(nome, especial) {
  return {
    field: nome,
    type: 'uuid',
    schema: {},
    meta: {
      interface: 'select-dropdown-m2o',
      special: [especial],
      readonly: true,
      hidden: true,
      width: 'half',
    },
  };
}

function campoWysiwyg(nome, rotulo) {
  return {
    field: nome,
    type: 'text',
    schema: {},
    meta: {
      interface: 'input-rich-text-html',
      translations: [{ language: 'pt-BR', translation: rotulo }],
      options: {
        toolbar: [
          'bold', 'italic', 'underline', 'h2', 'h3', 'numlist', 'bullist',
          'blockquote', 'link', 'image', 'media', 'removeformat', 'undo', 'redo',
        ],
      },
    },
  };
}

function campoOrdem() {
  return {
    field: 'ordem',
    type: 'integer',
    schema: {},
    meta: {
      interface: 'input',
      width: 'half',
      translations: [{ language: 'pt-BR', translation: 'Ordem' }],
    },
  };
}

function campoMetrica(nome, rotulo, nota) {
  return {
    field: nome,
    type: 'integer',
    schema: { default_value: 0, is_nullable: false },
    meta: {
      interface: 'input',
      width: 'half',
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoGrupo(nome, rotulo, aberto = false, nota) {
  return {
    field: nome,
    type: 'alias',
    schema: null,
    meta: {
      interface: 'group-detail',
      special: ['alias', 'no-data', 'group'],
      options: { start: aberto ? 'open' : 'closed' },
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function noGrupo(campo, grupo) {
  return { ...campo, meta: { ...(campo.meta ?? {}), group: grupo } };
}

function campoUltimaSincronizacaoMetricas() {
  return {
    field: 'ultima_sincronizacao_metricas',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      width: 'half',
      readonly: true,
      translations: [{ language: 'pt-BR', translation: 'Última sincronização das métricas' }],
      note: 'Atualizado automaticamente pelos scripts de analytics.',
    },
  };
}

const COLECOES = [
  {
    collection: 'categorias',
    meta: { icon: 'sell', hidden: true, translations: [{ language: 'pt-BR', translation: 'Categorias', singular: 'Categoria', plural: 'Categorias' }] },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
      campoTexto('nome', 'Nome', { obrigatorio: true }),
      campoTexto('slug', 'Slug', { obrigatorio: true, nota: 'Identificador na URL, ex.: campanha-salarial' }),
    ],
  },
  {
    collection: 'posts',
    meta: {
      icon: 'newspaper',
      sort: 1,
      display_template: '{{titulo}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft',
      sort_field: null,
      translations: [{ language: 'pt-BR', translation: 'Notícias', singular: 'Notícia', plural: 'Notícias' }],
    },
    schema: {},
    fields: [
      campoGrupo('essencial', '1. Escreva a notícia', true, 'Comece por estes quatro campos.'),
      noGrupo(campoTexto('titulo', 'Título da notícia', { obrigatorio: true, nota: 'Escreva uma frase curta e direta. Ex.: Sindicato abre inscrições para curso.' }), 'essencial'),
      noGrupo(campoArquivo('imagem', 'Foto de capa — envie aqui', true, {
        nota: 'Clique no primeiro botão para enviar do computador ou celular. Use JPG, PNG ou WebP horizontal (de preferência 16:9).',
      }), 'essencial'),
      noGrupo(campoTexto('imagem_alt', 'Descreva a foto', { obrigatorio: true, nota: 'Ex.: Trabalhadores reunidos em frente à fábrica. Essa descrição ajuda pessoas que não conseguem ver a imagem.' }), 'essencial'),
      noGrupo(campoWysiwyg('conteudo', 'Texto da notícia'), 'essencial'),

      campoGrupo('complementos', '2. Complete se precisar', false, 'Resumo, categoria, galeria, crédito, fonte e vídeo são opcionais.'),
      noGrupo(campoTexto('resumo', 'Resumo curto', { interface: 'input-multiline', nota: 'Duas ou três frases que ajudam a pessoa a decidir se quer ler.' }), 'complementos'),
      noGrupo({ field: 'categoria', type: 'integer', schema: {}, meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', display: 'related-values', display_options: { template: '{{nome}}' }, translations: [{ language: 'pt-BR', translation: 'Categoria' }] } }, 'complementos'),
      noGrupo(campoTexto('imagem_legenda', 'Legenda da foto', { nota: 'Opcional. Aparece abaixo da foto de capa.' }), 'complementos'),
      noGrupo(campoTexto('imagem_credito', 'Crédito da foto', { meta: { width: 'half' } }), 'complementos'),
      noGrupo({ field: 'galeria', type: 'alias', schema: null, meta: { interface: 'list-o2m', special: ['o2m'], options: { template: '{{legenda}}' }, translations: [{ language: 'pt-BR', translation: 'Galeria de fotos' }], note: 'Opcional. Adicione e ordene fotos complementares.' } }, 'complementos'),
      noGrupo(campoTexto('fonte_nome', 'Nome da fonte', { meta: { width: 'half' }, nota: 'Ex.: Ministério do Trabalho ou assessoria do sindicato.' }), 'complementos'),
      noGrupo(campoTexto('fonte_url', 'Link da fonte', { meta: { width: 'half' }, nota: 'Use endereço completo começando com https://.' }), 'complementos'),
      noGrupo(campoTexto('empresa', 'Empresa ou entidade citada', { meta: { width: 'half' }, nota: 'Ex.: Petrobras/RPBC, Yara ou SINDQUIM.' }), 'complementos'),
      noGrupo(campoTexto('cidade', 'Cidade', {
        interface: 'select-dropdown',
        options: { allowOther: true, choices: [
          { text: 'Bertioga', value: 'Bertioga' },
          { text: 'Cubatão', value: 'Cubatão' },
          { text: 'Guarujá', value: 'Guarujá' },
          { text: 'Itanhaém', value: 'Itanhaém' },
          { text: 'Mongaguá', value: 'Mongaguá' },
          { text: 'Praia Grande', value: 'Praia Grande' },
          { text: 'Santos', value: 'Santos' },
          { text: 'São Vicente', value: 'São Vicente' },
          { text: 'Baixada Santista', value: 'Baixada Santista' },
        ] },
        meta: { width: 'half' },
      }), 'complementos'),
      noGrupo(campoData('data_fato', 'Data do fato'), 'complementos'),
      noGrupo(campoTexto('youtube_url', 'Vídeo relacionado', { nota: 'Opcional. Cole o link oficial do YouTube.' }), 'complementos'),

      campoGrupo('publicacao', '3. Revise e publique', true, 'Para publicar agora: escolha “Publicado” e clique no botão ✓ no canto superior direito. Se ainda estiver revisando, deixe como “Rascunho”.'),
      noGrupo(campoStatus(), 'publicacao'),
      noGrupo(campoData('publicado_em', 'Publicado em (automático)', true, { somenteLeitura: true, nota: 'O sistema preenche esta data quando a notícia entra no ar.' }), 'publicacao'),
      noGrupo(campoData('agendado_para', 'Agendar publicação', true, { nota: 'Preencha somente se escolher “Agendado” na situação.' }), 'publicacao'),
      noGrupo(campoBooleano('fixado_banner', 'Destacar na página inicial', 'Somente pessoas autorizadas devem usar este destaque.'), 'publicacao'),

      // O banco continua exigindo e garantindo unicidade, mas o Data Studio não
      // pode validar um campo oculto antes de o hook items.create gerar o valor.
      campoTexto('slug', 'Endereço automático', {
        schema: { is_nullable: false, is_unique: true },
        meta: { hidden: true, readonly: true, required: false },
        nota: 'Criado automaticamente a partir do título.',
      }),
      campoDataCriacao(),
      campoDataAtualizacao(),
      campoUsuarioSistema('user_created', 'user-created'),
      campoUsuarioSistema('user_updated', 'user-updated'),
    ],
    relacoes: [
      { field: 'categoria', related_collection: 'categorias' },
      { field: 'imagem', related_collection: 'directus_files', schema: { on_delete: 'RESTRICT' } },
    ],
  },
  {
    collection: 'posts_galeria',
    meta: { icon: 'photo_library', display_template: '{{legenda}}', sort_field: 'ordem', hidden: true, translations: [{ language: 'pt-BR', translation: 'Fotos da notícia', singular: 'Foto', plural: 'Fotos' }] },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', schema: { is_primary_key: true, has_auto_increment: true }, meta: { hidden: true } },
      { field: 'post', type: 'integer', schema: { is_nullable: false }, meta: { interface: 'select-dropdown-m2o', special: ['m2o'], hidden: true } },
      campoOrdem(),
      campoArquivo('imagem', 'Foto', true, { obrigatorio: true, nota: 'Escolha uma foto JPG, PNG ou WebP.' }),
      campoTexto('texto_alternativo', 'Descrição da foto', { obrigatorio: true }),
      campoTexto('legenda', 'Legenda'),
      campoTexto('credito', 'Crédito'),
    ],
    relacoes: [
      { field: 'post', related_collection: 'posts', schema: { on_delete: 'CASCADE' }, meta: { one_field: 'galeria' } },
      { field: 'imagem', related_collection: 'directus_files', schema: { on_delete: 'RESTRICT' } },
    ],
  },
  {
    collection: 'avisos',
    meta: { icon: 'campaign', hidden: true, display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Avisos', singular: 'Aviso', plural: 'Avisos' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('mensagem_curta', 'Mensagem curta', { interface: 'input-multiline' }),
      campoBooleano('urgente', 'Urgente', 'Avisos urgentes aparecem na faixa vermelha do topo do site.'),
      campoData('data_inicio', 'Exibir a partir de', true),
      campoData('data_fim', 'Exibir até', true),
      campoTexto('link', 'Link (opcional)'),
      campoTexto('texto_link', 'Texto do link'),
    ],
  },
  {
    collection: 'proximos_videos',
    meta: { icon: 'live_tv', hidden: true, display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Próximos vídeos', singular: 'Próximo vídeo', plural: 'Próximos vídeos' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('descricao', 'Descrição', { interface: 'input-multiline' }),
      campoData('data_estreia', 'Data e hora da estreia', true),
      campoArquivo('imagem', 'Imagem (opcional)'),
      campoMetrica('visualizacoes', 'Visualizações', 'Total de visualizações registradas no YouTube.'),
      campoMetrica('curtidas', 'Curtidas', 'Total de curtidas registradas no YouTube.'),
      campoMetrica('comentarios', 'Comentários', 'Total de comentários registrados no YouTube.'),
      campoMetrica('compartilhamentos', 'Compartilhamentos', 'Total de compartilhamentos ou interações equivalentes.'),
      campoUltimaSincronizacaoMetricas(),
    ],
    relacoes: [{ field: 'imagem', related_collection: 'directus_files' }],
  },
  {
    collection: 'diretores',
    meta: {
      icon: 'groups',
      hidden: false,
      sort: 4,
      display_template: '{{nome}} — {{cargo}}',
      sort_field: 'ordem',
      archive_field: 'status',
      archive_value: 'archived',
      unarchive_value: 'draft',
      translations: [{ language: 'pt-BR', translation: 'Diretoria', singular: 'Integrante', plural: 'Diretoria' }],
    },
    schema: {},
    fields: [
      campoGrupo('diretoria_identificacao', '1. Quem é a pessoa', true, 'Nome, função e foto são suficientes para publicar.'),
      noGrupo(campoTexto('nome', 'Nome completo', { obrigatorio: true, nota: 'Use o nome pelo qual a pessoa deve aparecer no site.' }), 'diretoria_identificacao'),
      noGrupo(campoTexto('cargo', 'Função na diretoria', { obrigatorio: true, nota: 'Ex.: Presidente, Vice-presidente ou Conselho Fiscal.' }), 'diretoria_identificacao'),
      noGrupo(campoTexto('grupo', 'Grupo', {
        interface: 'select-dropdown',
        schema: { default_value: 'diretoria-executiva' },
        options: { choices: [
          { text: 'Diretoria executiva', value: 'diretoria-executiva' },
          { text: 'Conselho fiscal', value: 'conselho-fiscal' },
          { text: 'Suplência', value: 'suplencia' },
          { text: 'Representação junto à federação', value: 'representacao' },
        ] },
        meta: { width: 'half' },
      }), 'diretoria_identificacao'),
      noGrupo(campoArquivo('foto', 'Foto (opcional)'), 'diretoria_identificacao'),

      campoGrupo('diretoria_complementos', '2. Informações opcionais', false, 'Use apenas dados institucionais que possam ser publicados.'),
      noGrupo(campoTexto('descricao', 'Apresentação curta', { interface: 'input-multiline', nota: 'Duas ou três frases sobre a atuação institucional.' }), 'diretoria_complementos'),
      noGrupo(campoData('mandato_inicio', 'Início do mandato'), 'diretoria_complementos'),
      noGrupo(campoData('mandato_fim', 'Fim do mandato'), 'diretoria_complementos'),
      noGrupo(campoTexto('fonte_nome', 'Fonte da informação', { meta: { width: 'half' } }), 'diretoria_complementos'),
      noGrupo(campoTexto('fonte_url', 'Link de conferência', { meta: { width: 'half' }, nota: 'Fica no painel para facilitar futuras conferências.' }), 'diretoria_complementos'),

      campoGrupo('diretoria_publicacao', '3. Exibição no site', true, 'Publique somente depois de conferir nome e função.'),
      noGrupo(campoStatus(), 'diretoria_publicacao'),
      { field: 'ordem', type: 'integer', schema: {}, meta: { interface: 'input', hidden: true } },
    ],
    relacoes: [{ field: 'foto', related_collection: 'directus_files' }],
  },
  {
    collection: 'cards_instagram',
    meta: { icon: 'smart_display', hidden: true, display_template: '{{legenda}}', translations: [{ language: 'pt-BR', translation: 'Reels do Instagram', singular: 'Reel', plural: 'Reels' }] },
    schema: {},
    fields: [
      campoArquivo('imagem', 'Capa do Reel'),
      campoTexto('legenda', 'Título/legenda do Reel'),
      campoTexto('link', 'Link do Reel'),
      campoMetrica('visualizacoes', 'Visualizações', 'Total de visualizações registradas no Instagram.'),
      campoMetrica('curtidas', 'Curtidas', 'Total de curtidas registradas no Instagram.'),
      campoMetrica('comentarios', 'Comentários', 'Total de comentários registrados no Instagram.'),
      campoMetrica('compartilhamentos', 'Compartilhamentos', 'Total de compartilhamentos ou interações equivalentes.'),
      campoUltimaSincronizacaoMetricas(),
    ],
    relacoes: [{ field: 'imagem', related_collection: 'directus_files' }],
  },
  {
    collection: 'paginas',
    meta: { icon: 'article', hidden: true, display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Páginas', singular: 'Página', plural: 'Páginas' }] },
    schema: {},
    fields: [
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('slug', 'Slug', { obrigatorio: true, nota: 'Endereço da página, ex.: filie-se' }),
      campoWysiwyg('conteudo', 'Conteúdo'),
    ],
  },
  {
    collection: 'pagina_beneficios',
    meta: { icon: 'volunteer_activism', singleton: true, sort: 3, translations: [{ language: 'pt-BR', translation: 'Textos de Benefícios', singular: 'Textos de Benefícios', plural: 'Textos de Benefícios' }] },
    schema: {},
    fields: [
      campoTexto('hero_rotulo', 'Rótulo do topo'),
      campoTexto('hero_titulo', 'Título principal'),
      campoTexto('hero_resumo', 'Resumo principal', { interface: 'input-multiline' }),
      campoTexto('introducao_titulo', 'Título da lista'),
      campoTexto('introducao_texto', 'Texto da lista', { interface: 'input-multiline' }),
      campoTexto('aviso_titulo', 'Título do aviso'),
      campoTexto('aviso_texto', 'Texto do aviso', { interface: 'input-multiline' }),
      campoTexto('cta_titulo', 'Título da chamada final'),
      campoTexto('cta_texto', 'Texto da chamada final', { interface: 'input-multiline' }),
      campoTexto('cta_link_texto', 'Texto do botão', { meta: { width: 'half' } }),
      campoTexto('cta_link_href', 'Destino do botão', { meta: { width: 'half' } }),
    ],
  },
  {
    collection: 'beneficios',
    meta: { icon: 'redeem', sort: 2, display_template: '{{titulo}}', archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Benefícios', singular: 'Benefício', plural: 'Benefícios' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('titulo', 'Nome do benefício', { obrigatorio: true }),
      campoTexto('categoria', 'Categoria', { obrigatorio: true, interface: 'select-dropdown', options: { choices: [
        { text: 'Saúde', value: 'saude' }, { text: 'Educação', value: 'educacao' },
        { text: 'Bem-estar', value: 'bem-estar' }, { text: 'Serviços', value: 'servicos' },
        { text: 'Outros', value: 'outros' },
      ] }, meta: { width: 'half' } }),
      campoTexto('resumo', 'Resumo da vantagem', { obrigatorio: true, interface: 'input-multiline' }),
      campoTexto('detalhes', 'Detalhes e limites', { interface: 'input-multiline' }),
      campoTexto('elegibilidade', 'Quem pode usar', { interface: 'input-multiline' }),
      campoTexto('como_usar', 'Como usar', { interface: 'input-multiline' }),
      campoTexto('requisitos', 'O que levar', { interface: 'input-multiline' }),
      campoData('validade_inicio', 'Válido a partir de'),
      campoData('validade_fim', 'Válido até'),
      campoTexto('cta_texto', 'Texto do botão', { meta: { width: 'half' } }),
      campoTexto('cta_url', 'Destino do botão', { meta: { width: 'half' } }),
      campoArquivo('imagem', 'Imagem opcional'),
      campoTexto('imagem_alt', 'Descrição da imagem'),
      campoBooleano('destaque', 'Destacar benefício', 'Aplica destaque visual sem alterar a ordem.'),
      campoDataAtualizacao(),
      campoUsuarioSistema('user_updated', 'user-updated'),
    ],
    relacoes: [{ field: 'imagem', related_collection: 'directus_files' }],
  },
  {
    collection: 'pagina_juridico',
    meta: { icon: 'gavel', singleton: true, sort: 4, translations: [{ language: 'pt-BR', translation: 'Textos do Jurídico', singular: 'Textos do Jurídico', plural: 'Textos do Jurídico' }] },
    schema: {},
    fields: [
      campoGrupo('juridico_apresentacao', '1. Apresentação da página', true, 'Título, resumo e botões que aparecem no topo.'),
      noGrupo(campoTexto('hero_rotulo', 'Rótulo do topo'), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_titulo', 'Título principal'), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_resumo', 'Resumo principal', { interface: 'input-multiline' }), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_cta_primario_texto', 'Texto do botão principal', { meta: { width: 'half' } }), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_cta_primario_href', 'Destino do botão principal', { meta: { width: 'half' }, nota: 'Use #agendamento para levar ao formulário.' }), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_cta_secundario_texto', 'Texto do botão secundário', { meta: { width: 'half' } }), 'juridico_apresentacao'),
      noGrupo(campoTexto('hero_cta_secundario_href', 'Destino do botão secundário', { meta: { width: 'half' }, nota: 'Use #direitos para levar aos cards.' }), 'juridico_apresentacao'),

      campoGrupo('juridico_triagem', '2. Triagem protegida', true, 'Os textos são editáveis; privacidade, consentimento, acesso e validação continuam protegidos pelo sistema.'),
      noGrupo(campoTexto('agendamento_rotulo', 'Rótulo da seção', { meta: { width: 'half' } }), 'juridico_triagem'),
      noGrupo(campoTexto('agendamento_titulo', 'Título da seção', { meta: { width: 'half' } }), 'juridico_triagem'),
      noGrupo(campoTexto('agendamento_texto', 'Explicação antes do formulário', { interface: 'input-multiline' }), 'juridico_triagem'),
      noGrupo(campoTexto('plantao_titulo', 'Título do plantão'), 'juridico_triagem'),
      noGrupo(campoTexto('chamado_titulo', 'Título do formulário'), 'juridico_triagem'),
      noGrupo(campoTexto('chamado_resumo', 'Explicação do formulário', { interface: 'input-multiline' }), 'juridico_triagem'),
      noGrupo(campoTexto('chamado_prazo_texto', 'Prazo/retorno informado', { interface: 'input-multiline' }), 'juridico_triagem'),
      noGrupo(campoTexto('chamado_privacidade_texto', 'Aviso de privacidade', { interface: 'input-multiline', nota: 'Descreva a finalidade e o acesso restrito. O aceite continua obrigatório no sistema.' }), 'juridico_triagem'),
      noGrupo(campoBooleano('chamado_exigir_cpf', 'Exigir CPF na primeira triagem', 'Mantenha desligado, salvo decisão jurídica e de privacidade documentada.'), 'juridico_triagem'),
      noGrupo(campoBooleano('chamado_exigir_anexo', 'Exigir anexo na primeira triagem', 'Mantenha desligado, salvo necessidade documentada.'), 'juridico_triagem'),

      campoGrupo('juridico_secoes', '3. Outros títulos e chamadas', false, 'Ajustes das seções de temas, perguntas e chamada final.'),
      noGrupo(campoTexto('direitos_rotulo', 'Rótulo da seção de temas', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('direitos_titulo', 'Título da seção de temas', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('faq_rotulo', 'Rótulo das perguntas', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('faq_titulo', 'Título das perguntas', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('cta_rotulo', 'Rótulo da chamada final', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('cta_titulo', 'Título da chamada final', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('cta_link_texto', 'Texto do botão final', { meta: { width: 'half' } }), 'juridico_secoes'),
      noGrupo(campoTexto('cta_link_href', 'Destino do botão final', { meta: { width: 'half' } }), 'juridico_secoes'),

      campoGrupo('juridico_busca', '4. Busca e compartilhamento', false, 'Texto que resume a página nos mecanismos de busca.'),
      noGrupo(campoTexto('seo_descricao', 'Descrição para busca e compartilhamento', { interface: 'input-multiline' }), 'juridico_busca'),
    ],
  },
  {
    collection: 'juridico_direitos',
    meta: { icon: 'balance', sort: 5, display_template: '{{titulo}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Temas do Jurídico', singular: 'Tema jurídico', plural: 'Temas jurídicos' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('sigla', 'Sigla', { obrigatorio: true, nota: 'Três letras exibidas no card, ex.: JOR.' }),
      campoTexto('descricao', 'Descrição', { interface: 'input-multiline', obrigatorio: true }),
      campoTexto('cor', 'Cor do card', {
        interface: 'select-dropdown',
        options: { choices: [{ text: 'Azul-aço', value: 'aco' }, { text: 'Vermelho', value: 'vermelho' }] },
        meta: { width: 'half' },
      }),
      campoBooleano('destaque', 'Card largo', 'Faz o card ocupar duas colunas no desktop.'),
      campoBooleano('urgente', 'Mostrar tag urgente', 'Mostra o selo Urgente no canto do card.'),
      campoTexto('texto_link', 'Texto do link', { meta: { width: 'half' } }),
    ],
  },
  {
    collection: 'juridico_plantoes',
    meta: { icon: 'event_available', sort: 6, display_template: '{{titulo}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Horários Jurídico', singular: 'Horário', plural: 'Horários' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('local', 'Local', { obrigatorio: true }),
      campoTexto('horario', 'Horário', { obrigatorio: true }),
      campoTexto('observacao', 'Observação', { interface: 'input-multiline' }),
    ],
  },
  {
    collection: 'juridico_faq',
    meta: { icon: 'help', sort: 7, display_template: '{{pergunta}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Perguntas Jurídico', singular: 'Pergunta', plural: 'Perguntas' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('pergunta', 'Pergunta', { obrigatorio: true }),
      campoTexto('resposta', 'Resposta', { interface: 'input-multiline', obrigatorio: true }),
    ],
  },
  {
    collection: 'configuracoes',
    meta: { icon: 'settings', hidden: true, singleton: true, translations: [{ language: 'pt-BR', translation: 'Configurações do site', singular: 'Configurações', plural: 'Configurações' }] },
    schema: {},
    fields: [
      campoTexto('telefone', 'Telefone'),
      campoTexto('whatsapp', 'WhatsApp (só números, com DDD)'),
      campoTexto('email', 'E-mail'),
      campoTexto('endereco', 'Endereço', { interface: 'input-multiline' }),
      campoTexto('instagram_url', 'URL do Instagram'),
      campoTexto('youtube_url', 'URL do canal no YouTube'),
      campoTexto('youtube_channel_id', 'ID do canal (opcional)', { nota: 'Preencha só se o site não detectar o canal sozinho (formato UC...).' }),
    ],
  },
  {
    collection: 'inscricoes_newsletter',
    meta: { icon: 'mail', display_template: '{{email}}', translations: [{ language: 'pt-BR', translation: 'Inscrições na newsletter', singular: 'Inscrição', plural: 'Inscrições' }] },
    schema: {},
    fields: [campoTexto('email', 'E-mail', { obrigatorio: true }), campoDataCriacao()],
  },
  {
    collection: 'mensagens_contato',
    meta: { icon: 'forum', display_template: '{{nome}}', translations: [{ language: 'pt-BR', translation: 'Mensagens de contato', singular: 'Mensagem', plural: 'Mensagens' }] },
    schema: {},
    fields: [
      campoTexto('nome', 'Nome', { obrigatorio: true }),
      campoTexto('email', 'E-mail', { obrigatorio: true }),
      campoTexto('mensagem', 'Mensagem', { interface: 'input-multiline', obrigatorio: true }),
      campoDataCriacao(),
    ],
  },
];

const LEITURA_PUBLICA = {
  posts: {
    fields: ['id', 'status', 'titulo', 'slug', 'resumo', 'conteudo', 'imagem', 'imagem_alt', 'imagem_legenda', 'imagem_credito', 'categoria', 'galeria', 'fonte_nome', 'fonte_url', 'empresa', 'cidade', 'data_fato', 'youtube_url', 'fixado_banner', 'publicado_em', 'agendado_para', 'date_created', 'date_updated'],
    permissions: { status: { _eq: 'published' }, _or: [{ publicado_em: { _null: true } }, { publicado_em: { _lte: '$NOW' } }] },
  },
  posts_galeria: {
    fields: ['id', 'post', 'ordem', 'imagem', 'texto_alternativo', 'legenda', 'credito'],
    permissions: { post: { status: { _eq: 'published' }, _or: [{ publicado_em: { _null: true } }, { publicado_em: { _lte: '$NOW' } }] } },
  },
  categorias: { fields: ['id', 'nome', 'slug'], permissions: {} },
  avisos: { fields: ['id', 'status', 'titulo', 'mensagem_curta', 'urgente', 'data_inicio', 'data_fim', 'link', 'texto_link'], permissions: { status: { _eq: 'published' } } },
  proximos_videos: { fields: ['id', 'status', 'titulo', 'descricao', 'data_estreia', 'imagem'], permissions: { status: { _eq: 'published' } } },
  diretores: {
    fields: ['id', 'status', 'nome', 'cargo', 'grupo', 'foto', 'descricao', 'mandato_inicio', 'mandato_fim', 'ordem'],
    permissions: { status: { _eq: 'published' } },
  },
  cards_instagram: { fields: ['id', 'imagem', 'legenda', 'link', 'visualizacoes', 'curtidas', 'comentarios', 'compartilhamentos'], permissions: {} },
  paginas: { fields: ['id', 'titulo', 'slug', 'conteudo'], permissions: { slug: { _in: ['filie-se'] } } },
  pagina_beneficios: { fields: ['hero_rotulo', 'hero_titulo', 'hero_resumo', 'introducao_titulo', 'introducao_texto', 'aviso_titulo', 'aviso_texto', 'cta_titulo', 'cta_texto', 'cta_link_texto', 'cta_link_href'], permissions: {} },
  beneficios: { fields: ['id', 'status', 'ordem', 'titulo', 'categoria', 'resumo', 'detalhes', 'elegibilidade', 'como_usar', 'requisitos', 'validade_inicio', 'validade_fim', 'cta_texto', 'cta_url', 'imagem', 'imagem_alt', 'destaque', 'date_updated'], permissions: { status: { _eq: 'published' }, _or: [{ validade_fim: { _null: true } }, { validade_fim: { _gte: '$NOW' } }] } },
  pagina_juridico: { fields: ['hero_rotulo', 'hero_titulo', 'hero_resumo', 'hero_cta_primario_texto', 'hero_cta_primario_href', 'hero_cta_secundario_texto', 'hero_cta_secundario_href', 'direitos_rotulo', 'direitos_titulo', 'agendamento_rotulo', 'agendamento_titulo', 'agendamento_texto', 'plantao_titulo', 'chamado_titulo', 'chamado_resumo', 'chamado_prazo_texto', 'chamado_privacidade_texto', 'chamado_exigir_cpf', 'chamado_exigir_anexo', 'faq_rotulo', 'faq_titulo', 'cta_rotulo', 'cta_titulo', 'cta_link_texto', 'cta_link_href', 'seo_descricao'], permissions: {} },
  juridico_direitos: { fields: ['id', 'status', 'ordem', 'titulo', 'sigla', 'descricao', 'cor', 'destaque', 'urgente', 'texto_link'], permissions: { status: { _eq: 'published' } } },
  juridico_plantoes: { fields: ['id', 'status', 'ordem', 'titulo', 'local', 'horario', 'observacao'], permissions: { status: { _eq: 'published' } } },
  juridico_faq: { fields: ['id', 'status', 'ordem', 'pergunta', 'resposta'], permissions: { status: { _eq: 'published' } } },
  configuracoes: { fields: ['telefone', 'whatsapp', 'email', 'endereco', 'instagram_url', 'youtube_url', 'youtube_channel_id'], permissions: {} },
};

async function garantirCampo(collection, campo) {
  try {
    await api('GET', `/fields/${collection}/${campo.field}`);
    const atualizacao = { meta: campo.meta };
    if (campo.field !== 'id' && campo.schema && Object.keys(campo.schema).length > 0) {
      atualizacao.schema = campo.schema;
    }
    await api('PATCH', `/fields/${collection}/${campo.field}`, atualizacao);
    console.log(`OK   campo ${collection}.${campo.field} (metadados atualizados)`);
    return;
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;
  }
  await api('POST', `/fields/${collection}`, campo);
  console.log(`OK   campo ${collection}.${campo.field}`);
}

async function garantirColecao(def) {
  const { relacoes, fields, ...payload } = def;
  let criada = false;
  try {
    await api('GET', `/collections/${def.collection}`);
    await api('PATCH', `/collections/${def.collection}`, { meta: def.meta });
    console.log(`OK   coleção ${def.collection} (metadados atualizados)`);
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;
    await api('POST', '/collections', { ...payload, fields });
    criada = true;
    console.log(`OK   coleção ${def.collection}`);
  }

  if (!criada) {
    for (const campo of fields ?? []) {
      await garantirCampo(def.collection, campo);
    }
  }

  for (const relacao of relacoes ?? []) {
    try {
      await api('GET', `/relations/${def.collection}/${relacao.field}`);
      await api('PATCH', `/relations/${def.collection}/${relacao.field}`, {
        schema: { on_delete: 'SET NULL', ...(relacao.schema ?? {}) },
        meta: relacao.meta,
      });
      console.log(`OK   relação ${def.collection}.${relacao.field} (reconciliada)`);
    } catch (erro) {
      if (erro.status !== 403 && erro.status !== 404) throw erro;
      await api('POST', '/relations', {
        collection: def.collection,
        field: relacao.field,
        related_collection: relacao.related_collection,
        schema: { on_delete: 'SET NULL', ...(relacao.schema ?? {}) },
        meta: relacao.meta,
      });
      console.log(`OK   relação ${def.collection}.${relacao.field}`);
    }
  }
}

async function acharPoliticaPublica() {
  const politicas = await api('GET', '/policies?limit=-1&fields=id,name');
  const publica = politicas.find((p) => /public/i.test(p.name ?? ''));
  if (!publica) throw new Error('política pública não encontrada');
  return publica.id;
}

async function garantirPermissao(politica, collection, action, configuracao = {}) {
  const existentes = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${politica}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
  );
  const payload = {
    policy: politica,
    collection,
    action,
    permissions: configuracao.permissions ?? {},
    validation: configuracao.validation ?? {},
    presets: configuracao.presets ?? null,
    fields: configuracao.fields ?? ['*'],
  };
  if (existentes.length > 0) {
    for (const permissao of existentes) await api('PATCH', `/permissions/${permissao.id}`, payload);
    console.log(`OK   permissão ${collection}.${action} (reconciliada)`);
    return;
  }
  await api('POST', '/permissions', payload);
  console.log(`OK   permissão ${collection}.${action}`);
}

async function reconciliarMatrizPermissoes(politica, permitidas, rotulo) {
  const existentes = await api('GET', `/permissions?filter[policy][_eq]=${politica}&limit=-1&fields=id,collection,action`);
  for (const permissao of existentes) {
    const chave = `${permissao.collection}:${permissao.action}`;
    if (permitidas.has(chave)) continue;
    await api('DELETE', `/permissions/${permissao.id}`);
    console.log(`OK   permissão obsoleta removida de ${rotulo}: ${chave}`);
  }
}

async function garantirPasta(nome) {
  const existentes = await api('GET', `/folders?filter[name][_eq]=${encodeURIComponent(nome)}&filter[parent][_null]=true&limit=1`);
  if (existentes[0]) return existentes[0];
  return api('POST', '/folders', { name: nome, parent: null });
}

async function garantirRoleEditor(pastaPublicaId) {
  const politicas = await api('GET', `/policies?filter[name][_eq]=${encodeURIComponent('Portal — edição de conteúdo')}&limit=1&fields=id,name`);
  const politica = politicas[0] ?? await api('POST', '/policies', {
    name: 'Portal — edição de conteúdo', app_access: true, admin_access: false, icon: 'edit_note',
  });

  const camposPost = ['id', 'essencial', 'complementos', 'publicacao', 'status', 'titulo', 'slug', 'resumo', 'conteudo', 'imagem', 'imagem_alt', 'imagem_legenda', 'imagem_credito', 'categoria', 'galeria', 'fonte_nome', 'fonte_url', 'empresa', 'cidade', 'data_fato', 'youtube_url', 'publicado_em', 'agendado_para', 'fixado_banner'];
  const camposPostLeitura = [...camposPost, 'date_created', 'date_updated'];
  const validacaoPost = { _or: [
    { status: { _neq: 'published' } },
    { _and: [{ titulo: { _nnull: true } }, { conteudo: { _nnull: true } }, { imagem: { _nnull: true } }, { imagem_alt: { _nnull: true } }] },
  ] };
  for (const acao of ['create', 'read', 'update']) {
    await garantirPermissao(politica.id, 'posts', acao, { fields: acao === 'read' ? camposPostLeitura : camposPost, validation: acao === 'read' ? {} : validacaoPost, presets: acao === 'create' ? { status: 'draft' } : null });
    await garantirPermissao(politica.id, 'posts_galeria', acao, { fields: ['id', 'post', 'ordem', 'imagem', 'texto_alternativo', 'legenda', 'credito'] });
  }
  await garantirPermissao(politica.id, 'posts_galeria', 'delete', {
    fields: ['id'],
    permissions: {},
  });
  await garantirPermissao(politica.id, 'categorias', 'read', { fields: ['id', 'nome', 'slug'] });
  for (const colecao of ['avisos', 'proximos_videos', 'diretores', 'cards_instagram', 'paginas', 'pagina_beneficios', 'beneficios', 'pagina_juridico', 'juridico_direitos', 'juridico_plantoes', 'juridico_faq', 'configuracoes']) {
    const grupos = colecao === 'pagina_juridico'
      ? ['juridico_apresentacao', 'juridico_triagem', 'juridico_secoes', 'juridico_busca']
      : colecao === 'diretores'
        ? ['diretoria_identificacao', 'diretoria_complementos', 'diretoria_publicacao', 'fonte_nome', 'fonte_url']
        : [];
    const campos = [...grupos, ...(LEITURA_PUBLICA[colecao]?.fields ?? ['*'])];
    for (const acao of ['create', 'read', 'update']) await garantirPermissao(politica.id, colecao, acao, { fields: campos, presets: acao === 'create' && !colecao.startsWith('pagina_') ? { status: 'draft' } : null });
  }
  const camposArquivoEditor = [
    'id', 'title', 'description', 'type', 'filename_download', 'folder',
    'width', 'height', 'filesize',
  ];
  const somentePastaPublica = { folder: { _eq: pastaPublicaId } };
  const imagemPublicaValida = { _and: [
    somentePastaPublica,
    { type: { _in: ['image/jpeg', 'image/png', 'image/webp'] } },
    { filesize: { _lte: 20971520 } },
  ] };
  await garantirPermissao(politica.id, 'directus_files', 'create', {
    fields: [...camposArquivoEditor, 'storage'],
    // Em criação não existe um registro anterior para filtrar. A pasta é
    // imposta pelo preset e conferida pela validação abaixo.
    permissions: {},
    validation: imagemPublicaValida,
    presets: { folder: pastaPublicaId },
  });
  await garantirPermissao(politica.id, 'directus_files', 'read', {
    fields: [...camposArquivoEditor, 'modified_on', 'uploaded_on'],
    permissions: somentePastaPublica,
  });
  await garantirPermissao(politica.id, 'directus_files', 'update', {
    fields: camposArquivoEditor,
    permissions: somentePastaPublica,
    validation: somentePastaPublica,
  });
  await garantirPermissao(politica.id, 'directus_folders', 'read', { fields: ['id', 'name', 'parent'], permissions: { id: { _eq: pastaPublicaId } } });

  const colecoesConteudo = ['posts', 'posts_galeria', 'avisos', 'proximos_videos', 'diretores', 'cards_instagram', 'paginas', 'pagina_beneficios', 'beneficios', 'pagina_juridico', 'juridico_direitos', 'juridico_plantoes', 'juridico_faq', 'configuracoes'];
  const permitidasEditor = new Set([
    ...colecoesConteudo.flatMap((colecao) => ['create', 'read', 'update'].map((acao) => `${colecao}:${acao}`)),
    'posts_galeria:delete',
    'categorias:read',
    'directus_files:create', 'directus_files:read', 'directus_files:update',
    'directus_folders:read',
  ]);
  await reconciliarMatrizPermissoes(politica.id, permitidasEditor, 'Editor');

  const roles = await api('GET', "/roles?filter[name][_eq]=Editor&fields=id,name");
  const payloadRole = { name: 'Editor', icon: 'edit_note', description: 'Cria e atualiza conteúdo público sem acessar chamados, usuários, segredos ou exclusões.', policies: [{ policy: politica.id }] };
  if (roles[0]) await api('PATCH', `/roles/${roles[0].id}`, payloadRole);
  else await api('POST', '/roles', payloadRole);
  console.log('OK   role Editor com menor privilégio');
}

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) {
    console.error(`Falha no login (${login.status}). Confira as credenciais.`);
    process.exit(1);
  }
  token = (await login.json()).data.access_token;

  await api('PATCH', '/settings', {
    project_name: 'Portal Sindquim',
    project_descriptor: 'Notícias, Benefícios e Jurídico',
    project_color: '#d31a1f',
    default_language: 'pt-BR',
  });
  console.log('OK   identidade do painel Directus');

  for (const def of COLECOES) {
    await garantirColecao(def);
  }

  const pastaPublica = await garantirPasta('Portal — mídia pública');
  const pastaJuridica = await garantirPasta('Portal — anexos jurídicos privados');
  console.log(`OK   pastas públicas/privadas (${pastaPublica.id}, ${pastaJuridica.id})`);

  // A pessoa envia ou escolhe a foto dentro da própria notícia. O arquivo ainda
  // é guardado pelo Directus na pasta pública, sem exigir uma etapa separada.
  for (const [colecao, campo] of [['posts', 'imagem'], ['posts_galeria', 'imagem']]) {
    await api('PATCH', `/fields/${colecao}/${campo}`, {
      meta: { options: { folder: pastaPublica.id } },
    });
  }
  console.log('OK   upload de imagens configurado dentro do formulário editorial');

  const politicaPublica = await acharPoliticaPublica();
  for (const [colecao, configuracao] of Object.entries(LEITURA_PUBLICA)) {
    await garantirPermissao(politicaPublica, colecao, 'read', configuracao);
  }
  await garantirPermissao(politicaPublica, 'directus_files', 'read', {
    fields: ['id', 'title', 'description', 'type', 'width', 'height', 'filesize', 'folder', 'modified_on'],
    permissions: { folder: { _eq: pastaPublica.id } },
  });
  const permitidasPublicas = new Set([
    ...Object.keys(LEITURA_PUBLICA).map((colecao) => `${colecao}:read`),
    // Criada e mantida por setup-configuracoes.mjs. É preservada aqui,
    // mas não é criada nesta etapa para que o schema funcione do zero.
    'configuracoes_globais:read',
    'directus_files:read',
  ]);
  await reconciliarMatrizPermissoes(politicaPublica, permitidasPublicas, 'Público');

  try {
    await garantirRoleEditor(pastaPublica.id);
  } catch (erro) {
    console.warn(`AVISO: não consegui criar a role Editor automaticamente (${erro.message}).`);
    console.warn('Crie no painel: Configurações → Funções e políticas.');
  }

  console.log('\nSchema pronto.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
