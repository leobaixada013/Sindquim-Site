import { InvalidPayloadError } from '@directus/errors';

function slugBase(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'noticia';
}

async function slugDisponivel(database, base, ignorarId) {
  for (let sufixo = 0; sufixo < 1000; sufixo += 1) {
    const candidato = sufixo === 0 ? base : `${base}-${sufixo + 1}`;
    let consulta = database('posts').where({ slug: candidato });
    if (ignorarId) consulta = consulta.whereNot({ id: ignorarId });
    const existente = await consulta.first('id');
    if (!existente) return candidato;
  }
  return `${base}-${Date.now()}`;
}

function preenchido(valor) {
  return typeof valor === 'string' ? valor.trim().length > 0 : Boolean(valor);
}

function erroEditorial(mensagem) {
  return new InvalidPayloadError({ reason: mensagem });
}

async function validarPublicacao(database, estado, id, permitirAgendamentoVencido = false) {
  if (!['published', 'scheduled'].includes(estado.status)) return;
  const faltantes = [
    ['titulo', 'título'], ['conteudo', 'texto'], ['imagem', 'foto de capa'], ['imagem_alt', 'descrição da foto de capa'],
  ].filter(([campo]) => !preenchido(estado[campo])).map(([, rotulo]) => rotulo);
  if (faltantes.length) {
    throw erroEditorial(`Complete antes de publicar: ${faltantes.join(', ')}.`);
  }
  if (!preenchido(estado.fonte_nome)) {
    throw erroEditorial('Informe a fonte da notícia. Use SINDQUIM quando a informação for do próprio sindicato.');
  }
  if (String(estado.fonte_nome).trim().toUpperCase() !== 'SINDQUIM') {
    try {
      const fonte = new URL(estado.fonte_url);
      if (!['http:', 'https:'].includes(fonte.protocol)) throw new Error('protocolo');
    } catch {
      throw erroEditorial('Informe o link completo da fonte externa, começando com https://.');
    }
  }
  if (estado.status === 'scheduled' && !permitirAgendamentoVencido) {
    const data = new Date(estado.agendado_para ?? '');
    if (Number.isNaN(data.getTime()) || data.getTime() <= Date.now()) {
      throw erroEditorial('Escolha uma data futura para agendar a notícia.');
    }
  }
  if (id) {
    const fotoSemDescricao = await database('posts_galeria')
      .where({ post: id })
      .where((consulta) => consulta.whereNull('texto_alternativo').orWhere('texto_alternativo', ''))
      .first('id');
    if (fotoSemDescricao) throw erroEditorial('Descreva todas as fotos adicionais antes de publicar.');
  }
}

export default ({ filter, schedule }, { database, logger, services, getSchema }) => {
  filter('items.create', async (payload, meta) => {
    if (meta.collection !== 'posts') return payload;
    const base = slugBase(payload.slug || payload.titulo);
    payload.slug = await slugDisponivel(database, base);
    if (payload.agendado_para && new Date(payload.agendado_para).getTime() > Date.now()) payload.status = 'scheduled';
    await validarPublicacao(database, payload, null);
    if (payload.status === 'published') {
      payload.publicado_em = payload.publicado_em || new Date().toISOString();
      payload.agendado_para = null;
    }
    return payload;
  });

  filter('items.update', async (payload, meta) => {
    if (meta.collection !== 'posts') return payload;
    const chaves = Array.isArray(meta.keys) ? meta.keys : [];
    if (chaves.length > 1 && ['published', 'scheduled'].includes(payload.status)) {
      throw erroEditorial('Para publicar ou agendar, abra e revise uma notícia por vez.');
    }
    const id = chaves[0];
    const atual = id ? await database('posts').where({ id }).first('*') : null;
    if (payload.slug) {
      const base = slugBase(payload.slug || payload.titulo || atual?.slug || atual?.titulo);
      payload.slug = await slugDisponivel(database, base, id);
    }
    if (payload.agendado_para && new Date(payload.agendado_para).getTime() > Date.now()) payload.status = 'scheduled';
    const estado = { ...(atual ?? {}), ...payload };
    await validarPublicacao(database, estado, id);
    if (estado.status === 'published') {
      payload.publicado_em = atual?.publicado_em || payload.publicado_em || new Date().toISOString();
      payload.agendado_para = null;
    }
    return payload;
  });

  schedule('* * * * *', async () => {
    const agora = new Date().toISOString();
    const schema = await getSchema();
    const servico = new services.ItemsService('posts', { schema, accountability: null });
    const agendadas = await database('posts')
      .where({ status: 'scheduled' })
      .whereNotNull('agendado_para')
      .where('agendado_para', '<=', agora)
      .select('*');
    let publicadas = 0;
    for (const noticia of agendadas) {
      try {
        await validarPublicacao(database, noticia, noticia.id, true);
        await servico.updateOne(noticia.id, {
          status: 'published',
          publicado_em: noticia.publicado_em || agora,
          agendado_para: null,
        }, { emitEvents: false });
        publicadas += 1;
      } catch (erro) {
        logger.warn(`Notícia agendada ${noticia.id} não foi publicada: ${erro.message}`);
      }
    }
    if (publicadas > 0) logger.info(`Portal editorial publicou ${publicadas} notícia(s) agendada(s).`);
  });
};
