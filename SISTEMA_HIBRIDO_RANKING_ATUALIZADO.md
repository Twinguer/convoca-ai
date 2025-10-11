# Sistema Híbrido de Ranking - Atualizado

## Visão Geral

O sistema híbrido permite usar estruturas antigas e novas simultaneamente, com **todas as operações de ranking** (criar, deixar, excluir) usando a estrutura antiga, mantendo a compatibilidade e estabilidade.

## Arquitetura Atualizada

### Estruturas de Dados

#### Estrutura Antiga (Legacy) - **PRINCIPAL**
- **Tabelas**: `concursos`, `user_rankings`, `user_answers`, `official_answer_weights`
- **Uso**: 
  - ✅ AnswerSheet (preenchimento de respostas)
  - ✅ **Criar Ranking**
  - ✅ **Deixar Ranking** 
  - ✅ **Excluir Ranking**
- **Vantagens**: Estável, testada, funcionalidades completas

#### Estrutura Nova (V2) - **APENAS VISUALIZAÇÃO**
- **Tabelas**: `create_ranking_new`, `user_ranking_new`
- **Uso**: 
  - ✅ RankingTable (exibição de resultados)
  - ❌ Operações de ranking (criar/deixar/excluir)
- **Vantagens**: Performance, escalabilidade, flexibilidade

### Configuração Atualizada

```typescript
export const RANKING_STRUCTURE_CONFIG = {
  // Estrutura para AnswerSheet (preenchimento de respostas)
  ANSWER_SHEET_USE_LEGACY: true,
  
  // Estrutura para RankingTable (exibição de resultados)
  RANKING_TABLE_USE_LEGACY: false,
  
  // Estrutura para operações de ranking (criar, deixar, excluir)
  RANKING_OPERATIONS_USE_LEGACY: true, // ← NOVO
  
  // Sincronização automática entre estruturas
  AUTO_SYNC_ENABLED: true,
  
  // Logs de debug para sincronização
  SYNC_DEBUG_LOGS: false
} as const;
```

## Componentes Implementados

### 1. Operações de Ranking (Estrutura Antiga)

#### `useRankingOperationsLegacy`
**Arquivo**: `src/hooks/useRankingOperationsLegacy.tsx`

- **Criar Ranking**: Usa tabela `concursos`
- **Deixar Ranking**: Usa tabelas `user_rankings`, `user_answers`, `score_calculation_logs`
- **Excluir Ranking**: Remove dados de todas as tabelas relacionadas
- **Sincronização**: Automática com estrutura nova

#### `useLeaveRanking` (Atualizado)
**Arquivo**: `src/hooks/useLeaveRanking.ts`

- Alterna entre estruturas baseado na configuração
- **Padrão**: Estrutura antiga (`rankingOperations`)
- Sincronização automática após operações

### 2. Participação em Ranking

#### `ParticipationForm` (Atualizado)
**Arquivo**: `src/components/resultados/ParticipationForm.tsx`

- **Participar**: Usa `user_rankings` (estrutura antiga)
- **Deixar**: Usa `useLeaveRanking` com estrutura antiga
- **AnswerSheet**: Força `useLegacyStructure={true}`

### 3. Criação de Ranking

#### `CriarRanking` (Já Usa Estrutura Antiga)
**Arquivo**: `src/pages/CriarRanking.tsx`

- **Hook**: `useSaveRanking` já usa tabela `concursos`
- **Dados**: Salva em estrutura antiga
- **Compatibilidade**: Total com sistema existente

## Fluxo de Dados Atualizado

### 1. **Criar Ranking**
```
Usuário → CriarRanking → useSaveRanking → concursos (antiga)
                                    ↓
                            RankingBridge.syncFromLegacyToNew()
                                    ↓
                            create_ranking_new (nova)
```

### 2. **Participar em Ranking**
```
Usuário → ParticipationForm → user_rankings (antiga)
                            ↓
                    RankingBridge.syncFromLegacyToNew()
                            ↓
                    user_ranking_new (nova)
```

### 3. **Preencher Respostas**
```
Usuário → AnswerSheet → user_answers (antiga)
                      ↓
              RankingBridge.syncFromLegacyToNew()
                      ↓
              user_ranking_new (nova)
```

### 4. **Deixar Ranking**
```
Usuário → useLeaveRanking → user_rankings (antiga)
                          ↓
                  RankingBridge.syncFromNewToLegacy()
                          ↓
                  user_ranking_new (nova)
```

### 5. **Excluir Ranking**
```
Admin → useRankingOperationsLegacy → concursos (antiga)
                                  ↓
                          Remove dados relacionados
                                  ↓
                          RankingBridge.syncFromNewToLegacy()
```

### 6. **Visualizar Resultados**
```
Usuário → RankingTable → user_ranking_new (nova)
                       ↓
               Dados otimizados para exibição
```

## Vantagens da Arquitetura Atualizada

### 1. **Estabilidade Máxima**
- Todas as operações críticas usam estrutura testada
- Menor risco de bugs em funcionalidades essenciais

### 2. **Performance Otimizada**
- Visualização usa estrutura otimizada (V2)
- Operações usam estrutura estável (Legacy)

### 3. **Migração Segura**
- Mudanças graduais por funcionalidade
- Rollback fácil se necessário

### 4. **Sincronização Automática**
- Dados sempre consistentes entre estruturas
- Transparente para o usuário

## Configuração por Componente

| Componente | Estrutura | Justificativa |
|------------|-----------|---------------|
| **AnswerSheet** | Antiga | Estabilidade para preenchimento |
| **Criar Ranking** | Antiga | Funcionalidade crítica |
| **Deixar Ranking** | Antiga | Operação sensível |
| **Excluir Ranking** | Antiga | Operação administrativa |
| **RankingTable** | Nova | Performance para visualização |

## Arquivos Principais Atualizados

```
src/
├── config/
│   └── rankingStructure.ts          # Configuração atualizada
├── hooks/
│   ├── useRankingOperationsLegacy.tsx  # ← NOVO
│   ├── useLeaveRanking.ts             # ← ATUALIZADO
│   └── useRankingsLegacyData.tsx      # ← NOVO
├── components/
│   └── resultados/
│       ├── ParticipationForm.tsx      # ← ATUALIZADO
│       └── AnswerSheet.tsx            # ← ATUALIZADO
└── services/
    └── rankingBridge.ts               # Sincronização entre estruturas
```

## Como Usar

### Para Desenvolvedores

1. **Operações de Ranking**: Sempre usar estrutura antiga
2. **Visualização**: Usar estrutura nova
3. **Configuração**: Alterar em `rankingStructure.ts`

### Para Usuários

- **Criar/Deixar/Excluir**: Usa estrutura estável
- **Preencher Respostas**: Usa estrutura testada
- **Ver Resultados**: Usa estrutura rápida
- **Transparente**: Não percebe diferença

## Próximos Passos

1. **Testes**: Validar todas as operações
2. **Monitoramento**: Acompanhar sincronização
3. **Otimização**: Melhorar bridge se necessário
4. **Migração Futura**: Gradual para V2 quando estável

## Conclusão

A arquitetura atualizada garante **máxima estabilidade** para operações críticas (criar, deixar, excluir) usando a estrutura antiga, enquanto mantém **performance otimizada** para visualização usando a estrutura nova. A sincronização automática garante consistência entre as estruturas, permitindo uma experiência transparente para o usuário.


