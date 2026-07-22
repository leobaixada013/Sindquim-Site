import { describe, expect, it } from 'vitest';
import { sanitizarHtmlEditorial, serializarJsonLd, urlHttpSegura } from './sanitize';

describe('sanitização de conteúdo editorial', () => {
  it('remove scripts, manipuladores e protocolos executáveis', () => {
    const resultado = sanitizarHtmlEditorial(
      '<p onclick="alert(1)">Texto</p><script>alert(2)</script><a href="javascript:alert(3)">link</a>',
    );
    expect(resultado).toContain('<p>Texto</p>');
    expect(resultado).not.toMatch(/script|onclick|javascript:/i);
  });

  it('preserva somente marcação editorial esperada', () => {
    expect(sanitizarHtmlEditorial('<h2>Título</h2><ul><li><strong>Item</strong></li></ul>'))
      .toBe('<h2>Título</h2><ul><li><strong>Item</strong></li></ul>');
  });

  it('neutraliza fechamento de script no JSON-LD', () => {
    const resultado = serializarJsonLd({ nome: '</script><script>alert(1)</script>' });
    expect(resultado).not.toContain('<');
    expect(resultado).toContain('\\u003c/script>');
  });

  it('aceita apenas URLs HTTP ou HTTPS', () => {
    expect(urlHttpSegura('https://example.com/caminho')).toBe('https://example.com/caminho');
    expect(urlHttpSegura('http://example.com')).toBe('http://example.com/');
    expect(urlHttpSegura('javascript:alert(1)')).toBeNull();
    expect(urlHttpSegura('data:text/html,teste')).toBeNull();
    expect(urlHttpSegura('não é uma url')).toBeNull();
  });
});
