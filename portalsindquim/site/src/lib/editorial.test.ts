import { describe, expect, it } from 'vitest';
import {
  htmlParaTextoEditorial,
  gerarSlugEditorial,
  textoParaHtmlEditorial,
  tituloRascunho,
  tituloVisivelNoEditor,
  validarDadosEditoriais,
} from './editorial';

describe('fluxo editorial simplificado', () => {
  it('permite salvar rascunho incompleto', () => {
    expect(validarDadosEditoriais({
      acao: 'draft', titulo: '', conteudo: '', possuiCapa: false, imagemAlt: '',
      agendadoPara: null, fontePropria: true, fonteNome: '', fonteUrl: '', galeriaAlternativos: [],
    })).toEqual([]);
  });

  it('exige os campos essenciais ao publicar', () => {
    const erros = validarDadosEditoriais({
      acao: 'publish', titulo: '', conteudo: '', possuiCapa: false, imagemAlt: '',
      agendadoPara: null, fontePropria: true, fonteNome: '', fonteUrl: '', galeriaAlternativos: [''],
    });
    expect(erros.map((erro) => erro.campo)).toEqual(['titulo', 'conteudo', 'capa', 'imagem_alt', 'galeria_alt_0']);
  });

  it('exige fonte verificável quando o conteúdo não é próprio', () => {
    const erros = validarDadosEditoriais({
      acao: 'publish', titulo: 'Título', conteudo: 'Texto', possuiCapa: true, imagemAlt: 'Foto',
      agendadoPara: null, fontePropria: false, fonteNome: '', fonteUrl: 'site sem protocolo', galeriaAlternativos: [],
    });
    expect(erros.map((erro) => erro.campo)).toEqual(['fonte_nome', 'fonte_url']);
  });

  it('aceita somente agendamento futuro', () => {
    const agora = new Date('2026-07-21T18:00:00-03:00');
    const base = {
      acao: 'schedule' as const, titulo: 'Título', conteudo: 'Texto', possuiCapa: true,
      imagemAlt: 'Foto', fontePropria: true, fonteNome: '', fonteUrl: '', galeriaAlternativos: [],
    };
    expect(validarDadosEditoriais({ ...base, agendadoPara: '2026-07-21T20:00:00-03:00' }, agora)).toEqual([]);
    expect(validarDadosEditoriais({ ...base, agendadoPara: '2026-07-21T17:00:00-03:00' }, agora)[0]?.campo).toBe('agendado_para');
  });

  it('converte texto simples em HTML seguro e volta para edição', () => {
    const html = textoParaHtmlEditorial('Primeiro <teste>\n\nSegundo');
    expect(html).toBe('<p>Primeiro &lt;teste&gt;</p>\n<p>Segundo</p>');
    expect(htmlParaTextoEditorial(html)).toBe('Primeiro <teste>\n\nSegundo');
  });

  it('esconde o título técnico de rascunhos sem título', () => {
    const titulo = tituloRascunho(new Date('2026-07-21T21:15:00Z'));
    expect(titulo).toContain('Rascunho sem título');
    expect(tituloVisivelNoEditor(titulo)).toBe('');
  });

  it('gera endereço legível quando um rascunho recebe título', () => {
    expect(gerarSlugEditorial('Ação química em São Paulo')).toBe('acao-quimica-em-sao-paulo');
  });
});
