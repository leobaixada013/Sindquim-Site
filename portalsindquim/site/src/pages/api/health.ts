import type { APIRoute } from 'astro';

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';

export const GET: APIRoute = async () => {
  let directus = false;
  try {
    const resposta = await fetch(`${DIRECTUS_URL.replace(/\/$/, '')}/server/ping`, {
      signal: AbortSignal.timeout(2500),
    });
    directus = resposta.ok;
  } catch {
    directus = false;
  }

  return new Response(JSON.stringify({
    status: directus ? 'ok' : 'degraded',
    site: true,
    directus,
  }), {
    status: directus ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
