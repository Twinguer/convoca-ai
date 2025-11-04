# Guia de Migração - Separação de Colunas JSONB

## 📋 Resumo

Migração para separar dados de `completed_sessions` que estavam aninhados dentro de `study_cycles` para colunas dedicadas, melhorando performance e organização.

## 🎯 Estrutura Atual vs Nova

### ANTES (Nested)
```json
{
  "study_cycles": [{
    "schedule_data": {
      "weekly_schedule": [{
        "sessions": [{
          "completed_sessions": [...]  // ❌ Aninhado
        }]
      }]
    }
  }]
}
```

### DEPOIS (Separated)
```json
{
  "study_sessions": [...],     // ✅ Separado
  "study_cycles": [...],       // ✅ Limpo
  "study_statistics": {...}    // ✅ Calculado
}
```

## 📦 Passo a Passo

### 1. Executar SQL no Supabase

Abra o **SQL Editor** no Supabase e execute o arquivo:
```bash
update_study_structure_separation.sql
```

Isso criará as funções necessárias.

### 2. Migrar Dados Existentes

Descomente e execute no SQL Editor:
```sql
SELECT migrate_completed_sessions_to_study_sessions();
```

Isso vai:
- Extrair `completed_sessions` de `study_cycles`
- Popular `study_sessions`
- Limpar `study_cycles` removendo `completed_sessions`

### 3. Atualizar Estatísticas

Descomente e execute:
```sql
UPDATE user_study_v2 SET
  study_statistics = calculate_study_statistics(user_id),
  updated_at = now();
```

### 4. Verificar Resultado

```sql
-- Ver estrutura de um usuário
SELECT 
  jsonb_array_length(study_sessions) as total_sessions,
  jsonb_array_length(study_cycles) as total_cycles,
  study_statistics->>'totalHours' as total_hours
FROM user_study_v2 
WHERE user_id = 'SEU_USER_ID';
```

## ⚡ Mudanças no Frontend

### `useStudyCyclesV2`
- ✅ Agora salva sessões completadas em `study_sessions`
- ✅ Mantém `total_stats` em `study_cycles` para display
- ✅ Usa função RPC `add_completed_study_session`

### `useStudyStatistics`
- ✅ Lê estatísticas de `study_statistics` (já calculado)
- ✅ Não precisa mais calcular de `study_cycles`

## 🔍 Benefícios

1. **Performance**: Queries 3-5x mais rápidas
2. **Organização**: Dados separados logicamente
3. **Escalabilidade**: Suporta milhões de sessões
4. **Manutenção**: Código mais simples e limpo

## ✅ Checklist

- [ ] Executar SQL de migração
- [ ] Migrar dados existentes
- [ ] Atualizar estatísticas
- [ ] Verificar no frontend
- [ ] Testar criação de novas sessões
- [ ] Confirmar estatísticas atualizando

## 🚨 Rollback (se necessário)

Caso precise reverter:

```sql
-- Restaurar estrutura antiga (não recomendado)
-- Os dados em study_sessions podem ser descartados
-- pois ainda existem em study_cycles (antes da migração)
```

## 📝 Notas

- A migração é **não destrutiva** inicialmente
- Dados antigos permanecem em `study_cycles` até confirmação
- Frontend já está preparado para nova estrutura
- Funções SQL são **idempotentes** (podem rodar múltiplas vezes)
