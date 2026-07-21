# PoC isolada do Instatic

Esta instalação serve somente para comparar a experiência editorial do Instatic 0.0.11 com o Directus simplificado. Ela não integra, não sincroniza e não substitui o portal de produção.

Regras desta PoC:

- usar apenas dados e imagens fictícios;
- não criar usuários reais nem chamados jurídicos;
- não expor a porta fora de `127.0.0.1`;
- não instalar plugins sem revisão;
- não tratar o export de site como backup completo;
- apagar os volumes quando a avaliação terminar.

## Executar

```bash
cd experiments/instatic-poc
cp .env.example .env
docker compose --env-file .env up -d --wait
```

Acesse <http://localhost:3029/admin>. Em Macs ARM, Docker usa emulação porque a imagem oficial avaliada só possui arquitetura amd64.

## Encerrar

```bash
docker compose down
```

Para descartar também todos os dados fictícios da PoC:

```bash
docker compose down -v
```

Esse último comando é destrutivo apenas para os volumes do projeto `portalsindquim-instatic-poc`; não o execute no Compose principal.

Critérios e riscos estão documentados em `../../docs/research/2026-07-21-instatic-avaliacao.md`.
