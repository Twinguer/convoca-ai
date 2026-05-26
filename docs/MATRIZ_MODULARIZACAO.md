# Matriz de maturidade — módulos

Atualizado após **Coach C9** (modularização completa).

Camadas avaliadas por módulo em `src/modules/<nome>/`:

| Camada | Critério |
|--------|----------|
| **Pages** | Rotas implementadas dentro do módulo |
| **Domain** | Lógica de negócio pura em `domain/` |
| **Services** | Integração com API/Supabase em `services/` |
| **Hooks** | Estado e composição em `hooks/` |
| **Components** | UI específica do domínio em `components/` |
| **index.ts** | API pública exportada pelo módulo |

## Status atual

| Módulo | Pages | Domain | Services | Hooks | Components | index.ts | Status |
|--------|:-----:|:------:|:--------:|:-----:|:----------:|:--------:|--------|
| **rankings** | 5/5 | OK | OK | OK | OK | OK | **Fechado** |
| **study** | 7/7 | OK | Parcial* | OK (6) | OK | OK | **Fechado** |
| **coach** | 9/9 | OK | OK | OK (8) | OK | OK | **Fechado** |
| **community** | 1 | — | — | — | — | — | **Shell** |
| **statistics** | 1 | — | — | — | Parcial‡ | — | **Shell** |

\* `studySessionService` no módulo; `userStudyService` (~3k linhas, JSONB compartilhado) permanece em `src/services/` por decisão de arquitetura.

‡ Charts em `src/components/StudyStats/`; página em `modules/statistics/pages/`.

## Resumo

| Métrica | Valor |
|---------|------:|
| Módulos | 5 |
| Fechados | 3 (rankings, study, coach) |
| Parciais | 0 |
| Shell | 2 (community, statistics) |

## Tags de restore

| Módulo | Tag | Commit |
|--------|-----|--------|
| rankings | `restore/refactor-rankings-complete` | `72c8ed32` |
| study | `restore/refactor-study-modular-complete` | `0dd1f1f1` |
| coach | `restore/refactor-coach-modular-complete` | *(pendente tag)* |

## Documentação por módulo

| Módulo | MODULE | ROADMAP | RESTORE |
|--------|--------|---------|---------|
| Rankings | [MODULE.md](./rankings/MODULE.md) | [ROADMAP.md](./rankings/ROADMAP.md) | [RESTORE.md](./rankings/RESTORE.md) |
| Study | [MODULE.md](./study/MODULE.md) | [ROADMAP.md](./study/ROADMAP.md) | [refactor-estudos/RESTORE.md](./refactor-estudos/RESTORE.md) |
| Coach | [MODULE.md](./coach/MODULE.md) | [ROADMAP.md](./coach/ROADMAP.md) | [RESTORE.md](./coach/RESTORE.md) |
| Community | [MODULE.md](./community/MODULE.md) | [ROADMAP.md](./community/ROADMAP.md) | [RESTORE.md](./community/RESTORE.md) |

## Roadmap planejado

### Community (COM1–COM9) — próximo na fila

| Fase | Escopo |
|------|--------|
| COM1 | Domínio (`communityProfileRules`, sort, tipos grupos) |
| COM2 | Services (profiles RPC + studyGroups) |
| COM3 | Hooks (`useGroupMembers` estável com `useIsActiveCoach`) |
| COM4 | Componentes (tabs, cards, modals) |
| COM5 | Pages (CommunityPage, CoachGroupsTab migration) |
| COM6–COM9 | Encerramento + testes + higiene |

Tag alvo: `restore/refactor-community-modular-complete`

### Statistics — backlog

Modularização após Community ou em paralelo COM4+.
