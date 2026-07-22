import {
  createDirectus,
  createItem,
  readItem,
  readItems,
  rest,
  staticToken,
  updateItem,
  uploadFiles,
} from '@directus/sdk';
import { criarClienteAdmin, exigirAcessoJuridico } from './auth';
import { enviarRespostaJuridica } from './mailer';
import type { ChamadoJuridico, SchemaDirectus, StatusChamadoJuridico } from './tipos';

const DIRECTUS_URL =
  process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
const DIRECTUS_JURIDICO_TOKEN = process.env.DIRECTUS_JURIDICO_TOKEN;
const DIRECTUS_JURIDICO_FOLDER_ID = process.env.DIRECTUS_JURIDICO_FOLDER_ID;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_VALIDOS: StatusChamadoJuridico[] = ['Aberto', 'Em Análise', 'Concluído'];
const TIPOS_VALIDOS = [
  'Demissão / Rescisão',
  'Horas Extras / Jornada',
  'Assédio / Discriminação',
  'Acidente de Trabalho',
  'Dúvida Geral',
];
const TIPOS_ANEXO = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const EXTENSOES_ANEXO = /\.(pdf|jpe?g|png|webp)$/i;
const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024;

export interface ResultadoChamadoPublico {
  ok: boolean;
  id?: string;
  erro?: string;
}

export interface ChamadoJuridicoAdmin extends ChamadoJuridico {
  cpf_mascarado: string;
  anexo_url: string | null;
}

export interface DashboardJuridico {
  metricas: {
    total: number;
    abertos: number;
    emAnalise: number;
    concluidos: number;
  };
  chamados: ChamadoJuridicoAdmin[];
}

export interface ResultadoRespostaJuridica {
  ok: boolean;
  emailEnviado: boolean;
  chamado?: ChamadoJuridicoAdmin;
  erro?: string;
}

function texto(dados: FormData, chave: string, limite: number): string {
  return String(dados.get(chave) ?? '').trim().slice(0, limite);
}

function apenasDigitos(valor: string | null | undefined): string {
  return String(valor ?? '').replace(/\D/g, '');
}

function validarCpf(cpf: string): boolean {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(digitos[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== Number(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(digitos[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === Number(digitos[10]);
}

export function mascararCpf(cpf: string | null | undefined): string {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11) return 'CPF não informado';
  return `${digitos.slice(0, 3)}.***.***-${digitos.slice(9)}`;
}

export function assetAnexoJuridicoUrl(id: string | null, token: string | null): string | null {
  if (!id || !token) return null;
  const DIRECTUS_URL = process.env.DIRECTUS_URL ?? import.meta.env.DIRECTUS_URL ?? 'http://localhost:8055';
  return `${DIRECTUS_URL}/assets/${encodeURIComponent(id)}`;
}

function validarAnexo(arquivo: FormDataEntryValue | null): arquivo is File {
  return arquivo instanceof File && arquivo.size > 0;
}

async function assinaturaAnexoValida(arquivo: File): Promise<boolean> {
  const bytes = new Uint8Array(await arquivo.slice(0, 16).arrayBuffer());
  const ehPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
  const ehJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const ehPng = bytes.slice(0, 8).every((valor, indice) => valor === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][indice]);
  const ehWebp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return ehPdf || ehJpeg || ehPng || ehWebp;
}

async function criarClienteServico() {
  if (!DIRECTUS_JURIDICO_TOKEN) {
    throw new Error('Token de serviço jurídico de menor privilégio não configurado.');
  }
  return createDirectus<SchemaDirectus>(DIRECTUS_URL).with(staticToken(DIRECTUS_JURIDICO_TOKEN)).with(rest());
}

function normalizarChamado(chamado: ChamadoJuridico): ChamadoJuridicoAdmin {
  return {
    ...chamado,
    cpf_mascarado: mascararCpf(chamado.cpf),
    anexo_url: chamado.anexo ? `/api/admin/juridico/anexo/${chamado.anexo}` : null,
  };
}

export async function abrirChamadoJuridico(dados: FormData): Promise<ResultadoChamadoPublico> {
  const honeypot = String(dados.get('site') ?? '');
  if (honeypot !== '') return { ok: true };

  const nome = texto(dados, 'nome', 120);
  const cpf = texto(dados, 'cpf', 20);
  const email = texto(dados, 'email', 180);
  const telefone = texto(dados, 'telefone', 40);
  const tipo = texto(dados, 'tipo', 80);
  const descricao = texto(dados, 'descricao', 5000);
  const consentimento = texto(dados, 'consentimento_privacidade', 10);
  const anexo = dados.get('anexo');

  if (nome.length < 3) return { ok: false, erro: 'Informe seu nome completo.' };
  if (cpf && !validarCpf(cpf)) return { ok: false, erro: 'Confira o CPF ou deixe o campo em branco.' };
  if (!EMAIL_VALIDO.test(email)) return { ok: false, erro: 'Informe um e-mail válido.' };
  if (apenasDigitos(telefone).length < 10) return { ok: false, erro: 'Informe um telefone válido.' };
  if (!TIPOS_VALIDOS.includes(tipo)) return { ok: false, erro: 'Selecione o tipo de demanda.' };
  if (descricao.length < 20) return { ok: false, erro: 'Descreva o caso com pelo menos 20 caracteres.' };
  if (consentimento !== 'sim') return { ok: false, erro: 'Confirme que leu o aviso de privacidade.' };
  if (validarAnexo(anexo)) {
    if (anexo.size > TAMANHO_MAXIMO_ANEXO) return { ok: false, erro: 'O anexo deve ter no máximo 10 MB.' };
    if (!TIPOS_ANEXO.has(anexo.type) || !EXTENSOES_ANEXO.test(anexo.name) || !(await assinaturaAnexoValida(anexo))) {
      return { ok: false, erro: 'Use um arquivo PDF, JPG, PNG ou WebP válido.' };
    }
  }

  const cliente = await criarClienteServico();
  let anexoId: string | null = null;
  if (validarAnexo(anexo)) {
    const formData = new FormData();
    formData.append('title', `Anexo de triagem — ${nome}`);
    if (DIRECTUS_JURIDICO_FOLDER_ID) formData.append('folder', DIRECTUS_JURIDICO_FOLDER_ID);
    formData.append('file', anexo, anexo.name);
    const enviado = await cliente.request(uploadFiles(formData)) as { id: string } | Array<{ id: string }>;
    anexoId = Array.isArray(enviado) ? enviado[0]?.id ?? null : enviado.id;
    if (!anexoId) throw new Error('Directus não retornou o ID do anexo jurídico.');
  }

  const agora = new Date();
  const retencao = new Date(agora);
  retencao.setFullYear(retencao.getFullYear() + 2);

  const chamado = await cliente.request(
    createItem('chamados_juridicos', {
      nome,
      cpf: cpf ? apenasDigitos(cpf) : null,
      email,
      telefone,
      tipo,
      descricao,
      anexo: anexoId,
      status: 'Aberto',
      aviso_privacidade_versao: '2026-07-21',
      consentimento_em: agora.toISOString(),
      retencao_ate: retencao.toISOString(),
    }),
  ) as ChamadoJuridico;

  return { ok: true, id: chamado.id };
}

export async function listarChamadosJuridicos(tokenAdmin: string): Promise<DashboardJuridico> {
  await exigirAcessoJuridico(tokenAdmin);
  const cliente = criarClienteAdmin(tokenAdmin);
  const chamados = await cliente.request(
    readItems('chamados_juridicos', {
      fields: [
        'id',
        'nome',
        'cpf',
        'email',
        'telefone',
        'tipo',
        'descricao',
        'anexo',
        'status',
        'resposta_advogado',
        'date_created',
        'date_updated',
        'respondido_em',
        'email_resposta_enviado_em',
      ],
      sort: ['-date_created'],
      limit: -1,
    }),
  ) as ChamadoJuridico[];

  const normalizados = (chamados ?? []).map(normalizarChamado);
  return {
    metricas: {
      total: normalizados.length,
      abertos: normalizados.filter((chamado) => chamado.status === 'Aberto').length,
      emAnalise: normalizados.filter((chamado) => chamado.status === 'Em Análise').length,
      concluidos: normalizados.filter((chamado) => chamado.status === 'Concluído').length,
    },
    chamados: normalizados,
  };
}

export async function responderChamadoJuridico({
  tokenAdmin,
  id,
  status,
  respostaAdvogado,
}: {
  tokenAdmin: string;
  id: string;
  status: StatusChamadoJuridico;
  respostaAdvogado: string;
}): Promise<ResultadoRespostaJuridica> {
  await exigirAcessoJuridico(tokenAdmin);
  if (!id) return { ok: false, emailEnviado: false, erro: 'Chamado inválido.' };
  if (!STATUS_VALIDOS.includes(status) || status === 'Aberto') {
    return { ok: false, emailEnviado: false, erro: 'Status inválido para resposta.' };
  }
  const resposta = respostaAdvogado.trim().slice(0, 8000);
  if (status === 'Concluído' && resposta.length < 10) {
    return { ok: false, emailEnviado: false, erro: 'Escreva uma resposta antes de concluir.' };
  }

  const cliente = criarClienteAdmin(tokenAdmin);
  const anterior = await cliente.request(readItem('chamados_juridicos', id)) as ChamadoJuridico;
  const agora = new Date().toISOString();
  let emailEnviado = false;
  let erroEmail: string | undefined;

  if (status === 'Concluído' && (!anterior.status || anterior.status !== 'Concluído' || !anterior.email_resposta_enviado_em)) {
    try {
      emailEnviado = await enviarRespostaJuridica({
        para: anterior.email,
        nome: anterior.nome,
        tipo: anterior.tipo,
        resposta: resposta || anterior.resposta_advogado || '',
        chamadoId: anterior.id,
      });

      if (emailEnviado) {
        const comEmail = await cliente.request(
          updateItem('chamados_juridicos', id, {
            status: 'Concluído',
            resposta_advogado: resposta || anterior.resposta_advogado,
            respondido_em: agora,
            email_resposta_enviado_em: new Date().toISOString()
          }),
        ) as ChamadoJuridico;
        return { ok: true, emailEnviado, chamado: normalizarChamado(comEmail) };
      } else {
        erroEmail = 'O servidor SMTP não conseguiu enviar o e-mail.';
      }
    } catch (err) {
      console.error('Falha ao enviar e-mail jurídico:', err);
      erroEmail = 'Falha técnica ao tentar enviar o e-mail.';
      emailEnviado = false;
    }

    // Se o envio falhar e o chamado não era concluído antes, salvamos a resposta mas deixamos "Em Análise"
    if (!emailEnviado) {
       const mantidoEmAnalise = await cliente.request(
        updateItem('chamados_juridicos', id, {
          status: 'Em Análise',
          resposta_advogado: resposta || anterior.resposta_advogado,
        }),
      ) as ChamadoJuridico;
      return { ok: false, emailEnviado: false, erro: erroEmail || 'Falha ao enviar e-mail.', chamado: normalizarChamado(mantidoEmAnalise) };
    }
  }

  const atualizado = await cliente.request(
    updateItem('chamados_juridicos', id, {
      status,
      resposta_advogado: resposta || anterior.resposta_advogado,
      respondido_em: status === 'Concluído' ? agora : anterior.respondido_em ?? null,
    }),
  ) as ChamadoJuridico;

  return { ok: true, emailEnviado, chamado: normalizarChamado(atualizado) };
}
