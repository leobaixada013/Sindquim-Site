# Revisão de frontend e UX — Portal Sindquim

Data da revisão: 21/07/2026  
Escopo: Astro público, painel administrativo customizado, sistema visual, Notícias, Benefícios e Jurídico.  
Regra desta revisão: somente leitura do produto; nenhum código de aplicação foi alterado.

## 1. Parecer executivo

A estrutura Astro + Directus é adequada ao objetivo, e a área pública do Jurídico já possui uma boa base estrutural: hero, cards de direitos, plantões, formulário, FAQ e chamada final. Entretanto, o checkout atual ainda não pode ser tratado como uma base pronta para execução do plano porque o build falha, a página inicial contém texto corrompido, Benefícios é apenas uma página genérica e o painel customizado não oferece a experiência editorial simples pedida pelo usuário.

O caminho recomendado é preservar a arquitetura e reconstruir as superfícies editoriais dentro do Astro. Directus continua sendo armazenamento, permissões, arquivos e histórico; o editor não deve precisar conhecer termos como “slug”, “headless”, “API” ou o Studio do Directus para executar tarefas comuns.

Antes de qualquer população de conteúdo, há quatro bloqueios:

1. corrigir o build e repetir toda a suíte;
2. eliminar completamente o módulo editorial de Convenções/Documentos/Editais/Acordos;
3. tornar dados demonstrativos inequivocamente fictícios e impedir que sejam confundidos com informação sindical real;
4. separar edição do conteúdo jurídico do acesso aos chamados sensíveis.

Não foi possível produzir uma auditoria visual com screenshots nesta revisão: `npm run build` falhou antes de gerar uma aplicação executável. Os achados visuais abaixo são, portanto, uma inspeção de código e devem ser confirmados no navegador depois do Gate 0.

## 2. Evidência de build e testes

| Verificação | Resultado | Consequência |
|---|---|---|
| `npm test` | 3 arquivos e 17 testes aprovados | Os testes existentes cobrem formatação, YouTube e deploy, mas não cobrem os fluxos públicos ou administrativos desta revisão. |
| `npm run build` | Falhou | O import de `src/pages/api/admin/noticias/salvar.ts:2` sobe um nível a mais que o necessário e não encontra `lib/auth`. |
| Dependência do sanitizador | Ausente | `src/pages/noticias/[slug].astro:7` importa `isomorphic-dompurify`, mas o pacote não consta em `package.json` ou na instalação direta. O próximo build tende a falhar nesse ponto depois do primeiro erro. |
| Auditoria visual/E2E | Bloqueada | Sem build válido e sem ambiente navegável estável, não há evidência visual aceitável nem teste ponta a ponta atual. |

O import do endpoint de notícias deve apontar para `../../../../lib/auth`. Depois dessa correção, o build deve ser repetido até chegar a zero erro; não se deve assumir que esse é o único bloqueio.

## 3. Mapa atual de páginas, componentes e dados

### 3.1 Site público

| Superfície | Implementação | Fonte de dados | Estado atual |
|---|---|---|---|
| Home `/` | `site/src/pages/index.astro` | posts, avisos e configurações | Estrutura completa, mas muitos textos fixos estão com mojibake (`matÃ©ria`, `notÃ­cias`, etc.). |
| Notícias `/noticias` | `site/src/pages/noticias/index.astro` + `NoticiaCard.astro` | `posts` | Listagem e paginação simples. Sem busca, filtros ou indicação de conteúdo demonstrativo. |
| Matéria `/noticias/[slug]` | `site/src/pages/noticias/[slug].astro` | `posts` | Tem Article JSON-LD e sanitização planejada, mas falta a dependência; não exibe fonte ou galeria. |
| Benefícios `/beneficios` | rota genérica `site/src/pages/[slug].astro` | item de `paginas` | Apenas título + HTML corrido. Não entrega a página bonita, pesquisável e estruturada solicitada. |
| Jurídico `/juridico` | `site/src/pages/juridico.astro` | singleton e quatro coleções jurídicas | Preserva hero, cards, plantões, formulário, FAQ e CTA. Parte do formulário é fixa no código. |
| Avisos `/avisos` | `site/src/pages/avisos.astro` | `avisos` | Página dedicada. |
| Convenções `/convencoes` | `site/src/pages/convencoes.astro` | `documentos` | Deve ser removida do produto. |
| Institucionais | `site/src/pages/[slug].astro` | `paginas` | Renderização genérica de HTML; precisa sanitização e lista de slugs permitidos. |
| Layout público | `site/src/layouts/Base.astro` | configurações e módulos | Cabeçalho, menu, rodapé, newsletter, skip link e animações. |

Componentes compartilhados relevantes:

- `NoticiaCard.astro`: imagem, metadados, título, resumo e link;
- `Estudio.astro`: conteúdo do YouTube;
- `VitrineSocial.astro`: conteúdo social;
- `Base.astro`: metadados, navegação, footer e comportamento global.

### 3.2 Painel Astro

| Superfície | Implementação | Estado atual |
|---|---|---|
| Login | `/admin/login` | Login funcional como porta única. |
| Dashboard | `/admin` | Painel geral. |
| Notícias | `/admin/noticias` e `/admin/noticias/[id]` | Lista sem estilos próprios completos; editor com título, status, slug, resumo, uma capa e corpo. |
| Benefícios | inexistente | O editor teria de recorrer ao Directus ou à coleção genérica `paginas`. |
| Jurídico | `/admin/juridico` | Administra somente chamados e respostas; não edita hero, cards, plantões, FAQ ou CTA. |
| Social | `/admin/social` | Fora do núcleo desta revisão. |
| Configurações/usuários | `/admin/settings` | Base para configurações e contas. |
| Layout | `site/src/layouts/AdminLayout.astro` | Sidebar, status técnico, usuário e shell escuro. |

### 3.3 Sistema visual

O público usa tokens em `site/src/styles/global.css`; o painel possui um segundo sistema em `site/src/styles/admin.css`. A direção de marca — navy, vermelho de ação, azul-aço, papel, Archivo e Source Serif — é coerente, mas `DESIGN.md` está desatualizado em relação ao código:

- a documentação diz Arial, enquanto o código usa Archivo e Source Serif;
- cores de neutros e raios diferem entre documentação e CSS;
- o painel usa raios de 16–24 px, glow, vidro e sombras muito mais intensos que o site público;
- componentes de notícias referenciam classes (`admin-table`, `status-badge`, `admin-button--small`) sem implementação global correspondente;
- cards jurídicos combinam borda e sombra, contrariando a própria regra “No Double-Depth” documentada.

Antes de ampliar o painel, deve existir uma única tabela de tokens semânticos — fundo, superfície, texto, texto secundário, ação, perigo, sucesso, foco, borda, raio e sombra — com variações pública e administrativa explicitamente derivadas da mesma marca.

## 4. Achados priorizados

### P0 — bloqueiam execução confiável

1. **Build quebrado.** Evidência: `site/src/pages/api/admin/noticias/salvar.ts:2` e import ausente de `isomorphic-dompurify` em `site/src/pages/noticias/[slug].astro:7`.
2. **Home com texto ilegível.** Evidência: `site/src/pages/index.astro:58-170`. Isso aparece exatamente nas áreas de maior visibilidade: hero, notícias, atalhos e CTA.
3. **Dependência crítica do editor vem de CDN.** `site/src/pages/admin/noticias/[id].astro:95-105` carrega Quill de `cdn.jsdelivr.net`. Sem internet, com CSP estrita ou indisponibilidade do terceiro, o corpo fica sem editor e a publicação não pode ser concluída. O editor deve ser empacotado e fixado no lockfile.
4. **Benefícios não tem experiência própria.** A rota genérica aceita apenas HTML corrido e usa `set:html` sem sanitização em `site/src/pages/[slug].astro:21`.
5. **Convenções/Documentos ainda atravessam todo o sistema.** Há rota, menu, sitemap, tipos, consulta, schema, permissão pública, conteúdo de exemplo e documentação. Não basta esconder o link.
6. **Conteúdo jurídico e chamados não têm separação de privilégio na interface.** Qualquer usuário que veja “Jurídico” no menu é conduzido à tela com chamados e dados pessoais; não há uma rota segura apenas para editar conteúdo público.
7. **Script de demonstração busca imagens em uma API externa.** `scripts/directus-conteudo-exemplo.mjs:42-50` usa Picsum. Isso conflita com a regra do projeto de não criar mídia por API e torna a população não determinística.

### P1 — necessários para a experiência “qualquer pessoa consegue publicar”

1. **O editor expõe termos técnicos.** “Status”, “Slug (URL amigável)” e IDs de arquivos aumentam a carga cognitiva. O slug deve ser automático e ficar em “Opções avançadas”.
2. **A ação principal contradiz o estado.** Uma notícia nova nasce com “Rascunho” selecionado, mas o botão diz “Publicar Notícia” (`site/src/pages/admin/noticias/[id].astro:47-51` e `:87-89`). Devem existir ações separadas: “Salvar rascunho” e “Publicar”.
3. **Faltam recursos já solicitados.** O modelo `Post` e o schema não oferecem legenda/texto alternativo da capa, crédito, fonte, galeria, data de publicação ou agendamento.
4. **Preview de capa quebra no Docker.** A tela usa `http://localhost:8055/assets/...` em `site/src/pages/admin/noticias/[id].astro:71`; o navegador do usuário não está dentro do container. Deve usar URL pública configurada ou proxy autenticado.
5. **Lista de notícias não escala nem se adapta.** Só carrega 50 itens, não tem busca/filtro/paginação e usa tabela sem CSS global próprio. Em celular, cada notícia deve virar card com título, status, data e ação principal.
6. **Nenhum preview editorial.** Editor não consegue conferir como capa, título, resumo, corpo, fonte e galeria ficarão no celular antes da publicação.
7. **Sem proteção contra perda.** Não há aviso de alterações não salvas, salvamento de rascunho automático ou recuperação após falha de rede.
8. **Feedback de validação é genérico.** O corpo vazio usa `alert()`, e erros não são associados ao campo. É necessário resumo de erros com foco e mensagens ao lado do campo.
9. **Campos jurídicos “dinâmicos” não são utilizados.** A documentação e `getJuridicoCamposFormulario()` sugerem configuração dinâmica, mas `site/src/pages/juridico.astro` não chama essa função; o formulário está fixo no template.
10. **Página institucional injeta HTML bruto.** O mesmo pipeline de sanitização e validação de links usado nas matérias deve ser aplicado a Benefícios e demais páginas editáveis.

### P1 — acessibilidade e uso em celular

1. **Painel não possui skip link.** `AdminLayout.astro` deveria permitir pular navegação e focar o conteúdo principal.
2. **Menu mobile público é decidido apenas no carregamento.** Em `Base.astro:154-163`, a troca de orientação/redimensionamento não sincroniza `hidden` e `aria-expanded`; também faltam Escape, clique fora e retorno de foco.
3. **Conteúdo depende de JavaScript para ficar visível.** `.reveal` nasce com `opacity: 0`; se o script falhar ou estiver bloqueado, seções inteiras podem permanecer invisíveis. O estado base deve ser visível, com animação habilitada apenas após uma classe de JS.
4. **Modal jurídico não gerencia foco.** Há fechamento por Escape, mas falta mover foco ao abrir, prender Tab dentro do diálogo e restaurar foco no botão que o abriu.
5. **Formulário jurídico perde contexto após erro.** O redirect volta apenas com `?chamado=erro`; dados preenchidos somem e o erro não indica qual campo falhou. Para uma demanda sensível e longa, isso é uma falha grave de usabilidade.
6. **Imagens editoriais não possuem alternativa editável.** `NoticiaCard.astro:18` e a capa do artigo deixam `alt=""`. Em cards isso pode ser decorativo, mas a matéria precisa permitir descrição quando a imagem transmite informação.
7. **Contraste do botão principal do painel é inconsistente.** Branco sobre `#4580ac` mede cerca de 4,25:1 e sobre o fim claro `#6bb6ea` cerca de 2,21:1; o gradiente não mantém 4,5:1 para texto normal.
8. **Painel é visualmente pesado.** Múltiplos `backdrop-filter`, glows, sombras grandes e títulos de até 4 rem aumentam ruído e custo de renderização em celulares simples. Para a tarefa editorial, a superfície deve ser mais plana, clara e previsível.
9. **Navegação administrativa não é filtrada por capacidade.** Todos veem os mesmos itens. Além de segurança, isso produz becos sem saída quando um papel não tem permissão no Directus.

### P2 — qualidade e consistência

1. O menu público possui itens demais para uma navegação mobile simples; após remover Convenções, deve priorizar Notícias, Benefícios, Jurídico, Filie-se e Contato, deixando itens secundários em “Mais” somente se necessário.
2. `aria-current` usa igualdade exata; ao editar uma notícia, “Notícias” não permanece marcado no painel. Use correspondência por prefixo controlado.
3. O painel mostra textos técnicos como “Directus Headless”, “API invisível” e “sessão segura”. Para o editor comum, substituir por mensagens de tarefa: “Portal funcionando”, “Conteúdo do site” e “Sua conta”.
4. O placeholder com emoji de jornal é aceitável apenas como estado técnico temporário; conteúdo publicado deve exigir capa ou usar uma composição de marca local estável.
5. A data pública usa `date_created`; edições, agendamento e importações exigem `data_publicacao` separada.
6. O artigo tem dados estruturados básicos, mas deve acrescentar `dateModified`, autor/editor institucional, crédito de imagem e fonte quando existirem.

## 5. Remoção completa de Convenções/Documentos

“Documentos” nesta decisão significa o antigo módulo editorial público de convenções, acordos, atas e editais. O anexo privado de um chamado jurídico é outra funcionalidade e deve permanecer, preferencialmente com o nome “anexo de apoio”.

A remoção deve incluir:

1. retirar `Convenções` de `site/src/lib/constantes.ts`;
2. remover `/convencoes` de `site/src/pages/sitemap.xml.ts`;
3. remover a página `site/src/pages/convencoes.astro`;
4. remover `Documento` e `SchemaDirectus.documentos` de `site/src/lib/tipos.ts`;
5. remover `getDocumentos()` e o import de `Documento` de `site/src/lib/directus.ts`;
6. retirar a coleção `documentos` e sua leitura pública de `scripts/directus-schema.mjs`;
7. retirar a população de documentos e qualquer aviso/link para edital de `scripts/directus-conteudo-exemplo.mjs`;
8. eliminar o módulo da documentação operacional e atualizar `PRODUCT.md`, que ainda cita links de documentos;
9. remover referências públicas a convenções/acordos da home, textos institucionais e FAQ jurídico quando elas descrevem conteúdo que o site não oferecerá;
10. bloquear `convencoes`, `documentos`, `acordos` e `editais` como slugs da coleção genérica `paginas`, para impedir que o conteúdo reapareça pela rota `[slug]`;
11. criar redirect permanente de `/convencoes` para uma rota útil, como `/noticias`, sem renderizar o conteúdo antigo;
12. antes de remover a coleção do banco, gerar backup, revogar acesso público, validar ausência de consumidores e só então arquivar ou excluir a estrutura.

Não se deve apagar anexos jurídicos, pois eles pertencem ao fluxo privado de atendimento e são parte da essência que o usuário pediu para manter.

## 6. Experiência proposta para Notícias

### 6.1 Modelo de conteúdo

Campos mínimos para o editor:

- título;
- resumo curto;
- imagem de capa;
- texto alternativo da capa;
- corpo;
- galeria ordenável;
- fonte: nome e URL, repetível quando necessário;
- categoria;
- data/hora de publicação;
- destaque na home;
- status: rascunho, agendado, publicado ou arquivado.

Metadados técnicos automáticos:

- slug;
- usuário criador e último editor;
- datas de criação/alteração;
- versão;
- dimensões, tipo e tamanho dos arquivos.

### 6.2 Fluxo editorial

Uma única página, em coluna, com linguagem comum:

1. **Escolha a capa** — tocar para fotografar ou escolher arquivo, recortar, substituir e preencher descrição da imagem;
2. **Conte a notícia** — título, frase de resumo e editor visual com toolbar mínima;
3. **Complete se precisar** — galeria, fontes, categoria, agendamento e destaque ficam em uma área opcional;
4. **Confira** — preview de celular/desktop usando a mesma renderização pública;
5. **Salve ou publique** — “Salvar rascunho” sempre seguro; “Publicar agora” abre uma confirmação resumida.

O slug não deve aparecer no fluxo comum. “Arquivar” e outras ações destrutivas ficam em menu secundário, com confirmação. Após publicação, exibir o link público e as ações “Ver notícia” e “Copiar link”.

### 6.3 Critérios de simplicidade

- no máximo cinco decisões obrigatórias para publicar uma matéria básica;
- um adulto com baixa familiaridade digital conclui a primeira publicação em até três minutos sem treinamento;
- nenhum termo técnico é necessário para completar a tarefa;
- falha de rede não apaga o texto;
- botão nunca diz “Publicar” se a operação apenas salvará rascunho;
- upload informa progresso, formatos aceitos, tamanho e como corrigir o erro;
- teste de usabilidade feito com adultos de baixa alfabetização digital, sem coletar dados de crianças.

## 7. Página e painel de Benefícios

Benefícios deve deixar de usar a página genérica. A solução recomendada é uma rota dedicada `beneficios.astro`, um singleton de configuração e uma coleção de itens.

### 7.1 Estrutura pública

1. hero curto com promessa clara e CTA de contato;
2. explicação de quem pode usar os benefícios;
3. filtros acessíveis por categoria (Todos, Saúde, Educação, Bem-estar e Serviços);
4. cards com nome, categoria, vantagem resumida, público elegível e ação “Como usar”;
5. detalhes com descrição, requisitos, validade e canal oficial;
6. aviso de que condições precisam ser confirmadas com o sindicato;
7. CTA final para filiação ou atendimento.

O desenho deve reutilizar os tokens e componentes existentes. Não depende de novas imagens: pode funcionar com tipografia, siglas e cores da marca. Imagens reais só entram depois por upload autorizado, nunca por API visual.

### 7.2 Modelo Directus

`pagina_beneficios` (singleton): textos do hero, introdução, aviso e CTA.  
`beneficios`: status, ordem, nome, categoria, resumo, detalhes, elegibilidade, instruções, requisitos, validade, telefone/URL oficial, imagem opcional, texto alternativo e flag `destaque`.

### 7.3 Painel

Criar `/admin/beneficios` com:

- lista em cards, busca e filtros;
- reordenação simples;
- ação evidente “Novo benefício”;
- formulário curto, com preview;
- ativar/desativar sem excluir;
- aviso de validade vencida;
- histórico de alterações;
- permissões separadas para editar e publicar.

Não reutilizar o WYSIWYG genérico como única interface: ele não garante cards consistentes, filtros, validade nem clareza de uso.

## 8. Jurídico editável sem perder sua essência

### 8.1 Invariantes que permanecem em código

- sequência hero → cards de direitos → plantão/triagem → formulário → FAQ → CTA;
- âncoras `#direitos` e `#agendamento`;
- componentes, grid responsivo, semântica e estilos principais;
- endpoint e validações do formulário;
- campos estruturais de identificação, contato, tipo, descrição e anexo;
- privacidade, limite/tipos do anexo, proteção antispam e mensagens LGPD;
- painel de chamados, resposta, anexo privado e estados de atendimento.

Esses elementos não devem ser substituídos por HTML livre.

### 8.2 O que pode ser editado

- rótulo, título, resumo e texto dos botões do hero;
- título da seção e cards de direitos, incluindo ordem, destaque e ativação;
- locais, horários e observações dos plantões;
- texto introdutório do formulário;
- rótulos, ajuda e opções do campo “tipo de demanda”, sem mudar chaves internas;
- perguntas e respostas do FAQ;
- texto e link do CTA final;
- estado rascunho/publicado de cada grupo.

Textos jurídicos publicados devem exigir revisão de um papel autorizado. O editor comum pode salvar rascunho, mas não publicar orientação jurídica.

### 8.3 Separação segura do painel

Preservar a tela atual de chamados em `/admin/juridico/chamados` e criar `/admin/juridico/conteudo`. O item de navegação pode abrir uma página inicial com duas ações, mas cada papel vê apenas o que sua capacidade permite:

- **Editor de conteúdo jurídico:** edita página, cards, plantões e FAQ; nunca vê CPF, e-mail, telefone, descrição ou anexos;
- **Atendimento jurídico:** vê e responde chamados; não publica conteúdo institucional;
- **Revisor jurídico:** revisa e publica textos;
- **Administrador:** configura os papéis, sem tornar o acesso sensível implícito.

A tela de conteúdo deve ter abas “Apresentação”, “Direitos”, “Plantões”, “Formulário”, “Perguntas” e “Chamada final”, com preview ao lado ou em nova guia. A tela de chamados existente continua funcional, mas recebe busca, filtro de status, paginação, foco correto no modal e layout de cards no celular.

### 8.4 Publicação cautelosa

1. salvar cada edição como rascunho;
2. validar limites, URLs, itens mínimos e opções do formulário no servidor;
3. mostrar preview usando dados de rascunho apenas ao usuário autenticado;
4. exigir revisão para publicar;
5. publicar o conjunto de forma atômica;
6. invalidar cache de conteúdo;
7. registrar usuário, horário e antes/depois;
8. oferecer restauração da versão anterior.

## 9. Conteúdo demonstrativo permitido

Todo conteúdo criado automaticamente deve conter `is_demo = true` e ser claramente marcado no painel e no site de staging com “CONTEÚDO DEMONSTRATIVO — informação fictícia”. A produção só pode receber esses itens se existir um banner global de demonstração; o caminho preferido é mantê-los restritos a staging.

Conjunto seguro sugerido:

### Notícias

- “Conteúdo demonstrativo — Conheça o novo Portal Sindquim”;
- “Conteúdo demonstrativo — Como uma notícia aparece no celular”;
- “Conteúdo demonstrativo — Confira os canais de atendimento do portal”.

Os textos explicam recursos do próprio ambiente; não anunciam assembleias, reajustes, prazos, normas, empresas ou decisões reais.

### Benefícios

- “Benefício Saúde — exemplo de layout”;
- “Benefício Educação — exemplo de layout”;
- “Benefício Bem-estar — exemplo de layout”.

Usar condições explicitamente fictícias, sem marcas, percentuais, validade ou canais que pareçam reais.

### Jurídico

- preencher hero, cards e FAQ com textos gerais já revisáveis;
- não apresentar conselho jurídico individual;
- nunca criar chamados de demonstração, CPF, e-mail, telefone, anexos ou nomes de pessoas;
- incluir aviso de que o conteúdo de staging não substitui orientação profissional.

### Mídia

- reutilizar apenas assets locais autorizados do repositório;
- quando não houver imagem apropriada, manter o estado sem imagem com tratamento de marca;
- proibir Picsum, ImageGen, scraping, importação por URL ou qualquer API externa de mídia.

O seed deve ser idempotente, aceitar `DEMO_CONTENT=true`, recusar execução acidental em produção sem uma confirmação explícita e oferecer uma rotina que remova somente registros `is_demo`.

## 10. Plano responsivo e E2E

### 10.1 Viewports mínimos

- 320 × 568: menor telefone suportado;
- 360 × 800 e 390 × 844: celulares principais;
- 768 × 1024: tablet/retrato;
- 1024 × 768: tablet/paisagem;
- 1280 × 800 e 1440 × 900: desktop;
- zoom de 200% no desktop e reflow equivalente a 320 CSS px;
- texto ampliado a 200% sem perda de controles ou conteúdo.

### 10.2 Cenários públicos

1. menu abre por teclado/toque, fecha por Escape/clique fora, preserva foco e continua correto após rotação;
2. menu, footer, sitemap e rota não expõem Convenções/Documentos/Editais/Acordos;
3. home com e sem conteúdo não apresenta mojibake, espaços vazios ou seções invisíveis sem JS;
4. lista de notícias pagina, e a matéria mostra capa, texto alternativo, galeria, fontes e relacionados;
5. Benefícios filtra por categoria, abre detalhes, expõe requisitos e CTA sem depender só de cor;
6. Jurídico navega pelas âncoras, abre/fecha FAQ e preserva toda a estrutura essencial;
7. formulário jurídico valida por campo, mantém valores após erro, rejeita anexo inválido e confirma envio com foco anunciado;
8. páginas genéricas sanitizam HTML, scripts, handlers e URLs perigosas;
9. navegação completa apenas com teclado e leitor de tela em ordem coerente;
10. contraste automatizado e manual atende WCAG 2.1 AA.

### 10.3 Cenários administrativos

1. editor autenticado cria rascunho de notícia com apenas capa, título, resumo e corpo;
2. slug é automático e duplicidade gera mensagem simples no campo;
3. sair ou perder rede não perde um rascunho já salvo;
4. preview não torna rascunho acessível ao público;
5. publicar agenda/torna visível na hora certa e desfazer publicação remove do público;
6. galeria reordena por teclado e toque; arquivos inválidos mostram como corrigir;
7. lista funciona como tabela no desktop e cards no celular;
8. editor de Benefícios cria, reordena, desativa e publica um item;
9. editor de conteúdo jurídico altera hero/cards/FAQ sem alterar formulário, chamados ou estrutura visual;
10. usuário de conteúdo jurídico recebe 403 e não vê links para chamados, anexos ou PII;
11. usuário de atendimento vê chamados, mas não consegue publicar texto;
12. modal de chamado prende/restaura foco e todos os estados são anunciados;
13. sessão expirada preserva trabalho local e orienta novo login;
14. conteúdo de demonstração mantém selo e pode ser removido sem tocar conteúdo real.

### 10.4 Automação recomendada

- Vitest para validadores, slug, normalização, sanitização, permissões e transformação de payloads;
- Playwright para os fluxos acima em Chromium, Firefox e WebKit;
- axe-core nos estados principais, incluindo modal aberto e formulários com erro;
- testes de integração com Directus isolado em Docker e dados exclusivamente fictícios;
- teste de snapshot/contrato do schema para impedir o retorno da coleção `documentos`;
- verificação de links, sitemap, RSS e JSON-LD;
- orçamento de Lighthouse mobile depois dos testes funcionais, sem substituir teste manual.

## 11. Sequência de implementação com gates

### Gate 0 — baseline executável

Corrigir imports/dependências, mojibake e build. Rodar unitários, build, smoke HTTP e abrir as rotas principais. Nenhuma feature nova segue se o build não estiver verde.

### Gate 1 — retirada do escopo proibido

Remover Convenções/Documentos em código, schema, permissões, seed, navegação e docs. Fazer backup antes da mudança no Directus. Validar busca global e contrato do schema.

### Gate 2 — fundação de UI e acessibilidade

Consolidar tokens, simplificar o painel, corrigir contraste/foco/menu/reveal e criar componentes compartilhados de formulário, feedback, upload, lista responsiva, estado vazio e confirmação.

### Gate 3 — Notícias

Migrar schema, criar editor simples, fonte, galeria, preview e publicação segura. Popular somente notícias demonstrativas. Executar testes com usuário de baixa familiaridade digital.

### Gate 4 — Benefícios

Criar modelo estruturado, rota pública e painel, então popular cards demonstrativos. Validar filtros, expirados, celular e leitor de tela.

### Gate 5 — Jurídico editável

Separar conteúdo/chamados e papéis, implementar editor restrito por seções, preview, revisão e histórico. Preservar e testar todos os invariantes da página e do painel atual.

### Gate 6 — E2E e aceite

Executar matriz responsiva, navegadores, teclado, leitor de tela, axe, segurança de conteúdo, restauração de backup e regressão Docker. Só então promover a imagem por digest para staging e, após aceite, produção.

## 12. Definição de pronto desta frente

- `npm test` e `npm run build` passam do zero;
- não existe rota, menu, sitemap, coleção pública, seed ou documento operacional de Convenções/Documentos/Editais/Acordos;
- home está em UTF-8 correto;
- Notícias possui capa, texto alternativo, resumo, corpo, fonte, galeria, rascunho, preview, agendamento e publicação inequívoca;
- Benefícios tem rota e painel estruturados, não HTML genérico;
- Jurídico mantém hero, cards, plantões, formulário, FAQ, CTA e painel de chamados;
- conteúdo jurídico é editável sem dar acesso automático a PII;
- nenhum dado demonstrativo parece real e nenhum chamado fictício é criado;
- nenhuma mídia é obtida por API externa;
- tarefas principais funcionam em 320 px, teclado e 200% de zoom;
- os testes E2E cobrem papéis, publicação e regressão das três áreas;
- auditoria visual com screenshots é repetida depois do build verde, pois esta revisão de código não comprova fidelidade visual nem conformidade WCAG completa.
