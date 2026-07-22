import { describe, expect, it } from 'vitest';
import { validarOrigemAdmin } from './adminSecurity';

describe('origem das mutações administrativas', () => {
  it('aceita a origem pública mesmo quando o proxy troca o Host interno', () => {
    const request = new Request('http://sindquim-site:4321/api/admin/login', {
      method: 'POST',
      headers: { host: 'sindquim-site:4321', origin: 'https://sindquimteste.eduaio.xyz' },
    });
    expect(validarOrigemAdmin(request, 'https://sindquimteste.eduaio.xyz')).toBe(true);
  });

  it('rejeita mutação vinda de outro site', () => {
    const request = new Request('http://sindquim-site:4321/api/admin/login', {
      method: 'POST',
      headers: { host: 'sindquim-site:4321', origin: 'https://site-malicioso.example' },
    });
    expect(validarOrigemAdmin(request, 'https://sindquimteste.eduaio.xyz')).toBe(false);
  });
});
