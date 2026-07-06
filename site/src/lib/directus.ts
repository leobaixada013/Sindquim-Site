import {
  createDirectus,
  createItem,
  readItems,
  readSingleton,
  rest,
} from '@directus/sdk';
import { comCache } from './cache';
import type {
  Aviso,
  CardInstagram,
  Configuracoes,
  Diretor,
  Documento,
  Pagina,
  Post,
  ProximoVideo,
  SchemaDirectus,
} from './tipos';

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
const PUBLIC_DIRECTUS_URL =
  import.meta.env.PUBLIC_DIRECTUS_URL ?? DIRECTUS_URL;

const TTL_CONTEUDO = 60_000;

const cliente = createDirectus<SchemaDirectus>(DIRECTUS_URL).with(rest());

const CAMPOS_POST = [
  'id',
  'status',
  'titulo',
  'slug',
  'resumo',
  'conteudo',
  'imagem',
  'fixado_banner',
  'date_created',
  { categoria: ['id', 'nome', 'slug'] },
] as const;

/** Monta a URL pública de uma imagem com as transformações do Directus. */
export function urlImagem(
  id: string | null,
  opcoes: { largura?: number; altura?: number; qualidade?: number } = {},
): string | null {
  if (!id) return null;
  const params = new URLSearchParams();
  if (opcoes.largura) params.set('width', String(opcoes.largura));
  if (opcoes.altura) params.set('height', String(opcoes.altura));
  params.set('fit', 'cover');
  params.set('format', 'webp');
  params.set('quality', String(opcoes.qualidade ?? 75));
  return `${PUBLIC_DIRECTUS_URL}/assets/${id}?${params}`;
}

export function urlArquivo(id: string | null): string | null {
  return id ? `${PUBLIC_DIRECTUS_URL}/assets/${id}` : null;
}

export async function getConfiguracoes(): Promise<Configuracoes | null> {
  return comCache('configuracoes', TTL_CONTEUDO, () =>
    cliente.request(readSingleton('configuracoes')),
  );
}

/**
 * O banner da home é o post publicado mais recente marcado como
 * "fixado_banner"; sem post fixado, o post mais recente assume.
 */
export async function getPostBanner(): Promise<Post | null> {
  const fixados = await comCache('post-banner', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('posts', {
        fields: CAMPOS_POST,
        filter: { status: { _eq: 'published' }, fixado_banner: { _eq: true } },
        sort: ['-date_created'],
        limit: 1,
      }),
    ),
  );
  if (fixados && fixados.length > 0) return fixados[0] as Post;
  const recentes = await getPosts(1);
  return recentes[0] ?? null;
}

export async function getPosts(limite: number, deslocamento = 0): Promise<Post[]> {
  const posts = await comCache(`posts-${limite}-${deslocamento}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('posts', {
        fields: CAMPOS_POST,
        filter: { status: { _eq: 'published' } },
        sort: ['-date_created'],
        limit: limite,
        offset: deslocamento,
      }),
    ),
  );
  return (posts ?? []) as Post[];
}

export async function contarPosts(): Promise<number> {
  const resultado = await comCache('posts-total', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('posts', {
        filter: { status: { _eq: 'published' } },
        aggregate: { count: '*' },
      }),
    ),
  );
  const bruto = (resultado as Array<{ count: string | number }> | null)?.[0]?.count;
  return bruto ? Number(bruto) : 0;
}

export async function getPostPorSlug(slug: string): Promise<Post | null> {
  const posts = await comCache(`post-${slug}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('posts', {
        fields: CAMPOS_POST,
        filter: { status: { _eq: 'published' }, slug: { _eq: slug } },
        limit: 1,
      }),
    ),
  );
  return (posts?.[0] as Post | undefined) ?? null;
}

const FILTRO_AVISO_VIGENTE = {
  status: { _eq: 'published' },
  data_inicio: { _lte: '$NOW' },
  _or: [{ data_fim: { _null: true } }, { data_fim: { _gte: '$NOW' } }],
};

export async function getAvisoUrgente(): Promise<Aviso | null> {
  const avisos = await comCache('aviso-urgente', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('avisos', {
        filter: { ...FILTRO_AVISO_VIGENTE, urgente: { _eq: true } },
        sort: ['-data_inicio'],
        limit: 1,
      }),
    ),
  );
  return (avisos?.[0] as Aviso | undefined) ?? null;
}

export async function getAvisosRapidos(limite: number): Promise<Aviso[]> {
  const avisos = await comCache(`avisos-rapidos-${limite}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('avisos', {
        filter: { ...FILTRO_AVISO_VIGENTE, urgente: { _eq: false } },
        sort: ['-data_inicio'],
        limit: limite,
      }),
    ),
  );
  return (avisos ?? []) as Aviso[];
}

/** Anúncios de próximos vídeos ainda não estreados, do mais próximo ao mais distante. */
export async function getProximosVideos(): Promise<ProximoVideo[]> {
  const videos = await comCache('proximos-videos', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('proximos_videos', {
        filter: { status: { _eq: 'published' }, data_estreia: { _gte: '$NOW' } },
        sort: ['data_estreia'],
        limit: 3,
      }),
    ),
  );
  return (videos ?? []) as ProximoVideo[];
}

export async function getDiretores(): Promise<Diretor[]> {
  const diretores = await comCache('diretores', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('diretores', { sort: ['ordem'], limit: -1 }),
    ),
  );
  return (diretores ?? []) as Diretor[];
}

export async function getDocumentos(): Promise<Documento[]> {
  const documentos = await comCache('documentos', TTL_CONTEUDO, () =>
    cliente.request(
      readItems('documentos', { sort: ['-ano', 'titulo'], limit: -1 }),
    ),
  );
  return (documentos ?? []) as Documento[];
}

export async function getCardsInstagram(limite: number): Promise<CardInstagram[]> {
  const cards = await comCache(`cards-instagram-${limite}`, TTL_CONTEUDO, () =>
    cliente.request(readItems('cards_instagram', { limit: limite })),
  );
  return (cards ?? []) as CardInstagram[];
}

export async function getPagina(slug: string): Promise<Pagina | null> {
  const paginas = await comCache(`pagina-${slug}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('paginas', { filter: { slug: { _eq: slug } }, limit: 1 }),
    ),
  );
  return (paginas?.[0] as Pagina | undefined) ?? null;
}

// Formulários: sem cache e sem engolir erro — quem chama precisa saber se falhou.
export async function criarInscricaoNewsletter(email: string): Promise<void> {
  await cliente.request(createItem('inscricoes_newsletter', { email }));
}

export async function criarMensagemContato(dados: {
  nome: string;
  email: string;
  mensagem: string;
}): Promise<void> {
  await cliente.request(createItem('mensagens_contato', dados));
}
