# ✅ Usuários Free Não Precisam de Registro

## 🎯 Mudança Implementada

**Regra:** Usuários do plano Free **NÃO** precisam ter registro na tabela `user_subscriptions`.

- ✅ Se não há registro = Free (padrão)
- ✅ Apenas usuários Pro têm registro na tabela
- ✅ Quando cancelar Pro, o registro é **DELETADO** (não marcado como free)

## 📝 Mudanças Realizadas

### 1. **`cancelUserSubscription` Atualizada**
```typescript
// ANTES: Marcava como free
.update({ plan: "free", is_active: false })

// AGORA: Deleta o registro
.delete()
```

### 2. **Webhook Atualizado**
- ✅ Identifica se é plano Coach ou Pro
- ✅ Ao cancelar Pro: **deleta** registro (usuário volta para Free)
- ✅ Ao cancelar Coach: marca como `cancelled` (mantém registro)

### 3. **Verificação de Plano**
O hook `useSubscription` já estava correto:
- Se `subscription === null` → Free
- Se `subscription.plan === 'pro'` e `is_active === true` → Pro

## 🔄 Fluxo de Cancelamento

### Plano Pro Cancelado:
1. Webhook recebe evento `customer.subscription.canceled`
2. Chama `cancelUserSubscription(userId)`
3. **Deleta** registro de `user_subscriptions`
4. Usuário volta para Free (sem registro)

### Plano Coach Cancelado:
1. Webhook recebe evento `customer.subscription.canceled`
2. Chama `cancelCoachSubscription(coachId)`
3. **Atualiza** `coach_subscriptions.status = 'cancelled'`
4. Mantém registro (para histórico/auditoria)

## ✅ Benefícios

1. **Simplifica banco de dados:** Menos registros desnecessários
2. **Performance:** Queries mais rápidas (menos linhas)
3. **Lógica clara:** Ausência de registro = Free
4. **Menos confusão:** Não há registros "free" na tabela

## 📋 Próximos Passos

- [ ] Limpar registros Free existentes no banco (migration)
- [ ] Atualizar documentação
- [ ] Verificar se há outras funções que criam registros Free

