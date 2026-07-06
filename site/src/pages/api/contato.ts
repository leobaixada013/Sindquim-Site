import type { APIRoute } from 'astro';
import { criarMensagemContato } from '../../lib/directus';

export const POST: APIRoute = async ({ request, redirect }) => {
  const dados = await request.formData();
  const honeypot = String(dados.get('site') ?? '');
  const nome = String(dados.get('nome') ?? '').trim().slice(0, 120);
  const email = String(dados.get('email') ?? '').trim().slice(0, 180);
  const mensagem = String(dados.get('mensagem') ?? '').trim().slice(0, 4000);

  if (honeypot !== '') {
    return redirect('/contato?contato=ok', 303);
  }
  if (!nome || !mensagem || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return redirect('/contato?contato=erro', 303);
  }

  try {
    await criarMensagemContato({ nome, email, mensagem });
    return redirect('/contato?contato=ok', 303);
  } catch {
    return redirect('/contato?contato=erro', 303);
  }
};
