# Remover Funções Edge Duplicadas

## Funções a Remover

As seguintes funções são duplicadas e não são mais utilizadas:

1. **`create-mercadopago-preference`** (versão 9)
   - ❌ Versão antiga/duplicada
   - ✅ Substituída por: `create-mp-preference` (versão 42)

2. **`mercadopago-webhook`** (versão 13)
   - ❌ Versão antiga/duplicada
   - ✅ Substituída por: `mp-webhook` (versão 31)

## Funções Mantidas

As seguintes funções estão ativas e devem ser mantidas:

- ✅ **`create-mp-preference`** (versão 42) - Usada pelo frontend
- ✅ **`mp-webhook`** (versão 31) - Usada pelo Mercado Pago

## Como Remover via Dashboard

1. Acesse: https://supabase.com/dashboard/project/ppsymqrdtjyaguftracc/functions

2. Para cada função duplicada:
   - Clique na função (`create-mercadopago-preference` ou `mercadopago-webhook`)
   - Clique no menu "..." (três pontos)
   - Selecione "Delete" ou "Remove"
   - Confirme a remoção

## Verificação

Após remover, verifique que apenas estas funções permanecem relacionadas ao Mercado Pago:
- ✅ `create-mp-preference`
- ✅ `mp-webhook`

## Nota

As funções duplicadas não têm arquivos locais (já foram removidas do código), mas ainda existem no Supabase. A remoção pelo dashboard é necessária para limpar completamente.

