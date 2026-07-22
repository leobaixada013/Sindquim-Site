/** Testes destrutivos apenas sobre registros temporários identificados por prefixo. */

const BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8155';
const SITE = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4421';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;
const TOKEN_FORMS = process.env.DIRECTUS_FORMS_TOKEN;
const TOKEN_JURIDICO = process.env.DIRECTUS_JURIDICO_TOKEN;
const PREFIXO = `[TESTE AUTOMATIZADO ${Date.now()}]`;
const TOKEN_EDITOR = `teste-editor-${crypto.randomUUID()}-${crypto.randomUUID()}`;
let adminToken = '';
const limpar = { posts: [], diretores: [], users: [], mensagens_contato: [], inscricoes_newsletter: [], chamados_juridicos: [] };

if (!EMAIL || !SENHA || !TOKEN_FORMS || !TOKEN_JURIDICO) {
  throw new Error('Defina credenciais administrativas e tokens técnicos para o teste de integração.');
}

async function requisitar(metodo, caminho, { token, corpo, status } = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  if (status !== undefined) {
    const aceitos = Array.isArray(status) ? status : [status];
    if (!aceitos.includes(resposta.status)) throw new Error(`${metodo} ${caminho}: esperado ${aceitos.join(' ou ')}, recebido ${resposta.status}`);
    return json.data;
  }
  if (!resposta.ok) throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`);
  return json.data;
}

async function limparTemporarios() {
  if (!adminToken) return;
  for (const [colecao, ids] of Object.entries(limpar)) {
    const caminho = colecao === 'users' ? 'users' : `items/${colecao}`;
    for (const id of ids.reverse()) {
      await requisitar('DELETE', `/${caminho}/${id}`, { token: adminToken }).catch(() => null);
    }
  }
}

async function idCriado(colecao, campo, valor) {
  const itens = await requisitar('GET', `/items/${colecao}?filter[${campo}][_eq]=${encodeURIComponent(valor)}&limit=1&fields=id`, { token: adminToken });
  if (!itens[0]?.id) throw new Error(`Registro temporário não encontrado em ${colecao}.`);
  return itens[0].id;
}

async function principal() {
  const login = await requisitar('POST', '/auth/login', { corpo: { email: EMAIL, password: SENHA } });
  adminToken = login.access_token;

  const health = await fetch(`${SITE}/api/health`);
  if (!health.ok || !(await health.json()).directus) throw new Error('Healthcheck integrado do site falhou.');

  const postsPublicos = await requisitar('GET', '/items/posts?filter[status][_eq]=published&limit=1');
  if (!postsPublicos.length) throw new Error('Nenhuma notícia pública encontrada.');
  await requisitar('POST', '/items/mensagens_contato', {
    corpo: { nome: PREFIXO, email: 'teste@example.com', mensagem: 'Deve ser negado.' }, status: 403,
  });
  await requisitar('POST', '/items/chamados_juridicos', {
    corpo: { nome: PREFIXO, email: 'teste@example.com', telefone: '11999999999', tipo: 'Dúvida Geral', descricao: 'Deve ser negado.' }, status: 403,
  });

  await requisitar('POST', '/items/mensagens_contato', {
    token: TOKEN_FORMS,
    corpo: { nome: PREFIXO, email: 'teste@example.com', mensagem: 'Registro técnico temporário.' },
  });
  limpar.mensagens_contato.push(await idCriado('mensagens_contato', 'nome', PREFIXO));
  const emailNewsletter = `teste-${Date.now()}@example.com`;
  await requisitar('POST', '/items/inscricoes_newsletter', {
    token: TOKEN_FORMS,
    corpo: { email: emailNewsletter },
  });
  limpar.inscricoes_newsletter.push(await idCriado('inscricoes_newsletter', 'email', emailNewsletter));
  await requisitar('POST', '/items/chamados_juridicos', {
    token: TOKEN_JURIDICO,
    corpo: {
      nome: PREFIXO,
      cpf: null,
      email: 'teste@example.com',
      telefone: '11999999999',
      tipo: 'Dúvida Geral',
      descricao: 'Registro fictício criado pelo teste automatizado de integração.',
      anexo: null,
      aviso_privacidade_versao: 'teste',
      consentimento_em: new Date().toISOString(),
      retencao_ate: new Date(Date.now() + 86_400_000).toISOString(),
    },
  });
  limpar.chamados_juridicos.push(await idCriado('chamados_juridicos', 'nome', PREFIXO));

  const roles = await requisitar('GET', `/roles?filter[name][_eq]=Editor&limit=1&fields=id`, { token: adminToken });
  if (!roles[0]) throw new Error('Role Editor não encontrada.');
  const usuario = await requisitar('POST', '/users', {
    token: adminToken,
    corpo: {
      email: `teste-editor-${Date.now()}@example.com`,
      first_name: 'Teste automatizado',
      status: 'active',
      role: roles[0].id,
      token: TOKEN_EDITOR,
    },
  });
  limpar.users.push(usuario.id);

  const arquivos = await requisitar('GET', `/files?filter[title][_contains]=capa%20editorial%20local&limit=1&fields=id`, { token: adminToken });
  if (!arquivos[0]) throw new Error('Capa de demonstração não encontrada.');

  await requisitar('POST', '/items/posts', {
    token: TOKEN_EDITOR,
    corpo: { status: 'published', titulo: `${PREFIXO} publicação inválida`, conteudo: '<p>Sem capa.</p>' },
    status: [400, 403],
  });
  const post = await requisitar('POST', '/items/posts', {
    token: TOKEN_EDITOR,
    corpo: {
      status: 'draft', titulo: `${PREFIXO} rascunho editorial`, conteudo: '<p>Conteúdo temporário.</p>',
      imagem: arquivos[0].id, imagem_alt: 'Imagem de demonstração usada pelo teste automatizado.',
      fonte_nome: 'SINDQUIM', fonte_url: null,
    },
  });
  limpar.posts.push(post.id);
  if (!post.slug?.startsWith('teste-automatizado')) throw new Error('Slug automático da extensão não foi aplicado.');
  const publicado = await requisitar('PATCH', `/items/posts/${post.id}`, {
    token: TOKEN_EDITOR,
    corpo: { status: 'published' },
  });
  if (publicado.status !== 'published' || !publicado.publicado_em) throw new Error('Publicação editorial não registrou data.');
  const camposPainel = [
    'id', 'status', 'titulo', 'slug', 'resumo', 'conteudo', 'imagem', 'imagem_alt',
    'imagem_legenda', 'imagem_credito', 'fonte_nome', 'fonte_url', 'empresa', 'cidade',
    'data_fato', 'youtube_url', 'fixado_banner', 'publicado_em', 'agendado_para',
    'date_created', 'date_updated', 'categoria.id', 'categoria.nome', 'categoria.slug',
    'galeria.id', 'galeria.post', 'galeria.ordem', 'galeria.imagem',
    'galeria.texto_alternativo', 'galeria.legenda', 'galeria.credito',
  ].join(',');
  const leituraPainel = await requisitar(
    'GET',
    `/items/posts/${post.id}?fields=${encodeURIComponent(camposPainel)}`,
    { token: TOKEN_EDITOR },
  );
  if (!leituraPainel.date_created || !leituraPainel.date_updated) {
    throw new Error('Editor não conseguiu ler as datas necessárias para a lista de notícias.');
  }
  await requisitar('DELETE', `/items/posts/${post.id}`, { token: TOKEN_EDITOR, status: 403 });

  const nomeDiretor = `${PREFIXO} integrante da diretoria`;
  const diretor = await requisitar('POST', '/items/diretores', {
    token: TOKEN_EDITOR,
    corpo: {
      status: 'draft',
      nome: nomeDiretor,
      cargo: 'Cargo temporário',
      grupo: 'diretoria-executiva',
      ordem: 999,
    },
  });
  limpar.diretores.push(diretor.id);
  const diretorOculto = await requisitar('GET', `/items/diretores?filter[nome][_eq]=${encodeURIComponent(nomeDiretor)}&limit=1`);
  if (diretorOculto.length !== 0) throw new Error('Integrante em rascunho ficou visível publicamente.');
  await requisitar('PATCH', `/items/diretores/${diretor.id}`, {
    token: TOKEN_EDITOR,
    corpo: { status: 'published' },
  });
  const diretorPublicado = await requisitar('GET', `/items/diretores?filter[nome][_eq]=${encodeURIComponent(nomeDiretor)}&limit=1`);
  if (diretorPublicado.length !== 1) throw new Error('Integrante publicado não apareceu para leitura pública.');
  await requisitar('DELETE', `/items/diretores/${diretor.id}`, { token: TOKEN_EDITOR, status: 403 });

  await requisitar('GET', '/items/documentos', { status: 403 });
  console.log('Integração aprovada: público, serviços técnicos, notícias, diretoria, Editor e negações de segurança.');
}

principal()
  .catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  })
  .finally(limparTemporarios);
