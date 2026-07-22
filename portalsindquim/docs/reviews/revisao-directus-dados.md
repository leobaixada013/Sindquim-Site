# Revisão do Directus, dados e permissões

**Data da revisão:** 21 de julho de 2026  
**Escopo:** `portalsindquim`, somente leitura do código e da documentação local  
**Objetivo:** registrar o estado confirmado e orientar a implementação segura do schema, permissões, notícias, usuários, Benefícios e Jurídico  
**Decisão de produto obrigatória:** o portal não terá o módulo Convenções/Documentos, editais ou acordos publicados como biblioteca  

## 1. Resumo executivo

O backend atual é uma base aproveitável, mas ainda não está pronto para receber dados reais. Notícias, parte do conteúdo jurídico, chamados, usuários e configurações já possuem integrações com o Directus. Porém, as permissões atuais violam o menor privilégio, o módulo removido de Convenções/Documentos continua ativo e Benefícios ainda é apenas uma página genérica.

Há quatro bloqueios centrais antes de qualquer dado real:

1. a política pública recebe leitura sem filtro de `posts` e de todo `directus_files`, permitindo exposição de rascunhos e potencialmente de anexos privados;
2. o papel Editor recebe CRUD sobre praticamente todas as coleções, inclusive dados pessoais, configurações e conteúdo jurídico;
3. o formulário jurídico usa credenciais administrativas do Directus no servidor Astro e os anexos podem ser solicitados por qualquer conta Directus autenticada, sem comprovar que ela pertence ao Jurídico;
4. os scripts se apresentam como idempotentes, mas não reconciliam regras inseguras existentes e um deles substitui conteúdo jurídico apagando e recriando todos os itens.

A implementação deve preservar a essência já construída para o Jurídico — página dedicada, direitos, plantões, FAQ, triagem, anexo, fila e resposta — separando rigidamente **conteúdo público editável** de **chamados e anexos privados**. Benefícios deve ganhar modelo estruturado próprio. Notícias deve receber o modelo editorial completo já aprovado no plano mestre.

## 2. Limites e método da revisão

Foram usados:

- consulta inicial ao grafo Graphify do repositório;
- leitura dirigida dos scripts de schema e seed;
- leitura das consultas Directus, APIs Astro e tipos TypeScript;
- confronto com o plano mestre local;
- documentação oficial atual do Directus para Policies, permissões por item/campo, usuários e assets;
- validação de sintaxe dos seis scripts principais;
- execução do teste unitário existente do seed.

Não existe banco `data.db`, diretório de uploads ou export da instância dentro de `portalsindquim/deploy`. Portanto, este relatório confirma o **schema pretendido pelo código**, não a quantidade nem o conteúdo de uma base de produção. Antes de migrar ou apagar `documentos`, é obrigatório inventariar a instância ativa em uma cópia isolada e fazer backup restaurável.

Resultados executados nesta revisão:

| Verificação | Resultado |
|---|---|
| `node --check scripts/directus-schema.mjs` | passou |
| `node --check scripts/setup-juridico.mjs` | passou |
| `node --check scripts/directus-atualizar-juridico.mjs` | passou |
| `node --check scripts/directus-atualizar-paginas.mjs` | passou |
| `node --check scripts/setup-configuracoes.mjs` | passou |
| `node --check scripts/setup-directus-social.mjs` | passou |
| `node --test scripts/directus-conteudo-exemplo.test.mjs` | 2/2 passou |

Esses testes comprovam apenas sintaxe e a função `criarSeAusente`; não comprovam schema, segurança, idempotência integral, RBAC nem privacidade.

## 3. Inventário confirmado

### 3.1 Execução e persistência

- O Compose usa `directus/directus:11`, sem versão exata nem digest (`deploy/docker-compose.yml:1-25`).
- O banco é SQLite em `/directus/database/data.db`.
- Banco, uploads e extensões usam volumes persistentes separados da imagem.
- Directus e Astro publicam portas diretamente no host no Compose base.
- O site usa `@directus/sdk` `^23.0.0` (`site/package.json:16-35`).

O tag flutuante `:11` não é reproduzível. A imagem de produção deve ser fixada por versão e digest previamente testados; atualização não pode acontecer implicitamente em um `pull`.

### 3.2 Coleções criadas pelo bootstrap principal

`scripts/directus-schema.mjs:194-443` declara:

| Coleção | Uso atual | Estado em relação ao produto |
|---|---|---|
| `categorias` | categorias de notícias | manter e restringir |
| `posts` | notícias | manter e evoluir |
| `avisos` | avisos públicos | manter |
| `proximos_videos` | agenda de vídeo | manter se o módulo for aprovado |
| `diretores` | diretoria | manter |
| `documentos` | convenções, acordos, atas, editais e outros PDFs | remover com migração segura |
| `cards_instagram` | cards/reels | manter se o módulo for aprovado |
| `paginas` | páginas genéricas por slug | manter para páginas simples; não usar como modelo final de Benefícios/Jurídico |
| `pagina_juridico` | textos principais do Jurídico | manter e ampliar |
| `juridico_direitos` | cards de situações/direitos | manter |
| `juridico_plantoes` | plantões | manter |
| `juridico_faq` | FAQ | manter |
| `juridico_campos_formulario` | suposta configuração do formulário | manter, corrigir e versionar |
| `configuracoes` | contato e URLs sociais | manter, revisar duplicação |
| `inscricoes_newsletter` | e-mails recebidos | manter somente se houver operação, retenção e antispam |
| `mensagens_contato` | mensagens recebidas | manter com menor privilégio e retenção |

Scripts adicionais criam:

| Coleção | Script | Observação |
|---|---|---|
| `configuracoes_globais` | `setup-configuracoes.mjs` | singleton de logo, módulos e segredos de integrações |
| `posts_sociais` | `setup-directus-social.mjs` | conteúdo social e métricas |
| `chamados_juridicos` | `setup-juridico.mjs` | dados pessoais, descrição, resposta e anexo jurídico |

Há dois singletons de configuração, `configuracoes` e `configuracoes_globais`, com sobreposição em YouTube. A consolidação deve ser planejada; não apagar um deles enquanto ainda houver consultas ativas.

### 3.3 Notícias

Estado implementado em `posts`:

- `status`: `published`, `draft` ou `archived`;
- `titulo`, `slug`, `resumo`, `conteudo`;
- uma imagem de destaque em `imagem`;
- relação M2O com `categorias`;
- `fixado_banner`;
- `date_created`.

Lacunas confirmadas:

- não há galeria;
- não há texto alternativo da capa;
- não há fonte, URL de fonte, crédito ou vídeo;
- não há agendamento nem `publicado_em`;
- não há autoria e atualização auditável no modelo de conteúdo;
- o slug é obrigatório no schema, mas não existe constraint única declarada;
- a data pública usada para ordenação é `date_created`, não a data real de publicação;
- a permissão pública não limita itens a `status=published`;
- o formulário Astro salva título, slug, resumo, conteúdo e capa, mas omite categoria, fonte, galeria, alt, agenda e preview (`site/src/pages/api/admin/noticias/salvar.ts:37-87`).

O frontend adiciona filtro `status=published` nas consultas (`site/src/lib/directus.ts:261-315`), o que reduz exibição acidental pelo Astro, mas não corrige a exposição da API pública do Directus.

### 3.4 Benefícios

Não existem `pagina_beneficios`, `beneficios`, `beneficios_categorias`, `beneficios_passos` ou `beneficios_faq` no schema atual.

O slug `beneficios` é criado em `paginas` com apenas `titulo` e um bloco HTML (`scripts/directus-atualizar-paginas.mjs:35-51`; `scripts/directus-conteudo-exemplo.mjs:101-116`). Isso não permite administrar de modo seguro:

- elegibilidade;
- condições e validade;
- categoria e ordenação;
- CTA por benefício;
- estados ativo, futuro e expirado;
- informação de atualização;
- SEO/OG da página;
- cards e FAQ sem editar HTML.

Conclusão: Benefícios ainda não atende ao plano aprovado.

### 3.5 Jurídico público editável

A base correta já existe e não deve ser duplicada:

- `pagina_juridico` controla hero, títulos de seções e CTA final;
- `juridico_direitos`, `juridico_plantoes` e `juridico_faq` são ordenáveis e publicáveis;
- `/juridico` consulta essas coleções e possui fallbacks em código (`site/src/lib/directus.ts:52-196` e `424-499`);
- a rota pública preserva hero, cards, plantão, triagem, FAQ e CTA (`site/src/pages/juridico.astro`).

Partes que continuam fixas no Astro e não são editáveis:

- links dos dois CTAs do hero, fixos em `#agendamento` e `#direitos`;
- introdução do card “Abra um chamado jurídico”;
- rótulos de nome, CPF, e-mail, telefone, tipo, descrição e anexo;
- opções do tipo de demanda;
- obrigatoriedade de CPF e anexo;
- texto LGPD curto;
- formatos e limite do anexo;
- mensagens de sucesso e erro;
- metadados SEO e descrição da página.

Embora exista `juridico_campos_formulario`, a página apenas chama direitos, plantões, FAQ e singleton; ela não chama `getJuridicoCamposFormulario()`. A coleção descrita como “configuração dinâmica” não governa o formulário atual.

Também existem dois modelos editoriais concorrentes para Jurídico: o slug `paginas.juridico` e a estrutura dedicada `pagina_juridico` + coleções auxiliares. A rota dedicada usa a estrutura dedicada; o item genérico deve ser migrado/arquivado para eliminar ambiguidade.

### 3.6 Chamados e anexos jurídicos

`setup-juridico.mjs:124-180` cria `chamados_juridicos` com:

- nome, CPF, e-mail e telefone;
- tipo e descrição livre;
- arquivo `anexo`;
- status;
- resposta do advogado;
- datas de criação, atualização, resposta e envio de e-mail.

O fluxo atual:

1. `/api/juridico` recebe o formulário;
2. o Astro valida tamanho/formato e CPF;
3. `criarClienteServico()` autentica com `DIRECTUS_ADMIN_EMAIL` e `DIRECTUS_ADMIN_PASSWORD`;
4. a aplicação envia o arquivo e cria o chamado com privilégios administrativos;
5. o painel lista chamados, abre detalhes, baixa anexo por proxy e envia resposta por e-mail.

Pontos positivos a preservar:

- honeypot;
- limites de comprimento;
- validação de CPF, e-mail e telefone;
- allowlist declarada de extensões/MIME;
- limite de 10 MB;
- CPF mascarado na listagem;
- resposta sensível carregada sob demanda;
- proxy de anexos com `Cache-Control: no-store`;
- status e prevenção de conclusão sem resposta mínima;
- registro de data de resposta/e-mail.

Lacunas críticas:

- credencial de Admin técnico no servidor público;
- CPF e anexo obrigatórios antes de a necessidade ser validada;
- CPF armazenado em texto simples;
- ausência de finalidade/versão do aviso e prazo de retenção no registro;
- ausência de responsável e histórico append-only;
- ausência de rate limit e antimalware/quarentena;
- validação apenas do MIME declarado/nome, sem verificar magic bytes/conteúdo;
- upload não é colocado explicitamente em pasta privada;
- qualquer usuário Directus autenticado passa pela checagem do proxy; não há checagem de papel Jurídico nem de relação do arquivo com um chamado autorizado (`site/src/pages/api/admin/juridico/anexo/[id].ts:12-33`);
- o endpoint de anexo aceita qualquer ID de arquivo, não apenas o anexo do chamado solicitado;
- campos do formulário público podem ser alterados na API pública direta porque `chamados_juridicos.create` usa campos permitidos, presets e `validation: {}`, contornando as validações do Astro (`setup-juridico.mjs:230-269`).

### 3.7 Usuários e identidade

O Directus é a fonte de usuários. O painel Astro atual:

- autentica qualquer conta Directus que consiga fazer login;
- guarda somente o access token em cookie HTTP-only por até oito horas;
- lista contas apenas para quem possui `role.admin_access=true`;
- permite alternar outra conta entre `active` e `suspended`;
- impede que o Admin suspenda a própria conta.

Ainda não existem no painel:

- convite;
- escolha controlada de função;
- reenvio/cancelamento do convite;
- recuperação de senha;
- indicação/exigência de MFA;
- revogação de sessões/tokens;
- último acesso;
- proteção explícita do último Admin ativo;
- trilha legível de alterações;
- gestão delegada sem `admin_access`.

A documentação oficial atual do Directus confirma que Policies são agregadas ao usuário/papel, que apenas usuários `active` autenticam e que escrita em `directus_users`, `directus_roles` e `directus_policies` pode causar elevação de privilégio. Por isso o Gestor de acessos não deve receber um editor livre dessas coleções.

### 3.8 Convenções/Documentos não foram removidos

A decisão de produto ainda não está aplicada. Continuam ativos:

- coleção e permissões de `documentos` (`directus-schema.mjs:271-292`, `445-450`);
- tipos `Documento` e `SchemaDirectus.documentos` (`site/src/lib/tipos.ts:58-64`, `219-238`);
- consulta `getDocumentos()` (`site/src/lib/directus.ts:373-380`);
- rota `/convencoes` (`site/src/pages/convencoes.astro`);
- entrada `/convencoes` no sitemap (`site/src/pages/sitemap.xml.ts:1-15`);
- seeds de convenção, acordo e ata (`directus-conteudo-exemplo.mjs:231-238`);
- documentação e README que apresentam o módulo como funcionalidade.

Não se deve fazer substituição cega da palavra “documento”: anexos do chamado e a orientação “documentos necessários” continuam legítimos. O que sai é a biblioteca pública de Convenções/Documentos, seus tipos e suas permissões.

## 4. Riscos P0 — bloqueiam dados reais e produção

### P0.1 — rascunhos e todos os arquivos têm leitura pública sem filtro

`LEITURA_PUBLICA` inclui `posts`, `documentos` e `directus_files`; `garantirPermissao()` grava `permissions: {}` e `fields: ['*']` quando não recebe campos (`directus-schema.mjs:445-527`).

Impacto:

- leitura anônima de rascunhos pela API;
- descoberta de metadados e acesso a assets;
- potencial exposição de anexos jurídicos e arquivos internos;
- futuros campos sensíveis adicionados a coleções públicas seriam expostos automaticamente.

Correção obrigatória:

- filtros de item na Policy pública;
- campos públicos explícitos por coleção;
- `directus_files.read` limitado a pastas públicas conhecidas;
- anexos jurídicos em pasta privada, sem Policy pública;
- teste anônimo negativo permanente.

Desde Directus 11.14.1, o endpoint `/assets/:id` respeita permissões de `directus_files`; conceder leitura pública de toda a coleção elimina justamente essa proteção.

### P0.2 — Editor tem CRUD irrestrito sobre conteúdo e dados pessoais

`garantirRoleEditor()` percorre todas as coleções do bootstrap e concede `create`, `read`, `update` e `delete` com todos os campos (`directus-schema.mjs:531-569`). Isso inclui configurações, newsletter, contato e conteúdo Jurídico público.

O script jurídico procura uma Policy por texto “editor”, “conteúdo” ou “administrator” e concede leitura completa e atualização de chamados (`setup-juridico.mjs:225-276`). Não existe papel Jurídico isolado.

Impacto:

- Editor de notícias pode ler dados pessoais e casos jurídicos;
- pode alterar página jurídica e configurações sem atribuição;
- pode excluir registros;
- não existe separação entre redator, publicador, Benefícios, Social e Jurídico.

### P0.3 — Social pode administrar e excluir qualquer arquivo

`setup-directus-social.mjs:391-413` concede criação/leitura/atualização/exclusão de `directus_files` sem filtro de pasta, além de acesso de escrita a `posts`.

Impacto:

- exclusão de capas, logos e anexos;
- leitura de arquivo de outra área;
- Social consegue alterar notícias fora do seu escopo.

### P0.4 — acesso a anexo não verifica papel nem vínculo

O proxy aceita um ID arbitrário, exige apenas uma sessão Directus válida e repassa o token. A autorização deve conferir simultaneamente:

1. usuário ativo;
2. Policy Jurídico efetiva;
3. chamado existente e legível pelo usuário;
4. arquivo exatamente relacionado ao chamado;
5. arquivo em `Juridico-privado/Anexos-de-chamados` e liberado pela varredura.

### P0.5 — endpoint público opera como Admin técnico

O servidor Astro autentica com e-mail/senha administrativos para cada abertura de chamado (`site/src/lib/juridico.ts:104-111`). Comprometimento da aplicação ou dessas variáveis concede controle total do Directus.

Substituir por uma identidade de serviço dedicada, sem `admin_access`, capaz somente de:

- enviar arquivo para a pasta jurídica de quarentena;
- criar `chamados_juridicos` nos campos mínimos;
- criar o evento inicial;
- nunca ler chamados, usuários, Policies ou outros arquivos.

O token fica somente no servidor, deve ser rotacionável e não aparece no navegador ou log.

### P0.6 — dados jurídicos sem governança de retenção e upload seguro

Antes de receber dados reais é necessário aprovar e implementar:

- minimização de CPF/anexo na primeira etapa;
- texto de privacidade e sua versão;
- finalidade e retenção;
- expiração/anonimização;
- varredura antimalware;
- arquivos privados e quarentena;
- logs sem CPF, descrição, telefone, e-mail, nome de arquivo ou corpo da resposta;
- resposta a incidente e solicitação de titular.

### P0.7 — scripts não corrigem estado inseguro existente

No script principal, se uma permissão existe, ela recebe `SKIP`; seus filtros, campos, presets e validações não são reconciliados (`directus-schema.mjs:511-529`). Campos existentes recebem somente atualização de `meta`, não de `schema` (`457-468`).

Há ainda um defeito de vínculo: se a role `Editor` existir sem Policy, o script cria uma Policy e suas permissões, mas retorna antes de vinculá-la à role (`531-569`).

Um bootstrap seguro precisa convergir o estado real para o manifesto desejado e falhar diante de drift perigoso.

### P0.8 — tag Directus flutuante

`directus/directus:11` pode mudar sem revisão. A produção precisa usar versão exata mais digest, scan e teste de migração/rollback. Isso não substitui a decisão de licença e versão registrada no plano mestre.

## 5. Riscos P1 — corrigir antes do corte

1. **Convenções/Documentos ativo:** schema, seed, rota, sitemap, tipos, consulta e documentação contradizem a decisão do produto.
2. **Benefícios genérico:** um WYSIWYG não suporta validade, elegibilidade, CTA, categorias e estados.
3. **Notícias incompletas:** sem galeria, alt, fonte, vídeo, agenda, autoria, publicação e constraints.
4. **Slug sem unicidade declarada:** `posts.slug`, `categorias.slug` e `paginas.slug` podem duplicar, inclusive por corrida entre requisições.
5. **Seed jurídico destrutivo:** `substituirColecao()` apaga todos os itens e recria o conjunto (`directus-atualizar-juridico.mjs:170-196`), perdendo IDs, autoria, histórico e alterações editoriais.
6. **Formulário supostamente dinâmico:** `juridico_campos_formulario` não controla o HTML público.
7. **Conteúdo jurídico duplicado:** defaults em TypeScript, seed dedicado e página genérica podem divergir.
8. **Cadastro de usuários incompleto:** apenas lista/suspensão; não atende ao ciclo de convite, função, MFA e revogação.
9. **Detecção de Policies por nome:** regex pode selecionar Policy errada; o script principal pode confundir “Public” com nomes como “Publicador”.
10. **Acesso ao painel por autenticação, não por capacidade:** qualquer conta que autentique recebe cookie e tenta abrir rotas; a falha aparece tardiamente como erro de coleção.
11. **Criação pública direta de newsletter/contato:** a API Directus pode ser chamada fora dos endpoints Astro e contornar honeypot/limites; não há rate limit de produto nem retenção definida.
12. **Seed usa serviço visual externo:** `picsum.photos` é importado por `/files/import` (`directus-conteudo-exemplo.mjs:42-50`), contrariando a restrição do projeto e tornando testes não determinísticos.
13. **Seed mistura demonstração e configuração operacional:** grava telefone, e-mail, endereço e redes no singleton sem trava de ambiente.
14. **Ausência de testes RBAC:** os dois testes atuais cobrem somente criação/reuso pelo campo natural.
15. **Mutações do painel e CSRF:** as requisições JSON de configurações, usuários e resposta jurídica não enviam `x-csrf-token`, enquanto o middleware o exige; o fluxo deve ter teste E2E para não parecer salvo quando foi negado.

## 6. Proposta de schema-alvo

### 6.1 Princípios

- Uma fonte de verdade por conceito.
- Conteúdo público e dados privados em coleções/Policies separadas.
- Campos públicos explícitos; nunca `*` em Policy pública.
- Relações e constraints no banco, não apenas validação visual.
- Exclusão física excepcional; usar status/arquivo e retenção controlada.
- Fallback em código apenas para indisponibilidade; não como segunda interface editorial permanente.
- Slugs/chaves técnicas gerados e únicos.
- Migração preserva IDs, autoria e histórico sempre que possível.

### 6.2 Notícias

Evoluir `posts`, sem criar coleção concorrente:

| Campo | Tipo/regra |
|---|---|
| `status` | `draft`, `scheduled`, `published`, `archived` |
| `titulo` | obrigatório, 8–140 caracteres |
| `slug` | único, gerado no servidor, estável após publicação |
| `resumo` | texto curto; gerar se vazio |
| `conteudo` | rich text sanitizado; obrigatório para publicar |
| `imagem_capa` | M2O arquivo; migrar de `imagem` com compatibilidade temporária |
| `imagem_capa_alt` | obrigatório quando informativa |
| `categoria` | M2O; Editor escolhe, não administra |
| `fonte_nome`, `fonte_url` | condicionais; URL HTTPS validada |
| `youtube_url` | opcional, formato/ID validado |
| `publicar_em` | obrigatório se `scheduled` |
| `publicado_em` | somente servidor |
| `fixado_banner` | somente Editor-chefe/Admin; máximo de um |
| `autor` | M2O `directus_users`, preset `$CURRENT_USER`, somente leitura |
| `date_created`, `date_updated`, `user_created`, `user_updated` | auditoria do Directus |

Criar `posts_galeria`:

- `post_id` M2O;
- `arquivo_id` M2O `directus_files`;
- `ordem`;
- `legenda`;
- `credito`;
- `texto_alt`;
- constraint única `(post_id, arquivo_id)`;
- máximo de 20 itens validado no servidor.

Adicionar constraints únicas a `posts.slug` e `categorias.slug`.

### 6.3 Benefícios

Criar `pagina_beneficios` singleton com hero, CTAs, introduções, SEO, OG e blocos de confiança aprovados.

Criar `beneficios_categorias`:

- `id`, `status`, `ordem`, `nome`, `slug` único;
- nenhuma referência a Convenções/Documentos.

Criar `beneficios`:

- `status`, `ordem`, `destaque`;
- `titulo`, `slug` único, `resumo`, `descricao` sanitizada;
- `categoria`;
- `imagem`, `imagem_alt`;
- `quem_pode_usar`, `como_usar`, `o_que_levar`;
- `contato_texto`, `contato_href` com protocolos permitidos;
- `validade_inicio`, `validade_fim`;
- `aviso`;
- `responsavel_revisao`, `revisar_em`;
- campos de auditoria.

Criar somente se o conteúdo real justificar:

- `beneficios_passos`;
- `beneficios_faq`.

Regra pública: item publicado e dentro da validade; conteúdo expirado pode ser ocultado ou exibido como indisponível por decisão explícita, nunca como oferta ativa.

### 6.4 Jurídico público — manter essência e tornar editável

Manter e ampliar `pagina_juridico`:

- links configuráveis dos CTAs, com allowlist de destino;
- `hero_imagem`, `hero_imagem_alt`;
- bloco “como funciona”;
- critérios/quem pode usar;
- aviso de urgência e de que o canal não interrompe prazo legal;
- prazo de retorno somente se aprovado;
- canais/telefone/WhatsApp;
- confiança/qualificações apenas com evidência;
- resumo de privacidade e link da política;
- `seo_titulo`, `seo_descricao`, `og_imagem`;
- CTA final.

Manter `juridico_direitos`, `juridico_plantoes` e `juridico_faq`, adicionando:

- `slug` ou `chave` única e estável para seed/migração;
- `date_updated`, `user_updated`;
- validações de comprimento;
- links somente quando tiverem destino real aprovado.

Transformar `juridico_campos_formulario` em configuração efetiva e versionada:

- `chave` única por versão;
- `versao`;
- `status` da versão;
- `etapa` (`triagem_inicial` ou `complementacao`);
- `tipo` por allowlist;
- `rotulo`, `ajuda`, `placeholder`;
- `obrigatorio`, `max_length`, `opcoes` estruturadas;
- `finalidade_texto`;
- `sensibilidade`;
- `retencao_dias` aprovada;
- `editavel_pelo_juridico`;
- `ordem`.

Campos essenciais não podem ser removidos/renomeados livremente pelo editor. A interface Jurídico pode ajustar microcopy, ordem e opções permitidas; alterações estruturais em coleta, obrigatoriedade, finalidade ou retenção exigem versão nova e aprovação de privacidade. O chamado registra a versão apresentada.

Na triagem inicial, a recomendação técnica é:

- nome;
- um canal de retorno;
- categoria/assunto;
- descrição curta;
- aviso de privacidade e versão.

CPF e anexo ficam em etapa posterior ou opcionais, salvo decisão documentada do responsável Jurídico/privacidade.

### 6.5 Chamados jurídicos privados

Evoluir `chamados_juridicos` preservando todos os registros e IDs:

- manter dados existentes durante migração;
- adicionar `responsavel` M2O `directus_users`;
- adicionar `prioridade` com valores controlados;
- adicionar `origem` controlada, sem URL contendo PII;
- adicionar `formulario_versao`;
- adicionar `aviso_privacidade_versao` e `aviso_apresentado_em`;
- adicionar `retencao_ate`, `anonimizado_em` e estado de retenção;
- separar CPF em campo opcional e protegido;
- impedir delete ao Jurídico; encerrar/anonimizar conforme política;
- não retornar CPF completo em listas.

Criar `chamados_juridicos_eventos` append-only:

- chamado;
- tipo do evento;
- status anterior/novo;
- ator;
- data;
- nota operacional mínima, sem duplicar descrição sensível;
- identificador de envio de e-mail, sem corpo completo no log.

Criar `chamados_juridicos_anexos` em vez de depender de um único UUID solto:

- chamado;
- arquivo;
- categoria;
- data de envio;
- `scan_status`: `quarantine`, `clean`, `blocked`;
- hash para integridade;
- nome de exibição sanitizado;
- quem liberou/quando;
- sem delete para atendente comum.

Anexos ficam exclusivamente em `Juridico-privado/Anexos-de-chamados`, sem leitura pública e sem URL persistente. Download ocorre por ID do chamado e ID da relação, nunca por ID arbitrário do arquivo.

### 6.6 Usuários e Policies

Não criar tabela própria de usuários. Manter `directus_users`, roles, policies, sessões e Activity Log como fonte oficial.

O painel simplificado pode guardar somente metadados adicionais não oferecidos pelo Directus, como pedido/aprovação de acesso, em coleção separada e auditada; senha, MFA, status e papel continuam no Directus.

### 6.7 Remoção segura de Convenções/Documentos

Executar em três estágios:

1. **Congelar e inventariar:** bloquear criação/edição, remover leitura pública, contar itens/relações/arquivos e exportar em backup restaurável.
2. **Retirar do produto:** remover rota, sitemap, navegação, consultas, tipos, seeds, permissões e documentação ativa; definir 301/410 conforme tráfego real.
3. **Remover dados:** somente após aprovação do inventário e ensaio de restauração, excluir relações/coleção em migração explícita com flag destrutiva e registro de auditoria.

Não executar `DROP` ou `DELETE` automaticamente no bootstrap cotidiano.

## 7. Proposta de bootstrap/migração idempotente

### 7.1 Estrutura recomendada

Separar responsabilidades:

```text
scripts/directus/
├── manifest/
│   ├── collections.mjs
│   ├── fields.mjs
│   ├── relations.mjs
│   ├── roles-policies.mjs
│   ├── folders.mjs
│   └── presets.mjs
├── migrations/
│   ├── 001-baseline.mjs
│   ├── 002-noticias-editorial.mjs
│   ├── 003-beneficios.mjs
│   ├── 004-juridico-seguranca.mjs
│   └── 005-remover-documentos.mjs
├── reconcile.mjs
├── verify.mjs
└── seed-demo.mjs
```

### 7.2 Comportamento obrigatório do reconciliador

1. autenticar com identidade de migração usada apenas na janela de deploy;
2. ler versão, collections, fields, relations, roles, policies, permissions, folders e presets;
3. calcular diff e oferecer `--dry-run` sem mutação;
4. criar ausentes;
5. atualizar `meta` e `schema` permitidos de campos existentes;
6. reconciliar cada permissão pela chave `(policy_id, collection, action)`;
7. sempre atualizar `permissions`, `validation`, `presets` e `fields` — nunca `SKIP` cego;
8. remover duplicatas e permissões não desejadas somente em modo de migração aprovado;
9. usar IDs estáveis para roles/policies/folders em vez de regex por nome;
10. validar constraints e relações depois da escrita;
11. executar novamente e exigir diff vazio;
12. produzir resumo sem segredos nem conteúdo pessoal;
13. falhar se detectar Policy pública com `fields=['*']`, filtro vazio em coleção com rascunho ou acesso a pasta privada;
14. não apagar coleção/itens em execução normal;
15. exigir backup verificado antes de migração destrutiva.

Como as chamadas REST não formam uma transação única, cada passo deve ser retomável. A migração grava checkpoint apenas depois da verificação da etapa; falha parcial não pode marcar sucesso.

### 7.3 Verificação pós-migração

O comando `verify.mjs` deve falhar se:

- Convenções/Documentos ainda estiver visível ou com permissões;
- houver permissão pública sem filtro em coleção com status;
- `directus_files` público incluir pasta privada;
- Editor/Social/Benefícios puderem ler chamados;
- qualquer papel comum puder escrever em roles, policies, users ou schema;
- qualquer papel editorial possuir delete não aprovado;
- slugs não forem únicos;
- `posts` ou Benefícios não possuírem os campos mínimos;
- a segunda execução do reconciliador produzir diff.

## 8. Roles e Policies-alvo

Directus 11 agrega Policies anexadas a papéis/usuários. Usar policies pequenas por capacidade reduz duplicação e permite auditar o acesso efetivo.

| Papel | Policies/capacidades | Negações essenciais |
|---|---|---|
| Público | ler campos explícitos de conteúdo publicado e assets de pastas públicas | rascunhos, chamados, anexos, usuários, segredos, create/update/delete |
| Editor | notícia própria/permitida; upload em `Editorial` | delete, banner, categorias, Jurídico, Benefícios, Social, usuários |
| Editor-chefe | todas as notícias; publicar/agendar/arquivar; banner/categorias controlados | delete por padrão, Jurídico privado, usuários/policies |
| Benefícios | `pagina_beneficios`, benefícios/categorias/passos/FAQ e pasta `Benefícios` | notícias, Jurídico, Social, usuários |
| Jurídico | conteúdo público jurídico e atendimento de chamados; pasta privada aprovada | notícias, Benefícios, Social, usuários/policies |
| Social | `posts_sociais`, módulos sociais e pasta `Social` | notícias gerais salvo leitura pública, Jurídico, usuários, outros arquivos |
| Gestor de acessos | painel de convites/status/funções permitidas via operação controlada | acesso livre a system collections, Admin/Gestor, autoelevação, própria suspensão |
| Admin técnico | schema, settings, policies e incidentes | conta individual, MFA e auditoria obrigatórios |
| Serviço de triagem | criar chamado/evento e upload em quarentena | ler chamados, baixar arquivos, usuários, schema, outros conteúdos |

### 8.1 Policy pública

- `posts.read`: `status=published` e `publicado_em <= $NOW`, campos explícitos;
- Benefícios: `status=published` e janela de validade válida;
- Jurídico público: somente singleton/campos e itens `published`;
- categorias/configurações: somente campos usados pelo site;
- `directus_files.read`: IDs de pastas públicas explícitas e campos mínimos;
- nenhum acesso a `chamados_juridicos`, eventos, anexos, usuários ou segredos;
- formulários escrevem por endpoints de aplicação com rate limit; não por permissão pública irrestrita no Directus.

### 8.2 Arquivos

Pastas com IDs estáveis:

```text
Editorial/Capas
Editorial/Galerias
Editorial/Rascunhos-privados
Benefícios/Imagens-públicas
Social/Publicações
Sistema/Logos-e-configuração
Juridico-privado/Quarentena
Juridico-privado/Anexos-de-chamados
```

Leitura pública apenas em Capas, Galerias, Imagens-públicas, Publicações aprovadas e Logos. `Rascunhos-privados`, Quarentena e Anexos nunca entram na Policy pública.

### 8.3 Gestão de acessos

A documentação oficial alerta que escrita em users/roles/policies permite elevação. A opção preferida é uma operação de servidor/extension auditada que:

- revalida o ator e reautenticação recente;
- aceita apenas IDs de roles comuns em allowlist;
- usa convite de uso único;
- impede alterar o próprio papel/status;
- impede modificar Admin/Gestor;
- protege o último Admin ativo;
- revoga sessões ao suspender;
- registra ator, alvo e resultado.

Não expor construtor de Policy no painel simplificado.

MFA obrigatório para Admin técnico, Gestor, Editor-chefe e Jurídico; recomendado para os demais. A aplicação deve negar acesso ao módulo antes de consultar dados se a Policy/capacidade não for compatível.

## 9. Seeds de demonstração

### 9.1 Regras

- seed é opt-in com `DEMO_SEED=true` e proibido quando `NODE_ENV=production`;
- não usa CPF, telefone, e-mail, nome, endereço, caso jurídico ou credencial reais;
- não usa APIs externas de imagens; usar assets locais aprovados ou deixar imagem nula;
- não cria Convenções, Documentos, acordos, atas ou editais;
- não sobrescreve conteúdo editado sem `DEMO_SEED_FORCE=true`;
- usa slugs/chaves únicas estáveis e upsert;
- segunda execução mantém as mesmas contagens;
- todo item demo recebe `demo=true` oculto ou prefixo/metadado inequívoco em homologação;
- demo nunca é promovida automaticamente para produção.

### 9.2 Conteúdo sugerido

Notícias fictícias para homologação:

1. `[DEMO] Assembleia define calendário de mobilização`;
2. `[DEMO] Orientações de saúde e segurança no trabalho`;
3. `[DEMO] Plantão jurídico terá horário ampliado`;
4. `[DEMO] Curso de formação abre inscrições`;
5. `[DEMO] Novo benefício de bem-estar disponível para associados`.

Cada cenário deve cobrir:

- rascunho;
- agendado;
- publicado;
- capa/alt;
- galeria de três arquivos locais;
- fonte externa fictícia em domínio reservado;
- notícia sem vídeo e com vídeo de teste permitido.

Benefícios fictícios:

- pelo menos um ativo;
- um futuro;
- um expirado;
- categorias diferentes;
- elegibilidade e CTA claros;
- nenhuma marca, percentual ou condição apresentados como reais.

Jurídico público:

- singleton completo;
- quatro situações de ajuda;
- um plantão explicitamente marcado como demonstração;
- FAQ;
- aviso de urgência/privacidade de homologação.

Não popular chamados jurídicos no seed comum. Testes de integração podem criar um chamado sintético em banco efêmero e apagá-lo junto com o ambiente, sem reutilizar dados em screenshots, analytics ou logs.

## 10. Plano de testes

### 10.1 Schema e idempotência

- aplicar em Directus vazio;
- comparar schema ao manifesto;
- executar novamente e exigir diff zero;
- simular campo/Policy alterado e comprovar correção ou falha explícita;
- comprovar constraints únicas;
- comprovar que migração parcial é retomável;
- bloquear migração destrutiva sem backup/flag;
- snapshot antes/depois sem segredos.

### 10.2 RBAC automatizado

Para cada papel, criar conta efêmera e testar allow/deny:

- anônimo lê notícia publicada;
- anônimo não lê rascunho nem item agendado futuro;
- anônimo recebe 403/404 em asset privado;
- Editor cria/edita notícia permitida;
- Editor não exclui, não fixa banner e não administra categoria;
- Editor não lê chamados, anexos, newsletter, contato ou usuários;
- Editor-chefe publica e agenda;
- Benefícios acessa apenas suas coleções/pasta;
- Social não altera `posts` e não acessa arquivos de outras pastas;
- Jurídico edita conteúdo público e atende chamado permitido;
- Jurídico não altera schema/policies/usuários;
- Gestor convida papel permitido, mas não Admin/Gestor nem a si mesmo;
- suspensão invalida sessão aberta;
- serviço de triagem cria, mas não lê chamado.

Testar acesso tanto via SDK quanto por REST direto para impedir que a UI mascare falha do backend.

### 10.3 Notícias

- slug gerado, normalizado, único e estável;
- publicação sem título/conteúdo/capa/alt falha;
- draft aceita incompletude prevista;
- agendamento no passado falha;
- publicação grava `publicado_em` uma vez;
- máximo de uma notícia fixada;
- galeria limita 20, ordena e não duplica arquivo;
- HTML malicioso é neutralizado;
- RSS, sitemap, home e detalhe nunca exibem draft/futuro.

### 10.4 Benefícios

- ativo aparece;
- futuro não aparece antes da data;
- expirado não aparece como oferta ativa;
- CTA aceita somente protocolos/destinos aprovados;
- categoria/ordem funcionam;
- fallback e estado vazio são compreensíveis;
- editor de Benefícios não precisa editar HTML para tarefa principal;
- eventos de analytics não incluem PII nem conteúdo livre.

### 10.5 Jurídico

- conteúdo público editado aparece sem alterar a estrutura essencial;
- editor não consegue remover campo essencial sem nova versão/aprovação;
- chamado registra versão do formulário/aviso;
- CPF/anexo obedecem à decisão de minimização;
- rate limit e honeypot não bloqueiam usuário legítimo;
- MIME falso, arquivo grande e conteúdo malicioso são bloqueados/quarentenados;
- arquivo em quarentena não abre;
- anônimo/Editor/Social/Benefícios não leem chamado ou anexo;
- usuário Jurídico só baixa arquivo vinculado ao chamado autorizado;
- resposta/e-mail é idempotente e não duplica envio;
- falha SMTP mantém estado recuperável;
- retenção anonimiza/remove no prazo aprovado;
- logs e URLs não contêm dados do caso.

### 10.6 Usuários

- convite válido, expirado e reutilizado;
- recuperação de senha;
- exigência de MFA por papel;
- mudança apenas entre funções autorizadas;
- proibição de autoelevação/autossuspensão;
- proteção do último Admin;
- suspensão e revogação de sessões/tokens;
- autoria histórica preservada;
- Activity Log mostra ator/alvo/horário/resultado;
- CSRF presente em todas as mutações do painel.

### 10.7 Seeds

- execução sem `DEMO_SEED` não cria nada;
- produção rejeita seed;
- duas execuções mantêm contagens;
- zero chamada de rede para criar mídia;
- zero `documentos`/`convencoes`;
- zero dado real ou credencial;
- itens ativo/futuro/expirado cobrem os filtros.

### 10.8 Recuperação

Após o seed de homologação:

1. registrar contagens de notícias, usuários, benefícios, chamados e arquivos;
2. fazer backup consistente de banco e uploads públicos/privados;
3. restaurar em ambiente vazio;
4. repetir testes RBAC;
5. confirmar mesmas contagens, relações, status, roles e privacidade dos assets.

## 11. Ordem segura de implementação

1. subir clone isolado do Directus e inventariar a base; não usar dados reais em desenvolvimento;
2. fixar versão/digest e comprovar backup/restauração;
3. criar o reconciliador e testes de drift;
4. fechar imediatamente Policy pública e arquivos;
5. criar pastas e identidade de serviço mínima;
6. criar roles/policies por capacidade e rodar testes negativos;
7. migrar Notícias e suas relações sem apagar itens;
8. criar Benefícios estruturado e compatibilidade temporária com `paginas.beneficios`;
9. ampliar as coleções jurídicas existentes, preservar chamados e colocar anexos em pasta privada/quarentena;
10. fazer `juridico_campos_formulario` realmente governar o formulário, com campos essenciais protegidos;
11. implementar convite/status/MFA/revogação com guardrails;
12. aplicar seed somente em homologação e executar E2E/RBAC;
13. exportar e retirar Convenções/Documentos do produto;
14. remover fisicamente `documentos` somente após aceite e restauração testada;
15. promover o mesmo digest validado, sem seed demo, e observar auditoria/erros.

## 12. Critérios de aceite desta frente

- zero leitura pública de draft, arquivo privado ou campo não declarado;
- zero papel comum com acesso a chamados/anexos jurídicos;
- Editor, Benefícios, Jurídico e Social enxergam somente seu trabalho;
- nenhum papel editorial possui delete físico por padrão;
- aplicação pública não usa credencial de Admin técnico;
- Benefícios possui modelo estruturado e filtro de validade;
- Jurídico continua com hero, situações, plantão, triagem, FAQ, chamados, anexos e respostas, agora com conteúdo público editável e dados privados isolados;
- campos essenciais do Jurídico não podem ser removidos por erro editorial;
- CPF/anexo/retenção têm decisão aprovada antes de dados reais;
- Convenções/Documentos não aparece em schema ativo, rota, sitemap, seed, tipos, consulta, menu ou documentação operacional;
- bootstrap roda duas vezes sem diff;
- testes RBAC positivos e negativos passam em Directus efêmero;
- seed é determinístico, opt-in, sem rede e sem dados reais;
- backup restaurado conserva relações, usuários, Policies e privacidade.

## 13. Fontes técnicas usadas

Fontes locais principais:

- `scripts/directus-schema.mjs`;
- `scripts/setup-juridico.mjs`;
- `scripts/setup-configuracoes.mjs`;
- `scripts/setup-directus-social.mjs`;
- `scripts/directus-atualizar-juridico.mjs`;
- `scripts/directus-atualizar-paginas.mjs`;
- `scripts/directus-conteudo-exemplo.mjs`;
- `site/src/lib/directus.ts`;
- `site/src/lib/juridico.ts`;
- `site/src/lib/auth.ts`;
- `site/src/lib/tipos.ts`;
- APIs e páginas Astro em `site/src/pages`;
- `docs/superpowers/plans/2026-07-21-plano-mestre-validado-docker-ux.md`.

Documentação oficial do Directus consultada via Context7:

- Access Control / Permissions: filtros de item, campos, validações e presets;
- Directus 11: Policies agregadas a roles e usuários;
- Creating Users: convite e estado `invited`;
- Security Best Practices: risco de elevação ao escrever em users/roles/policies;
- Files & Assets: assets protegidos dependem das permissões de `directus_files`.

Esta revisão é técnica e de produto; não substitui parecer jurídico sobre base legal, aviso, retenção ou tratamento de dados pessoais.
