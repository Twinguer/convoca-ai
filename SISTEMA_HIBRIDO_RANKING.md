# Sistema Híbrido de Ranking

## Visão Geral

O sistema híbrido permite usar estruturas antigas e novas simultaneamente, mantendo a compatibilidade e permitindo migração gradual.

## Arquitetura

### Estruturas de Dados

#### Estrutura Antiga (Legacy)
- **Tabelas**: `concursos`, `user_rankings`, `user_answers`, `official_answer_weights`
- **Uso**: AnswerSheet (preenchimento de respostas)
- **Vantagens**: Estável, testada, funcionalidades completas

#### Estrutura Nova (V2)
- **Tabelas**: `create_ranking_new`, `user_ranking_new`
- **Uso**: RankingTable (exibição de resultados)
- **Vantagens**: Performance, escalabilidade, flexibilidade

### Configuração

O arquivo `src/config/rankingStructure.ts` controla qual estrutura usar:

```typescript
export const RANKING_STRUCTURE_CONFIG = {
  // Estrutura para AnswerSheet (preenchimento de respostas)
  ANSWER_SHEET_USE_LEGACY: true,
  
  // Estrutura para RankingTable (exibição de resultados)
  RANKING_TABLE_USE_LEGACY: false,
  
  // Sincronização automática entre estruturas
  AUTO_SYNC_ENABLED: true,
  
  // Logs de debug para sincronização
  SYNC_DEBUG_LOGS: false
} as const;
```

## Componentes Implementados

### 1. AnswerSheet Híbrido

**Arquivo**: `src/components/resultados/AnswerSheetHybrid.tsx`

- Interface unificada para ambas as estruturas
- Badge indicando qual estrutura está sendo usada
- Funcionalidades completas de preenchimento de respostas

### 2. Hooks Híbridos

#### `useAnswerSheetHybrid`
**Arquivo**: `src/hooks/useAnswerSheet/useAnswerSheetHybrid.tsx`

- Alterna entre estruturas baseado na configuração
- Interface unificada para o componente

#### `useRankingsLegacyData`
**Arquivo**: `src/hooks/useRankingsLegacyData.tsx`

- Busca dados da estrutura antiga
- Compatível com `useRankingsV2Data`

### 3. Adaptadores

#### `fetchExistingAnswersLegacy`
**Arquivo**: `src/hooks/useAnswerSheet/fetchExistingAnswersLegacy.ts`

- Busca respostas existentes da estrutura antiga
- Converte dados para formato esperado

#### `useSaveAnswersLegacy`
**Arquivo**: `src/hooks/useSaveAnswers/useSaveAnswersLegacy.tsx`

- Salva respostas usando estrutura antiga
- Inclui sincronização automática

### 4. Bridge de Sincronização

**Arquivo**: `src/services/rankingBridge.ts`

- Sincroniza dados entre estruturas
- `syncFromLegacyToNew`: Estrutura antiga → Nova
- `syncFromNewToLegacy`: Estrutura nova → Antiga
- `autoSync`: Sincronização automática após operações

## Fluxo de Dados

### Preenchimento de Respostas (AnswerSheet)

1. **Entrada**: Usuário acessa `/ranking/participate/:token`
2. **Wrapper**: `RankingParticipationWrapper` decide qual estrutura usar
3. **Dados**: `useRankingsLegacyData` busca dados da estrutura antiga
4. **Interface**: `ParticipationForm` renderiza `AnswerSheet` com `useLegacyStructure={true}`
5. **Salvamento**: `useSaveAnswersLegacy` salva na estrutura antiga
6. **Sincronização**: `RankingBridge.autoSync` sincroniza com estrutura nova

### Exibição de Resultados (RankingTable)

1. **Entrada**: Usuário acessa `/ranking/view/:token`
2. **Dados**: `useRankingsV2Data` busca dados da estrutura nova
3. **Interface**: `RankingTable` exibe resultados da estrutura nova
4. **Performance**: Dados otimizados para exibição

## Vantagens do Sistema Híbrido

### 1. **Migração Gradual**
- Permite testar nova estrutura sem quebrar funcionalidades existentes
- Migração por componentes, não por sistema completo

### 2. **Compatibilidade**
- Mantém funcionalidades antigas funcionando
- Usuários não percebem mudanças

### 3. **Performance**
- RankingTable usa estrutura otimizada (V2)
- AnswerSheet usa estrutura estável (Legacy)

### 4. **Flexibilidade**
- Fácil alternância entre estruturas via configuração
- Sincronização automática mantém dados consistentes

## Como Usar

### Para Desenvolvedores

1. **Configurar estrutura** em `src/config/rankingStructure.ts`
2. **Usar hooks apropriados** baseado na configuração
3. **Implementar sincronização** quando necessário

### Para Usuários

- **Preenchimento**: Usa estrutura antiga (estável)
- **Visualização**: Usa estrutura nova (rápida)
- **Transparente**: Não percebe diferença

## Próximos Passos

1. **Testes**: Validar sincronização entre estruturas
2. **Monitoramento**: Acompanhar performance de cada estrutura
3. **Migração**: Gradualmente migrar AnswerSheet para V2
4. **Otimização**: Melhorar bridge de sincronização

## Arquivos Principais

```
src/
├── config/
│   └── rankingStructure.ts          # Configuração do sistema
├── components/
│   └── resultados/
│       ├── AnswerSheet.tsx          # Componente principal
│       ├── AnswerSheetHybrid.tsx    # Versão híbrida
│       └── RankingParticipationWrapper.tsx
├── hooks/
│   ├── useAnswerSheet/
│   │   ├── useAnswerSheetHybrid.tsx
│   │   ├── fetchExistingAnswersLegacy.ts
│   │   └── fetchOfficialAnswersLegacy.ts
│   ├── useSaveAnswers/
│   │   └── useSaveAnswersLegacy.tsx
│   └── useRankingsLegacyData.tsx
└── services/
    └── rankingBridge.ts             # Sincronização entre estruturas
```

## Conclusão

O sistema híbrido oferece a melhor experiência possível: estabilidade da estrutura antiga para funcionalidades críticas e performance da estrutura nova para exibição de dados. A sincronização automática garante consistência entre as estruturas, permitindo uma migração suave e gradual.


