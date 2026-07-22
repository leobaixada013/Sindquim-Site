# Conteúdo e painel Directus

## Notícias simples de publicar

O formulário `posts` é dividido em três grupos:

1. **Escreva a notícia:** título, texto, resumo, categoria, capa e descrição acessível.
2. **Complete se precisar:** legenda/crédito, galeria, fonte e vídeo.
3. **Revise e publique:** situação, data, agendamento e destaque na home.

O slug é oculto e gerado automaticamente. O Editor começa sempre em rascunho. Para publicar, Directus exige título, conteúdo, capa e texto alternativo. Publicações agendadas mudam para `published` no horário indicado pelo hook instalado em `deploy/directus/extensions/`.

## Coleções públicas principais

| Coleção | Finalidade |
| --- | --- |
| `posts` e `posts_galeria` | notícias, capa, galeria, fonte, vídeo e publicação |
| `categorias` | organização das notícias |
| `avisos` | comunicados curtos e urgentes |
| `pagina_beneficios` e `beneficios` | apresentação, vantagens, critérios e CTA |
| `pagina_juridico` | textos, CTAs, SEO e regras configuráveis da página jurídica |
| `juridico_direitos` | temas de orientação exibidos ao público |
| `juridico_plantoes` | horários e locais de atendimento |
| `juridico_faq` | perguntas e respostas públicas |
| `paginas` | somente páginas institucionais autorizadas, hoje `filie-se` |
| `configuracoes` e `configuracoes_globais` | contatos e chaves de exibição |

As coleções `chamados_juridicos`, `mensagens_contato` e `inscricoes_newsletter` são operacionais e nunca recebem leitura pública.

## Área jurídica: editável sem perder a essência

O Editor pode ajustar linguagem pública, temas, FAQ, plantões e CTAs. A equipe Jurídico trata chamados. Os seguintes controles não dependem do texto editorial e continuam obrigatórios no backend:

- consentimento com versão do aviso de privacidade;
- retenção registrada;
- validação de campos e do conteúdo real do arquivo;
- pasta de anexos privada;
- download por proxy autenticado e vinculado ao chamado;
- tokens técnicos separados de formulário geral e triagem jurídica;
- rate limit.

## Papéis

| Papel | Pode | Não pode |
| --- | --- | --- |
| Editor | criar/ler/atualizar conteúdo e mídia pública | excluir, acessar chamados, usuários ou segredos |
| Jurídico | ler/atualizar chamados e anexos privados | editar o portal ou administrar usuários |
| Administrador | configurar, convidar e auditar | compartilhar a conta com a equipe |

O convite de usuário fica em `/admin/configuracoes`. O SMTP do Directus deve estar configurado para entrega do e-mail.

## Demonstrações

O seed local cria registros com `[DEMONSTRAÇÃO]`. Ele não baixa imagens, não usa dados pessoais e não cria conteúdo oficial. Antes do lançamento, substitua cada item e defina `PORTAL_DEMO=false`.
