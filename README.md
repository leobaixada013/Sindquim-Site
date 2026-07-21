# Portal Sindquim — Baixada Santista

Release atual: **1.5.0**.

A implementação mantida está em [`portalsindquim/`](portalsindquim/): site público e central editorial em Astro 7, Directus 11 como CMS e autenticação, PostgreSQL 17 e publicação com Docker Compose.

O portal oferece notícias, benefícios, diretoria, filiação, contato e uma área jurídica informativa e editável. Não há módulos públicos de editais, documentos, acordos ou convenções.

## Começar

```bash
cd portalsindquim
cp deploy/.env.example deploy/.env
node scripts/bootstrap-local.mjs
```

Endereços locais padrão:

- site: <http://localhost:4421>
- central editorial: <http://localhost:4421/admin>
- Directus técnico: <http://localhost:8155/admin>

## Documentação

- [Visão geral e instalação](portalsindquim/README.md)
- [Deploy Docker](portalsindquim/deploy/README.md)
- [Arquitetura](portalsindquim/docs/arquitetura.md)
- [Checklist de deploy](portalsindquim/docs/deploy-checklist.md)
- [Backup, imagens e atualizações](portalsindquim/docs/operacao/docker-imagens-e-atualizacoes.md)
- [Histórico de versões](portalsindquim/CHANGELOG.md)

A estrutura histórica na raiz (`site/`, `deploy/` e `scripts/`) é preservada apenas como referência durante a transição. Novas alterações devem ser feitas em `portalsindquim/`.
