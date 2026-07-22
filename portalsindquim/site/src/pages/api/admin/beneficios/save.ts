import type { APIRoute } from 'astro';
import {
  atualizarPaginaBeneficiosAdmin,
  erroAutenticacaoExpirada,
  limparSessaoAdmin,
  salvarBeneficioAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import type { Beneficio, PaginaBeneficios } from '../../../../lib/tipos';

function texto(form: FormData, nome: string): string {
  return String(form.get(nome) ?? '').trim();
}

function textoOuNulo(form: FormData, nome: string): string | null {
  return texto(form, nome) || null;
}

function destino(estado: 'salvo' | 'erro', mensagem?: string) {
  const query = new URLSearchParams({ [estado]: '1' });
  if (mensagem) query.set('mensagem', mensagem.slice(0, 180));
  return `/admin/beneficios?${query}`;
}

const CATEGORIAS = new Set(['saude', 'educacao', 'bem-estar', 'servicos', 'outros']);

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const token = tokenAdmin(cookies);
  if (!token) return redirect('/admin/login?erro=sessao');

  try {
    const form = await request.formData();
    const tipo = texto(form, 'tipo');

    if (tipo === 'pagina') {
      const campos: Array<keyof PaginaBeneficios> = [
        'hero_rotulo', 'hero_titulo', 'hero_resumo', 'introducao_titulo', 'introducao_texto',
        'aviso_titulo', 'aviso_texto', 'cta_titulo', 'cta_texto', 'cta_link_texto', 'cta_link_href',
      ];
      const dados = Object.fromEntries(campos.map((campo) => [campo, textoOuNulo(form, campo)]));
      await atualizarPaginaBeneficiosAdmin(token, dados);
      return redirect(destino('salvo'));
    }

    if (tipo === 'beneficio') {
      const titulo = texto(form, 'titulo');
      const resumo = texto(form, 'resumo');
      const categoria = texto(form, 'categoria');
      if (titulo.length < 3 || resumo.length < 10 || !CATEGORIAS.has(categoria)) {
        return redirect(destino('erro', 'Preencha título, resumo e categoria antes de salvar.'));
      }

      const ordemBruta = texto(form, 'ordem');
      const dados: Partial<Beneficio> = {
        status: texto(form, 'status') === 'published' ? 'published' : 'draft',
        ordem: ordemBruta ? Number.parseInt(ordemBruta, 10) : null,
        titulo: titulo.slice(0, 180),
        categoria: categoria as Beneficio['categoria'],
        resumo: resumo.slice(0, 500),
        detalhes: textoOuNulo(form, 'detalhes'),
        elegibilidade: textoOuNulo(form, 'elegibilidade'),
        como_usar: textoOuNulo(form, 'como_usar'),
        requisitos: textoOuNulo(form, 'requisitos'),
        validade_inicio: textoOuNulo(form, 'validade_inicio'),
        validade_fim: textoOuNulo(form, 'validade_fim'),
        cta_texto: textoOuNulo(form, 'cta_texto'),
        cta_url: textoOuNulo(form, 'cta_url'),
        destaque: form.get('destaque') === '1',
      };
      await salvarBeneficioAdmin(token, textoOuNulo(form, 'id'), dados);
      return redirect(destino('salvo'));
    }

    return redirect(destino('erro', 'Ação de benefício inválida.'));
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return redirect('/admin/login?erro=sessao');
    }
    console.error(erro);
    return redirect(destino('erro', 'Não foi possível salvar. Confira sua permissão e tente novamente.'));
  }
};
