# Formulários e proteção de dados

Este documento é técnico e deve ser revisado por responsável jurídico/privacidade antes do lançamento.

## Coleta mínima

- Contato: nome, e-mail e mensagem.
- Newsletter: e-mail.
- Triagem jurídica: nome, e-mail, telefone, tipo e descrição; CPF e anexo somente quando a configuração editorial exigir ou quando forem necessários ao atendimento.

O formulário jurídico registra versão do aviso, instante do consentimento e prazo de retenção. Ele orienta o usuário a não enviar dados de terceiros.

## Controles implementados

- honeypot e rate limit no Astro;
- validação no servidor;
- token técnico por finalidade e sem acesso de leitura;
- chamada anônima direta ao Directus bloqueada;
- anexos limitados a PDF/imagem e 10 MB, com verificação de assinatura do arquivo;
- pasta jurídica privada;
- download autenticado, autorizado e vinculado ao chamado;
- acesso humano separado por função;
- conteúdo rico sanitizado antes de renderizar.

## Decisões operacionais obrigatórias

Antes de produção, defina e publique:

1. controlador e canal de privacidade;
2. finalidade e base legal de cada coleta;
3. prazo real de retenção e rotina de descarte;
4. procedimento para acesso, correção e eliminação;
5. resposta a incidentes;
6. quem pode exercer a função Jurídico e como o acesso é revogado.

Não reutilize chamados para marketing e não envie dados pessoais em logs ou conteúdo demonstrativo.
