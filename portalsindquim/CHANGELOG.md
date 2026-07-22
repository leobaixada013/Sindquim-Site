# Histórico de versões

## 1.8.0 — 2026-07-21

- Redesenha a página de contato como uma central direta, sem formulário, com telefone, e-mail e WhatsApp.
- Adiciona mapa e rota atualizados automaticamente a partir do endereço salvo no Directus.
- Torna a coleção **Contato e redes** visível e autoexplicativa no painel do Directus.
- Centraliza a apresentação do atendimento e usa ícones semânticos, coloridos e acessíveis.
- Aplica cores próprias aos ícones de Instagram e YouTube no cabeçalho.
- Remove o formulário **Receba as novidades** do rodapé em todas as páginas.

## 1.7.0 — 2026-07-21

- Reorganiza o cabeçalho em duas faixas: marca e utilidades no topo, navegação principal em uma linha dedicada.
- Adiciona busca global por notícias, benefícios e páginas institucionais, tolerante a acentos e otimizada para celular.
- Apresenta YouTube e Instagram com ícones Phosphor e a chamada “Acompanhe pelas redes”.
- Refina o botão do canal na seção Podcast Reação Química com hierarquia, alinhamento e ícone do YouTube.
- Substitui as siglas dos acessos rápidos por ícones semânticos de benefícios, jurídico, filiação e contato.

## 1.6.1 — 2026-07-21

- Remove o atalho **Podcast** do menu principal para manter a navegação mais curta.
- Preserva integralmente a seção Podcast Reação Química na página inicial e sua sincronização com o YouTube.

## 1.6.0 — 2026-07-21

- Nova seção **Podcast Reação Química** na página inicial, logo depois das notícias.
- Episódio mais recente e histórico curto sincronizados automaticamente pelo feed público do YouTube.
- Nova tela **Podcast** na central Astro, disponível para Administrador e Editor.
- Upload direto da arte do próximo programa, com descrição acessível, data, resumo, número e link opcionais.
- Card de próximo episódio removido automaticamente da home depois da estreia.
- Canal validado antes de salvar e configurado para `Reação Química em Debate`.
- Uploads editoriais passam a declarar a pasta pública mesmo quando feitos por Administrador.
- Testes ponta a ponta do fluxo editorial, três larguras mobile e teste autocontido das permissões do Editor.

## 1.5.2 — 2026-07-21

- Corrige a permissão de leitura das datas de criação e atualização usadas pela lista editorial.
- Mantém esses campos de sistema somente para leitura e cobre o contrato completo do painel no teste de integração.

## 1.5.1 — 2026-07-21

- Corrige login e formulários administrativos quando o Cloudflare Tunnel reescreve o `Host` interno.
- Mantém a proteção de origem usando o domínio público configurado e os tokens CSRF do painel.

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
