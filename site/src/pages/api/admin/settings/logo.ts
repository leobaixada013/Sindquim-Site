import type { APIRoute } from 'astro';
import {
  enviarLogoConfiguracoesAdmin,
  erroAutenticacaoExpirada,
  limparSessaoAdmin,
  tokenAdmin,
} from '../../../../lib/auth';

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANHO_MAXIMO = 2 * 1024 * 1024;

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { erro: 'Sessão administrativa expirada.' });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respostaJson(400, { erro: 'Upload inválido. Envie uma imagem em multipart/form-data.' });
  }
  const arquivo = formData.get('logo');

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return respostaJson(400, { erro: 'Envie uma imagem para a logo.' });
  }

  if (!TIPOS_PERMITIDOS.has(arquivo.type)) {
    return respostaJson(400, { erro: 'Use PNG, JPG ou WebP. SVG foi bloqueado por segurança.' });
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return respostaJson(400, { erro: 'A logo deve ter no máximo 2 MB.' });
  }

  try {
    const dados = await enviarLogoConfiguracoesAdmin(token, arquivo);
    return respostaJson(200, dados);
  } catch (erro) {
    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { erro: 'Sessão administrativa expirada.' });
    }
    console.error(erro);
    return respostaJson(500, { erro: 'Não foi possível enviar a logo.' });
  }
};
