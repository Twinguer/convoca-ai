# Troubleshooting - Participação em Ranking

## Problema: Não consigo participar de um ranking

### Passos para Diagnosticar

#### 1. **Verificar Logs do Console**
Abra o DevTools (F12) e vá para a aba Console. Procure por logs que começam com:
- `[ParticipationForm]`
- `[RankingParticipationWrapper]`

#### 2. **Verificar Configuração**
O sistema deve estar usando a estrutura antiga para operações de ranking:
```typescript
// Em src/config/rankingStructure.ts
RANKING_OPERATIONS_USE_LEGACY: true
```

#### 3. **Verificar Dados do Ranking**
- O ranking existe na tabela `concursos`?
- O usuário está logado?
- O ranking ID está correto?

### Possíveis Causas e Soluções

#### **Causa 1: Usuário não está logado**
**Sintomas:**
- Botão "Participar" não aparece
- Redirecionamento para página de login

**Solução:**
- Fazer login antes de tentar participar
- Verificar se a sessão não expirou

#### **Causa 2: Ranking não encontrado**
**Sintomas:**
- Erro "Ranking não encontrado"
- Página de erro amarela

**Solução:**
- Verificar se o ranking ID está correto
- Verificar se o ranking existe na tabela `concursos`
- Verificar se o ranking está ativo

#### **Causa 3: Usuário já está participando**
**Sintomas:**
- Erro "Você já está participando deste ranking"
- Botão "Editar Respostas" aparece

**Solução:**
- Verificar na tabela `user_rankings` se já existe registro
- Se necessário, remover participação existente

#### **Causa 4: Erro de validação**
**Sintomas:**
- Erro "Cota obrigatória" ou "Caderno obrigatório"
- Validação falha antes de tentar salvar

**Solução:**
- Selecionar uma cota de reserva
- Selecionar um caderno (se houver múltiplos)

#### **Causa 5: Erro de permissão**
**Sintomas:**
- Erro "Você não tem permissão para participar deste ranking"
- Erro de foreign key

**Solução:**
- Verificar se o ranking existe
- Verificar se o usuário tem permissão
- Verificar RLS policies no Supabase

#### **Causa 6: Erro de constraint única**
**Sintomas:**
- Erro "violates unique constraint"
- Erro "duplicate key"

**Solução:**
- Verificar se já existe participação na tabela `user_rankings`
- Limpar participação duplicada se necessário

### Debug Avançado

#### **Usar Componente de Debug**
Adicione temporariamente o componente de debug na página:

```tsx
import { RankingParticipationDebug } from '@/components/Debug/RankingParticipationDebug';

// Na página de participação
<RankingParticipationDebug rankingId={rankingId} />
```

#### **Verificar Tabelas do Banco**
```sql
-- Verificar se o ranking existe
SELECT * FROM concursos WHERE id = 'RANKING_ID';

-- Verificar participações do usuário
SELECT * FROM user_rankings 
WHERE concurso_id = 'RANKING_ID' 
AND user_id = 'USER_ID';

-- Verificar se há duplicatas
SELECT concurso_id, user_id, COUNT(*) 
FROM user_rankings 
GROUP BY concurso_id, user_id 
HAVING COUNT(*) > 1;
```

#### **Verificar Logs do Supabase**
1. Acesse o dashboard do Supabase
2. Vá para Logs > API
3. Procure por erros relacionados ao ranking

### Soluções Rápidas

#### **1. Limpar Cache**
```javascript
// No console do navegador
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### **2. Verificar Configuração**
```javascript
// No console do navegador
console.log('Configuração:', {
  useLegacy: shouldUseLegacyStructure('rankingOperations'),
  rankingId: 'RANKING_ID'
});
```

#### **3. Testar Participação Manual**
```javascript
// No console do navegador (substitua os valores)
const testParticipation = async () => {
  const { data, error } = await supabase
    .from('user_rankings')
    .insert({
      user_id: 'USER_ID',
      concurso_id: 'RANKING_ID',
      score: 0,
      position: 0,
      reservation_type: 'Ampla Concorrência',
      discursive_score: 0,
      case_study_1_score: 0,
      case_study_2_score: 0,
      case_study_3_score: 0,
      selected_booklet: null,
      edit_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  console.log('Resultado:', { data, error });
};

testParticipation();
```

### Logs Esperados

#### **Sucesso:**
```
[ParticipationForm] Iniciando participação: {userId: "...", concursoId: "...", ...}
[ParticipationForm] Usando estrutura antiga (user_rankings)
[ParticipationForm] Sucesso ao inserir user_rankings: {id: "..."}
```

#### **Erro:**
```
[ParticipationForm] Erro ao inserir user_rankings: {message: "...", code: "..."}
[ParticipationForm] Erro ao participar do ranking: Error: ...
```

### Contato para Suporte

Se o problema persistir, forneça:
1. Logs do console
2. ID do ranking
3. ID do usuário
4. Screenshot da mensagem de erro
5. Resultado do componente de debug


