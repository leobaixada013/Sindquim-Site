import type { APIRoute } from 'astro';
import {
  atualizarFotoGaleriaAdmin,
  atualizarNoticiaAdmin,
  criarFotoGaleriaAdmin,
  criarNoticiaAdmin,
  enviarImagemEditorialAdmin,
  erroAutenticacaoExpirada,
  exigirAcessoEditorial,
  getAdminNoticia,
  limparSessaoAdmin,
  removerFotoGaleriaAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import {
  gerarSlugEditorial,
  htmlParaTextoEditorial,
  LIMITE_FOTOS_GALERIA,
  textoParaHtmlEditorial,
  tituloRascunho,
  tituloVisivelNoEditor,
  validarArquivoImagem,
  validarDadosEditoriais,
  type AcaoEditorial,
  type ErroEditorial,
} from '../../../../lib/editorial';
import { sanitizarHtmlEditorial } from '../../../../lib/sanitize';
import type { Post } from '../../../../lib/tipos';

const ACOES = new Set<AcaoEditorial>(['draft', 'publish', 'schedule']);

function texto(form: FormData, nome: string): string {
  return String(form.get(nome) ?? '').trim();
}

function textoOuNulo(form: FormData, nome: string): string | null {
  return texto(form, nome) || null;
}

function arquivos(form: FormData, nome: string): File[] {
  return form.getAll(nome).filter((item): item is File => item instanceof File && item.size > 0);
}

function valores(form: FormData, nome: string): string[] {
  return form.getAll(nome).map((item) => String(item ?? '').trim());
}

function resposta(estado: Record<string, unknown>, status = 200): Response {
  return Response.json(estado, { status });
}

function mensagemErro(erro: unknown): string {
  const mensagem = String((erro as { message?: string })?.message ?? '').trim();
  if (/permission|forbidden|not allowed/i.test(mensagem)) return 'Sua conta não tem permissão para concluir esta ação.';
  if (/unique|duplicate/i.test(mensagem)) return 'Já existe uma notícia com esse endereço. Altere um pouco o título e tente novamente.';
  return mensagem || 'Não foi possível salvar a notícia. Seu texto continua nesta tela para você tentar novamente.';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return resposta({ ok: false, sessaoExpirada: true, erro: 'Sua sessão terminou. Entre novamente.' }, 401);

  let postId: string | number | null = null;
  let estadoOriginal: Post | null = null;
  try {
    const form = await request.formData();
    await exigirAcessoEditorial(token);
    const acaoBruta = texto(form, 'acao') as AcaoEditorial;
    const acao: AcaoEditorial = ACOES.has(acaoBruta) ? acaoBruta : 'draft';
    const idBruto = texto(form, 'id');
    postId = idBruto || null;
    const existente = postId ? await getAdminNoticia(token, postId, true) : null;
    estadoOriginal = existente;

    const tituloInformado = texto(form, 'titulo');
    const conteudoHtmlRecebido = texto(form, 'conteudo_html');
    const conteudoHtml = conteudoHtmlRecebido
      ? sanitizarHtmlEditorial(conteudoHtmlRecebido)
      : textoParaHtmlEditorial(texto(form, 'conteudo'));
    const conteudoTexto = htmlParaTextoEditorial(conteudoHtml);
    const capa = arquivos(form, 'capa')[0] ?? null;
    const imagemAtual = existente?.imagem || null;
    const galeriaExistenteIds = valores(form, 'galeria_id');
    const galeriaExistenteAlt = valores(form, 'galeria_alt');
    const galeriaNovas = arquivos(form, 'galeria_arquivos');
    const galeriaNovasAlt = valores(form, 'galeria_nova_alt');
    const removidos = new Set(valores(form, 'galeria_remover').filter(Boolean));
    const idsPermitidos = new Set((existente?.galeria ?? []).map((foto) => String(foto.id)));
    if (galeriaExistenteIds.some((galeriaId) => !idsPermitidos.has(galeriaId))) {
      return resposta({ ok: false, erro: 'A galeria enviada não pertence a esta notícia. Recarregue a página e tente novamente.' }, 400);
    }
    const todosAlternativos = [
      ...galeriaExistenteAlt.filter((_, indice) => !removidos.has(galeriaExistenteIds[indice])),
      ...galeriaNovasAlt,
    ];
    const agendadoTexto = textoOuNulo(form, 'agendado_para');
    const fontePropria = form.get('fonte_propria') === '1';

    const erros: ErroEditorial[] = validarDadosEditoriais({
      acao,
      titulo: tituloInformado,
      conteudo: conteudoTexto,
      possuiCapa: Boolean(capa || imagemAtual),
      imagemAlt: texto(form, 'imagem_alt'),
      agendadoPara: agendadoTexto,
      fontePropria,
      fonteNome: texto(form, 'fonte_nome'),
      fonteUrl: texto(form, 'fonte_url'),
      galeriaAlternativos: todosAlternativos,
    });

    const erroCapa = validarArquivoImagem(capa);
    if (erroCapa) erros.push({ campo: 'capa', mensagem: erroCapa });
    galeriaNovas.forEach((arquivo, indice) => {
      const erro = validarArquivoImagem(arquivo);
      if (erro) erros.push({ campo: `galeria_nova_${indice}`, mensagem: `Foto ${indice + 1}: ${erro}` });
    });

    const totalGaleria = galeriaExistenteIds.filter((id) => !removidos.has(id)).length + galeriaNovas.length;
    if (totalGaleria > LIMITE_FOTOS_GALERIA) {
      erros.push({ campo: 'galeria_arquivos', mensagem: `Use no máximo ${LIMITE_FOTOS_GALERIA} fotos na galeria.` });
    }
    if (erros.length) return resposta({ ok: false, erros }, 422);

    const tituloPersistido = tituloInformado || tituloRascunho();
    let imagem = imagemAtual;
    if (capa) {
      imagem = await enviarImagemEditorialAdmin(
        token,
        capa,
        `Capa — ${tituloInformado || 'notícia em rascunho'}`,
        texto(form, 'imagem_alt'),
        true,
      );
    }

    const categoriaBruta = texto(form, 'categoria');
    const dataFato = textoOuNulo(form, 'data_fato');
    const base: Record<string, unknown> = {
      titulo: tituloPersistido,
      resumo: textoOuNulo(form, 'resumo'),
      conteudo: conteudoHtml,
      imagem,
      imagem_alt: textoOuNulo(form, 'imagem_alt'),
      imagem_legenda: textoOuNulo(form, 'imagem_legenda'),
      imagem_credito: textoOuNulo(form, 'imagem_credito'),
      categoria: categoriaBruta ? Number(categoriaBruta) : null,
      fonte_nome: fontePropria ? 'SINDQUIM' : textoOuNulo(form, 'fonte_nome'),
      fonte_url: fontePropria ? null : textoOuNulo(form, 'fonte_url'),
      empresa: textoOuNulo(form, 'empresa'),
      cidade: textoOuNulo(form, 'cidade'),
      data_fato: dataFato,
      fixado_banner: form.get('fixado_banner') === '1',
    };

    if (!existente) {
      const criado = await criarNoticiaAdmin(token, { ...base, status: 'draft', agendado_para: null }, true);
      postId = criado.id;
    } else {
      if (!tituloVisivelNoEditor(existente.titulo) && tituloInformado) {
        base.slug = gerarSlugEditorial(tituloInformado);
      }
      const statusDuranteEnvio = acao === 'publish' && existente.status === 'published' ? 'published' : 'draft';
      await atualizarNoticiaAdmin(token, existente.id, { ...base, status: statusDuranteEnvio }, true);
      postId = existente.id;
    }

    const ordens = valores(form, 'galeria_ordem');
    const legendas = valores(form, 'galeria_legenda');
    const creditos = valores(form, 'galeria_credito');
    for (let indice = 0; indice < galeriaExistenteIds.length; indice += 1) {
      const id = galeriaExistenteIds[indice];
      if (!id) continue;
      if (removidos.has(id)) {
        await removerFotoGaleriaAdmin(token, id, true);
      } else {
        await atualizarFotoGaleriaAdmin(token, id, {
          ordem: Number(ordens[indice] || indice + 1),
          texto_alternativo: galeriaExistenteAlt[indice] || null,
          legenda: legendas[indice] || null,
          credito: creditos[indice] || null,
        }, true);
      }
    }

    const novasOrdens = valores(form, 'galeria_nova_ordem');
    const novasLegendas = valores(form, 'galeria_nova_legenda');
    const novosCreditos = valores(form, 'galeria_nova_credito');
    for (let indice = 0; indice < galeriaNovas.length; indice += 1) {
      const arquivo = galeriaNovas[indice];
      const arquivoId = await enviarImagemEditorialAdmin(
        token,
        arquivo,
        `Galeria — ${tituloInformado || 'notícia em rascunho'}`,
        galeriaNovasAlt[indice] || '',
        true,
      );
      await criarFotoGaleriaAdmin(token, {
        post: postId,
        ordem: Number(novasOrdens[indice] || galeriaExistenteIds.length + indice + 1),
        imagem: arquivoId,
        texto_alternativo: galeriaNovasAlt[indice] || null,
        legenda: novasLegendas[indice] || null,
        credito: novosCreditos[indice] || null,
      }, true);
    }

    const estadoFinal: Record<string, unknown> = acao === 'publish'
      ? { status: 'published', agendado_para: null }
      : acao === 'schedule'
        ? { status: 'scheduled', agendado_para: new Date(agendadoTexto as string).toISOString() }
        : { status: 'draft', agendado_para: null };
    await atualizarNoticiaAdmin(token, postId, estadoFinal, true);

    return resposta({
      ok: true,
      id: postId,
      status: estadoFinal.status,
      mensagem: acao === 'publish'
        ? 'Notícia publicada no site.'
        : acao === 'schedule'
          ? 'Notícia agendada com sucesso.'
          : 'Rascunho salvo. Você pode continuar depois.',
    });
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return resposta({ ok: false, sessaoExpirada: true, erro: 'Sua sessão terminou. Entre novamente.' }, 401);
    }
    if (postId && estadoOriginal && estadoOriginal.status !== 'draft') {
      try {
        await atualizarNoticiaAdmin(token, postId, {
          status: estadoOriginal.status,
          agendado_para: estadoOriginal.agendado_para,
          publicado_em: estadoOriginal.publicado_em,
        }, true);
      } catch (erroRestauracao) {
        console.error('Falha ao restaurar o estado editorial anterior', erroRestauracao);
      }
    }
    console.error('Falha ao salvar notícia', erro);
    return resposta({
      ok: false,
      id: postId,
      parcial: Boolean(postId),
      erro: mensagemErro(erro),
    }, 500);
  }
};
