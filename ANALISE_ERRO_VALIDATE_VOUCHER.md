# 🔍 Análise do Erro: validate_discount_voucher

**Data:** 07 de Janeiro de 2025  
**Erro:** `Could not find function public.validate_discount_voucher(voucher_code_parameter)`

---

## 🔴 Problema Identificado

### Erro Original
```
Could not find function public.validate_discount_voucher(voucher_code_parameter)in the schema
```

### Causa Raiz

A função `validate_discount_voucher` existe no banco de dados, mas havia uma inconsistência no nome do parâmetro:

1. **Migração original** criava a função com parâmetro: `voucher_code_param`
2. **Código TypeScript** chama com: `voucher_code_param` ✅
3. **Função no banco** tinha parâmetro: `voucher_code` ❌ (inconsistente)

### Onde a Função é Chamada

1. **Frontend (`src/hooks/useSubscription.tsx`):**
   ```typescript
   const { data, error } = await supabase.rpc('validate_discount_voucher', {
     voucher_code_param: code.trim().toUpperCase()
   });
   ```

2. **Edge Function (`supabase/functions/create-mp-preference/index.ts`):**
   ```typescript
   const { data: voucherData, error: voucherError } = await supabaseClient.rpc(
     'validate_discount_voucher',
     { voucher_code_param: voucherCode.trim().toUpperCase() }
   );
   ```

---

## ✅ Solução Aplicada

### Migração Criada

Criei uma migração para corrigir a função e garantir que:
1. ✅ O parâmetro seja `voucher_code_param` (consistente com o código)
2. ✅ A função tenha permissões corretas (`authenticated` e `anon`)
3. ✅ O `search_path` esteja configurado corretamente

### Código da Migração

```sql
CREATE OR REPLACE FUNCTION validate_discount_voucher(voucher_code_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- ... (código da função)
$$;

GRANT EXECUTE ON FUNCTION validate_discount_voucher(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_discount_voucher(TEXT) TO anon;
```

---

## 📋 Verificações Realizadas

### 1. Função Existe no Banco ✅
```sql
SELECT routine_name, routine_schema
FROM information_schema.routines
WHERE routine_name = 'validate_discount_voucher';
-- Resultado: função existe no schema public
```

### 2. Parâmetro Corrigido ✅
Após a migração, o parâmetro está correto: `voucher_code_param`

### 3. Permissões Configuradas ✅
- `authenticated` pode executar
- `anon` pode executar (para Edge Functions)

---

## 🧪 Como Testar

### Teste 1: Validar Cupom no Frontend

1. Acesse a página `/planos`
2. Clique em "Aplicar cupom"
3. Digite um código de cupom válido
4. Clique em "Validar"
5. Deve funcionar sem erros

### Teste 2: Validar Cupom na Edge Function

1. Crie uma preferência de pagamento com cupom
2. Verifique os logs da Edge Function
3. Deve processar o cupom corretamente

### Teste 3: Verificar no Banco

```sql
-- Testar a função diretamente
SELECT validate_discount_voucher('CODIGO_TESTE');
```

---

## 📊 Estrutura da Função

### Parâmetros
- `voucher_code_param` (TEXT) - Código do voucher a ser validado

### Retorno
```json
{
  "valid": true/false,
  "discount_type": "percentage" | "fixed",
  "discount_value": number,
  "plan": string,
  "description": string,
  "error": string (se inválido)
}
```

### Validações Realizadas

1. ✅ Voucher existe
2. ✅ Voucher está ativo (`is_active = true`)
3. ✅ Voucher não excedeu uso máximo (`current_uses < max_uses`)
4. ✅ Voucher não expirou (`expires_at IS NULL OR expires_at > NOW()`)
5. ✅ Voucher é do tipo `discount`
6. ✅ Campos de desconto estão configurados
7. ✅ Desconto percentual está entre 0 e 100

---

## 🔗 Arquivos Relacionados

1. **Migração:** `supabase/migrations/20250201000000_add_voucher_discount_support.sql`
2. **Hook:** `src/hooks/useSubscription.tsx`
3. **Edge Function:** `supabase/functions/create-mp-preference/index.ts`
4. **Página:** `src/pages/Planos.tsx`

---

## ✅ Status

- ✅ Função corrigida
- ✅ Parâmetro consistente
- ✅ Permissões configuradas
- ✅ Pronto para testar

**O erro deve estar resolvido agora!**

