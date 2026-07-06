/**
 * Atualiza páginas institucionais editáveis no Directus sem mexer nas notícias.
 * Uso:
 *   DIRECTUS_URL=http://localhost:8055 DIRECTUS_ADMIN_EMAIL=... DIRECTUS_ADMIN_PASSWORD=... \
 *   node scripts/directus-atualizar-paginas.mjs
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

const PAGINAS = {
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
};

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: SENHA }),
  });
  if (!login.ok) throw new Error(`login falhou (${login.status})`);
  token = (await login.json()).data.access_token;

  for (const [slug, pagina] of Object.entries(PAGINAS)) {
    const existentes = await api('GET', `/items/paginas?filter[slug][_eq]=${encodeURIComponent(slug)}&limit=1`);
    if (existentes.length > 0) {
      await api('PATCH', `/items/paginas/${existentes[0].id}`, pagina);
      console.log(`OK página atualizada: ${slug}`);
    } else {
      await api('POST', '/items/paginas', { slug, ...pagina });
      console.log(`OK página criada: ${slug}`);
    }
  }
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
