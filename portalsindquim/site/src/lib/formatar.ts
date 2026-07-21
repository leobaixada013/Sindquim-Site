const FUSO = 'America/Sao_Paulo';

export function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeZone: FUSO,
  }).format(new Date(iso));
}

export function formatarDataLonga(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: FUSO,
  }).format(new Date(iso));
}

/** Ex.: "sábado, 12 de julho · 19h00" — usado nos anúncios de próximos vídeos. */
export function formatarDataEstreia(iso: string): string {
  const data = new Date(iso);
  const dia = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: FUSO,
  }).format(data);
  const hora = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FUSO,
  })
    .format(data)
    .replace(':', 'h');
  return `${dia} · ${hora}`;
}

/** Dia e mês curtos (ex.: "12/07") para o painel de avisos rápidos. */
export function formatarDiaMes(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: FUSO,
  }).format(new Date(iso));
}
