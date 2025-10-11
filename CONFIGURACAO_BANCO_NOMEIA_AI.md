# 🚀 Configuração do Banco "Nomeia-AI"

## 📋 Pré-requisitos

1. **Banco Supabase "nomeia-ai" criado**
2. **Credenciais do banco original**
3. **Node.js e npm instalados**

## 🔧 Configuração

### 1. Criar arquivo `.env.local`

```bash
# Banco de desenvolvimento (nomeia-ai)
VITE_SUPABASE_URL=https://[seu-projeto-nomeia-ai].supabase.co
VITE_SUPABASE_ANON_KEY=[sua-chave-anonima-nomeia-ai]
VITE_SUPABASE_SERVICE_ROLE_KEY=[sua-chave-service-role-nomeia-ai]

# Banco de produção (original)
VITE_SUPABASE_URL_ORIGINAL=https://[seu-projeto-original].supabase.co
VITE_SUPABASE_ANON_KEY_ORIGINAL=[sua-chave-anonima-original]
VITE_SUPABASE_SERVICE_ROLE_KEY_ORIGINAL=[sua-chave-service-role-original]

# Flag para identificar ambiente
VITE_BRANCH=nomeia-ai
```

### 2. Instalar dependências

```bash
npm install
```

## 🚀 Scripts Disponíveis

### **Desenvolvimento**
```bash
# Rodar em modo desenvolvimento com banco nomeia-ai
npm run dev:nomeia

# Rodar em modo normal (banco original)
npm run dev
```

### **Migração de Dados**
```bash
# Migrar dados do banco original para nomeia-ai
npm run migrate:nomeia

# Verificar dados migrados
npm run verify:nomeia

# Limpar banco nomeia-ai
npm run cleanup:nomeia
```

## 📊 Estrutura de Configuração

### **Arquivo: `src/config/database.ts`**
- Configuração dinâmica de bancos
- Detecção automática de ambiente
- Fallback para banco original

### **Arquivo: `src/integrations/supabase/client.ts`**
- Cliente Supabase dinâmico
- Suporte a múltiplos bancos
- Cliente administrativo

## 🔄 Fluxo de Migração

1. **Configurar variáveis de ambiente**
2. **Executar migração**: `npm run migrate:nomeia`
3. **Verificar dados**: `npm run verify:nomeia`
4. **Desenvolver**: `npm run dev:nomeia`
5. **Testar**: Aplicação rodando no banco nomeia-ai

## 🧹 Limpeza

```bash
# Limpar banco nomeia-ai (cuidado!)
npm run cleanup:nomeia
```

## ⚠️ Importante

- **SEMPRE** faça backup antes de limpar
- **NUNCA** execute limpeza em produção
- **SEMPRE** verifique as variáveis de ambiente
- **TESTE** a migração antes de usar

## 🎯 Próximos Passos

1. Configurar `.env.local` com suas credenciais
2. Executar `npm run migrate:nomeia`
3. Executar `npm run verify:nomeia`
4. Executar `npm run dev:nomeia`
5. Começar desenvolvimento da nova estrutura
