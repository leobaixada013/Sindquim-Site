import type { APIRoute } from 'astro';
import {
  atualizarStatusUsuarioAdmin,
  erroAutenticacaoExpirada,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../../lib/auth';

const STATUS_VALIDOS = new Set(['active', 'suspended']);

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  const id = params.id;
  if (!id) return respostaJson(400, { erro: 'Usuário inválido.' });

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return respostaJson(400, { erro: 'JSON inválido.' });
  }

  const status = String(corpo.status ?? '');
  if (!STATUS_VALIDOS.has(status)) {
    return respostaJson(400, { erro: 'Status inválido.' });
  }

  try {
    const usuario = await atualizarStatusUsuarioAdmin(token, id, status as 'active' | 'suspended');
    return respostaJson(200, { usuario });
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    const mensagem = String((erro as Error)?.message ?? 'Não foi possível atualizar o usuário.');
    const statusResposta = mensagem.includes('própria sessão') ? 400 : mensagem.includes('Apenas administradores') ? 403 : 500;
    if (statusResposta >= 500) console.error(erro);
    return respostaJson(statusResposta, { erro: mensagem });
  }
};
