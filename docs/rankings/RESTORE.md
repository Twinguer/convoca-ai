# Restauração — refatoração rankings

Tags Git após cada fase validada (build + `npm run test:rankings`).

| Tag | Fase | Conteúdo |
|-----|------|----------|
| `restore/refactor-rankings-baseline` | Pré-modular | Antes da Fase R1 (navegação + fixes de rota) |
| `restore/refactor-rankings-phase-r1` | R1 | Domínio modular, remoção de código morto, testes de acesso |

## Restaurar código

```powershell
git tag -l "restore/refactor-rankings-*"

# Branch de recuperação
git checkout -b recovery/rankings-phase-r1 restore/refactor-rankings-phase-r1

# Reset local (CUIDADO)
git reset --hard restore/refactor-rankings-baseline
```

## Smoke test pós-deploy

- [ ] `/pre-classificacao` → card → cargos → classificação
- [ ] Perfil → Ranking (URL segura)
- [ ] Free participante vê tabela; Free externo → participar ou Pro
- [ ] Vitrine visível para todos
- [ ] Botão atualizar classificação (recálculo)
- [ ] Participar + gabarito + tipos de prova (Alternativas / Certo ou Errado)

## Criar novo ponto de restauração

```powershell
.\scripts\refactor\create-rankings-restore-point.ps1 -Name "phase-r2" -Message "Descrição"
```

## Invariantes

Ver [MODULE.md](./MODULE.md). Não misturar PR de rankings com estudos ou admin.
