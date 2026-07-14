/**
 * Setup idempotente do Módulo Jurídico (chamados legais).
 *
 * Uso:
 *   DIRECTUS_URL=http://localhost:8055 \
 *   DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/setup-juridico.mjs
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
const COLECAO = 'chamados_juridicos';
const CAMPOS_CREATE_PUBLICO = ['nome', 'cpf', 'email', 'telefone', 'tipo', 'descricao', 'anexo'];
const CAMPOS_UPDATE_ADMIN = ['status', 'resposta_advogado', 'respondido_em', 'email_resposta_enviado_em'];

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  process.exit(1);
}

const requireFromSite = createRequire(new URL('../site/package.json', import.meta.url));
const { authentication, createDirectus, customEndpoint, rest } = requireFromSite('@directus/sdk');
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
    const mensagem = JSON.stringify(erro?.errors ?? erro?.message ?? erro).slice(0, 500);
    const falha = new Error(`${metodo} ${caminho} → ${status ?? 'erro'}: ${mensagem}`);
    falha.status = status;
    throw falha;
  }
}

function campoTexto(nome, rotulo, opcoes = {}) {
  return {
    field: nome,
    type: opcoes.tipo ?? 'string',
    schema: {
      is_nullable: !opcoes.obrigatorio,
      default_value: opcoes.default_value,
    },
    meta: {
      interface: opcoes.interface ?? 'input',
      width: opcoes.width ?? 'full',
      required: Boolean(opcoes.obrigatorio),
      note: opcoes.nota,
      options: opcoes.options ?? {},
      translations: [{ language: 'pt-BR', translation: rotulo }],
      ...(opcoes.meta ?? {}),
    },
  };
}

function campoArquivo(nome, rotulo, nota) {
  return {
    field: nome,
    type: 'uuid',
    schema: { is_nullable: true },
    meta: {
      interface: 'file',
      special: ['file'],
      note: nota,
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

function campoDataSistema(nome, rotulo, especial) {
  return {
    field: nome,
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      special: especial ? [especial] : undefined,
      readonly: true,
      width: 'half',
      hidden: especial === 'date-created' || especial === 'date-updated',
      translations: [{ language: 'pt-BR', translation: rotulo }],
    },
  };
}

const DEFINICAO_COLECAO = {
  collection: COLECAO,
  meta: {
    icon: 'gavel',
    display_template: '{{nome}} — {{tipo}}',
    archive_field: 'status',
    archive_value: 'Concluído',
    unarchive_value: 'Aberto',
    translations: [{
      language: 'pt-BR',
      translation: 'Chamados jurídicos',
      singular: 'Chamado jurídico',
      plural: 'Chamados jurídicos',
    }],
  },
  schema: {},
  fields: [
    campoTexto('nome', 'Nome completo', { obrigatorio: true, width: 'half' }),
    campoTexto('cpf', 'CPF', { obrigatorio: true, width: 'half', nota: 'Armazenado apenas para triagem jurídica; mascarar em listas.' }),
    campoTexto('email', 'E-mail', { obrigatorio: true, width: 'half' }),
    campoTexto('telefone', 'Telefone', { obrigatorio: true, width: 'half' }),
    campoTexto('tipo', 'Tipo de demanda', {
      obrigatorio: true,
      width: 'half',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Demissão / Rescisão', value: 'Demissão / Rescisão' },
          { text: 'Horas Extras / Jornada', value: 'Horas Extras / Jornada' },
          { text: 'Assédio / Discriminação', value: 'Assédio / Discriminação' },
          { text: 'Acidente de Trabalho', value: 'Acidente de Trabalho' },
          { text: 'Dúvida Geral', value: 'Dúvida Geral' },
        ],
      },
    }),
    campoTexto('descricao', 'Descrição do caso', { tipo: 'text', interface: 'input-multiline', obrigatorio: true }),
    campoArquivo('anexo', 'Documento anexo', 'PDF ou imagem enviada pelo trabalhador.'),
    campoTexto('status', 'Status', {
      obrigatorio: true,
      width: 'half',
      default_value: 'Aberto',
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Aberto', value: 'Aberto', color: 'var(--theme--warning)' },
          { text: 'Em Análise', value: 'Em Análise', color: 'var(--theme--primary)' },
          { text: 'Concluído', value: 'Concluído', color: 'var(--theme--success)' },
        ],
      },
    }),
    campoTexto('resposta_advogado', 'Resposta do advogado', { tipo: 'text', interface: 'input-multiline' }),
    campoDataSistema('date_created', 'Criado em', 'date-created'),
    campoDataSistema('date_updated', 'Atualizado em', 'date-updated'),
    campoDataSistema('respondido_em', 'Respondido em'),
    campoDataSistema('email_resposta_enviado_em', 'E-mail da resposta enviado em'),
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
    await requisitar('PATCH', `/fields/${COLECAO}/${campo.field}`, { meta: campo.meta, schema: campo.schema });
    console.log(`OK   campo ${COLECAO}.${campo.field} (metadados atualizados)`);
    return;
  } catch (erro) {
    if (erro.status !== 403 && erro.status !== 404) throw erro;
  }
  await requisitar('POST', `/fields/${COLECAO}`, campo);
  console.log(`OK   campo ${COLECAO}.${campo.field}`);
}

async function listarPoliticas() {
  return requisitar('GET', '/policies', undefined, { limit: -1, fields: ['id', 'name'] });
}

function politicaEhPublica(politica) {
  const nome = String(politica.name ?? '').trim().toLowerCase();
  if (nome.includes('not public') || nome.includes('não público') || nome.includes('nao publico')) return false;
  if (nome.includes('publicador') || nome.includes('publicadores')) return false;
  return nome === 'public' || nome === 'público' || nome === 'publico' || nome === '$t:public_label' || /\bpublic\b/.test(nome) || nome.includes('públic') || nome.includes('publico');
}

async function acharPoliticaPublica() {
  const politica = (await listarPoliticas()).find(politicaEhPublica);
  if (!politica) throw new Error('Política pública não encontrada.');
  return politica.id;
}

async function acharPoliticaEditor() {
  const politicas = await listarPoliticas();
  return politicas.find((p) => /editor|editores|conteúdo|conteudo|administrator/i.test(p.name ?? ''))?.id ?? null;
}

async function garantirPermissao(politica, collection, action, fields) {
  const existentes = await requisitar('GET', '/permissions', undefined, {
    'filter[policy][_eq]': politica,
    'filter[collection][_eq]': collection,
    'filter[action][_eq]': action,
    limit: -1,
  });
  const payload = {
    policy: politica,
    collection,
    action,
    permissions: {},
    validation: {},
    presets: action === 'create' ? { status: 'Aberto' } : null,
    fields,
  };
  if (existentes.length > 0) {
    for (const permissao of existentes) {
      await requisitar('PATCH', `/permissions/${permissao.id}`, payload);
    }
    console.log(`OK   permissão ${collection}.${action} (${existentes.length} registro(s) atualizado(s))`);
    return;
  }
  await requisitar('POST', '/permissions', payload);
  console.log(`OK   permissão ${collection}.${action}`);
}

async function principal() {
  try {
    await cliente.login({ email: EMAIL, password: SENHA });
  } catch {
    console.error('Falha no login. Confira DIRECTUS_URL, DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
    process.exit(1);
  }

  await garantirColecao();
  for (const campo of DEFINICAO_COLECAO.fields) await garantirCampo(campo);

  const politicaPublica = await acharPoliticaPublica();
  await garantirPermissao(politicaPublica, COLECAO, 'create', CAMPOS_CREATE_PUBLICO);

  const politicaEditor = await acharPoliticaEditor();
  if (politicaEditor) {
    await garantirPermissao(politicaEditor, COLECAO, 'read', ['*']);
    await garantirPermissao(politicaEditor, COLECAO, 'update', CAMPOS_UPDATE_ADMIN);
  } else {
    console.warn('AVISO: política de editor/admin não encontrada; administradores continuam com acesso total pelo Directus.');
  }

  console.log('\nMódulo jurídico pronto.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
