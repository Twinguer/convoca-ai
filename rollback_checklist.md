# 🔄 CHECKLIST DE ROLLBACK - REGRAS DE MÍNIMO

## 📋 ANTES DE IMPLEMENTAR

### ✅ Preparação
- [ ] Branch de backup criada (`backup-before-minimum-rules`)
- [ ] Commit de backup feito
- [ ] Migrações de rollback preparadas
- [ ] Script de teste preparado
- [ ] Checklist impresso/salvo

### ✅ Arquivos de Rollback Criados
- [ ] `supabase/migrations/20250116000015_rollback_minimum_global_fields.sql`
- [ ] `supabase/migrations/20250116000016_rollback_calculate_user_score_realtime.sql`
- [ ] `test_rollback_minimum_rules.sql`
- [ ] `rollback_checklist.md`

## 🚨 SE ALGO DER ERRADO

### ✅ Sinais de que precisa fazer rollback
- [ ] Scores zerados ou incorretos
- [ ] Erros de SQL na função `calculate_user_score_realtime`
- [ ] Interface não carrega ou mostra erros
- [ ] Dados corrompidos ou perdidos
- [ ] Performance degradada significativamente
- [ ] Usuários não conseguem salvar respostas
- [ ] Sistema não responde ou trava
- [ ] Erros de migração no banco de dados

### ✅ Comandos de Rollback Rápido

#### 1. Rollback de Migrações
```bash
# Aplicar migrações de rollback
supabase db push --file supabase/migrations/20250116000015_rollback_minimum_global_fields.sql
supabase db push --file supabase/migrations/20250116000016_rollback_calculate_user_score_realtime.sql

# Testar rollback
psql -h [HOST] -U [USER] -d [DATABASE] -f test_rollback_minimum_rules.sql
```

#### 2. Rollback Git (se necessário)
```bash
# Voltar para o commit anterior
git reset --hard HEAD~1
git push origin nomeia-ai --force

# Ou voltar para a branch de backup
git checkout backup-before-minimum-rules
git checkout -b nomeia-ai-rollback
git push origin nomeia-ai-rollback
```

#### 3. Rollback de Emergência (se tudo der errado)
```bash
# Voltar para main
git checkout main
git checkout -b nomeia-ai-emergency
git push origin nomeia-ai-emergency

# Ou restaurar do backup
git checkout backup-before-minimum-rules
git branch -D nomeia-ai
git checkout -b nomeia-ai
git push origin nomeia-ai --force
```

## ✅ APÓS APLICAR ROLLBACK

### ✅ Verificações Obrigatórias
- [ ] Executar script de teste: `test_rollback_minimum_rules.sql`
- [ ] Verificar se scores estão sendo calculados corretamente
- [ ] Verificar se dados não foram corrompidos
- [ ] Verificar se interface está funcionando
- [ ] Verificar se usuários conseguem salvar respostas
- [ ] Verificar logs de erro no Supabase
- [ ] Testar com dados reais de usuário

### ✅ Validação de Dados
- [ ] Scores > 0 para usuários com respostas
- [ ] `object_scores` sendo preservados
- [ ] `subjectives` sendo lidos corretamente
- [ ] Estrutura `consolidated_data` intacta
- [ ] Função `calculate_user_score_realtime` executando sem erros

### ✅ Validação de Interface
- [ ] Página de resultados carregando
- [ ] Tabela de ranking exibindo dados
- [ ] Formulário de respostas funcionando
- [ ] Salvamento de respostas funcionando
- [ ] Sem erros no console do navegador

## 📞 CONTATOS DE EMERGÊNCIA

- **Desenvolvedor Principal**: [Seu nome]
- **Backup do Sistema**: Branch `backup-before-minimum-rules`
- **Documentação**: Este checklist
- **Logs**: Supabase Dashboard > Logs

## 📝 NOTAS IMPORTANTES

1. **SEMPRE** execute o script de teste após rollback
2. **NUNCA** force push sem ter certeza do que está fazendo
3. **SEMPRE** verifique se os dados estão íntegros
4. **SEMPRE** teste com dados reais após rollback
5. **MANTENHA** este checklist atualizado

## 🔍 TROUBLESHOOTING

### Problema: Scores zerados após rollback
**Solução**: Verificar se a função está buscando dados da estrutura correta

### Problema: Erro de migração
**Solução**: Verificar se as migrações de rollback estão na ordem correta

### Problema: Interface não carrega
**Solução**: Verificar se não há erros de JavaScript no console

### Problema: Dados corrompidos
**Solução**: Restaurar do backup da branch `backup-before-minimum-rules`

---

**Última atualização**: $(date)
**Versão**: 1.0
**Status**: ✅ Pronto para uso
