/**
 * Cria o schema social no Directus local.
 *
 * O script é idempotente: se a role, a política, a coleção, os campos ou as
 * permissões já existirem, ele atualiza metadados quando seguro e segue adiante.
 *
 * Uso recomendado, com o Directus local já rodando em http://localhost:8055:
 *   node scripts/setup-directus-social.mjs
 *
 * Variáveis lidas:
 *   DIRECTUS_URL                 opcional; padrão: http://localhost:8055
 *   DIRECTUS_ADMIN_EMAIL         obrigatório; também pode vir de deploy/.env
 *   DIRECTUS_ADMIN_PASSWORD      obrigatório; também pode vir de deploy/.env
 *
 * O carregamento de ambiente é simples e cobre .env na raiz e deploy/.env.
 * Variáveis já definidas no terminal têm prioridade sobre os arquivos.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

carregarEnvSeExistir(path.join(REPO_ROOT, '.env'));
carregarEnvSeExistir(path.join(REPO_ROOT, 'deploy', '.env'));

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD em .env, deploy/.env ou no ambiente.');
  process.exit(1);
}

let token = '';

function carregarEnvSeExistir(caminho) {
  if (!existsSync(caminho)) return;

  for (const linhaOriginal of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const linha = linhaOriginal.trim();
    if (!linha || linha.startsWith('#')) continue;

    const indiceIgual = linha.indexOf('=');
    if (indiceIgual === -1) continue;

    const chave = linha.slice(0, indiceIgual).trim();
    let valor = linha.slice(indiceIgual + 1).trim();

    if (!chave || process.env[chave] !== undefined) continue;

    if (
      (valor.startsWith('"') && valor.endsWith('"'))
      || (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }

    process.env[chave] = valor;
  }
}

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
      `${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 400)}`,
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
    schema: {
      is_nullable: !opcoes.obrigatorio,
      ...(opcoes.schema ?? {}),
    },
    meta: {
      interface: opcoes.interface ?? 'input',
      width: opcoes.width,
      options: opcoes.options ?? {},
      required: Boolean(opcoes.obrigatorio),
      note: opcoes.nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
      ...(opcoes.meta ?? {}),
    },
  };
}

function campoArquivo(nome, rotulo) {
  return {
    field: nome,
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      interface: 'file-image',
      special: ['file'],
      display: 'image',
      translations: [{ language: 'pt-BR', translation: rotulo }],
      note: 'Imagem ou vídeo usado no post social.',
    },
  };
}

function campoStatusSocial() {
  return {
    field: 'status',
    type: 'string',
    schema: { default_value: 'rascunho', is_nullable: false },
    meta: {
      interface: 'select-dropdown',
      width: 'half',
      required: true,
      translations: [{ language: 'pt-BR', translation: 'Status' }],
      options: {
        choices: [
          { text: 'Rascunho', value: 'rascunho', color: 'var(--theme--foreground-subdued)' },
          { text: 'Agendado', value: 'agendado', color: 'var(--theme--warning)' },
          { text: 'Publicado', value: 'publicado', color: 'var(--theme--primary)' },
        ],
      },
    },
  };
}

function campoDataPublicacao() {
  return {
    field: 'data_publicacao',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      width: 'half',
      translations: [{ language: 'pt-BR', translation: 'Data de publicação' }],
      note: 'Use para agendar ou registrar quando o post foi publicado.',
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

const POSTS_SOCIAIS = {
  collection: 'posts_sociais',
  meta: {
    icon: 'share',
    display_template: '{{legenda}}',
    translations: [
      {
        language: 'pt-BR',
        translation: 'Posts sociais',
        singular: 'Post social',
        plural: 'Posts sociais',
      },
    ],
  },
  schema: {},
  fields: [
    {
      field: 'id',
      type: 'integer',
      schema: { is_primary_key: true, has_auto_increment: true },
      meta: { hidden: true, readonly: true },
    },
    campoTexto('legenda', 'Legenda', {
      tipo: 'text',
      interface: 'input-multiline',
      obrigatorio: true,
      nota: 'Texto principal que será usado na postagem das redes sociais.',
    }),
    campoArquivo('midia', 'Mídia'),
    campoStatusSocial(),
    campoDataPublicacao(),
    campoTexto('link_original', 'Link original', {
      width: 'full',
      nota: 'URL do post publicado, referência externa ou material original.',
      options: { placeholder: 'https://...' },
    }),
    campoMetrica('visualizacoes', 'Visualizações', 'Total de visualizações registradas na rede social.'),
    campoMetrica('curtidas', 'Curtidas', 'Total de curtidas registradas na rede social.'),
    campoMetrica('comentarios', 'Comentários', 'Total de comentários registrados na rede social.'),
    campoMetrica('compartilhamentos', 'Compartilhamentos', 'Total de compartilhamentos ou interações equivalentes.'),
    campoUltimaSincronizacaoMetricas(),
  ],
};

async function loginAdmin() {
  const resposta = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });

  if (!resposta.ok) {
    console.error(`Falha no login (${resposta.status}). Confira DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.`);
    process.exit(1);
  }

  token = (await resposta.json()).data.access_token;
}

async function garantirColecao(definicao) {
  const { fields, ...payload } = definicao;

  try {
    await api('GET', `/collections/${definicao.collection}`);
    await api('PATCH', `/collections/${definicao.collection}`, { meta: definicao.meta });
    console.log(`OK   coleção ${definicao.collection} (metadados atualizados)`);
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;

    await api('POST', '/collections', { ...payload, fields });
    console.log(`OK   coleção ${definicao.collection}`);
    return;
  }

  for (const campo of fields) {
    await garantirCampo(definicao.collection, campo);
  }
}

async function garantirCampo(collection, campo) {
  try {
    await api('GET', `/fields/${collection}/${campo.field}`);
    await api('PATCH', `/fields/${collection}/${campo.field}`, { meta: campo.meta });
    console.log(`OK   campo ${collection}.${campo.field} (metadados atualizados)`);
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;

    await api('POST', `/fields/${collection}`, campo);
    console.log(`OK   campo ${collection}.${campo.field}`);
  }
}

async function buscarPrimeiro(caminho) {
  const itens = await api('GET', caminho);
  return itens[0] ?? null;
}

async function garantirPoliticaSocialMedia() {
  const nome = 'Social Media';
  const filtro = encodeURIComponent(nome);
  const existente = await buscarPrimeiro(`/policies?filter[name][_eq]=${filtro}&fields=id,name,app_access,admin_access`);

  if (existente) {
    await api('PATCH', `/policies/${existente.id}`, {
      app_access: true,
      admin_access: false,
      icon: 'share',
    });
    console.log('OK   política Social Media (metadados atualizados)');
    return existente;
  }

  const politica = await api('POST', '/policies', {
    name: nome,
    app_access: true,
    admin_access: false,
    icon: 'share',
  });
  console.log('OK   política Social Media');
  return politica;
}

async function garantirRoleSocialMedia(politica) {
  const nome = 'Social Media';
  const filtro = encodeURIComponent(nome);
  const existente = await buscarPrimeiro(`/roles?filter[name][_eq]=${filtro}&fields=id,name,policies.policy`);

  if (existente) {
    const jaVinculada = (existente.policies ?? []).some((relacao) => {
      const valor = relacao.policy;
      return valor === politica.id || valor?.id === politica.id;
    });

    if (!jaVinculada) {
      await api('PATCH', `/roles/${existente.id}`, {
        policies: [{ policy: politica.id }],
      });
    }

    console.log('OK   role Social Media (conferida)');
    return existente;
  }

  const role = await api('POST', '/roles', {
    name: nome,
    icon: 'campaign',
    description: 'Equipe responsável por preparar, agendar e publicar conteúdo das redes sociais.',
    policies: [{ policy: politica.id }],
  });
  console.log('OK   role Social Media');
  return role;
}

async function garantirPermissao(politica, collection, action, fields = ['*']) {
  const existentes = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${politica.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id`,
  );

  const payload = {
    policy: politica.id,
    collection,
    action,
    permissions: {},
    validation: {},
    fields,
  };

  if (existentes.length > 0) {
    await api('PATCH', `/permissions/${existentes[0].id}`, payload);
    console.log(`OK   permissão ${collection}.${action} (atualizada)`);
    return;
  }

  await api('POST', '/permissions', payload);
  console.log(`OK   permissão ${collection}.${action}`);
}

async function removerPermissao(politica, collection, action) {
  const existentes = await api(
    'GET',
    `/permissions?filter[policy][_eq]=${politica.id}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&fields=id`,
  );
  for (const p of existentes) {
    await api('DELETE', `/permissions/${p.id}`);
    console.log(`OK   permissão ${collection}.${action} (removida)`);
  }
}

async function garantirPermissoesSocialMedia(politica) {
  for (const acao of ['create', 'read', 'update']) {
    await garantirPermissao(politica, 'posts_sociais', acao);
    await garantirPermissao(politica, 'posts', acao);
    await garantirPermissao(politica, 'proximos_videos', acao);
    await garantirPermissao(politica, 'cards_instagram', acao);
  }

  // Removemos a permissão de delete para forçar o arquivamento das matérias
  await removerPermissao(politica, 'posts', 'delete');
  await removerPermissao(politica, 'posts_sociais', 'delete');
  await removerPermissao(politica, 'proximos_videos', 'delete');
  await removerPermissao(politica, 'cards_instagram', 'delete');

  await garantirPermissao(politica, 'categorias', 'read');

  // Upload e gerenciamento básico da mídia usada no campo posts_sociais.midia.
  for (const acao of ['create', 'read', 'update', 'delete']) {
    await garantirPermissao(politica, 'directus_files', acao);
  }

  // Necessário para o seletor/upload de arquivos no Studio listar pastas.
  await garantirPermissao(politica, 'directus_folders', 'read');
}

async function garantirRelacao(collection, field, related_collection) {
  const payload = {
    collection,
    field,
    related_collection,
    schema: { on_delete: 'SET NULL' },
  };
  try {
    await api('POST', '/relations', payload);
    console.log(`OK   relação ${collection}.${field} -> ${related_collection}`);
  } catch (erro) {
    if (erro.status !== 400) throw erro; // 400 indica que provavelmente já existe
  }
}

async function garantirPresetCardsPostsSociais() {
  const collection = 'posts_sociais';
  const existente = await buscarPrimeiro(
    `/presets?filter[collection][_eq]=${collection}&filter[bookmark][_null]=true&filter[user][_null]=true&filter[role][_null]=true&fields=id,collection,layout,layout_options`,
  );

  const payload = {
    collection,
    bookmark: null,
    user: null,
    role: null,
    layout: 'cards',
    layout_options: {
      image_source: 'midia',
    },
    layout_query: {
      cards: {
        sort: ['-data_publicacao'],
      },
    },
    refresh_interval: null,
  };

  if (existente) {
    await api('PATCH', `/presets/${existente.id}`, payload);
    console.log('OK   preset posts_sociais em cards (atualizado)');
    return;
  }

  await api('POST', '/presets', payload);
  console.log('OK   preset posts_sociais em cards');
}

async function principal() {
  console.log(`Conectando ao Directus em ${URL_BASE}...`);
  await loginAdmin();
  console.log('OK   login de administrador');

  const politica = await garantirPoliticaSocialMedia();
  await garantirRoleSocialMedia(politica);
  await garantirColecao(POSTS_SOCIAIS);
  await garantirRelacao('posts_sociais', 'midia', 'directus_files');
  await garantirPresetCardsPostsSociais();
  await garantirPermissoesSocialMedia(politica);

  console.log('\nSchema social pronto.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
