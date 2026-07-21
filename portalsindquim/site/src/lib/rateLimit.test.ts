import { describe, expect, it, vi } from 'vitest';
import { permitirTentativa } from './rateLimit';

describe('limitação de frequência', () => {
  it('bloqueia depois do limite dentro da mesma janela', () => {
    const chave = `teste-${crypto.randomUUID()}`;
    expect(permitirTentativa(chave, 2, 60_000)).toBe(true);
    expect(permitirTentativa(chave, 2, 60_000)).toBe(true);
    expect(permitirTentativa(chave, 2, 60_000)).toBe(false);
  });

  it('reabre a janela depois da duração', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-21T12:00:00Z'));
    const chave = `teste-${crypto.randomUUID()}`;
    expect(permitirTentativa(chave, 1, 1_000)).toBe(true);
    expect(permitirTentativa(chave, 1, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(permitirTentativa(chave, 1, 1_000)).toBe(true);
    vi.useRealTimers();
  });
});
