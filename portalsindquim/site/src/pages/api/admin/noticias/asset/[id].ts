import type { APIRoute } from 'astro';
import {
  erroAutenticacaoExpirada,
  limparSessaoAdmin,
  obterAssetEditorialAdmin,
  tokenAdmin,
} from '../../../../../lib/auth';

export const GET: APIRoute = async ({ params, cookies, redirect, url }) => {
  const token = tokenAdmin(cookies);
  if (!token) return redirect('/admin/login');
  const id = String(params.id ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Arquivo inválido.', { status: 400 });

  try {
    const origem = await obterAssetEditorialAdmin(token, id, url.searchParams);
    if (!origem.ok || !origem.body) return new Response('Imagem não encontrada.', { status: origem.status });
    const headers = new Headers();
    headers.set('Content-Type', origem.headers.get('content-type') ?? 'application/octet-stream');
    headers.set('Cache-Control', 'private, max-age=300');
    return new Response(origem.body, { status: 200, headers });
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return redirect('/admin/login?erro=sessao');
    }
    return new Response('Não foi possível carregar a imagem.', { status: 502 });
  }
};
