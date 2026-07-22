#!/usr/bin/env node

/** Prepara uma instalação Docker local de forma repetível e auditável. */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arquivoEnv = resolve(raiz, 'deploy/.env');
const arquivoCompose = resolve(raiz, 'deploy/docker-compose.yml');
const semDemo = process.argv.includes('--no-demo');
const semTestes = process.argv.includes('--skip-tests');

if (!existsSync(arquivoEnv)) {
  throw new Error('Crie deploy/.env a partir de deploy/.env.example antes de continuar.');
}

function lerEnv(caminho) {
  const resultado = {};
  for (const linhaOriginal of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
    const linha = linhaOriginal.replace(/^\uFEFF/, '').trim();
    if (!linha || linha.startsWith('#') || !linha.includes('=')) continue;
    const separador = linha.indexOf('=');
    const nome = linha.slice(0, separador).trim();
    const valor = linha.slice(separador + 1).trim().replace(/^['"]|['"]$/g, '');
    if (nome) resultado[nome] = valor;
  }
  return resultado;
}

const configuracao = lerEnv(arquivoEnv);
const ambiente = {
  ...process.env,
  ...configuracao,
  DIRECTUS_URL: `http://localhost:${configuracao.DIRECTUS_PORT || '8155'}`,
  PUBLIC_SITE_URL: configuracao.PUBLIC_SITE_URL || `http://localhost:${configuracao.SITE_PORT || '4421'}`,
};

function executar(comando, argumentos, opcoes = {}) {
  return new Promise((resolvePromise, reject) => {
    const processo = spawn(comando, argumentos, {
      cwd: raiz,
      env: ambiente,
      stdio: 'inherit',
      ...opcoes,
    });
    processo.once('error', reject);
    processo.once('exit', (codigo) => {
      if (codigo === 0) resolvePromise();
      else reject(new Error(`${comando} encerrou com código ${codigo}.`));
    });
  });
}

const compose = ['compose', '--env-file', arquivoEnv, '-f', arquivoCompose];

console.log('1/6 Instalando dependências verificadas pelo lockfile...');
await executar('npm', ['ci', '--prefix', 'site']);

console.log('2/6 Subindo PostgreSQL e Directus...');
await executar('docker', [...compose, 'up', '-d', '--build', '--wait', '--wait-timeout', '240', 'database', 'directus']);

console.log('3/6 Aplicando schema e permissões...');
for (const script of [
  'scripts/directus-schema.mjs',
  'scripts/setup-configuracoes.mjs',
  'scripts/setup-formularios.mjs',
  'scripts/setup-juridico.mjs',
]) {
  await executar(process.execPath, [script]);
}

if (!semDemo) {
  console.log('4/6 Inserindo conteúdo local claramente marcado como demonstração...');
  await executar(process.execPath, ['scripts/directus-conteudo-exemplo.mjs']);
} else {
  console.log('4/6 Conteúdo de demonstração ignorado (--no-demo).');
}

console.log('5/6 Construindo e subindo o site Astro...');
await executar('docker', [...compose, 'up', '-d', '--build', '--wait', '--wait-timeout', '240', 'site']);

if (!semTestes && !semDemo) {
  console.log('6/6 Executando testes de integração e menor privilégio...');
  await executar(process.execPath, ['scripts/test-integracao.mjs']);
} else {
  console.log('6/6 Testes de integração ignorados.');
}

console.log(`Portal pronto: ${ambiente.PUBLIC_SITE_URL}`);
console.log(`Directus pronto: ${ambiente.DIRECTUS_URL}`);
