import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const repoRoot = new URL('../../..', import.meta.url);
const deploy = readFileSync(new URL('../../../scripts/deploy-lxc200.sh', import.meta.url), 'utf8');
const backup = readFileSync(new URL('../../../scripts/backup-lxc200-data.sh', import.meta.url), 'utf8');

describe('deploy LXC 200', () => {
  it('executa backup remoto verificado antes de qualquer remoção da árvore remota', () => {
    expect(deploy).toContain('scripts/backup-lxc200-data.sh');
    expect(deploy.indexOf('scripts/backup-lxc200-data.sh')).toBeLessThan(deploy.indexOf('rm -rf "$REMOTE_DIR"'));
  });

  it('backup cobre .env e dados persistentes do Directus em arquivo timestampado', () => {
    expect(backup).toContain('$REMOTE_DIR/deploy/.env');
    expect(backup).toContain('$REMOTE_DIR/deploy/directus/database');
    expect(backup).toContain('$REMOTE_DIR/deploy/directus/uploads');
    expect(backup).toContain('$REMOTE_DIR/deploy/directus/extensions');
    expect(backup).toContain('date +%Y%m%d-%H%M%S');
    expect(backup).toContain('tar -tzf');
  });

  it('backup em dry-run mostra comando remoto sem tocar no LXC', () => {
    const output = execFileSync('bash', ['scripts/backup-lxc200-data.sh', '--dry-run'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DEPLOY_HOST: 'host.test',
        DEPLOY_CT: '200',
        DEPLOY_REMOTE_DIR: '/remote/app',
        DEPLOY_BACKUP_DIR: '/remote/backups',
      },
    });

    expect(output).toContain('host.test');
    expect(output).toContain('pct exec 200');
    expect(output).toContain('REMOTE_DIR=/remote/app');
    expect(output).toContain('$REMOTE_DIR/deploy/.env');
    expect(output).toContain('$REMOTE_DIR/deploy/directus/database');
    expect(output).toContain('/remote/backups');
  });

  it('deploy em dry-run mostra backup antes da substituição remota', () => {
    const output = execFileSync('bash', ['scripts/deploy-lxc200.sh', '--dry-run'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DEPLOY_HOST: 'host.test',
        DEPLOY_CT: '200',
        DEPLOY_REMOTE_DIR: '/remote/app',
      },
    });

    expect(output).toContain('scripts/backup-lxc200-data.sh --dry-run');
    expect(output.indexOf('scripts/backup-lxc200-data.sh --dry-run')).toBeLessThan(output.indexOf('rm -rf "$REMOTE_DIR"'));
  });
});
