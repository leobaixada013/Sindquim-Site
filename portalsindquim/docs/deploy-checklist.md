# Checklist de publicação

## Preparação

- [ ] `deploy/.env` contém segredos únicos e fortes.
- [ ] `PORTAL_DEMO=false`.
- [ ] URLs públicas usam HTTPS e o domínio definitivo.
- [ ] SMTP foi testado para convites e mensagens transacionais.
- [ ] administradores, Editores e Jurídico têm contas individuais.
- [ ] conteúdo `[DEMONSTRAÇÃO]` foi substituído ou removido.
- [ ] textos jurídicos e aviso de privacidade foram aprovados por responsável competente.

## Validação técnica

- [ ] `npm --prefix site run test:ci` passa.
- [ ] `node scripts/test-integracao.mjs` passa no ambiente de homologação.
- [ ] containers estão `healthy`.
- [ ] home, notícias, benefícios, jurídico, filiação, sitemap e RSS respondem 200.
- [ ] uma notícia real foi salva como rascunho, revisada e publicada.
- [ ] capa, texto alternativo, galeria, fonte e agendamento foram conferidos.
- [ ] Editor não consegue excluir ou ver chamados/usuários.
- [ ] Jurídico consegue tratar chamado e baixar apenas seu anexo.
- [ ] escrita anônima direta no Directus retorna 403.

## Dados e recuperação

- [ ] `scripts/backup.sh` gerou arquivo e checksum.
- [ ] o backup foi copiado para armazenamento externo criptografado.
- [ ] uma restauração foi ensaiada em ambiente isolado.
- [ ] retenção e descarte de chamados jurídicos foram definidos.

## Atualização

```bash
./scripts/update-images.sh
```

Depois, confira:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.yml ps
curl --fail http://localhost:4421/api/health
```

Mantenha o backup pré-atualização até concluir a inspeção funcional.
