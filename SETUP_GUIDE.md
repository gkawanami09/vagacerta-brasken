# Guia de Setup - Vaga Certa

## ✅ Pré-requisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- MySQL 8.0+ rodando
- Conta Manus para OAuth

## 🚀 Instalação Rápida

### 1. **Clonar/Extrair o Projeto**
```bash
cd /home/ubuntu/vaga_certa_prod
```

### 2. **Instalar Dependências**
```bash
pnpm install
```

### 3. **Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais
# Você precisa de:
# - DATABASE_URL: conexão MySQL
# - VITE_APP_ID: seu app ID do Manus
# - JWT_SECRET: chave secreta para sessões
# - Outras chaves de API do Manus
```

### 4. **Criar Banco de Dados**
```bash
# Criar tabelas
pnpm db:push

# Popular com dados de exemplo
node seed-db.mjs
```

### 5. **Iniciar o Servidor**
```bash
# Modo desenvolvimento
pnpm dev

# O servidor estará em http://localhost:3000
```

---

## 🔧 Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Conexão MySQL | `mysql://user:pass@localhost:3306/vaga_certa` |
| `VITE_APP_ID` | ID da aplicação Manus | `your-app-id` |
| `OAUTH_SERVER_URL` | URL do servidor OAuth | `https://api.manus.im` |
| `JWT_SECRET` | Chave para assinar JWT | `sua-chave-secreta-aqui` |
| `OWNER_NAME` | Nome do proprietário | `João Silva` |
| `OWNER_OPEN_ID` | OpenID do proprietário | `owner-open-id` |
| `BUILT_IN_FORGE_API_KEY` | Chave da API Manus | `sua-chave-api` |
| `VITE_APP_TITLE` | Título da aplicação | `Vaga Certa` |
| `VITE_APP_LOGO` | URL do logo | `https://...` |

---

## 📊 Estrutura do Banco de Dados

O projeto cria automaticamente estas tabelas:

- **users** - Usuários autenticados
- **jobs** - Vagas disponíveis
- **courses** - Cursos recomendados
- **saved_jobs** - Vagas salvas pelos usuários
- **submitted_resumes** - Currículos enviados
- **chat_messages** - Histórico de chat com MAIA
- **user_profiles** - Perfil estendido do usuário

---

## 🧪 Testar o Projeto

### 1. **Acessar a Home**
```
http://localhost:3000
```

### 2. **Fazer Login**
- Clique em "Começar Agora" ou "Já tem conta?"
- Use suas credenciais Manus

### 🔐 Senhas (Login/Signup locais)
- Agora o projeto suporta cadastro e login locais (sem OAuth) via páginas `/signup` e `/login`.
- Regras de senha obrigatórias:
  - 8 a 12 caracteres
  - Pelo menos 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial
- Para habilitar no banco, aplique as migrações:
  ```bash
  pnpm db:push
  ```
  Certifique-se de configurar `DATABASE_URL` no `.env`.

### 3. **Testar Funcionalidades**
- **Vagas:** Acesse `/jobs` e busque vagas
- **Chat:** Vá para `/chat` e converse com MAIA
- **Currículos:** Acesse `/resumes` e faça upload
- **Relatórios:** Veja `/reports` com estatísticas
- **Dashboard:** Acesse `/dashboard` para seu perfil

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@/lib/trpc'"
**Solução:** Verifique se `client/src/lib/trpc.ts` existe e tem o conteúdo correto.

### Erro: "Database connection failed"
**Solução:** Verifique `DATABASE_URL` no `.env` e se MySQL está rodando.

### Erro: "OAuth callback failed"
**Solução:** Verifique `VITE_APP_ID` e `OAUTH_SERVER_URL` no `.env`.

### Erro: "LLM invocation failed"
**Solução:** Verifique `BUILT_IN_FORGE_API_KEY` no `.env`.

---

## 📝 Scripts Disponíveis

```bash
pnpm dev          # Iniciar servidor em modo desenvolvimento
pnpm build        # Build para produção
pnpm start        # Iniciar servidor de produção
pnpm check        # Verificar tipos TypeScript
pnpm format       # Formatar código com Prettier
pnpm test         # Rodar testes
pnpm db:push      # Criar/atualizar schema do banco
```

---

## 🎯 Próximos Passos

1. Personalize a paleta de cores em `client/src/index.css`
2. Adicione mais vagas e cursos ao banco
3. Configure notificações (WhatsApp, Email)
4. Implemente análises (Analytics)
5. Faça deploy em produção

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o arquivo `IMPLEMENTATION_SUMMARY.md`
2. Consulte `userGuide.md` para uso
3. Revise os logs do servidor

**Boa sorte! 🚀**
