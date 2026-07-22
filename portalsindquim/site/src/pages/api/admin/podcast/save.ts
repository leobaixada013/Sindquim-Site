import type { APIRoute } from 'astro';
import {
  atualizarPodcastConfigAdmin,
  atualizarProximoPodcastAdmin,
  criarProximoPodcastAdmin,
  enviarImagemEditorialAdmin,
  erroAutenticacaoExpirada,
  exigirAcessoEditorial,
  getAdminPodcastData,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';
import { validarArquivoImagem } from '../../../../lib/editorial';
import { parseYoutubeFeed, resolverChannelId } from '../../../../lib/youtube';

function texto(form: FormData, nome: string): string {
  return String(form.get(nome) ?? '').trim();
}

function resposta(dados: Record<string, unknown>, status = 200): Response {
  return Response.json(dados, { status });
}

function urlHttpValida(valor: string): boolean {
  if (!valor) return true;
  try {
    return ['http:', 'https:'].includes(new URL(valor).protocol);
  } catch {
    return false;
  }
}

function mensagemErro(erro: unknown): string {
  const mensagem = String((erro as { message?: string })?.message ?? '').trim();
  if (/permission|forbidden|not allowed/i.test(mensagem)) return 'Sua conta não tem permissão para salvar o podcast.';
  return mensagem || 'Não foi possível salvar. Tente novamente.';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return resposta({ ok: false, sessaoExpirada: true, erro: 'Sua sessão terminou. Entre novamente.' }, 401);

  try {
    const form = await request.formData();
    await exigirAcessoEditorial(token);
    const secao = texto(form, 'secao');

    if (secao === 'canal') {
      const youtubeUrl = texto(form, 'youtube_url');
      const podcastTitulo = texto(form, 'podcast_titulo') || 'Podcast Reação Química';
      const podcastRotulo = texto(form, 'podcast_rotulo') || 'Informação e debate';
      const ativo = form.get('podcast_ativo') === '1';

      if (!youtubeUrl || !urlHttpValida(youtubeUrl) || !/youtube\.com|youtu\.be/i.test(new URL(youtubeUrl).hostname)) {
        return resposta({ ok: false, erro: 'Informe um endereço válido do canal no YouTube.' }, 422);
      }

      const channelId = await resolverChannelId(youtubeUrl);
      if (!channelId) return resposta({ ok: false, erro: 'Não conseguimos identificar esse canal. Confira o endereço e tente novamente.' }, 422);

      const feed = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
        signal: AbortSignal.timeout(8000),
      });
      const videos = feed.ok ? parseYoutubeFeed(await feed.text()) : null;
      if (!videos) return resposta({ ok: false, erro: 'O canal foi encontrado, mas o YouTube não retornou os episódios agora. Tente novamente em alguns minutos.' }, 422);

      await atualizarPodcastConfigAdmin(token, {
        youtube_url: youtubeUrl,
        youtube_channel_id: channelId,
        podcast_ativo: ativo,
        podcast_titulo: podcastTitulo.slice(0, 120),
        podcast_rotulo: podcastRotulo.slice(0, 80),
      }, true);
      return resposta({ ok: true, mensagem: ativo ? 'Podcast configurado e visível na página inicial.' : 'Configuração salva. O podcast continua oculto no site.', channelId });
    }

    if (secao === 'episodio') {
      const publicar = texto(form, 'acao') === 'publish';
      const id = texto(form, 'id');
      const titulo = texto(form, 'titulo');
      const descricao = texto(form, 'descricao');
      const imagemAlt = texto(form, 'imagem_alt');
      const linkEstreia = texto(form, 'link_estreia');
      const episodioNumeroBruto = texto(form, 'episodio_numero');
      const dataBruta = texto(form, 'data_estreia');
      const data = dataBruta ? new Date(dataBruta) : null;
      const arquivoBruto = form.get('imagem');
      const arquivo = arquivoBruto instanceof File && arquivoBruto.size > 0 ? arquivoBruto : null;
      const dadosAtuais = await getAdminPodcastData(token);
      const existente = id ? dadosAtuais.proximosVideos.find((item) => String(item.id) === id) ?? null : null;

      if (id && !existente) return resposta({ ok: false, erro: 'Esse anúncio não foi encontrado. Recarregue a página.' }, 404);
      if (publicar && titulo.length < 5) return resposta({ ok: false, erro: 'Escreva o título do próximo episódio.' }, 422);
      if (publicar && (!data || Number.isNaN(data.getTime()) || data.getTime() <= Date.now())) {
        return resposta({ ok: false, erro: 'Escolha uma data e hora futuras para a estreia.' }, 422);
      }
      if (dataBruta && (!data || Number.isNaN(data.getTime()))) return resposta({ ok: false, erro: 'A data informada não é válida.' }, 422);
      if (linkEstreia && !urlHttpValida(linkEstreia)) return resposta({ ok: false, erro: 'O link da estreia não é válido.' }, 422);
      const erroArquivo = validarArquivoImagem(arquivo);
      if (erroArquivo) return resposta({ ok: false, erro: erroArquivo }, 422);
      if (publicar && !arquivo && !existente?.imagem) return resposta({ ok: false, erro: 'Escolha a arte do próximo episódio.' }, 422);
      if (publicar && !imagemAlt) return resposta({ ok: false, erro: 'Descreva o que aparece na arte para garantir acessibilidade.' }, 422);

      let imagem = existente?.imagem ?? null;
      if (arquivo) {
        imagem = await enviarImagemEditorialAdmin(token, arquivo, `Podcast — ${titulo || 'próximo episódio'}`, imagemAlt, true);
      }

      const dados = {
        status: publicar ? 'published' : 'draft',
        titulo: titulo || 'Próximo episódio (rascunho)',
        descricao: descricao || null,
        data_estreia: data ? data.toISOString() : null,
        imagem,
        imagem_alt: imagemAlt || null,
        link_estreia: linkEstreia || null,
        episodio_numero: episodioNumeroBruto ? Number(episodioNumeroBruto) : null,
      };
      const salvo = existente
        ? await atualizarProximoPodcastAdmin(token, existente.id, dados, true)
        : await criarProximoPodcastAdmin(token, dados, true);
      return resposta({ ok: true, id: salvo.id, status: dados.status, mensagem: publicar ? 'Próximo episódio publicado na página inicial.' : 'Rascunho do próximo episódio salvo.' });
    }

    return resposta({ ok: false, erro: 'Ação desconhecida.' }, 400);
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return resposta({ ok: false, sessaoExpirada: true, erro: 'Sua sessão terminou. Entre novamente.' }, 401);
    }
    console.error('Falha ao salvar podcast', erro);
    return resposta({ ok: false, erro: mensagemErro(erro) }, 500);
  }
};
