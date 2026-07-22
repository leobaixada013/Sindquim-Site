import type { APIRoute } from 'astro';
import {
  atualizarConfiguracoesGlobaisAdmin,
  erroAutenticacaoExpirada,
  exigirAdminSistema,
  getAdminSettingsData,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import type { ConfiguracoesGlobais } from '../../../../lib/tipos';

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function texto(valor: unknown): string | null {
  const limpo = String(valor ?? '').trim();
  return limpo === '' ? null : limpo;
}

const CAMPOS_BOOLEANOS = [
  'modulo_juridico_ativo',
  'modulo_youtube_ativo',
  'modulo_instagram_ativo',
] as const;

type CampoBooleano = (typeof CAMPOS_BOOLEANOS)[number];

function booleano(valor: unknown): boolean | undefined {
  if (typeof valor === 'boolean') return valor;
  if (typeof valor === 'number') {
    if (valor === 1) return true;
    if (valor === 0) return false;
    return undefined;
  }
  if (typeof valor !== 'string') return undefined;

  const normalizado = valor.trim().toLowerCase();
  if (['true', '1', 'on', 'yes', 'sim'].includes(normalizado)) return true;
  if (['false', '0', 'off', 'no', 'nao', 'não', ''].includes(normalizado)) return false;
  return undefined;
}

async function lerCorpo(request: Request): Promise<{ corpo: Record<string, unknown>; formulario: boolean }> {
  const tipo = request.headers.get('content-type') ?? '';
  if (tipo.includes('application/json')) {
    return { corpo: await request.json(), formulario: false };
  }

  if (tipo.includes('multipart/form-data') || tipo.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const corpo: Record<string, unknown> = {};
    formData.forEach((valor, chave) => {
      corpo[chave] = typeof valor === 'string' ? valor : valor.name;
    });
    return { corpo, formulario: true };
  }

  return { corpo: await request.json(), formulario: false };
}

function aplicarBooleano(
  payload: Partial<ConfiguracoesGlobais>,
  corpo: Record<string, unknown>,
  campo: CampoBooleano,
  formulario: boolean,
) {
  if (!(campo in corpo)) {
    if (formulario) {
      payload[campo] = false;
    }
    return;
  }

  const valor = booleano(corpo[campo]);
  if (valor === undefined) {
    throw new Error(`Valor inválido para ${campo}.`);
  }
  payload[campo] = valor;
}

export const GET: APIRoute = async ({ cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  try {
    await exigirAdminSistema(token);
    const dados = await getAdminSettingsData(token);
    return respostaJson(200, dados);
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    console.error(erro);
    return respostaJson(500, { erro: 'Não foi possível carregar as configurações.' });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  let corpo: Record<string, unknown>;
  let formulario = false;
  try {
    const lido = await lerCorpo(request);
    corpo = lido.corpo;
    formulario = lido.formulario;
  } catch {
    return respostaJson(400, { erro: 'Corpo da requisição inválido.' });
  }

  const payload: Partial<ConfiguracoesGlobais> = {};
  try {
    for (const campo of CAMPOS_BOOLEANOS) aplicarBooleano(payload, corpo, campo, formulario);
  } catch (erro) {
    return respostaJson(400, { erro: (erro as Error).message });
  }
  if ('youtube_channel_id' in corpo) payload.youtube_channel_id = texto(corpo.youtube_channel_id);
  if ('instagram_webhook_url' in corpo) payload.instagram_webhook_url = texto(corpo.instagram_webhook_url);

  const youtubeApiKey = texto(corpo.youtube_api_key);
  const instagramToken = texto(corpo.instagram_token);
  if (booleano(corpo.limpar_youtube_api_key) === true) payload.youtube_api_key = null;
  else if (youtubeApiKey) payload.youtube_api_key = youtubeApiKey;
  if (booleano(corpo.limpar_instagram_token) === true) payload.instagram_token = null;
  else if (instagramToken) payload.instagram_token = instagramToken;

  try {
    await exigirAdminSistema(token);
    const dados = await atualizarConfiguracoesGlobaisAdmin(token, payload);
    return respostaJson(200, dados);
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    console.error(erro);
    return respostaJson(500, { erro: 'Não foi possível salvar as configurações.' });
  }
};
