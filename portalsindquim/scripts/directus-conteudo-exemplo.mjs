/**
 * Popula uma instalação de desenvolvimento com conteúdo inequivocamente demonstrativo.
 * Não baixa mídia externa, não cria documentos jurídicos e não inventa dados reais.
 *
 * Uso:
 *   DIRECTUS_URL=http://localhost:8155 \
 *   DIRECTUS_ADMIN_EMAIL=admin@example.invalid \
 *   DIRECTUS_ADMIN_PASSWORD='senha-local' \
 *   node scripts/directus-conteudo-exemplo.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8155';
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA = process.env.DIRECTUS_ADMIN_PASSWORD;
const MARCADOR = '[DEMONSTRAÇÃO]';
let token = '';

async function respostaJson(resposta, metodo, caminho) {
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  if (!resposta.ok) {
    throw new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 400)}`);
  }
  return json.data;
}

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return respostaJson(resposta, metodo, caminho);
}

async function apiFormulario(caminho, formData) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return respostaJson(resposta, 'POST', caminho);
}

async function criarOuAtualizar(colecao, campo, dados) {
  const valor = encodeURIComponent(dados[campo]);
  const existentes = await api('GET', `/items/${colecao}?filter[${campo}][_eq]=${valor}&limit=1&fields=id`);
  if (existentes[0]) return api('PATCH', `/items/${colecao}/${existentes[0].id}`, dados);
  return api('POST', `/items/${colecao}`, dados);
}

/** Utilitário puro mantido para testar a criação idempotente sem chamar o Directus real. */
export async function criarSeAusente(clienteApi, colecao, campo, dados) {
  const valor = encodeURIComponent(dados[campo]);
  const existentes = await clienteApi('GET', `/items/${colecao}?filter[${campo}][_eq]=${valor}&limit=1`);
  if (existentes[0]) return existentes[0];
  return clienteApi('POST', `/items/${colecao}`, dados);
}

async function pastaPublica() {
  const nome = encodeURIComponent('Portal — mídia pública');
  const pastas = await api('GET', `/folders?filter[name][_eq]=${nome}&limit=1&fields=id`);
  if (!pastas[0]) throw new Error('Pasta pública não encontrada. Rode directus-schema.mjs primeiro.');
  return pastas[0].id;
}

async function enviarArquivoLocal(caminhoRelativo, titulo, pastaId) {
  const existentes = await api('GET', `/files?filter[title][_eq]=${encodeURIComponent(titulo)}&filter[folder][_eq]=${pastaId}&limit=1&fields=id`);
  if (existentes[0]) return existentes[0].id;

  const caminho = resolve(new URL('..', import.meta.url).pathname, caminhoRelativo);
  if (!existsSync(caminho)) throw new Error(`Arquivo local não encontrado: ${caminhoRelativo}`);
  const extensao = extname(caminho).toLowerCase();
  const tipo = extensao === '.png' ? 'image/png' : extensao === '.webp' ? 'image/webp' : 'image/jpeg';
  const formData = new FormData();
  formData.append('title', titulo);
  formData.append('folder', pastaId);
  formData.append('file', new Blob([readFileSync(caminho)], { type: tipo }), basename(caminho));
  const arquivo = await apiFormulario('/files', formData);
  return arquivo.id;
}

const CONTEUDO_NOTICIA = `<p><strong>Conteúdo de demonstração:</strong> substitua todas as informações desta matéria antes de usar o portal em produção.</p>
<p>Este texto serve para validar a experiência editorial, a leitura no celular e a apresentação de informações importantes para a categoria.</p>
<h2>Resumo do exemplo</h2>
<p>A equipe pode escrever parágrafos, destacar pontos relevantes, usar listas e adicionar uma fonte de consulta. A publicação só deve ocorrer depois da revisão de título, capa, descrição da imagem e conteúdo.</p>
<ul><li>Texto simples e direto.</li><li>Informações organizadas em seções.</li><li>Fonte e autoria identificadas quando aplicável.</li></ul>
<blockquote>Esta citação também é apenas um exemplo visual.</blockquote>`;

const POSTAGENS = [
  {
    titulo: `${MARCADOR} Assembleia aprova prioridades para a próxima campanha`,
    slug: 'demonstracao-assembleia-prioridades-campanha',
    resumo: 'Exemplo de matéria principal para testar capa, resumo, categoria e destaque da página inicial.',
    categoria: 'assembleia',
    fixado_banner: true,
  },
  {
    titulo: `${MARCADOR} Confira o calendário de atividades do mês`,
    slug: 'demonstracao-calendario-atividades-mes',
    resumo: 'Exemplo de notícia de serviço com datas e orientações organizadas para leitura rápida.',
    categoria: 'sindicato',
    fixado_banner: false,
  },
  {
    titulo: `${MARCADOR} Como solicitar orientação jurídica pelo portal`,
    slug: 'demonstracao-como-solicitar-orientacao-juridica',
    resumo: 'Exemplo educativo sobre o fluxo de triagem, proteção de dados e retorno da equipe.',
    categoria: 'direitos',
    fixado_banner: false,
  },
  {
    titulo: `${MARCADOR} Novos benefícios já podem ser cadastrados no painel`,
    slug: 'demonstracao-beneficios-cadastrados-painel',
    resumo: 'Exemplo mostrando como apresentar elegibilidade, requisitos, validade e forma de uso.',
    categoria: 'beneficios',
    fixado_banner: false,
  },
];

const BENEFICIOS = [
  ['Atendimento de saúde parceiro', 'saude', 'Modelo de condição especial para associados e dependentes.', 'Associados com cadastro ativo.', 'Confirme a disponibilidade com a equipe antes de agendar.', 'Documento de identificação e comprovação de vínculo.'],
  ['Formação e qualificação', 'educacao', 'Modelo de desconto em cursos de atualização profissional.', 'Associados e dependentes, conforme regra do parceiro.', 'Peça a declaração de vínculo e apresente-a na matrícula.', 'Declaração emitida pelo sindicato.'],
  ['Atividades de bem-estar', 'bem-estar', 'Modelo de parceria para atividades físicas e qualidade de vida.', 'Associados com cadastro atualizado.', 'Consulte unidades, horários e vagas antes da adesão.', 'Carteirinha ou declaração de associação.'],
  ['Serviços ao associado', 'servicos', 'Modelo de atendimento com condições diferenciadas.', 'Associados, sujeito à disponibilidade.', 'Solicite instruções pelo canal oficial do sindicato.', 'Documento de identificação.'],
];

async function principal() {
  if (!EMAIL || !SENHA) {
    throw new Error('Defina DIRECTUS_ADMIN_EMAIL e DIRECTUS_ADMIN_PASSWORD.');
  }
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`Login no Directus falhou (${login.status}).`);
  token = (await login.json()).data.access_token;

  const pastaId = await pastaPublica();
  const imagemCapa = await enviarArquivoLocal('assets/hero-assembleia-sindicato.png', `${MARCADOR} capa editorial local`, pastaId);
  const logo = await enviarArquivoLocal('assets/sindicato-logo.jpeg', `${MARCADOR} logo local`, pastaId);

  const categorias = {};
  for (const [nome, slug] of [['Sindicato', 'sindicato'], ['Assembleia', 'assembleia'], ['Direitos', 'direitos'], ['Benefícios', 'beneficios']]) {
    const categoria = await criarOuAtualizar('categorias', 'slug', { nome, slug });
    categorias[slug] = categoria.id;
  }

  const publicadoEm = new Date().toISOString();
  for (const post of POSTAGENS) {
    await criarOuAtualizar('posts', 'slug', {
      status: 'published',
      titulo: post.titulo,
      slug: post.slug,
      resumo: post.resumo,
      conteudo: CONTEUDO_NOTICIA,
      imagem: imagemCapa,
      imagem_alt: 'Trabalhadores reunidos em auditório durante uma assembleia sindical de demonstração.',
      imagem_legenda: 'Imagem local usada somente para demonstração do portal.',
      imagem_credito: 'Acervo local de demonstração',
      categoria: categorias[post.categoria],
      fixado_banner: post.fixado_banner,
      fonte_nome: 'Conteúdo demonstrativo interno',
      fonte_url: null,
      publicado_em: publicadoEm,
      agendado_para: null,
    });
  }

  await api('PATCH', '/items/pagina_beneficios', {
    hero_rotulo: 'Área editável',
    hero_titulo: `${MARCADOR} Benefícios para associados`,
    hero_resumo: 'Conteúdo provisório para validar a página. Substitua parceiros, condições e canais antes da publicação oficial.',
    introducao_titulo: 'Explore os modelos cadastrados',
    introducao_texto: 'Use os filtros para encontrar categorias. Cada card informa quem pode usar, como acessar e o que apresentar.',
    aviso_titulo: 'Atenção: dados de demonstração',
    aviso_texto: 'Nenhum parceiro ou desconto desta página está confirmado. Valide todas as informações antes de divulgar.',
    cta_titulo: 'Precisa confirmar um benefício?',
    cta_texto: 'Fale com a equipe responsável antes de contratar qualquer serviço.',
    cta_link_texto: 'Ir para contato',
    cta_link_href: '/contato',
  });

  let ordem = 1;
  for (const [titulo, categoria, resumo, elegibilidade, comoUsar, requisitos] of BENEFICIOS) {
    await criarOuAtualizar('beneficios', 'titulo', {
      status: 'published', ordem: ordem++, titulo: `${MARCADOR} ${titulo}`, categoria, resumo,
      detalhes: 'As condições exibidas são exemplos e devem ser substituídas pelas regras oficiais do parceiro.',
      elegibilidade, como_usar: comoUsar, requisitos, validade_inicio: null, validade_fim: null,
      cta_texto: 'Confirmar com o sindicato', cta_url: '/contato', imagem: null, imagem_alt: null, destaque: ordem === 2,
    });
  }

  await api('PATCH', '/items/pagina_juridico', {
    hero_rotulo: 'Orientação e acolhimento',
    hero_titulo: `${MARCADOR} Atendimento jurídico`,
    hero_resumo: 'Página editável de demonstração. Preserve a triagem segura, o aviso de privacidade e os canais oficiais ao substituir o conteúdo.',
    hero_cta_primario_texto: 'Iniciar triagem', hero_cta_primario_href: '#agendamento',
    hero_cta_secundario_texto: 'Conhecer temas atendidos', hero_cta_secundario_href: '#direitos',
    direitos_rotulo: 'Como podemos orientar', direitos_titulo: 'Temas frequentes no atendimento',
    agendamento_rotulo: 'Primeiro contato', agendamento_titulo: 'Envie somente os dados necessários',
    agendamento_texto: 'A triagem identifica o assunto e permite que a equipe indique o canal adequado. Não envie documentos de terceiros.',
    plantao_titulo: 'Canal de demonstração',
    chamado_titulo: 'Triagem jurídica protegida',
    chamado_resumo: 'Explique brevemente o caso. CPF e anexo ficam opcionais por padrão para reduzir a coleta de dados sensíveis.',
    chamado_prazo_texto: 'O prazo exibido deve ser definido pela equipe jurídica antes do lançamento.',
    chamado_privacidade_texto: 'Os dados são usados somente para triagem jurídica e controle do atendimento, com acesso restrito à equipe autorizada e prazo de retenção definido.',
    chamado_exigir_cpf: false, chamado_exigir_anexo: false,
    faq_rotulo: 'Dúvidas comuns', faq_titulo: 'Antes de enviar sua solicitação',
    cta_rotulo: 'Precisa de orientação?', cta_titulo: 'Use somente os canais oficiais',
    cta_link_texto: 'Ir para a triagem', cta_link_href: '#agendamento',
    seo_descricao: 'Área demonstrativa de triagem e orientação jurídica do sindicato.',
  });

  for (const item of [
    { titulo: `${MARCADOR} Rescisão e verbas`, sigla: 'RES', descricao: 'Exemplo de tema para orientar a procura por atendimento antes de assinar documentos.', cor: 'aco', destaque: true, urgente: false, texto_link: 'Iniciar triagem' },
    { titulo: `${MARCADOR} Jornada e horas extras`, sigla: 'JOR', descricao: 'Exemplo de tema sobre registros de ponto, escalas e tempo de trabalho.', cor: 'aco', destaque: false, urgente: false, texto_link: 'Iniciar triagem' },
    { titulo: `${MARCADOR} Assédio ou discriminação`, sigla: 'ACO', descricao: 'Exemplo de acolhimento para situações que exigem escuta reservada e orientação.', cor: 'vermelho', destaque: false, urgente: true, texto_link: 'Buscar orientação' },
  ]) await criarOuAtualizar('juridico_direitos', 'titulo', { status: 'published', ordem: 1, ...item });

  await criarOuAtualizar('juridico_plantoes', 'titulo', {
    status: 'published', ordem: 1, titulo: `${MARCADOR} Plantão a configurar`,
    local: 'Defina o canal oficial no painel', horario: 'Defina dias e horários',
    observacao: 'Não utilize estas informações como atendimento real.',
  });
  for (const item of [
    { pergunta: `${MARCADOR} Preciso enviar CPF na primeira mensagem?`, resposta: 'Não por padrão. A equipe pode solicitar depois, quando houver necessidade e base adequada.' },
    { pergunta: `${MARCADOR} Posso anexar qualquer documento?`, resposta: 'Envie somente material necessário ao seu próprio caso e nunca documentos de terceiros sem autorização.' },
    { pergunta: `${MARCADOR} O formulário substitui atendimento emergencial?`, resposta: 'Não. A equipe deve publicar canais e orientações específicas para situações urgentes.' },
  ]) await criarOuAtualizar('juridico_faq', 'pergunta', { status: 'published', ordem: 1, ...item });

  await criarOuAtualizar('paginas', 'slug', {
    titulo: `${MARCADOR} Filie-se`, slug: 'filie-se',
    conteudo: '<p><strong>Conteúdo de demonstração:</strong> substitua requisitos, valores e canais antes do lançamento.</p><h2>Por que participar</h2><p>Use esta página para explicar de forma simples a representação, os serviços e como iniciar o cadastro.</p><h2>Como solicitar</h2><p>Publique aqui apenas o canal oficial e as orientações validadas pelo sindicato.</p>',
  });

  await api('PATCH', '/items/configuracoes', {
    telefone: '(00) 0000-0000', whatsapp: null, email: 'contato@exemplo.invalid',
    endereco: 'Endereço demonstrativo — substitua no painel', instagram_url: null, youtube_url: null, youtube_channel_id: null,
  });
  await api('PATCH', '/items/configuracoes_globais', {
    logo_site: logo, modulo_juridico_ativo: true, modulo_youtube_ativo: false, modulo_instagram_ativo: false,
  }).catch(() => null);

  console.log('Conteúdo local de demonstração criado/atualizado sem mídia externa, documentos ou dados reais.');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch((erro) => {
    console.error(erro.message);
    process.exit(1);
  });
}
