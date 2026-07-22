---
name: STI Baixada Santista
description: Site institucional do Sindicato dos Trabalhadores das Indústrias Químicas, Farmacêuticas e de Fertilizantes - Baixada Santista
colors:
  navy-institucional: "#161429"
  navy-institucional-800: "#1d1a36"
  navy-institucional-700: "#282449"
  navy-institucional-600: "#332e5e"
  vermelho-mobilizacao: "#e73a3f"
  vermelho-mobilizacao-escuro: "#d31a1f"
  azul-aco-apoio: "#4580ac"
  azul-aco-apoio-escuro: "#356284"
  papel: "#ffffff"
  neblina: "#f0f1f2"
  linha: "#d2d6db"
  texto: "#41414a"
  texto-suave: "#4f526f"
typography:
  display:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.9rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "normal"
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.65rem, 3vw, 2.4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "normal"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  full: "50%"
spacing:
  sm: "14px"
  md: "22px"
  lg: "28px"
  xl: "72px"
components:
  button-primary:
    backgroundColor: "{colors.vermelho-mobilizacao}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.vermelho-mobilizacao-escuro}"
  button-ghost:
    backgroundColor: "rgba(255,255,255,0.06)"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "0 18px"
  button-small:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.navy-institucional}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
---

# Design System: STI Baixada Santista

## 1. Overview

**Creative North Star: "Movimento Coletivo"**

O sistema visual carrega um duplo sentido deliberado: movimento como mobilização coletiva (a luta da categoria, a força de estar organizado) e movimento como qualidade visual (transições responsivas, interações que dão vida à interface). O navy institucional é a base — sério, estável, confiável — sobre o qual o vermelho de mobilização entra como sinal de urgência e ação (avisos, CTAs, chamadas de filiação), e o azul-aço de apoio aparece como reforço secundário sem competir com o vermelho pela atenção do visitante.

O sistema rejeita explicitamente dois extremos citados no PRODUCT.md: o visual datado de "sindicato panfleto" (cores primárias cruas, tipografia dos anos 2000, punho cerrado como clichê repetido) e o visual corporativo genérico e frio (sem identidade de luta, sem calor humano). O equilíbrio fica no meio: institucional o suficiente para transmitir seriedade, com identidade de classe trabalhadora visível na urgência do vermelho e na presença firme do navy — nunca neutro.

**Key Characteristics:**
- Navy como superfície e cor de marca dominante (header, footer, hero, títulos) — não decorativo, é a base.
- Vermelho reservado para urgência e ação: avisos urgentes, botões primários, CTAs de filiação.
- Azul-aço como segunda voz, nunca como concorrente do vermelho.
- Movimento responsivo (transições em hover/toque) como parte da identidade, não um adendo.

## 2. Colors

A paleta é deliberadamente restrita: uma cor institucional dominante, uma cor de ação, uma cor de apoio, e uma escala neutra funcional — sem paleta "cheia" de cores decorativas.

### Primary
- **Navy Institucional** (#161429, ramp até #332e5e): cor de marca dominante. Usada no header/topbar, footer, fundo do hero, títulos de seção (`h1`/`h2`), overlays de cards escuros (destaque de podcast). É a cor que mais aparece na página — a "voz" visual do sindicato.

### Secondary
- **Vermelho de Mobilização** (#e73a3f, escuro #d31a1f): reservado para urgência e chamada à ação — botão primário, faixa de aviso urgente (`.alert-strip`), selo "Próximo episódio", rótulos de seção (`.section-label`). **The One Signal Rule.** Se está em vermelho, é ação ou urgência — nunca decoração.

### Tertiary
- **Azul-Aço de Apoio** (#4580ac, escuro #356284): destaque secundário em gradientes de cartão (acesso rápido, cards do Instagram sem foto). Reforça sem competir com o vermelho — usado sempre em conjunto com o navy, nunca sozinho como cor dominante de uma seção inteira.

### Neutral
- **Papel** (#ffffff): fundo padrão das seções de conteúdo (notícias, Instagram).
- **Neblina** (#f0f1f2): fundo alternado de seção (acesso rápido, mídia) para criar ritmo entre seções brancas e levemente acinzentadas.
- **Linha** (#d2d6db): divisores e bordas sutis (menu sticky, listas).
- **Texto** (#41414a): cor de corpo de texto padrão — contraste ≥4.5:1 verificado sobre papel e neblina.
- **Texto Suave** (#4f526f): metadados, legendas, texto secundário — ainda dentro do limite de contraste aceitável para o tamanho em que é usado.

### Named Rules
**The One Signal Rule.** O vermelho de mobilização é usado exclusivamente para urgência/ação (avisos, CTAs). Nunca decorativo, nunca em elementos neutros.

## 3. Typography

**Display Font:** Arial, Helvetica, sans-serif (system stack — sem webfont dedicada hoje)
**Body Font:** Arial, Helvetica, sans-serif (mesma família em todos os pesos/tamanhos)

**Character:** Hoje a hierarquia é construída inteiramente por tamanho, peso e letter-spacing sobre uma única família de sistema — não há um par de fontes distinto (display vs. corpo). Isso é um estado honesto do sistema atual, não uma escolha de marca deliberada; é um candidato natural para o comando `typeset` numa passada futura de polish, já que o PRODUCT.md pede clareza e uma identidade mais "designed" sem soar corporativo genérico.

### Hierarchy
- **Display** (700, `clamp(2.5rem, 5vw, 4.9rem)`, altura de linha 0.98): título do hero, uma vez por página.
- **Headline** (700, `clamp(1.65rem, 3vw, 2.4rem)`, altura de linha 1.05): títulos de seção (`h2`).
- **Title** (700, ~1.45rem): títulos de card em destaque (notícia destacada, podcast destaque).
- **Body** (400, 1rem, altura de linha 1.5): texto corrido, limitado implicitamente pela largura de coluna do grid (não há `max-width` explícito em `ch` hoje — outro candidato de `polish`).
- **Label** (900, 0.78rem, uppercase): rótulos de seção, metadados de post, texto de botão. Hoje funciona como "eyebrow" acima de várias seções — ver Do's and Don'ts.

### Named Rules
**The Weight-Over-Family Rule.** Toda a hierarquia tipográfica hoje vem de peso/tamanho/caixa sobre uma única família — não de troca de fonte. Válido como estado atual; revisar em `typeset` quando houver orçamento para uma segunda família.

## 4. Elevation

O sistema usa sombra ambiente suave para profundidade (`--shadow: 0 18px 55px rgba(4, 21, 40, 0.14)`, tingida na cor do navy institucional, não preto puro), não elevação em camadas tonais. **Direção adotada a partir de agora: sombra suave sem borda** — o padrão atual em alguns cards (notícias, avisos) combina borda de 1px (`var(--line)`) com sombra larga (40px de blur) no mesmo elemento, o que é o anti-padrão "ghost card". Esse ajuste é trabalho para a fase de `polish`, não deste documento — aqui fica registrada a regra que o `polish` deve seguir.

### Shadow Vocabulary
- **Ambiente** (`box-shadow: 0 18px 55px rgba(4, 21, 40, 0.14)`): usado em cards de destaque (Instagram, mídia). Tom de sombra vem do navy, não de preto neutro — reforça a identidade da marca até na sombra.
- **Ambiente-suave** (`box-shadow: 0 14px 40px rgba(13, 40, 70, 0.06)`): usado em cards de conteúdo (notícia, aviso). Mais discreta, quase imperceptível — mas atualmente pareada com borda de 1px (ver Don'ts).
- **Botão-ação** (`box-shadow: 0 12px 26px rgba(233, 41, 47, 0.24)`): sombra colorida na cor do próprio botão vermelho, reforça o CTA sem precisar de borda.

### Named Rules
**The No Double-Depth Rule.** Um elemento nunca deve ter borda de 1px E sombra de blur ≥16px ao mesmo tempo. Escolher sombra (para profundidade) ou borda (para definição plana) — nunca os dois.

## 5. Components

### Buttons
- **Shape:** cantos levemente arredondados (6px — `{rounded.sm}`), altura mínima 46px (44px+ para toque confortável em mobile, conforme acessibilidade do PRODUCT.md).
- **Primary:** fundo vermelho de mobilização, texto branco, uppercase, peso 900, sombra colorida sutil. Usado para toda ação principal (CTA de filiação, "Ler comunicado").
- **Hover / Focus:** fundo escurece para o vermelho escuro (#d31a1f) — transição simples, sem efeito de escala.
- **Ghost:** fundo transparente com leve branco (6%), borda branca semi-transparente — usado sobre o hero escuro, para ações secundárias que não devem competir com o botão primário.
- **Small:** variante compacta (altura 38px), fundo branco com borda `--linha` — usado em contextos de card (ex: "Ouvir agora" no podcast).

### Cards / Containers
- **Corner Style:** 8px (`{rounded.md}`).
- **Background:** branco (conteúdo neutro) ou overlay escuro em gradiente navy (cards de destaque como o podcast).
- **Shadow Strategy:** ver Elevation — indo para frente, sombra ambiente sem borda de 1px simultânea.
- **Border:** hoje presente em alguns cards junto com sombra (ver Don'ts); a partir daqui, usar OU borda OU sombra, não ambos.
- **Internal Padding:** 18-20px em cards de conteúdo; 28px em seções de destaque maiores.

### Navigation
- **Style:** barra fixa (`position: sticky`) com fundo branco semi-transparente e `backdrop-filter: blur(18px)` — efeito de vidro sutil e funcional (não decorativo, existe para manter legibilidade sobre conteúdo rolando por trás), portanto não conflita com o banimento geral de "glassmorphism decorativo" da impeccable.
- **Typography:** links em uppercase, peso 800, tamanho 0.8rem.
- **Hover:** cor muda para vermelho de mobilização (`.topbar a:hover`, `.nav-links a:hover`) — consistente com a regra de que vermelho sinaliza interação/ação.
- **Mobile:** botão de menu hambúrguer (`.menu-toggle`) substitui a navegação horizontal; ainda não documentado visualmente em detalhe — candidato de revisão em `audit`/`polish` já que o público é majoritariamente mobile.

### Movimento (novo, a partir deste sistema)
- **Energia:** responsivo — transições suaves em hover/foco/toque, sem coreografia de entrada nem scroll-reveals.
- **Curva de easing:** `ease-out` exponencial (sem bounce/elastic), conforme regra geral da impeccable.
- **Aplicação:** botões (mudança de cor/sombra), links (cor), cards (elevação sutil no hover, quando fizer sentido) — tudo já com fallback de `prefers-reduced-motion` a implementar na fase de `polish`.

## 6. Do's and Don'ts

### Do:
- **Do** usar o vermelho de mobilização exclusivamente para urgência e ação (The One Signal Rule) — nunca como cor decorativa de fundo ou texto neutro.
- **Do** manter o navy institucional como base dominante de marca (header, footer, títulos) — é a "voz" visual do sindicato, não pode ser diluído por excesso de cor secundária.
- **Do** garantir contraste ≥4.5:1 para texto de corpo e ≥3:1 para texto grande em toda nova página — já é prática deste projeto desde a escolha da paleta.
- **Do** manter áreas de toque de no mínimo 44×44px em botões e links de navegação, dado o uso mobile-first.
- **Do** usar transições responsivas (hover/foco/toque) com easing `ease-out`, sempre com alternativa em `prefers-reduced-motion`.

### Don't:
- **Don't** repetir o visual datado de "sindicato panfleto": cores primárias cruas, tipografia dos anos 2000, punho cerrado/bandeira como clichê visual repetido (anti-referência direta do PRODUCT.md).
- **Don't** deixar o site parecer corporativo genérico e frio, sem identidade de luta (segunda anti-referência direta do PRODUCT.md).
- **Don't** combinar borda de 1px com sombra de blur ≥16px no mesmo elemento (The No Double-Depth Rule) — presente hoje em alguns cards de conteúdo; corrigir na fase de `polish`.
- **Don't** adicionar mais rótulos "eyebrow" (texto uppercase pequeno acima de cada seção) do que os já existentes — é um padrão reconhecido de "escrita de IA" quando usado em toda seção; qualquer nova seção deve considerar uma cadência diferente antes de repetir esse padrão.
- **Don't** usar `border-left`/`border-right` coloridos como faixa decorativa de destaque em cards ou avisos.
- **Don't** usar texto em gradiente (`background-clip: text` com gradiente) para ênfase — usar peso ou tamanho.
