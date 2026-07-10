# Documentação do Projeto

Este diretório reúne a documentação técnica do site institucional do STI Baixada Santista.

## Guias principais

- [Arquitetura](arquitetura.md) — visão geral da aplicação, integrações, fluxos de dados e deploy.
- [Desenvolvimento](desenvolvimento.md) — como preparar ambiente local, rodar testes e trabalhar no projeto.
- [Conteúdo no Directus](conteudo-directus.md) — coleções, responsabilidades editoriais e automações do CMS.
- [LGPD: campos de formulários](lgpd/campos-formularios.md) — registro dos campos coletados e pendências legais.
- [Deploy Docker/LXC](../deploy/README.md) — instruções operacionais do ambiente Docker e scripts de backup/deploy.
- [Checklist de deploy](deploy-checklist.md) — lista prática para pré-deploy, pós-deploy e rollback.

## Documentos de produto e design

- [PRODUCT.md](../PRODUCT.md) — público, propósito, princípios e requisitos de acessibilidade.
- [DESIGN.md](../DESIGN.md) — sistema visual, paleta, tipografia, componentes e regras de uso.

## Histórico de implementação

A pasta `docs/superpowers/` guarda planos e especificações usados durante a evolução do projeto. Eles são úteis como trilha de decisões, mas os guias acima devem ser tratados como a documentação operacional atual.

## Manutenção

Ao alterar comportamento relevante do site, conteúdo do Directus, deploy ou scripts de automação:

1. Atualize o guia correspondente neste diretório.
2. Atualize o `README.md` da raiz se a mudança afetar instalação, comandos, variáveis ou deploy.
3. Rode os testes/build aplicáveis.
4. Atualize o grafo do projeto com `graphify update .`.
