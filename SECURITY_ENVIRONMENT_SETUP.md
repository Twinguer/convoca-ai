# 🔒 CONFIGURAÇÃO DE SEGURANÇA - VARIÁVEIS DE AMBIENTE

## ⚠️ **CRÍTICO: CONFIGURAÇÃO OBRIGATÓRIA**

Este arquivo documenta as variáveis de ambiente necessárias para o funcionamento seguro do sistema.

---

## 📋 **VARIÁVEIS OBRIGATÓRIAS**

### **1. Supabase Configuration**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
**Status**: ✅ **CORRIGIDO** - Chaves hardcoded removidas

### **2. Security Keys**
```env
VITE_OBFUSCATION_KEY=your_obfuscation_key_here
VITE_URL_OBFUSCATION_KEY=your_url_obfuscation_key_here
```
**Status**: ✅ **CORRIGIDO** - Chaves fixas substituídas por variáveis

### **3. CORS Configuration**
```env
ALLOWED_ORIGIN=https://yourdomain.com
```
**Status**: ✅ **CORRIGIDO** - CORS restrito a origens específicas

---

## 🚀 **INSTRUÇÕES DE CONFIGURAÇÃO**

### **1. Criar arquivo .env.local**
```bash
# Na raiz do projeto
cp .env.example .env.local
```

### **2. Configurar variáveis**
Edite o arquivo `.env.local` com suas credenciais reais:

```env
# Exemplo de configuração
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_OBFUSCATION_KEY=your_secure_random_key_32_chars
VITE_URL_OBFUSCATION_KEY=your_secure_random_key_32_chars
ALLOWED_ORIGIN=https://nomeiai.lovable.app
```

### **3. Gerar chaves seguras**
```bash
# Gerar chaves de 32 caracteres
openssl rand -hex 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔐 **VERIFICAÇÃO DE SEGURANÇA**

### **1. Verificar se as chaves estão configuradas**
```bash
npm run build
# Deve falhar se as variáveis não estiverem configuradas
```

### **2. Testar conectividade**
```bash
node scripts/verify-supabase.mjs
# Deve conectar com sucesso
```

### **3. Verificar CORS**
- Acesse a aplicação de diferentes origens
- Apenas origens permitidas devem funcionar

---

## ⚠️ **REGRAS DE SEGURANÇA**

### **❌ NUNCA FAÇA:**
- Commit de arquivos `.env.local` ou `.env`
- Hardcode de credenciais no código
- Uso de chaves padrão em produção
- Compartilhamento de chaves por email/chat

### **✅ SEMPRE FAÇA:**
- Use variáveis de ambiente para credenciais
- Gere chaves únicas e seguras
- Rotacione chaves regularmente
- Monitore logs de segurança

---

## 🚨 **STATUS DAS CORREÇÕES**

| Vulnerabilidade | Status | Ação |
|----------------|--------|------|
| **Chaves Hardcoded** | ✅ **CORRIGIDO** | Removidas do código |
| **CORS Aberto** | ✅ **CORRIGIDO** | Restrito a origens específicas |
| **Chaves Fixas** | ✅ **CORRIGIDO** | Substituídas por variáveis |
| **Validação de Origem** | ✅ **IMPLEMENTADO** | Validação no servidor |

---

## 📞 **SUPORTE**

Se encontrar problemas na configuração:
1. Verifique se todas as variáveis estão definidas
2. Confirme que as chaves são válidas
3. Teste a conectividade com o banco
4. Verifique os logs de erro

**Data da Correção**: Janeiro 2025  
**Status**: ✅ **VULNERABILIDADES CRÍTICAS CORRIGIDAS**
