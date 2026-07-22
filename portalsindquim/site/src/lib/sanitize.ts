import DOMPurify from 'isomorphic-dompurify';

const TAGS_PERMITIDAS = [
  'p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'blockquote', 'a', 'figure', 'figcaption',
];

const ATRIBUTOS_PERMITIDOS = ['href', 'title', 'target', 'rel'];

export function sanitizarHtmlEditorial(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: TAGS_PERMITIDAS,
    ALLOWED_ATTR: ATRIBUTOS_PERMITIDOS,
    ALLOW_DATA_ATTR: false,
  });
}

export function serializarJsonLd(valor: unknown): string {
  return JSON.stringify(valor).replace(/</g, '\\u003c');
}

export function urlHttpSegura(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
