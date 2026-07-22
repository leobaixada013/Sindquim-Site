# Capas editoriais das notícias

Estas imagens são enviadas ao Directus por `scripts/directus-conteudo-sindquim.mjs`.
O script associa cada arquivo a uma matéria, adiciona texto alternativo, legenda e crédito e atualiza publicações existentes sem criar duplicatas.

## Regras de uso

- Não substituir uma capa por logotipo ou placeholder em notícia publicada.
- Manter o crédito e a legenda ao trocar uma fotografia.
- Indicar “imagem ilustrativa” quando a foto não retratar o fato ou o local exato.
- Confirmar autorização ou licença antes da publicação em produção.
- Manter a fonte jornalística original no campo `fonte_url` da matéria.

## Procedência

| Arquivo | Procedência e crédito |
|---|---|
| `olin-guaruja-industria.jpg` | Benoît Prieur / Wikimedia Commons — CC0 |
| `petrobras-rpbc-biorrefino.jpg` | Agência Petrobras — CC BY 4.0 |
| `conselho-desenvolvimento-cubatao.jpg` | Willian Gomes / Secom Cubatão |
| `semana-industria-cubatao.jpg` | Thiego Barbosa / Secom Cubatão |
| `mutirao-emprego-cubatao.jpg` | Secom Cubatão |
| `transicao-tributaria-industria-quimica.jpg` | Senado Federal |
| `sindquim-unigel-articulacao.jpg` | Thiago Macedo / PMC e Júlio César Silva / MDIC |
| `petrocoque-projetos-sociais.jpg` | Divulgação / Comunicação Petrocoque |
| `unipar-modernizacao-cubatao.jpg` | Arquivo Público do Estado de São Paulo / Wikimedia Commons — domínio público |
| `petrobras-qualificacao-industrial.jpg` | Freepik, via Prefeitura de Cubatão |
| `diretoria-sindquim-posse.jpg` | FEQUIMFAR |
| `yara-amonia-renovavel-cubatao.jpg` | Yara International |

Os endereços completos de origem ficam versionados em `IMAGENS_NOTICIAS`, no script de importação.
