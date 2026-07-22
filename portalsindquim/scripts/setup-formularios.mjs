/** Configura identidade técnica de menor privilégio para contato e newsletter. */

const URL_BASE = process.env.DIRECTUS_URL ?? 'http://localhost:8155';
const EMAIL_ADMIN = process.env.DIRECTUS_ADMIN_EMAIL;
const SENHA_ADMIN = process.env.DIRECTUS_ADMIN_PASSWORD;
const TOKEN_SERVICO = process.env.DIRECTUS_FORMS_TOKEN;
const EMAIL_SERVICO = process.env.DIRECTUS_FORMS_EMAIL ?? 'servico-formularios@example.com';
let token = '';

if (!EMAIL_ADMIN || !SENHA_ADMIN || !TOKEN_SERVICO) {
  console.error('Defina DIRECTUS_ADMIN_EMAIL, DIRECTUS_ADMIN_PASSWORD e DIRECTUS_FORMS_TOKEN.');
  process.exit(1);
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
  const texto = await resposta.text();
  const json = texto ? JSON.parse(texto) : {};
  if (!resposta.ok) {
    const erro = new Error(`${metodo} ${caminho} → ${resposta.status}: ${JSON.stringify(json.errors ?? json).slice(0, 400)}`);
    erro.status = resposta.status;
    throw erro;
  }
  return json.data;
}

async function encontrarOuCriar(caminho, nome, payload) {
  const existentes = await api('GET', `${caminho}?filter[name][_eq]=${encodeURIComponent(nome)}&limit=1&fields=id,name`);
  if (existentes[0]) {
    await api('PATCH', `${caminho}/${existentes[0].id}`, payload);
    return existentes[0];
  }
  return api('POST', caminho, { name: nome, ...payload });
}

async function garantirPermissao(policy, collection, action, fields) {
  const caminho = `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=${action}&limit=-1&fields=id`;
  const existentes = await api('GET', caminho);
  const payload = { policy, collection, action, fields, permissions: {}, validation: {}, presets: null };
  if (existentes.length) {
    for (const permissao of existentes) await api('PATCH', `/permissions/${permissao.id}`, payload);
  } else {
    await api('POST', '/permissions', payload);
  }
}

async function politicaPublica() {
  const politicas = await api('GET', '/policies?limit=-1&fields=id,name');
  const publica = politicas.find((item) => /public/i.test(item.name ?? ''));
  if (!publica) throw new Error('Política pública não encontrada.');
  return publica.id;
}

async function revogarCriacaoPublica(policy) {
  for (const collection of ['inscricoes_newsletter', 'mensagens_contato']) {
    const existentes = await api('GET', `/permissions?filter[policy][_eq]=${policy}&filter[collection][_eq]=${collection}&filter[action][_eq]=create&limit=-1&fields=id`);
    for (const permissao of existentes) await api('DELETE', `/permissions/${permissao.id}`);
  }
}

async function garantirUsuario(roleId) {
  const existentes = await api('GET', `/users?filter[email][_eq]=${encodeURIComponent(EMAIL_SERVICO)}&limit=1&fields=id,email`);
  const payload = {
    email: EMAIL_SERVICO,
    first_name: 'Serviço',
    last_name: 'Formulários do Portal',
    status: 'active',
    role: roleId,
    token: TOKEN_SERVICO,
  };
  if (existentes[0]) return api('PATCH', `/users/${existentes[0].id}`, payload);
  return api('POST', '/users', payload);
}

async function principal() {
  const login = await fetch(`${URL_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL_ADMIN, password: SENHA_ADMIN }),
  });
  if (!login.ok) throw new Error(`Login administrativo falhou (${login.status}).`);
  token = (await login.json()).data.access_token;

  await revogarCriacaoPublica(await politicaPublica());
  const policy = await encontrarOuCriar('/policies', 'Portal — formulários públicos', {
    app_access: false,
    admin_access: false,
    icon: 'forward_to_inbox',
    description: 'Identidade técnica do site para gravar contato e newsletter; sem leitura, edição ou exclusão.',
  });
  const role = await encontrarOuCriar('/roles', 'Serviço de formulários do portal', {
    icon: 'forward_to_inbox',
    description: 'Uso servidor a servidor. Não permite entrar no painel.',
    policies: [{ policy: policy.id }],
  });
  await garantirPermissao(policy.id, 'inscricoes_newsletter', 'create', ['email']);
  await garantirPermissao(policy.id, 'mensagens_contato', 'create', ['nome', 'email', 'mensagem']);

  const existentes = await api('GET', `/permissions?filter[policy][_eq]=${policy.id}&limit=-1&fields=id,collection,action`);
  const permitidas = new Set(['inscricoes_newsletter:create', 'mensagens_contato:create']);
  for (const permissao of existentes) {
    if (!permitidas.has(`${permissao.collection}:${permissao.action}`)) await api('DELETE', `/permissions/${permissao.id}`);
  }
  await garantirUsuario(role.id);
  console.log('Serviço de formulários pronto; gravação pública direta revogada.');
}

principal().catch((erro) => {
  console.error(erro.message);
  process.exit(1);
});
