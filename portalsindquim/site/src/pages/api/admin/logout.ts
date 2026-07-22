import type { APIRoute } from 'astro';
import { ADMIN_TOKEN_COOKIE, cookieSeguro } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(ADMIN_TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cookieSeguro(),
    path: '/',
  });

  return redirect('/admin/login');
};
