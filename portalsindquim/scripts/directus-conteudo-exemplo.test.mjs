import test from 'node:test';
import assert from 'node:assert/strict';
import { criarSeAusente } from './directus-conteudo-exemplo.mjs';

test('criarSeAusente reutiliza registro existente pelo campo natural', async () => {
  const chamadas = [];
  const existente = { id: 1, slug: 'campanha-salarial' };

  const resultado = await criarSeAusente(
    (metodo, caminho, corpo) => {
      chamadas.push({ metodo, caminho, corpo });
      return Promise.resolve([existente]);
    },
    'categorias',
    'slug',
    { nome: 'Campanha Salarial', slug: 'campanha-salarial' },
  );

  assert.equal(resultado, existente);
  assert.deepEqual(chamadas, [
    {
      metodo: 'GET',
      caminho: '/items/categorias?filter[slug][_eq]=campanha-salarial&limit=1',
      corpo: undefined,
    },
  ]);
});

test('criarSeAusente cria registro quando ele não existe', async () => {
  const chamadas = [];
  const criado = { id: 2, slug: 'assembleia' };

  const resultado = await criarSeAusente(
    (metodo, caminho, corpo) => {
      chamadas.push({ metodo, caminho, corpo });
      return Promise.resolve(metodo === 'GET' ? [] : criado);
    },
    'categorias',
    'slug',
    { nome: 'Assembleia', slug: 'assembleia' },
  );

  assert.equal(resultado, criado);
  assert.deepEqual(chamadas, [
    {
      metodo: 'GET',
      caminho: '/items/categorias?filter[slug][_eq]=assembleia&limit=1',
      corpo: undefined,
    },
    {
      metodo: 'POST',
      caminho: '/items/categorias',
      corpo: { nome: 'Assembleia', slug: 'assembleia' },
    },
  ]);
});
