/**
 * Setup idempotente do módulo de Configurações Globais (white-label).
 *
 * Uso:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/setup-configuracoes.mjs
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

function lerTextoEnv(arquivo) {
  const buffer = readFileSync(arquivo);
  const utf16 = buffer.length > 2 && (buffer[0] === 0xff && buffer[1] === 0xfe || buffer.includes(0));
  return buffer.toString(utf16 ? 'utf16le' : 'utf8');
}

function carregarEnvLocal() {
  for (const arquivo of ['.env', 'site/.env']) {
    if (!existsSync(arquivo)) continue;
    const linhas = lerTextoEnv(arquivo).split(/\r?\n/);
    for (const linha of linhas) {
      const texto = linha.replace(/^﻿/, '').trim();
      if (!texto || texto.startsWith('#') || !texto.includes('=')) continue;
      const indice = texto.indexOf('=');
      const nome = texto.slice(0, indice).trim().replace(/^export\s+/, '');
      const valor = texto.slice(indice + 1).trim().replace(/^['\"]|['\"]$/g, '');
      if (nome && process.env[nome] === undefined) process.env[nome] = valor;
    }
  }
}

carregarEnvLocal();

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL ?? process.env.DIRECTUS_EMAIL ?? process.env.ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD ?? process.env.DIRECTUS_PASSWORD ?? process.env.ADMIN_PASSWORD;
const COLECAO = 'configuracoes_globais';
const CAMPOS_PUBLICOS = [
  'logo_site',
  'modulo_juridico_ativo',
  'modulo_youtube_ativo',
  'modulo_instagram_ativo',
  'youtube_channel_id',
];

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  process.exit(1);
}

const requireFromSite = createRequire(new URL('../site/package.json', import.meta.url));
const {
  authentication,
  createDirectus,
  customEndpoint,
  rest,
} = requireFromSite('@directus/sdk');

const cliente = createDirectus(URL_BASE).with(rest()).with(authentication());

function endpoint(metodo, caminho, corpo, params) {
  return customEndpoint({
    method: metodo,
    path: caminho,
    params,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

async function requisitar(metodo, caminho, corpo, params) {
  try {
    return await cliente.request(endpoint(metodo, caminho, corpo, params));
  } catch (erro) {
    const status = erro?.response?.status ?? erro?.status;
    const mensagem = JSON.stringify(erro?.errors ?? erro?.message ?? erro).slice(0, 400);
    const falha = new Error(`${metodo} ${caminho} → ${status ?? 'erro'}: ${mensagem}`);
    falha.status = status;
    throw falha;
  }
}

function campoTexto(nome, rotulo, opcoes = {}) {
  return {
    field: nome,
    type: opcoes.tipo ?? 'string',
    schema: { is_nullable: true },
    meta: {
      interface: opcoes.interface ?? 'input',
      width: opcoes.width ?? 'full',
      note: opcoes.nota,
      required: false,
      options: opcoes.options ?? {},
      translations: [{ language: 'pt-BR', translation: rotulo }],
      ...(opcoes.meta ?? {}),
    },
  };
}

function campoBooleano(nome, rotulo, padrao, nota) {
  return {
    field: nome,
    type: 'boolean',
    schema: { default_value: padrao, is_nullable: false },
    meta: {
      interface: 'boolean',
      width: 'half',
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoArquivo(nome, rotulo, nota) {
  return {
    field: nome,
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      interface: 'file-image',
      special: ['file'],
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

const DEFINICAO_COLECAO = {
  collection: COLECAO,
  meta: {
    icon: 'tune',
    singleton: true,
    display_template: 'Configurações globais',
    translations: [{
      language: 'pt-BR',
      translation: 'Configurações globais',
      singular: 'Configurações globais',
      plural: 'Configurações globais',
    }],
  },
  schema: {},
  fields: [
    campoArquivo('logo_site', 'Logo do site', 'Marca exibida no cabeçalho público e no painel.'),
    campoBooleano('modulo_juridico_ativo', 'Módulo Jurídico ativo', true, 'Exibe links e página de atendimento jurídico.'),
    campoBooleano('modulo_youtube_ativo', 'Módulo YouTube ativo', false, 'Exibe canal, vídeos e chamadas do YouTube no site público.'),
    campoBooleano('modulo_instagram_ativo', 'Módulo Instagram ativo', false, 'Exibe vitrine de Reels/cards do Instagram no site público.'),
    campoTexto('youtube_channel_id', 'ID do canal no YouTube', {
      width: 'half',
      nota: 'Formato UC... usado para o feed público e integrações.',
    }),
    campoTexto('youtube_api_key', 'Chave da API do YouTube', {
      width: 'half',
      nota: 'Campo sensível. Não é exposto na leitura pública.',
      meta: { options: { masked: true } },
    }),
    campoTexto('instagram_webhook_url', 'Webhook do Instagram (Make/Zapier)', {
      nota: 'Prioritário para automações. Não é exposto na leitura pública.',
    }),
    campoTexto('instagram_token', 'Token do Instagram (fallback)', {
      nota: 'Fallback para integrações. Não é exposto na leitura pública.',
      meta: { options: { masked: true } },
    }),
  ],
};

async function garantirColecao() {
  try {
    await requisitar('GET', `/collections/${COLECAO}`);
    await requisitar('PATCH', `/collections/${COLECAO}`, { meta: DEFINICAO_COLECAO.meta });
    console.log(`OK   coleção ${COLECAO} (metadados atualizados)`);
    return;
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;
  }

  await requisitar('POST', '/collections', DEFINICAO_COLECAO);
  console.log(`OK   coleção ${COLECAO}`);
}

async function garantirCampo(campo) {
  try {
    await requisitar('GET', `/fields/${COLECAO}/${campo.field}`);
    await requisitar('PATCH', `/fields/${COLECAO}/${campo.field}`, {
      meta: campo.meta,
      schema: campo.schema,
    });
    console.log(`OK   campo ${COLECAO}.${campo.field} (metadados atualizados)`);
    return;
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;
  }

  await requisitar('POST', `/fields/${COLECAO}`, campo);
  console.log(`OK   campo ${COLECAO}.${campo.field}`);
}

async function acharPoliticaPublica() {
  const politicas = await requisitar('GET', '/policies', undefined, { limit: -1, fields: ['id', 'name'] });
  const publica = politicas.find((politica) => {
    const nome = String(politica.name ?? '').trim().toLowerCase();
    if (nome.includes('not public') || nome.includes('não público') || nome.includes('nao publico')) return false;
    if (nome.includes('publicador') || nome.includes('publicadores')) return false;
    return nome === 'public' || nome === 'público' || nome === 'publico' || nome === '$t:public_label' || /\bpublic\b/.test(nome) || nome.includes('públic') || nome.includes('publico');
  });
  if (!publica) throw new Error('Política pública não encontrada. Crie/ative a política pública no Directus.');
  return publica.id;
}

async function garantirPermissaoPublica(politica) {
  const existentes = await requisitar('GET', '/permissions', undefined, {
    'filter[policy][_eq]': politica,
    'filter[collection][_eq]': COLECAO,
    'filter[action][_eq]': 'read',
    limit: -1,
  });

  const payload = {
    policy: politica,
    collection: COLECAO,
    action: 'read',
    permissions: {},
    validation: {},
    presets: null,
    fields: CAMPOS_PUBLICOS,
  };

  if (existentes.length > 0) {
    for (const permissao of existentes) {
      await requisitar('PATCH', `/permissions/${permissao.id}`, payload);
    }
    console.log(`OK   permissão pública ${COLECAO}.read (${existentes.length} registro(s) com campos restritos atualizados)`);
    return;
  }

  await requisitar('POST', '/permissions', payload);
  console.log(`OK   permissão pública ${COLECAO}.read`);
}

async function garantirRegistroSingleton() {
  try {
    await requisitar('PATCH', `/items/${COLECAO}`, {
      modulo_juridico_ativo: true,
      modulo_youtube_ativo: false,
      modulo_instagram_ativo: false,
    });
    console.log(`OK   registro singleton ${COLECAO}`);
  } catch (erro) {
    console.warn(`AVISO: singleton criado, mas não consegui gravar defaults (${erro.message}).`);
  }
}

async function principal() {
  try {
    await cliente.login({ email: EMAIL, password: SENHA });
  } catch {
    console.error('Falha no login. Confira DIRECTUS_URL, DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
    process.exit(1);
  }

  await garantirColecao();
  for (const campo of DEFINICAO_COLECAO.fields) {
    await garantirCampo(campo);
  }
  const politicaPublica = await acharPoliticaPublica();
  await garantirPermissaoPublica(politicaPublica);
  await garantirRegistroSingleton();

  console.log('\nConfigurações globais prontas.');
}

principal()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
