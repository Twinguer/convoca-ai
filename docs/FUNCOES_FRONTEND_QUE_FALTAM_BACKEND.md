# Funções no Frontend que Ainda Não Estão no Backend

## ❌ PROBLEMA CRÍTICO IDENTIFICADO

### 1. **`recalculateUserScore` ainda faz TODOS os cálculos no frontend**

**Localização**: `src/integrations/supabase/rankings/rankingMutations.ts` (linhas 35-730)

**Problema:**
A função `recalculateUserScore` **NÃO está usando** a função PostgreSQL `calculate_user_score_realtime`. Ela está fazendo:
1. ✅ Busca dados do concurso (OK - necessário)
2. ✅ Busca dados do usuário (OK - necessário)
3. ❌ **Calcula scores manualmente no frontend** (linhas 354-430)
   - Itera sobre todas as respostas
   - Calcula `totalDelta`, `disciplineDelta`, `weightedDisciplineDelta`
   - Aplica pesos das disciplinas
   - Calcula scores ponderados e não ponderados
4. ❌ **Calcula mínimos manualmente no frontend** (linhas 550-660)
   - Verifica mínimos globais
   - Verifica mínimos por disciplina
   - Verifica mínimos por bloco
   - Verifica mínimos por cota
5. ❌ **Faz UPDATE direto no banco** (linhas 700-705)
   - Atualiza `consolidated_data` manualmente
   - Não usa a função do backend

**Impacto:**
- Duplicação de lógica entre frontend e backend
- Possibilidade de inconsistências entre os cálculos
- Lógica de negócio exposta no frontend
- Performance pior (cálculos no cliente)
- Difícil manutenção (código duplicado)

**Solução necessária:**
Refatorar `recalculateUserScore` para **apenas chamar** a função PostgreSQL `calculate_user_score_realtime`:

```typescript
export const recalculateUserScore = async (userId: string, concursoId: string) => {
  // 1. Buscar rankingId do usuário
  const { data: userRanking } = await supabase
    .from('user_rankings')
    .select('consolidated_data')
    .eq('user_id', userId)
    .single();
  
  const rankingId = /* encontrar rankingId do consolidated_data */;
  const selectedBooklet = /* obter do consolidated_data */;
  
  // 2. Chamar função do backend
  const { data, error } = await supabase.rpc('calculate_user_score_realtime', {
    p_ranking_id: rankingId,
    p_user_id: userId,
    p_concurso_id: concursoId,
    p_selected_booklet: selectedBooklet
  });
  
  if (error) {
    return { success: false, message: error.message, error };
  }
  
  return { 
    success: true, 
    message: 'Pontuação recalculada com sucesso',
    updatedScore: data 
  };
};
```

**TODO**: Linha 387 tem comentário:
```typescript
// TODO: Migrate this scoring logic to backend Edge Function
// TEMPORARY: Inline scoring calculation (should be in backend)
```

---

## 📊 OUTRAS FUNÇÕES VERIFICADAS

### ✅ **`calculateSecureScore`** - JÁ USA BACKEND
- Localização: `src/services/secureScoring.ts`
- Status: ✅ Usa RPC `calculate_secure_score_with_validation`
- Comentário: "TODOS os cálculos são executados no backend"

### ✅ **`calculateRankingScore`** - JÁ USA BACKEND (Edge Function)
- Localização: `src/services/rankingServiceV3.ts`
- Status: ✅ Usa Edge Function `calculate-ranking-score`

### ✅ **`ScoreForm`** - JÁ USA BACKEND
- Localização: `src/components/resultados/ScoreForm.tsx`
- Status: ✅ Usa RPC `calculate_weighted_scores`

### ✅ **`calculate_ranking_positions`** - NOVA FUNÇÃO NO BACKEND
- Status: ✅ Criada na migration `20250127000016`
- Usa: `calculate_ranking_positions` via RPC

---

## 🔧 AÇÃO NECESSÁRIA

**PRIORIDADE ALTA**: Refatorar `recalculateUserScore` para usar apenas o backend.

**Benefícios:**
1. ✅ Consistência: Mesma lógica no frontend e backend
2. ✅ Segurança: Lógica de negócio não exposta
3. ✅ Performance: Cálculos no servidor
4. ✅ Manutenibilidade: Uma única fonte de verdade
5. ✅ Confiabilidade: Mesmos resultados sempre

**Impacto:**
- Função é chamada em vários lugares:
  - `src/hooks/useSaveAnswers/index.tsx` (linha 246)
  - `src/hooks/useSaveRanking.ts` (linha 455)
  - `src/utils/recalculateUserScores.ts` (linha 32, 55)
  - `src/hooks/useResultadosData.tsx` (import)

**Estimativa:**
- Tempo: ~1-2 horas
- Complexidade: Média
- Risco: Baixo (função do backend já existe e está testada)

---

## 📝 CHECKLIST DE MIGRAÇÃO

- [ ] Identificar todos os lugares que chamam `recalculateUserScore`
- [ ] Refatorar `recalculateUserScore` para chamar apenas RPC
- [ ] Testar com diferentes tipos de concursos:
  - [ ] Alternativas (com pesos diferentes)
  - [ ] Certo ou Errado (com penalidade)
  - [ ] Com mínimos (global, disciplina, bloco, cota)
  - [ ] Com cotas diferentes
- [ ] Verificar que scores calculados são idênticos
- [ ] Remover código de cálculo duplicado do frontend
- [ ] Atualizar documentação

