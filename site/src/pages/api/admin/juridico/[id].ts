import type { APIRoute } from 'astro';
import { tokenAdmin } from '../../../../lib/auth';
import { criarClienteAdmin } from '../../../../lib/auth';
import { readItem } from '@directus/sdk';

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const id = params.id;
    if (!id) {
      return new Response(JSON.stringify({ erro: 'ID inválido' }), { status: 400 });
    }

    const token = tokenAdmin(cookies);
    if (!token) {
      return new Response(JSON.stringify({ erro: 'Não autorizado' }), { status: 401 });
    }

    const cliente = criarClienteAdmin(token);
    const chamado = await cliente.request(readItem('chamados_juridicos', id, {
      fields: ['email', 'telefone', 'descricao', 'resposta_advogado']
    }));

    return new Response(JSON.stringify(chamado), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do chamado:', error);
    return new Response(JSON.stringify({ erro: 'Erro interno' }), { status: 500 });
  }
};