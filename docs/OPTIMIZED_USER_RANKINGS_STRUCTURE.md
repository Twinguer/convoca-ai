# Estrutura JSONB Otimizada para User Rankings

## Visão Geral

Esta documentação descreve a nova estrutura JSONB otimizada para a tabela `user_rankings`, projetada especificamente para atender às necessidades do sistema de rankings de concursos públicos.

## 🎯 Objetivos

- **Performance Superior**: Consultas mais rápidas e eficientes
- **Escalabilidade**: Suporte a milhares de usuários e concursos
- **Flexibilidade**: Estrutura adaptável às regras de negócio
- **Manutenibilidade**: Código mais limpo e organizado
- **Auditoria**: Rastreabilidade completa de alterações

## 📊 Estrutura JSONB

### Estrutura Principal

```json
{
  "rankings": {
    "ranking_concursoId_userId_timestamp": {
      "concurso_id": "uuid",
      "selected_booklet_id": "uuid",
      "score": 0,
      "edit_count": 0,
      "all_questions_answered": false,
      "reservation_type": "Ampla Concorrência",
      "subject_scores": {},
      "subjective_scores": {
        "discursive_score": 0,
        "case_study_1_score": 0,
        "case_study_2_score": 0,
        "case_study_3_score": 0,
        "other_subjective_score": 0
      },
      "weighted_subjective_scores": {
        "weighted_discursive_score": 0,
        "weighted_case_study_1_score": 0,
        "weighted_case_study_2_score": 0,
        "weighted_case_study_3_score": 0,
        "weighted_other_subjective_score": 0
      },
      "custom_discipline_scores": {},
      "weighted_custom_discipline_scores": {},
      "answers": {},
      "status": "participando",
      "below_minimum": false,
      "below_discipline_minimums": [],
      "below_block_minimums": [],
      "general_position": 0,
      "quota_position": 0,
      "accuracy_percentage": 0,
      "total_time_spent": 0,
      "control_metadata": {
        "is_score_recalculated": false,
        "edit_history": [],
        "last_updated": "timestamp",
        "created_at": "timestamp",
        "version": "2.0"
      }
    }
  },
  "metadata": {
    "last_updated": "timestamp",
    "version": "2.0",
    "total_rankings": 0,
    "user_id": "uuid"
  },
  "user_preferences": {
    "notifications_enabled": true,
    "preferred_theme": "light",
    "preferred_language": "pt-BR"
  },
  "user_stats": {
    "total_concursos": 0,
    "total_questions_answered": 0,
    "average_accuracy": 0,
    "best_score": 0,
    "best_score_date": "timestamp"
  }
}
```

## 🏗️ Arquitetura

### Componentes Principais

1. **Tipos TypeScript** (`src/types/userRankings.ts`)
   - Definições completas de tipos
   - Validações e schemas
   - Constantes e enums

2. **Serviço Otimizado** (`src/services/optimizedUserRankingsService.ts`)
   - Operações CRUD otimizadas
   - Cálculos de pontuação
   - Validações de integridade

3. **Hooks React** (`src/hooks/useOptimizedUserRankings.tsx`)
   - Cache inteligente com React Query
   - Invalidação automática
   - Tratamento de erros

4. **Migração SQL** (`supabase/migrations/20250116000011_optimize_user_rankings_jsonb_structure.sql`)
   - Conversão de dados existentes
   - Índices otimizados
   - Funções auxiliares

## 🚀 Funcionalidades

### 1. Gestão de Rankings

```typescript
// Criar ranking
const rankingId = OptimizedUserRankingsService.generateRankingId(concursoId, userId);
const rankingData = OptimizedUserRankingsService.createInitialRankingData(
  concursoId, bookletId, reservationType
);
await OptimizedUserRankingsService.upsertUserRanking(userId, rankingId, rankingData);

// Buscar ranking
const ranking = await OptimizedUserRankingsService.getUserRankingByConcurso(userId, concursoId);

// Atualizar ranking
await OptimizedUserRankingsService.updateUserRanking(userId, rankingId, updatedData);
```

### 2. Cálculo de Posições

```typescript
// Calcular posições de um concurso
const positions = await OptimizedUserRankingsService.calculateConcursoPositions(concursoId);
console.log('Geral:', positions.general);
console.log('Por cota:', positions.quotas);
```

### 3. Estatísticas

```typescript
// Estatísticas de cota
const quotaStats = await OptimizedUserRankingsService.calculateQuotaStatistics(
  concursoId, 'Ampla Concorrência'
);
```

### 4. Validação

```typescript
// Validar dados
const validation = OptimizedUserRankingsService.validateRankingData(rankingData);
if (!validation.isValid) {
  console.log('Erros:', validation.errors);
}
```

## 🎣 Hooks React

### Hook de Participação

```typescript
const {
  userRanking,
  isParticipating,
  canParticipate,
  participate,
  isParticipating: isJoining,
  participationError
} = useConcursoParticipation(concursoId);
```

### Hook de Dashboard

```typescript
const {
  summaries,
  totalRankings,
  activeRankings,
  averageScore
} = useUserRankingsDashboard();
```

### Hook de Posições

```typescript
const { rankings, isLoading } = useConcursoPositions(concursoId);
```

## 📈 Performance

### Índices Otimizados

```sql
-- Índice GIN para consultas rápidas
CREATE INDEX idx_user_rankings_consolidated_data_gin 
ON user_rankings USING GIN (consolidated_data);

-- Índice para consultas por concurso
CREATE INDEX idx_user_rankings_concurso_id 
ON user_rankings USING GIN ((consolidated_data->'rankings'));

-- Índice para consultas por status
CREATE INDEX idx_user_rankings_status 
ON user_rankings USING GIN ((consolidated_data->'rankings'->'*'->'status'));
```

### Funções RPC

```sql
-- Buscar ranking específico
SELECT get_user_ranking_by_concurso(user_id, concurso_id);

-- Buscar rankings de concurso
SELECT * FROM get_concurso_rankings(concurso_id);

-- Atualizar ranking
SELECT update_user_ranking(user_id, ranking_id, ranking_data);
```

## 🔍 Monitoramento

### Views de Consulta

```sql
-- Rankings com perfis de usuário
SELECT * FROM v_user_rankings_with_profiles;

-- Estatísticas de concursos
SELECT * FROM v_concurso_statistics;
```

### Auditoria

```sql
-- Log de alterações
SELECT * FROM user_rankings_audit 
WHERE user_id = 'user-123' 
ORDER BY changed_at DESC;
```

## 🛠️ Migração

### 1. Executar Migração

```bash
# Aplicar migração
supabase db push
```

### 2. Verificar Dados

```sql
-- Verificar contagem
SELECT COUNT(*) FROM user_rankings;

-- Verificar estrutura
SELECT consolidated_data->'metadata'->>'version' as version
FROM user_rankings LIMIT 5;
```

### 3. Testar Funcionalidades

```typescript
// Testar busca
const rankings = await OptimizedUserRankingsService.getUserRankings(userId);

// Testar criação
const success = await OptimizedUserRankingsService.upsertUserRanking(
  userId, rankingId, rankingData
);
```

## 📋 Regras de Negócio

### 1. Participação

- Usuário pode participar de até 5 concursos simultâneos
- Verificação de duplicação por concurso
- Validação de cotas disponíveis

### 2. Pontuação

- Cálculo baseado em respostas corretas
- Aplicação de pesos por disciplina
- Verificação de pontuação mínima

### 3. Classificação

- Ordenação por pontuação (decrescente)
- Cálculo de posições gerais e por cota
- Status: participando, classificado, eliminado

### 4. Auditoria

- Histórico completo de edições
- Timestamp de todas as alterações
- Rastreamento de IP e user agent

## 🔧 Manutenção

### Limpeza de Dados

```sql
-- Remover rankings antigos (exemplo: > 1 ano)
DELETE FROM user_rankings 
WHERE updated_at < NOW() - INTERVAL '1 year';
```

### Otimização

```sql
-- Atualizar estatísticas
ANALYZE user_rankings;

-- Reindexar se necessário
REINDEX INDEX idx_user_rankings_consolidated_data_gin;
```

### Backup

```sql
-- Backup da tabela
CREATE TABLE user_rankings_backup_20250116 AS 
SELECT * FROM user_rankings;
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Performance lenta**
   - Verificar índices
   - Analisar queries com EXPLAIN
   - Considerar particionamento

2. **Dados inconsistentes**
   - Executar validações
   - Verificar triggers de auditoria
   - Recalcular pontuações

3. **Erros de migração**
   - Verificar logs de migração
   - Restaurar backup se necessário
   - Executar migração incremental

### Logs e Debug

```typescript
// Ativar logs detalhados
console.log('Ranking data:', rankingData);
console.log('Validation:', validation);
console.log('Performance:', performanceMetrics);
```

## 📚 Referências

- [Documentação PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Contribuição

Para contribuir com melhorias na estrutura:

1. Criar branch feature
2. Implementar mudanças
3. Adicionar testes
4. Atualizar documentação
5. Criar pull request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.


