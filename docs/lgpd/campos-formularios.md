# Campos Coletados Nos Formulários

## Formulário de Contato
- Nome (obrigatório)
- E-mail (obrigatório)
- Setor de atendimento (obrigatório)
- Mensagem (obrigatório)
- Consentimento LGPD (obrigatório, checkbox)

## Formulário de Filiação
- Nome completo (obrigatório)
- E-mail (obrigatório)
- Telefone (obrigatório)
- Empresa (opcional)
- Consentimento LGPD (obrigatório, checkbox)

## Pendências
- Texto final da Política de Privacidade ainda não existe — o link nos formulários aponta para `/politica-de-privacidade/`, página a ser criada quando o time jurídico aprovar o texto (fora do escopo deste plano).
- Configuração de SMTP autenticado para envio real de e-mail ainda não foi feita (sem SMTP configurado, o Contact Form 7 usa `wp_mail` padrão do PHP, que não entrega e-mail em produção sem um plugin de SMTP).
