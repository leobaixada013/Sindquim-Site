# Revisão de build, Docker, deploy, backup e testes — Portal Sindquim

Data da revisão: 21/07/2026  
Escopo: `portalsindquim`  
Natureza: revisão não destrutiva; nenhum acesso ao LXC, à produção ou a dados reais.

## 1. Resultado executivo

O projeto ainda não deve ser publicado pelo fluxo de deploy existente. A base é recuperável, mas a revisão encontrou riscos de colisão com o projeto anterior, backup não consistente de SQLite, ausência de restauração automatizada, imagens mutáveis, deploy destrutivo sem rollback automático e nenhuma CI ativa.

Durante a primeira execução também foram encontrados dois bloqueios imediatos:

1. `site/src/pages/api/admin/noticias/salvar.ts` tinha um caminho relativo incorreto para `lib/auth`, impedindo `npm run build` e `docker build`;
2. não havia `site/.dockerignore`, fazendo o cliente enviar 255,99 MB de contexto e incluir `node_modules` local no `COPY . .`.

Esses dois itens foram comunicados ao agente principal e corrigidos por ele depois das execuções registradas neste documento. Por coordenação, os comandos npm e Docker não foram repetidos enquanto as dependências estavam sendo atualizadas. Portanto, as correções precisam passar novamente pelo gate completo da seção 11.

Estado por gate:

| Gate | Resultado observado | Situação |
|---|---|---|
| Instalação reproduzível | `npm ci --ignore-scripts` concluiu | passou com ressalva |
| Testes Vitest | 3 arquivos, 17 testes aprovados | passou |
| Build Astro | falhou no import de `lib/auth` | corrigido depois; revalidar |
| Build da imagem | falhou pelo mesmo import | corrigido depois; revalidar |
| Sintaxe Compose | configuração renderizada sem erro | passou |
| Sintaxe dos scripts Bash | `bash -n` sem erro | passou |
| Dry-run de backup/deploy | concluiu sem contato remoto | passou |
| Vulnerabilidades npm | 1 vulnerabilidade moderada no Astro | pendente |
| Backup consistente | script arquiva SQLite enquanto o serviço pode estar escrevendo | reprovado |
| Restore real | não há script nem ensaio de restauração | não implementado |
| Rollback automático | não existe | não implementado |
| CI/CD | não existe `.github/workflows` | não implementado |

Decisão desta revisão: **NO-GO para produção até os P0 da seção 5 serem resolvidos e todos os gates obrigatórios passarem**.

## 2. Ambiente e comandos executados

Ambiente local observado:

- arquitetura: `arm64`;
- Node.js: `v26.5.0`;
- npm: `12.0.1`;
- Docker: `29.6.2`;
- Docker Compose: `5.3.1`;
- builder Docker: Colima.

Existe uma diferença importante: a máquina executou os testes com Node 26, enquanto a imagem usa Node 24. A CI deve usar Node 24 e a mesma geração de npm da imagem para eliminar essa divergência.

### 2.1 Instalação

Comandos:

```bash
cd portalsindquim/site
npm ci --ignore-scripts
npm rebuild esbuild
```

Resultado:

- 376 pacotes instalados;
- lockfile aceito;
- uma vulnerabilidade moderada relatada;
- o npm 12 avisou que scripts de instalação de dois pacotes foram bloqueados por não estarem declarados em `allowScripts`;
- `npm rebuild esbuild` terminou com sucesso, mas a política de scripts deve ser tornada explícita e validada no Node/npm usados pela imagem.

### 2.2 Testes automatizados existentes

Comando:

```bash
npm test
```

Resultado:

```text
Test Files  3 passed (3)
Tests      17 passed (17)
Duration   189 ms
```

Cobertura existente:

- formatação de datas;
- parsing e resolução de feeds do YouTube;
- verificações textuais e dry-run dos scripts de backup/deploy.

Não há cobertura automatizada para autenticação, permissões, CSRF, APIs administrativas, criação/publicação de notícias, edição da área jurídica, upload/galeria, integração real com Directus, Compose em execução, backup consistente, restauração ou rollback.

### 2.3 Build local

Comando:

```bash
npm run build
```

Resultado da primeira execução: falha `UNRESOLVED_IMPORT` em `src/pages/api/admin/noticias/salvar.ts`, ao resolver `../../../../../lib/auth`. O arquivo `src/lib/auth.ts` existe; a rota precisava subir quatro níveis, não cinco.

O agente principal corrigiu o caminho depois desse resultado. Falta repetir build e smoke test após a atualização coordenada de dependências.

### 2.4 Compose

Comando executado com segredos fictícios:

```bash
env \
  DIRECTUS_SECRET=test-only \
  DIRECTUS_ADMIN_EMAIL=test@example.invalid \
  DIRECTUS_ADMIN_PASSWORD=test-only-password \
  PUBLIC_SITE_URL=http://localhost:4321 \
  PUBLIC_DIRECTUS_URL=http://localhost:8055 \
  docker compose -f deploy/docker-compose.yml config
```

Resultado: configuração válida. Isso prova somente o parse e a interpolação; não prova inicialização, persistência, saúde ou conectividade entre os serviços.

### 2.5 Scripts de operação

Comandos:

```bash
bash -n scripts/backup-lxc200-data.sh scripts/deploy-lxc200.sh
bash scripts/backup-lxc200-data.sh --dry-run
bash scripts/deploy-lxc200.sh --dry-run
```

Resultado: sintaxe aprovada e ambos os dry-runs concluíram. O modo dry-run apenas imprime a carga remota e os comandos `scp`/`ssh`; nenhum host foi contatado.

### 2.6 Build Docker

Comando:

```bash
docker build \
  --progress=plain \
  --build-arg PUBLIC_SITE_URL=http://localhost:4321 \
  --build-arg PUBLIC_DIRECTUS_URL=http://localhost:8055 \
  -t portalsindquim-review:local \
  portalsindquim/site
```

Resultado da primeira execução: falhou em `RUN npm run build` pelo mesmo import. Antes da criação de `.dockerignore`, o contexto enviado foi de 255,99 MB. Nenhuma imagem final foi produzida.

### 2.7 Auditoria de dependências

Comando:

```bash
npm audit --json
```

Resultado: uma vulnerabilidade moderada direta em `astro@7.0.6`, advisory `GHSA-4g3v-8h47-v7g6`, com correção disponível segundo o npm. A atualização deve ser feita em branch/PR e validada; não usar `npm audit fix` automaticamente em produção.

## 3. Cadeia atual

```text
Código local
  -> tar do repositório
  -> scp para Proxmox
  -> pct push para LXC 200
  -> cópia ao diretório temporário
  -> docker compose down
  -> remoção da árvore ativa
  -> cópia da árvore nova
  -> docker compose up -d --build
  -> espera apenas o Directus
  -> aplica schema
  -> curl da home e do Directus
```

O fluxo constrói a imagem depois de interromper o ambiente e remover a árvore ativa. Uma falha de build, schema ou smoke deixa indisponibilidade e exige recuperação manual. Esse é o inverso da cadeia segura: a imagem deve ser construída, testada e publicada antes de qualquer alteração no servidor.

## 4. Inventário técnico

### 4.1 Aplicação

- Astro SSR com adaptador Node standalone;
- Node 24 Alpine nas etapas de build e runtime;
- `npm ci` baseado em `package-lock.json` v3;
- Vitest como executor de testes;
- Directus SDK no servidor Astro.

### 4.2 Compose

- Directus em `directus/directus:11`;
- SQLite em `deploy/directus/database/data.db`;
- uploads e extensões em bind mounts dentro da própria árvore de deploy;
- site construído localmente por `build.context`;
- portas 4321 e 8055 publicadas em todas as interfaces;
- rede externa opcional `connectai_portaria-network`.

### 4.3 Estado persistente

O que precisa sobreviver à recriação completa dos containers:

- banco Directus: notícias, páginas, benefícios, conteúdo jurídico editável, usuários, papéis, permissões, configurações e auditoria;
- uploads: capas, galerias, anexos e demais mídias;
- extensões próprias do Directus, se existirem;
- segredos e configuração operacional;
- snapshot/versionamento do schema;
- manifesto da release com os digests das imagens.

O site Astro deve ser stateless. O login administrativo atual usa token/cookies e o Directus como fonte de autenticação; não foi encontrada dependência explícita de `Astro.session` no código revisado.

## 5. Bloqueios e achados priorizados

### P0 — impedir qualquer deploy do novo diretório com os padrões atuais

Os scripts e o Compose ainda carregam a identidade do projeto anterior:

- `DEPLOY_REMOTE_DIR` padrão: `/home/eduardo118/sindquim-astro`;
- `DEPLOY_BACKUP_DIR` padrão: `/home/eduardo118/backups/sindquim-astro`;
- pacote remoto: `sindquim-astro-deploy.tgz`;
- containers: `sindquim-site` e `sindquim-directus`;
- portas: 4321 e 8055;
- rede externa: `connectai_portaria-network`.

Executar `scripts/deploy-lxc200.sh` sem parametrização pode substituir ou interromper o ambiente antigo. Antes de qualquer teste remoto, criar namespace, diretório, projeto Compose, containers, portas/domínios, rede e caminho de backup exclusivos para `portalsindquim`. Adicionar uma trava que aborte se `REMOTE_DIR` não contiver o identificador esperado e exigir confirmação explícita do ambiente.

### P0 — backup de SQLite não é consistente

`scripts/backup-lxc200-data.sh` arquiva diretamente a pasta do banco com `tar` enquanto o Directus pode estar escrevendo. Ler `data.db`, `-wal` e `-shm` sem coordenar uma transação ou pausar escrita pode produzir um conjunto inconsistente.

O deploy ainda copia `deploy/directus` para o diretório temporário antes de executar `docker compose down`, repetindo o risco. `tar -tzf` comprova apenas que o gzip/tar pode ser listado; não comprova que o SQLite abre, passa em `PRAGMA integrity_check` ou preserva dados relacionados.

Correção mínima se SQLite for mantido:

1. bloquear escrita ou parar o Directus;
2. gerar snapshot via API de backup do SQLite (`.backup`/`VACUUM INTO`) para arquivo separado;
3. capturar uploads e extensões no mesmo ponto lógico;
4. executar `PRAGMA integrity_check` na cópia;
5. calcular checksum;
6. restaurar em ambiente vazio e validar coleções, usuários, papéis e arquivos;
7. somente então autorizar migração/deploy.

Para o alvo robusto e multiusuário, preferir PostgreSQL com backups lógicos, retenção e, se o RPO exigir, WAL/PITR.

### P0 — restauração e rollback não existem

Não há script de restore, teste de restore, release manifest nem rollback automático. A documentação diz para restaurar manualmente, mas não codifica a sequência nem verifica compatibilidade entre versão do Directus, schema e banco.

Um backup só deve ser considerado válido depois de uma restauração automatizada em volumes vazios, com verificação funcional.

### P0 — build/release precisa ser validado após as correções coordenadas

O import quebrado e a ausência do `.dockerignore` foram corrigidos depois dos testes iniciais. Enquanto não forem executados novamente `npm ci`, `npm test`, `npm run build`, build da imagem, inicialização do Compose e smoke tests, não há artefato candidato a release.

### P1 — imagens mutáveis

- `directus/directus:11` pode mudar sem alteração no repositório;
- `node:24-alpine` também é mutável;
- o serviço `site` é construído no servidor, em vez de receber uma imagem já aprovada;
- não há digest, SBOM, assinatura, provenance ou manifesto da release.

### P1 — Dockerfile precisa de endurecimento

Na versão revisada:

- o runtime recebe todo o `node_modules` da etapa de build, incluindo dependências de desenvolvimento;
- o processo roda como root, pois não há `USER`;
- não há `HEALTHCHECK`;
- o tag base não está fixado por digest;
- antes da correção, `COPY . .` recebia também artefatos locais por falta de `.dockerignore`.

O alvo deve instalar apenas dependências de runtime na imagem final, executar como usuário sem privilégios, incluir healthcheck e manter contexto mínimo.

### P1 — saúde e ordem de inicialização insuficientes

O Compose não declara healthchecks. `depends_on` espera somente que o container Directus seja iniciado, não que esteja pronto. O script faz polling apenas do Directus; o site recebe um único `curl`, sem retry e sem endpoint de saúde dedicado.

Adicionar:

- healthcheck do Directus;
- `/api/health` no site, verificando processo e, separadamente, dependência do Directus;
- `depends_on.condition: service_healthy` onde suportado;
- `docker compose up --wait` com timeout;
- smoke de páginas públicas e administrativas sem expor dados.

### P1 — deploy destrutivo e sem atomicidade

O script remove a árvore remota antes de saber se a nova imagem constrói e sobe. Também executa `directus-schema.mjs` no ambiente recém-iniciado sem um plano de compatibilidade ou rollback de migração.

Construir fora de produção e fazer promoção por digest. Para atualização, usar release versionada e troca atômica de referência; nunca depender de reconstrução após `down`.

### P1 — exposição e isolamento

As portas são publicadas como `0.0.0.0:4321` e `0.0.0.0:8055`. Se a publicação for feita por tunnel/reverse proxy, usar bind local ou rede interna e expor somente o proxy. Remover `container_name` fixo para permitir namespace do projeto e evitar colisões.

### P1 — dependências e cadeia de suprimentos

- Astro instalado em versão afetada por advisory moderado;
- pacotes Astryx usam `latest` em `package.json`;
- o lockfile torna o `npm ci` atual determinístico, mas uma regeneração pode trazer mudança ampla;
- Node local 26 diverge de Node 24 da imagem;
- npm 12 bloqueou scripts de instalação não autorizados.

Fixar versões explícitas, usar atualização automatizada por PR e manter a política `allowScripts` mínima e revisada.

### P1 — CI/CD ausente

Não foi encontrado `.github/workflows`. Assim, testes, build, auditoria, imagem e deploy dependem da máquina de uma pessoa e não deixam trilha de aprovação.

### P2 — operação e observabilidade

Faltam limites de recursos, política de logs/rotação, alertas de healthcheck, métricas de backup, monitoramento de validade do certificado/domínio e registro central de cada release.

## 6. Plano de imagens, versões e digests

Digests observados em 21/07/2026 — são evidência da revisão, não autorização para atualização automática:

| Artefato | Tag observada | Versão identificada | Digest multiarch observado |
|---|---|---|---|
| Node base | `node:24-alpine` | Node 24 / Alpine 3.24 | `sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd` |
| Directus | `directus/directus:11` | 11.17.4 | `sha256:eb326f679ae847c0a776f93b972761dc2ebe84980e0b9d274a6bc31cd62809f7` |

O alvo:

1. CI constrói `ghcr.io/<organizacao>/portalsindquim-site:<versao>-<commit>`;
2. CI testa exatamente essa imagem;
3. CI publica SBOM e provenance e registra o digest retornado pelo registry;
4. `docker-compose.prod.yml` referencia `site` e Directus por versão **e** digest;
5. cada release guarda um manifesto imutável com commit, digests, versão do schema e identificador do backup;
6. produção faz somente `docker compose pull` e `up`, nunca `--build`;
7. pelo menos as duas releases anteriores permanecem disponíveis para rollback;
8. atualização de Node/Directus entra em PR separado, com backup/restore e homologação;
9. não usar Watchtower nem qualquer atualização automática cega em produção.

Exemplo conceitual:

```yaml
services:
  directus:
    image: directus/directus:11.17.4@sha256:<digest-aprovado>
  site:
    image: ghcr.io/<organizacao>/portalsindquim-site:1.0.0-<commit>@sha256:<digest-aprovado>
```

O digest deve ser atualizado pelo pipeline a partir do artefato realmente testado, não copiado manualmente de um tag móvel.

## 7. Persistência e backup-alvo

### 7.1 Separar código de dados

Não manter dados persistentes dentro da árvore que o deploy substitui. Usar volumes/diretórios dedicados fora da release:

```text
/srv/portalsindquim/releases/<release-id>/
/srv/portalsindquim/data/database/
/srv/portalsindquim/data/uploads/
/srv/portalsindquim/data/extensions/
/srv/portalsindquim/backups/
```

Idealmente:

- PostgreSQL em serviço/volume próprio;
- uploads em storage versionado ou volume próprio com cópia externa;
- extensões empacotadas em imagem versionada quando forem código;
- segredos fora da imagem e fora do backup comum, via secret store ou arquivo com permissão restrita;
- releases imutáveis, sem `rm -rf` do diretório de dados.

### 7.2 Conteúdo que o backup deve preservar

- todas as matérias e seus estados;
- páginas editáveis de Benefícios e Jurídico;
- a estrutura essencial/obrigatória dessas páginas;
- usuários, papéis, políticas e permissões;
- configurações e branding do Directus;
- auditoria necessária;
- arquivos de capa, galerias e anexos;
- schema snapshot e versão de migração;
- configuração necessária para reconstrução;
- manifesto com digests das imagens.

### 7.3 Estratégia 3-2-1

Proposta inicial:

- cópia operacional local rápida;
- cópia criptografada em segundo armazenamento;
- cópia off-site, versionada e com retenção/imutabilidade;
- backup completo diário;
- para PostgreSQL, WAL/PITR ou frequência compatível com RPO;
- retenção sugerida: 7 diários, 5 semanais e 12 mensais, sujeita à política jurídica/LGPD;
- checksum e relatório em toda execução;
- alerta se o backup atrasar, falhar ou não puder ser lido.

Metas provisórias a confirmar com o responsável do negócio:

- RPO: até 1 hora para conteúdo e usuários;
- RTO: até 4 horas;
- restore drill automático mensal e manual antes de toda migração relevante.

### 7.4 Segredos e dados jurídicos

O script atual arquiva `.env` junto do conteúdo. Isso simplifica recuperação, mas coloca chaves e senhas no mesmo arquivo. Separar:

- dados operacionais criptografados;
- custódia/escrow de segredos com acesso restrito;
- chaves de criptografia fora do host e fora do backup criptografado;
- logs de acesso e prazo de retenção;
- descarte verificável conforme LGPD.

Se o Jurídico receber dados pessoais ou anexos, os backups devem herdar a mesma classificação de segurança da produção.

## 8. Plano de restauração

Criar `scripts/restore-backup.sh` com `--dry-run`, alvo obrigatório e proteção contra produção. A sequência precisa ser ensaiada em homologação:

1. selecionar backup pelo identificador, nunca por glob ambíguo;
2. verificar assinatura/checksum e descriptografar em diretório temporário seguro;
3. validar manifesto, versão do banco, Directus, schema e imagens;
4. criar volumes/banco vazios;
5. restaurar banco por mecanismo próprio;
6. executar integridade do banco;
7. restaurar uploads e conferir amostra/checksums;
8. restaurar ou instalar extensões na versão registrada;
9. iniciar o Directus pelo digest registrado;
10. validar usuários, papéis, permissões, contagens e relacionamentos;
11. iniciar o site pelo digest registrado;
12. executar smoke/E2E com dados sintéticos de verificação;
13. promover o ambiente somente após aprovação;
14. produzir relatório de restore com duração e divergências.

Critérios mínimos de sucesso:

- banco íntegro;
- usuário de teste autentica;
- editor autorizado cria e edita sem ganhar acesso administrativo indevido;
- notícia publicada aparece no site com capa e galeria;
- Benefícios e Jurídico preservam campos essenciais;
- anexos autorizados abrem e usuários sem permissão recebem negação;
- auditoria e histórico esperado permanecem;
- nenhuma dependência de dados do ambiente antigo.

## 9. Plano de deploy e rollback

### 9.1 Deploy seguro

```text
PR
  -> lint/test/build/audit
  -> imagem imutável
  -> scan/SBOM/assinatura
  -> integração em Compose efêmero
  -> homologação
  -> aprovação manual
  -> backup consistente se necessário
  -> pull por digest
  -> up --wait
  -> smoke/E2E
  -> promoção ou rollback automático
```

### 9.2 Rollback de aplicação

Se não houver migração incompatível:

1. apontar o manifesto para os digests da release anterior;
2. subir a release anterior;
3. aguardar healthchecks;
4. executar smoke;
5. registrar o incidente e congelar a release defeituosa.

### 9.3 Rollback com mudança de dados/schema

Não assumir que trocar a imagem reverte o banco. Antes da migração, registrar compatibilidade. Se a versão anterior não ler o schema novo:

1. retirar escrita e isolar o ambiente;
2. restaurar o snapshot associado à release anterior;
3. restaurar uploads compatíveis;
4. subir imagens antigas por digest;
5. validar integridade e fluxos;
6. reabrir tráfego somente após aprovação.

O rollback de dados é uma decisão explícita porque pode descartar alterações feitas depois do backup. O pipeline deve mostrar esse risco e exigir aprovação.

## 10. CI/CD proposta

### 10.1 Pull request

- checkout e cache controlado;
- Node 24 fixo;
- `npm ci`;
- verificação de lockfile;
- `npm test`;
- `npm run build`;
- `astro check` após adicionar `@astrojs/check` e TypeScript;
- `npm audit` com política clara;
- ShellCheck nos scripts;
- `docker compose config` com `.env` sintético;
- Hadolint no Dockerfile;
- build da imagem sem push;
- scanner de vulnerabilidades da imagem;
- detector de segredos;
- E2E em Compose efêmero com conteúdo fictício.

### 10.2 Branch principal/tag

- repetir gates críticos em ambiente limpo;
- buildx para a arquitetura real do servidor;
- publicar tag de commit e versão;
- gerar SBOM/provenance;
- assinar imagem;
- registrar digest no release manifest;
- implantar automaticamente somente em homologação.

### 10.3 Produção

- environment protegido;
- aprovação humana;
- credencial de curta duração/OIDC para registry quando possível;
- backup consistente obrigatório para alterações de dados/schema;
- deploy por digest;
- healthcheck e E2E;
- rollback automático do app quando seguro;
- relatório e notificação.

### 10.4 Jobs recorrentes

- diário: verificação do último backup e scans de dependências/imagens;
- semanal: integração completa em volumes vazios;
- mensal: restauração integral em homologação e medição de RPO/RTO;
- antes de upgrade de Directus/PostgreSQL: restore drill específico da versão.

## 11. Matriz de testes e gates

| Camada | Teste/comando | Resultado desta revisão | Gate futuro |
|---|---|---|---|
| Dependências | `npm ci --ignore-scripts` | passou; 1 advisory e aviso `allowScripts` | obrigatório |
| Unidade | `npm test` | 17/17 passou | obrigatório |
| Build Astro | `npm run build` | falhou no import; corrigido depois | repetir e aprovar |
| Dependências runtime | `npm ls --depth=0` | árvore resolvida | obrigatório |
| Segurança npm | `npm audit --json` | 1 moderada no Astro | corrigir/aceitar formalmente |
| Compose parse | `docker compose config` | passou | obrigatório |
| Bash | `bash -n scripts/*.sh` selecionados | passou | obrigatório |
| Dry-run backup | script com `--dry-run` | passou; apenas textual | manter, não suficiente |
| Dry-run deploy | script com `--dry-run` | passou; apenas textual | manter, não suficiente |
| Docker build | `docker build` | falhou no build Astro; correção pendente de revalidação | obrigatório |
| Contexto Docker | tamanho exibido pelo build | 255,99 MB antes do `.dockerignore` | exigir tamanho baixo e lista revisada |
| Imagem runtime | iniciar por digest, usuário não root | não executado | obrigatório |
| Health site | `/api/health` | endpoint dedicado ausente | implementar |
| Health Directus | `/server/health` em Compose | não executado localmente | obrigatório |
| Integração Astro/Directus | leitura pública e autenticação | não existe | obrigatório |
| Notícias | criar rascunho, upload, galeria, publicar, agendar | não existe | obrigatório |
| Benefícios | editar campos e validar renderização | não existe | obrigatório |
| Jurídico | editar sem remover campos essenciais | não existe | obrigatório |
| RBAC | usuário limitado não altera usuários/schema | não existe | obrigatório |
| Backup banco | snapshot consistente + integridade | não existe | obrigatório |
| Backup mídia | checksums e retenção | não existe | obrigatório |
| Restore | volumes vazios + validação funcional | não existe | obrigatório |
| Rollback app | voltar ao digest anterior | não existe | obrigatório |
| Rollback schema | restaurar snapshot compatível | não existe | obrigatório antes de migração |
| Segurança container | scan, usuário, secrets, portas | não existe | obrigatório |
| Acessibilidade | axe + teclado nos fluxos principais | fora desta bateria e não automatizado | obrigatório antes de aceite |
| Performance | Lighthouse/carga básica | não executado | gate com orçamento definido |

## 12. Ordem cautelosa de implementação

1. Isolar completamente a identidade do `portalsindquim`; bloquear os scripts antigos.
2. Revalidar import, `.dockerignore`, dependências, testes e build.
3. Corrigir advisory do Astro e eliminar versões `latest`.
4. Endurecer Dockerfile e adicionar healthchecks.
5. Criar Compose de desenvolvimento e Compose de produção separados.
6. Decidir PostgreSQL versus SQLite com snapshot seguro; para o objetivo robusto, adotar PostgreSQL.
7. Separar dados persistentes da árvore de releases.
8. Implementar backup, checksums, criptografia, off-site e monitoramento.
9. Implementar restore e provar recuperação em ambiente vazio.
10. Construir CI e publicar imagens imutáveis.
11. Implementar deploy por digest e rollback automático do app.
12. Criar testes de integração/E2E para Notícias, Benefícios, Jurídico e RBAC.
13. Executar homologação com dados totalmente fictícios.
14. Somente depois criar a primeira release candidata a produção.

## 13. Critério final de liberação

O Portal Sindquim estará tecnicamente apto a um primeiro deploy quando:

- nenhum caminho/nome padrão puder atingir o projeto antigo;
- todos os testes e builds passarem em Node 24 limpo;
- imagens forem publicadas e usadas por digest;
- Compose tiver healthchecks e dados fora da release;
- backup consistente tiver sido restaurado com sucesso em ambiente vazio;
- usuários, permissões, matérias, Benefícios, Jurídico e arquivos forem validados após restore;
- deploy falho voltar automaticamente à imagem anterior quando não houver migração incompatível;
- migrações tiverem backup e procedimento de rollback aprovados;
- CI/CD guardar logs, manifestos e aprovações;
- não houver vulnerabilidade alta/crítica e toda exceção restante estiver formalmente aceita.

Até esse ponto, usar somente desenvolvimento/homologação isolados e dados fictícios.
