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
    schema: { is_nullable: !opcoes.obrigatorio },
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
      translations: [{ language: 'pt-BR', translation: 'Situação' }],
      options: {
        choices: [
          { text: 'Publicado', value: 'published', color: 'var(--theme--primary)' },
          { text: 'Rascunho', value: 'draft', color: 'var(--theme--foreground-subdued)' },
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

function campoData(nome, rotulo, comHora = false) {
  return {
    field: nome,
    type: comHora ? 'timestamp' : 'date',
    schema: {},
    meta: {
      interface: 'datetime',
      width: 'half',
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoArquivo(nome, rotulo, imagem = true) {
  return {
    field: nome,
    type: 'uuid',
    schema: {},
    meta: {
      interface: imagem ? 'file-image' : 'file',
      special: ['file'],
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

const COLECOES = [
  {
    collection: 'categorias',
    meta: { icon: 'sell', translations: [{ language: 'pt-BR', translation: 'Categorias', singular: 'Categoria', plural: 'Categorias' }] },
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
      display_template: '{{titulo}}',
      archive_field: 'status', archive_value: 'archived', unarchive_value: 'draft',
      sort_field: null,
      translations: [{ language: 'pt-BR', translation: 'Notícias do blog', singular: 'Notícia', plural: 'Notícias' }],
    },
    schema: {},
    fields: [
      campoStatus(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('slug', 'Slug', { obrigatorio: true, nota: 'Endereço da notícia, ex.: assembleia-aprova-pauta' }),
      campoTexto('resumo', 'Resumo', { interface: 'input-multiline', nota: 'Aparece nos cards da home e nas buscas (2 a 3 frases).' }),
      campoWysiwyg('conteudo', 'Conteúdo'),
      campoArquivo('imagem', 'Imagem de destaque'),
      { field: 'categoria', type: 'integer', schema: {}, meta: { interface: 'select-dropdown-m2o', special: ['m2o'], width: 'half', display: 'related-values', display_options: { template: '{{nome}}' }, translations: [{ language: 'pt-BR', translation: 'Categoria' }] } },
      campoBooleano('fixado_banner', 'Fixar no banner', 'A notícia fixada mais recente vira o banner grande do topo da home.'),
      campoDataCriacao(),
    ],
    relacoes: [{ field: 'categoria', related_collection: 'categorias' }],
  },
  {
    collection: 'avisos',
    meta: { icon: 'campaign', display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Avisos', singular: 'Aviso', plural: 'Avisos' }] },
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
    meta: { icon: 'live_tv', display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Próximos vídeos', singular: 'Próximo vídeo', plural: 'Próximos vídeos' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('descricao', 'Descrição', { interface: 'input-multiline' }),
      campoData('data_estreia', 'Data e hora da estreia', true),
      campoArquivo('imagem', 'Imagem (opcional)'),
    ],
  },
  {
    collection: 'diretores',
    meta: { icon: 'groups', display_template: '{{nome}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Diretoria', singular: 'Diretor(a)', plural: 'Diretoria' }] },
    schema: {},
    fields: [
      campoTexto('nome', 'Nome', { obrigatorio: true }),
      campoTexto('cargo', 'Cargo'),
      campoArquivo('foto', 'Foto'),
      { field: 'ordem', type: 'integer', schema: {}, meta: { interface: 'input', hidden: true } },
    ],
  },
  {
    collection: 'documentos',
    meta: { icon: 'description', display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Documentos', singular: 'Documento', plural: 'Documentos' }] },
    schema: {},
    fields: [
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('tipo', 'Tipo', {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Convenção coletiva', value: 'convencao' },
            { text: 'Acordo coletivo', value: 'acordo' },
            { text: 'Ata', value: 'ata' },
            { text: 'Edital', value: 'edital' },
            { text: 'Outro', value: 'outro' },
          ],
        },
      }),
      { field: 'ano', type: 'integer', schema: {}, meta: { interface: 'input', width: 'half', translations: [{ language: 'pt-BR', translation: 'Ano' }] } },
      campoArquivo('arquivo', 'Arquivo (PDF)', false),
    ],
  },
  {
    collection: 'cards_instagram',
    meta: { icon: 'smart_display', display_template: '{{legenda}}', translations: [{ language: 'pt-BR', translation: 'Reels do Instagram', singular: 'Reel', plural: 'Reels' }] },
    schema: {},
    fields: [
      campoArquivo('imagem', 'Capa do Reel'),
      campoTexto('legenda', 'Título/legenda do Reel'),
      campoTexto('link', 'Link do Reel'),
    ],
  },
  {
    collection: 'paginas',
    meta: { icon: 'article', display_template: '{{titulo}}', translations: [{ language: 'pt-BR', translation: 'Páginas', singular: 'Página', plural: 'Páginas' }] },
    schema: {},
    fields: [
      campoTexto('titulo', 'Título', { obrigatorio: true }),
      campoTexto('slug', 'Slug', { obrigatorio: true, nota: 'Endereço da página, ex.: filie-se' }),
      campoWysiwyg('conteudo', 'Conteúdo'),
    ],
  },
  {
    collection: 'pagina_juridico',
    meta: { icon: 'gavel', singleton: true, translations: [{ language: 'pt-BR', translation: 'Página Jurídico', singular: 'Página Jurídico', plural: 'Página Jurídico' }] },
    schema: {},
    fields: [
      campoTexto('hero_rotulo', 'Rótulo do hero'),
      campoTexto('hero_titulo', 'Título do hero'),
      campoTexto('hero_resumo', 'Resumo do hero', { interface: 'input-multiline' }),
      campoTexto('hero_cta_primario_texto', 'Texto do botão principal', { meta: { width: 'half' } }),
      campoTexto('hero_cta_secundario_texto', 'Texto do botão secundário', { meta: { width: 'half' } }),
      campoTexto('direitos_rotulo', 'Rótulo da seção de direitos', { meta: { width: 'half' } }),
      campoTexto('direitos_titulo', 'Título da seção de direitos', { meta: { width: 'half' } }),
      campoTexto('agendamento_rotulo', 'Rótulo da seção de agendamento', { meta: { width: 'half' } }),
      campoTexto('agendamento_titulo', 'Título da seção de agendamento', { meta: { width: 'half' } }),
      campoTexto('agendamento_texto', 'Texto da seção de agendamento', { interface: 'input-multiline' }),
      campoTexto('plantao_titulo', 'Título do plantão'),
      campoTexto('faq_rotulo', 'Rótulo do FAQ', { meta: { width: 'half' } }),
      campoTexto('faq_titulo', 'Título do FAQ', { meta: { width: 'half' } }),
      campoTexto('cta_rotulo', 'Rótulo da chamada final', { meta: { width: 'half' } }),
      campoTexto('cta_titulo', 'Título da chamada final', { meta: { width: 'half' } }),
      campoTexto('cta_link_texto', 'Texto do link da chamada final', { meta: { width: 'half' } }),
      campoTexto('cta_link_href', 'URL do link da chamada final', { meta: { width: 'half' } }),
    ],
  },
  {
    collection: 'juridico_direitos',
    meta: { icon: 'balance', display_template: '{{titulo}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Jurídico: direitos', singular: 'Direito', plural: 'Direitos' }] },
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
    meta: { icon: 'event_available', display_template: '{{titulo}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Jurídico: plantões', singular: 'Plantão', plural: 'Plantões' }] },
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
    meta: { icon: 'help', display_template: '{{pergunta}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Jurídico: perguntas frequentes', singular: 'Pergunta', plural: 'Perguntas' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('pergunta', 'Pergunta', { obrigatorio: true }),
      campoTexto('resposta', 'Resposta', { interface: 'input-multiline', obrigatorio: true }),
    ],
  },
  {
    collection: 'juridico_campos_formulario',
    meta: { icon: 'dynamic_form', display_template: '{{rotulo}}', sort_field: 'ordem', translations: [{ language: 'pt-BR', translation: 'Jurídico: campos do formulário', singular: 'Campo do formulário', plural: 'Campos do formulário' }] },
    schema: {},
    fields: [
      campoStatus(),
      campoOrdem(),
      campoTexto('chave', 'Chave', { obrigatorio: true, nota: 'Use apenas letras minúsculas, números e underline. Ex.: telefone, matricula, natureza.' }),
      campoTexto('rotulo', 'Rótulo', { obrigatorio: true }),
      campoTexto('tipo', 'Tipo', {
        interface: 'select-dropdown',
        options: { choices: [
          { text: 'Texto', value: 'text' },
          { text: 'E-mail', value: 'email' },
          { text: 'Telefone', value: 'tel' },
          { text: 'Lista de opções', value: 'select' },
          { text: 'Texto longo', value: 'textarea' },
        ] },
        meta: { width: 'half' },
      }),
      campoBooleano('obrigatorio', 'Obrigatório', 'Se ativo, o formulário não envia sem este campo.'),
      campoTexto('placeholder', 'Placeholder'),
      campoTexto('opcoes', 'Opções', { interface: 'input-multiline', nota: 'Para campos de lista, coloque uma opção por linha.' }),
      { field: 'max_length', type: 'integer', schema: {}, meta: { interface: 'input', width: 'half', translations: [{ language: 'pt-BR', translation: 'Tamanho máximo' }] } },
    ],
  },
  {
    collection: 'configuracoes',
    meta: { icon: 'settings', singleton: true, translations: [{ language: 'pt-BR', translation: 'Configurações do site', singular: 'Configurações', plural: 'Configurações' }] },
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

const LEITURA_PUBLICA = [
  'posts', 'categorias', 'avisos', 'proximos_videos', 'diretores',
  'documentos', 'cards_instagram', 'paginas', 'pagina_juridico',
  'juridico_direitos', 'juridico_plantoes', 'juridico_faq',
  'juridico_campos_formulario', 'configuracoes', 'directus_files',
];

const CRIACAO_PUBLICA = {
  inscricoes_newsletter: ['email'],
  mensagens_contato: ['nome', 'email', 'mensagem'],
};

async function garantirCampo(collection, campo) {
  try {
    await api('GET', `/fields/${collection}/${campo.field}`);
    await api('PATCH', `/fields/${collection}/${campo.field}`, { meta: campo.meta });
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
      await api('POST', '/relations', {
        collection: def.collection,
        field: relacao.field,
        related_collection: relacao.related_collection,
        schema: { on_delete: 'SET NULL' },
      });
    } catch (erro) {
      if (erro.status !== 400) throw erro;
    }
  }
}

async function acharPoliticaPublica() {
  const politicas = await api('GET', '/policies?limit=-1&fields=id,name');
  const publica = politicas.find((p) => /public/i.test(p.name ?? ''));
  if (!publica) throw new Error('política pública não encontrada');
  return publica.id;
}

async function garantirPermissao(politica, collection, action, fields) {
  const existentes = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${politica}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}`,
  );
  if (existentes.length > 0) {
    console.log(`SKIP permissão ${collection}.${action}`);
    return;
  }
  await api('POST', '/permissions', {
    policy: politica,
    collection,
    action,
    permissions: {},
    validation: {},
    fields: fields ?? ['*'],
  });
  console.log(`OK   permissão ${collection}.${action}`);
}

async function garantirRoleEditor() {
  const roles = await api('GET', "/roles?filter[name][_eq]=Editor&fields=id,name,policies.policy");
  let politica = roles[0]?.policies?.[0]?.policy
    ? { id: roles[0].policies[0].policy }
    : null;

  if (!politica) {
    politica = await api('POST', '/policies', {
      name: 'Editores de conteúdo',
      app_access: true,
      admin_access: false,
      icon: 'edit',
    });
  }

  const acoes = ['create', 'read', 'update', 'delete'];
  const colecoesEditor = COLECOES.map((c) => c.collection);
  for (const colecao of colecoesEditor) {
    for (const acao of acoes) {
      await garantirPermissao(politica.id, colecao, acao);
    }
  }
  for (const acao of ['create', 'read', 'update']) {
    await garantirPermissao(politica.id, 'directus_files', acao);
  }
  await garantirPermissao(politica.id, 'directus_folders', 'read');

  if (roles.length > 0) {
    console.log('OK   role Editor (permissões conferidas)');
    return;
  }

  await api('POST', '/roles', {
    name: 'Editor',
    icon: 'edit_note',
    description: 'Publica notícias, avisos, vídeos e edita as páginas do site.',
    policies: [{ policy: politica.id }],
  });
  console.log('OK   role Editor + política de conteúdo');
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

  for (const def of COLECOES) {
    await garantirColecao(def);
  }

  const politicaPublica = await acharPoliticaPublica();
  for (const colecao of LEITURA_PUBLICA) {
    await garantirPermissao(politicaPublica, colecao, 'read');
  }
  for (const [colecao, campos] of Object.entries(CRIACAO_PUBLICA)) {
    await garantirPermissao(politicaPublica, colecao, 'create', campos);
  }

  try {
    await garantirRoleEditor();
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
