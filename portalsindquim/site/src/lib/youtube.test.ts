import { beforeEach, describe, expect, it } from 'vitest';
import { limparCache } from './cache';
import { criarUrlPlaylistUploads, parseYoutubeFeed, resolverChannelId } from './youtube';

const FEED_DOIS_VIDEOS = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015"
      xmlns:media="http://search.yahoo.com/mrss/"
      xmlns="http://www.w3.org/2005/Atom">
  <title>Canal do Sindicato</title>
  <entry>
    <id>yt:video:abc123DEF45</id>
    <yt:videoId>abc123DEF45</yt:videoId>
    <title>Assembleia geral aprova pauta</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=abc123DEF45"/>
    <published>2026-07-01T18:00:00+00:00</published>
    <media:group>
      <media:title>Assembleia geral aprova pauta</media:title>
      <media:thumbnail url="https://i2.ytimg.com/vi/abc123DEF45/hqdefault.jpg" width="480" height="360"/>
    </media:group>
  </entry>
  <entry>
    <id>yt:video:xyz789GHI01</id>
    <yt:videoId>xyz789GHI01</yt:videoId>
    <title>Podcast #12 — Direitos na demissão</title>
    <link rel="alternate" href="https://www.youtube.com/watch?v=xyz789GHI01"/>
    <published>2026-06-24T18:00:00+00:00</published>
    <media:group>
      <media:title>Podcast #12</media:title>
      <media:thumbnail url="https://i2.ytimg.com/vi/xyz789GHI01/hqdefault.jpg" width="480" height="360"/>
    </media:group>
  </entry>
</feed>`;

const FEED_UM_VIDEO = FEED_DOIS_VIDEOS.replace(
  /<entry>[\s\S]*?<\/entry>\s*(?=<entry>)/,
  '',
);

describe('parseYoutubeFeed', () => {
  it('extrai título, link, videoId, thumbnail e data de cada entrada', () => {
    const videos = parseYoutubeFeed(FEED_DOIS_VIDEOS);
    expect(videos).toHaveLength(2);
    expect(videos![0]).toEqual({
      titulo: 'Assembleia geral aprova pauta',
      link: 'https://www.youtube.com/watch?v=abc123DEF45',
      videoId: 'abc123DEF45',
      thumbnailUrl: 'https://i2.ytimg.com/vi/abc123DEF45/hqdefault.jpg',
      dataPublicacao: '2026-07-01T18:00:00+00:00',
    });
  });

  it('normaliza feed com uma única entrada para lista', () => {
    const videos = parseYoutubeFeed(FEED_UM_VIDEO);
    expect(videos).toHaveLength(1);
    expect(videos![0].videoId).toBe('xyz789GHI01');
  });

  it('retorna null para XML que não é feed', () => {
    expect(parseYoutubeFeed('<html><body>erro</body></html>')).toBeNull();
    expect(parseYoutubeFeed('não é xml')).toBeNull();
  });

  it('retorna null para feed sem entradas', () => {
    const vazio = '<feed xmlns="http://www.w3.org/2005/Atom"><title>x</title></feed>';
    expect(parseYoutubeFeed(vazio)).toBeNull();
  });
});

describe('resolverChannelId', () => {
  beforeEach(() => limparCache());

  it('extrai o id direto de URLs /channel/', async () => {
    const id = await resolverChannelId(
      'https://www.youtube.com/channel/UCabc123def456ghi',
    );
    expect(id).toBe('UCabc123def456ghi');
  });

  it('resolve handle buscando o link canônico da página', async () => {
    const html =
      '<html><head><link rel="canonical" href="https://www.youtube.com/channel/UCzz99xx88ww77vv"></head></html>';
    const id = await resolverChannelId(
      'https://www.youtube.com/@sindicato',
      async () => html,
    );
    expect(id).toBe('UCzz99xx88ww77vv');
  });

  it('retorna null quando a página não tem canal', async () => {
    const id = await resolverChannelId(
      'https://www.youtube.com/@inexistente',
      async () => '<html></html>',
    );
    expect(id).toBeNull();
  });

  it('retorna null para URL vazia', async () => {
    expect(await resolverChannelId('  ')).toBeNull();
  });
});

describe('criarUrlPlaylistUploads', () => {
  it('cria a playlist automática de uploads a partir do channel id', () => {
    expect(criarUrlPlaylistUploads('UC4sw8g2GwkMMikgm4n4fHmQ')).toBe(
      'https://www.youtube-nocookie.com/embed?listType=playlist&list=UU4sw8g2GwkMMikgm4n4fHmQ',
    );
  });

  it('recusa ids vazios ou inválidos', () => {
    expect(criarUrlPlaylistUploads(null)).toBeNull();
    expect(criarUrlPlaylistUploads('playlist-comum')).toBeNull();
  });
});
