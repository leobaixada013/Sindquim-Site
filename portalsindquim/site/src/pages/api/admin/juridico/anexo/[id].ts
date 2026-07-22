import type { APIRoute } from 'astro';
import { tokenAdmin, exigirAcessoJuridico, criarClienteAdmin } from '../../../../../lib/auth';
import { assetAnexoJuridicoUrl } from '../../../../../lib/juridico';
import { readItems } from '@directus/sdk';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response('Anexo não especificado', { status: 400 });
    }

    const token = tokenAdmin(cookies);
    if (!token) {
      return new Response('Não autorizado', { status: 401 });
    }

    await exigirAcessoJuridico(token);
    const cliente = criarClienteAdmin(token);
    const vinculados = await cliente.request(readItems('chamados_juridicos', {
      fields: ['id', 'anexo'],
      filter: { anexo: { _eq: id } },
      limit: 1,
    }));
    if (!vinculados?.length) return new Response('Anexo não pertence a um chamado autorizado', { status: 404 });

    // Buscamos o URL interno seguro
    const anexoUrl = assetAnexoJuridicoUrl(id, token);
    if (!anexoUrl) {
      return new Response('URL do anexo não encontrada', { status: 404 });
    }

    // Fazemos um proxy do arquivo para evitar expor a URL direta e garantir o token
    const respostaDirectus = await fetch(anexoUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!respostaDirectus.ok) {
      return new Response('Falha ao buscar anexo', { status: respostaDirectus.status });
    }

    // Lemos como array buffer para streamar
    const buffer = await respostaDirectus.arrayBuffer();

    const mimeType = respostaDirectus.headers.get('Content-Type') || 'application/octet-stream';
    const contentDisposition = mimeType === 'application/pdf'
      ? `inline; filename="anexo-${id}.pdf"`
      : mimeType.startsWith('image/')
        ? `inline; filename="anexo-${id}"`
        : `attachment; filename="anexo-${id}"`;

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('Erro ao baixar anexo:', error);
    return new Response('Erro interno do servidor', { status: 500 });
  }
};
