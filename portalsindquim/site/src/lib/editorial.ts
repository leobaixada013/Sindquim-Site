export type AcaoEditorial = 'draft' | 'publish' | 'schedule';

export interface DadosValidacaoEditorial {
  acao: AcaoEditorial;
  titulo: string;
  conteudo: string;
  possuiCapa: boolean;
  imagemAlt: string;
  agendadoPara: string | null;
  fontePropria: boolean;
  fonteNome: string;
  fonteUrl: string;
  galeriaAlternativos: string[];
}

export interface ErroEditorial {
  campo: string;
  mensagem: string;
}

export const MIMES_IMAGEM_EDITORIAL = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const TAMANHO_MAXIMO_IMAGEM = 20 * 1024 * 1024;
export const LIMITE_FOTOS_GALERIA = 20;

export function tituloRascunho(agora = new Date()): string {
  const data = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(agora);
  return `Rascunho sem título — ${data}`;
}

export function tituloVisivelNoEditor(titulo: string | null | undefined): string {
  const valor = String(titulo ?? '');
  return valor.startsWith('Rascunho sem título —') ? '' : valor;
}

export function gerarSlugEditorial(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'noticia';
}

export function textoParaHtmlEditorial(texto: string): string {
  const limpo = texto.replace(/\r\n?/g, '\n').trim();
  if (!limpo) return '';
  const escapar = (valor: string) => valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return limpo
    .split(/\n{2,}/)
    .map((paragrafo) => `<p>${escapar(paragrafo).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

export function htmlParaTextoEditorial(html: string | null | undefined): string {
  return String(html ?? '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function validarArquivoImagem(arquivo: File | null | undefined): string | null {
  if (!arquivo || arquivo.size === 0) return null;
  if (!MIMES_IMAGEM_EDITORIAL.has(arquivo.type)) {
    return 'Use uma imagem JPG, PNG ou WebP.';
  }
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
    return 'A imagem deve ter no máximo 20 MB.';
  }
  return null;
}

export function validarDadosEditoriais(dados: DadosValidacaoEditorial, agora = new Date()): ErroEditorial[] {
  if (dados.acao === 'draft') return [];

  const erros: ErroEditorial[] = [];
  if (!dados.titulo.trim()) erros.push({ campo: 'titulo', mensagem: 'Escreva o título da notícia.' });
  if (!dados.conteudo.trim()) erros.push({ campo: 'conteudo', mensagem: 'Escreva o texto da notícia.' });
  if (!dados.possuiCapa) erros.push({ campo: 'capa', mensagem: 'Envie uma foto de capa.' });
  if (!dados.imagemAlt.trim()) erros.push({ campo: 'imagem_alt', mensagem: 'Descreva o que aparece na foto de capa.' });

  dados.galeriaAlternativos.forEach((alt, indice) => {
    if (!alt.trim()) {
      erros.push({ campo: `galeria_alt_${indice}`, mensagem: `Descreva a foto ${indice + 1} da galeria.` });
    }
  });

  if (!dados.fontePropria) {
    if (!dados.fonteNome.trim()) erros.push({ campo: 'fonte_nome', mensagem: 'Informe o nome da fonte.' });
    try {
      const url = new URL(dados.fonteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo');
    } catch {
      erros.push({ campo: 'fonte_url', mensagem: 'Informe o link completo da fonte, começando com https://.' });
    }
  }

  if (dados.acao === 'schedule') {
    if (!dados.agendadoPara) {
      erros.push({ campo: 'agendado_para', mensagem: 'Escolha a data e a hora da publicação.' });
    } else {
      const data = new Date(dados.agendadoPara);
      if (Number.isNaN(data.getTime()) || data.getTime() <= agora.getTime()) {
        erros.push({ campo: 'agendado_para', mensagem: 'Escolha uma data futura para agendar.' });
      }
    }
  }

  return erros;
}
