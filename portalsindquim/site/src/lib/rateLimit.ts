type Janela = { inicio: number; tentativas: number };

const janelas = new Map<string, Janela>();

export function permitirTentativa(
  chave: string,
  limite = 5,
  duracaoMs = 15 * 60 * 1000,
): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (!atual || agora - atual.inicio >= duracaoMs) {
    janelas.set(chave, { inicio: agora, tentativas: 1 });
    return true;
  }
  atual.tentativas += 1;
  if (janelas.size > 2_000) {
    for (const [id, janela] of janelas) {
      if (agora - janela.inicio >= duracaoMs) janelas.delete(id);
    }
  }
  return atual.tentativas <= limite;
}
