# Módulo Statistics

Modularização das **estatísticas de estudo**: filtros por período, merge de sessões, gráficos e página `/estatisticas`.

## Estado atual (pós ST1 + ST4 parcial)

| Camada | Situação |
|--------|----------|
| **Pages** | `StatisticsPage` |
| **Domain** | `statisticsFilters`, `statisticsMerge`, `statisticsFormatters`, `types` |
| **Services** | — (persistência via `userStudyService`, compartilhado) |
| **Hooks** | — (`useStudyStatistics` ainda em `@/modules/study` até ST3) |
| **Components** | 4 charts em `components/charts/` |
| **index.ts** | API parcial (domínio + charts + page) |

**Status:** **Parcial** — ST1 concluída; ST3–ST9 pendentes.

## Fronteira com Study

- `statisticsFilters` / `statisticsMerge` migrados de `modules/study/domain/` (re-exports `@deprecated` no study)
- `userStudyService` e `calculateStudyStatistics` permanecem compartilhados
- `disciplineStudyStats` permanece em study (escopo de ciclo/cronograma)

## API pública (`@/modules/statistics`)

- Domain: `getStatisticsForPeriod`, `resolveUserStudyStatisticsFromData`, formatters
- Charts: `PerformanceChart`, `SubjectTimeDistributionChart`, `AccuracyEvolutionChart`, `StudyHeatmapChart`
- Page: `StatisticsPage`

## Testes

```powershell
npm run test:statistics
```

## Referências

- [ROADMAP.md](./ROADMAP.md)
- [RESTORE.md](./RESTORE.md)
