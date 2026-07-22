import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST ?? import.meta.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? import.meta.env.SMTP_PORT ?? 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE ?? import.meta.env.SMTP_SECURE ?? 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER ?? import.meta.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS ?? import.meta.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? import.meta.env.SMTP_FROM;
const SMTP_REPLY_TO = process.env.SMTP_REPLY_TO ?? import.meta.env.SMTP_REPLY_TO;

export interface RespostaJuridicaEmail {
  para: string;
  nome: string;
  tipo: string;
  resposta: string;
  chamadoId: string;
}

export function smtpConfigurado(): boolean {
  return Boolean(SMTP_HOST && SMTP_FROM && (!SMTP_USER || SMTP_PASS));
}

export async function enviarRespostaJuridica({
  para,
  nome,
  tipo,
  resposta,
  chamadoId,
}: RespostaJuridicaEmail): Promise<boolean> {
  if (!smtpConfigurado()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP não configurado para envio da resposta jurídica.');
    }
    console.warn('SMTP não configurado; resposta jurídica salva sem envio de e-mail.');
    return false;
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  const texto = [
    `Olá, ${nome}.`,
    '',
    `O departamento jurídico do sindicato respondeu ao seu chamado (${tipo}).`,
    '',
    'Resposta do advogado:',
    resposta,
    '',
    `Protocolo: ${chamadoId}`,
    '',
    'Se ainda tiver dúvidas, responda este e-mail ou entre em contato com a sede do sindicato.',
  ].join('\n');

  await transport.sendMail({
    from: SMTP_FROM,
    to: para,
    replyTo: SMTP_REPLY_TO || SMTP_FROM,
    subject: 'Resposta do atendimento jurídico do sindicato',
    text: texto,
  });

  return true;
}
