export type TipoResultadoBusca = 'Notícia' | 'Benefício' | 'Página';

export interface ResultadoBusca {
  tipo: TipoResultadoBusca;
  titulo: string;
  resumo: string;
  href: string;
  campos: Array<string | null | undefined>;
}

export function textoBusca(valor: string | null | undefined): string {
  return (valor ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizarBusca(valor: string | null | undefined): string {
  return textoBusca(valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

export function resultadoCorresponde(resultado: ResultadoBusca, termo: string): boolean {
  const consulta = normalizarBusca(termo);
  if (consulta.length < 2) return false;
  return resultado.campos.some((campo) => normalizarBusca(campo).includes(consulta));
}

export function limitarResumo(valor: string | null | undefined, limite = 180): string {
  const texto = textoBusca(valor);
  if (texto.length <= limite) return texto;
  const recorte = texto.slice(0, limite + 1);
  const ultimoEspaco = recorte.lastIndexOf(' ');
  return `${recorte.slice(0, ultimoEspaco > limite * 0.65 ? ultimoEspaco : limite).trim()}…`;
}
