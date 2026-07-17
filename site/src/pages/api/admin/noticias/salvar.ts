import type { APIRoute } from 'astro';
import { erroAutenticacaoExpirada, limparSessaoAdmin, tokenAdmin } from '../../../../../lib/auth';
import { createDirectus, rest, createItem, updateItem, uploadFiles } from '@directus/sdk';

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? import.meta.env?.DIRECTUS_URL ?? 'http://localhost:8055';

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function generateSlug(title: string) {
  return title
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = tokenAdmin(cookies);
  if (!token) return respostaJson(401, { ok: false, erro: 'Sessão administrativa expirada.' });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return respostaJson(400, { ok: false, erro: 'Payload inválido.' });
  }

  const id = String(formData.get('id') ?? '').trim();
  const titulo = String(formData.get('titulo') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  let slug = String(formData.get('slug') ?? '').trim();
  const resumo = String(formData.get('resumo') ?? '').trim();
  const conteudo = String(formData.get('conteudo') ?? '').trim();
  const imagemAtual = String(formData.get('imagem_atual') ?? '').trim();
  const fileEntry = formData.get('imagem');

  if (!titulo) {
    return respostaJson(400, { ok: false, erro: 'Título é obrigatório.' });
  }
  if (!conteudo) {
    return respostaJson(400, { ok: false, erro: 'Conteúdo é obrigatório.' });
  }

  if (!slug) {
    slug = generateSlug(titulo);
  }

  const cliente = createDirectus(DIRECTUS_URL).with(rest()).with(c => ({
    request: (req: any) => c.request(req, { headers: { Authorization: `Bearer ${token}` } })
  }));

  try {
    let finalImageId = imagemAtual || null;

    // Se tem um arquivo novo e não está vazio
    if (fileEntry instanceof File && fileEntry.size > 0) {
      const uploadData = new FormData();
      uploadData.append('file', fileEntry);

      const fileResponse = await cliente.request(uploadFiles(uploadData));
      finalImageId = fileResponse.id;
    }

    const payload = {
      titulo,
      slug,
      status: ['published', 'draft', 'archived'].includes(status) ? status : 'draft',
      resumo: resumo || null,
      conteudo,
      imagem: finalImageId,
    };

    let result;
    if (id) {
      result = await cliente.request(updateItem('posts', id, payload));
    } else {
      result = await cliente.request(createItem('posts', payload));
    }

    return respostaJson(200, { ok: true, id: result.id });
  } catch (erro: any) {
    console.error('Erro ao salvar post:', erro?.errors?.[0] || erro);

    if (erro?.errors?.[0]?.extensions?.code === 'RECORD_NOT_UNIQUE') {
      return respostaJson(400, { ok: false, erro: 'Já existe uma publicação com este Slug (URL amigável). Altere o título ou o slug e tente novamente.' });
    }

    if (erroAutenticacaoExpirada(erro)) {
      limparSessaoAdmin(cookies);
      return respostaJson(401, { ok: false, erro: 'Sessão administrativa expirada.' });
    }

    return respostaJson(500, { ok: false, erro: 'Não foi possível salvar a notícia.' });
  }
};