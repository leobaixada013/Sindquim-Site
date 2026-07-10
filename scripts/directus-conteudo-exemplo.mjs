/**
 * Conteúdo de exemplo para testar o site (roda depois do directus-schema.mjs).
 * Pode rodar mais de uma vez: completa o que faltar sem duplicar registros conhecidos.
 *
 * Uso:
 *   DIRECTUS_URL=... DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   [YOUTUBE_URL_EXEMPLO=https://www.youtube.com/@canal] \
 *   node scripts/directus-conteudo-exemplo.mjs
 */

import { pathToFileURL } from 'node:url';

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

export async function criarSeAusente(chamarApi, colecao, campo, dados) {
  const valor = encodeURIComponent(dados[campo]);
  const existentes = await chamarApi('GET', `/items/${colecao}?filter[${campo}][_eq]=${valor}&limit=1`);
  return existentes[0] ?? chamarApi('POST', `/items/${colecao}`, dados);
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

const PAGINAS_INSTITUCIONAIS = {
  'filie-se': {
    titulo: 'Filie-se ao sindicato',
    conteudo: `<p>Filiar-se é participar da construção coletiva que protege direitos, fortalece negociações e amplia os serviços oferecidos à categoria.</p>
<h2>Por que se filiar</h2>
<p>O sindicato negocia reajustes, acompanha condições de trabalho, orienta trabalhadores e mantém canais de atendimento para que cada associado tenha apoio quando precisar.</p>
<ul>
  <li>Representação nas campanhas salariais e mesas de negociação.</li>
  <li>Acesso aos benefícios e convênios mantidos pelo sindicato.</li>
  <li>Orientação jurídica e encaminhamento de dúvidas trabalhistas.</li>
  <li>Participação nas assembleias e decisões da categoria.</li>
</ul>
<h2>Como solicitar</h2>
<p>Entre em contato pelo formulário do site, WhatsApp ou atendimento presencial. A equipe do sindicato orienta sobre documentos, contribuição e próximos passos.</p>`,
  },
  juridico: {
    titulo: 'Atendimento jurídico',
    conteudo: `<p>O atendimento jurídico do sindicato orienta trabalhadores da categoria sobre direitos, deveres e caminhos possíveis diante de problemas no contrato de trabalho.</p>
<h2>Quando procurar o jurídico</h2>
<p>Procure o sindicato antes de assinar documentos quando tiver dúvidas sobre rescisão, acordo, advertência, suspensão, mudança de função, jornada, adicional, férias, afastamento ou qualquer situação que possa afetar seus direitos.</p>
<ul>
  <li><strong>Rescisão e homologação:</strong> conferência de verbas, prazos e documentos.</li>
  <li><strong>Jornada e horas extras:</strong> orientação sobre controle de ponto, banco de horas e escalas.</li>
  <li><strong>Saúde e segurança:</strong> dúvidas sobre insalubridade, periculosidade, afastamentos e condições de trabalho.</li>
  <li><strong>Acordos e propostas da empresa:</strong> análise antes de qualquer assinatura.</li>
</ul>
<h2>Como funciona</h2>
<p>O primeiro atendimento identifica a situação e reúne documentos. Quando necessário, o caso é encaminhado para análise jurídica detalhada ou para os canais coletivos de negociação do sindicato.</p>
<h2>O que levar</h2>
<p>Tenha em mãos documentos pessoais, carteira de trabalho, holerites, contrato, termo de rescisão, mensagens, advertências, escalas, cartões de ponto e qualquer registro relacionado ao caso.</p>
<blockquote>Na dúvida, procure orientação antes de assinar. Informação no momento certo evita prejuízos.</blockquote>`,
  },
  beneficios: {
    titulo: 'Benefícios e convênios',
    conteudo: `<p>O sindicato busca parcerias e convênios para ampliar a proteção e melhorar o dia a dia dos associados e seus dependentes.</p>
<h2>O que pode ser oferecido</h2>
<p>Os benefícios podem variar conforme contratos vigentes, região e disponibilidade dos parceiros. Consulte sempre o sindicato antes de contratar qualquer serviço.</p>
<ul>
  <li><strong>Saúde:</strong> condições especiais em clínicas, exames, odontologia e serviços de bem-estar.</li>
  <li><strong>Educação:</strong> descontos em cursos, escolas, faculdades e formação profissional.</li>
  <li><strong>Lazer e serviços:</strong> parcerias para atividades, comércio local e serviços úteis à categoria.</li>
  <li><strong>Apoio ao associado:</strong> orientação sobre como utilizar cada convênio e quais documentos apresentar.</li>
</ul>
<h2>Como acessar</h2>
<p>Entre em contato com o sindicato para confirmar quais convênios estão ativos, regras de uso, validade, descontos e documentação necessária.</p>
<h2>Importante</h2>
<p>Os convênios não substituem direitos trabalhistas nem benefícios previstos em acordo ou convenção coletiva. Eles são vantagens adicionais negociadas para associados.</p>`,
  },
};

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`login falhou (${login.status})`);
  token = (await login.json()).data.access_token;

  const categorias = {};
  for (const [nome, slug] of [
    ['Campanha Salarial', 'campanha-salarial'],
    ['Assembleia', 'assembleia'],
    ['Direitos', 'direitos'],
    ['Benefícios', 'beneficios'],
  ]) {
    const categoria = await criarSeAusente(api, 'categorias', 'slug', { nome, slug });
    categorias[slug] = categoria.id;
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
    await criarSeAusente(api, 'posts', 'slug', {
      ...dados,
      status: 'published',
      conteudo: PARAGRAFO,
      imagem: await importarImagem(seed),
    });
  }
  console.log('OK posts (1 fixado no banner)');

  const agora = Date.now();
  const dia = 24 * 60 * 60 * 1000;
  await criarSeAusente(api, 'avisos', 'titulo', {
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
    await criarSeAusente(api, 'avisos', 'titulo', {
      status: 'published',
      titulo,
      urgente: false,
      data_inicio: new Date(agora + offsetDias * dia).toISOString(),
    });
  }
  console.log('OK avisos');

  await criarSeAusente(api, 'proximos_videos', 'titulo', {
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
    await criarSeAusente(api, 'diretores', 'nome', {
      nome, cargo, ordem: ordem++, foto: await importarImagem(`diretor-${ordem}`, 600, 600),
    });
  }
  console.log('OK diretoria');

  for (const [titulo, tipo, ano] of [
    ['Convenção Coletiva de Trabalho 2025/2026', 'convencao', 2025],
    ['Acordo coletivo — adicional de periculosidade', 'acordo', 2025],
    ['Ata da assembleia geral ordinária', 'ata', 2026],
  ]) {
    await criarSeAusente(api, 'documentos', 'titulo', { titulo, tipo, ano });
  }
  console.log('OK documentos');

  for (let i = 1; i <= 4; i++) {
    await criarSeAusente(api, 'cards_instagram', 'legenda', {
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

  for (const [slug, pagina] of Object.entries(PAGINAS_INSTITUCIONAIS)) {
    await criarSeAusente(api, 'paginas', 'slug', {
      titulo: pagina.titulo,
      slug,
      conteudo: pagina.conteudo,
    });
  }
  console.log('OK páginas institucionais');

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

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
