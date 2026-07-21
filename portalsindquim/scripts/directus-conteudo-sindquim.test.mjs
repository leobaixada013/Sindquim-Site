import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSeAusente, DIRETORIA_CONFIRMADA, IMAGENS_NOTICIAS, NOTICIAS_SINDQUIM } from './directus-conteudo-sindquim.mjs';

test('conteúdo verificado tem slugs, fontes HTTPS e cidades', () => {
  assert.equal(new Set(NOTICIAS_SINDQUIM.map((item) => item.slug)).size, NOTICIAS_SINDQUIM.length);
  for (const item of NOTICIAS_SINDQUIM) {
    assert.match(item.fonte_url, /^https:\/\//);
    assert.ok(item.empresa);
    assert.ok(item.cidade);
    assert.ok(item.conteudo.includes('<p>'));
  }
});

test('cada notícia real tem capa, texto alternativo, crédito e origem verificável', () => {
  assert.equal(Object.keys(IMAGENS_NOTICIAS).length, NOTICIAS_SINDQUIM.length);
  for (const noticia of NOTICIAS_SINDQUIM) {
    const imagem = IMAGENS_NOTICIAS[noticia.slug];
    assert.ok(imagem, `Imagem ausente para ${noticia.slug}`);
    assert.match(imagem.arquivo, /^assets\/noticias\/.+\.jpg$/);
    assert.ok(imagem.alt.length >= 30);
    assert.ok(imagem.legenda.length >= 30);
    assert.ok(imagem.credito);
    assert.match(imagem.origem, /^https:\/\//);
  }
});

test('diretoria pública contém somente nomes confirmados pela pesquisa', () => {
  assert.deepEqual(DIRETORIA_CONFIRMADA.map((item) => item.nome), ['Herbert Passos Filho']);
  assert.equal(DIRETORIA_CONFIRMADA[0].cargo, 'Presidente');
});

test('criarSeAusente preserva um item editorial já existente', async () => {
  const chamadas = [];
  const existente = { id: 7 };
  const resultado = await criarSeAusente(async (metodo, caminho, corpo) => {
    chamadas.push({ metodo, caminho, corpo });
    return [existente];
  }, 'posts', 'slug', { slug: 'noticia-verificada', titulo: 'Título editado' });
  assert.deepEqual(resultado, { item: existente, criado: false });
  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].metodo, 'GET');
});
