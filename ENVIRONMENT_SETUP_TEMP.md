# 🚨 CONFIGURAÇÃO URGENTE DE VARIÁVEIS DE AMBIENTE

## ⚠️ **ERRO ATUAL**
```
Uncaught Error: Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set
```

## 🔧 **SOLUÇÃO IMEDIATA**

### **1. Criar arquivo `.env.local` na raiz do projeto**

Crie um arquivo chamado `.env.local` na pasta raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://ppsymqrdtjyaguftracc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs

# Security Keys (REQUIRED)
VITE_OBFUSCATION_KEY=nomeia_obfuscation_2024_secure_key_32_chars
VITE_URL_OBFUSCATION_KEY=nomeia_url_obfuscation_2024_secure_key_32_chars

# CORS Configuration (REQUIRED for production)
ALLOWED_ORIGIN=http://localhost:8080

# Development Mode
VITE_DEV_MODE=true
VITE_DEBUG_LOGS=true
```

### **2. Reiniciar o servidor de desenvolvimento**

Após criar o arquivo `.env.local`:

1. Pare o servidor (Ctrl+C)
2. Execute: `npm run dev`
3. Acesse: http://localhost:8080

## 🔒 **IMPORTANTE - SEGURANÇA**

### **⚠️ ATENÇÃO:**
- **NUNCA** commite o arquivo `.env.local` para o Git
- **NUNCA** compartilhe as chaves por email/chat
- **APENAS** use essas chaves para desenvolvimento local

### **Para Produção:**
- Use variáveis de ambiente do servidor
- Gere chaves únicas e seguras
- Configure CORS adequadamente

## 🎯 **RESULTADO ESPERADO**

Após criar o arquivo `.env.local` e reiniciar:

✅ **Sistema carregando normalmente**  
✅ **Sem erros de variáveis de ambiente**  
✅ **Rankings funcionando**  
✅ **Todas as funcionalidades ativas**

---

**Status**: 🚨 **AÇÃO IMEDIATA NECESSÁRIA**  
**Prioridade**: **CRÍTICA** - Sistema inutilizável sem configuração
