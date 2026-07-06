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
  JuridicoCampoFormulario,
  JuridicoDireito,
  JuridicoFAQ,
  JuridicoPlantao,
  Pagina,
  PaginaJuridico,
  Post,
  ProximoVideo,
  SchemaDirectus,
} from './tipos';

// DIRECTUS_URL precisa ser lida em runtime (process.env): import.meta.env é
// substituído no build, e a imagem Docker é buildada sem conhecer a rede final.
const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL ?? import.meta.env.PUBLIC_DIRECTUS_URL ?? DIRECTUS_URL;

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

export const PAGINA_JURIDICO_PADRAO: PaginaJuridico = {
  hero_rotulo: 'Área Jurídica',
  hero_titulo: 'Apoio Jurídico Especializado',
  hero_resumo: 'Orientação e defesa dos seus direitos trabalhistas, do primeiro atendimento à representação em juízo.',
  hero_cta_primario_texto: 'Agendar Consulta',
  hero_cta_secundario_texto: 'Ver Direitos',
  direitos_rotulo: 'Seus Direitos',
  direitos_titulo: 'Seus Direitos Principais',
  agendamento_rotulo: 'Atendimento',
  agendamento_titulo: 'Agendamento de Triagem',
  agendamento_texto: 'Descreva brevemente sua situação para direcionarmos ao advogado certo. A triagem é gratuita para filiados e o retorno acontece em até 2 dias úteis.',
  plantao_titulo: 'Plantão Jurídico (Presencial)',
  faq_rotulo: 'Dúvidas Frequentes',
  faq_titulo: 'Perguntas sobre a Área Jurídica',
  cta_rotulo: 'Fortaleça sua representação',
  cta_titulo: 'Ainda não é filiado?',
  cta_link_texto: 'Quero me filiar',
  cta_link_href: '/filie-se',
};

export const JURIDICO_DIREITOS_PADRAO: JuridicoDireito[] = [
  {
    id: 'jornada',
    status: 'published',
    ordem: 1,
    titulo: 'Jornada de Trabalho e Horas Extras',
    sigla: 'JOR',
    descricao: 'Controle de ponto, banco de horas, adicional noturno e pagamento correto das horas extras. Saiba o que a lei garante.',
    cor: 'aco',
    destaque: true,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    id: 'saude',
    status: 'published',
    ordem: 2,
    titulo: 'Saúde e Segurança',
    sigla: 'SAU',
    descricao: 'Insalubridade, periculosidade, EPIs e afastamentos. Ambiente de trabalho seguro é um direito.',
    cor: 'aco',
    destaque: false,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    id: 'rescisao',
    status: 'published',
    ordem: 3,
    titulo: 'Rescisão e Demissão',
    sigla: 'RES',
    descricao: 'Verbas rescisórias, aviso prévio, FGTS e homologação. Confira se seus valores estão corretos.',
    cor: 'aco',
    destaque: false,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    id: 'assedio',
    status: 'published',
    ordem: 4,
    titulo: 'Assédio e Discriminação',
    sigla: 'ASS',
    descricao: 'Assédio moral, sexual ou discriminação no ambiente de trabalho. O atendimento é sigiloso e prioritário.',
    cor: 'vermelho',
    destaque: true,
    urgente: true,
    texto_link: 'Ler detalhes',
  },
];

export const JURIDICO_PLANTOES_PADRAO: JuridicoPlantao[] = [
  {
    id: 'plantao-presencial',
    status: 'published',
    ordem: 1,
    titulo: 'Plantão Jurídico (Presencial)',
    local: 'Sede do Sindicato, 3º andar',
    horario: 'Terças e quintas, das 14h às 17h',
    observacao: null,
  },
];

export const JURIDICO_FAQ_PADRAO: JuridicoFAQ[] = [
  {
    id: 'custo-consulta',
    status: 'published',
    ordem: 1,
    pergunta: 'Preciso pagar pelas consultas jurídicas?',
    resposta: 'Não. A triagem e a orientação inicial são gratuitas para filiados em dia. Custas processuais e honorários de eventual ação são informados de forma transparente antes de qualquer providência.',
  },
  {
    id: 'acompanhar-processo',
    status: 'published',
    ordem: 2,
    pergunta: 'Como faço para acompanhar o andamento do meu processo?',
    resposta: 'Você recebe atualizações por telefone e pode consultar o departamento jurídico presencialmente durante o plantão, levando sua matrícula sindical.',
  },
  {
    id: 'acoes-coletivas',
    status: 'published',
    ordem: 3,
    pergunta: 'O sindicato me representa em ações coletivas?',
    resposta: 'Sim. Ajuizamos e acompanhamos ações coletivas em nome da categoria, além de atuar em acordos e convenções. Fique atento aos avisos para aderir quando uma ação for aberta.',
  },
];

export const JURIDICO_CAMPOS_FORMULARIO_PADRAO: JuridicoCampoFormulario[] = [
  {
    id: 'telefone',
    status: 'published',
    ordem: 1,
    chave: 'telefone',
    rotulo: 'Telefone',
    tipo: 'tel',
    obrigatorio: true,
    placeholder: '(00) 00000-0000',
    opcoes: null,
    max_length: 40,
  },
  {
    id: 'matricula',
    status: 'published',
    ordem: 2,
    chave: 'matricula',
    rotulo: 'Matrícula Sindical',
    tipo: 'text',
    obrigatorio: false,
    placeholder: null,
    opcoes: null,
    max_length: 40,
  },
  {
    id: 'natureza',
    status: 'published',
    ordem: 3,
    chave: 'natureza',
    rotulo: 'Natureza do Problema',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione...',
    opcoes: 'Demissão / Rescisão\nHoras Extras / Jornada\nAssédio / Discriminação\nAcidente de Trabalho\nDúvida Geral',
    max_length: 80,
  },
];

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

export async function getPaginaJuridico(): Promise<PaginaJuridico> {
  try {
    const pagina = await comCache('pagina-juridico', TTL_CONTEUDO, () =>
      cliente.request(readSingleton('pagina_juridico')),
    );
    return { ...PAGINA_JURIDICO_PADRAO, ...(pagina ?? {}) } as PaginaJuridico;
  } catch {
    return PAGINA_JURIDICO_PADRAO;
  }
}

export async function getJuridicoDireitos(): Promise<JuridicoDireito[]> {
  try {
    const direitos = await comCache('juridico-direitos', TTL_CONTEUDO, () =>
      cliente.request(
        readItems('juridico_direitos', {
          filter: { status: { _eq: 'published' } },
          sort: ['ordem'],
          limit: -1,
        }),
      ),
    );
    return direitos && direitos.length > 0 ? (direitos as JuridicoDireito[]) : JURIDICO_DIREITOS_PADRAO;
  } catch {
    return JURIDICO_DIREITOS_PADRAO;
  }
}

export async function getJuridicoPlantoes(): Promise<JuridicoPlantao[]> {
  try {
    const plantoes = await comCache('juridico-plantoes', TTL_CONTEUDO, () =>
      cliente.request(
        readItems('juridico_plantoes', {
          filter: { status: { _eq: 'published' } },
          sort: ['ordem'],
          limit: -1,
        }),
      ),
    );
    return plantoes && plantoes.length > 0 ? (plantoes as JuridicoPlantao[]) : JURIDICO_PLANTOES_PADRAO;
  } catch {
    return JURIDICO_PLANTOES_PADRAO;
  }
}

export async function getJuridicoFAQ(): Promise<JuridicoFAQ[]> {
  try {
    const faq = await comCache('juridico-faq', TTL_CONTEUDO, () =>
      cliente.request(
        readItems('juridico_faq', {
          filter: { status: { _eq: 'published' } },
          sort: ['ordem'],
          limit: -1,
        }),
      ),
    );
    return faq && faq.length > 0 ? (faq as JuridicoFAQ[]) : JURIDICO_FAQ_PADRAO;
  } catch {
    return JURIDICO_FAQ_PADRAO;
  }
}

export async function getJuridicoCamposFormulario(): Promise<JuridicoCampoFormulario[]> {
  try {
    const campos = await comCache('juridico-campos-formulario', TTL_CONTEUDO, () =>
      cliente.request(
        readItems('juridico_campos_formulario', {
          filter: { status: { _eq: 'published' } },
          sort: ['ordem'],
          limit: -1,
        }),
      ),
    );
    return campos && campos.length > 0 ? (campos as JuridicoCampoFormulario[]) : JURIDICO_CAMPOS_FORMULARIO_PADRAO;
  } catch {
    return JURIDICO_CAMPOS_FORMULARIO_PADRAO;
  }
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
