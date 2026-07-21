import type { APIRoute } from 'astro';
import {
  convidarUsuarioAdmin,
  erroAutenticacaoExpirada,
  listarUsuariosAdmin,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  try {
    const usuarios = await listarUsuariosAdmin(token);
    return respostaJson(200, { usuarios });
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    const mensagem = String((erro as Error)?.message ?? 'Não foi possível listar usuários.');
    if (mensagem.includes('Apenas administradores')) {
      return respostaJson(403, { erro: mensagem });
    }
    console.error(erro);
    return respostaJson(500, { erro: 'Não foi possível listar usuários.' });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return respostaJson(400, { erro: 'JSON inválido.' });
  }

  try {
    await convidarUsuarioAdmin(token, String(corpo.email ?? ''), String(corpo.role_id ?? ''));
    return respostaJson(201, { ok: true });
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    const mensagem = String((erro as Error)?.message ?? 'Não foi possível enviar o convite.');
    const status = /administradores|função permitida|e-mail válido/i.test(mensagem) ? 400 : 500;
    if (status === 500) console.error(erro);
    return respostaJson(status, { erro: mensagem });
  }
};
