# Auditoria final de fluxo e interface

Data: 21 de julho de 2026  
Ambiente: Docker local, Astro `http://localhost:4421`, Directus `http://localhost:8155`  
Viewports: 1440 × 1000 e 390 × 844

## Percurso auditado

1. Abri a home em desktop e confirmei banner de demonstração, navegação, notícia em destaque e últimas notícias.
2. Abri Benefícios e confirmei título, orientação em três passos, filtros e quatro cards demonstrativos.
3. Abri Jurídico e confirmei apresentação, temas, plantão, triagem, aviso de privacidade e FAQ.
4. Repeti a home em 390 px, abri o menu e conferi toque, leitura e ausência de rolagem horizontal.
5. Acessei `#agendamento` diretamente no celular e verifiquei a posição da âncora sob o menu fixo.
6. Entrei na central Astro como Administrador e confirmei tarefas de notícia, benefícios, Jurídico e usuários.
7. Entrei no Directus com uma conta Editor local em português.
8. Abri **Criar Notícia** e conferi o fluxo em três grupos, com complementos recolhidos e rascunho como padrão.
9. Abri **Textos do Jurídico** e conferi os quatro grupos de edição e as notas que preservam privacidade/consentimento.

## Problemas encontrados e corrigidos durante a auditoria

| Prioridade | Problema observado | Correção aplicada | Verificação |
| --- | --- | --- | --- |
| P0 | A API pública possuía notícias, mas Astro recebia `403` ao pedir `agendado_para`, deixando a home vazia | campo incluído na leitura pública restrita de `posts` | quatro notícias aparecem na home e integração passa |
| P0 | O Administrador aparecia sem função porque Directus 11 registra `admin_access` na Policy, não na Role | leitura aninhada de Policies e helper único de autorização | central mostra as seis tarefas; APIs de usuários/Jurídico continuam restritas |
| P1 | O hash `#agendamento` deixava o título sob o menu fixo no celular | `scroll-margin-top` global para alvos internos | título completo visível em 390 px |
| P1 | O menu Directus do Editor exibia muitas coleções auxiliares e nomes técnicos | coleções auxiliares ocultadas, sete destinos ordenados e rótulos curtos | navegação cabe no painel e começa por Notícias |
| P1 | Os 27 campos públicos do Jurídico apareciam sem hierarquia | grupos Apresentação, Triagem protegida, Outros títulos e Busca | edição principal aberta; complementos recolhidos |
| P2 | A entrada da central usava “premium”, “headless” e “Directus” sem ajudar a tarefa | texto reescrito em linguagem direta | tela orienta apenas e-mail, senha e próxima ação |

Não ficaram achados P0/P1 abertos nesta rodada. O chrome padrão do Directus ainda contém ícones próprios da plataforma; a central Astro reduz essa exposição ao levar a pessoa diretamente à tarefa.

## Acessibilidade estrutural

Nas três páginas públicas, em viewport móvel, a verificação automatizada encontrou:

- exatamente um `h1` por página;
- nenhuma imagem sem atributo `alt`;
- nenhum campo ou botão sem nome acessível;
- nenhuma rolagem horizontal em 390 px.

A navegação possui skip link, regiões semânticas, estado expandido no menu e labels nos formulários. Isso não substitui uma certificação WCAG nem testes com usuários e tecnologias assistivas reais.

## Evidências

- [Home desktop](01-home-desktop.png)
- [Benefícios desktop](02-beneficios-desktop.png)
- [Jurídico desktop](03-juridico-desktop.png)
- [Home mobile](04-home-mobile.png)
- [Menu mobile aberto](05-menu-mobile.png)
- [Triagem jurídica mobile](06-juridico-form-mobile.png)
- [Central administrativa Astro](07-central-admin.png)
- [Nova notícia no Directus](08-directus-nova-noticia.png)
- [Jurídico editável no Directus](09-directus-juridico-editavel.png)
