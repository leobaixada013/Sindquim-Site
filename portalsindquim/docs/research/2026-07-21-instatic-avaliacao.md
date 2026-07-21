# Avaliação técnica do CoreBunch/Instatic para o Sindquim

**Data da pesquisa:** 21 de julho de 2026  
**Versão avaliada:** `0.0.11`  
**Commit inspecionado:** `960fdaa55e4fb3a05314029d9aacc8bc38c32cdb`  
**Método:** documentação, código-fonte, release e imagem Docker oficiais; teste local isolado da imagem publicada.

## Conclusão

O Instatic é uma proposta interessante para edição visual e publicação de sites, mas não é uma biblioteca complementar comum. É uma plataforma all-in-one que já incorpora CMS, editor, mídia, autenticação, dados, formulários, plugins e publisher. No projeto Sindquim, adotá-lo de forma definitiva substituiria grande parte do Astro e do Directus.

A recomendação atual é **não colocá-lo em produção** e preservar Astro + Directus como arquitetura de entrega. O Instatic pode ser avaliado em uma PoC isolada, sem dados reais, para responder se sua experiência editorial supera o Directus devidamente simplificado. Um resultado positivo deve abrir uma decisão formal de migração, não criar dois CMSs permanentes.

Motivos principais:

- versão `0.0.11`, ainda pré-1.0;
- a política oficial não o recomenda ainda para ambientes multiusuário hostis sem revisão cuidadosa;
- APIs e workflows ainda podem mudar antes da 1.0;
- imagem oficial atual somente `linux/amd64`;
- o site bundle não leva contas, papéis, auditoria, segredos nem estado completo de plugins e não substitui backup de desastre;
- não foi encontrada integração nativa com Directus.

## 1. O que o Instatic é

O README define uma aplicação única com editor visual, conteúdo, mídia, autenticação, formulários, plugins e publicação. O servidor é baseado em Bun; o painel usa React/Vite; SQLite e PostgreSQL compartilham uma interface de dados. As páginas estáticas são gravadas em disco na publicação e trocadas atomicamente. [README oficial](https://github.com/CoreBunch/Instatic)

O mesmo documento descreve um modelo de conteúdo unificado em `data_tables` e `data_rows`, tipos de posts e tabelas customizadas, estados draft/scheduled/published, histórico da versão publicada e loops que consomem essas tabelas. [README oficial](https://github.com/CoreBunch/Instatic)

Isso significa que o produto sobrepõe responsabilidades atuais:

| Instatic | Equivalente atual |
|---|---|
| canvas e shell visual | Astro/componentes/design system |
| data tables, rows e posts | coleções Directus |
| auth, roles e capabilities | usuários/Policies Directus |
| media workspace | Directus Files/storage |
| forms | Astro + Directus |
| publisher | Astro SSR/build e proxy |
| plugins/schedules | extensions, hooks e Flows |

## 2. Recursos úteis para o projeto

### Editor e conteúdo

- canvas visual e componentes;
- design tokens e framework de estilos;
- data workspace para tabelas e post types customizados;
- busca, filtro, bulk publish e exportação;
- rascunho, agenda e publicação;
- versões do conteúdo publicado;
- mídia organizada em folders/smart folders;
- formulários nativos;
- importação de HTML e site transfer.

Fontes: [README](https://github.com/CoreBunch/Instatic), [Content storage](https://github.com/CoreBunch/Instatic/blob/main/docs/features/content-storage.md), [Data workspace](https://github.com/CoreBunch/Instatic/blob/main/docs/features/data-workspace.md), [Publisher](https://github.com/CoreBunch/Instatic/blob/main/docs/features/publisher.md).

### Identidade e autorização

A implementação oferece owner, admin, client e member, além de papéis customizados baseados em capabilities. A documentação e o código descrevem sessões por token, TOTP, criptografia de seeds, lockout, step-up para operações sensíveis, CSRF e auditoria. O papel Client é direcionado à edição de conteúdo sem acesso padrão à estrutura/estilo do site. [Auth and access](https://github.com/CoreBunch/Instatic/blob/main/docs/features/auth-and-access.md), [Capabilities](https://github.com/CoreBunch/Instatic/blob/main/docs/reference/capabilities.md), [Audit log](https://github.com/CoreBunch/Instatic/blob/main/docs/features/audit-log.md)

Esses mecanismos parecem adequados para uma PoC, mas precisam ser testados na UI e diretamente nas APIs. Existir no desenho do produto não prova que todos os casos de negação do Sindquim estão corretos.

### Plugins

O backend de plugin usa um worker com sandbox QuickJS-WASM. Por padrão, o plugin não recebe filesystem, variáveis de ambiente ou rede; acesso adicional é concedido pelo dono e pode ser limitado por host. Código que executa na janela do painel exige permissão explícita. [Plugin system](https://github.com/CoreBunch/Instatic/blob/main/docs/features/plugin-system.md), [README](https://github.com/CoreBunch/Instatic)

Isso torna tecnicamente concebível um plugin read-only para consultar um clone do Directus. Porém, não foi localizada integração nativa com Directus no repositório. A hipótese precisa de uma PoC específica e não deve ser tratada como capacidade pronta.

## 3. Maturidade e segurança

A [política de segurança oficial](https://github.com/CoreBunch/Instatic/blob/main/SECURITY.md) declara explicitamente que:

- o produto é pré-1.0;
- ainda não é recomendado para ambientes multiusuário hostis sem revisão cuidadosa do operador;
- correções miram `main` e a release mais recente;
- tags antigas não recebem manutenção de longo prazo antes da 1.0.

O [README](https://github.com/CoreBunch/Instatic) também alerta que APIs e workflows podem mudar e sugere aguardar a 1.0 quando estabilidade for requisito.

Para o Sindquim, isso tem impacto alto porque o plano inclui múltiplos usuários, papéis diferentes, arquivos e um fluxo Jurídico sensível. Até haver maturidade maior ou revisão independente, o Instatic deve permanecer fora da produção e não receber dados pessoais reais.

## 4. Docker e teste executado

### Publicação oficial

A documentação oferece a imagem `ghcr.io/corebunch/instatic:0.0.11`. A própria página informa que essa release é `linux/amd64`; hosts arm64 devem construir do código-fonte ou aguardar uma imagem arm64 nativa. [Docker image](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/docker-image.md)

O manifesto consultado em 21 de julho de 2026 confirmou:

- digest do índice: `sha256:4fe8eceb7b4366af9f13c69e924aa0254d43c29bd823818b72760db2877d0359`;
- manifest da imagem amd64: `sha256:b36fc7c10b508abb57483c8f60c37a3ef3626fb842db9260d88cae0823935c8d`;
- nenhuma imagem arm64 publicada nesse tag.

### Resultado local

Em Docker `linux/arm64`, a imagem amd64 foi executada sob emulação e:

- `/health` respondeu `200` com status `ok`;
- `/` respondeu `302` no estado inicial;
- `/admin` respondeu `200`;
- SQLite iniciou em `/app/data/cms.db`;
- uploads iniciaram em `/app/uploads`;
- volumes separados foram removidos depois do teste.

### Problema de permissões reproduzido

O exemplo genérico da documentação monta um volume vazio em `/app/storage` e pede que o usuário não-root crie `/app/storage/data`. Nesse teste, o processo falhou com `EACCES`. O layout do Compose oficial monta volumes nos diretórios `/app/data` e `/app/uploads`, que já existem e pertencem ao usuário `bun`; esse desenho iniciou corretamente. [Docker image](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/docker-image.md), [VPS deployment](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/vps.md)

A PoC deve usar o layout funcional, manter o runtime não-root e testar UID/GID. Rodar toda a aplicação como root não é uma correção aceitável.

## 5. Backup, restauração e transferência

A documentação de backup define como conjunto completo o banco e a mídia. Para PostgreSQL recomenda `pg_dump`; para SQLite documenta snapshot online com `VACUUM INTO` e oferece Litestream como opção de replicação contínua. [Backup and restore](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/backup-restore.md)

Para o projeto, o backup também precisa preservar e custodiar:

- `INSTATIC_SECRET_KEY`;
- configuração e manifesto da release;
- imagem/digest;
- pacotes/estado de plugins necessários;
- checksums e runbook.

O [site transfer](https://github.com/CoreBunch/Instatic/blob/main/docs/features/site-transfer.md) inclui shell, tabelas, rows, mídia, folders e redirects. Ele exclui deliberadamente:

- sessões;
- usuários, papéis e senhas;
- chaves de provedores;
- auditoria e logs de login;
- HTML publicado;
- variantes de mídia;
- pacotes/estado de instalação de plugins;
- preferências por usuário.

Além disso, autoria referenciada em usuários é anulada na importação. Portanto, site-transfer é útil para portabilidade de conteúdo, mas não atende sozinho à recuperação de desastre nem à migração integral de identidade/auditoria.

## 6. Aderência aos requisitos

| Requisito do Sindquim | Aderência aparente | O que ainda precisa ser provado |
|---|---|---|
| notícia simples e visual | forte | teste humano sem treinamento |
| capa, fonte e galeria | modelável | componentes, validações e UX |
| agenda e histórico | presente | idempotência, timezone, restore |
| Benefícios estruturados | forte | loops, validade e limites de layout |
| Jurídico público | forte | acessibilidade, conversão e conteúdo |
| chamados/anexos jurídicos | não aprovado | segurança, privacidade, retenção, antimalware |
| papéis por área | possível | matriz completa allow/deny |
| backup de usuários e auditoria | pelo banco | restore completo e custódia da chave |
| Docker permanente | suportado | arm64, UID/GID, scan, upgrade e rollback |
| integração Directus | não nativa | plugin custom read-only, se ainda fizer sentido |
| saída/migração | parcial | extração estruturada e recriação de identidades |

## 7. Alternativas arquiteturais

### Manter Astro + Directus

Menor risco imediato e aproveita o investimento existente. Primeiro configura-se o Directus para atingir a UX desejada e corrige-se segurança, build e operação já encontrados.

### Instatic como protótipo visual

Usa conteúdo fictício para testar layouts de Benefícios/Jurídico e o editor visual. A implementação aprovada é refeita no Astro; Instatic não vira runtime nem fonte de verdade. É a forma mais segura de aproveitar o ponto forte visual hoje.

### Substituir a plataforma no futuro

Só é viável depois de gates de maturidade, segurança, UX, RBAC, acessibilidade, backup, arm64, atualização e portabilidade. A migração deve substituir Astro + Directus como projeto próprio; não coexistir indefinidamente com os dois.

### Manter dois CMSs

Reprovado como arquitetura final. Duplica usuários, conteúdo, URLs, mídia, permissões, backups, SEO e resposta a incidentes.

## 8. Recomendação de teste

Executar uma PoC de 2–3 semanas, sem dados reais, contendo:

1. Notícias com título, slug automático, capa/alt/crédito, texto, categoria, fonte, galeria, vídeo, destaque, status e agenda;
2. Benefícios estruturados com categoria, elegibilidade, condições, validade e CTA;
3. apenas o conteúdo público de Jurídico;
4. papéis de owner, designer, Editor, Benefícios e Jurídico público;
5. testes de API/RBAC, MFA, sessão, auditoria, upload, XSS, CSRF e plugins;
6. testes humanos comparativos com Directus já simplificado;
7. acessibilidade por axe e revisão manual;
8. backup/restore completo em ambiente vazio;
9. exportação e inventário do que fica de fora;
10. scan, digest, plataforma, atualização e rollback Docker.

O roteiro detalhado e os gates estão em [Plano de avaliação e adoção condicionada do Instatic](../superpowers/plans/2026-07-21-plano-avaliacao-instatic.md).

## Fontes primárias

- [CoreBunch/Instatic — repositório e README](https://github.com/CoreBunch/Instatic)
- [Release 0.0.11](https://github.com/CoreBunch/Instatic/releases/tag/v0.0.11)
- [Security Policy](https://github.com/CoreBunch/Instatic/blob/main/SECURITY.md)
- [Architecture](https://github.com/CoreBunch/Instatic/blob/main/docs/architecture.md)
- [Docker image](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/docker-image.md)
- [VPS deployment](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/vps.md)
- [Backup and restore](https://github.com/CoreBunch/Instatic/blob/main/docs/deployment/backup-restore.md)
- [Auth and access](https://github.com/CoreBunch/Instatic/blob/main/docs/features/auth-and-access.md)
- [Capabilities](https://github.com/CoreBunch/Instatic/blob/main/docs/reference/capabilities.md)
- [Plugin system](https://github.com/CoreBunch/Instatic/blob/main/docs/features/plugin-system.md)
- [Publisher](https://github.com/CoreBunch/Instatic/blob/main/docs/features/publisher.md)
- [Site transfer](https://github.com/CoreBunch/Instatic/blob/main/docs/features/site-transfer.md)

