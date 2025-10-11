# Módulo de Ranking - Convoca AI

Este é o módulo isolado de gerenciamento de Rankings do sistema Convoca AI.

## 📁 Estrutura do Módulo

```
RankingNew/
├── pages/                          # Páginas principais do ranking
│   ├── PreClassificacao.tsx       # Lista de rankings disponíveis
│   ├── Resultado.tsx              # Resultados de concursos
│   ├── ResultadosPage.tsx         # Página de resultados detalhados
│   ├── ConcursoDetails.tsx        # Detalhes de um concurso
│   ├── ConcursoParticipation.tsx  # Formulário de participação
│   └── CriarRanking.tsx           # Criação de novos rankings
│
├── modules/rankings/              # Módulo de rankings
│   └── pages/
│       └── RankingsPage.tsx       # Página principal de rankings
│
├── components/                    # Componentes React
│   ├── rankings/                  # Componentes específicos de ranking
│   │   ├── RankingList.tsx       # Lista de rankings
│   │   ├── RankingPosition.tsx   # Posição no ranking
│   │   └── RankingActions.tsx    # Ações do ranking
│   │
│   ├── resultados/               # Componentes de resultados
│   │   ├── AnswerSheet.tsx       # Folha de respostas
│   │   ├── AnswerMatrix.tsx      # Matriz de respostas
│   │   ├── AnswerOption.tsx      # Opção de resposta
│   │   ├── QuestionCell.tsx      # Célula de questão
│   │   ├── RankingTable.tsx      # Tabela de ranking
│   │   ├── RankingCard.tsx       # Card de ranking
│   │   ├── ScoreForm.tsx         # Formulário de notas
│   │   ├── BookletSelector.tsx   # Seletor de caderno
│   │   ├── BookletSwitcher.tsx   # Alternador de caderno
│   │   ├── QuotaSelector.tsx     # Seletor de cota
│   │   ├── DiscursiveSection.tsx # Seção discursiva
│   │   ├── DiscursiveScoresSection.tsx # Notas discursivas
│   │   ├── ConcursoInfoCard.tsx  # Card de informações
│   │   ├── ExamTypeWarning.tsx   # Aviso de tipo de prova
│   │   ├── LoadingState.tsx      # Estado de carregamento
│   │   └── SectionToggle.tsx     # Alternador de seção
│   │
│   ├── Admin/                    # Componentes administrativos
│   │   ├── AnswerKeyForm.tsx     # Formulário de gabarito
│   │   ├── NullifyQuestionButton.tsx # Botão anular questão
│   │   ├── CreateRanking/        # Criação de ranking
│   │   │   ├── AnswerKeyTab.tsx
│   │   │   ├── BasicInfoSection.tsx
│   │   │   ├── BookletAnswerKeySelector.tsx
│   │   │   ├── ExamBookletsSection.tsx
│   │   │   ├── ExamStructureSection.tsx
│   │   │   ├── GeneralTab.tsx
│   │   │   ├── MinimumScoreSection.tsx
│   │   │   └── ReservationQuotasSection.tsx
│   │   │
│   │   └── FormSections/         # Seções de formulário
│   │       ├── ExamStructureSection.tsx
│   │       ├── GeneralInfoSection.tsx
│   │       ├── ReservationQuotasSection.tsx
│   │       └── StateSelector.tsx
│   │
│   └── ConcursoCard.tsx          # Card de concurso
│
├── hooks/                         # Hooks personalizados
│   ├── useRankingsData.tsx       # Dados de rankings
│   ├── useResultadosData.tsx     # Dados de resultados
│   ├── useDeleteRanking.ts       # Deletar ranking
│   ├── useLeaveRanking.ts        # Sair do ranking
│   ├── useParticipantCount.tsx   # Contador de participantes
│   ├── useRankingCreatorInfo.tsx # Info do criador
│   ├── useSaveRanking.ts         # Salvar ranking
│   ├── useBookletAnswerKey.tsx   # Gabarito por caderno
│   ├── useConsolidatedAnswerKey.tsx # Gabarito consolidado
│   ├── useOfficialAnswerWeights.tsx # Pesos oficiais
│   ├── useAnswerKeyCompleteness.ts  # Completude do gabarito
│   │
│   ├── useAnswerSheet/           # Folha de respostas
│   │   ├── index.tsx
│   │   ├── fetchExistingAnswers.tsx
│   │   ├── matrixUtils.tsx
│   │   ├── questionCountUtils.tsx
│   │   ├── sectionUtils.tsx
│   │   ├── useAnswerManagement.tsx
│   │   ├── useScoreManagement.tsx
│   │   └── initializeQuestionTypes.tsx
│   │
│   └── useSaveAnswers/           # Salvar respostas
│       ├── index.tsx
│       ├── types.ts
│       ├── prepareData.ts
│       └── validation.ts
│
├── services/                      # Serviços de negócio
│   ├── rankingService.ts         # Serviço principal de ranking
│   ├── scoring.ts                # Sistema de pontuação
│   ├── scoring.test.ts           # Testes de pontuação
│   ├── concursoService.ts        # Serviço de concursos
│   ├── consolidatedAnswerService.ts # Respostas consolidadas
│   │
│   └── answerKeyService/         # Serviço de gabaritos
│       ├── index.ts
│       ├── core.ts
│       ├── save.ts
│       ├── stats.ts
│       └── types.ts
│
├── integrations/                  # Integrações
│   └── supabase/
│       ├── client.ts             # Cliente Supabase
│       ├── rankings.ts           # Exportações de ranking
│       │
│       └── rankings/             # Módulo de rankings
│           ├── index.ts
│           ├── examStructure.ts      # Estrutura de exame
│           ├── rankingQueries.ts     # Queries de ranking
│           ├── rankingMutations.ts   # Mutações de ranking
│           ├── answerManagement.ts   # Gestão de respostas
│           ├── userAnswers.ts        # Respostas do usuário
│           ├── userRankings.ts       # Rankings do usuário
│           ├── concursoManager.ts    # Gestor de concursos
│           ├── batchOperations.ts    # Operações em lote
│           └── sectionUtils.ts       # Utilitários de seção
│
├── models/                        # Modelos de dados
│   └── examBuilder/
│       ├── ExamStructureBuilder.ts
│       └── ExamSectionBuilder.ts
│
└── types/                         # Definições de tipos
    └── concursos.ts              # Tipos de concursos

```

## 🎯 Funcionalidades Principais

### 1. Gestão de Rankings
- Criação e edição de rankings
- Visualização de rankings públicos
- Participação em rankings
- Sistema de quotas (Ampla Concorrência, PCD, PPP, etc.)

### 2. Sistema de Respostas
- Folha de respostas interativa
- Suporte a múltiplos cadernos de prova
- Sistema de pontuação automático
- Validação de respostas

### 3. Cálculo de Pontuação
- Pontuação ponderada por disciplina
- Suporte a questões anuladas
- Penalização por respostas erradas (opcional)
- Notas discursivas

### 4. Administração
- Gerenciamento de gabaritos oficiais
- Anulação de questões
- Controle de estrutura de prova
- Gestão de cadernos

## 🔧 Tecnologias Utilizadas

- **React** com TypeScript
- **Supabase** para backend e banco de dados
- **TanStack Query** para gerenciamento de estado
- **Tailwind CSS** para estilização
- **Zod** para validação de dados

## 📊 Fluxo de Dados

1. **Criação de Ranking** → Supabase → Validação → Banco de Dados
2. **Participação** → Seleção de Quota → Escolha de Caderno → Respostas
3. **Pontuação** → Cálculo Automático → Recalculação em Lote → Atualização
4. **Visualização** → Rankings → Filtros por Quota → Posições

## 🗄️ Estrutura de Banco de Dados

### Principais Tabelas:
- `concursos` - Informações dos concursos/rankings
- `user_rankings` - Participações dos usuários
- `user_answers` - Respostas consolidadas
- `official_answer_weights` - Gabaritos oficiais
- `exam_booklets` - Cadernos de prova
- `consolidated_answers_by_concurso` - Cache de respostas

## 🚀 Como Usar

### Integração Básica

```typescript
// Exemplo de uso do hook de rankings
import { useRankingsData } from './hooks/useRankingsData';

function RankingsList() {
  const { rankings, isLoading } = useRankingsData();
  
  if (isLoading) return <div>Carregando...</div>;
  
  return (
    <RankingList 
      rankings={rankings} 
      isLoading={isLoading}
    />
  );
}
```

### Sistema de Pontuação

```typescript
import { calculateScore } from './services/scoring';

const score = calculateScore({
  answers: userAnswers,
  officialAnswers: gabarito,
  concursoStructure: concurso
});
```

## 📝 Notas Importantes

- Este módulo foi extraído do sistema principal Convoca AI
- Mantém todas as funcionalidades relacionadas a rankings
- Utiliza Supabase como backend
- Sistema de pontuação robusto e validado

## 🔐 Segurança

- RLS (Row Level Security) implementado no Supabase
- Validação de dados no frontend e backend
- Logs de auditoria para ações críticas
- Controle de permissões por usuário

## 🧪 Testes

```bash
# Executar testes de pontuação
npm test scoring.test.ts
```

## 📚 Documentação Adicional

- Ver `RankingUpdateFlow.md` para fluxo de atualização
- Ver documentação do Supabase para estrutura de banco
