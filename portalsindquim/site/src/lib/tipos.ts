export interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

export type StatusPublicacao = 'published' | 'draft' | 'scheduled' | 'archived';

export interface Post {
  id: number | string;
  status: StatusPublicacao;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem: string | null;
  imagem_alt: string | null;
  imagem_legenda: string | null;
  imagem_credito: string | null;
  categoria: Categoria | null;
  galeria: PostGaleria[] | null;
  fonte_nome: string | null;
  fonte_url: string | null;
  empresa: string | null;
  cidade: string | null;
  data_fato: string | null;
  youtube_url: string | null;
  fixado_banner: boolean;
  publicado_em: string | null;
  agendado_para: string | null;
  date_created: string;
  date_updated: string | null;
}

export interface PostGaleria {
  id: number | string;
  post?: number | string;
  ordem: number | null;
  imagem: string;
  texto_alternativo: string | null;
  legenda: string | null;
  credito: string | null;
}

export interface Aviso {
  id: string;
  status: StatusPublicacao;
  titulo: string;
  mensagem_curta: string | null;
  urgente: boolean;
  data_inicio: string;
  data_fim: string | null;
  link: string | null;
  texto_link: string | null;
}

export interface ProximoVideo {
  id: string;
  status: StatusPublicacao;
  titulo: string;
  descricao: string | null;
  data_estreia: string;
  imagem: string | null;
  imagem_alt: string | null;
  link_estreia: string | null;
  episodio_numero: number | null;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  ultima_sincronizacao_metricas: string | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface Diretor {
  id: string;
  status: StatusPublicacao;
  nome: string;
  cargo: string | null;
  grupo: 'diretoria-executiva' | 'conselho-fiscal' | 'suplencia' | 'representacao' | null;
  foto: string | null;
  descricao: string | null;
  mandato_inicio: string | null;
  mandato_fim: string | null;
  ordem: number | null;
}

export interface CardInstagram {
  id: string;
  imagem: string | null;
  legenda: string | null;
  link: string | null;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  ultima_sincronizacao_metricas: string | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface PostSocial {
  id: number;
  legenda: string;
  midia: string | null;
  status: 'rascunho' | 'agendado' | 'publicado';
  data_publicacao: string | null;
  link_original: string | null;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  ultima_sincronizacao_metricas: string | null;
  date_created?: string | null;
  date_updated?: string | null;
}

export interface Pagina {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string | null;
}

export interface PaginaBeneficios {
  hero_rotulo: string | null;
  hero_titulo: string | null;
  hero_resumo: string | null;
  introducao_titulo: string | null;
  introducao_texto: string | null;
  aviso_titulo: string | null;
  aviso_texto: string | null;
  cta_titulo: string | null;
  cta_texto: string | null;
  cta_link_texto: string | null;
  cta_link_href: string | null;
}

export interface Beneficio {
  id: string;
  status: StatusPublicacao;
  ordem: number | null;
  titulo: string;
  categoria: 'saude' | 'educacao' | 'bem-estar' | 'servicos' | 'outros';
  resumo: string;
  detalhes: string | null;
  elegibilidade: string | null;
  como_usar: string | null;
  requisitos: string | null;
  validade_inicio: string | null;
  validade_fim: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  imagem: string | null;
  imagem_alt: string | null;
  destaque: boolean;
}

export interface PaginaJuridico {
  hero_rotulo: string | null;
  hero_titulo: string | null;
  hero_resumo: string | null;
  hero_cta_primario_texto: string | null;
  hero_cta_primario_href: string | null;
  hero_cta_secundario_texto: string | null;
  hero_cta_secundario_href: string | null;
  direitos_rotulo: string | null;
  direitos_titulo: string | null;
  agendamento_rotulo: string | null;
  agendamento_titulo: string | null;
  agendamento_texto: string | null;
  plantao_titulo: string | null;
  chamado_titulo: string | null;
  chamado_resumo: string | null;
  chamado_prazo_texto: string | null;
  chamado_privacidade_texto: string | null;
  chamado_exigir_cpf: boolean | null;
  chamado_exigir_anexo: boolean | null;
  faq_rotulo: string | null;
  faq_titulo: string | null;
  cta_rotulo: string | null;
  cta_titulo: string | null;
  cta_link_texto: string | null;
  cta_link_href: string | null;
  seo_descricao: string | null;
}

export interface JuridicoDireito {
  id: string;
  status: StatusPublicacao;
  ordem: number | null;
  titulo: string;
  sigla: string;
  descricao: string;
  cor: 'aco' | 'vermelho' | null;
  destaque: boolean;
  urgente: boolean;
  texto_link: string | null;
}

export interface JuridicoPlantao {
  id: string;
  status: StatusPublicacao;
  ordem: number | null;
  titulo: string;
  local: string;
  horario: string;
  observacao: string | null;
}

export interface JuridicoFAQ {
  id: string;
  status: StatusPublicacao;
  ordem: number | null;
  pergunta: string;
  resposta: string;
}

export interface Configuracoes {
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  youtube_channel_id: string | null;
  podcast_ativo: boolean | null;
  podcast_titulo: string | null;
  podcast_rotulo: string | null;
}

export interface ConfiguracoesGlobais {
  logo_site: string | null;
  modulo_juridico_ativo: boolean | null;
  modulo_youtube_ativo: boolean | null;
  modulo_instagram_ativo: boolean | null;
  youtube_channel_id: string | null;
  youtube_api_key: string | null;
  instagram_webhook_url: string | null;
  instagram_token: string | null;
}

export type StatusChamadoJuridico = 'Aberto' | 'Em Análise' | 'Concluído';

export interface ChamadoJuridico {
  id: string;
  nome: string;
  cpf: string | null;
  email: string;
  telefone: string;
  tipo: string;
  descricao: string;
  anexo: string | null;
  status: StatusChamadoJuridico;
  resposta_advogado: string | null;
  date_created?: string;
  date_updated?: string;
  respondido_em?: string | null;
  email_resposta_enviado_em?: string | null;
  aviso_privacidade_versao?: string | null;
  consentimento_em?: string | null;
  retencao_ate?: string | null;
}

export interface InscricaoNewsletter {
  id: string;
  email: string;
}

export interface MensagemContato {
  id: string;
  nome: string;
  email: string;
  mensagem: string;
}

export interface SchemaDirectus {
  posts: Post[];
  categorias: Categoria[];
  avisos: Aviso[];
  proximos_videos: ProximoVideo[];
  diretores: Diretor[];
  cards_instagram: CardInstagram[];
  posts_sociais: PostSocial[];
  paginas: Pagina[];
  pagina_beneficios: PaginaBeneficios;
  beneficios: Beneficio[];
  posts_galeria: PostGaleria[];
  pagina_juridico: PaginaJuridico;
  juridico_direitos: JuridicoDireito[];
  juridico_plantoes: JuridicoPlantao[];
  juridico_faq: JuridicoFAQ[];
  configuracoes: Configuracoes;
  configuracoes_globais: ConfiguracoesGlobais;
  chamados_juridicos: ChamadoJuridico[];
  inscricoes_newsletter: InscricaoNewsletter[];
  mensagens_contato: MensagemContato[];
}
