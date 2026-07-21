import {
  createDirectus,
  createItem,
  deleteItem,
  inviteUser,
  readItem,
  readItems,
  readMe,
  readRoles,
  readSingleton,
  readUsers,
  rest,
  staticToken,
  updateSingleton,
  updateItem,
  updateUser,
  uploadFiles,
} from '@directus/sdk';
import { normalizarConfiguracoesGlobais } from './directus';
import type { CardInstagram, Categoria, ChamadoJuridico, ConfiguracoesGlobais, Post, PostGaleria, PostSocial, ProximoVideo, SchemaDirectus } from './tipos';

export const ADMIN_TOKEN_COOKIE = 'admin_access_token';

const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
const PUBLIC_DIRECTUS_URL =
  process.env.PUBLIC_DIRECTUS_URL ?? import.meta.env.PUBLIC_DIRECTUS_URL ?? DIRECTUS_URL;

export interface AdminUser {
  id: string;
  email: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | {
    id: string;
    name?: string | null;
    policies?: Array<{ policy?: { id?: string; admin_access?: boolean | null } | string | null }>;
  } | null;
}

export interface AdminSocialData {
  postsSociais: PostSocial[];
  proximosVideos: ProximoVideo[];
  cardsInstagram: CardInstagram[];
}

export interface AdminSettingsData {
  configuracoes: ConfiguracoesGlobais;
  logo_url: string | null;
  youtube_api_key_configurada: boolean;
  instagram_token_configurado: boolean;
}

export interface AdminDashboardData {
  chamadosJuridicos: ChamadoJuridico[];
  postsSociais: PostSocial[];
  chamadosTotal: number;
  chamadosAbertos: number;
  postsTotal: number;
  postsPublicados: number;
  postsAgendados: number;
}

export interface AdminUsuarioDirectus {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  role: string | { id: string; name?: string | null; admin_access?: boolean | null } | null;
}

export interface AdminRoleConvidavel {
  id: string;
  name: string;
  description?: string | null;
}

export interface NovoPostSocial {
  legenda: string;
  status: PostSocial['status'];
  data_publicacao: string | null;
  link_original: string | null;
}

export interface AdminNoticiasData {
  noticias: Post[];
  categorias: Categoria[];
}

type CookieStore = {
  get(name: string): { value: string } | undefined;
  delete?: (name: string, options?: Record<string, unknown>) => void;
};

export function cookieSeguro() {
  return process.env.NODE_ENV === 'production';
}

export function tokenAdmin(cookies: CookieStore): string | null {
  return cookies.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

export function limparSessaoAdmin(cookies: CookieStore): void {
  cookies.delete?.(ADMIN_TOKEN_COOKIE, {
    httpOnly: true,
    sameSite: 'strict',
    secure: cookieSeguro(),
    path: '/',
  });
}

export function erroAutenticacaoExpirada(erro: unknown): boolean {
  const status = (erro as { status?: number })?.status;
  const mensagem = String((erro as { message?: string })?.message ?? erro).toLowerCase();
  return status === 401 || mensagem.includes('token expired') || mensagem.includes('invalid token');
}

export function criarClienteAdmin(token: string) {
  return createDirectus<SchemaDirectus>(DIRECTUS_URL).with(staticToken(token)).with(rest());
}

export async function exigirAcessoEditorial(token: string): Promise<AdminUser> {
  const usuario = await getAdminUser({ get: (nome) => (nome === ADMIN_TOKEN_COOKIE ? { value: token } : undefined) });
  const role = usuario?.role;
  const nomeRole = typeof role === 'object' && role !== null ? String(role.name ?? '') : '';
  if (!usuario || (!usuarioAdminSistema(usuario) && nomeRole !== 'Editor')) {
    throw new Error('Sua conta não tem acesso ao editor de notícias.');
  }
  return usuario;
}

const CAMPOS_NOTICIA_ADMIN = [
  'id', 'status', 'titulo', 'slug', 'resumo', 'conteudo', 'imagem', 'imagem_alt',
  'imagem_legenda', 'imagem_credito', 'fonte_nome', 'fonte_url', 'empresa', 'cidade',
  'data_fato', 'youtube_url', 'fixado_banner', 'publicado_em', 'agendado_para',
  'date_created', 'date_updated',
  { categoria: ['id', 'nome', 'slug'] },
  { galeria: ['id', 'post', 'ordem', 'imagem', 'texto_alternativo', 'legenda', 'credito'] },
] as any;

export async function getAdminNoticiasData(token: string): Promise<AdminNoticiasData> {
  await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  const [noticias, categorias] = await Promise.all([
    cliente.request(readItems('posts', {
      fields: CAMPOS_NOTICIA_ADMIN,
      sort: ['-date_updated', '-date_created'],
      limit: -1,
    } as any)),
    cliente.request(readItems('categorias', {
      fields: ['id', 'nome', 'slug'],
      sort: ['nome'],
      limit: -1,
    })),
  ]);
  return {
    noticias: (noticias ?? []) as unknown as Post[],
    categorias: (categorias ?? []) as Categoria[],
  };
}

export async function getAdminNoticia(token: string, id: string | number, acessoJaValidado = false): Promise<Post> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  return await cliente.request(readItem('posts', id as any, {
    fields: CAMPOS_NOTICIA_ADMIN,
  } as any)) as unknown as Post;
}

export async function enviarImagemEditorialAdmin(
  token: string,
  arquivo: File,
  titulo: string,
  descricao: string,
  acessoJaValidado = false,
): Promise<string> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  const formData = new FormData();
  formData.append('title', titulo.slice(0, 180));
  formData.append('description', descricao.slice(0, 500));
  formData.append('file', arquivo, arquivo.name);
  const enviado = await cliente.request(uploadFiles(formData)) as { id: string } | Array<{ id: string }>;
  const id = Array.isArray(enviado) ? enviado[0]?.id : enviado.id;
  if (!id) throw new Error('O Directus não retornou o identificador da imagem enviada.');
  return id;
}

export async function criarNoticiaAdmin(token: string, dados: Record<string, unknown>, acessoJaValidado = false): Promise<Post> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  return await cliente.request(createItem('posts', dados as any)) as unknown as Post;
}

export async function atualizarNoticiaAdmin(
  token: string,
  id: string | number,
  dados: Record<string, unknown>,
  acessoJaValidado = false,
): Promise<Post> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  return await cliente.request(updateItem('posts', id as any, dados as any)) as unknown as Post;
}

export async function criarFotoGaleriaAdmin(token: string, dados: Record<string, unknown>, acessoJaValidado = false): Promise<PostGaleria> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  return await cliente.request(createItem('posts_galeria', dados as any)) as unknown as PostGaleria;
}

export async function atualizarFotoGaleriaAdmin(
  token: string,
  id: string | number,
  dados: Record<string, unknown>,
  acessoJaValidado = false,
): Promise<PostGaleria> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  return await cliente.request(updateItem('posts_galeria', id as any, dados as any)) as unknown as PostGaleria;
}

export async function removerFotoGaleriaAdmin(token: string, id: string | number, acessoJaValidado = false): Promise<void> {
  if (!acessoJaValidado) await exigirAcessoEditorial(token);
  const cliente = criarClienteAdmin(token);
  await cliente.request(deleteItem('posts_galeria', id as any));
}

export async function obterAssetEditorialAdmin(token: string, id: string, transformacoes?: URLSearchParams): Promise<Response> {
  await exigirAcessoEditorial(token);
  const params = new URLSearchParams();
  for (const chave of ['width', 'height', 'quality', 'fit', 'format']) {
    const valor = transformacoes?.get(chave);
    if (valor) params.set(chave, valor);
  }
  const query = params.size ? `?${params.toString()}` : '';
  return fetch(`${DIRECTUS_URL}/assets/${encodeURIComponent(id)}${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function loginAdmin(email: string, password: string): Promise<string> {
  const resposta = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, mode: 'json' }),
  });

  const json = await resposta.json().catch(() => ({}));
  const accessToken = json?.data?.access_token;

  if (!resposta.ok || !accessToken) {
    throw new Error('Credenciais inválidas ou Directus indisponível.');
  }

  return accessToken;
}

export async function getAdminUser(cookies: CookieStore): Promise<AdminUser | null> {
  const token = tokenAdmin(cookies);
  if (!token) return null;

  try {
    const cliente = criarClienteAdmin(token);
    return await cliente.request(
      readMe({
        fields: [
          'id',
          'email',
          'first_name',
          'last_name',
          { role: ['id', 'name', { policies: [{ policy: ['id', 'admin_access'] }] }] },
        ] as any,
      }),
    ) as unknown as AdminUser;
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) return null;
    throw erro;
  }
}

export function usuarioAdminSistema(usuario: AdminUser | null | undefined): boolean {
  const role = usuario?.role;
  if (!role || typeof role !== 'object') return false;
  return (role.policies ?? []).some((vinculo) =>
    typeof vinculo.policy === 'object' && vinculo.policy?.admin_access === true,
  );
}

export async function exigirAdminSistema(token: string): Promise<AdminUser> {
  const usuario = await getAdminUser({ get: (nome) => (nome === ADMIN_TOKEN_COOKIE ? { value: token } : undefined) });
  if (!usuario || !usuarioAdminSistema(usuario)) {
    throw new Error('Apenas administradores do Directus podem gerenciar usuários.');
  }
  return usuario;
}

export async function exigirAcessoJuridico(token: string): Promise<AdminUser> {
  const usuario = await getAdminUser({ get: (nome) => (nome === ADMIN_TOKEN_COOKIE ? { value: token } : undefined) });
  const role = usuario?.role;
  const nomeRole = typeof role === 'object' && role !== null ? String(role.name ?? '') : '';
  const autorizado = usuarioAdminSistema(usuario) || /jur[ií]dico|juridica|jurídica/i.test(nomeRole);
  if (!usuario || !autorizado) throw new Error('Sua conta não tem acesso aos chamados jurídicos.');
  return usuario;
}

export async function getAdminSocialData(token: string): Promise<AdminSocialData> {
  const cliente = criarClienteAdmin(token);
  const [postsSociais, proximosVideos, cardsInstagram] = await Promise.all([
    cliente.request(
      readItems('posts_sociais', {
        fields: [
          'id',
          'legenda',
          'midia',
          'status',
          'data_publicacao',
          'link_original',
          'visualizacoes',
          'curtidas',
          'comentarios',
          'compartilhamentos',
          'ultima_sincronizacao_metricas',
          'date_created',
          'date_updated',
        ],
        sort: ['-data_publicacao', '-date_created', '-id'],
        limit: 36,
      }),
    ),
    cliente.request(
      readItems('proximos_videos', {
        fields: [
          'id',
          'status',
          'titulo',
          'descricao',
          'data_estreia',
          'imagem',
          'visualizacoes',
          'curtidas',
          'comentarios',
          'compartilhamentos',
          'ultima_sincronizacao_metricas',
          'date_created',
          'date_updated',
        ],
        sort: ['-data_estreia', '-date_created'],
        limit: 12,
      }),
    ),
    cliente.request(
      readItems('cards_instagram', {
        fields: [
          'id',
          'imagem',
          'legenda',
          'link',
          'visualizacoes',
          'curtidas',
          'comentarios',
          'compartilhamentos',
          'ultima_sincronizacao_metricas',
          'date_created',
          'date_updated',
        ],
        sort: ['-date_created', '-curtidas', '-id'],
        limit: 12,
      }),
    ),
  ]);

  return {
    postsSociais: (postsSociais ?? []) as PostSocial[],
    proximosVideos: (proximosVideos ?? []) as ProximoVideo[],
    cardsInstagram: (cardsInstagram ?? []) as CardInstagram[],
  };
}

export async function getAdminDashboardData(token: string): Promise<AdminDashboardData> {
  const cliente = criarClienteAdmin(token);
  const [chamadosJuridicos, postsSociais] = await Promise.all([
    cliente.request(
      readItems('chamados_juridicos', {
        fields: ['id', 'nome', 'email', 'tipo', 'status', 'date_created', 'date_updated'],
        sort: ['-date_created'],
        limit: -1,
      }),
    ),
    cliente.request(
      readItems('posts_sociais', {
        fields: ['id', 'legenda', 'midia', 'status', 'data_publicacao', 'link_original', 'visualizacoes', 'curtidas', 'comentarios', 'compartilhamentos', 'date_created', 'date_updated'],
        sort: ['-data_publicacao', '-date_created', '-id'],
        limit: -1,
      }),
    ),
  ]);

  const chamados = (chamadosJuridicos ?? []) as ChamadoJuridico[];
  const posts = (postsSociais ?? []) as PostSocial[];

  return {
    chamadosJuridicos: chamados.slice(0, 6),
    postsSociais: posts.slice(0, 6),
    chamadosTotal: chamados.length,
    chamadosAbertos: chamados.filter((chamado) => chamado.status === 'Aberto').length,
    postsTotal: posts.length,
    postsPublicados: posts.filter((post) => post.status === 'publicado').length,
    postsAgendados: posts.filter((post) => post.status === 'agendado').length,
  };
}

export async function criarPostSocialAdmin(
  token: string,
  dados: NovoPostSocial,
  arquivo?: File | null,
): Promise<PostSocial> {
  const cliente = criarClienteAdmin(token);
  let midia: string | null = null;

  if (arquivo && arquivo.size > 0) {
    const formData = new FormData();
    formData.append('title', dados.legenda.slice(0, 120));
    formData.append('file', arquivo, arquivo.name);

    const enviado = await cliente.request(uploadFiles(formData)) as { id: string } | Array<{ id: string }>;
    midia = Array.isArray(enviado) ? enviado[0]?.id ?? null : enviado.id;
  }

  return await cliente.request(
    createItem('posts_sociais', {
      legenda: dados.legenda,
      status: dados.status,
      data_publicacao: dados.data_publicacao,
      link_original: dados.link_original,
      midia,
    }),
  ) as PostSocial;
}

export async function getAdminSettingsData(token: string): Promise<AdminSettingsData> {
  const cliente = criarClienteAdmin(token);
  const bruto = await cliente.request(readSingleton('configuracoes_globais')).catch(() => null);
  const configuracoes = normalizarConfiguracoesGlobais(bruto as ConfiguracoesGlobais | null);

  return {
    configuracoes: {
      ...configuracoes,
      youtube_api_key: null,
      instagram_token: null,
    },
    logo_url: assetAdminUrl(configuracoes.logo_site, 320),
    youtube_api_key_configurada: Boolean(configuracoes.youtube_api_key),
    instagram_token_configurado: Boolean(configuracoes.instagram_token),
  };
}

export async function atualizarConfiguracoesGlobaisAdmin(
  token: string,
  dados: Partial<ConfiguracoesGlobais>,
): Promise<AdminSettingsData> {
  const cliente = criarClienteAdmin(token);
  await cliente.request(updateSingleton('configuracoes_globais', dados));
  return getAdminSettingsData(token);
}

export async function enviarLogoConfiguracoesAdmin(token: string, arquivo: File): Promise<AdminSettingsData> {
  const cliente = criarClienteAdmin(token);
  const formData = new FormData();
  formData.append('title', 'Logo do site');
  formData.append('file', arquivo, arquivo.name);

  const enviado = await cliente.request(uploadFiles(formData)) as { id: string } | Array<{ id: string }>;
  const logoId = Array.isArray(enviado) ? enviado[0]?.id ?? null : enviado.id;
  if (!logoId) throw new Error('Directus não retornou o ID do arquivo enviado.');

  await cliente.request(updateSingleton('configuracoes_globais', { logo_site: logoId }));
  return getAdminSettingsData(token);
}

export async function listarUsuariosAdmin(token: string): Promise<AdminUsuarioDirectus[]> {
  await exigirAdminSistema(token);
  const cliente = criarClienteAdmin(token);
  const usuarios = await cliente.request(
    readUsers({
      fields: ['id', 'email', 'first_name', 'last_name', 'status', { role: ['id', 'name'] }] as any,
      sort: ['first_name', 'email'],
      limit: -1,
    }),
  );
  return ((usuarios ?? []) as unknown as AdminUsuarioDirectus[]).filter((usuario) => {
    const nomeRole = typeof usuario.role === 'object' && usuario.role
      ? String(usuario.role.name ?? '')
      : '';
    return !/^Serviço\b/i.test(nomeRole);
  });
}

const ROLES_CONVIDAVEIS = new Set(['Editor', 'Jurídico']);

export async function listarRolesConvidaveisAdmin(token: string): Promise<AdminRoleConvidavel[]> {
  await exigirAdminSistema(token);
  const cliente = criarClienteAdmin(token);
  const roles = await cliente.request(readRoles({
    fields: ['id', 'name', 'description'],
    sort: ['name'],
    limit: -1,
  }));
  return ((roles ?? []) as unknown as AdminRoleConvidavel[])
    .filter((role) => ROLES_CONVIDAVEIS.has(role.name));
}

export async function convidarUsuarioAdmin(token: string, email: string, roleId: string): Promise<void> {
  await exigirAdminSistema(token);
  const emailLimpo = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) throw new Error('Informe um e-mail válido.');

  const roles = await listarRolesConvidaveisAdmin(token);
  const role = roles.find((item) => item.id === roleId);
  if (!role) throw new Error('Escolha uma função permitida: Editor ou Jurídico.');

  const cliente = criarClienteAdmin(token);
  await cliente.request(inviteUser(emailLimpo, role.id));
}

export async function atualizarStatusUsuarioAdmin(
  token: string,
  id: string,
  status: 'active' | 'suspended',
): Promise<AdminUsuarioDirectus> {
  const usuarioAtual = await exigirAdminSistema(token);
  if (usuarioAtual.id === id) {
    throw new Error('Você não pode desativar a própria sessão administrativa.');
  }

  const cliente = criarClienteAdmin(token);
  const usuario = await cliente.request(
    updateUser(id, { status }, { fields: ['id', 'email', 'first_name', 'last_name', 'status', { role: ['id', 'name'] }] as any }),
  );
  return usuario as unknown as AdminUsuarioDirectus;
}

export function assetAdminUrl(id: string | null, largura = 720): string | null {
  if (!id) return null;
  const params = new URLSearchParams({
    width: String(largura),
    fit: 'cover',
    format: 'webp',
    quality: '78',
  });
  return `${PUBLIC_DIRECTUS_URL}/assets/${encodeURIComponent(id)}?${params}`;
}
