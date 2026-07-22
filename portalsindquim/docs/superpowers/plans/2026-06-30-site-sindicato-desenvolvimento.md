# Site Institucional Do Sindicato Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o mockup HTML aprovado em um site institucional real para sindicato, com CMS, blog/notícias, avisos condicionais, banners, podcast, YouTube, Instagram, documentos, formulários, LGPD, SEO, acessibilidade e rotina de manutenção.

**Architecture:** A trilha recomendada é WordPress tradicional com tema customizado baseado no mockup atual. O WordPress será usado como CMS para equipe não técnica publicar páginas, posts, documentos, avisos, banners, vídeos e podcasts; o tema controla a apresentação e as regras de exibição. A alternativa moderna é Astro/Next.js com CMS headless, mas deve ser escolhida apenas se houver equipe técnica para manter a stack.

**Tech Stack:** HTML/CSS/JS do mockup atual, WordPress, PHP, tema customizado, campos personalizados, plugins mínimos de SEO/cache/segurança/formulários/SMTP/backup, YouTube embeds, Instagram embed ou feed curado, player/link de podcast, WhatsApp links, analytics opcional.

---

## 1. Estado Atual

**Pasta do projeto:** `C:\Users\Eduardo\OneDrive\Documentos\site sindicato`

**Arquivos existentes:**
- `index.html`: mockup estático da home.
- `styles.css`: estilos do mockup.
- `script.js`: menu mobile, seleção de podcast e regra simulada de avisos condicionais.
- `assets/hero-assembleia-sindicato.png`: imagem principal do banner.
- `design/referencia-home-sindicato.png`: referência visual gerada.
- `screenshots/`: capturas desktop/mobile e estados com/sem avisos.

**Regra já aprovada no mockup:**
- Aviso urgente só aparece se houver aviso cadastrado.
- Avisos rápidos só aparecem se houver aviso cadastrado.
- Se não houver avisos rápidos, o painel some e o layout de notícias se reorganiza sem deixar espaço vazio.

---

## 2. Decisões Antes De Desenvolver

- [ ] Confirmar nome oficial do sindicato.
- [ ] Receber ou criar logo final.
- [ ] Confirmar cores oficiais ou aprovar paleta do mockup: azul-marinho, branco, vermelho e verde/teal.
- [ ] Confirmar contatos: telefone, WhatsApp, e-mail, endereço, horário de atendimento.
- [ ] Confirmar URLs oficiais: Instagram, YouTube, Spotify/podcast, Facebook, LinkedIn, se houver.
- [ ] Confirmar domínio e hospedagem.
- [ ] Confirmar responsável por conteúdo institucional, jurídico e LGPD.
- [ ] Confirmar se haverá área restrita para associado nesta fase ou se fica para fase futura.
- [ ] Confirmar stack final:
  - Recomendada: WordPress tradicional com tema customizado.
  - Alternativa: Astro/Next.js com CMS headless.

**Decisão recomendada:** seguir com WordPress tradicional, porque o sindicato precisa de publicação frequente por equipe editorial, sem depender de programador para cada notícia, aviso ou documento.

---

## 3. Escopo Funcional

### 3.1 Home

- [ ] Cabeçalho com logo, menu, contatos rápidos e CTA de filiação.
- [ ] Banner principal com campanha ou chamada institucional.
- [ ] Faixa de comunicado urgente condicional.
- [ ] Bloco de últimas notícias/blog com destaque.
- [ ] Bloco de avisos rápidos condicional.
- [ ] Acesso rápido para convenção coletiva, benefícios, jurídico e filiação.
- [ ] Podcast em destaque e lista de episódios.
- [ ] Vídeo do YouTube em destaque e lista de vídeos.
- [ ] Bloco de Instagram ou posts sociais curados.
- [ ] CTA de associação.
- [ ] Rodapé com contatos, links úteis, newsletter e links legais.

### 3.2 Páginas Institucionais

- [ ] O Sindicato.
- [ ] História.
- [ ] Diretoria.
- [ ] Base territorial e categoria representada.
- [ ] Estatuto ou documentos institucionais, se forem públicos.
- [ ] Transparência, se aplicável.

### 3.3 Notícias E Blog

- [ ] Listagem de notícias.
- [ ] Página individual de notícia.
- [ ] Categorias: Direitos, Assembleia, Reajuste, Benefícios, Jurídico, Convênios, Campanha Salarial, Comunicados.
- [ ] Busca por texto.
- [ ] Filtro por categoria.
- [ ] Imagem destacada.
- [ ] Compartilhamento social.

### 3.4 Avisos

- [ ] Cadastro de aviso urgente.
- [ ] Cadastro de aviso rápido.
- [ ] Data de início e data de fim.
- [ ] Status ativo/inativo.
- [ ] Link opcional para notícia, página, documento ou URL externa.
- [ ] Ordem/prioridade.

### 3.5 Convenções E Documentos

- [ ] Listagem de convenções, acordos, termos aditivos e PDFs.
- [ ] Filtro por ano.
- [ ] Filtro por tipo de documento.
- [ ] Campo de vigência.
- [ ] Download de PDF.
- [ ] Link para consulta oficial externa, quando aplicável.

### 3.6 Benefícios E Convênios

- [ ] Página de benefícios para associados.
- [ ] Categorias de convênios: saúde, educação, lazer, comércio, jurídico.
- [ ] Regras de uso.
- [ ] CTA para associação.

### 3.7 Filiação

- [ ] Página de filiação.
- [ ] Explicação dos benefícios.
- [ ] Formulário de interesse.
- [ ] Botão WhatsApp.
- [ ] Consentimento LGPD.
- [ ] Mensagem de sucesso.
- [ ] Envio para e-mail da secretaria ou integração com ferramenta escolhida.

### 3.8 Contato

- [ ] Formulário de contato.
- [ ] Setores de atendimento.
- [ ] Endereço e mapa.
- [ ] WhatsApp.
- [ ] Horário de atendimento.
- [ ] Links sociais.

---

## 4. Escopo Não Funcional

- [ ] Site responsivo em desktop, tablet e celular.
- [ ] Painel editorial simples para equipe não técnica.
- [ ] Permissões por perfil: administrador, editor, autor e revisor.
- [ ] URLs amigáveis.
- [ ] SEO técnico básico.
- [ ] Acessibilidade básica: contraste, foco, navegação por teclado, labels, alt text e hierarquia de títulos.
- [ ] Performance aceitável em mobile.
- [ ] SSL obrigatório.
- [ ] Backup automático.
- [ ] Segurança básica de painel e formulários.
- [ ] Documentação de operação.

---

## 5. Arquitetura Recomendada

### 5.1 WordPress Tradicional

**Responsabilidades:**
- WordPress gerencia conteúdo, usuários, uploads, páginas e posts.
- Tema customizado renderiza o visual aprovado no mockup.
- Campos personalizados estruturam avisos, banners, documentos, vídeos e podcasts.
- Plugins mínimos cobrem SEO, cache, segurança, backup, formulários e SMTP.

**Por que usar:**
- Equipe editorial consegue publicar sem programar.
- WordPress já tem papéis e permissões para posts e páginas.
- É mais comum encontrar manutenção para sindicato, associação e entidades institucionais.
- Reduz custo e complexidade em comparação com headless.

**Plugins sugeridos por função, sem travar marca ainda:**
- SEO: plugin de SEO consolidado.
- Campos personalizados: ACF ou equivalente.
- Formulários: plugin com armazenamento e SMTP.
- Cache/performance: plugin de cache compatível com hospedagem.
- Segurança: 2FA, limitação de login, hardening básico.
- Backup: backup automático com destino externo.
- SMTP: envio autenticado de e-mails do site.

### 5.2 Alternativa Moderna

**Stack possível:**
- Frontend: Astro ou Next.js.
- CMS: Directus, Strapi, Sanity ou WordPress Headless.
- Deploy: Vercel, Netlify, Cloudflare Pages ou VPS.

**Usar apenas se:**
- Houver equipe técnica para manter deploy, ambiente, build e integrações.
- Performance e controle técnico forem prioridade maior do que simplicidade editorial.
- O sindicato aceitar operação mais técnica.

**Decisão do plano:** manter WordPress como trilha principal. Se a alternativa moderna for escolhida, criar um plano separado.

---

## 6. Modelo De Conteúdo

### 6.1 Notícia

Campos:
- `titulo`
- `slug`
- `resumo`
- `conteudo`
- `imagem_destacada`
- `categoria`
- `tags`
- `autor`
- `data_publicacao`
- `destaque_home`
- `status`

Regras:
- Publicar na listagem de notícias quando `status = publicado`.
- Aparecer na home se estiver entre as mais recentes ou marcada como destaque.
- Exibir imagem, categoria, data, título, resumo e link.

### 6.2 Aviso Urgente

Campos:
- `titulo`
- `mensagem_curta`
- `link`
- `texto_do_link`
- `prioridade`
- `data_inicio`
- `data_fim`
- `ativo`

Regras:
- Aparece na faixa vermelha da home apenas se `ativo = true` e a data atual estiver entre início e fim.
- Se houver mais de um aviso urgente ativo, exibir o de maior prioridade.
- Se não houver aviso ativo, ocultar a faixa inteira.

### 6.3 Aviso Rápido

Campos:
- `titulo`
- `descricao_curta`
- `link`
- `data_referencia`
- `data_inicio`
- `data_fim`
- `ativo`
- `ordem`

Regras:
- Aparece no painel de avisos rápidos apenas se houver pelo menos um aviso ativo.
- Se não houver avisos ativos, ocultar o painel e reorganizar o layout da área de notícias.
- Limitar a home a 4 ou 5 avisos rápidos.
- Manter página `/avisos` para histórico completo, se aprovado.

### 6.4 Banner

Campos:
- `titulo`
- `subtitulo`
- `imagem`
- `cta_texto`
- `cta_link`
- `ordem`
- `data_inicio`
- `data_fim`
- `ativo`

Regras:
- O banner principal da home usa o primeiro banner ativo por ordem/prioridade.
- Se não houver banner cadastrado, usar banner institucional padrão.

### 6.5 Documento/Convenção

Campos:
- `titulo`
- `tipo`
- `ano`
- `vigencia_inicio`
- `vigencia_fim`
- `arquivo_pdf`
- `descricao`
- `categoria`
- `status`

Regras:
- Exibir apenas documentos publicados.
- Permitir filtro por ano e tipo.
- PDFs devem abrir em nova aba e oferecer download.

### 6.6 Podcast

Campos:
- `titulo`
- `numero_episodio`
- `descricao`
- `capa`
- `url_player`
- `plataforma`
- `duracao`
- `data_publicacao`
- `destaque_home`

Regras:
- Exibir episódio destacado na home.
- Exibir lista dos últimos episódios.
- Se não houver podcast cadastrado, ocultar seção ou mostrar chamada institucional aprovada.

### 6.7 Vídeo

Campos:
- `titulo`
- `descricao`
- `url_youtube`
- `thumbnail`
- `data_publicacao`
- `destaque_home`

Regras:
- Exibir vídeo destacado na home.
- Carregar embed de forma leve, preferencialmente após clique.
- Se não houver vídeo cadastrado, ocultar seção ou exibir link para canal.

### 6.8 Instagram

Campos/opções:
- `perfil_instagram`
- `modo_exibicao`: feed curado, embed oficial ou cards manuais.
- `cards_sociais`: imagem, texto, link, ordem.

Regras:
- Preferir feed curado/manual se a integração automática for instável.
- Se integração falhar, exibir cards manuais ou link para perfil.

---

## 7. Estrutura De Páginas

- `/`: home.
- `/o-sindicato`: institucional.
- `/diretoria`: diretoria.
- `/noticias`: listagem de notícias.
- `/noticias/{slug}`: notícia individual.
- `/avisos`: avisos e comunicados.
- `/convencoes`: documentos e convenções.
- `/beneficios`: benefícios e convênios.
- `/juridico`: atendimento jurídico.
- `/filie-se`: filiação.
- `/podcast`: episódios.
- `/videos`: vídeos.
- `/contato`: contato.
- `/politica-de-privacidade`: LGPD.
- `/termos-de-uso`: termos.
- `/transparencia`: opcional, se aplicável.

---

## 8. Fluxo Editorial

Perfis:
- Administrador: configura site, plugins, usuários e estrutura.
- Editor: publica, agenda e revisa conteúdos.
- Autor: cria rascunhos.
- Revisor: revisa textos jurídicos, comunicados e campanhas.

Fluxo:
- [ ] Autor cria conteúdo como rascunho.
- [ ] Revisor confere informações sensíveis.
- [ ] Editor publica ou agenda.
- [ ] Editor define destaque na home, se necessário.
- [ ] Conteúdos com data de expiração deixam de aparecer automaticamente.

Política:
- Comunicados oficiais, textos jurídicos, campanha salarial e documentos devem passar por revisão antes de publicação.
- Nenhum dado pessoal real deve ser publicado sem autorização.

---

## 9. Integrações

### 9.1 YouTube

- [ ] Aceitar URL de vídeo no CMS.
- [ ] Extrair ID do vídeo ou salvar URL completa.
- [ ] Exibir thumbnail na home.
- [ ] Abrir embed somente após clique ou usar embed lazy loaded.
- [ ] Ter fallback com link "Assistir no YouTube".

### 9.2 Instagram

- [ ] Confirmar se a conta é pública.
- [ ] Definir se será embed oficial, plugin autorizado ou cards curados.
- [ ] Evitar scraping.
- [ ] Ter fallback com link para perfil.

### 9.3 Podcast

- [ ] Confirmar plataforma: Spotify, YouTube, Apple Podcasts, RSS ou arquivo próprio.
- [ ] Cadastrar episódio no CMS.
- [ ] Exibir episódio destacado.
- [ ] Linkar para plataforma externa ou incorporar player aprovado.

### 9.4 WhatsApp

- [ ] Criar links com mensagens pré-preenchidas.
- [ ] Separar mensagens por objetivo: filiação, jurídico, benefícios, contato geral.
- [ ] Validar número oficial.

### 9.5 Formulários

- [ ] Formulário de contato.
- [ ] Formulário de filiação/interesse.
- [ ] Campo de consentimento LGPD.
- [ ] Proteção anti-spam.
- [ ] Envio via SMTP autenticado.
- [ ] Registro seguro no painel, se aprovado.

### 9.6 Newsletter

- [ ] Definir ferramenta: Mailchimp, Brevo, RD Station, outra ou lista interna.
- [ ] Capturar consentimento.
- [ ] Enviar confirmação ou double opt-in se a ferramenta permitir.

---

## 10. Design System

Componentes:
- Header/topbar.
- Menu desktop.
- Menu mobile.
- Hero/banner.
- Faixa de comunicado urgente.
- Card de notícia destaque.
- Card de notícia secundária.
- Painel de avisos rápidos.
- Card de acesso rápido.
- Bloco de podcast.
- Bloco de vídeo.
- Card social/Instagram.
- CTA de filiação.
- Footer.
- Botões.
- Links.
- Formulários.
- Estados vazios.

Tokens:
- Cores principais.
- Cores de alerta.
- Tipografia.
- Espaçamentos.
- Bordas e raios.
- Sombras.
- Breakpoints.
- Estados hover/focus.

Telas para aprovar antes do desenvolvimento WordPress:
- [ ] Home desktop.
- [ ] Home mobile.
- [ ] Home sem avisos.
- [ ] Listagem de notícias.
- [ ] Página de notícia.
- [ ] Página de documentos/convenções.
- [ ] Página de filiação.
- [ ] Página de contato.

---

## 11. Plano De Desenvolvimento

### Fase 0: Aprovação Do Mockup

**Files:**
- Review: `index.html`
- Review: `styles.css`
- Review: `script.js`
- Review: `screenshots/home-desktop.png`
- Review: `screenshots/home-mobile.png`
- Review: `screenshots/home-notices-empty.png`
- Review: `screenshots/home-notices-visible.png`

- [ ] Abrir `index.html` no navegador.
- [ ] Revisar cabeçalho e menu.
- [ ] Revisar banner principal.
- [ ] Revisar notícias/blog na home.
- [ ] Revisar estados com e sem avisos.
- [ ] Revisar podcast, YouTube e Instagram.
- [ ] Revisar rodapé.
- [ ] Revisar mobile.
- [ ] Registrar alterações solicitadas.
- [ ] Gerar mockup v2, se necessário.
- [ ] Congelar visual aprovado para virar tema.

### Fase 1: Descoberta E Conteúdo

**Files:**
- Create: `docs/conteudo/sitemap.md`
- Create: `docs/conteudo/inventario-conteudo.md`
- Create: `docs/conteudo/checklist-dados-institucionais.md`

- [ ] Criar sitemap final.
- [ ] Listar conteúdo institucional necessário.
- [ ] Listar documentos e PDFs iniciais.
- [ ] Listar categorias de notícias.
- [ ] Listar benefícios e convênios.
- [ ] Confirmar canais externos.
- [ ] Confirmar responsáveis editoriais.
- [ ] Confirmar LGPD e textos legais.

### Fase 2: Preparar Ambiente WordPress

**Files:**
- Create: `wordpress/` ou ambiente equivalente definido pela hospedagem.
- Create: `docs/ambiente/configuracao-wordpress.md`

- [ ] Instalar WordPress em ambiente de desenvolvimento.
- [ ] Configurar banco de dados.
- [ ] Configurar URLs amigáveis.
- [ ] Criar usuário administrador principal.
- [ ] Criar usuários editoriais iniciais.
- [ ] Instalar tema base customizado.
- [ ] Instalar plugins mínimos aprovados.
- [ ] Configurar SMTP.
- [ ] Configurar backup.
- [ ] Configurar segurança básica.

### Fase 3: Criar Tema Customizado

**Files:**
- Create: `wp-content/themes/sindicato/style.css`
- Create: `wp-content/themes/sindicato/functions.php`
- Create: `wp-content/themes/sindicato/header.php`
- Create: `wp-content/themes/sindicato/footer.php`
- Create: `wp-content/themes/sindicato/front-page.php`
- Create: `wp-content/themes/sindicato/archive.php`
- Create: `wp-content/themes/sindicato/single.php`
- Create: `wp-content/themes/sindicato/page.php`
- Create: `wp-content/themes/sindicato/assets/css/main.css`
- Create: `wp-content/themes/sindicato/assets/js/main.js`
- Create: `wp-content/themes/sindicato/assets/img/`

- [ ] Migrar tokens visuais de `styles.css` para o tema.
- [ ] Migrar header/topbar.
- [ ] Migrar hero.
- [ ] Migrar notícias da home.
- [ ] Migrar avisos condicionais.
- [ ] Migrar acesso rápido.
- [ ] Migrar podcast.
- [ ] Migrar vídeos.
- [ ] Migrar Instagram/cards sociais.
- [ ] Migrar CTA de filiação.
- [ ] Migrar footer.
- [ ] Implementar menu mobile.
- [ ] Garantir que o tema não dependa de conteúdo hardcoded quando o CMS já tiver campos.

### Fase 4: Tipos De Conteúdo E Campos

**Files:**
- Modify: `wp-content/themes/sindicato/functions.php`
- Create or configure: campos personalizados no CMS.
- Create: `docs/cms/modelo-de-conteudo.md`

- [ ] Criar tipo de conteúdo para avisos.
- [ ] Criar tipo de conteúdo para banners.
- [ ] Criar tipo de conteúdo para documentos.
- [ ] Criar tipo de conteúdo para podcasts.
- [ ] Criar tipo de conteúdo para vídeos.
- [ ] Configurar campos de notícia.
- [ ] Configurar campos de aviso urgente.
- [ ] Configurar campos de aviso rápido.
- [ ] Configurar campos de banner.
- [ ] Configurar campos de documento.
- [ ] Configurar campos de podcast.
- [ ] Configurar campos de vídeo.
- [ ] Configurar campos globais do site: telefones, e-mail, endereço, redes sociais, WhatsApp.

### Fase 5: Templates Dinâmicos

**Files:**
- Modify: `wp-content/themes/sindicato/front-page.php`
- Create: `wp-content/themes/sindicato/archive-noticias.php`
- Create: `wp-content/themes/sindicato/single-noticias.php`
- Create: `wp-content/themes/sindicato/archive-avisos.php`
- Create: `wp-content/themes/sindicato/archive-documentos.php`
- Create: `wp-content/themes/sindicato/page-filie-se.php`
- Create: `wp-content/themes/sindicato/page-contato.php`

- [ ] Home busca banner ativo.
- [ ] Home busca aviso urgente ativo.
- [ ] Home oculta aviso urgente quando não houver aviso ativo.
- [ ] Home busca notícias recentes.
- [ ] Home busca avisos rápidos ativos.
- [ ] Home oculta avisos rápidos quando não houver avisos ativos.
- [ ] Home reorganiza layout quando avisos rápidos não existirem.
- [ ] Home busca podcast destacado.
- [ ] Home busca vídeo destacado.
- [ ] Home busca cards sociais ou integração Instagram.
- [ ] Listagem de notícias tem paginação.
- [ ] Listagem de documentos tem filtro por ano e tipo.
- [ ] Página de notícia exibe metadados e compartilhamento.
- [ ] Página de filiação exibe formulário.
- [ ] Página de contato exibe formulário, mapa e contatos.

### Fase 6: Formulários E LGPD

**Files:**
- Create: `docs/lgpd/politica-de-privacidade.md`
- Create: `docs/lgpd/campos-formularios.md`
- Configure: plugin de formulário escolhido.

- [ ] Definir quais dados serão coletados no formulário de contato.
- [ ] Definir quais dados serão coletados no formulário de filiação.
- [ ] Remover campos que não sejam necessários.
- [ ] Adicionar checkbox de consentimento.
- [ ] Adicionar link para política de privacidade.
- [ ] Configurar e-mail de destino.
- [ ] Configurar SMTP.
- [ ] Configurar anti-spam.
- [ ] Testar envio.
- [ ] Testar mensagem de sucesso.
- [ ] Testar armazenamento no painel, se habilitado.

### Fase 7: SEO, Acessibilidade E Performance

**Files:**
- Modify: templates do tema.
- Create: `docs/qa/checklist-seo-acessibilidade-performance.md`

- [ ] Configurar metatítulos e descrições.
- [ ] Configurar Open Graph.
- [ ] Configurar sitemap.
- [ ] Configurar robots.txt.
- [ ] Verificar heading hierarchy.
- [ ] Verificar contraste.
- [ ] Verificar navegação por teclado.
- [ ] Verificar labels de formulário.
- [ ] Verificar textos alternativos em imagens.
- [ ] Otimizar imagens.
- [ ] Implementar lazy loading em imagens e embeds.
- [ ] Evitar carregar embed pesado do YouTube antes do clique, se possível.
- [ ] Rodar Lighthouse.
- [ ] Corrigir problemas críticos.

### Fase 8: Segurança, Backup E Manutenção

**Files:**
- Create: `docs/operacao/rotina-manutencao.md`
- Create: `docs/operacao/backup-e-restauracao.md`
- Create: `docs/operacao/acessos-e-permissoes.md`

- [ ] Ativar SSL.
- [ ] Configurar senhas fortes.
- [ ] Ativar 2FA se disponível.
- [ ] Limitar tentativas de login.
- [ ] Remover usuários desnecessários.
- [ ] Configurar backup automático.
- [ ] Testar restauração de backup.
- [ ] Definir rotina mensal de atualização.
- [ ] Definir responsável por atualizar CMS/plugins/tema.
- [ ] Criar documentação curta para operação editorial.

### Fase 9: Conteúdo Inicial

**Files:**
- Create: `docs/conteudo/conteudo-inicial.md`

- [ ] Cadastrar páginas institucionais.
- [ ] Cadastrar primeiras notícias.
- [ ] Cadastrar avisos de teste.
- [ ] Cadastrar documentos e convenções.
- [ ] Cadastrar benefícios.
- [ ] Cadastrar podcast ou fallback.
- [ ] Cadastrar vídeos.
- [ ] Cadastrar cards sociais ou integração Instagram.
- [ ] Revisar textos com responsável do sindicato.
- [ ] Remover conteúdo fictício antes da publicação.

### Fase 10: Homologação

**Files:**
- Create: `docs/qa/homologacao.md`

- [ ] Testar home com aviso urgente ativo.
- [ ] Testar home sem aviso urgente.
- [ ] Testar home com avisos rápidos.
- [ ] Testar home sem avisos rápidos.
- [ ] Testar listagem de notícias.
- [ ] Testar publicação de notícia.
- [ ] Testar agendamento/expiração de aviso.
- [ ] Testar upload e download de PDF.
- [ ] Testar formulário de contato.
- [ ] Testar formulário de filiação.
- [ ] Testar YouTube.
- [ ] Testar Instagram/fallback.
- [ ] Testar podcast/fallback.
- [ ] Testar WhatsApp.
- [ ] Testar mobile real.
- [ ] Testar desktop.
- [ ] Validar SEO básico.
- [ ] Validar acessibilidade básica.
- [ ] Validar performance.
- [ ] Obter aprovação final.

### Fase 11: Publicação

**Files:**
- Create: `docs/deploy/publicacao.md`

- [ ] Apontar domínio.
- [ ] Ativar SSL.
- [ ] Migrar conteúdo final.
- [ ] Configurar cache em produção.
- [ ] Configurar backups em produção.
- [ ] Configurar e testar SMTP em produção.
- [ ] Testar formulários em produção.
- [ ] Testar links e menus.
- [ ] Enviar sitemap para buscadores, se aplicável.
- [ ] Treinar equipe editorial.
- [ ] Fazer checklist pós-publicação.

---

## 12. Critérios De Aceite

- [ ] A equipe consegue publicar notícia sem editar código.
- [ ] A equipe consegue publicar aviso urgente sem editar código.
- [ ] A equipe consegue publicar aviso rápido sem editar código.
- [ ] Aviso urgente não aparece se não houver aviso ativo.
- [ ] Avisos rápidos não aparecem se não houver avisos ativos.
- [ ] Layout da home não fica com buraco quando não há avisos rápidos.
- [ ] A equipe consegue cadastrar banner.
- [ ] A equipe consegue cadastrar documento/PDF.
- [ ] A equipe consegue cadastrar podcast.
- [ ] A equipe consegue cadastrar vídeo do YouTube.
- [ ] Formulário de contato envia corretamente.
- [ ] Formulário de filiação envia corretamente.
- [ ] Política de privacidade está publicada.
- [ ] Site funciona em celular.
- [ ] Site funciona em desktop.
- [ ] Navegação por teclado funciona nos elementos principais.
- [ ] Imagens principais têm texto alternativo.
- [ ] URLs são amigáveis.
- [ ] Sitemap existe.
- [ ] SSL está ativo.
- [ ] Backup automático está configurado.
- [ ] Existe documentação de operação editorial.

---

## 13. Testes Obrigatórios

### 13.1 Conteúdo Condicional

- [ ] Sem aviso urgente: faixa vermelha não aparece.
- [ ] Com aviso urgente ativo: faixa vermelha aparece.
- [ ] Aviso urgente expirado: faixa vermelha não aparece.
- [ ] Sem avisos rápidos: painel não aparece.
- [ ] Com avisos rápidos ativos: painel aparece.
- [ ] Avisos rápidos expirados: painel não aparece.
- [ ] Mais de cinco avisos rápidos: home exibe apenas limite aprovado.

### 13.2 Editorial

- [ ] Autor cria rascunho.
- [ ] Editor publica.
- [ ] Conteúdo agendado aparece na data correta.
- [ ] Conteúdo expirado sai da home.
- [ ] Upload de PDF funciona.
- [ ] Imagem destacada aparece nas listagens.

### 13.3 Formulários

- [ ] Campos obrigatórios bloqueiam envio vazio.
- [ ] Consentimento LGPD é obrigatório.
- [ ] Mensagem de sucesso aparece.
- [ ] E-mail chega ao destinatário.
- [ ] Anti-spam não bloqueia envio legítimo.

### 13.4 Integrações

- [ ] YouTube carrega ou abre corretamente.
- [ ] Instagram exibe feed/card ou fallback.
- [ ] Podcast abre player ou link externo.
- [ ] WhatsApp abre conversa com mensagem correta.
- [ ] Newsletter registra contato ou exibe erro claro.

### 13.5 Técnico

- [ ] Sem erro JavaScript no console.
- [ ] Sem links quebrados principais.
- [ ] Sem overflow horizontal no mobile.
- [ ] Lighthouse sem falhas críticas.
- [ ] Backup restaura em ambiente de teste.

---

## 14. Cronograma Sugerido

### Semana 1

- Decisões técnicas.
- Conteúdo institucional.
- Sitemap.
- Modelo de conteúdo.
- Aprovação final do mockup da home.

### Semana 2

- Design system.
- Mockups das páginas internas.
- Ambiente WordPress.
- Estrutura inicial do tema.

### Semana 3

- Tipos de conteúdo.
- Campos personalizados.
- Templates da home.
- Regras condicionais de avisos.

### Semana 4

- Notícias.
- Documentos/convenções.
- Benefícios.
- Filiação.
- Contato.
- Integrações externas.

### Semana 5

- Conteúdo inicial.
- SEO.
- LGPD.
- Performance.
- Segurança.
- Backup.

### Semana 6

- Homologação.
- Ajustes finais.
- Treinamento.
- Publicação.
- Checklist pós-publicação.

---

## 15. Riscos

- Conteúdo institucional não chegar em tempo.
- Integração automática do Instagram ficar instável.
- Muitos plugins aumentarem manutenção e risco de segurança.
- Hospedagem fraca prejudicar performance.
- Falta de responsável editorial atrasar homologação.
- Área restrita para associado aumentar escopo além do site institucional.
- Publicação de dados pessoais sem revisão LGPD.

---

## 16. Pendências Para O Eduardo Validar

- [ ] Nome real do sindicato.
- [ ] Logo oficial.
- [ ] Cores oficiais ou aprovação da paleta atual.
- [ ] Stack final: WordPress recomendado ou alternativa moderna.
- [ ] Haverá área restrita para associados agora?
- [ ] Quais páginas institucionais são obrigatórias?
- [ ] Quais documentos devem entrar no lançamento?
- [ ] Qual ferramenta de newsletter será usada?
- [ ] Instagram será feed automático ou cards curados?
- [ ] Podcast já existe em alguma plataforma?
- [ ] Quem aprova textos jurídicos e LGPD?

---

## 17. Próxima Ação Recomendada

Antes de iniciar o desenvolvimento real, aprovar ou ajustar:

1. Visual da home atual.
2. Sitemap.
3. Modelo de conteúdo.
4. Stack final.
5. Cronograma.
6. Páginas internas prioritárias.

Depois disso, criar o plano de implementação específico da stack escolhida. Se WordPress for aprovado, o próximo plano deve detalhar arquivos do tema, campos personalizados, queries da home e configuração de plugins.
