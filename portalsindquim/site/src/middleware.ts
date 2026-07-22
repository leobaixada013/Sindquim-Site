import { defineMiddleware } from 'astro:middleware';
import { ADMIN_TOKEN_COOKIE } from './lib/auth';
import { validarOrigemAdmin, validarTokenCsrf, obterOuCriarSegredoCsrf } from './lib/adminSecurity';

const ROTAS_PUBLICAS_ADMIN = new Set(['/admin/login', '/api/admin/login']);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const rotaAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  const apiAdmin = pathname.startsWith('/api/admin/');

  if ((!rotaAdmin && !apiAdmin) || ROTAS_PUBLICAS_ADMIN.has(pathname)) {
    return next();
  }

  const token = context.cookies.get(ADMIN_TOKEN_COOKIE)?.value;

  if (!token) {
    if (apiAdmin) {
      return new Response('Não autenticado.', { status: 401 });
    }

    return context.redirect('/admin/login');
  }

  // Garante que o segredo CSRF seja criado (ou recuperado) ANTES da página renderizar,
  // prevenindo que o layout tente chamar cookies.set() quando a stream já iniciou.
  if (rotaAdmin) {
    obterOuCriarSegredoCsrf(context.cookies, context.url.protocol === 'https:');
  }

  if (apiAdmin) {
    // 1. Validar a origem da requisição
    if (!validarOrigemAdmin(context.request)) {
      return new Response(JSON.stringify({ erro: 'Origem não autorizada.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Validar CSRF para métodos de mutação
    const method = context.request.method;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      let csrfEnviado = context.request.headers.get('x-csrf-token');

      if (!csrfEnviado && context.request.headers.get('content-type')?.includes('form')) {
        // Fallback: tentar ler do body caso seja requisição multipart
        try {
          const clonedRequest = context.request.clone();
          const formData = await clonedRequest.formData();
          csrfEnviado = formData.get('csrf_token') as string;
        } catch {
          // ignora falha ao clonar ou ler form
        }
      }

      if (!validarTokenCsrf(context.cookies, csrfEnviado)) {
        return new Response(JSON.stringify({ erro: 'Token CSRF inválido ou ausente.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  return next();
});
