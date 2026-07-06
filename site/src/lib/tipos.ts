export interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

type StatusPublicacao = 'published' | 'draft' | 'archived';

export interface Post {
  id: string;
  status: StatusPublicacao;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem: string | null;
  categoria: Categoria | null;
  fixado_banner: boolean;
  date_created: string;
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
}

export interface Diretor {
  id: string;
  nome: string;
  cargo: string | null;
  foto: string | null;
  ordem: number | null;
}

export interface Documento {
  id: string;
  titulo: string;
  tipo: 'convencao' | 'acordo' | 'ata' | 'edital' | 'outro';
  ano: number | null;
  arquivo: string | null;
}

export interface CardInstagram {
  id: string;
  imagem: string | null;
  legenda: string | null;
  link: string | null;
}

export interface Pagina {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string | null;
}

export interface PaginaJuridico {
  hero_rotulo: string | null;
  hero_titulo: string | null;
  hero_resumo: string | null;
  hero_cta_primario_texto: string | null;
  hero_cta_secundario_texto: string | null;
  direitos_rotulo: string | null;
  direitos_titulo: string | null;
  agendamento_rotulo: string | null;
  agendamento_titulo: string | null;
  agendamento_texto: string | null;
  plantao_titulo: string | null;
  faq_rotulo: string | null;
  faq_titulo: string | null;
  cta_rotulo: string | null;
  cta_titulo: string | null;
  cta_link_texto: string | null;
  cta_link_href: string | null;
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

export interface JuridicoCampoFormulario {
  id: string;
  status: StatusPublicacao;
  ordem: number | null;
  chave: string;
  rotulo: string;
  tipo: 'text' | 'email' | 'tel' | 'select' | 'textarea';
  obrigatorio: boolean;
  placeholder: string | null;
  opcoes: string | null;
  max_length: number | null;
}

export interface Configuracoes {
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  youtube_channel_id: string | null;
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
  documentos: Documento[];
  cards_instagram: CardInstagram[];
  paginas: Pagina[];
  pagina_juridico: PaginaJuridico;
  juridico_direitos: JuridicoDireito[];
  juridico_plantoes: JuridicoPlantao[];
  juridico_faq: JuridicoFAQ[];
  juridico_campos_formulario: JuridicoCampoFormulario[];
  configuracoes: Configuracoes;
  inscricoes_newsletter: InscricaoNewsletter[];
  mensagens_contato: MensagemContato[];
}
