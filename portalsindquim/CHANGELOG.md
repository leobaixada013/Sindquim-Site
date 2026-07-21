# Histórico de versões

## 1.5.0 — 2026-07-21

- Novo editor de notícias dentro da central Astro, organizado em quatro etapas curtas.
- Envio direto da foto de capa e de até vinte fotos adicionais no mesmo formulário.
- Ações explícitas para salvar rascunho, publicar agora ou agendar; rascunhos podem ficar incompletos.
- Busca e filtro de notícias por situação, com edição otimizada para celular.
- Validação em português para título, texto, capa, descrições acessíveis, fonte e agendamento.
- Preservação da primeira data de publicação e validação também no servidor Directus.
- Galeria pública limitada a notícias publicadas, exclusão controlada para Editor e vínculo com remoção em cascata.
- Imagens Docker promovidas para `portalsindquim-site:1.5.0` e `portalsindquim-directus:11.17.4-portal3`.

## 1.4.0 — 2026-07-21

- Portal Astro 7 integrado ao Directus 11 e PostgreSQL 17 em Docker.
- Fluxo editorial simplificado para notícias, com capa, galeria, fonte e agendamento.
- Doze matérias verificadas sobre o SINDQUIM e empresas da Baixada Santista, com imagens, créditos e fontes.
- Diretoria, Benefícios e conteúdo público do Jurídico editáveis pelo painel.
- Papéis separados para Administrador, Editor, Jurídico e serviços técnicos.
- Backup e restauração de banco e uploads com checksums.
- Testes automatizados do site, integrações, segurança e experiência mobile com Playwright.
- Imagens Docker versionadas e dependências-base fixadas por versão e digest.

Esta release não inclui arquivos `.env`, senhas, tokens, banco, uploads persistentes ou backups.
