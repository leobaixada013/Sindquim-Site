import type { APIRoute } from 'astro';
import {
  criarPostSocialAdmin,
  erroAutenticacaoExpirada,
  exigirAdminSistema,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import type { PostSocial } from '../../../../lib/tipos';

const STATUS_VALIDOS = new Set<PostSocial['status']>(['rascunho', 'agendado', 'publicado']);

function normalizarData(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? '').trim();
  if (!texto) return null;
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const token = tokenAdmin(cookies);
  if (!token) return redirect('/admin/login');

  const dados = await request.formData();
  const legenda = String(dados.get('legenda') ?? '').trim();
  const statusBruto = String(dados.get('status') ?? 'rascunho') as PostSocial['status'];
  const status = STATUS_VALIDOS.has(statusBruto) ? statusBruto : 'rascunho';
  const linkOriginal = String(dados.get('link_original') ?? '').trim() || null;
  const arquivo = dados.get('midia');

  if (!legenda) {
    return redirect('/admin/social?erro=legenda');
  }

  if (linkOriginal) {
    try {
      new URL(linkOriginal);
    } catch {
      return redirect('/admin/social?erro=link');
    }
  }

  const arquivoTratado = arquivo instanceof File ? arquivo : null;
  if (arquivoTratado && arquivoTratado.size > 0) {
    if (arquivoTratado.size > 20 * 1024 * 1024) {
      return redirect('/admin/social?erro=tamanho');
    }
    const mimesPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!mimesPermitidos.includes(arquivoTratado.type)) {
      return redirect('/admin/social?erro=formato');
    }
  }

  try {
    await exigirAdminSistema(token);
    await criarPostSocialAdmin(
      token,
      {
        legenda,
        status,
        data_publicacao: normalizarData(dados.get('data_publicacao')),
        link_original: linkOriginal,
      },
      arquivoTratado,
    );

    return redirect('/admin/social?criado=ok');
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return redirect('/admin/login?erro=sessao');
    }

    console.error(erro);
    return redirect('/admin/social?erro=directus');
  }
};
