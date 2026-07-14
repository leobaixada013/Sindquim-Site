import type { APIRoute } from 'astro';
import {
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
