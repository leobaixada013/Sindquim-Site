import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '..');
const pacote = resolve(raiz, 'deploy/directus/extensions/directus-extension-portal-editorial/package.json');

async function carregarHookParaTeste() {
  const manifest = JSON.parse(await readFile(pacote, 'utf8'));
  const entrada = resolve(dirname(pacote), manifest['directus:extension'].path);
  const fonte = (await readFile(entrada, 'utf8')).replace(
    "import { InvalidPayloadError } from '@directus/errors';",
    "class InvalidPayloadError extends Error { constructor(dados) { super(dados?.reason || 'Dados inválidos'); this.status = 400; } }",
  );
  const url = `data:text/javascript;base64,${Buffer.from(fonte).toString('base64')}`;
  return { entrada, modulo: await import(url) };
}

test('o hook editorial empacotado existe no caminho declarado pelo Directus', async () => {
  const { entrada, modulo } = await carregarHookParaTeste();
  await access(entrada);
  assert.equal(typeof modulo.default, 'function');
});

test('o hook cria slug único antes de inserir uma notícia', async () => {
  const { modulo: { default: registrar } } = await carregarHookParaTeste();
  const filtros = new Map();
  registrar({
    filter(nome, handler) { filtros.set(nome, handler); },
    schedule() {},
  }, {
    database() {
      return {
        where() { return this; },
        whereNot() { return this; },
        async first() { return undefined; },
      };
    },
    logger: { info() {} },
  });

  const criar = filtros.get('items.create');
  assert.equal(typeof criar, 'function');
  const payload = await criar({ titulo: 'Ação química em São Paulo', status: 'draft' }, { collection: 'posts' });
  assert.equal(payload.slug, 'acao-quimica-em-sao-paulo');
});

test('alterar o título não muda o slug de uma notícia existente', async () => {
  const { modulo: { default: registrar } } = await carregarHookParaTeste();
  const filtros = new Map();
  registrar({
    filter(nome, handler) { filtros.set(nome, handler); },
    schedule() {},
  }, {
    database(colecao) {
      assert.equal(colecao, 'posts');
      return {
        where() { return this; },
        async first() { return { id: 42, status: 'draft', slug: 'titulo-original', titulo: 'Título original' }; },
      };
    },
    logger: { info() {} },
  });

  const atualizar = filtros.get('items.update');
  const payload = await atualizar({ titulo: 'Novo título editorial' }, { collection: 'posts', keys: [42] });
  assert.deepEqual(payload, { titulo: 'Novo título editorial' });
});

test('mantém a primeira data de publicação ao editar notícia publicada', async () => {
  const { modulo: { default: registrar } } = await carregarHookParaTeste();
  const filtros = new Map();
  registrar({ filter(nome, handler) { filtros.set(nome, handler); }, schedule() {} }, {
    database(colecao) {
      if (colecao === 'posts') return {
        where() { return this; },
        async first() { return { id: 7, status: 'published', titulo: 'Notícia', conteudo: '<p>Texto</p>', imagem: 'arquivo', imagem_alt: 'Descrição', fonte_nome: 'SINDQUIM', publicado_em: '2026-07-01T12:00:00.000Z' }; },
      };
      return {
        where() { return this; },
        whereNull() { return this; },
        orWhere() { return this; },
        async first() { return undefined; },
      };
    },
    logger: { info() {}, warn() {} },
  });

  const payload = await filtros.get('items.update')({ resumo: 'Resumo revisto' }, { collection: 'posts', keys: [7] });
  assert.equal(payload.publicado_em, '2026-07-01T12:00:00.000Z');
  assert.equal(payload.agendado_para, null);
});

test('bloqueia agendamento sem data futura', async () => {
  const { modulo: { default: registrar } } = await carregarHookParaTeste();
  const filtros = new Map();
  registrar({ filter(nome, handler) { filtros.set(nome, handler); }, schedule() {} }, {
    database() {
      return {
        where() { return this; },
        whereNot() { return this; },
        async first() { return undefined; },
      };
    },
    logger: { info() {}, warn() {} },
  });
  await assert.rejects(
    filtros.get('items.create')({ status: 'scheduled', titulo: 'Notícia', conteudo: '<p>Texto</p>', imagem: 'arquivo', imagem_alt: 'Descrição', fonte_nome: 'SINDQUIM' }, { collection: 'posts' }),
    /data futura/i,
  );
});

test('o agendador publica uma notícia que chegou ao horário', async () => {
  const { modulo: { default: registrar } } = await carregarHookParaTeste();
  let executarAgenda;
  let atualizacao;
  registrar({ filter() {}, schedule(_expressao, handler) { executarAgenda = handler; } }, {
    database(colecao) {
      if (colecao === 'posts_galeria') return {
        where() { return this; },
        whereNull() { return this; },
        orWhere() { return this; },
        async first() { return undefined; },
      };
      return {
        where() { return this; },
        whereNotNull() { return this; },
        async select() {
          return [{ id: 9, status: 'scheduled', titulo: 'Notícia', conteudo: '<p>Texto</p>', imagem: 'arquivo', imagem_alt: 'Descrição', fonte_nome: 'SINDQUIM', agendado_para: '2026-01-01T12:00:00.000Z' }];
        },
      };
    },
    services: { ItemsService: class {
      async updateOne(_id, payload) { atualizacao = payload; return _id; }
    } },
    async getSchema() { return {}; },
    logger: { info() {}, warn() {} },
  });

  await executarAgenda();
  assert.equal(atualizacao.status, 'published');
  assert.equal(atualizacao.agendado_para, null);
});
