# 🔧 Correções - Salvamento de Blocos e Disciplinas

## 📋 Problema Identificado
Os blocos e disciplinas criados no formulário de criação de ciclo **não estavam sendo salvos** no banco de dados. O formulário permitia criar blocos e disciplinas, mas apenas os dados básicos do ciclo (nome, data, órgão, etc.) eram persistidos.

## ✅ Soluções Implementadas

### 1. **Atualização dos Tipos TypeScript** (`src/types/userStudy.ts`)
```typescript
// Adicionado ao schedule_data do StudyCycleV2:
available_blocks?: Array<{
  id: string;
  name: string;
  disciplines: Array<{
    id: string;
    name: string;
  }>;
}>;
available_disciplines?: Array<{
  id: string;
  name: string;
  block_name: string;
}>;
```

### 2. **Modificação da Função createStudyCycleV2** (`src/utils/userStudyHelpers.ts`)
```typescript
export function createStudyCycleV2(
  cycleName: string,
  examDate: string,
  organ?: string,
  position?: string,
  editalLink?: string,
  cursoLink?: string,
  videoLink?: string,
  blocks?: Array<{...}> // ← NOVO PARÂMETRO
) {
  // Criar disciplinas disponíveis a partir dos blocos
  const availableDisciplines = blocks?.flatMap(block => 
    block.disciplines.map(discipline => ({
      id: discipline.id,
      name: discipline.name,
      block_name: block.name
    }))
  ) || [];

  return {
    // ... outros campos
    schedule_data: {
      weekly_schedule: [],
      metadata: { total_sessions: 0, total_hours: 0 },
      available_blocks: blocks || [], // ← SALVAR BLOCOS
      available_disciplines: availableDisciplines // ← SALVAR DISCIPLINAS
    }
  };
}
```

### 3. **Atualização do Formulário de Criação** (`src/pages/Estudos/CriarCiclo.tsx`)
```typescript
const handleSubmit = async () => {
  // ... validações
  const newCycle = await createCycle({
    cycle_name: cycleName,
    exam_date: examDate,
    organ,
    position,
    edital_link: '',
    curso_link: '',
    video_link: '',
    blocks: blocks // ← ENVIAR BLOCOS CRIADOS
  });
};
```

### 4. **Atualização do Hook useStudyCyclesV2** (`src/hooks/useStudyCyclesV2.tsx`)
```typescript
const createCycle = async (cycleData: {
  // ... campos existentes
  blocks?: Array<{...}>; // ← NOVO CAMPO
}) => {
  const newCycleData = createStudyCycleV2(
    cycleData.cycle_name,
    cycleData.exam_date,
    cycleData.organ,
    cycleData.position,
    cycleData.edital_link,
    cycleData.curso_link,
    cycleData.video_link,
    cycleData.blocks // ← PASSAR BLOCOS
  );
};
```

### 5. **Correção do Cronograma** (`src/pages/Estudos/Cronograma.tsx`)
```typescript
// ANTES: Buscava blocos das sessões existentes
const getAvailableBlocks = () => {
  // Extrair blocos únicos de todas as sessões
  selectedCycleData.schedule_data.weekly_schedule.forEach(daySchedule => {
    daySchedule.sessions.forEach(session => {
      if (session.block_name) {
        blocks.add(session.block_name);
      }
    });
  });
};

// DEPOIS: Busca blocos salvos no available_blocks
const getAvailableBlocks = () => {
  const savedBlocks = selectedCycleData.schedule_data.available_blocks || [];
  
  if (savedBlocks.length === 0) {
    return [{ name: '+ Adicionar novo bloco', id: '__custom__' }];
  }
  
  return savedBlocks.map(block => ({
    name: block.name,
    id: block.name
  }));
};
```

## 🎯 Fluxo Correto Implementado

```
1. Usuário cria ciclo + blocos + disciplinas ✅
   ↓
2. Dados são salvos em schedule_data.available_blocks ✅
   ↓
3. Cronograma busca blocos de available_blocks ✅
   ↓
4. Usuário cria sessão usando blocos salvos ✅
   ↓
5. Sessão é salva em weekly_schedule.sessions ✅
```

## 🧪 Como Testar

1. **Acesse** http://localhost:8084
2. **Faça login** no sistema
3. **Vá para** "Criar Ciclo de Estudos"
4. **Preencha** os campos obrigatórios
5. **Adicione** pelo menos 2 blocos com disciplinas
6. **Clique** em "Criar Ciclo"
7. **Vá para** "Cronograma" e selecione o ciclo
8. **Verifique** se os blocos aparecem no dropdown
9. **Selecione** um bloco e verifique as disciplinas

## 📊 Verificação no Banco

Execute esta query no Supabase:
```sql
SELECT 
    user_id,
    study_cycles->0->>'cycle_name' as cycle_name,
    study_cycles->0->'schedule_data'->'available_blocks' as available_blocks,
    study_cycles->0->'schedule_data'->'available_disciplines' as available_disciplines
FROM user_study 
WHERE user_id = 'SEU_USER_ID'
ORDER BY updated_at DESC;
```

## ✅ Resultados Esperados

- ✅ **available_blocks** contém os blocos criados no formulário
- ✅ **available_disciplines** contém as disciplinas de cada bloco
- ✅ **Cronograma** mostra blocos no dropdown
- ✅ **Disciplinas** aparecem quando bloco é selecionado
- ✅ **Sessões** podem ser criadas usando blocos salvos

## 🐛 Problemas Resolvidos

- ❌ Blocos não eram salvos → ✅ Agora são salvos em `available_blocks`
- ❌ Disciplinas não eram salvas → ✅ Agora são salvas em `available_disciplines`
- ❌ Cronograma não encontrava blocos → ✅ Agora busca de `available_blocks`
- ❌ Sessões não podiam ser criadas → ✅ Agora podem usar blocos salvos
