# 🔍 Debug - Ciclos Ativos Sumindo do Dashboard

## 🐛 Problema Reportado

**"Os Ciclos Ativos estão sumindo do Dashboard"**

## 🔍 Logs de Debug Adicionados

### 1. **Dashboard.tsx** - Função `fetchStudyCycles`
```typescript
const fetchStudyCycles = async () => {
  try {
    console.log('🔍 Debug - Buscando dados do usuário:', user?.id);
    const userStudyData = await UserStudyService.getUserStudyData(user?.id);
    console.log('🔍 Debug - Dados do usuário:', userStudyData);
    
    const cycles = userStudyData?.study_cycles.filter(cycle => cycle.is_active) || [];
    console.log('🔍 Debug - Ciclos ativos encontrados:', cycles.length);
    console.log('🔍 Debug - Ciclos:', cycles);
    
    if (!cycles || cycles.length === 0) {
      console.log('⚠️ Debug - Nenhum ciclo ativo encontrado');
      setStudyCycles([]);
      setLoading(false);
      return;
    }
    // ... resto da função
  } catch (error) {
    console.error('Error fetching study cycles:', error);
  }
};
```

### 2. **UserStudyService.ts** - Função `getUserStudyData`
```typescript
static async getUserStudyData(userId: string): Promise<UserStudy | null> {
  try {
    console.log('🔍 Debug - getUserStudyData - Buscando dados para userId:', userId);
    
    const { data, error } = await supabase
      .from('user_study')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('⚠️ Debug - getUserStudyData - Nenhum dado encontrado para o usuário');
        return null;
      }
      console.error('❌ Debug - getUserStudyData - Erro ao buscar dados:', error);
      return null;
    }

    console.log('✅ Debug - getUserStudyData - Dados encontrados:', data);
    console.log('🔍 Debug - getUserStudyData - study_cycles:', data?.study_cycles);
    
    return data as UserStudy;
  } catch (error) {
    console.error('❌ Debug - getUserStudyData - Erro na função:', error);
    return null;
  }
}
```

## 🧪 Como Testar

### **Passo 1: Acessar Dashboard**
1. Abra http://localhost:8084
2. Faça login no sistema
3. Vá para o Dashboard (/estudos)
4. Abra o Console do Navegador (F12)

### **Passo 2: Verificar Logs**
Procure por estes logs no console:
```
🔍 Debug - Buscando dados do usuário: [USER_ID]
🔍 Debug - getUserStudyData - Buscando dados para userId: [USER_ID]
✅ Debug - getUserStudyData - Dados encontrados: [OBJECT]
🔍 Debug - getUserStudyData - study_cycles: [ARRAY]
🔍 Debug - Dados do usuário: [OBJECT]
🔍 Debug - Ciclos ativos encontrados: [NUMBER]
🔍 Debug - Ciclos: [ARRAY]
```

### **Passo 3: Verificar Banco de Dados**
Execute esta query no Supabase:
```sql
SELECT 
    user_id,
    study_cycles,
    updated_at
FROM user_study 
WHERE user_id = 'SEU_USER_ID'
ORDER BY updated_at DESC;
```

## 🔍 Possíveis Causas

### 1. **Dados não existem**
- **Sintoma:** Log mostra "Nenhum dado encontrado para o usuário"
- **Causa:** Usuário não tem entrada na tabela `user_study`
- **Solução:** Criar entrada inicial para o usuário

### 2. **Ciclos não estão ativos**
- **Sintoma:** Log mostra dados mas "Ciclos ativos encontrados: 0"
- **Causa:** Ciclos existem mas `is_active = false`
- **Solução:** Verificar campo `is_active` dos ciclos

### 3. **Erro na consulta**
- **Sintoma:** Log mostra erro na função `getUserStudyData`
- **Causa:** Problema na consulta ao Supabase
- **Solução:** Verificar conexão e permissões

### 4. **Filtro incorreto**
- **Sintoma:** Dados existem mas filtro não funciona
- **Causa:** Problema na lógica de filtro `cycle.is_active`
- **Solução:** Verificar estrutura dos dados

### 5. **Dados corrompidos**
- **Sintoma:** Dados existem mas estrutura está incorreta
- **Causa:** Estrutura dos dados não corresponde ao esperado
- **Solução:** Verificar estrutura dos dados no banco

## 🔧 Soluções por Cenário

### **Cenário 1: Nenhum dado encontrado**
```typescript
// Criar entrada inicial para o usuário
await UserStudyService.initializeUserStudyData(userId);
```

### **Cenário 2: Ciclos não ativos**
```sql
-- Verificar status dos ciclos
SELECT 
    study_cycles->0->>'is_active' as is_active,
    study_cycles->0->>'cycle_name' as cycle_name
FROM user_study 
WHERE user_id = 'SEU_USER_ID';
```

### **Cenário 3: Erro na consulta**
- Verificar conexão com Supabase
- Verificar permissões RLS
- Verificar se a tabela existe

### **Cenário 4: Filtro incorreto**
- Verificar se `cycle.is_active` existe
- Verificar tipo de dados (boolean vs string)
- Ajustar lógica de filtro

### **Cenário 5: Dados corrompidos**
- Verificar estrutura dos dados
- Verificar se `study_cycles` é um array
- Verificar se cada ciclo tem `is_active`

## 📊 Verificação no Banco

```sql
-- Verificar se usuário tem dados
SELECT COUNT(*) FROM user_study WHERE user_id = 'SEU_USER_ID';

-- Verificar ciclos do usuário
SELECT 
    user_id,
    jsonb_array_length(study_cycles) as total_cycles,
    study_cycles
FROM user_study 
WHERE user_id = 'SEU_USER_ID';

-- Verificar ciclos ativos
SELECT 
    cycle->>'cycle_name' as cycle_name,
    cycle->>'is_active' as is_active
FROM user_study, 
     jsonb_array_elements(study_cycles) as cycle
WHERE user_id = 'SEU_USER_ID';
```

## 🎯 Próximos Passos

1. **Executar teste** com logs de debug
2. **Identificar cenário** baseado nos logs
3. **Aplicar solução** específica para o cenário
4. **Verificar resultado** no Dashboard
5. **Remover logs** de debug após correção

## 📝 Relatório de Debug

Após executar o teste, anote:
- Logs do console
- Resultado da query do banco
- Comportamento observado
- Cenário identificado
- Solução aplicada
