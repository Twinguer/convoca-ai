# Restauração — refatoração estudos

Tags Git criadas após cada fase validada (build + testes).

| Tag | Fase | Conteúdo |
|-----|------|----------|
| `restore/refactor-estudos-baseline` | Pré-refatoração | Estado antes das fases 0–3 |
| `restore/refactor-estudos-phase-0-1` | 0 + 1 | Higiene, testes, auditoria SQL |
| `restore/refactor-estudos-phase-2` | 2 | Migration backfill `study_schedule` |
| `restore/refactor-estudos-phase-3` | 3 | Escrita unificada + flag espelhamento |

## Restaurar código

```powershell
# Ver tags
git tag -l "restore/refactor-estudos-*"

# Voltar para um ponto (cria branch de recuperação)
git checkout -b recovery/from-phase-2 restore/refactor-estudos-phase-2

# Ou resetar main local (CUIDADO: descarta commits posteriores)
git reset --hard restore/refactor-estudos-phase-1
```

## Restaurar dados (Fase 2)

Se o backfill causar problema:

1. Executar `supabase/scripts/rollback_study_schedule_backfill.sql` no SQL Editor (Supabase).
2. Usa a tabela `user_study_v2_migration_backup` criada pela migration.

## Smoke test pós-deploy

- [ ] Cronograma carrega tarefas
- [ ] Salvar registro manual (tempo + questões)
- [ ] Estatísticas batem com cronograma
- [ ] Excluir tarefa mantém histórico global
- [ ] Coach: cronograma e save no aluno
- [ ] Timer sugere minutos; não duplica ao salvar

## Criar novo ponto de restauração

```powershell
.\scripts\refactor\create-restore-point.ps1 -Name "phase-X" -Message "Descrição"
```
