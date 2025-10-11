# Arquitetura do Módulo de Ranking

## 📐 Visão Geral da Arquitetura

Este documento descreve a arquitetura técnica do módulo de Ranking do Convoca AI.

## 🏗️ Camadas da Aplicação

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, UI)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Application Layer               │
│  (Hooks, State Management)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Business Logic Layer            │
│  (Services, Models, Scoring)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Data Access Layer               │
│  (Supabase Integration, Rankings)       │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Database Layer                  │
│  (Supabase PostgreSQL, RLS)             │
└─────────────────────────────────────────┘
```

## 📦 Estrutura de Componentes

### Componentes de Alto Nível (Pages)
- **PreClassificacao**: Lista de rankings disponíveis
- **ResultadosPage**: Visualização detalhada de resultados
- **CriarRanking**: Formulário de criação de ranking
- **ConcursoParticipation**: Interface de participação

### Componentes de Médio Nível
- **RankingList**: Gerenciamento de lista de rankings
- **AnswerSheet**: Folha de respostas interativa
- **RankingTable**: Tabela de classificação
- **ScoreForm**: Formulário de notas discursivas

### Componentes de Baixo Nível
- **QuestionCell**: Célula individual de questão
- **AnswerOption**: Opção de resposta
- **BookletSelector**: Seletor de caderno
- **QuotaSelector**: Seletor de cota

## 🔄 Fluxo de Dados

### 1. Criação de Ranking

```
Usuario → CriarRanking → useSaveRanking → concursoManager
  → Supabase → concursos table → Notificação de Sucesso
```

### 2. Participação em Ranking

```
Usuario → ConcursoParticipation → ParticipationForm
  → QuotaSelector + BookletSelector → AnswerSheet
  → useAnswerSheet → useSaveAnswers → save_user_answers_with_booklet (RPC)
  → user_answers + user_rankings → calculate_user_score_realtime (RPC)
  → Recalculo de Pontuação → Atualização de Ranking
```

### 3. Visualização de Resultados

```
Usuario → ResultadosPage → useResultadosData
  → fetchUserRankings + getParticipantCount
  → RankingTable → Filtro por Quota → Exibição Ordenada
```

### 4. Atualização de Gabarito

```
Admin → AnswerKeyForm → useBookletAnswerKey
  → answerKeyService.save → save_booklet_answer_key (RPC)
  → official_answer_weights → recalculateAllUserScores
  → Batch Recalculation → Atualização Massiva
```

## 💾 Estrutura de Dados

### Principais Entidades

#### Concurso (Ranking)
```typescript
interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  status: 'Em andamento' | 'Finalizado';
  exam_type: 'Alternativas' | 'Certo ou Errado';
  
  // Estrutura de seções
  has_basic_knowledge: boolean;
  basic_knowledge_questions: number;
  basic_knowledge_weight: number;
  
  has_specific_knowledge_1: boolean;
  specific_knowledge_1_questions: number;
  specific_knowledge_1_weight: number;
  
  // ... outras seções
  
  // Disciplinas customizadas
  has_custom_knowledge: boolean;
  disciplines: DisciplineStructure[];
  
  // Configurações
  alternatives_count: number;
  wrong_answer_penalty: number;
  
  // Quotas
  has_ampla_concorrencia: boolean;
  has_ppp: boolean;
  has_pcd: boolean;
  // ... outras quotas
}
```

#### User Ranking
```typescript
interface UserRanking {
  id: string;
  user_id: string;
  concurso_id: string;
  reservation_type: QuotaType;
  
  // Pontuações
  score: number;
  basic_knowledge_score: number;
  specific_knowledge_1_score: number;
  // ... outras pontuações
  
  // Pontuações ponderadas
  weighted_basic_score: number;
  weighted_specific_1_score: number;
  // ... outras ponderadas
  
  // Notas discursivas
  discursive_score: number;
  case_study_1_score: number;
  // ... outras notas
  
  // Controle
  edit_count: number;
  selected_booklet: string;
}
```

#### User Answers (Consolidado)
```typescript
interface ConsolidatedAnswers {
  booklets: {
    [bookletId: string]: {
      answers: { [questionNumber: string]: string };
      metadata: {
        completed_at: string;
        answer_count: number;
      };
    };
  };
  subjective_scores: {
    discursive: number;
    case_study_1: number;
    case_study_2: number;
    case_study_3: number;
  };
  selected_booklet: string;
  total_edit_count: number;
  metadata: {
    last_updated: string;
    version: string;
  };
}
```

## 🔐 Segurança (RLS - Row Level Security)

### Políticas de Acesso

#### concursos
- **SELECT**: Público (todos podem visualizar)
- **INSERT/UPDATE/DELETE**: Apenas admins ou criadores

#### user_rankings
- **SELECT**: Público (para rankings) + Próprio usuário
- **INSERT**: Usuário autenticado (apenas próprios registros)
- **UPDATE**: Próprio usuário apenas
- **DELETE**: Próprio usuário ou admin

#### user_answers
- **SELECT**: Próprio usuário ou admin
- **INSERT/UPDATE**: Próprio usuário apenas
- **DELETE**: Restrito

#### official_answer_weights
- **SELECT**: Público (gabaritos são públicos)
- **INSERT/UPDATE**: Usuários autenticados (com validação)
- **DELETE**: Restrito

## 🎯 Sistema de Pontuação

### Algoritmo de Cálculo

```typescript
// Pseudo-código do algoritmo
function calculateUserScore(
  answers: UserAnswers,
  officialAnswers: OfficialAnswers,
  concurso: Concurso
): ScoreResult {
  let totalScore = 0;
  let sectionScores = {};
  
  for (question in answers) {
    const section = getSectionTypeForQuestion(question, concurso);
    const official = officialAnswers[question];
    
    if (official.is_nullified) {
      // Questão anulada: todos ganham pontos
      totalScore += official.weight;
      sectionScores[section] += official.weight;
    } else if (answers[question] === official.correct_answer) {
      // Resposta correta
      totalScore += official.weight;
      sectionScores[section] += official.weight;
    } else if (concurso.exam_type === 'Certo ou Errado' && concurso.wrong_answer_penalty > 0) {
      // Resposta errada com penalidade
      totalScore -= concurso.wrong_answer_penalty;
      sectionScores[section] -= concurso.wrong_answer_penalty;
    }
    // Resposta em branco não soma nem subtrai
  }
  
  // Aplicar pesos por seção
  const weightedScores = applyWeights(sectionScores, concurso);
  
  return {
    totalScore,
    sectionScores,
    weightedScores
  };
}
```

## 🔄 Recalculação em Lote

Quando o gabarito é atualizado, o sistema recalcula automaticamente todas as pontuações:

```sql
-- Função PostgreSQL (simplificada)
CREATE FUNCTION recalculate_all_scores_with_weights(p_concurso_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Para cada participante do concurso
  FOR user_record IN 
    SELECT id, user_id FROM user_rankings 
    WHERE concurso_id = p_concurso_id
  LOOP
    -- Recalcular pontuação individual
    PERFORM calculate_user_score_realtime(user_record.id);
  END LOOP;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

## 📊 Performance e Otimização

### Estratégias de Otimização

1. **Caching com React Query**
   - staleTime: 2 minutos para rankings
   - Cache de queries para reduzir chamadas

2. **Dados Consolidados**
   - Estrutura JSON consolidada para respostas
   - Reduz número de registros no banco

3. **Índices de Banco**
   - GIN index em campos JSONB
   - Índices em foreign keys

4. **Batch Operations**
   - Recalculação em lote via RPC
   - Menor overhead de rede

5. **Real-time Subscriptions**
   - Atualização automática via Supabase Realtime
   - Sincronização eficiente

## 🧩 Padrões de Design Utilizados

### 1. **Repository Pattern**
- Abstração do acesso a dados via services
- Separação entre lógica de negócio e persistência

### 2. **Builder Pattern**
- `ExamStructureBuilder` e `ExamSectionBuilder`
- Construção fluente de estruturas complexas

### 3. **Hook Pattern (React)**
- Custom hooks para encapsular lógica
- Reutilização de comportamentos

### 4. **Service Layer Pattern**
- Services dedicados: `rankingService`, `answerKeyService`
- Centralização de lógica de negócio

## 🔌 Integrações

### Supabase
- **Database**: PostgreSQL com RLS
- **Realtime**: Subscrições para atualizações
- **Functions**: RPC para operações complexas
- **Auth**: Autenticação integrada

### React Query
- Cache management
- Invalidação automática
- Optimistic updates

## 🚀 Escalabilidade

### Considerações
- Estrutura modular permite crescimento
- Separação de responsabilidades
- Dados consolidados reduzem volume
- RLS garante segurança em escala

### Limites
- ~5 edições por participação (configurável)
- Batch operations otimizadas para grandes volumes
- Cache estratégico para reduzir latência
