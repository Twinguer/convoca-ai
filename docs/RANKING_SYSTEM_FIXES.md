# Correções do Sistema de Rankings - Janeiro 2025

## 🎯 Resumo das Correções

Este documento detalha as correções realizadas no sistema de rankings para migrar da estrutura de colunas individuais para JSONB e corrigir problemas de exibição e funcionalidade.

## 📋 Problemas Identificados e Soluções

### 1. Campos Básicos do Concurso Não Salvavam

**Problema:** Os campos `vagas`, `inscritos`, `etapa_atual` e `link` não estavam sendo salvos no banco de dados.

**Solução:**
- Adicionados campos no `dataToSubmit` inicial em `useSaveRanking.ts`
- Incluídos campos no `formData` do `CriarRanking.tsx`
- Mapeamento correto no `concursoService.ts`

**Arquivos Modificados:**
- `src/hooks/useSaveRanking.ts`
- `src/pages/CriarRanking.tsx`
- `src/services/concursoService.ts`

### 2. Migração para Estrutura JSONB

**Problema:** Sistema usava colunas individuais para cotas e disciplinas subjetivas, causando complexidade e inconsistências.

**Solução:**
- Criada coluna `has_cota` (JSONB) para configuração de cotas
- Criada coluna `subjects` (JSONB) para disciplinas subjetivas
- Removidas colunas antigas através de migrações
- Atualizados todos os componentes para usar nova estrutura

**Estrutura JSONB:**
```json
// has_cota
{
  "ppp": boolean,
  "pcd": boolean,
  "ind": boolean,
  "hip": boolean,
  "tra": boolean,
  "min_cota": number
}

// subjects
{
  "discr": boolean,
  "case1": boolean,
  "case2": boolean,
  "case3": boolean,
  "other": boolean,
  "name_other": string,
  "discr_min_score": number,
  "case1_min_score": number,
  "case2_min_score": number,
  "case3_min_score": number,
  "other_min_score": number
}
```

**Arquivos Modificados:**
- `src/components/resultados/RankingTable.tsx`
- `src/components/resultados/QuotaSelector.tsx`
- `src/components/Admin/CreateRanking/ReservationQuotasSection.tsx`
- `src/hooks/useSaveRanking.ts`

### 3. Exibição de Posição "E" para Eliminados

**Problema:** Card de ranking sempre exibia posição numérica, mesmo para usuários eliminados.

**Solução:**
- Adicionado campo `belowMinimum` na interface `RankingCardProps`
- Implementada lógica condicional para exibir "E" quando eliminado
- Badge vermelho para eliminados, amarelo para classificados

**Arquivos Modificados:**
- `src/components/resultados/RankingCard.tsx`

### 4. Problemas de CSS e Cores Fixas

**Problema:** Elementos de vagas e inscritos tinham cores de fundo fixas que não se adaptavam ao tema.

**Solução:**
- Adicionada classe `bg-transparent` para elementos de vagas/inscritos
- Corrigida cor verde fixa no badge de inscritos
- Garantida adaptação ao tema claro/escuro

**Arquivos Modificados:**
- `src/components/resultados/RankingCard.tsx`
- `src/components/resultados/ConcursoInfoCard.tsx`
- `src/pages/ConcursoDetails.tsx`
- `src/modules/rankings/pages/RankingsPage.tsx`

### 5. Funções PostgreSQL Desatualizadas

**Problema:** Funções do banco referenciavam colunas removidas, causando erros.

**Solução:**
- Atualizada função `recalculate_all_scores_with_weights`
- Atualizada função `validate_concurso_questions`
- Removidas referências a colunas antigas

**Arquivos Modificados:**
- `supabase/migrations/fix_recalculate_function_remove_minimum_score_type.sql`
- `supabase/migrations/fix_recalculate_function_remove_wrong_answer_penalty.sql`
- `supabase/migrations/fix_validate_concurso_questions_function.sql`

## 🗃️ Migrações do Banco de Dados

### Novas Migrações Criadas:
1. `20250116000001_add_has_cota_column.sql` - Adiciona coluna `has_cota` JSONB
2. `20250116000002_remove_old_quota_subjective_columns.sql` - Remove colunas antigas de cotas
3. `20250116000003_remove_minimum_score_columns.sql` - Remove colunas de pontuação mínima
4. `20250116000004_remove_wrong_answer_penalty.sql` - Remove coluna de penalidade

### Colunas Removidas:
- `has_discursive`, `has_case_study_1`, `has_case_study_2`, `has_case_study_3`
- `has_other_subjective`, `other_subjective_name`
- `discursive_minimum_score`, `case_study_1_minimum_score`, etc.
- `has_ppp`, `has_pcd`, `has_hipossuficientes`, `has_indigenas`, `has_transsexuais`
- `minimum_score_type`, `wrong_answer_penalty`

## 🔧 Componentes Atualizados

### Formulários:
- `BasicInfoSection.tsx` - Campos de vagas e inscritos
- `ReservationQuotasSection.tsx` - Mapeamento JSONB para cotas
- `ExamStructureSection.tsx` - Disciplinas subjetivas

### Exibição:
- `RankingTable.tsx` - Nova estrutura de cotas e disciplinas
- `RankingCard.tsx` - Posição "E" para eliminados
- `QuotaSelector.tsx` - Seleção de cotas via JSONB
- `ConcursoInfoCard.tsx` - Exibição de vagas/inscritos

### Serviços:
- `concursoService.ts` - Mapeamento correto de campos
- `useSaveRanking.ts` - Salvamento de campos básicos
- `rankingService.ts` - Estrutura de dados atualizada

## ✅ Resultados Alcançados

1. **Sistema Funcional:** Rankings são criados, editados e exibidos corretamente
2. **Estrutura Moderna:** Migração completa para JSONB
3. **Interface Corrigida:** Todos os elementos exibem dados corretos
4. **Banco Otimizado:** Colunas desnecessárias removidas
5. **Compatibilidade:** Sistema mantém funcionalidade existente

## 🚀 Próximos Passos

- Monitorar performance com nova estrutura JSONB
- Considerar índices adicionais se necessário
- Documentar APIs para desenvolvedores
- Implementar testes automatizados para nova estrutura

## 📊 Estatísticas do Commit

- **37 arquivos modificados**
- **527 inserções, 529 deleções**
- **4 novas migrações criadas**
- **Sistema totalmente funcional**

---

*Documentação criada em: Janeiro 2025*  
*Sistema: Convoca AI - Plataforma de Rankings*
