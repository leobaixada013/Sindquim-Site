import type { APIRoute } from 'astro';
import { getPosts } from '../lib/directus';

const PAGINAS_FIXAS = [
  '/',
  '/noticias',
  '/avisos',
  '/convencoes',
  '/diretoria',
  '/contato',
  '/filie-se',
  '/juridico',
  '/beneficios',
];

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('http://localhost:4321')).href.replace(/\/$/, '');
  const posts = await getPosts(500);

  const urls = [
    ...PAGINAS_FIXAS.map((caminho) => `<url><loc>${base}${caminho}</loc></url>`),
    ...posts.map(
      (post) =>
        `<url><loc>${base}/noticias/${post.slug}</loc><lastmod>${post.date_created.slice(0, 10)}</lastmod></url>`,
    ),
  ].join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
