/**
 * Conteúdo de exemplo para testar o site (roda depois do directus-schema.mjs).
 * Não roda duas vezes: se já houver posts, não cria nada.
 *
 * Uso:
 *   DIRECTUS_URL=... DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   [YOUTUBE_URL_EXEMPLO=https://www.youtube.com/@canal] \
 *   node scripts/directus-conteudo-exemplo.mjs
 */

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;
const YOUTUBE_URL =
  process.env.YOUTUBE_URL_EXEMPLO ??
  'https://www.youtube.com/@Rea%C3%A7%C3%A3oQu%C3%ADmicaemDebate';
const INSTAGRAM_URL =
  process.env.INSTAGRAM_URL_EXEMPLO ??
  'https://www.instagram.com/reacaoquimicaemdebate/';
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID_EXEMPLO ?? 'UC4sw8g2GwkMMikgm4n4fHmQ';

let token = '';

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 200)}`);
  }
  return json.data;
}

async function importarImagem(seed, largura = 1400, altura = 900) {
  try {
    const arquivo = await api('POST', '/files/import', {
      url: `https://picsum.photos/seed/${seed}/${largura}/${altura}`,
    });
    return arquivo.id;
  } catch {
    return null; // sem internet no servidor, seguimos sem imagem
  }
}

const PARAGRAFO = `<p>Este é um texto de demonstração para validar o layout do site.
A diretoria do sindicato esteve reunida com representantes da categoria para discutir
os próximos passos da campanha, e o resultado foi apresentado em assembleia.</p>
<h2>O que foi decidido</h2>
<p>Entre os encaminhamentos aprovados estão o calendário de mobilização, a pauta de
reivindicações e o formato das próximas rodadas de negociação com o sindicato patronal.</p>
<blockquote>“Nosso trabalho tem valor, e a unidade da categoria é o que garante
conquistas.”</blockquote>
<p>Acompanhe o site e as redes sociais do sindicato para ficar por dentro de cada etapa.</p>`;

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`login falhou (${login.status})`);
  token = (await login.json()).data.access_token;

  const postsExistentes = await api('GET', '/items/posts?limit=1');
  if (postsExistentes.length > 0) {
    console.log('Já existe conteúdo — nada a fazer.');
    return;
  }

  const categorias = {};
  for (const [nome, slug] of [
    ['Campanha Salarial', 'campanha-salarial'],
    ['Assembleia', 'assembleia'],
    ['Direitos', 'direitos'],
    ['Benefícios', 'beneficios'],
  ]) {
    const criada = await api('POST', '/items/categorias', { nome, slug });
    categorias[slug] = criada.id;
  }
  console.log('OK categorias');

  const posts = [
    {
      titulo: 'Campanha salarial 2026: assembleia aprova pauta de reivindicações',
      slug: 'campanha-salarial-2026-pauta-aprovada',
      resumo: 'Categoria aprovou por unanimidade a pauta que será entregue ao sindicato patronal, com reajuste real e manutenção de todas as cláusulas sociais.',
      categoria: categorias['campanha-salarial'],
      fixado_banner: true,
      seed: 'assembleia-sindicato',
    },
    {
      titulo: 'Novo plano de saúde coletivo tem adesão aberta até o fim do mês',
      slug: 'plano-de-saude-adesao-aberta',
      resumo: 'Convênio negociado pelo sindicato reduz mensalidade em até 30% para associados e dependentes.',
      categoria: categorias['beneficios'],
      seed: 'saude-beneficio',
    },
    {
      titulo: 'Entenda o que muda com a nova NR sobre exposição a agentes químicos',
      slug: 'nova-nr-agentes-quimicos',
      resumo: 'Norma atualizada traz novos limites de tolerância e obrigações para as empresas. Veja como isso afeta seu dia a dia.',
      categoria: categorias['direitos'],
      seed: 'quimica-industria',
    },
    {
      titulo: 'Assembleia geral extraordinária é convocada para a próxima semana',
      slug: 'assembleia-extraordinaria-convocada',
      resumo: 'Edital de convocação foi publicado; participação de todos é fundamental para deliberar sobre a proposta patronal.',
      categoria: categorias['assembleia'],
      seed: 'reuniao-trabalhadores',
    },
  ];

  for (const post of posts) {
    const { seed, ...dados } = post;
    await api('POST', '/items/posts', {
      ...dados,
      status: 'published',
      conteudo: PARAGRAFO,
      imagem: await importarImagem(seed),
    });
  }
  console.log('OK posts (1 fixado no banner)');

  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  await api('POST', '/items/avisos', {
    status: 'published',
    titulo: 'Assembleia geral nesta quinta às 18h',
    mensagem_curta: 'Sede do sindicato — presença de todos é fundamental.',
    urgente: true,
    data_inicio: new Date(agora - dia).toISOString(),
    data_fim: new Date(agora + 7 * dia).toISOString(),
    texto_link: 'Ver edital',
    link: '/avisos',
  });
  for (const [titulo, offsetDias] of [
    ['Plantão jurídico de julho com horário ampliado', -1],
    ['Recadastramento de dependentes até 31/07', -3],
    ['Colônia de férias: sorteio de vagas em agosto', -5],
  ]) {
    await api('POST', '/items/avisos', {
      status: 'published',
      titulo,
      urgente: false,
      data_inicio: new Date(agora + offsetDias * dia).toISOString(),
    });
  }
  console.log('OK avisos');

  await api('POST', '/items/proximos_videos', {
    status: 'published',
    titulo: 'Ao vivo: tira-dúvidas sobre a proposta patronal',
    descricao: 'A diretoria responde as principais perguntas da categoria antes da assembleia. Deixe sua pergunta nos comentários.',
    data_estreia: new Date(agora + 5 * dia + 19 * 60 * 60 * 1000).toISOString(),
    imagem: await importarImagem('estudio-podcast'),
  });
  console.log('OK próximo vídeo');

  let ordem = 1;
  for (const [nome, cargo] of [
    ['Maria Aparecida Silva', 'Presidenta'],
    ['João Carlos Ferreira', 'Vice-presidente'],
    ['Ana Lúcia Rodrigues', 'Secretária-geral'],
    ['Pedro Henrique Souza', 'Tesoureiro'],
  ]) {
    await api('POST', '/items/diretores', {
      nome, cargo, ordem: ordem++, foto: await importarImagem(`diretor-${ordem}`, 600, 600),
    });
  }
  console.log('OK diretoria');

  for (const [titulo, tipo, ano] of [
    ['Convenção Coletiva de Trabalho 2025/2026', 'convencao', 2025],
    ['Acordo coletivo — adicional de periculosidade', 'acordo', 2025],
    ['Ata da assembleia geral ordinária', 'ata', 2026],
  ]) {
    await api('POST', '/items/documentos', { titulo, tipo, ano });
  }
  console.log('OK documentos');

  for (let i = 1; i <= 4; i++) {
    await api('POST', '/items/cards_instagram', {
      imagem: await importarImagem(`reel-${i}`, 720, 1280),
      legenda: [
        'Corte do debate: reajuste real e cláusulas sociais',
        'Bastidor da gravação com a diretoria',
        'Direito em 60 segundos: adicional de insalubridade',
        'Chamada para o próximo Reação Química em Debate',
      ][i - 1],
    });
  }
  console.log('OK Reels do Instagram');

  for (const [titulo, slug] of [
    ['Filie-se ao sindicato', 'filie-se'],
    ['Atendimento jurídico', 'juridico'],
    ['Benefícios e convênios', 'beneficios'],
  ]) {
    await api('POST', '/items/paginas', {
      titulo, slug,
      conteudo: `<p>Conteúdo da página <strong>${titulo}</strong> — edite no painel em “Páginas”.</p>${PARAGRAFO}`,
    });
  }
  console.log('OK páginas');

  await api('PATCH', '/items/configuracoes', {
    telefone: '(11) 4002-8922',
    whatsapp: '5511940028922',
    email: 'contato@sindicato.org.br',
    endereco: 'Rua dos Trabalhadores, 118 — Centro',
    instagram_url: INSTAGRAM_URL,
    youtube_url: YOUTUBE_URL,
    youtube_channel_id: YOUTUBE_CHANNEL_ID,
  });
  console.log('OK configurações');

  console.log('\nConteúdo de exemplo criado.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
