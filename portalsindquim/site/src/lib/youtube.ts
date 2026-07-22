import { XMLParser } from 'fast-xml-parser';
import { comCache } from './cache';
import { getConfiguracoes, getConfiguracoesGlobais } from './directus';

export interface VideoYoutube {
  titulo: string;
  link: string;
  videoId: string;
  thumbnailUrl: string;
  dataPublicacao: string;
}

const TTL_FEED = 60 * 60_000;
const TTL_ERRO = 10 * 60_000;

/**
 * Extrai os vídeos do feed RSS público do canal
 * (https://www.youtube.com/feeds/videos.xml?channel_id=...).
 * Retorna null quando o XML não é um feed válido.
 */
export function parseYoutubeFeed(xml: string): VideoYoutube[] | null {
  let dados: unknown;
  try {
    dados = new XMLParser({ ignoreAttributes: false }).parse(xml);
  } catch {
    return null;
  }

  const feed = (dados as Record<string, any>)?.feed;
  if (!feed || feed.entry === undefined) return null;

  const entradas = Array.isArray(feed.entry) ? feed.entry : [feed.entry];
  return entradas.map((entrada: Record<string, any>) => ({
    titulo: String(entrada.title ?? ''),
    link: String(entrada.link?.['@_href'] ?? ''),
    videoId: String(entrada['yt:videoId'] ?? ''),
    thumbnailUrl: String(
      entrada['media:group']?.['media:thumbnail']?.['@_url'] ?? '',
    ),
    dataPublicacao: String(entrada.published ?? ''),
  }));
}

/**
 * Descobre o channel_id (UC...) a partir de qualquer URL de canal:
 * direto do caminho /channel/UC..., ou buscando o <link rel="canonical">
 * na página (para URLs de handle, ex.: youtube.com/@canal).
 */
export async function resolverChannelId(
  url: string,
  buscarPagina: (url: string) => Promise<string> = async (u) => {
    const resposta = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.text();
  },
): Promise<string | null> {
  const urlLimpa = url.trim();
  if (urlLimpa === '') return null;

  const direto = urlLimpa.match(/\/channel\/(UC[a-zA-Z0-9_-]{10,})/);
  if (direto) return direto[1];

  return comCache(
    `youtube-channel-${urlLimpa}`,
    TTL_FEED,
    async () => {
      const html = await buscarPagina(urlLimpa);
      const canonico = html.match(
        /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{10,})"/,
      );
      if (!canonico) throw new Error('canal não encontrado na página');
      return canonico[1];
    },
    TTL_ERRO,
  );
}

/** Vídeos mais recentes do canal configurado no Directus. */
export async function getVideosYoutube(limite: number): Promise<VideoYoutube[]> {
  const [config, globais] = await Promise.all([getConfiguracoes(), getConfiguracoesGlobais()]);
  if (config?.podcast_ativo !== true && globais.modulo_youtube_ativo !== true) return [];

  const channelId =
    globais.youtube_channel_id?.trim() ||
    config?.youtube_channel_id?.trim() ||
    (config?.youtube_url ? await resolverChannelId(config.youtube_url) : null);
  if (!channelId) return [];

  const videos = await comCache(
    `youtube-feed-${channelId}`,
    TTL_FEED,
    async () => {
      const resposta = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      const videosDoFeed = parseYoutubeFeed(await resposta.text());
      if (videosDoFeed === null) throw new Error('feed inválido');
      return videosDoFeed;
    },
    TTL_ERRO,
  );

  return (videos ?? []).slice(0, limite);
}
