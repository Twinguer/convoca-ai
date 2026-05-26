# Módulo Rankings

Estrutura modular para listagem, classificação, participação e gabaritos.

## Camadas

```
src/modules/rankings/
  domain/
    rankingAccess.ts       # Visibilidade da tabela (Pro / Free / vitrine / participante)
    rankingNavigation.ts   # URLs seguras + fluxo da listagem
    rankingProfilePosition.ts  # Posição no perfil (= mesma fonte da tabela)
  pages/
    RankingsPage.tsx       # /pre-classificacao
  index.ts                 # API pública do módulo
```

**Fora do módulo (fatiamento futuro):**

| Área | Caminho |
|------|---------|
| Classificação UI | `pages/ResultadosPage.tsx`, `components/resultados/` |
| Leitura / ordenação | `services/rankingService.ts` |
| Dados da página | `hooks/useResultadosData.tsx` |
| Criação / gabarito | `pages/CriarRanking.tsx`, `hooks/useSaveRanking.ts` |
| Cargos (hierarquia) | `pages/CargosPage.tsx` |
| Supabase | `integrations/supabase/rankings/` |

## Invariantes (não quebrar)

1. **Posição e eliminação** vêm de `fetchUserRankings` / backend — não recalcular no frontend.
2. **Scores e gabaritos** via RPC (`recalculate_all_scores_with_weights`, `save_user_answers…`).
3. **Rotas** só com token: `/concurso/ranking/:token` (nunca `/ranking/:uuid`).
4. **Suspense** fora de `SecureConcursoRoute` ( `App.tsx` ).
5. **Visibilidade** centralizada em `canViewClassification` ( `rankingAccess.ts` ).
6. **Navegação** centralizada em `rankingNavigation.ts` — UI não monta URL legada.

## Regras de visibilidade da classificação

| Usuário | Vitrine | Pode ver tabela |
|---------|---------|-----------------|
| Anônimo | qualquer | Sim |
| Pro | qualquer | Sim |
| Free criador | — | Sim |
| Free participante | — | Sim |
| Free não participante | Sim | Sim |
| Free não participante | Não | Não (CTA participar / Pro) |

## Fluxo principal

1. `/pre-classificacao` → `openRankingFromList`
2. Card geral → `/pre-classificacao/:token/cargos`
3. Cargo → `/concurso/ranking/:token`
4. `SecureConcursoRoute` → `ResultadosPage` + `useResultadosData`
5. Refresh → `recalculateAllUserScores` (RPC)

## Import recomendado

```ts
import {
  canViewClassification,
  openRankingFromList,
  getProfileRankingStatus,
} from '@/modules/rankings';
```

Re-exports legados em `src/utils/rankingNavigation.ts` e `rankingProfilePosition.ts` estão **deprecated**.

## Testes

```powershell
npm run test:rankings
```

## Docs relacionados

- [RESTORE.md](./RESTORE.md) — pontos de restauração Git
- [../../src/docs/RankingUpdateFlow.md](../../src/docs/RankingUpdateFlow.md) — recálculo de scores
