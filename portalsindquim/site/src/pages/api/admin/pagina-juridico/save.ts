import type { APIRoute } from 'astro';
import {
  atualizarPaginaJuridicoAdmin,
  erroAutenticacaoExpirada,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import type { PaginaJuridico } from '../../../../lib/tipos';

function textoOuNulo(form: FormData, nome: string): string | null {
  return String(form.get(nome) ?? '').trim() || null;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const token = tokenAdmin(cookies);
  if (!token) return redirect('/admin/login?erro=sessao');

  try {
    const form = await request.formData();
    const campos: Array<keyof PaginaJuridico> = [
      'hero_rotulo', 'hero_titulo', 'hero_resumo',
      'hero_cta_primario_texto', 'hero_cta_primario_href',
      'hero_cta_secundario_texto', 'hero_cta_secundario_href',
      'direitos_rotulo', 'direitos_titulo',
      'agendamento_rotulo', 'agendamento_titulo', 'agendamento_texto', 'plantao_titulo',
      'chamado_titulo', 'chamado_resumo', 'chamado_prazo_texto',
      'faq_rotulo', 'faq_titulo',
      'cta_rotulo', 'cta_titulo', 'cta_link_texto', 'cta_link_href', 'seo_descricao',
    ];
    const dados = Object.fromEntries(campos.map((campo) => [campo, textoOuNulo(form, campo)]));
    await atualizarPaginaJuridicoAdmin(token, dados);
    return redirect('/admin/pagina-juridico?salvo=1');
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return redirect('/admin/login?erro=sessao');
    }
    console.error(erro);
    return redirect('/admin/pagina-juridico?erro=1');
  }
};
