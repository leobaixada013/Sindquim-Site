# Pesquisa — Astro ou Directus para o editor de Notícias

**Data da pesquisa:** 20/07/2026  
**Escopo:** comparar um painel editorial próprio em Astro, o Directus Data Studio e um modelo híbrido para atender ao plano de publicação de Notícias do Sindquim.  
**Fontes:** documentação primária/oficial de Astro, Directus, Strapi, Sanity, Contentful e Payload.  
**Conclusão curta:** para editar Notícias, a melhor base é o **Directus Data Studio configurado e estendido apenas onde o teste de usabilidade provar necessidade**. Para o produto completo, o desenho recomendado é um **híbrido disciplinado**: Directus para conteúdo editorial; Astro para site público, prévia e fluxos administrativos realmente específicos. Não devem existir dois editores concorrentes de Notícias.

## 1. Pergunta correta: não é “Astro ou Directus” no mesmo papel

Astro e Directus resolvem partes diferentes do sistema:

- **Astro** é o framework do site, responsável por apresentação, rotas, renderização pública, endpoints e, quando necessário, SSR. A documentação do próprio Astro recomenda um CMS headless para escrever conteúdo e administrar ativos fora do projeto; o Astro busca esse conteúdo e o apresenta ([Astro — Use a CMS](https://docs.astro.build/en/guides/cms/)).
- **Directus** é o backend e a camada editorial: banco, API, arquivos, contas, policies, permissões, formulários, automações, revisões e auditoria. O caso de uso oficial de Headless CMS descreve exatamente a combinação “Data Studio + APIs + frontend independente” ([Directus — Headless CMS](https://docs.directus.io/use-cases/headless-cms/introduction)).
- O guia oficial de integração classifica o Directus como backend-as-a-service para conteúdo de um projeto Astro ([Astro — Directus & Astro](https://docs.astro.build/en/guides/cms/directus/)). O tutorial oficial do Directus mostra Astro consumindo páginas, posts e imagens por SDK/API, enquanto o conteúdo é modelado no Directus ([Directus — Getting Started with Directus and Astro](https://docs.directus.io/blog/getting-started-directus-astro)).

Portanto, a decisão não deve ser “qual tecnologia elimina a outra”. A decisão real é:

1. usar o CMS existente como interface editorial;
2. reconstruir uma interface editorial própria em Astro sobre a API do CMS; ou
3. usar cada ferramenta em seu papel, personalizando apenas o último trecho da experiência.

## 2. O que as fontes oficiais indicam como padrão de mercado

Não existe nas fontes consultadas uma norma universal nem uma estatística que prove um único “padrão de mercado”. Existe, porém, uma forte **convergência arquitetural** entre plataformas headless relevantes:

```text
Editor
  ↓
Interface editorial do CMS
  ├── modelo e validação
  ├── mídia
  ├── permissões
  ├── drafts, versões e agenda
  └── APIs
        ↓
Frontend público independente
```

### 2.1 Astro

A documentação do Astro afirma que o CMS administra conteúdo e ativos fora do projeto, fornece editor visual/estrutura/colaboração, e que o Astro busca os dados e cuida da apresentação ([Astro — Use a CMS](https://docs.astro.build/en/guides/cms/)). Essa separação é o ponto de partida oficial do framework.

### 2.2 Directus

O Directus fornece Data Studio para usuários não técnicos, APIs REST/GraphQL, gestão de mídia e automações editoriais ([Directus — Headless CMS](https://docs.directus.io/use-cases/headless-cms/introduction)). O próprio quickstart explica que a aplicação é uma GUI sobre a API e que ações disponíveis na interface também podem ser realizadas programaticamente ([Directus — Quickstart](https://docs.directus.io/getting-started/quickstart)).

### 2.3 Strapi

O Strapi separa o **Content Manager/Admin Panel**, onde conteúdo é criado e publicado, das APIs consumidas pelo frontend ([Strapi — Content Manager](https://docs.strapi.io/cms/features/content-manager)). Draft & Publish e RBAC pertencem ao CMS, enquanto o preview chama a aplicação frontend já existente ([Strapi — Draft & Publish](https://docs.strapi.io/cms/features/draft-and-publish), [Strapi — RBAC](https://docs.strapi.io/cms/features/rbac), [Strapi — Preview](https://docs.strapi.io/cms/features/preview)).

### 2.4 Sanity

Schemas em TypeScript/JavaScript geram formulários no Sanity Studio ([Sanity — Schemas and Forms](https://www.sanity.io/docs/studio/schemas-and-forms)). O Presentation Tool integra o frontend ao Studio para prévia e edição visual; ele não transfere a governança editorial para o framework do site ([Sanity — Presentation Tool](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool), [Sanity — Visual Editing](https://www.sanity.io/docs/visual-editing)).

### 2.5 Contentful

O modelo reúne content types, entries e assets; o frontend consome Delivery API ou Preview API ([Contentful — Data Model](https://www.contentful.com/developers/docs/concepts/data-model/), [Contentful — API Basics](https://www.contentful.com/developers/docs/references/api-basics/)). A prévia é configurada no web app e aponta para uma versão do frontend capaz de mostrar conteúdo não publicado ([Contentful — Content Preview](https://www.contentful.com/help/content-preview/)).

### 2.6 Payload

Uma configuração gera Admin Panel, banco/APIs e formulários, e o painel é extensível por componentes e views ([Payload — What is Payload](https://payloadcms.com/docs/getting-started/what-is-payload), [Payload — Admin Panel](https://payloadcms.com/docs/admin/overview)). Drafts, versões, controle de acesso e Live Preview ficam no CMS e se integram ao frontend ([Payload — Drafts](https://payloadcms.com/docs/versions/drafts), [Payload — Versions](https://payloadcms.com/docs/versions/overview), [Payload — Live Preview](https://payloadcms.com/docs/live-preview)).

### 2.7 Conclusão sobre o padrão observado

A convergência entre essas fontes sustenta três conclusões:

1. **Modelagem, mídia, permissões, estados, histórico e agendamento são responsabilidades normais do CMS.**
2. **O frontend permanece separado.** O preview é uma ponte do CMS para o frontend.
3. **Personalização editorial normalmente estende o painel do CMS; não exige reconstruí-lo por completo dentro do framework do site.**

Isso não prova que um painel Astro próprio seja “errado”. Prova que ele é uma decisão de produto customizada, com custo contínuo, e não o caminho padrão sugerido pelas plataformas analisadas.

## 3. Definição das alternativas

### Alternativa A — painel editorial customizado em Astro

O Editor usa `/admin/noticias`. Astro controla telas, formulários, upload e navegação, mas envia as operações à API do Directus. Directus continua como fonte dos dados e deve continuar impondo as regras críticas no servidor.

### Alternativa B — Directus Data Studio configurado/estendido

O Editor entra no Directus e usa o Content Module. Campos, layouts, presets, WYSIWYG, mídia, policies, revisões e Live Preview são nativos/configurados. Hooks e Flows implementam regras de domínio. Uma extensão pequena de interface/módulo é admitida somente para os gaps de UX que permanecerem depois do teste.

### Alternativa C — híbrido disciplinado

Notícias usam a Alternativa B. Astro continua como site público, rota protegida de preview e, se ainda necessário, painel de módulos muito específicos já existentes, como Jurídico ou Social. O híbrido não significa manter dois formulários de Notícias; existe um único proprietário editorial por domínio.

## 4. Matriz requisito × alternativa

Legenda: **Nativo** = recurso já oferecido pela plataforma principal; **Configuração** = exige schema/preset/policy/Flow; **Código** = exige implementação e testes próprios; **Duplicado** = o mesmo conceito tende a existir em Astro e Directus.

| Requisito | A — Astro custom | B — Directus Studio | C — híbrido disciplinado |
| --- | --- | --- | --- |
| Título, capa e texto em uma tela | Código, liberdade visual total | Nativo/configuração de ordem e largura | Directus para Notícias |
| Experiência “quase Instagram” | Melhor liberdade visual, mas tudo é próprio | Boa após simplificação; ações especiais podem exigir extensão | Igual a B, sem sacrificar o site Astro |
| WYSIWYG essencial | Integrar e manter editor, upload e sanitização | Nativo, toolbar configurável | Directus |
| Capa com upload/biblioteca | Construir UI sobre arquivos Directus | Nativo | Directus |
| Galeria ordenada até 20 fotos | Construir/reconstruir seleção, upload e ordem | Relação/junção + hook de limite | Directus; Astro apenas renderiza |
| Legenda/crédito por foto | Formulário próprio | Junção `posts_galeria` com metadados por uso | Directus |
| Categoria fixa e padrão Geral | Código + API | Relação read-only + preset/default | Directus |
| Fonte opcional condicional | Código | Campos + conditions | Directus |
| YouTube opcional | Campo e validação próprios | Campo URL + validação/hook | Directus armazena; Astro renderiza embed leve |
| Slug automático e estável | Código no Astro e regra no Directus para segurança | Hook servidor | Hook Directus |
| Resumo automático, mas editável | Código no Astro e regra no servidor | Hook servidor | Hook Directus |
| Capa obrigatória só ao publicar | UI Astro + validação de API | Condition para UX + hook bloqueante para integridade | Directus |
| Draft por padrão | Código/preset de payload | Default/preset | Directus |
| Publicação explícita | Botão exato sob medida | Status + salvar; botão/confirmação especial pode exigir extensão | Directus com extensão mínima se necessário |
| Agendamento | Construir UI; execução ainda precisa de job/Flow | `scheduled` + data + Flow CRON | Directus |
| Preview de não publicado | Construir rota e integração | Live Preview, mas ainda requer rota segura no Astro | Responsabilidade naturalmente dividida |
| Destaque automático/administrativo | Lógica no Astro e campo no Directus | Directus armazena; Astro consulta/ordena | Responsabilidade naturalmente dividida |
| Contas individuais | Reutilizar autenticação Directus ou criar camada própria | Nativo | Directus para Editores |
| Permissões por coleção/campo/estado | UI pode ocultar, mas Directus ainda deve impor regras | Policies e permissões granulares | Directus |
| Arquivar sem excluir | Código na UI + regra de API | Configuração de status/permissão | Directus |
| Auditoria por usuário | Correta somente se cada requisição preservar a identidade Directus | Nativo pela Activity/Revisions | Directus |
| Histórico, diff e restauração | Construir telas sobre revisões/versões | Nativo | Directus |
| Preview/publish sem vazamento | Código e testes próprios | Policies + rota Astro protegida | Divisão clara e testável |
| Publicação refletida imediatamente | Invalidação de cache própria | Flow/webhook + invalidação Astro | Divisão clara e testável |
| Editor desktop e compatível com celular | Totalmente controlável, alto custo de QA | Precisa teste na versão real; prioridade desktop é adequada | Igual a B para Notícias |
| Publicar em até três minutos sem ajuda | Pode ser otimizado exatamente, mas não é garantido | Provável após simplificação, mas não é garantido | Teste B; estender somente se falhar |
| Manutenção evolutiva | Alta | Baixa/média | Média, desde que não duplique domínios |
| Superfície de segurança | Maior: Astro admin + API + Directus | Menor: autenticação e autorização concentradas | Média; mitigar separando claramente módulos e acessos |

## 5. Cobertura específica do Directus para o plano

### 5.1 Formulário e linguagem simples

O Directus permite definir ordem e largura, interface, display, validação, condições, traduções e visibilidade dos campos ([Directus — Fields](https://docs.directus.io/app/data-model/fields)). Isso cobre:

- mostrar apenas Título, Foto de capa e Texto como caminho principal;
- colocar os demais campos em “Mais opções”;
- rótulos e notas em português;
- ocultar campos técnicos;
- tornar campos hidden, read-only ou required de acordo com condições.

A condição visual não deve ser a única regra de publicação. Requisições externas também podem alterar dados; por isso, capa, conteúdo, data e transições de status precisam ser validados por hook bloqueante.

### 5.2 Editor de texto

O WYSIWYG nativo usa TinyMCE e aceita toolbar personalizada, pasta padrão, formatos e overrides ([Directus — Text & Numbers](https://docs.directus.io/app/data-model/fields/text-numbers)). Ele atende à barra reduzida pedida no plano sem manter Quill por CDN no Astro.

O site precisa tratar HTML como conteúdo confiável ou sanitizá-lo por allowlist. A diretiva `set:html` do Astro não escapa o valor e a documentação alerta para risco de XSS ([Astro — `set:html`](https://docs.astro.build/en/reference/directives-reference/#sethtml)). Restringir a toolbar ajuda, mas não substitui sanitização e política de permissões.

### 5.3 Capa e galeria

O Directus tem interfaces nativas para arquivo, imagem e múltiplos arquivos; a interface Files cria relação M2M ([Directus — Relational Fields](https://docs.directus.io/app/data-model/fields/relational)). Para este plano, uma lista simples de arquivos não basta, porque legenda e crédito pertencem ao uso da foto na notícia. O modelo adequado é:

```text
posts
  1 ─── N posts_galeria N ─── 1 directus_files
             ├── ordem
             ├── legenda
             └── credito
```

O limite de vinte imagens e a validação de MIME devem ser regras de servidor, não somente restrições visuais.

### 5.4 Lista, filtros e atalhos

O Content Module oferece layouts configuráveis; os presets guardam o estado da página de coleção e podem ser definidos por papel ou usuário ([Directus — Content](https://docs.directus.io/user-guide/content-module/content), [Directus — Presets & Bookmarks](https://docs.directus.io/user-guide/settings/presets-bookmarks)). Isso cobre cartões, ordenação e bookmarks de Rascunhos, Publicadas e Agendadas.

Um preset organiza a lista; ele não transforma o formulário em um wizard do tipo Instagram. A meta de três minutos ainda exige teste humano.

### 5.5 Draft, publicação, agenda e automações

Status é um campo normal do modelo; o Directus documenta inclusive o padrão `draft`, `published` e `archived` em conteúdo ([Directus — Content Translations, modelo de exemplo](https://docs.directus.io/guides/headless-cms/content-translations)).

O agendamento não é um sinalizador mágico. A receita oficial usa `status = scheduled`, uma data futura e um Flow CRON que promove itens vencidos para `published` ([Directus — Schedule Future Content](https://docs.directus.io/guides/headless-cms/schedule-content/static-sites)). Triggers podem ser bloqueantes, não bloqueantes, manuais ou agendados ([Directus — Flow Triggers](https://docs.directus.io/app/flows/triggers)).

Hooks de filtro podem verificar, modificar ou cancelar uma operação antes da gravação ([Directus — Hooks](https://docs.directus.io/extensions/hooks)). Eles são o lugar adequado para:

- slug automático e estável;
- resumo automático preservando edição manual;
- data real da primeira publicação;
- normalização de URL do YouTube;
- capa obrigatória ao publicar/agendar;
- limite da galeria;
- confirmação/integridade de transições de estado.

### 5.6 Preview, revisões, versões e auditoria

O Item Page possui Revisions, Live Preview e Content Versioning; versões paralelas podem ser promovidas para a principal ([Directus — Item Page](https://docs.directus.io/user-guide/content-module/content/items), [Directus — Content Versions API](https://docs.directus.io/reference/system/versions)).

Para o primeiro rollout, **status draft + revisões** é mais simples que expor Content Versioning ao Editor. Versionamento paralelo pode ser reservado ao Administrador até que haja necessidade real.

Live Preview depende de uma URL no frontend. O Directus incorpora a página, mas o Astro deve fornecer uma rota que leia rascunho/versão com autorização e proteção contra vazamento. A documentação de SSR/on-demand do Astro cobre rotas geradas por requisição, cookies e endpoints de servidor ([Astro — On-demand Rendering](https://docs.astro.build/en/guides/on-demand-rendering/)).

O Activity Log registra ações feitas pelo Directus, mas alterações diretas no banco não entram na trilha ([Directus — Activity Log](https://docs.directus.io/user-guide/settings/activity-log)). Um painel Astro que escreva sempre com um único token de serviço também reduz a qualidade da atribuição individual; se existir, deve agir em nome do usuário autenticado ou registrar accountability de forma verificável.

### 5.7 Policies e permissões no Directus 11

No Directus 11, permissões pertencem a **policies**, e policies são associadas a usuários ou roles. A mudança está documentada nas breaking changes da versão 11 ([Directus — Breaking Changes](https://docs.directus.io/releases/breaking-changes)). Policies controlam App Access, MFA/IP e acesso administrativo ([Directus — Policies API](https://docs.directus.io/reference/system/policies)); permissões controlam item filters, validação, presets e fields por operação ([Directus — Permissions API](https://docs.directus.io/reference/system/permissions)).

Consequência prática: todo script legado que trate `directus_permissions.role` como vínculo principal deve ser auditado e migrado para `policy` + `directus_access`. Não basta apenas mudar nomes no plano.

## 6. Build versus buy/configurar

| Dimensão | A — Astro custom | B — Directus Studio | C — híbrido disciplinado |
| --- | --- | --- | --- |
| Investimento inicial | Alto | Baixo/médio | Médio |
| Liberdade visual | Máxima | Alta dentro dos padrões do Studio; máxima via extensão | Alta onde importa |
| Tempo até validar com Editor | Maior | Menor | Menor para Notícias |
| Reuso do que já existe | Reusa API, mas duplica UI e estados | Máximo | Máximo com transição segura |
| Custo de manutenção | Alto e permanente | Menor; cresce com extensões | Médio, se domínios forem separados |
| Dependência de versão | Astro, editor rico e API Directus | Directus e compatibilidade de extensão | Ambas, porém com fronteiras claras |
| Risco de inconsistência | Alto se regras também existirem na UI | Baixo com hooks como fonte única | Baixo se não houver dois editores |
| Auditoria e governança | Exigem integração cuidadosa | Nativas | Nativas para conteúdo |
| Segurança | Mais endpoints, sessão, CSRF, upload e erros próprios | Centralizada em Directus | Controlável, mas há duas superfícies administrativas |

Astro oferece Actions, endpoints, sessions e middleware, portanto é tecnicamente capaz de hospedar um painel. Contudo:

- a documentação do Astro não oferece uma solução oficial única de autenticação; ela orienta integrações/implementações conforme o provedor ([Astro — Authentication](https://docs.astro.build/en/guides/authentication/));
- Actions são endpoints públicos e cada operação sensível precisa de autorização e proteção própria ([Astro — Actions](https://docs.astro.build/en/guides/actions/));
- sessions não substituem roles, policies, MFA, biblioteca de mídia, revisions ou automações editoriais ([Astro — Sessions](https://docs.astro.build/en/guides/sessions/));
- Astro otimiza e renderiza imagens, mas não é uma biblioteca editorial de ativos ([Astro — Images](https://docs.astro.build/en/guides/images/), [Astro — Media](https://docs.astro.build/en/guides/media/)).

Um painel Astro pode reutilizar o backend do Directus, então não precisa recriar o banco. Mesmo assim, terá de construir e manter a representação de upload, busca na biblioteca, relações, erros de policy, estados, agenda, revisões, diff, restore e preview. Essa é a parte cara do “build”.

## 7. Segurança e operação

### 7.1 Arquivos públicos

O Directus recomenda dar acesso público apenas a arquivos ou pastas específicas, nunca à coleção inteira; exportações também geram arquivos e podem vazar dados se todo `directus_files` for público ([Directus — Accessing Files](https://docs.directus.io/reference/files)).

Isso confirma como crítica a lacuna já identificada neste projeto: o mesmo Directus guarda mídia editorial e anexos jurídicos. A política pública deve enxergar somente a pasta pública de Notícias e outros ativos explicitamente públicos.

### 7.2 Tokens de preview e ativos

Tokens estáticos não expiram, são menos seguros e tokens em query string podem aparecer em logs ([Directus — Authentication](https://docs.directus.io/reference/authentication)). Para imagens públicas, a abordagem segura é uma pasta pública restrita e `/assets` sem token. O segredo de preview deve ficar no servidor Astro, com policy de mínimo privilégio; nunca no HTML ou em URLs públicas ([Directus — Headless CMS Security](https://docs.directus.io/use-cases/headless-cms/security)).

### 7.3 Extensões

O Directus permite interfaces, layouts, modules, panels, hooks e extensões híbridas ([Directus — Extensions](https://docs.directus.io/extensions/introduction)). O Data Studio usa Vue 3 para módulos ([Directus — Custom Modules](https://docs.directus.io/extensions/modules)). Isso introduz um pequeno stack adicional em um projeto Astro, mas ainda preserva autenticação, policies, mídia e auditoria do CMS.

Extensões devem ser mínimas e ter compatibilidade declarada com a versão host. Quanto maior a extensão, maior o custo de atualização.

### 7.4 Self-hosting, versão e backup

A documentação recomenda uma versão explícita no `docker-compose.yml`, em vez de uma tag flutuante ([Directus — Docker Guide](https://docs.directus.io/self-hosted/docker-guide)). O projeto usa `directus/directus:11`; isso deve ser substituído por um patch exato, homologado.

Schema snapshot/apply permite versionar modelo e testar diferenças, mas não substitui backup de banco e uploads ([Directus — CLI](https://docs.directus.io/self-hosted/cli)). Upgrades exigem migração/bootstrap e backup antes de mudanças ([Directus — Upgrades & Migrations](https://docs.directus.io/self-hosted/upgrades-migrations)).

No self-hosting, infraestrutura, atualizações e suporte são responsabilidade do projeto. A licença de produção deve ser conferida conforme o porte financeiro da entidade; a página oficial informa as condições atuais e pode mudar ([Directus — Pricing](https://directus.io/pricing/)). Como o Directus já está implantado, trocar de CMS não elimina operação: acrescenta migração e um novo stack.

## 8. Por que não trocar para outro CMS

Os concorrentes confirmam a arquitetura, mas não fornecem motivo suficiente para uma substituição neste projeto:

- Strapi oferece Draft & Publish e RBAC, porém releases/agendamento, histórico e workflows avançados variam por plano ([Strapi — Releases](https://docs.strapi.io/cms/features/releases), [Strapi — Content History](https://docs.strapi.io/cms/features/content-history), [Strapi — Review Workflows](https://docs.strapi.io/cms/features/review-workflows)).
- Sanity tem excelente visual editing, mas Scheduled Drafts, Content Releases, papéis avançados, retenção de histórico e Media Library variam por plano ([Sanity — Scheduled Drafts](https://www.sanity.io/docs/studio/scheduled-drafts), [Sanity — Content Releases](https://www.sanity.io/docs/studio/content-releases), [Sanity — Roles](https://www.sanity.io/docs/user-guides/roles), [Sanity — History](https://www.sanity.io/docs/user-guides/history-experience)).
- Contentful possui preview, agenda, roles e versões, mas é SaaS e parte da governança depende do plano ([Contentful — Roles](https://www.contentful.com/help/roles/), [Contentful — Scheduled Publishing](https://www.contentful.com/help/scheduled-publishing/), [Contentful — Versions](https://www.contentful.com/help/content-and-entries/versions/)).
- Payload cobre drafts, agenda, versões e UI extensível, mas seu Admin Panel/backend é baseado em Next.js; adotá-lo exigiria substituir o Directus e introduzir outra plataforma ([Payload — Admin Panel](https://payloadcms.com/docs/admin/overview), [Payload — Drafts](https://payloadcms.com/docs/versions/drafts)).

Todos modelam os campos do plano. A diferença decisiva está em custo de migração, planos comerciais, operação e familiaridade. O Directus já possui os blocos necessários e já armazena os dados deste site.

## 9. Recomendação para este projeto

### 9.1 Resposta direta

- **Melhor para fazer o editor de Notícias:** Alternativa **B**, Directus Data Studio configurado, com hooks/Flows e, somente se necessário, uma extensão mínima de UX.
- **Melhor para o sistema atual como um todo:** Alternativa **C**, híbrido disciplinado. Directus governa Notícias; Astro governa o site público, a rota de preview e módulos administrativos altamente específicos que ainda façam sentido.
- **Não recomendado:** manter a Alternativa A como editor principal de Notícias em paralelo com o Directus.

### 9.2 Arquitetura recomendada

```text
Editor individual
  ↓
Directus Data Studio
  ├── Notícias, categorias e galeria
  ├── arquivos editoriais autorizados
  ├── policies e permissões
  ├── Activity/Revisions
  ├── hook de regras editoriais
  └── Flow de agenda/invalidação
             ↓ REST/SDK
Astro
  ├── home e páginas públicas
  ├── notícia, galeria, fonte e YouTube
  ├── RSS, sitemap, SEO e JSON-LD
  ├── preview protegido
  └── cache com invalidação
```

O painel Astro existente pode continuar temporariamente para Jurídico, Social e Configurações. O Editor de Notícias deve receber um link direto para o Directus e não ver módulos irrelevantes. Depois da homologação, `/admin/noticias` deve redirecionar para o Data Studio e o formulário/API Astro duplicados devem ser removidos.

### 9.3 Quanto o Directus cobre

Estimativa qualitativa, não benchmark medido:

- **85–95% da funcionalidade e da UX**: schema, campos, WYSIWYG, mídia, relações, condições, cards, filtros, policies, Activity/Revisions, preview e automação configurados no Directus.
- **100% funcional**: Directus configurado + hooks/Flows + rota Astro de preview/renderização.
- **100% da meta subjetiva “até uma criança / até três minutos”**: não pode ser garantido por documentação. Só pode ser aceito depois de teste de usabilidade. Uma extensão pequena pode fechar gaps comprovados de rótulos, confirmação e navegação pós-publicação.

## 10. Mudanças que o plano precisa incorporar

1. **Registrar a decisão sem ambiguidade:** Directus é o editor de Notícias; Astro é frontend/preview. O produto inteiro permanece híbrido durante a transição.
2. **Atualizar Directus 11:** modelar acesso como `policy` + `directus_access`; auditar qualquer uso legado de `role` em `directus_permissions`.
3. **Nativo primeiro:** configurar campos, conditions, traduções, WYSIWYG, layouts e presets antes de escrever uma extensão.
4. **Spike formal de UX:** medir o fluxo nativo e listar exatamente o que falta: confirmação ao atualizar publicado, botão “Publicar agora”, retorno à lista, “Ver no site” e “Criar outra notícia”.
5. **Extensão mínima e isolada:** se o teste falhar, estender o Data Studio; não criar outro módulo editorial completo nem duplicar regras.
6. **Regras no servidor:** slug, resumo, primeira data de publicação, transições, capa, URL, galeria e agenda devem funcionar também via API.
7. **Simplificar o histórico inicial:** Editor usa draft + revisions; Content Versioning avançado fica oculto até existir necessidade.
8. **Corrigir arquivos públicos antes do rollout:** separar pastas/policies editoriais de anexos jurídicos; testar tentativas negativas.
9. **Sanitizar HTML:** definir allowlist do WYSIWYG, testar XSS e manter toolbar reduzida.
10. **Proteger preview:** segredo somente server-side, policy de leitura mínima, expiração/rotação e testes contra enumeração de drafts.
11. **Pinar Directus:** substituir a tag major flutuante por versão patch homologada e testar extensões antes de upgrade.
12. **Versionar a configuração:** schema snapshot, scripts idempotentes para fields/policies/presets/Flows e dry-run de diferenças.
13. **Não usar token de serviço compartilhado para edição humana:** preservar accountability individual em todas as escritas.
14. **Eliminar o editor duplicado após o cutover:** redirecionar `/admin/noticias`, remover Quill/CDN, API e helpers exclusivos.
15. **Manter rollback recuperável:** banco, uploads, extensions e configuração precisam de backup restaurado em homologação.

## 11. Validações recomendadas antes de fechar a arquitetura

### Gate A — capacidade técnica

- criar uma notícia incompleta via Studio e API;
- provar que draft aceita ausência de capa;
- provar que publish/scheduled recusam ausência de capa ou texto;
- provar slug único e estável;
- provar resumo automático e preservação do resumo manual;
- provar galeria ordenada, metadados e limite de vinte;
- provar publicação agendada idempotente;
- provar atualização imediata após invalidação do cache.

### Gate B — segurança

- Editor não exclui definitivamente post nem aviso;
- Editor não altera categorias, `fixado_banner` ou campos técnicos;
- público não lê draft/scheduled/archived;
- público e Editor não leem anexos jurídicos;
- segredo de preview não aparece no HTML, logs ou query strings reutilizáveis;
- payload HTML malicioso não executa no site;
- gravações mantêm o usuário real na auditoria.

### Gate C — usabilidade

Executar com pelo menos cinco pessoas representativas, sem treinamento prévio:

1. entregar título, imagem e texto prontos;
2. pedir que publiquem sem ajuda;
3. medir tempo, erros, retornos, dúvidas e abandonos;
4. considerar aprovado somente se todas concluírem o fluxo essencial e a mediana ficar abaixo de três minutos;
5. corrigir primeiro rótulos, ordem, conteúdo irrelevante e feedback;
6. escrever extensão somente para problemas que a configuração não resolver.

### Gate D — operação

- build e testes Astro verdes;
- versão Directus fixada;
- schema/policies/Flows exportados;
- backup restaurado com sucesso;
- upgrade/rollback ensaiados;
- métricas e logs do Flow de agenda observáveis;
- teste de fumaça desktop e celular.

## 12. Limitações e incertezas desta pesquisa

- “Padrão de mercado” foi inferido pela convergência de documentação oficial, não por pesquisa estatística de market share.
- Documentações de fornecedores descrevem seus próprios produtos; não são avaliações independentes de qualidade ou facilidade.
- Recursos e limites comerciais de Strapi, Sanity, Contentful, Payload e Directus podem mudar. Preços e planos devem ser conferidos novamente antes de contratação.
- A documentação prova capacidade técnica, não a meta de usabilidade em três minutos.
- A experiência mobile do Data Studio precisa ser testada na versão exata instalada; o requisito prioritário confirmado é desktop.
- O nível de personalização necessário para confirmação e navegação pós-publicação depende de um spike na versão exata do Directus.
- A auditoria final de policies, presets, Flows e arquivos exige uma sessão administrativa na instância real; o código do repositório pode ter divergido do banco implantado.
- Uma extensão aumenta o custo de compatibilidade. Se crescer até virar um segundo CMS dentro do Directus, a decisão deve ser reavaliada.

## 13. Decisão proposta

Adotar a seguinte regra arquitetural:

> O Directus Data Studio é a interface editorial única de Notícias e a fonte única de permissões, mídia, estado, auditoria e regras de publicação. O Astro é o frontend público e a implementação da prévia protegida. Personalizações de UX serão feitas primeiro por configuração e, somente após teste de usabilidade, por uma extensão mínima no Directus. O formulário Astro de Notícias será removido depois do cutover validado.

Essa decisão atende a todas as funcionalidades do plano com o menor risco de duplicação, aproveita a infraestrutura já implantada e segue o desenho comum observado nas plataformas headless analisadas.
