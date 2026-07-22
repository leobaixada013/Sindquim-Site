# Sistema De Design Via Impeccable (Sub-Projeto 1 De 5)

## Contexto

O plano estratégico `docs/superpowers/plans/2026-06-30-site-sindicato-desenvolvimento.md` (seção 7) define ~13 URLs para o site, das quais só 5 têm template real hoje: `front-page.php` (home), `archive.php` + `single.php` (notícias), `archive-documento.php` (convenções), `page-contato.php`, `page-filie-se.php`. As demais páginas (institucional, avisos, benefícios, jurídico, plano de saúde, páginas legais) ainda não existem.

Este é o primeiro de 5 sub-projetos para completar o site (a divisão completa foi acordada com o usuário):
1. **Sistema de design (este documento)** — estabelecer o sistema visual nas páginas que já existem, usando a skill `impeccable`.
2. Páginas legais (política de privacidade, termos de uso).
3. Institucional (o-sindicato, diretoria).
4. Avisos (página dedicada).
5. Benefícios + Plano de Saúde + Jurídico.

Os sub-projetos 2-5 vão criar páginas novas seguindo o sistema visual que sair deste sub-projeto — por isso ele vem primeiro.

## Objetivo

Rodar o pipeline da skill `impeccable` (`init` → `document` → `critique`/`audit` → `polish`) nas 5 páginas que já existem, produzindo um `PRODUCT.md`/`DESIGN.md` reutilizáveis e aplicando os ajustes de design encontrados — sem criar nenhuma página nova (isso é trabalho dos sub-projetos 2-5).

## Escopo

**Dentro do escopo:**
- `wp-content/themes/sindicato/front-page.php` (home)
- `wp-content/themes/sindicato/archive.php` + `single.php` (notícias)
- `wp-content/themes/sindicato/archive-documento.php` (convenções)
- `wp-content/themes/sindicato/page-contato.php`
- `wp-content/themes/sindicato/page-filie-se.php`
- `wp-content/themes/sindicato/header.php` / `footer.php` (compartilhados por todas as páginas acima)
- `wp-content/themes/sindicato/assets/css/main.css` / `styles.css` (raiz, mantido em sincronia)

**Fora do escopo:**
- Criar qualquer página/template novo (sub-projetos 2-5).
- Mudar conteúdo institucional/textos (ainda são placeholders — não confirmados).
- Mudar a lógica de negócio já implementada (aviso urgente, banner, próximo episódio, etc.) — só o aspecto visual.

## Restrição-Chave: Marca Já Travada

A identidade visual já foi definida e aprovada nesta mesma sessão, antes deste sub-projeto:
- **Logo:** `assets/sindicato-logo.jpeg` (aplicado em `header.php`/`footer.php`, favicon).
- **Paleta:** definida em `styles.css`/`assets/css/main.css` `:root`, vinda da paleta coolors.co escolhida pelo usuário (`--navy-950: #161429` até `--line: #d2d6db`), com contraste WCAG 2.1 já verificado matematicamente para cada combinação usada no tema.
- **Nome oficial:** "Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista" (STI Baixada Santista).

O comando `/impeccable init` deve tratar esses tokens como **já existentes e aprovados** — a etapa de `palette.mjs` (Setup passo 5 do `SKILL.md` da impeccable) só se aplica a "projeto novo, sem tokens de marca commitados", que **não é o caso aqui**. Isso será informado explicitamente à skill no início da sessão de trabalho, para que ela pule a geração de paleta e trate o `document` como uma captura do sistema já existente (fidelidade à marca, não reinvenção).

## Sequência

1. **`/impeccable init`** — a skill roda sua própria entrevista (registro, público, personalidade de marca, anti-referências, acessibilidade) e escreve `PRODUCT.md`. Register esperado: `brand` (site institucional/marketing, não app/dashboard, conforme a própria definição da skill).
2. **`/impeccable document`** — escaneia o CSS/tokens/logo já existentes e gera `DESIGN.md` capturando o sistema visual atual (paleta, tipografia, componentes, layout).
3. **`/impeccable critique <página>`** e **`/impeccable audit <página>`** — revisão de UX com pontuação e checagem técnica (a11y, performance, responsividade) em cada uma das 5 páginas do escopo.
4. **`/impeccable polish <página>`** — aplica os ajustes encontrados, página por página, informado pelos achados de `critique`/`audit`.

## Verificação

- Cada passo de `polish` é verificado com um screenshot real via Microsoft Edge headless (Chrome está quebrado nesta máquina — sessões existentes impedem modo headless isolado): `"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu --user-data-dir="C:\temp-edge-verify-profile" --screenshot="<caminho>.png" --window-size=1440,1400 <url>`.
- Contraste de cor deve continuar ≥ 4.5:1 para texto de corpo e ≥ 3:1 para texto grande (regra da própria impeccable, já alinhada com o que foi verificado manualmente nesta sessão para a paleta atual).
- `assets/css/main.css` e `styles.css` (raiz) devem permanecer idênticos byte a byte após qualquer mudança de CSS (convenção já estabelecida no projeto).

## Fluxo De Trabalho E Git

- Branch dedicado (ex.: `design/sistema-de-design-impeccable`), a partir de `master`.
- Um commit por página após `polish` + verificação de screenshot.
- Revisão final de branch (mesmo padrão usado nos planos anteriores) antes do merge — mesmo a skill `impeccable` fazendo as edições diretamente, a revisão de branch inteiro continua sendo feita como gate de qualidade antes de ir para `master`.

## Desvio Do Fluxo Padrão De Planejamento

Diferente dos planos anteriores deste projeto, este sub-projeto **não** terá um plano `writing-plans` separado com tarefas/diffs pré-escritos. Os comandos `init` e `document` da própria impeccable **são** o mecanismo de planejamento (produzem `PRODUCT.md`/`DESIGN.md` como artefatos formais), e `critique`/`audit`/`polish` já têm verificação embutida (screenshot, pontuação, checagem técnica). Escrever um plano `writing-plans` redundante em cima disso duplicaria o que a skill já faz melhor. A disciplina de branch + commits + revisão final é mantida para preservar a consistência do restante do projeto.

## Teste

Não há PHPUnit neste ambiente (mesma limitação do resto do projeto). "Teste" para este sub-projeto = os próprios critérios embutidos da impeccable (`critique` com pontuação, `audit` com checagem de a11y/perf/responsividade) + screenshot real via Edge headless antes/depois de cada `polish` + verificação de contraste ≥4.5:1/≥3:1 nas cores usadas.
