# Vaga Certa - Project TODO

## Design System & Components
- [x] Criar componentes base: Button, Input, Card, Badge, ProgressRing, Chip, Banner, ListItem, AppBar, TabBar, Toast, Modal, BottomSheet
- [x] Implementar paleta de cores (#75182C, #FFFDF5, #1C1C1C, #5A5A5A, #FAF9F4, #2E7D32, #D32F2F, #E6E2D9)
- [x] Configurar tokens de design (raio 14-16px, sombra 8-12px, spacing 8/12/16/24)
- [x] Implementar acessibilidade (contraste AA, áreas de toque 44px, rótulos ARIA)

## Backend (Node.js/tRPC)
- [x] Criar schema de banco de dados (usuários, vagas, cursos, mensagens, currículos)
- [ ] Implementar autenticação e autorização
- [ ] Criar procedures tRPC para cada feature
- [ ] Implementar integração com IA (MAIA)

## Frontend Pages
- [x] Home (Landing/Apresentação)
  - [x] Hero com logo, título e CTAs
  - [x] Seção Dor/Dado (80% estatística)
  - [ ] Cards de pitch (11 cards com modal)
  - [x] Grid de diferenciais (4 itens)
  - [x] Carrossel de depoimentos (rating 4.8/5)
  - [x] FAQ colapsável (5 itens)
  - [x] Rodapé com links

- [x] Cadastro
  - [x] Campos: Nome, E-mail, Senha
  - [ ] Validações com checklist progressivo
  - [ ] Checkbox de termos
  - [x] Feedback visual de sucesso/erro

- [x] Login
  - [x] Campos: E-mail, Senha
  - [ ] Link "Esqueci minha senha"
  - [ ] Botão "Entrar com WhatsApp" (UI)
  - [x] Card de boas-vindas

- [x] Vagas
  - [x] AppBar com busca sticky
  - [ ] Carrossel de vagas recomendadas
  - [x] Lista "Recomendadas para você"
  - [ ] Bottom sheet com filtros
  - [ ] Estados: vazio, skeleton, erro

- [x] Detalhe da Vaga/Empresa
  - [x] Card superior com logo e compatibilidade
  - [x] Seções: Sobre empresa, Descrição, Salário, Processo seletivo
  - [x] Botões: Enviar currículo, Salvar vaga
  - [x] Vagas semelhantes no rodapé

- [x] Relatórios
  - [x] Banner 1: Empresas que combinam (anel de compatibilidade)
  - [x] Banner 2: Currículos enviados (número grande)
  - [x] Banner 3: Cursos recomendados (lista de cards)
  - [x] Filtro temporal (7/30/90 dias)

- [x] Detalhe do Curso
  - [x] Card hero com título e selo (Gratuito/Pago)
  - [x] Seções: Sobre, Habilidades, Carga horária, Preço, Certificação, Oferta por
  - [x] Botões: Acessar curso, Salvar
  - [x] Cursos similares no rodapé

- [x] Chat (MAIA)
  - [x] Balões de mensagem (MAIA e usuário)
  - [x] Cabeçalho com status online/typing
  - [x] Área de entrada: texto, microfone, upload
  - [ ] Sugestões em chips
  - [ ] Estados: upload, erro, visualização

- [x] Currículos
  - [x] Lista de currículos enviados
  - [x] Cards com ícone, título, data, empresa
  - [x] Ação de download
  - [ ] Filtros por período/cargo
  - [x] Estado vazio

- [x] Configuração
  - [x] Card Dados pessoais (editar)
  - [ ] Preferências de candidatura
  - [x] Notificações (toggles)
  - [x] Privacidade e segurança
  - [x] Sobre o app
  - [ ] Botão Sair

## Navigation & Layout
- [ ] Implementar Tab bar inferior (Vagas, Relatórios, Chat, Currículos)
- [x] Implementar AppBar com título centrado
- [x] Implementar navegação hierárquica com ícone de voltar
- [x] Configurar rotas (Home, Signup, Login, Vagas, Chat, Currículos, Configuração)

## Microinterações & UX
- [ ] Feedback de toque em componentes
- [ ] Skeletons para estados de carregamento
- [ ] Pull-to-refresh onde aplicável
- [ ] Toasts para confirmações
- [ ] Modais para conteúdo expandido

## Testes & Qualidade
- [ ] Testar responsividade mobile
- [ ] Validar acessibilidade (WCAG AA)
- [ ] Testar fluxos de autenticação
- [ ] Testar integração frontend-backend
- [ ] Testar performance

## Documentação
- [ ] Criar userGuide.md
- [ ] Documentar API tRPC
- [ ] Documentar componentes do design system

## Melhorias Solicitadas
- [x] Redesenhar Home como landing page profissional
  - [x] Seção Hero melhorada com proposta de valor clara
  - [x] Seção de Estatísticas/Impacto (80% estatística)
  - [x] Cards de Diferenciais (4 itens principais)
  - [x] Carrossel de Depoimentos com rating
  - [x] FAQ colapsável (5 perguntas)
  - [x] Call-to-actions estratégicos
  - [x] Rodapé com links e informações

## Novas Páginas Solicitadas
- [x] Detalhe de Oportunidade/Vaga
  - [x] AppBar com voltar
  - [x] Card hero com logo, título, compatibilidade
  - [x] Seções: Sobre, Descrição, Salário, Processo seletivo
  - [x] Botões: Enviar currículo, Salvar vaga
  - [x] Vagas similares no rodapé

- [x] Relatórios Melhorado
  - [x] Banner 1: Empresas que combinam (anel de compatibilidade)
  - [x] Banner 2: Currículos enviados (número grande)
  - [x] Banner 3: Cursos recomendados (lista de cards)
  - [x] Filtro temporal (7/30/90 dias)
  - [x] Acessibilidade com leitura descritiva

- [x] Detalhe do Curso
  - [x] AppBar com voltar
  - [x] Card hero com título, selo (Gratuito/Pago), thumbnail
  - [x] Seções: Sobre, Habilidades, Carga horária, Preço, Certificação, Oferta por
  - [x] Botões: Acessar curso, Salvar
  - [x] Cursos similares no rodapé

## Dashboard & Navegação
- [x] Criar Dashboard com informações do usuário
  - [x] Card de perfil do usuário (avatar, nome, cargo)
  - [x] Estatísticas: vagas vistas, candidaturas, perfil completude
  - [x] Próximas entrevistas/eventos
  - [x] Recomendações personalizadas
  - [x] Atalhos rápidos para ações

- [x] Implementar Sidebar de Navegação
  - [x] Logo e branding
  - [x] Menu principal (Vagas, Relatórios, Chat, Currículos, Configurações)
  - [x] Ícones e labels
  - [x] Indicador de página ativa
  - [x] Collapse/expand em mobile
  - [x] Integrar em todas as páginas
