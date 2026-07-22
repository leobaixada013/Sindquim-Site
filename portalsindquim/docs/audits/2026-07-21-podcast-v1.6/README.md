# Validação do Podcast — versão 1.6.0

Data: 21/07/2026.

## Escopo

- canal `Reação Química em Debate` validado pelo feed público do YouTube;
- central Astro em desktop, Pixel 5, iPhone 13 e viewport compacta de 320 px;
- login, ativação do canal, upload direto da arte, publicação e exibição pública;
- descrição alternativa da arte e ausência de rolagem horizontal;
- permissões reais do perfil Editor com usuário temporário autocontido;
- leitura pública do arquivo enviado e bloqueio de acesso a outras contas.

## Resultado

- `npm run test:ci`: 34 testes unitários/integração, typecheck e build aprovados;
- `npm run test:e2e:mobile`: 21 cenários aprovados nas três larguras e 3 mutações protegidas ignoradas sem credenciais;
- fluxo editorial autorizado: aprovado em Pixel 5;
- teste `scripts/test-podcast-editor-permissions.mjs`: aprovado e com limpeza automática;
- inspeção visual: aprovada depois da correção da pasta pública de uploads e da ocultação do seletor nativo de arquivo.

As imagens desta pasta registram a home e o painel em desktop e celular. O anúncio usado nelas é apenas dado do ambiente local de teste e não deve ser promovido para produção.
