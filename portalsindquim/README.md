# Portal Sindquim

Portal institucional em Astro 7 com Directus 11 e PostgreSQL 17. A central Astro oferece um editor guiado de notícias; o Directus permanece como CMS, autenticação e fonte oficial dos dados.

Release atual: **1.9.0**.

O projeto não possui módulo público de editais, documentos, acordos ou convenções. A área jurídica é informativa e editável, mas a triagem preserva aviso de privacidade, consentimento, controles de acesso e anexos privados.

## Endereços locais

- site: <http://localhost:4421>
- painel editorial do Directus: <http://localhost:8155/admin>
- central de tarefas do portal: <http://localhost:4421/admin>
- saúde integrada: <http://localhost:4421/api/health>

## Primeira instalação com Docker

Requisitos: Docker Desktop com Compose v2 e Node.js 22.12 ou mais recente.

1. Entre nesta pasta e crie o arquivo local de segredos:

   ```bash
   cp deploy/.env.example deploy/.env
   ```

2. Substitua todas as senhas e tokens de exemplo. Para gerar valores fortes:

   ```bash
   openssl rand -hex 32
   ```

3. Para uma instalação local completa, com conteúdo fictício e testes:

   ```bash
   node scripts/bootstrap-local.mjs
   ```

4. Para uma instalação que não deve receber demonstrações:

   ```bash
   node scripts/bootstrap-local.mjs --no-demo
   ```

O bootstrap pode ser repetido: schema, permissões e conteúdo de demonstração são idempotentes. Nunca use `PORTAL_DEMO=true` em produção.

Para importar as matérias verificadas sobre o SINDQUIM e empresas da Baixada Santista, faça primeiro um backup e execute:

```bash
set -a
source deploy/.env
set +a
DIRECTUS_URL="http://localhost:${DIRECTUS_PORT:-8155}" node scripts/directus-conteudo-sindquim.mjs
```

O importador cria apenas itens ausentes, preserva edições posteriores e arquiva — sem apagar — as notícias marcadas como demonstração. A pesquisa e as fontes estão em `docs/research/2026-07-21-sindquim-baixada-conteudo.md`.

## Fluxo editorial

O Directus é o CMS e a fonte oficial dos dados. O Astro entrega o site público e uma central editorial simplificada por função.

- **Editor:** cria e atualiza notícias, benefícios, avisos e textos públicos; não exclui conteúdo nem vê chamados, usuários ou segredos.
- **Jurídico:** lê e trata chamados jurídicos e seus anexos privados; não administra o restante do sistema.
- **Administrador:** configura a instalação e convida usuários.

Para publicar uma notícia:

1. abra **Central do portal → Notícias → Criar notícia**;
2. escreva título, resumo opcional e texto;
3. escolha a capa e, se quiser, até vinte fotos adicionais sem sair da matéria;
4. informe se a fonte é o SINDQUIM ou preencha nome e link da fonte externa;
5. escolha **Salvar rascunho**, **Agendar** ou **Publicar agora**.

Rascunhos podem ficar incompletos. O slug e a primeira data de publicação são automáticos e estáveis. Uma publicação só é aceita com título, conteúdo, capa, descrição da capa, descrição das fotos adicionais e fonte válida. O hook editorial também valida e processa publicações agendadas. O painel técnico do Directus continua disponível para administradores e tarefas avançadas.

### Podcast Reação Química

Abra **Central do portal → Podcast**. O editor pode ativar ou ocultar a seção, conferir o canal do YouTube e anunciar o próximo episódio com título, data, resumo, link e upload direto da arte. Os episódios publicados são lidos automaticamente do feed público do canal; não é necessário recadastrá-los. O anúncio futuro sai da página inicial sozinho quando chega a data da estreia.

## Área jurídica editável e protegida

Textos de apresentação, direitos, plantões, perguntas frequentes, CTAs e descrição de SEO são editáveis no Directus. Os controles essenciais continuam no código e nas permissões:

- aceite explícito do aviso de privacidade;
- registro da versão do aviso e data do consentimento;
- prazo de retenção do chamado;
- limite e validação real do tipo de arquivo;
- anexos em pasta privada;
- token técnico exclusivo, com permissão apenas para criar chamados;
- acesso humano limitado à função Jurídico ou Administrador;
- limitação de frequência nos endpoints públicos.

Alterar textos não permite remover esses controles. Campos como exigência de CPF e de anexo podem ser configurados sem expor os dados enviados.

## Usuários

O Administrador pode abrir **Central do portal → Usuários e acesso** e enviar convites somente para Editor ou Jurídico. O envio depende de SMTP configurado no `deploy/.env`.

Não compartilhe a conta administrativa. Cada pessoa deve usar sua conta, e acessos de quem saiu da equipe devem ser desativados imediatamente.

## Imagens Docker e atualizações

As imagens-base estão fixadas por versão e digest. Alterações do código entram em uma nova imagem somente após `docker compose build`.

Fluxo seguro recomendado:

```bash
./scripts/update-images.sh
```

O script cria backup, constrói/puxa as imagens, recria os containers e exige health checks saudáveis. O passo a passo completo está em `docs/operacao/docker-imagens-e-atualizacoes.md`.

## Backup e restauração

O backup inclui PostgreSQL, uploads, lockfile, Compose, inventário das imagens e checksums. Segredos não são copiados.

```bash
./scripts/backup.sh
./scripts/restore.sh --confirm backups/portalsindquim-AAAAMMDDTHHMMSSZ.tar.gz
```

Guarde cópias fora do servidor, com criptografia e política de retenção. Um backup só é confiável depois de um ensaio de restauração.

## Testes

```bash
npm --prefix site run test:ci
node scripts/test-integracao.mjs
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
```

A suíte cobre tipos, build, regras editoriais, sanitização, operações de Docker e integração real com as políticas do Directus. O teste de integração cria somente registros temporários marcados e os remove ao terminar.

## Conteúdo demonstrativo

`scripts/directus-conteudo-exemplo.mjs` publica quatro notícias, quatro benefícios e exemplos da página jurídica. Todo conteúdo é prefixado com `[DEMONSTRAÇÃO]`, usa apenas imagens locais e precisa ser substituído antes da publicação oficial.

## Instatic

A avaliação técnica está em `docs/research/2026-07-21-instatic-avaliacao.md`. A versão estudada é pré-1.0 e fica restrita a um experimento isolado em `experiments/instatic-poc`; ela não substitui Directus, PostgreSQL, autenticação, permissões ou backup do portal.

## Estrutura

```text
portalsindquim/
├── assets/                 mídia local de demonstração
├── deploy/                 Compose, Directus customizado e exemplo de ambiente
├── docs/                   arquitetura, operação, auditorias e pesquisas
├── experiments/            provas de conceito sem dependência de produção
├── scripts/                schema, seeds, testes, backup e atualização
└── site/                   aplicação Astro e central administrativa
```

Leia também:

- `docs/arquitetura.md`
- `docs/conteudo-directus.md`
- `docs/desenvolvimento.md`
- `docs/deploy-checklist.md`
- `docs/lgpd/campos-formularios.md`
