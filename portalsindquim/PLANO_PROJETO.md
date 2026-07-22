# Plano Mestre e Visão do Produto: Sindicato Digital

## Objetivo Final do Projeto
Construir a plataforma sindical mais **moderna, resiliente e profissional** do país. O site deve atuar como uma máquina de conversão (filiação) e comunicação institucional, enquanto o Painel Administrativo deve ser 100% "à prova de macacos" — permitindo que qualquer membro da diretoria atualize o site inteiro com segurança.

Tudo deve ser interligado, com forte blindagem contra erros humanos, segurança contra ataques (XSS) e SEO impecável (dados estruturados e slugs dinâmicos).

---

## O Roteiro de Módulos (Fases)

### ✅ Fase 1: Módulo Notícias (Concluído)
A espinha dorsal da comunicação do sindicato.
- **Coleção**: posts (renomeada a interface para Notícias).
- **Recursos Chave**: Integração do editor Quill, bloqueio de XSS, geração de schema SEO JSON-LD.

### ⏳ Fase 2: Módulo Avisos (Próximo)
Comunicados rápidos e cruciais.
- **Recursos**: Checkbox urgente para fixar o aviso no topo do site.

### ⏳ Fase 3: Módulo Benefícios
Exposição das vantagens sindicalizadas de forma dinâmica.
- **Recursos**: Título, Descrição, Ícone/Imagem, URL do botão.

### ⏳ Fase 4: Módulo Jurídico
Controlar as perguntas frequentes (juridico_faq) e redirecionamentos para matérias explicativas.

### ⏳ Fase 5: Módulo Convenções Coletivas
Coleção de convenções com Ano/Vigência, Categoria e Arquivo PDF anexo.

### ⏳ Fase 6: Módulo Diretoria
Adicionar, desativar e reordenar cargos. Habilitar subcards de redes sociais de cada diretor.

### ⏳ Fase 7: Filie-se e Contato
Edição do texto de convencimento, upload do Formulário PDF e tickets de mensagens.

### ⏳ Fase 8: A Cereja do Bolo (Home Integrada)
Integração completa da Home puxando Notícias, Vitrine Social e Avisos de forma automática.

---

## Princípios de Engenharia da Equipe (Orquestrador + Claude Code)
1. **Ponta a Ponta**: Um módulo só está pronto quando backend, admin e front-end funcionam fluidamente.
2. **Defensivo**: Se um usuário não enviar capa, o site lida de forma graciosa (placeholders).
3. **Padrão de UX no Admin**: Tudo deve ser óbvio, com labels instrucionais.
