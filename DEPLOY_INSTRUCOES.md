# 🚀 Instruções de Deploy - Correção CORS

## ⚠️ Problema Identificado

O erro de CORS está ocorrendo porque a função no Supabase ainda não foi atualizada com o código corrigido.

## ✅ Solução

Você precisa fazer o deploy da função atualizada. Siga os passos abaixo:

### Método 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard:**
   ```
   https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions
   ```

2. **Selecione a função:**
   - Clique em `create-mercadopago-preference`

3. **Substitua o código:**
   - Abra o arquivo `supabase/functions/create-mercadopago-preference/index.ts` localmente
   - Copie TODO o conteúdo
   - Cole no editor do dashboard do Supabase
   - Clique em **Deploy** ou **Save**

### Método 2: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
# Instalar CLI (se necessário)
npm install -g supabase

# Fazer login
supabase login

# Link com o projeto
supabase link --project-ref ppsymqrdtjyaguftracc

# Deploy da função
supabase functions deploy create-mercadopago-preference
```

## 🔍 Verificar se Funcionou

Após o deploy:

1. Teste novamente acessando `http://192.168.0.206:8080/planos`
2. Clique em "Assinar" no plano Pro
3. Verifique se não há mais erro de CORS no console

## 📝 O que foi corrigido

✅ Adicionado suporte para IPs locais (192.168.x.x, 10.x.x.x, 172.16-31.x.x)  
✅ OPTIONS sempre retorna status 200 (corrige preflight)  
✅ Função `isLocalDevelopmentOrigin()` para detectar origens locais  
✅ Headers CORS dinâmicos baseados na origem

---

**Se o erro persistir após o deploy**, verifique:
1. Se a função foi realmente atualizada (veja a data de modificação)
2. Se não há cache do navegador (tente Ctrl+Shift+R)
3. Se há algum erro nos logs da função no dashboard do Supabase

