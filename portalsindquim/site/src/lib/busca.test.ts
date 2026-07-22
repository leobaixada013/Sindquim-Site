import { describe, expect, it } from 'vitest';
import { limitarResumo, normalizarBusca, resultadoCorresponde, textoBusca, type ResultadoBusca } from './busca';

const resultado: ResultadoBusca = {
  tipo: 'Notícia',
  titulo: 'Produção química em Cubatão',
  resumo: 'Informação para trabalhadores da região.',
  href: '/noticias/producao-quimica',
  campos: ['Produção química em Cubatão', 'Guarujá', 'indústria'],
};

describe('busca do portal', () => {
  it('ignora acentos e diferenças entre maiúsculas e minúsculas', () => {
    expect(normalizarBusca('REAÇÃO Química')).toBe('reacao quimica');
    expect(resultadoCorresponde(resultado, 'producao')).toBe(true);
    expect(resultadoCorresponde(resultado, 'GUARUJA')).toBe(true);
  });

  it('não executa consulta com menos de dois caracteres', () => {
    expect(resultadoCorresponde(resultado, 'q')).toBe(false);
  });

  it('remove marcação HTML e limita resumos sem cortar cedo demais', () => {
    expect(textoBusca('<p>Direitos &amp; benefícios</p>')).toBe('Direitos & benefícios');
    expect(limitarResumo('uma frase curta', 40)).toBe('uma frase curta');
    expect(limitarResumo('uma frase longa o suficiente para precisar de recorte', 24)).toBe('uma frase longa o…');
  });
});
