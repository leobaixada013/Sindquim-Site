#!/usr/bin/env node
/**
 * Aplica branding, URLs oficiais e Insights de Social Media no Directus.
 *
 * Idempotente: atualiza settings, singleton configuracoes e recria/atualiza
 * metadados do dashboard sem duplicar registros conhecidos.
 *
 * Uso recomendado, com o Directus local rodando:
 *   node scripts/directus-analytics-branding.mjs
 *
 * Variáveis lidas:
 *   DIRECTUS_URL                 opcional; padrão: http://localhost:8055
 *   DIRECTUS_ADMIN_EMAIL         obrigatório; também pode vir de deploy/.env
 *   DIRECTUS_ADMIN_PASSWORD      obrigatório; também pode vir de deploy/.env
 *   INSTAGRAM_URL                opcional; padrão oficial documentado
 *   YOUTUBE_URL                  opcional; padrão oficial documentado
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

carregarEnvSeExistir(path.join(REPO_ROOT, '.env'));
carregarEnvSeExistir(path.join(REPO_ROOT, 'deploy', '.env'));

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;
const PROJECT_COLOR = '#4580ac';
const INSTAGRAM_URL = process.env.INSTAGRAM_URL ?? 'https://www.instagram.com/reacaoquimicaemdebate/';
const YOUTUBE_URL = process.env.YOUTUBE_URL ?? 'https://www.youtube.com/@Rea%C3%A7%C3%A3oQu%C3%ADmicaemDebate';

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD em .env, deploy/.env ou no ambiente.');
  process.exit(1);
}

let token = '';

const CUSTOM_CSS = `
:root {
  --sti-primary: #4580ac;
  --sti-navy: #161429;
  --sti-accent: #e73a3f;
  --sti-surface: #ffffff;
  --sti-muted: #f5f7fa;
  --sti-border: rgba(22, 20, 41, 0.10);
  --sti-shadow: 0 16px 42px rgba(13, 40, 70, 0.10);
  --theme--primary: var(--sti-primary);
  --theme--primary-subdued: #edf3f8;
  --theme--border-radius: 12px;
  --theme--font-family-sans-serif: Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body,
.v-application,
.private-view,
.module-page {
  font-family: Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #f8fafc 0%, #eef3f8 100%);
}

.v-button,
button,
.button,
.v-dialog .actions .v-button {
  border-radius: 999px !important;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.v-button.primary,
.v-button.primary .button,
.v-button[primary] {
  box-shadow: 0 12px 28px rgba(69, 128, 172, 0.24);
}

.v-card,
.card,
.panel,
.v-list,
.v-table,
.collection-item,
.insights-panel {
  border-color: var(--sti-border) !important;
  border-radius: 18px !important;
  box-shadow: var(--sti-shadow);
}

.v-input,
.v-text-overflow,
.input,
.input .input {
  border-radius: 12px !important;
}

.sidebar,
.navigation,
.module-nav {
  background: linear-gradient(180deg, var(--sti-navy) 0%, #223d58 100%) !important;
}

.sidebar a,
.navigation a,
.module-nav a {
  border-radius: 12px !important;
}

.v-notice,
.v-dialog,
.drawer {
  border-radius: 20px !important;
}

.public-view .project-logo,
.project-info {
  color: var(--sti-navy);
}
`.trim();

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

async function tentarEndpoints(metodo, caminhos, corpo) {
  let ultimoErro;
  for (const caminho of caminhos) {
    try {
      return await api(metodo, caminho, corpo);
    } catch (erro) {
      ultimoErro = erro;
      if (![400, 403, 404, 405].includes(erro.status)) throw erro;
    }
  }
  throw ultimoErro;
}

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

async function buscarPrimeiro(caminhos) {
  const itens = await tentarEndpoints('GET', caminhos);
  return itens[0] ?? null;
}

async function aplicarBranding() {
  await api('PATCH', '/settings', {
    project_color: PROJECT_COLOR,
    custom_css: CUSTOM_CSS,
  });
  console.log('OK   branding do painel aplicado');
}

async function atualizarConfiguracoes() {
  await api('PATCH', '/items/configuracoes', {
    instagram_url: INSTAGRAM_URL,
    youtube_url: YOUTUBE_URL,
  });
  console.log('OK   URLs oficiais em configuracoes');
}

function filtroNome(nome) {
  return encodeURIComponent(nome);
}

function normalizarId(relacao) {
  return relacao?.id ?? relacao;
}

async function garantirDashboardSocialMedia() {
  const nome = 'Social Media';
  const existente = await buscarPrimeiro([
    `/dashboards?filter[name][_eq]=${filtroNome(nome)}&fields=id,name,icon,color,note`,
    `/items/directus_dashboards?filter[name][_eq]=${filtroNome(nome)}&fields=id,name,icon,color,note`,
  ]).catch(() => null);

  const payload = {
    name: nome,
    icon: 'analytics',
    color: PROJECT_COLOR,
    note: 'Dashboard de métricas e desempenho das redes sociais do sindicato.',
  };

  if (existente) {
    const id = normalizarId(existente);
    await tentarEndpoints('PATCH', [`/dashboards/${id}`, `/items/directus_dashboards/${id}`], payload);
    console.log('OK   dashboard Social Media (metadados atualizados)');
    return { ...existente, ...payload, id };
  }

  const criado = await tentarEndpoints('POST', ['/dashboards', '/items/directus_dashboards'], {
    id: randomUUID(),
    ...payload,
  });
  console.log('OK   dashboard Social Media');
  return criado;
}

function painelLista({ dashboardId, nome, colecao, campos, sort, x, y }) {
  return {
    name: nome,
    icon: 'leaderboard',
    color: PROJECT_COLOR,
    show_header: true,
    dashboard: dashboardId,
    type: 'list',
    position_x: x,
    position_y: y,
    width: 12,
    height: 9,
    options: {
      collection: colecao,
      fields: campos,
      sort,
      limit: 5,
    },
  };
}

function painelMetrica({ dashboardId, nome, colecao, campo, x, y }) {
  return {
    name: nome,
    icon: 'monitoring',
    color: PROJECT_COLOR,
    show_header: true,
    dashboard: dashboardId,
    type: 'metric',
    position_x: x,
    position_y: y,
    width: 12,
    height: 6,
    options: {
      collection: colecao,
      field: campo,
      aggregate: 'sum',
      prefix: '',
      suffix: '',
      conditionalFormatting: null,
    },
  };
}

function paineisDoDashboard(dashboardId) {
  return [
    painelMetrica({
      dashboardId,
      nome: 'Total de Visualizações no YouTube',
      colecao: 'proximos_videos',
      campo: 'visualizacoes',
      x: 1,
      y: 1,
    }),
    painelMetrica({
      dashboardId,
      nome: 'Curtidas em Posts Sociais',
      colecao: 'posts_sociais',
      campo: 'curtidas',
      x: 13,
      y: 1,
    }),
    painelLista({
      dashboardId,
      nome: 'Top Posts Mais Curtidos',
      colecao: 'posts_sociais',
      campos: ['legenda', 'curtidas', 'comentarios', 'visualizacoes', 'link_original'],
      sort: ['-curtidas'],
      x: 1,
      y: 8,
    }),
    painelLista({
      dashboardId,
      nome: 'Top Reels Mais Curtidos',
      colecao: 'cards_instagram',
      campos: ['legenda', 'curtidas', 'comentarios', 'visualizacoes', 'link'],
      sort: ['-curtidas'],
      x: 13,
      y: 8,
    }),
  ];
}

async function garantirPainel(painel) {
  const nome = filtroNome(painel.name);
  const dashboardId = normalizarId(painel.dashboard);
  const existente = await buscarPrimeiro([
    `/panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${nome}&fields=id,name,dashboard`,
    `/items/directus_panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${nome}&fields=id,name,dashboard`,
  ]).catch(() => null);

  if (existente) {
    const id = normalizarId(existente);
    await tentarEndpoints('PATCH', [`/panels/${id}`, `/items/directus_panels/${id}`], painel);
    console.log(`OK   painel ${painel.name} (atualizado)`);
    return;
  }

  await tentarEndpoints('POST', ['/panels', '/items/directus_panels'], {
    id: randomUUID(),
    ...painel,
  });
  console.log(`OK   painel ${painel.name}`);
}

async function garantirDashboardEPaineis() {
  try {
    const dashboard = await garantirDashboardSocialMedia();
    const dashboardId = normalizarId(dashboard);

    for (const painel of paineisDoDashboard(dashboardId)) {
      await garantirPainel(painel);
    }
  } catch (erro) {
    console.warn(`AVISO: não consegui criar todos os painéis de Insights automaticamente (${erro.message}).`);
    console.warn('O branding, as URLs e os campos continuam válidos; ajuste o dashboard manualmente no Studio se necessário.');
  }
}

async function principal() {
  console.log(`Conectando ao Directus em ${URL_BASE}...`);
  await loginAdmin();
  console.log('OK   login de administrador');

  await aplicarBranding();
  await atualizarConfiguracoes();
  await garantirDashboardEPaineis();

  console.log('\nUpgrade visual e dashboard de Social Media aplicados.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
