/**
 * Teste destrutivo e autocontido do menor privilégio do Editor.
 * Cria uma conta temporária, envia uma imagem, cria um rascunho e remove tudo no final.
 * Use somente em ambiente de teste.
 */
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const URL_BASE = (process.env.DIRECTUS_URL ?? 'http://localhost:8155').replace(/\/$/, '');
const EMAIL_ADMIN = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA_ADMIN = process.env.DIRECTUS_ADMIN_PASSWORD;
const IMAGEM_TESTE = new URL('../assets/noticias/diretoria-sindquim-posse.jpg', import.meta.url);

if (!EMAIL_ADMIN || !SENHA_ADMIN) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  process.exit(1);
}

async function requisicao(caminho, { metodo = 'GET', token, corpo, form } = {}) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: form ?? (corpo ? JSON.stringify(corpo) : undefined),
  });
  const json = await resposta.json().catch(() => ({}));
  return { resposta, dados: json.data, erros: json.errors };
}

async function login(email, password) {
  const resultado = await requisicao('/auth/login', { metodo: 'POST', corpo: { email, password } });
  const token = resultado.dados?.access_token;
  if (!resultado.resposta.ok || !token) throw new Error(`Falha no login (${resultado.resposta.status}).`);
  return token;
}

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

const sufixo = randomUUID();
const emailEditor = `e2epodcast${sufixo.replaceAll('-', '')}@example.com`;
const senhaEditor = `E2e!${sufixo}`;
let tokenAdmin;
let usuarioId;
let arquivoId;
let anuncioId;
let configOriginal;

try {
  tokenAdmin = await login(EMAIL_ADMIN, SENHA_ADMIN);
  const roles = await requisicao('/roles?filter[name][_eq]=Editor&limit=1&fields=id', { token: tokenAdmin });
  const roleId = roles.dados?.[0]?.id;
  exigir(roleId, 'A role Editor não foi encontrada. Execute directus-schema.mjs primeiro.');

  const config = await requisicao('/items/configuracoes?fields=youtube_url,youtube_channel_id,podcast_ativo,podcast_titulo,podcast_rotulo', { token: tokenAdmin });
  configOriginal = config.dados;

  const usuario = await requisicao('/users', {
    metodo: 'POST', token: tokenAdmin,
    corpo: { email: emailEditor, password: senhaEditor, role: roleId, status: 'active', first_name: 'Teste', last_name: 'Podcast' },
  });
  exigir(usuario.resposta.ok && usuario.dados?.id, `Não foi possível criar o Editor temporário (${usuario.resposta.status}): ${JSON.stringify(usuario.erros ?? {})}`);
  usuarioId = usuario.dados.id;

  const tokenEditor = await login(emailEditor, senhaEditor);
  const ajuste = await requisicao('/items/configuracoes', {
    metodo: 'PATCH', token: tokenEditor,
    corpo: {
      youtube_url: 'https://www.youtube.com/@ReaçãoQuímicaemDebate/streams',
      youtube_channel_id: 'UC4sw8g2GwkMMikgm4n4fHmQ',
      podcast_ativo: true,
      podcast_titulo: 'Podcast Reação Química',
      podcast_rotulo: 'Informação e debate',
    },
  });
  exigir(ajuste.resposta.ok, `Editor não conseguiu atualizar o canal (${ajuste.resposta.status}).`);

  const pastas = await requisicao(`/folders?filter[name][_eq]=${encodeURIComponent('Portal — mídia pública')}&limit=1&fields=id`, { token: tokenEditor });
  const pastaId = pastas.dados?.[0]?.id;
  exigir(pastaId, 'Editor não conseguiu ler a pasta pública de upload.');

  const bytes = await readFile(IMAGEM_TESTE);
  const form = new FormData();
  form.append('folder', pastaId);
  form.append('title', 'Teste temporário — Podcast');
  form.append('description', 'Imagem temporária criada pelo teste de permissões.');
  form.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'teste-podcast.jpg');
  const arquivo = await requisicao('/files', { metodo: 'POST', token: tokenEditor, form });
  exigir(arquivo.resposta.ok && arquivo.dados?.id, `Editor não conseguiu enviar a arte (${arquivo.resposta.status}).`);
  arquivoId = arquivo.dados.id;

  const anuncio = await requisicao('/items/proximos_videos', {
    metodo: 'POST', token: tokenEditor,
    corpo: {
      status: 'draft', titulo: 'Teste temporário do podcast', descricao: 'Será removido automaticamente.',
      data_estreia: new Date(Date.now() + 86_400_000).toISOString(), imagem: arquivoId,
      imagem_alt: 'Duas pessoas em evento institucional.', episodio_numero: 999,
    },
  });
  exigir(anuncio.resposta.ok && anuncio.dados?.id, `Editor não conseguiu criar o rascunho (${anuncio.resposta.status}).`);
  anuncioId = anuncio.dados.id;

  const usuarios = await requisicao('/users?limit=1', { token: tokenEditor });
  const usuariosVisiveis = Array.isArray(usuarios.dados) ? usuarios.dados : [];
  exigir(
    usuarios.resposta.status === 403 || usuariosVisiveis.every((item) => item?.id === usuarioId),
    'Falha de menor privilégio: Editor conseguiu consultar outra conta.',
  );

  const assetPublico = await fetch(`${URL_BASE}/assets/${arquivoId}`);
  exigir(assetPublico.ok, `A arte enviada não ficou pública (${assetPublico.status}).`);
  console.log('OK   Editor configurou o podcast sem acessar usuários ou segredos.');
  console.log('OK   upload direto, rascunho e leitura pública da arte validados.');
} finally {
  if (tokenAdmin) {
    if (anuncioId) await requisicao(`/items/proximos_videos/${anuncioId}`, { metodo: 'DELETE', token: tokenAdmin });
    if (arquivoId) await requisicao(`/files/${arquivoId}`, { metodo: 'DELETE', token: tokenAdmin });
    if (configOriginal) await requisicao('/items/configuracoes', { metodo: 'PATCH', token: tokenAdmin, corpo: configOriginal });
    if (usuarioId) await requisicao(`/users/${usuarioId}`, { metodo: 'DELETE', token: tokenAdmin });
  }
}
