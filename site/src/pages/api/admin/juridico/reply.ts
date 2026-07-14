import type { APIRoute } from 'astro';
import { erroAutenticacaoExpirada, limparSessaoAdmin, tokenAdmin } from '../../../../lib/auth';
import { responderChamadoJuridico } from '../../../../lib/juridico';
import type { StatusChamadoJuridico } from '../../../../lib/tipos';

const STATUS_VALIDOS = new Set<StatusChamadoJuridico>(['Em Análise', 'Concluído']);

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { ok: false, erro: 'Sessão administrativa expirada.' });

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return respostaJson(400, { ok: false, erro: 'JSON inválido.' });
  }

  const id = String(corpo.id ?? '').trim();
  const status = String(corpo.status ?? '') as StatusChamadoJuridico;
  const respostaAdvogado = String(corpo.resposta_advogado ?? '').trim();

  if (!id || !STATUS_VALIDOS.has(status)) {
    return respostaJson(400, { ok: false, erro: 'Chamado ou status inválido.' });
  }

  try {
    const resultado = await responderChamadoJuridico({ tokenAdmin: token, id, status, respostaAdvogado });
    return respostaJson(resultado.ok ? 200 : 400, resultado);
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { ok: false, erro: 'Sessão administrativa expirada.' });
    }
    console.error('Falha ao responder chamado jurídico:', (erro as Error)?.message ?? erro);
    return respostaJson(500, { ok: false, erro: 'Não foi possível responder o chamado.' });
  }
};
