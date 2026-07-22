# Plano robusto revisado — Arquitetura editorial híbrida Astro + Directus

**Data:** 20/07/2026  
**Status:** substituído pelo [plano mestre validado em Docker e UX](./2026-07-21-plano-mestre-validado-docker-ux.md); manter como histórico da decisão arquitetural  
**Decisão proposta:** Directus Data Studio como editor único de Notícias; Astro como site público, preview protegido e painel de módulos administrativos específicos.  
**Pesquisa-base:** [`docs/research/2026-07-20-astro-vs-directus-editorial.md`](../../research/2026-07-20-astro-vs-directus-editorial.md)  
**Plano funcional anterior:** [`2026-07-20-directus-noticias-intuitivo.md`](./2026-07-20-directus-noticias-intuitivo.md)

> Este plano substitui o plano anterior quanto à decisão arquitetural, baseline técnico, segurança, deploy e ordem de execução. O plano anterior continua útil como catálogo detalhado dos requisitos editoriais, mas não deve ser executado sozinho.

> **Atualização de 21/07/2026:** a execução em Docker e o teste do Directus 12 revelaram novos bloqueadores de segurança, UX e licenciamento. Use o plano mestre de 21/07 como fonte operacional.

## 1. Resposta executiva

Astro e Directus não são concorrentes no mesmo papel:

- **Astro** é a melhor escolha para o site público, SEO, RSS, sitemap, renderização das Notícias, preview e endpoints de integração.
- **Directus** é a melhor escolha para autoria de Notícias, arquivos, galeria, contas, policies, permissões, rascunhos, publicação, agenda, revisões e auditoria.
- **Uma extensão mínima do Directus**, criada somente se o teste de usabilidade provar necessidade, é a melhor forma de atingir a experiência “quase Instagram” sem reconstruir um segundo CMS no Astro.

A arquitetura recomendada é um **híbrido disciplinado**, e não dois painéis concorrentes:

```text
Editor de Notícias
  ↓
Directus Data Studio
  ├── posts, categorias e posts_galeria
  ├── arquivos editoriais autorizados
  ├── policies e permissões
  ├── revisões e Activity Log
  ├── hook de regras editoriais
  └── Flows de agenda e invalidação
             ↓ API/SDK
Astro
  ├── home e páginas públicas
  ├── notícia, galeria, fonte e YouTube
  ├── SEO, JSON-LD, RSS e sitemap
  ├── preview protegido
  └── cache e invalidação
```

O painel Astro poderá continuar para Jurídico, Social Media e Configurações enquanto esses módulos forem necessários. Ele não manterá outro formulário de Notícias.

## 2. Evidência de padrão de mercado

A documentação oficial de Astro recomenda um CMS headless para escrever conteúdo e administrar ativos, enquanto o Astro busca e apresenta os dados. Directus, Strapi, Sanity, Contentful e Payload convergem no mesmo desenho: o CMS oferece a interface editorial e o frontend permanece independente.

Fontes e comparação aprofundada estão na [pesquisa arquitetural](../../research/2026-07-20-astro-vs-directus-editorial.md). A conclusão representa convergência de arquitetura entre fornecedores relevantes, não uma estatística de participação de mercado.

## 3. Matriz de decisão

Pontuação de 1 a 5. Os pesos refletem os requisitos confirmados neste projeto. A matriz é um auxílio de decisão, não um benchmark científico.

| Critério | Peso | Astro customizado | Directus nativo | Híbrido + extensão mínima |
| --- | ---: | ---: | ---: | ---: |
| UX editorial simples | 25% | 5,0 | 3,5 | 5,0 |
| Cobertura funcional | 20% | 3,0 | 4,5 | 5,0 |
| Segurança e auditoria | 20% | 2,0 | 5,0 | 4,5 |
| Manutenção | 15% | 1,0 | 5,0 | 4,0 |
| Prazo e risco de implantação | 10% | 2,0 | 5,0 | 4,0 |
| Flexibilidade futura | 10% | 5,0 | 3,5 | 4,5 |
| **Resultado ponderado** | **100%** | **62/100** | **88/100** | **92/100** |

### Por que o Astro customizado perde

Ele pode produzir a interface visual mais livre, mas passa a exigir manutenção própria de:

- sessão e expiração de autenticação;
- autorização e mensagens de erro por policy;
- upload, busca e metadados da biblioteca de mídia;
- relações da galeria;
- transições draft/published/scheduled/archived;
- agenda, retentativa e observabilidade;
- revisions, histórico, diff e restauração;
- preview de conteúdo privado;
- sanitização de HTML;
- concorrência e atribuição individual de alterações;
- compatibilidade a cada mudança da API do Directus.

O projeto já possui parte dessa duplicação e o build atual demonstra seu custo.

## 4. Baseline verificado em 20/07/2026

### 4.1 Stack do checkout

- Astro `7.0.6`, output `server`, adapter Node standalone.
- `@astrojs/node` `11.0.2`.
- `@directus/sdk` `23.0.0`.
- Directus self-hosted por `directus/directus:11`, sem patch fixo.
- SQLite e uploads locais persistidos por volume.
- Painel Astro customizado com login baseado nas credenciais do Directus.
- Editor de Notícias Astro baseado em Quill `2.0.2` carregado por CDN.

### 4.2 Instância Directus observável

- `/server/health`: saudável.
- Projeto ainda identificado como **Directus**.
- `default_language`: `en-US`, apesar de `DEFAULT_LANGUAGE=pt-BR` no Compose.
- 4 Notícias, todas publicadas.
- 4 Categorias: Campanha Salarial, Assembleia, Direitos e Benefícios.
- 3 registros em Documentos, todos com `arquivo = null`.
- 13 arquivos visíveis pela API pública, todos atualmente fora de pastas.
- Metadados de `directus_files` podem ser listados sem autenticação.

### 4.3 Implantação Astro observável

- `/`, `/noticias`, `/convencoes`, `/rss.xml` e `/sitemap.xml`: HTTP 200.
- `/admin` e `/admin/login`: HTTP 404.
- O checkout possui essas rotas, portanto checkout e release implantado não estão reconciliados.

### 4.4 Testes executados

- `npm test`: 17 testes aprovados em 3 arquivos.
- `npm run test:local`: 11 testes aprovados.
- sintaxe de todos os scripts `.sh`: aprovada.
- `node --check` em todos os scripts `.mjs`: aprovado.
- `npm ls --depth=0`: árvore direta consistente.
- dry-run de backup e deploy: aprovado.
- smoke test do build corrigido em cópia temporária: home, Notícias, artigo, login Astro, RSS, sitemap e Convenções responderam.
- inspeção DOM básica: idioma, `main`, `h1`, labels e IDs sem duplicação nas páginas verificadas.

### 4.5 Falhas encontradas

#### Bloqueadores P0

1. O build falha porque `site/src/pages/api/admin/noticias/salvar.ts` importa `lib/auth` subindo um diretório a mais.
2. Depois de corrigir isso em cópia temporária, o build falha porque `isomorphic-dompurify` é importado, mas não está declarado no `package.json`/lockfile.
3. `npm audit` encontrou vulnerabilidade moderada no Astro `<= 7.0.9`: GHSA-4g3v-8h47-v7g6. A versão atual do registro na data da auditoria é `7.1.3`.
4. O deploy atualmente para os containers e remove a árvore anterior antes de provar que a nova imagem constrói e inicia corretamente.
5. A política pública de arquivos é ampla demais para um Directus que também guarda anexos jurídicos.

#### Problemas P1

1. Directus em inglês e sem identidade do sindicato na instância ativa.
2. A role/policy Editor atual recebe create/read/update/delete para todas as coleções do bootstrap.
3. `garantirPermissao()` não atualiza permissões existentes; ele apenas executa `SKIP`.
4. O formulário Astro de Notícias exibe Status e Slug para o Editor, mas não oferece Categoria, Fonte, Galeria, YouTube ou Agenda.
5. Na criação, o botão diz **Publicar Notícia**, mas o primeiro status é Rascunho; a ação é ambígua.
6. O preview da capa no formulário aponta para `http://localhost:8055`, inadequado fora da máquina do servidor.
7. A home do checkout contém textos corrompidos por dupla codificação, como `matÃ©ria` e `notÃ­cias`.
8. A capa da notícia pública usa `alt=""`; o requisito aprovado pede o título como descrição.
9. O HTML de `set:html` precisa de sanitização, mas a dependência escolhida está ausente.
10. Não há cabeçalhos de segurança observáveis no servidor Astro testado.

#### Lacunas P2

1. Os testes não cobrem Notícias, autenticação do painel, permissões, uploads, cache, sitemap, RSS ou integração Directus.
2. Não existe E2E do fluxo editorial.
3. Não existe teste automatizado de acessibilidade.
4. Não existe teste de XSS do conteúdo WYSIWYG.
5. Não existe teste de restauração real do backup no pipeline comum.
6. Docker não está disponível na máquina usada para esta auditoria; o Compose foi validado indiretamente pela instância ativa e pelos testes de script, não por subida local completa.
7. Schema, policies, presets, Flows e versão exata do container ativo exigem acesso administrativo/host para auditoria completa.

## 5. Princípios obrigatórios

1. **Uma fonte de verdade:** Directus governa schema, regras, estado, arquivos, permissões e auditoria.
2. **Um editor de Notícias:** nunca manter formulário completo no Astro e no Directus ao mesmo tempo após o cutover.
3. **Nativo antes de extensão:** tentar fields, groups, conditions, layouts, presets e policies antes de escrever UI.
4. **Regra no servidor:** ocultar um campo não é controle de integridade.
5. **Migração aditiva primeiro:** preservar os quatro IDs, slugs e URLs existentes.
6. **Segurança antes da conveniência:** arquivos jurídicos e drafts nunca serão públicos para simplificar preview.
7. **Conta individual:** nenhuma edição humana por token de serviço compartilhado.
8. **Build antes de parada:** nenhum deploy derruba a versão boa antes de construir e testar a nova.
9. **Backup restaurado:** arquivo criado sem teste de restauração não é gate suficiente.
10. **Usabilidade medida:** “até três minutos” só será aceito por teste humano.

## 6. Arquitetura-alvo detalhada

### 6.1 Directus

Responsabilidades:

- autenticação das contas Editor e Administrador;
- policies, permissões por coleção/campo/operação e accountability;
- coleção `posts` e `categorias`;
- coleção de junção `posts_galeria`;
- biblioteca de arquivos e separação por pastas/policies;
- WYSIWYG configurado;
- revisões e Activity Log;
- hook bloqueante de regras editoriais;
- Flow de agendamento;
- Flow/webhook de invalidação de cache;
- endpoint/extensão mínima de preview, se necessária;
- interface/editorial extension apenas para gaps confirmados.

### 6.2 Astro

Responsabilidades:

- renderização pública;
- capa, Galeria, Fonte e YouTube;
- autor institucional;
- alt, Open Graph, JSON-LD e datas;
- RSS e sitemap;
- rota de preview protegida;
- cache e endpoint interno de invalidação;
- módulos Astro específicos que não pertencem à autoria de Notícias;
- redirecionamento dos links antigos do editor.

### 6.3 Acesso por perfil

| Perfil | Entrada | Visibilidade |
| --- | --- | --- |
| Editor | Directus | Notícias, Avisos e arquivos editoriais permitidos |
| Administrador editorial | Directus | conteúdo, histórico, fixação e gestão das contas permitidas |
| Administrador operacional | Astro `/admin` | Jurídico, Social, Configurações e atalhos autorizados |
| Visitante | Astro público | somente conteúdo publicado e arquivos públicos |

O Astro deve verificar a função antes de montar navegação e dashboard. Um Editor que acessar `/admin` deve ser redirecionado para a coleção Notícias no Directus, em vez de receber links que falharão por falta de permissão.

## 7. Modelo de dados aprovado

### 7.1 `posts`

Preservar campos existentes e adicionar:

| Campo | Finalidade |
| --- | --- |
| `status` | `draft`, `scheduled`, `published`, `archived` |
| `titulo` | campo principal obrigatório |
| `slug` | automático, único e estável após primeira publicação |
| `resumo` | automático quando vazio, editável |
| `conteudo` | HTML WYSIWYG sanitizado/limitado |
| `imagem` | capa; opcional no draft, obrigatória ao publicar/agendar |
| `categoria` | Geral por padrão; relação read-only para Editor |
| `fixado_banner` | somente Administrador |
| `tem_fonte_externa` | controla fields condicionais |
| `fonte_nome` | obrigatório quando Fonte estiver ativa |
| `fonte_url` | HTTP/HTTPS validado |
| `video_youtube_url` | URL YouTube/youtu.be validada |
| `data_publicacao` | primeira publicação ou data agendada |
| `galeria` | alias O2M para `posts_galeria` |
| `date_created`, `date_updated` | auditoria e SEO |
| `user_created`, `user_updated` | accountability individual |

### 7.2 `posts_galeria`

- `id` incremental;
- `post` M2O obrigatório;
- `arquivo` M2O obrigatório e restrito a imagem;
- `ordem` para drag-and-drop;
- `legenda` opcional;
- `credito` opcional;
- máximo de vinte relações por post, imposto no servidor.

### 7.3 Categorias

Garantir por slug, preservando IDs relacionados:

1. Geral;
2. Campanha Salarial;
3. Assembleias — renomear o registro atual `id=2` sem recriá-lo;
4. Direitos;
5. Benefícios;
6. Jurídico;
7. Comunicados.

### 7.4 Arquivos

Classificar os 13 arquivos atuais antes de mover qualquer um:

```text
Arquivos
├── Publico
│   ├── Noticias
│   ├── Site
│   └── Social
└── Privado
    └── Juridico
```

A API pública poderá ler somente arquivos explicitamente públicos. O Editor poderá selecionar apenas a pasta de Notícias e outras pastas editoriais autorizadas.

## 8. Regras de servidor

O hook/API extension deverá ser idempotente e cobrir create/update, inclusive operações fora do Studio.

### 8.1 Slug

- gerar no primeiro save;
- normalizar Unicode, espaços e caracteres inválidos;
- resolver colisão de forma determinística;
- preservar após primeira publicação;
- aplicar índice único somente depois de auditar os dados existentes.

### 8.2 Resumo

- gerar somente quando vazio;
- remover HTML com parser adequado;
- normalizar espaços;
- nunca sobrescrever ajuste humano posterior.

### 8.3 Publicação

Ao entrar em `published` ou `scheduled`:

- exigir Título, Texto e Foto de capa;
- validar categoria;
- validar Fonte quando ativada;
- validar YouTube quando preenchido;
- validar no máximo vinte fotos;
- definir `data_publicacao` na primeira publicação;
- rejeitar transições inconsistentes com mensagem em português.

### 8.4 Agendamento

- `scheduled` exige data futura;
- Flow CRON promove itens vencidos para `published`;
- operação deve ser idempotente;
- execução e falhas devem ficar observáveis;
- cancelamento retorna a draft sem publicar acidentalmente.

### 8.5 HTML

- toolbar reduzida no Studio;
- sanitização com allowlist no limite de confiança escolhido;
- teste explícito de `script`, handlers `on*`, URLs `javascript:`, iframes e atributos perigosos;
- o embed do YouTube será construído pelo Astro a partir de ID validado, não aceito como HTML livre.

## 9. Plano de execução

### Fase 0 — estabilizar o checkout

1. Corrigir o caminho do import em `salvar.ts`.
2. Declarar e travar a biblioteca de sanitização escolhida.
3. Atualizar Astro de `7.0.6` para versão corrigida, atualmente `7.1.3`, em branch/homologação.
4. Reexecutar audit, testes e build.
5. Corrigir a dupla codificação de `site/src/pages/index.astro`.
6. Adicionar teste de build ao pipeline obrigatório.
7. Adicionar checagem Astro/TypeScript apropriada.
8. Proibir deploy se o build ou os testes falharem.

**Gate 0:** checkout constrói sem patches temporários; testes passam; vulnerabilidade conhecida foi corrigida ou formalmente mitigada.

### Fase 1 — reconciliar release e criar homologação

1. Identificar commit/pacote exato que gerou a implantação atual.
2. Obter a versão real do container Directus com `docker inspect`/logs.
3. Exportar schema, policies, acessos, presets, Flows e settings.
4. Copiar SQLite, uploads e extensions para ambiente isolado.
5. Restaurar backup completo na homologação.
6. Confirmar 4 Notícias, 4 Categorias, 3 Documentos e 13 arquivos, ou registrar divergência.
7. Fixar a imagem Directus pelo patch exato homologado; não presumir que a tag major equivale ao release testado.
8. Configurar `pt-BR`, nome, cor e marca do projeto na base existente.

**Gate 1:** homologação reproduz a base real e a versão implantada está documentada.

### Fase 2 — segurança antes da UX

1. Inventariar relações de cada arquivo.
2. Criar estrutura de pastas pública/privada.
3. Remover leitura pública irrestrita de `directus_files`.
4. Restringir assets públicos por pasta/uso aprovado.
5. Criar policy Editor pelo modelo Directus 11 (`policy` + acessos).
6. Remover delete de Notícias e Avisos.
7. Bloquear categorias, `fixado_banner` e campos técnicos para Editor.
8. Remover acesso a coleções não editoriais.
9. Exigir contas individuais; avaliar MFA para Administradores.
10. Adicionar cabeçalhos de segurança no Astro/proxy.

**Gate 2:** visitante não lê draft/anexo jurídico; Editor não vê nem altera dados fora do escopo.

### Fase 3 — infraestrutura idempotente de schema

1. Extrair cliente administrativo comum para scripts.
2. Trocar `SKIP` por upsert real de fields, relations, policies, permissions, presets e Flows.
3. Implementar dry-run de diferenças.
4. Criar snapshot de schema versionado.
5. Rodar setup duas vezes e exigir zero alteração na segunda.
6. Nunca incluir remoção de Documentos no bootstrap comum.

**Gate 3:** setup repetível e capaz de apertar instalações antigas.

### Fase 4 — schema aditivo e backfill

1. Adicionar campos editoriais e de auditoria.
2. Criar `posts_galeria` e relações.
3. Garantir as sete categorias.
4. Auditar slugs e aplicar unicidade.
5. Preencher `data_publicacao` dos quatro posts atuais a partir de `date_created`.
6. Preservar IDs, slugs e URLs.
7. Decidir explicitamente se o destaque fixo atual é intencional ou dado de demonstração.
8. Manter o site antigo compatível durante a fase aditiva.

**Gate 4:** nenhum conteúdo ou URL existente foi perdido e o frontend anterior continua funcionando.

### Fase 5 — hook, Flows e testes de integração

1. Implementar regras de Slug e Resumo.
2. Implementar validações de Publicação, Fonte, YouTube e Galeria.
3. Implementar primeira `data_publicacao` e preservação posterior.
4. Criar Flow agendado idempotente.
5. Criar invalidação autenticada de cache.
6. Registrar falha operacional sem reverter publicação válida.
7. Testar tudo contra um Directus descartável/restaurado.

**Gate 5:** chamadas diretas à API recebem as mesmas regras que o Studio.

### Fase 6 — Data Studio nativo primeiro

1. Garantir interface e contas em `pt-BR`.
2. Mostrar ao Editor apenas Notícias, Avisos e arquivos autorizados.
3. Ordenar Título, Foto de capa, Texto e grupo fechado **Mais opções**.
4. Ocultar Slug, auditoria e destaque fixo.
5. Configurar WYSIWYG essencial.
6. Configurar capa e pasta padrão.
7. Configurar Galeria ordenável.
8. Configurar conditions de Fonte e Agenda.
9. Aplicar Categoria Geral por preset/default.
10. Criar cards e bookmarks Rascunhos, Publicadas e Agendadas.
11. Manter Content Versioning avançado fora do fluxo do Editor no primeiro rollout; usar draft + revisions.

**Gate 6:** Editor conclui o roteiro funcional sem entrar em Settings ou enxergar campo técnico.

### Fase 7 — preview e frontend público

1. Criar rota Astro `/preview/noticias/<id>` com `no-store` e `noindex`.
2. Usar token Directus de leitura mínima somente no servidor Astro.
3. Não colocar token Directus estático no HTML ou URL.
4. Preferir assinatura curta/expirável ou sessão de preview; documentar rotação e revogação.
5. Configurar `frame-src` estrito para Live Preview.
6. Atualizar tipos e consultas do Astro.
7. Renderizar Fonte, Galeria e YouTube.
8. Usar `data_publicacao` e `date_updated` em site, RSS, sitemap e JSON-LD.
9. Usar o título como alt da capa conforme decisão confirmada.
10. Corrigir cache com invalidação por chave/prefixo.

**Gate 7:** preview não vaza e publicação aparece no site sem esperar todo o TTL.

### Fase 8 — teste de usabilidade e spike de extensão

Testar primeiro o Studio nativo configurado com pelo menos cinco pessoas não treinadas e representativas da equipe. Não usar menores como participantes apenas por causa da expressão “até uma criança”.

Roteiro mínimo:

1. entregar título, texto e capa prontos;
2. pedir criação e publicação sem ajuda;
3. medir tempo, erros, hesitações, retornos e pedidos de ajuda;
4. exigir conclusão de todos e mediana inferior a três minutos;
5. corrigir primeiro rótulos, ordem, campos e feedback;
6. repetir o teste.

Somente se a configuração nativa falhar, criar extensão Directus limitada a:

- ações **Salvar rascunho**, **Publicar agora** e **Agendar**;
- confirmação ao alterar conteúdo já publicado;
- abertura de Preview;
- retorno à grade;
- links **Ver no site** e **Criar outra notícia**;
- feedback de erros em português.

A extensão não poderá duplicar autenticação, arquivos, policies, hooks ou regras editoriais.

**Gate 8:** meta de três minutos comprovada ou gaps remanescentes documentados e aceitos.

### Fase 9 — cutover do editor

1. Construir imagem e rodar testes antes de parar containers antigos.
2. Produzir artefato/version tag imutável.
3. Fazer backup e restaurar em homologação.
4. Implantar schema aditivo, hook, Flows e frontend compatível.
5. Liberar Editor piloto no Directus.
6. Manter o formulário Astro apenas durante janela curta de rollback, sem uso simultâneo.
7. Redirecionar `/admin/noticias` e URLs com ID para o Directus.
8. Remover formulário Astro, API `salvar.ts`, helper e Quill CDN.
9. Tornar o painel Astro restante sensível a função/policy.
10. Observar publicação, erros, agenda e cache por janela definida.

**Gate 9:** existe um único editor de Notícias e o release anterior pode ser restaurado.

### Fase 10 — remover Documentos, Convenções, Acordos e Editais

1. Confirmar novamente os registros e arquivos.
2. Exportar os três registros em JSON.
3. Registrar que atualmente todos têm `arquivo = null`; testar PDF somente se algum arquivo existir no momento do cutover.
4. Fazer backup conjunto de banco/uploads/extensions.
5. Remover navegação, página `/convencoes`, sitemap, tipos, queries e documentação operacional.
6. Remover `documentos` do bootstrap e das policies.
7. Rodar migração destrutiva em `--dry-run`.
8. Excluir a coleção somente após conferência e autorização.
9. Excluir arquivos apenas se forem órfãos e estiverem no backup.
10. Confirmar que Jurídico e outros módulos não foram afetados.

**Gate 10:** nenhuma área ativa de Documentos/Convenções/Acordos/Editais e backup recuperável preservado.

### Fase 11 — operação e melhoria contínua

1. Automatizar smoke tests pós-deploy.
2. Monitorar falhas do Flow e tempo de publicação.
3. Revisar Activity Log e acessos periodicamente.
4. Revalidar a extensão a cada upgrade do Directus.
5. Rodar teste de restauração em periodicidade definida.
6. Repetir teste de usabilidade após mudanças significativas.

## 10. Estratégia de testes obrigatória

### 10.1 Unitários

- slug com acentos, duplicidade e imutabilidade;
- resumo automático e preservação do manual;
- HTML vazio e malicioso;
- Fonte e YouTube;
- transições de status;
- agenda futura/passada;
- limite da Galeria;
- invalidação de cache;
- payloads de policies sem delete;
- codificação UTF-8 das strings públicas.

### 10.2 Integração Directus

- setup duas vezes;
- draft sem capa;
- publish/scheduled sem capa bloqueados;
- publish válido;
- Flow de agenda idempotente;
- vigésima primeira foto bloqueada;
- ordem, legenda e crédito preservados;
- Editor sem delete e sem `fixado_banner`;
- visitante sem draft e sem arquivo privado;
- accountability aponta para o usuário correto;
- schema snapshot/apply sem drift inesperado.

### 10.3 Astro

- build de produção;
- home com/sem post fixado;
- paginação;
- artigo básico/completo;
- sanitização de conteúdo;
- Galeria com vinte fotos;
- YouTube leve;
- Fonte;
- alt da capa;
- RSS sem scheduled;
- sitemap sem `/convencoes`;
- preview privado e sem cache;
- cache invalidado após publicar/arquivar.

### 10.4 E2E

- login Editor;
- criação de draft;
- Preview;
- publicação;
- edição de publicado com confirmação;
- agenda e promoção;
- arquivamento;
- tentativa de exclusão negada;
- acesso por teclado;
- desktop prioritário e celular compatível.

### 10.5 Segurança

- XSS no WYSIWYG;
- CSRF e Origin no painel Astro restante;
- sessão expirada;
- rate limit de login;
- enumeração de Preview;
- segredo ausente/incorreto/expirado;
- acesso direto a IDs de arquivos privados;
- headers: CSP, `frame-ancestors`, `X-Content-Type-Options`, Referrer Policy e Permissions Policy;
- dependências sem vulnerabilidade alta/crítica e moderadas justificadas.

### 10.6 Acessibilidade e performance

- axe/checagem equivalente nas superfícies editadas;
- foco, labels, erros e contraste;
- landmarks e hierarquia de headings;
- imagens com alt coerente;
- navegação completa por teclado;
- página de artigo com 20 fotos em viewport desktop/celular;
- imagens responsivas, WebP/formatos adequados, lazy load e dimensões;
- metas de Lighthouse definidas para páginas públicas.

### 10.7 Operação

- backup criado e restaurado;
- build antes de `down`;
- healthchecks Astro e Directus;
- rollback para imagem anterior;
- migração aditiva revertível;
- remoção de Documentos nunca automática no deploy comum.

## 11. Deploy revisado

O deploy atual deve ser alterado para esta ordem:

1. testes e build local/CI;
2. gerar imagem/tag imutável;
3. backup verificado;
4. restaurar backup em homologação quando houver migração;
5. construir/puxar nova imagem sem parar a antiga;
6. validar migrations/schema em dry-run;
7. aplicar mudança aditiva;
8. subir nova versão;
9. healthcheck e smoke tests;
10. trocar tráfego/confirmar containers;
11. manter artefato anterior para rollback;
12. somente depois limpar releases antigos.

O script não poderá remover a árvore remota nem parar a versão saudável antes de provar que o novo artefato existe e constrói.

## 12. Rollback

### Antes da retirada do editor Astro

- desativar hook/Flows novos;
- restaurar release anterior do Astro;
- preservar campos aditivos sem uso;
- restaurar policy anterior somente se não reabrir vazamento de arquivos;
- reabrir o editor Astro apenas como contingência temporária.

### Depois da retirada do editor Astro

- restaurar imagem anterior do Astro;
- restaurar extensão Directus compatível;
- restaurar SQLite e uploads em conjunto se houver rollback destrutivo;
- não restaurar somente uma tabela ou somente metadados de arquivos.

### Critérios para abortar

- build/testes vermelhos;
- versão Directus divergente;
- backup não restaurável;
- perda ou alteração de slug/ID;
- arquivo jurídico público;
- Editor com delete ou acesso indevido;
- preview vazando conteúdo;
- agendamento não idempotente;
- falha de publicação no site público.

## 13. Estimativa relativa

Para uma pessoa desenvolvedora com acesso administrativo e ambiente de homologação:

| Bloco | Faixa inicial |
| --- | --- |
| Estabilização e reconciliação | 2–4 dias úteis |
| Segurança e schema idempotente | 4–7 dias |
| Modelo, hook e Flows | 5–9 dias |
| Studio e frontend público | 5–9 dias |
| Testes, usabilidade e extensão opcional | 4–10 dias |
| Cutover, Documentos e operação | 3–6 dias |

Faixa total indicativa: **4 a 7 semanas**, incluindo homologação e rodadas de correção. A necessidade de extensão e a auditoria administrativa da base podem alterar a estimativa.

## 14. Definition of Done

- [ ] `npm test`, checagem Astro/TypeScript e build passam.
- [ ] Astro está em versão corrigida para a vulnerabilidade conhecida.
- [ ] Directus está em patch exato homologado.
- [ ] checkout e implantação estão reconciliados.
- [ ] existe um único editor de Notícias no Directus.
- [ ] Editor vê somente Notícias, Avisos e arquivos autorizados.
- [ ] formulário principal contém Título, Foto de capa e Texto.
- [ ] draft sem capa funciona; publish/scheduled sem capa falham.
- [ ] Slug, Resumo e Categoria padrão são automáticos.
- [ ] Galeria de até vinte fotos funciona com legenda/crédito.
- [ ] Fonte e YouTube funcionam.
- [ ] Preview não expõe token nem conteúdo.
- [ ] Agenda publica no horário e é idempotente.
- [ ] publicação aparece sem aguardar todo o TTL.
- [ ] Editor arquiva, mas não exclui.
- [ ] auditoria preserva o usuário real.
- [ ] arquivos jurídicos permanecem privados.
- [ ] HTML malicioso não executa.
- [ ] RSS, sitemap, JSON-LD, datas e alt estão corretos.
- [ ] `/convencoes` e a coleção Documentos foram removidos após backup validado.
- [ ] deploy constrói antes de parar a versão saudável.
- [ ] rollback foi ensaiado.
- [ ] cinco participantes sem treinamento concluíram o fluxo essencial; mediana inferior a três minutos.
- [ ] documentação, pesquisa e grafo Graphify estão atualizados.

## 15. Próxima ação autorizável

Executar somente a **Fase 0** primeiro. Nenhuma migration, permission change ou remoção de conteúdo deve começar enquanto o checkout não construir e o release implantado não estiver identificado.
