import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { DESCRICAO_PADRAO, NOME_SITE } from '../lib/constantes';
import { getPosts } from '../lib/directus';

export const GET: APIRoute = async (contexto) => {
  const posts = await getPosts(20);
  return rss({
    title: `Notícias — ${NOME_SITE}`,
    description: DESCRICAO_PADRAO,
    site: contexto.site ?? 'http://localhost:4321',
    items: posts.map((post) => ({
      title: post.titulo,
      description: post.resumo ?? undefined,
      link: `/noticias/${post.slug}`,
      pubDate: new Date(post.date_created),
      categories: post.categoria ? [post.categoria.nome] : undefined,
    })),
    customData: '<language>pt-BR</language>',
  });
};
