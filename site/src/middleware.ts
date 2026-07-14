import { defineMiddleware } from 'astro:middleware';
import { ADMIN_TOKEN_COOKIE } from './lib/auth';

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

  return next();
});
