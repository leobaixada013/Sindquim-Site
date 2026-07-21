import type { APIRoute } from 'astro';
import { abrirChamadoJuridico } from '../../lib/juridico';
import { permitirTentativa } from '../../lib/rateLimit';

function aceitaJson(request: Request): boolean {
  return request.headers.get('accept')?.includes('application/json') ?? false;
}

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
  if (!permitirTentativa(`juridico:${clientAddress || 'desconhecido'}`)) {
    if (aceitaJson(request)) return respostaJson(429, { ok: false, erro: 'Muitas tentativas. Aguarde alguns minutos.' });
    return redirect('/juridico?chamado=limite', 303);
  }
  let dados: FormData;
  try {
    dados = await request.formData();
  } catch {
    if (aceitaJson(request)) return respostaJson(400, { ok: false, erro: 'Envio inválido.' });
    return redirect('/juridico?chamado=erro', 303);
  }

  try {
    const resultado = await abrirChamadoJuridico(dados);
    if (!resultado.ok) {
      if (aceitaJson(request)) return respostaJson(400, resultado);
      return redirect('/juridico?chamado=erro', 303);
    }

    if (aceitaJson(request)) return respostaJson(200, resultado);
    return redirect('/juridico?chamado=ok', 303);
  } catch (erro) {
    console.error('Falha ao abrir chamado jurídico:', (erro as Error)?.message ?? erro);
    if (aceitaJson(request)) return respostaJson(500, { ok: false, erro: 'Não foi possível abrir o chamado agora.' });
    return redirect('/juridico?chamado=erro', 303);
  }
};
