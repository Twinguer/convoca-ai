# Roadmap — modularização Statistics (ST1–ST9)

Plano para levar o módulo de **Shell** a **Fechado**.

Tag final alvo: `restore/refactor-statistics-modular-complete`

---

## Resumo das fases

| Fase | Escopo | Status |
|------|--------|--------|
| ST1 | Domínio + tipos + formatters | ✅ |
| ST2 | Services (facade `userStudyService`) | ⬜ |
| ST3 | Hook `useStudyStatistics` no módulo | ⬜ |
| ST4 | Charts (`StudyStats/*`) | ✅ |
| ST5 | Subcomponentes page (summary cards, painel questões) | ⬜ |
| ST6 | `StatisticsPage` fina + suporte coach read-only | ⬜ |
| ST7 | Cross-module (Profile, Coach, StudyDashboard) | ⬜ |
| ST8 | API pública; remover exports statistics de study | ⬜ |
| ST9 | Testes, docs, higiene, tag final | ⬜ |

---

## ST1 — Domínio ✅

- Migrar `studyStatisticsFilters` → `statisticsFilters`
- Migrar `studyStatisticsMerge` → `statisticsMerge`
- `statisticsFormatters`, `types`
- Re-exports deprecated em `modules/study/domain/`

## ST2 — Services

- `statisticsService.ts` — facade leitura/reset stats via `userStudyService`

## ST3 — Hooks

- Mover `useStudyStatistics` para `modules/statistics/hooks/`

## ST4 — Charts ✅

- Mover `components/StudyStats/*` → `modules/statistics/components/charts/`
- Re-exports deprecated

## ST5–ST9

Ver [MODULE.md](./MODULE.md) e matriz de modularização.

---

## Próximo passo imediato

**ST2 + ST3** — service facade e hook `useStudyStatistics`.
