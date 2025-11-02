# Análise: Funções no Frontend vs Backend

## ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **PESOS DAS DISCIPLINAS NÃO ESTÃO SENDO APLICADOS NO BACKEND**

**Frontend (`rankingMutations.ts` - linha 374-407):**
```typescript
const disciplineWeight = disciplineWeights[disciplineType] || 1;
// ...
totalDelta = questionWeight * disciplineWeight;  // ✅ Multiplica peso da questão pelo peso da disciplina
weightedDisciplineDelta = questionWeight * disciplineWeight;
```

**Backend (`calculate_user_score_realtime`):**
```sql
v_weight := COALESCE((v_official_answers->v_question_key->>'weight')::numeric, 1);
-- ❌ NÃO multiplica pelo peso da disciplina!
v_discipline_score := v_discipline_score + v_weight;  -- Apenas soma o peso da questão
```

**Problema**: O backend não lê `discipline.weight` da estrutura `disciplines.blocks[].disciplines[].weight` e não multiplica os scores por esse peso.

**Impacto**: Scores calculados no backend estarão incorretos quando disciplinas têm pesos diferentes de 1.

---

### 2. **CÁLCULO DE `quotaPosition` ESTÁ NO FRONTEND**

**Localização**: `src/services/rankingService.ts` (linhas 202-226)

```typescript
// ✅ Calcular posições por cota (quotaPosition) antes de paginar
const quotaGroups: { [key: string]: typeof rankingData } = {};
rankingData.forEach(ranking => {
  const quota = ranking.reservationType || 'Ampla Concorrência';
  if (!quotaGroups[quota]) {
    quotaGroups[quota] = [];
  }
  quotaGroups[quota].push(ranking);
});

// Calcular quotaPosition para cada grupo (apenas classificados)
Object.keys(quotaGroups).forEach(quota => {
  const quotaRankings = quotaGroups[quota];
  const quotaClassified = quotaRankings.filter(r => {
    const eliminated = !!(r.belowMinimum || ...);
    return !eliminated;
  });
  
  quotaClassified.forEach((ranking, index) => {
    ranking.quotaPosition = index + 1;
  });
});
```

**Problema**: `quotaPosition` deveria ser calculado no backend para garantir consistência e permitir paginação correta.

---

### 3. **ORDENAÇÃO DE RANKINGS ESTÁ NO FRONTEND**

**Localização**: `src/services/rankingService.ts` (linhas 182-200)

```typescript
rankingData.sort((a, b) => {
  const aScore = Number(a.score || 0);
  const bScore = Number(b.score || 0);
  const aEliminated = !!(a.belowMinimum || ...);
  const bEliminated = !!(b.belowMinimum || ...);
  
  // Se um é eliminado e outro não, eliminado vai para o final
  if (aEliminated && !bEliminated) return 1;
  if (!aEliminated && bEliminated) return -1;
  
  // Ordenar por score decrescente
  if (bScore !== aScore) {
    return bScore - aScore;
  }
  
  return (a.userId || '').localeCompare(b.userId || '');
});
```

**Problema**: Ordenação deveria ser feita no backend (via SQL `ORDER BY`) para eficiência e consistência, especialmente com paginação.

---

### 4. **FUNÇÃO `recalculateUserScore` NO FRONTEND AINDA FAZ CÁLCULOS COMPLEXOS**

**Localização**: `src/integrations/supabase/rankings/rankingMutations.ts` (linhas 35-730)

**Problema**: Esta função:
- Busca dados do concurso e usuário
- Calcula scores ponderados (com pesos das disciplinas)
- Calcula mínimos (global, por disciplina, por bloco, por cota)
- Valida e atualiza `consolidated_data`

**Status**: Esta função é chamada em vários lugares (`useSaveAnswers`, `useSaveRanking`, etc.), mas a lógica deveria estar no backend PostgreSQL.

**Nota**: Existe um comentário `// TODO: Migrate this scoring logic to backend Edge Function` (linha 387), mas ainda não foi migrado completamente.

---

## ✅ O QUE JÁ ESTÁ CORRETO

1. **`calculate_user_score_realtime`**: Função PostgreSQL existe e é chamada corretamente
2. **`recalculate_all_scores_with_weights`**: Função PostgreSQL para recálculo em lote existe
3. **Cálculo de mínimos**: Backend já calcula mínimos (global, disciplina, bloco, cota)
4. **Tratamento de "Certo ou Errado"**: Corrigido na última migration

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Prioridade ALTA:
1. **Adicionar aplicação de pesos das disciplinas no backend**
   - Ler `disciplines.blocks[].disciplines[].weight`
   - Multiplicar scores por esse peso
   - Salvar `weightedCustomDisciplineScores` corretamente

### Prioridade MÉDIA:
2. **Migrar cálculo de `quotaPosition` para backend**
   - Calcular durante o recálculo ou em uma função separada
   - Salvar em `consolidated_data`

3. **Migrar ordenação para backend**
   - Usar `ORDER BY` no SQL
   - Garantir ordenação consistente: classificados primeiro, depois eliminados

### Prioridade BAIXA:
4. **Refatorar `recalculateUserScore` para usar apenas backend**
   - Remover lógica de cálculo do frontend
   - Manter apenas chamadas RPC

---

## 📋 PRÓXIMOS PASSOS

1. Corrigir aplicação de pesos das disciplinas no backend
2. Testar com concursos que têm pesos diferentes de 1
3. Migrar cálculo de `quotaPosition` para backend
4. Migrar ordenação para backend
5. Simplificar função `recalculateUserScore` no frontend

