import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repoRoot = new URL('../../..', import.meta.url);
const backup = readFileSync(new URL('../../../scripts/backup.sh', import.meta.url), 'utf8');
const restore = readFileSync(new URL('../../../scripts/restore.sh', import.meta.url), 'utf8');
const update = readFileSync(new URL('../../../scripts/update-images.sh', import.meta.url), 'utf8');
const compose = readFileSync(new URL('../../../deploy/docker-compose.yml', import.meta.url), 'utf8');
const seed = readFileSync(new URL('../../../scripts/directus-conteudo-exemplo.mjs', import.meta.url), 'utf8');

describe('operação Docker e recuperação', () => {
  it('mantém PostgreSQL e uploads em volumes separados e com healthchecks', () => {
    expect(compose).toContain('database_data:/var/lib/postgresql/data');
    expect(compose).toContain('directus_uploads:/directus/uploads');
    expect(compose).toContain('pg_isready');
    expect(compose).toContain('/server/ping');
    expect(compose).toContain('/api/health');
  });

  it('fixa imagens de infraestrutura por versão e digest', () => {
    expect(compose).toMatch(/postgres:17\.6-alpine3\.22@sha256:[a-f0-9]{64}/);
    const directusDockerfile = readFileSync(new URL('../../../deploy/directus/Dockerfile', import.meta.url), 'utf8');
    expect(directusDockerfile).toMatch(/directus\/directus:11\.17\.4@sha256:[a-f0-9]{64}/);
  });

  it('faz backup consistente do banco, uploads e manifesto com checksums', () => {
    expect(backup).toContain('pg_dump --format=custom');
    expect(backup).toContain('/directus/uploads');
    expect(backup).toContain('images.json');
    expect(backup).toContain('SHA256SUMS');
    expect(backup).toContain('secrets_included=false');
  });

  it('exige confirmação, valida checksums e cria backup antes do restore', () => {
    expect(restore).toContain('"${1:-}" != "--confirm"');
    expect(restore).toContain('shasum -a 256 -c');
    expect(restore.indexOf('"${SCRIPT_DIR}/backup.sh"')).toBeLessThan(restore.indexOf('pg_restore --clean'));
    expect(restore).toContain('up -d --wait --wait-timeout 180');
  });

  it('reconstrói imagens somente depois de um backup', () => {
    expect(update.indexOf('"${SCRIPT_DIR}/backup.sh"')).toBeLessThan(update.indexOf('build --pull'));
    expect(update).toContain('up -d --remove-orphans --wait');
  });

  it('scripts operacionais têm sintaxe Bash válida', () => {
    for (const script of ['scripts/backup.sh', 'scripts/restore.sh', 'scripts/update-images.sh']) {
      expect(() => execFileSync('bash', ['-n', script], { cwd: repoRoot })).not.toThrow();
    }
  });
});

describe('conteúdo demonstrativo', () => {
  it('não usa download de mídia externa nem recria o módulo de documentos', () => {
    expect(seed).not.toContain('picsum');
    expect(seed).not.toContain("'documentos'");
    expect(seed).not.toContain('/files/import');
    expect(seed).toContain("assets/hero-assembleia-sindicato.png");
  });

  it('marca publicações, benefícios e jurídico como demonstração', () => {
    expect(seed).toContain("const MARCADOR = '[DEMONSTRAÇÃO]'\;");
    expect(seed).toContain('Nenhum parceiro ou desconto desta página está confirmado');
    expect(seed).toContain('CPF e anexo ficam opcionais por padrão');
  });
});
