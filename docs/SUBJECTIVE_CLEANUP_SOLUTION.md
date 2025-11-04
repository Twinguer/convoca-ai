# Solução para Persistência de Subjetivas Removidas

## 🎯 Problema Identificado

O sistema estava mantendo pontuações de subjetivas que foram removidas durante edições de ranking, causando discrepâncias na pontuação total dos usuários.

### Cenário do Problema:
1. **Ranking criado** com 3 subjetivas (discursive, case_study_1, case_study_2)
2. **Usuário inseriu pontuações** nas 3 subjetivas
3. **Durante edição**, 2 subjetivas foram removidas (ficou apenas 1)
4. **Sistema preservou** as pontuações antigas das subjetivas removidas
5. **No recálculo**, o sistema somava TODAS as subjetivas (incluindo as removidas)

### Resultado:
- **Interface mostrava**: Apenas 1 subjetiva (10 pontos)
- **Sistema calculava**: 3 subjetivas (10 + pontuações antigas das removidas = 45 pontos)

## 🛠️ Solução Implementada

### 1. Correção no `useSaveAnswers` (src/hooks/useSaveAnswers/index.tsx)

**Antes:**
```typescript
// Preservava valores antigos de subjetivas removidas
const subjectiveValues = {
  discursive: subjectScores?.discursive ?? existingSubjectives.discursive ?? 0,
  case_study_1: subjectScores?.case_study_1 ?? existingSubjectives.case_study_1 ?? 0,
  // ... outras subjetivas
};
```

**Depois:**
```typescript
// Identifica subjetivas ativas e limpa as removidas
const activeSubjectives = {
  discursive: concurso.subjects?.discr === true,
  case_study_1: concurso.subjects?.case1 === true,
  // ... outras subjetivas
};

const subjectiveValues = {
  discursive: activeSubjectives.discursive 
    ? (subjectScores?.discursive ?? existingSubjectives.discursive ?? 0)
    : 0,
  case_study_1: activeSubjectives.case_study_1 
    ? (subjectScores?.case_study_1 ?? existingSubjectives.case_study_1 ?? 0)
    : 0,
  // ... outras subjetivas
};
```

### 2. Validação no `recalculateUserScore` (src/integrations/supabase/rankings/rankingMutations.ts)

**Adicionada validação** para garantir que apenas subjetivas ativas sejam consideradas no cálculo:

```typescript
// Verificar quais subjetivas estão ativas no concurso
const activeSubjectives = {
  discursive: concurso.subjects?.discr === true,
  case_study_1: concurso.subjects?.case1 === true,
  case_study_2: concurso.subjects?.case2 === true,
  case_study_3: concurso.subjects?.case3 === true,
  other_subjective: concurso.subjects?.other === true
};

// Pontuações subjetivas (apenas as ativas)
const discursiveScore = activeSubjectives.discursive ? (subjectiveScores.discursive || 0) : 0;
const caseStudy1Score = activeSubjectives.case_study_1 ? (subjectiveScores.case_study_1 || 0) : 0;
// ... outras subjetivas
```

### 3. Utilitário de Limpeza (src/utils/cleanupRemovedSubjectives.ts)

Criado utilitário para limpar dados antigos em rankings existentes:

- `cleanupRankingSubjectives()`: Limpa um ranking específico
- `cleanupConcursoSubjectives()`: Limpa todos os rankings de um concurso

### 4. Script de Limpeza (scripts/cleanup-removed-subjectives.js)

Script para executar limpeza via linha de comando:

```bash
node scripts/cleanup-removed-subjectives.js <concurso_id>
```

### 5. Interface de Administração (src/components/Admin/SubjectiveCleanup.tsx)

Componente adicionado ao dashboard de administração para executar limpeza via interface web.

## 🔧 Como Usar

### Para Rankings Novos:
A correção é automática. O sistema agora:
1. Identifica quais subjetivas estão ativas no concurso
2. Preserva apenas pontuações de subjetivas ativas
3. Zera pontuações de subjetivas removidas

### Para Rankings Existentes com Problema:

#### Opção 1: Interface Web
1. Acesse o dashboard de administração
2. Use o componente "Limpeza de Subjetivas Removidas"
3. Digite o ID do concurso
4. Execute a limpeza

#### Opção 2: Script de Linha de Comando
```bash
# Navegar para o diretório do projeto
cd /caminho/para/projeto

# Executar limpeza para um concurso específico
node scripts/cleanup-removed-subjectives.js 123e4567-e89b-12d3-a456-426614174000
```

## 📊 Resultados Esperados

### Antes da Correção:
- **Pontuação Total**: 45.00 (incluindo subjetivas removidas)
- **Pontuação Visível**: 25.00 (apenas subjetivas ativas)
- **Discrepância**: 20 pontos

### Depois da Correção:
- **Pontuação Total**: 25.00 (apenas subjetivas ativas)
- **Pontuação Visível**: 25.00 (apenas subjetivas ativas)
- **Discrepância**: 0 pontos

## ⚠️ Importante

1. **Backup**: Sempre faça backup antes de executar limpeza em produção
2. **Teste**: Teste primeiro em ambiente de desenvolvimento
3. **Verificação**: Após a limpeza, verifique se as pontuações estão corretas
4. **Monitoramento**: Monitore logs para identificar possíveis problemas

## 🔍 Logs de Debug

O sistema agora inclui logs detalhados para monitoramento:

```typescript
console.log('[useSaveAnswers] 🔍 Subjetivas ativas no concurso:', activeSubjectives);
console.log('[recalculateUserScore] 📊 Pontuações subjetivas (apenas ativas):', {
  discursive: discursiveScore,
  case_study_1: caseStudy1Score,
  // ... outras subjetivas
});
```

## 🎉 Benefícios

1. **Precisão**: Pontuações totais agora correspondem ao que é exibido na interface
2. **Consistência**: Dados antigos não afetam mais rankings editados
3. **Manutenibilidade**: Sistema mais robusto contra problemas similares
4. **Transparência**: Logs detalhados para debugging
5. **Flexibilidade**: Ferramentas para limpeza de dados existentes

## 📝 Arquivos Modificados

- `src/hooks/useSaveAnswers/index.tsx` - Correção na preservação de dados
- `src/integrations/supabase/rankings/rankingMutations.ts` - Validação no recálculo
- `src/utils/cleanupRemovedSubjectives.ts` - Utilitário de limpeza (novo)
- `scripts/cleanup-removed-subjectives.js` - Script de limpeza (novo)
- `src/components/Admin/SubjectiveCleanup.tsx` - Interface de administração (novo)
- `src/pages/Admin/Dashboard.tsx` - Integração do componente (modificado)

## 🚀 Próximos Passos

1. **Teste** a correção em ambiente de desenvolvimento
2. **Execute** a limpeza em rankings existentes com problema
3. **Monitore** logs para verificar funcionamento
4. **Valide** que pontuações estão corretas após limpeza
5. **Documente** qualquer problema encontrado
