type Entrada = { valor: unknown; expiraEm: number };

const memoria = new Map<string, Entrada>();

/**
 * Cache em memória com "stale-on-error": se a busca falhar e existir um valor
 * antigo, ele é reaproveitado (o site nunca quebra porque o Directus ou o
 * YouTube estão fora do ar — requisito de servidor caseiro).
 */
export async function comCache<T>(
  chave: string,
  ttlMs: number,
  buscar: () => Promise<T>,
  ttlErroMs = 60_000,
): Promise<T | null> {
  const agora = Date.now();
  const atual = memoria.get(chave);
  if (atual && atual.expiraEm > agora) {
    return atual.valor as T | null;
  }

  try {
    const valor = await buscar();
    memoria.set(chave, { valor, expiraEm: agora + ttlMs });
    return valor;
  } catch {
    const valorAntigo = atual ? (atual.valor as T) : null;
    memoria.set(chave, { valor: valorAntigo, expiraEm: agora + ttlErroMs });
    return valorAntigo;
  }
}

export function limparCache() {
  memoria.clear();
}
