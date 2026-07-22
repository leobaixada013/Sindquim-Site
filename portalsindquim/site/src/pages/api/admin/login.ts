import type { APIRoute } from 'astro';
import { ADMIN_TOKEN_COOKIE, cookieSeguro, loginAdmin } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const dados = await request.formData();
  const email = String(dados.get('email') ?? '').trim();
  const password = String(dados.get('password') ?? '');

  if (!email || !password) {
    return redirect('/admin/login?erro=credenciais');
  }

  try {
    const token = await loginAdmin(email, password);
    cookies.set(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: cookieSeguro(),
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return redirect('/admin');
  } catch {
    return redirect('/admin/login?erro=credenciais');
  }
};
