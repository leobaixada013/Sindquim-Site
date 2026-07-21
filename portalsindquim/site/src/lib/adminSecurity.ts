import { createHash, randomBytes } from 'node:crypto';

const CSRF_SECRET_COOKIE = 'admin_csrf_secret';

function gerarSecretoString(): string {
  return randomBytes(32).toString('base64url');
}

function gerarTokenDaString(secret: string): string {
  // Token = Hash(secret + salt)
  // Como usamos SSL no admin, podemos manter o secret no httpOnly cookie
  // e fornecer um token validável para o front-end via meta tag
  return createHash('sha256').update(secret).digest('base64url');
}

type CookieStore = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  delete(name: string, options?: Record<string, unknown>): void;
};

export function obterOuCriarSegredoCsrf(cookies: CookieStore, seguro: boolean): string {
  const existente = cookies.get(CSRF_SECRET_COOKIE)?.value;
  if (existente && existente.length > 20) {
    return existente;
  }

  const novo = gerarSecretoString();
  cookies.set(CSRF_SECRET_COOKIE, novo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: seguro,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
  return novo;
}

export function tokenCsrfAtual(cookies: CookieStore, seguro: boolean): string {
  const secret = obterOuCriarSegredoCsrf(cookies, seguro);
  return gerarTokenDaString(secret);
}

export function validarTokenCsrf(cookies: CookieStore, tokenEnviado: string | null): boolean {
  if (!tokenEnviado) return false;
  const secret = cookies.get(CSRF_SECRET_COOKIE)?.value;
  if (!secret) return false;

  const tokenEsperado = gerarTokenDaString(secret);
  return tokenEnviado === tokenEsperado;
}

export function validarOrigemAdmin(request: Request, urlPublica?: string): boolean {
  const method = request.method;

  // Apenas mutações importam para proteção CSRF/Origin
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const hostsPermitidos = new Set([host].filter(Boolean));
  if (urlPublica) {
    try {
      hostsPermitidos.add(new URL(urlPublica).host);
    } catch {
      return false;
    }
  }

  // 1. Origin header é a defesa primária
  if (origin) {
    try {
      const originUrl = new URL(origin);
      // Confirma que a origem bate com o host (domain + port) acessado
      return hostsPermitidos.has(originUrl.host);
    } catch {
      return false;
    }
  }

  // 2. Fallback para Referer (para formulários HTML sem origin cross-site e bots legítimos locais)
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return hostsPermitidos.has(refererUrl.host);
    } catch {
      return false;
    }
  }

  // Mutações sem origin/referer (como fetches manuais de extensões ou curl)
  // Devem ser processadas validando-se o Token CSRF adicionalmente no middleware
  return false;
}
