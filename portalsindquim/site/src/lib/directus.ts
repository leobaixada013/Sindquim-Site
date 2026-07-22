import {
  createDirectus,
  createItem,
  readItems,
  readSingleton,
  rest,
  staticToken,
} from '@directus/sdk';
import { comCache } from './cache';
import type {
  Aviso,
  Beneficio,
  CardInstagram,
  Configuracoes,
  ConfiguracoesGlobais,
  Diretor,
  JuridicoDireito,
  JuridicoFAQ,
  JuridicoPlantao,
  Pagina,
  PaginaBeneficios,
  PaginaJuridico,
  Post,
  PostSocial,
  ProximoVideo,
  SchemaDirectus,
} from './tipos';

// DIRECTUS_URL precisa ser lida em runtime (process.env): import.meta.env é
// substituído no build, e a imagem Docker é buildada sem conhecer a rede final.
const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL ?? import.meta.env.PUBLIC_DIRECTUS_URL ?? DIRECTUS_URL;
const DIRECTUS_FORMS_TOKEN =
  process.env.DIRECTUS_FORMS_TOKEN ?? import.meta.env.DIRECTUS_FORMS_TOKEN;

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
  'imagem_alt',
  'imagem_legenda',
  'imagem_credito',
  'fonte_nome',
  'fonte_url',
  'empresa',
  'cidade',
  'data_fato',
  'youtube_url',
  'fixado_banner',
  'publicado_em',
  'agendado_para',
  'date_created',
  'date_updated',
  { categoria: ['id', 'nome', 'slug'] },
  { galeria: ['id', 'ordem', 'imagem', 'texto_alternativo', 'legenda', 'credito'] },
] as const;

export const PAGINA_BENEFICIOS_PADRAO: PaginaBeneficios = {
  hero_rotulo: 'Para associados',
  hero_titulo: 'Benefícios que ajudam no dia a dia',
  hero_resumo: 'Encontre vantagens ativas, confira quem pode usar e veja o passo a passo antes de entrar em contato.',
  introducao_titulo: 'Escolha o benefício certo para você',
  introducao_texto: 'As condições podem mudar. Confira a validade e confirme a disponibilidade com o sindicato antes de contratar.',
  aviso_titulo: 'Informação importante',
  aviso_texto: 'Os benefícios são vantagens adicionais e não substituem direitos trabalhistas. Os itens demonstrativos deste ambiente precisam ser substituídos por informações oficialmente aprovadas antes da publicação real.',
  cta_titulo: 'Ficou com dúvida?',
  cta_texto: 'A equipe do sindicato pode confirmar elegibilidade, documentos e condições vigentes.',
  cta_link_texto: 'Falar com o sindicato',
  cta_link_href: '/contato',
};

export const PAGINA_JURIDICO_PADRAO: PaginaJuridico = {
  hero_rotulo: 'Área Jurídica',
  hero_titulo: 'Apoio Jurídico Especializado',
  hero_resumo: 'Orientação e defesa dos seus direitos trabalhistas, do primeiro atendimento à representação em juízo.',
  hero_cta_primario_texto: 'Agendar Consulta',
  hero_cta_primario_href: '#agendamento',
  hero_cta_secundario_texto: 'Ver Direitos',
  hero_cta_secundario_href: '#direitos',
  direitos_rotulo: 'Seus Direitos',
  direitos_titulo: 'Seus Direitos Principais',
  agendamento_rotulo: 'Atendimento',
  agendamento_titulo: 'Agendamento de Triagem',
  agendamento_texto: 'Descreva brevemente sua situação para direcionarmos ao advogado certo. A triagem é gratuita para filiados e o retorno acontece em até 2 dias úteis.',
  plantao_titulo: 'Plantão Jurídico (Presencial)',
  chamado_titulo: 'Peça uma triagem jurídica',
  chamado_resumo: 'Conte o essencial. CPF e documento de apoio são opcionais na primeira triagem e podem ser solicitados depois, se realmente necessários.',
  chamado_prazo_texto: 'A equipe confirma o recebimento e informa o próximo passo em até 2 dias úteis.',
  chamado_privacidade_texto: 'Os dados são usados somente para triagem, contato e atendimento jurídico. O acesso é restrito à equipe autorizada e os registros seguem prazo de retenção definido pelo sindicato.',
  chamado_exigir_cpf: false,
  chamado_exigir_anexo: false,
  faq_rotulo: 'Dúvidas Frequentes',
  faq_titulo: 'Perguntas sobre a Área Jurídica',
  cta_rotulo: 'Fortaleça sua representação',
  cta_titulo: 'Ainda não é filiado?',
  cta_link_texto: 'Quero me filiar',
  cta_link_href: '/filie-se',
  seo_descricao: 'Orientação jurídica do sindicato, direitos trabalhistas, plantões e triagem segura para trabalhadores da categoria.',
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
    resposta: 'Sim. Ajuizamos e acompanhamos ações coletivas em nome da categoria. Fique atento aos avisos para aderir quando uma ação for aberta.',
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
  return id ? `${PUBLIC_DIRECTUS_URL}/assets/${encodeURIComponent(id)}` : null;
}

export const CONFIGURACOES_GLOBAIS_PADRAO: ConfiguracoesGlobais = {
  logo_site: null,
  modulo_juridico_ativo: true,
  modulo_youtube_ativo: false,
  modulo_instagram_ativo: false,
  youtube_channel_id: null,
  youtube_api_key: null,
  instagram_webhook_url: null,
  instagram_token: null,
};

export function normalizarConfiguracoesGlobais(
  config: Partial<ConfiguracoesGlobais> | null | undefined,
): ConfiguracoesGlobais {
  return {
    ...CONFIGURACOES_GLOBAIS_PADRAO,
    ...(config ?? {}),
    modulo_juridico_ativo: config?.modulo_juridico_ativo ?? true,
    modulo_youtube_ativo: config?.modulo_youtube_ativo ?? false,
    modulo_instagram_ativo: config?.modulo_instagram_ativo ?? false,
  };
}

export async function getConfiguracoes(): Promise<Configuracoes | null> {
  return comCache('configuracoes', TTL_CONTEUDO, () =>
    cliente.request(readSingleton('configuracoes')),
  );
}

export async function getConfiguracoesGlobais(): Promise<ConfiguracoesGlobais> {
  try {
    const config = await comCache('configuracoes-globais', TTL_CONTEUDO, () =>
      cliente.request(readSingleton('configuracoes_globais')),
    );
    return normalizarConfiguracoesGlobais(config as ConfiguracoesGlobais | null);
  } catch {
    return CONFIGURACOES_GLOBAIS_PADRAO;
  }
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
        sort: ['-publicado_em', '-date_created'],
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
        sort: ['-publicado_em', '-date_created'],
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
        filter: { status: { _eq: 'published' }, data_estreia: { _gte: '$NOW' } } as any,
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
      readItems('diretores', {
        fields: ['id', 'status', 'nome', 'cargo', 'grupo', 'foto', 'descricao', 'mandato_inicio', 'mandato_fim', 'ordem'],
        filter: { status: { _eq: 'published' } },
        sort: ['ordem', 'nome'],
        limit: -1,
      }),
    ),
  );
  return (diretores ?? []) as Diretor[];
}

export async function getCardsInstagram(limite: number): Promise<CardInstagram[]> {
  const cards = await comCache(`cards-instagram-${limite}`, TTL_CONTEUDO, () =>
    cliente.request(readItems('cards_instagram', { sort: ['-curtidas', '-id'], limit: limite })),
  );
  return (cards ?? []) as CardInstagram[];
}

export async function getPostsSociais(limite: number): Promise<PostSocial[]> {
  const posts = await comCache(`posts-sociais-${limite}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('posts_sociais', {
        fields: [
          'id',
          'legenda',
          'midia',
          'status',
          'data_publicacao',
          'link_original',
          'visualizacoes',
          'curtidas',
          'comentarios',
          'compartilhamentos',
          'ultima_sincronizacao_metricas',
        ],
        filter: { status: { _eq: 'publicado' } },
        sort: ['-data_publicacao', '-id'],
        limit: limite,
      }),
    ),
  );
  return (posts ?? []) as PostSocial[];
}

export async function getPagina(slug: string): Promise<Pagina | null> {
  const paginas = await comCache(`pagina-${slug}`, TTL_CONTEUDO, () =>
    cliente.request(
      readItems('paginas', { filter: { slug: { _eq: slug } }, limit: 1 }),
    ),
  );
  return (paginas?.[0] as Pagina | undefined) ?? null;
}

export async function getPaginaBeneficios(): Promise<PaginaBeneficios> {
  try {
    const pagina = await comCache('pagina-beneficios', TTL_CONTEUDO, () =>
      cliente.request(readSingleton('pagina_beneficios')),
    );
    return { ...PAGINA_BENEFICIOS_PADRAO, ...(pagina ?? {}) } as PaginaBeneficios;
  } catch {
    return PAGINA_BENEFICIOS_PADRAO;
  }
}

export async function getBeneficios(): Promise<Beneficio[]> {
  try {
    const beneficios = await comCache('beneficios', TTL_CONTEUDO, () =>
      cliente.request(
        readItems('beneficios', {
          filter: {
            status: { _eq: 'published' },
            _or: [{ validade_fim: { _null: true } }, { validade_fim: { _gte: '$NOW' } }],
          } as any,
          sort: ['ordem', 'titulo'],
          limit: -1,
        }),
      ),
    );
    return (beneficios ?? []) as Beneficio[];
  } catch {
    return [];
  }
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

// Formulários: sem cache e sem engolir erro — quem chama precisa saber se falhou.
export async function criarInscricaoNewsletter(email: string): Promise<void> {
  if (!DIRECTUS_FORMS_TOKEN) throw new Error('Token técnico de formulários não configurado.');
  const clienteFormulario = createDirectus<SchemaDirectus>(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_FORMS_TOKEN))
    .with(rest());
  await clienteFormulario.request(createItem('inscricoes_newsletter', { email }));
}

export async function criarMensagemContato(dados: {
  nome: string;
  email: string;
  mensagem: string;
}): Promise<void> {
  if (!DIRECTUS_FORMS_TOKEN) throw new Error('Token técnico de formulários não configurado.');
  const clienteFormulario = createDirectus<SchemaDirectus>(DIRECTUS_URL)
    .with(staticToken(DIRECTUS_FORMS_TOKEN))
    .with(rest());
  await clienteFormulario.request(createItem('mensagens_contato', dados));
}
