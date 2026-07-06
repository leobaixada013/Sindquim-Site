import type { APIRoute } from 'astro';
import { criarInscricaoNewsletter } from '../../lib/directus';

export const POST: APIRoute = async ({ request, redirect }) => {
  const dados = await request.formData();
  const honeypot = String(dados.get('site') ?? '');
  const email = String(dados.get('email') ?? '').trim();

  const origem = request.headers.get('referer') ?? '/';
  const voltar = new URL(origem, 'http://interno');
  voltar.searchParams.delete('news');

  if (honeypot !== '') {
    // Robô: finge sucesso e descarta.
    voltar.searchParams.set('news', 'ok');
    return redirect(`${voltar.pathname}?${voltar.searchParams}`, 303);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    voltar.searchParams.set('news', 'erro');
    return redirect(`${voltar.pathname}?${voltar.searchParams}`, 303);
  }

  try {
    await criarInscricaoNewsletter(email);
    voltar.searchParams.set('news', 'ok');
  } catch {
    voltar.searchParams.set('news', 'erro');
  }
  return redirect(`${voltar.pathname}?${voltar.searchParams}`, 303);
};
