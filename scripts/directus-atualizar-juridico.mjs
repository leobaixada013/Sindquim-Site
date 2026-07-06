/**
 * Atualiza o conteúdo estruturado da página Jurídico no Directus.
 * Uso:
 *   DIRECTUS_URL=http://localhost:8055 DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/directus-atualizar-juridico.mjs
 */

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8055';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;

if (!EMAIL || !SENHA) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  process.exit(1);
}

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
    throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 300)}`);
  }
  return json.data;
}

const PAGINA = {
  hero_rotulo: 'Área Jurídica',
  hero_titulo: 'Apoio Jurídico Especializado',
  hero_resumo: 'Orientação e defesa dos seus direitos trabalhistas, do primeiro atendimento à representação em juízo.',
  hero_cta_primario_texto: 'Agendar Consulta',
  hero_cta_secundario_texto: 'Ver Direitos',
  direitos_rotulo: 'Seus Direitos',
  direitos_titulo: 'Seus Direitos Principais',
  agendamento_rotulo: 'Atendimento',
  agendamento_titulo: 'Agendamento de Triagem',
  agendamento_texto: 'Descreva brevemente sua situação para direcionarmos ao advogado certo. A triagem é gratuita para filiados e o retorno acontece em até 2 dias úteis.',
  plantao_titulo: 'Plantão Jurídico (Presencial)',
  faq_rotulo: 'Dúvidas Frequentes',
  faq_titulo: 'Perguntas sobre a Área Jurídica',
  cta_rotulo: 'Fortaleça sua representação',
  cta_titulo: 'Ainda não é filiado?',
  cta_link_texto: 'Quero me filiar',
  cta_link_href: '/filie-se',
};

const DIREITOS = [
  {
    ordem: 1,
    status: 'published',
    titulo: 'Jornada de Trabalho e Horas Extras',
    sigla: 'JOR',
    descricao: 'Controle de ponto, banco de horas, adicional noturno e pagamento correto das horas extras. Saiba o que a lei garante.',
    cor: 'aco',
    destaque: true,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    ordem: 2,
    status: 'published',
    titulo: 'Saúde e Segurança',
    sigla: 'SAU',
    descricao: 'Insalubridade, periculosidade, EPIs e afastamentos. Ambiente de trabalho seguro é um direito.',
    cor: 'aco',
    destaque: false,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    ordem: 3,
    status: 'published',
    titulo: 'Rescisão e Demissão',
    sigla: 'RES',
    descricao: 'Verbas rescisórias, aviso prévio, FGTS e homologação. Confira se seus valores estão corretos.',
    cor: 'aco',
    destaque: false,
    urgente: false,
    texto_link: 'Ler detalhes',
  },
  {
    ordem: 4,
    status: 'published',
    titulo: 'Assédio e Discriminação',
    sigla: 'ASS',
    descricao: 'Assédio moral, sexual ou discriminação no ambiente de trabalho. O atendimento é sigiloso e prioritário.',
    cor: 'vermelho',
    destaque: true,
    urgente: true,
    texto_link: 'Ler detalhes',
  },
];

const PLANTOES = [
  {
    ordem: 1,
    status: 'published',
    titulo: 'Plantão Jurídico (Presencial)',
    local: 'Sede do Sindicato, 3º andar',
    horario: 'Terças e quintas, das 14h às 17h',
    observacao: null,
  },
];

const FAQ = [
  {
    ordem: 1,
    status: 'published',
    pergunta: 'Preciso pagar pelas consultas jurídicas?',
    resposta: 'Não. A triagem e a orientação inicial são gratuitas para filiados em dia. Custas processuais e honorários de eventual ação são informados de forma transparente antes de qualquer providência.',
  },
  {
    ordem: 2,
    status: 'published',
    pergunta: 'Como faço para acompanhar o andamento do meu processo?',
    resposta: 'Você recebe atualizações por telefone e pode consultar o departamento jurídico presencialmente durante o plantão, levando sua matrícula sindical.',
  },
  {
    ordem: 3,
    status: 'published',
    pergunta: 'O sindicato me representa em ações coletivas?',
    resposta: 'Sim. Ajuizamos e acompanhamos ações coletivas em nome da categoria, além de atuar em acordos e convenções. Fique atento aos avisos para aderir quando uma ação for aberta.',
  },
];

const CAMPOS_FORMULARIO = [
  {
    ordem: 1,
    status: 'published',
    chave: 'telefone',
    rotulo: 'Telefone',
    tipo: 'tel',
    obrigatorio: true,
    placeholder: '(00) 00000-0000',
    opcoes: null,
    max_length: 40,
  },
  {
    ordem: 2,
    status: 'published',
    chave: 'matricula',
    rotulo: 'Matrícula Sindical',
    tipo: 'text',
    obrigatorio: false,
    placeholder: null,
    opcoes: null,
    max_length: 40,
  },
  {
    ordem: 3,
    status: 'published',
    chave: 'natureza',
    rotulo: 'Natureza do Problema',
    tipo: 'select',
    obrigatorio: true,
    placeholder: 'Selecione...',
    opcoes: 'Demissão / Rescisão\nHoras Extras / Jornada\nAssédio / Discriminação\nAcidente de Trabalho\nDúvida Geral',
    max_length: 80,
  },
];

async function substituirColecao(colecao, itens) {
  const existentes = await api('GET', `/items/${colecao}?limit=-1&fields=id`);
  for (const item of existentes) {
    await api('DELETE', `/items/${colecao}/${item.id}`);
  }
  for (const item of itens) {
    await api('POST', `/items/${colecao}`, item);
  }
  console.log(`OK ${colecao}: ${itens.length} item(ns)`);
}

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`login falhou (${login.status})`);
  token = (await login.json()).data.access_token;

  await api('PATCH', '/items/pagina_juridico', PAGINA);
  console.log('OK página_juridico');

  await substituirColecao('juridico_direitos', DIREITOS);
  await substituirColecao('juridico_plantoes', PLANTOES);
  await substituirColecao('juridico_faq', FAQ);
  await substituirColecao('juridico_campos_formulario', CAMPOS_FORMULARIO);
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
