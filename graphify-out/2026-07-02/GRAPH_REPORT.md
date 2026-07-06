# Graph Report - .  (2026-07-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 332 nodes · 452 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.96)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fcff63cd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Design System and Typography|Design System and Typography]]
- [[_COMMUNITY_Banner Custom Post Type|Banner Custom Post Type]]
- [[_COMMUNITY_YouTube API Integration|YouTube API Integration]]
- [[_COMMUNITY_Documents and Contact Templates|Documents and Contact Templates]]
- [[_COMMUNITY_Notice Custom Post Type|Notice Custom Post Type]]
- [[_COMMUNITY_UI Mockups and Components|UI Mockups and Components]]
- [[_COMMUNITY_WordPress Loop and Templates|WordPress Loop and Templates]]
- [[_COMMUNITY_Contact Settings Configuration|Contact Settings Configuration]]
- [[_COMMUNITY_Episode Settings Management|Episode Settings Management]]
- [[_COMMUNITY_Knowledge Graph Tooling|Knowledge Graph Tooling]]
- [[_COMMUNITY_Episode List Logic|Episode List Logic]]
- [[_COMMUNITY_Design Principles and Strategy|Design Principles and Strategy]]
- [[_COMMUNITY_Notice Rendering Scripts|Notice Rendering Scripts]]
- [[_COMMUNITY_Project Version Control|Project Version Control]]
- [[_COMMUNITY_Navigation Menu Script|Navigation Menu Script]]
- [[_COMMUNITY_Permalink and Rewrite Rules|Permalink and Rewrite Rules]]
- [[_COMMUNITY_Option Management Tasks|Option Management Tasks]]
- [[_COMMUNITY_Metadata Registration|Metadata Registration]]
- [[_COMMUNITY_Metadata Sanitization|Metadata Sanitization]]

## God Nodes (most connected - your core abstractions)
1. `Task 6 Report` - 31 edges
2. `WordPress Front Page Template` - 25 edges
3. `sindicato_get_youtube_videos` - 21 edges
4. `wp-content/themes/sindicato/archive-documento.php` - 19 edges
5. `functions.php` - 18 edges
6. `sindicato_resolver_youtube_channel_id` - 17 edges
7. `WordPress Archive Template` - 16 edges
8. `WordPress Single Post Template` - 15 edges
9. `sindicato_registrar_cpt_banner` - 15 edges
10. `Home Page Mockup` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Home Page Mockup` --semantically_similar_to--> `Main JavaScript`  [INFERRED] [semantically similar]
  index.html → script.js
- `Home Page Mockup` --conceptually_related_to--> `WordPress Front Page Template`  [INFERRED]
  index.html → wp-content/themes/sindicato/front-page.php
- `Home Page Critique` --references--> `Sindicato Logo`  [INFERRED]
  .impeccable/critique/2026-07-01T20-28-00Z__wp-content-themes-sindicato-front-page-php.md → assets/sindicato-logo.jpeg
- `Home Page Mockup` --references--> `Sindicato Logo`  [EXTRACTED]
  index.html → assets/sindicato-logo.jpeg
- `Home Page Critique` --references--> `Hero Assembleia Sindicato Image`  [EXTRACTED]
  .impeccable/critique/2026-07-01T20-28-00Z__wp-content-themes-sindicato-front-page-php.md → assets/hero-assembleia-sindicato.png

## Import Cycles
- None detected.

## Communities (37 total, 4 thin omitted)

### Community 0 - "Design System and Typography"
Cohesion: 0.05
Nodes (46): Arial, Helvetica, sans-serif, Azul-Aço de Apoio (#4580ac), Body Font, Button Ghost, Button Primary, Button Small, Buttons Component, Cards / Containers Component (+38 more)

### Community 1 - "Banner Custom Post Type"
Cohesion: 0.11
Nodes (33): _sind_ativo, _sind_cta_link, _sind_cta_texto, _sind_data_fim, _sind_data_inicio, _sind_ordem, _sind_subtitulo, absint() (+25 more)

### Community 2 - "YouTube API Integration"
Cohesion: 0.10
Nodes (33): array_slice, empty, esc_attr(), esc_html__, get_option, get_transient, HOUR_IN_SECONDS, is_array (+25 more)

### Community 3 - "Documents and Contact Templates"
Cohesion: 0.08
Nodes (29): Acordo Coletivo, wp-content/themes/sindicato/archive-documento.php, Baixar PDF, .button--primary, .button--small, CF7's own default AJAX response region, CF7 shortcode, Contato (+21 more)

### Community 4 - "Notice Custom Post Type"
Cohesion: 0.09
Nodes (21): add_action, after_switch_theme (hook), Custom Post Type 'aviso', functions.php, get_template_directory, sindicato_data_em_vigencia(), sindicato_get_aviso_urgente_ativo(), sindicato_get_avisos_rapidos_ativos() (+13 more)

### Community 5 - "UI Mockups and Components"
Cohesion: 0.10
Nodes (26): Hero Assembleia Sindicato Image, Sindicato Logo, Design Token: --navy-950, Design Token: --red-600, Design Token: --red-700, News Archive Page Critique, Home Page Critique, Design System Documentation (+18 more)

### Community 6 - "WordPress Loop and Templates"
Cohesion: 0.14
Nodes (21): WordPress Archive Template, esc_html(), WordPress Front Page Template, get_permalink, get_the_category, get_the_date, get_the_excerpt, get_the_post_thumbnail_url (+13 more)

### Community 7 - "Contact Settings Configuration"
Cohesion: 0.19
Nodes (8): ABSPATH, exit, sindicato_contato_defaults(), sindicato_registrar_configuracoes(), sindicato_render_campo_contato(), sindicato_get_contato(), sindicato_get_youtube_videos(), sindicato_resolver_youtube_channel_id()

### Community 8 - "Episode Settings Management"
Cohesion: 0.26
Nodes (9): sindicato_get_proximo_episodio(), sindicato_get_proximo_episodio_valores(), sindicato_proximo_episodio_defaults(), sindicato_registrar_configuracoes_proximo_episodio(), sindicato_render_pe_ativo(), sindicato_render_pe_data_hora_estreia(), sindicato_render_pe_descricao(), sindicato_render_pe_imagem() (+1 more)

### Community 9 - "Knowledge Graph Tooling"
Cohesion: 0.17
Nodes (12): API Cost, AST-only Processing, graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, Graphify Project, graphify explain Command, graphify-out/ Directory, graphify path Command (+4 more)

### Community 10 - "Episode List Logic"
Cohesion: 0.25
Nodes (8): assets/js/main.js, data_hora_estreia, .episode-list button selector, proximo_episodio, sindicato_proximo_episodio, Task 2, Task 3, youtube_url

### Community 11 - "Design Principles and Strategy"
Cohesion: 0.29
Nodes (7): Fidelidade à Marca Já Aprovada Principle, Clareza Antes de Estilo Principle, coolors.co, Design Principles, Mobile First Principle, Um Site, Muitos Motivos de Visita Principle, Urgência tem Hierarquia Visual Própria Principle

### Community 12 - "Notice Rendering Scripts"
Cohesion: 0.29
Nodes (4): menu, menuButton, quickNotices, urgentNotices

### Community 14 - "Project Version Control"
Cohesion: 0.40
Nodes (4): feature/podcast-youtube-unificado, master, Progress: Unificação Podcast/YouTube, tema-wordpress-sindicato

### Community 20 - "Permalink and Rewrite Rules"
Cohesion: 0.67
Nodes (3): permalink_structure, wp rewrite flush, wp rewrite structure

## Ambiguous Edges - Review These
- `wp-content/themes/sindicato/archive-documento.php` → `functions.php`  [AMBIGUOUS]
  .impeccable/critique/2026-07-01T22-04-56Z__wp-content-themes-sindicato-archive-documento-php.md · relation: related_to

## Knowledge Gaps
- **86 isolated node(s):** `menuButton`, `menu`, `urgentNotices`, `quickNotices`, `menuButton` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `wp-content/themes/sindicato/archive-documento.php` and `functions.php`?**
  _Edge tagged AMBIGUOUS (relation: related_to) - confidence is low._
- **Why does `functions.php` connect `Notice Custom Post Type` to `Banner Custom Post Type`, `YouTube API Integration`, `Documents and Contact Templates`, `Contact Settings Configuration`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `WordPress Front Page Template` connect `WordPress Loop and Templates` to `Banner Custom Post Type`, `YouTube API Integration`, `Documents and Contact Templates`, `Notice Custom Post Type`, `UI Mockups and Components`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `Task 6 Report` connect `Banner Custom Post Type` to `Documents and Contact Templates`, `Notice Custom Post Type`, `WordPress Loop and Templates`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `wp-content/themes/sindicato/archive-documento.php` (e.g. with `.button--small` and `GET-based filtering`) actually correct?**
  _`wp-content/themes/sindicato/archive-documento.php` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `menuButton`, `menu`, `urgentNotices` to the rest of the system?**
  _87 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design System and Typography` be split into smaller, more focused modules?**
  _Cohesion score 0.04927536231884058 - nodes in this community are weakly interconnected._