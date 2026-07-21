// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  // O Cloudflare Tunnel pode reescrever o Host interno. As mutações do painel
  // são protegidas pelo middleware com origem canônica + token CSRF.
  security: { checkOrigin: false },
  server: { host: true },
});
