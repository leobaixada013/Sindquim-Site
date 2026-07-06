import type { APIRoute } from 'astro';
import { criarMensagemContato, getJuridicoCamposFormulario } from '../../lib/directus';
import type { JuridicoCampoFormulario } from '../../lib/tipos';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHAVE_SEGURA = /^[a-z0-9_]+$/;

function valorTexto(dados: FormData, chave: string, limite: number): string {
  return String(dados.get(chave) ?? '').trim().slice(0, limite);
}

function limiteCampo(campo: JuridicoCampoFormulario): number {
  return Math.min(Math.max(campo.max_length ?? 180, 1), 4000);
}

function valorEhValido(campo: JuridicoCampoFormulario, valor: string): boolean {
  if (campo.obrigatorio && !valor) return false;
  if (!valor) return true;
  if (campo.tipo === 'email') return EMAIL_VALIDO.test(valor);
  if (campo.tipo === 'select') {
    const opcoes = (campo.opcoes ?? '')
      .split('\n')
      .map((opcao) => opcao.trim())
      .filter(Boolean);
    return opcoes.length === 0 || opcoes.includes(valor);
  }
  return true;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const dados = await request.formData();
  const honeypot = String(dados.get('site') ?? '');
  const nome = valorTexto(dados, 'nome', 120);
  const email = valorTexto(dados, 'email', 180);
  const relato = valorTexto(dados, 'relato', 4000);

  if (honeypot !== '') {
    return redirect('/juridico?agendamento=ok', 303);
  }
  if (!nome || !relato || !EMAIL_VALIDO.test(email)) {
    return redirect('/juridico?agendamento=erro', 303);
  }

  try {
    const campos = (await getJuridicoCamposFormulario()).filter((campo) => CHAVE_SEGURA.test(campo.chave));
    const linhasCampos: string[] = [];

    for (const campo of campos) {
      const valor = valorTexto(dados, campo.chave, limiteCampo(campo));
      if (!valorEhValido(campo, valor)) {
        return redirect('/juridico?agendamento=erro', 303);
      }
      if (valor) {
        linhasCampos.push(`${campo.rotulo}: ${valor}`);
      }
    }

    const mensagem = [
      '[Agendamento jurídico]',
      ...linhasCampos,
      '',
      'Relato:',
      relato,
    ].join('\n');

    await criarMensagemContato({ nome, email, mensagem });
    return redirect('/juridico?agendamento=ok', 303);
  } catch {
    return redirect('/juridico?agendamento=erro', 303);
  }
};
