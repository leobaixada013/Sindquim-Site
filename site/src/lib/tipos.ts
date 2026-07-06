export interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

export interface Post {
  id: string;
  status: 'published' | 'draft' | 'archived';
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
  status: 'published' | 'draft' | 'archived';
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
  status: 'published' | 'draft' | 'archived';
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
  configuracoes: Configuracoes;
  inscricoes_newsletter: InscricaoNewsletter[];
  mensagens_contato: MensagemContato[];
}
