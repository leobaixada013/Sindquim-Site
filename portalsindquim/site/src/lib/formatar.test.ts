import { describe, expect, it } from 'vitest';
import {
  formatarData,
  formatarDataEstreia,
  formatarDiaMes,
} from './formatar';

describe('formatar datas em pt-BR (fuso America/Sao_Paulo)', () => {
  it('formatarData: dd/mm/aaaa', () => {
    expect(formatarData('2026-07-12T22:00:00Z')).toBe('12/07/2026');
  });

  it('formatarDiaMes: dd/mm', () => {
    expect(formatarDiaMes('2026-07-05T12:00:00Z')).toBe('05/07');
  });

  it('formatarDataEstreia: dia da semana, data e hora local', () => {
    // 22:00 UTC = 19:00 em São Paulo (UTC-3)
    const texto = formatarDataEstreia('2026-07-12T22:00:00Z');
    expect(texto).toContain('domingo');
    expect(texto).toContain('12 de julho');
    expect(texto).toContain('19h00');
  });
});
