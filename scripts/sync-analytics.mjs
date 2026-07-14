#!/usr/bin/env node
/**
 * Sincroniza métricas públicas de Social Media para o Directus.
 *
 * Este script é intencionalmente conservador: não faz scraping frágil nem ignora
 * limites das plataformas. Sem tokens externos, ele registra avisos e mantém os
 * campos prontos para preenchimento manual ou futuras integrações oficiais.
 *
 * Variáveis lidas:
 *   DIRECTUS_URL                 opcional; padrão: http://localhost:8055
 *   DIRECTUS_ADMIN_EMAIL         obrigatório; também pode vir de deploy/.env
 *   DIRECTUS_ADMIN_PASSWORD      obrigatório; também pode vir de deploy/.env
 *   YOUTUBE_API_KEY              opcional; habilita YouTube Data API
 *   META_ACCESS_TOKEN            opcional; habilita Meta Graph API quando os links
 *                                tiverem IDs compatíveis com a conta conectada
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
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

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

function extrairYoutubeVideoId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1) || null;
    if (parsed.searchParams.has('v')) return parsed.searchParams.get('v');
    const shorts = parsed.pathname.match(/\/shorts\/([^/?#]+)/);
    if (shorts) return shorts[1];
    const embed = parsed.pathname.match(/\/embed\/([^/?#]+)/);
    if (embed) return embed[1];
  } catch {
    return null;
  }

  return null;
}

function extrairInstagramMediaId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:p|reel|tv)\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function buscarMetricasYoutube(videoId) {
  if (!YOUTUBE_API_KEY || !videoId) return null;

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'statistics');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', YOUTUBE_API_KEY);

  const resposta = await fetch(url);
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    console.warn(`AVISO: YouTube Data API falhou para ${videoId}: ${JSON.stringify(json.error ?? json).slice(0, 200)}`);
    return null;
  }

  const stats = json.items?.[0]?.statistics;
  if (!stats) return null;

  return {
    visualizacoes: Number(stats.viewCount ?? 0),
    curtidas: Number(stats.likeCount ?? 0),
    comentarios: Number(stats.commentCount ?? 0),
  };
}

async function buscarMetricasInstagram(mediaId) {
  if (!META_ACCESS_TOKEN || !mediaId) return null;

  const url = new URL(`https://graph.facebook.com/v20.0/${mediaId}`);
  url.searchParams.set('fields', 'like_count,comments_count');
  url.searchParams.set('access_token', META_ACCESS_TOKEN);

  const resposta = await fetch(url);
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    console.warn(`AVISO: Meta Graph API falhou para ${mediaId}: ${JSON.stringify(json.error ?? json).slice(0, 200)}`);
    return null;
  }

  return {
    curtidas: Number(json.like_count ?? 0),
    comentarios: Number(json.comments_count ?? 0),
  };
}

function payloadMetricas(metricas) {
  return {
    ...metricas,
    ultima_sincronizacao_metricas: new Date().toISOString(),
  };
}

async function sincronizarCardsInstagram() {
  const cards = await api('GET', '/items/cards_instagram?limit=-1&fields=id,link');
  let atualizados = 0;

  for (const card of cards) {
    const mediaId = extrairInstagramMediaId(card.link);
    const metricas = await buscarMetricasInstagram(mediaId);
    if (!metricas) continue;

    await api('PATCH', `/items/cards_instagram/${card.id}`, payloadMetricas(metricas));
    atualizados++;
  }

  console.log(`OK   cards_instagram sincronizados: ${atualizados}/${cards.length}`);
}

async function sincronizarPostsSociais() {
  const posts = await api('GET', '/items/posts_sociais?limit=-1&fields=id,link_original');
  let atualizados = 0;

  for (const post of posts) {
    const youtubeId = extrairYoutubeVideoId(post.link_original);
    const instagramId = extrairInstagramMediaId(post.link_original);
    const metricas = youtubeId
      ? await buscarMetricasYoutube(youtubeId)
      : await buscarMetricasInstagram(instagramId);

    if (!metricas) continue;

    await api('PATCH', `/items/posts_sociais/${post.id}`, payloadMetricas(metricas));
    atualizados++;
  }

  console.log(`OK   posts_sociais sincronizados: ${atualizados}/${posts.length}`);
}

async function sincronizarProximosVideos() {
  const videos = await api('GET', '/items/proximos_videos?limit=-1&fields=id,titulo');

  if (!YOUTUBE_API_KEY) {
    console.log(`INFO próximos vídeos encontrados: ${videos.length}. Defina YOUTUBE_API_KEY e um campo/link de vídeo para sincronizar métricas item a item.`);
    return;
  }

  console.log(`INFO próximos vídeos encontrados: ${videos.length}. O schema atual não guarda URL de vídeo por item; métricas ficam preparadas para futura ligação por vídeo.`);
}

async function principal() {
  console.log(`Conectando ao Directus em ${URL_BASE}...`);
  await loginAdmin();
  console.log('OK   login de administrador');

  const configuracoes = await api('GET', '/items/configuracoes?fields=instagram_url,youtube_url,youtube_channel_id');
  console.log(`INFO Instagram configurado: ${configuracoes.instagram_url ?? 'não definido'}`);
  console.log(`INFO YouTube configurado: ${configuracoes.youtube_url ?? 'não definido'}`);

  if (!META_ACCESS_TOKEN) {
    console.log('INFO META_ACCESS_TOKEN ausente: Instagram será mantido para preenchimento manual ou integração Meta oficial.');
  }
  if (!YOUTUBE_API_KEY) {
    console.log('INFO YOUTUBE_API_KEY ausente: métricas detalhadas do YouTube serão ignoradas.');
  }

  await sincronizarCardsInstagram();
  await sincronizarPostsSociais();
  await sincronizarProximosVideos();

  console.log('\nSincronização de analytics concluída.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
