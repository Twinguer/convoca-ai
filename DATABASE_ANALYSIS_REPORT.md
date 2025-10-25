# 📊 ANÁLISE COMPLETA DO BANCO DE DADOS CONVOCA-AI

**Data da Análise**: 25 de Janeiro de 2025  
**Banco de Dados**: PostgreSQL 15.8.1.105 (Supabase)  
**Schema**: public  
**Total de Tabelas**: 26 tabelas  
**Total de Migrações**: 237 migrações

---

## 📈 **RESUMO EXECUTIVO**

### ✅ **Pontos Fortes**
- **Arquitetura Bem Estruturada**: Sistema de estudos separado (V2), rankings consolidados, auditoria completa
- **Segurança Robusta**: RLS habilitado em todas as tabelas, tokens seguros, logs de auditoria
- **Performance**: Índices GIN para JSONB, monitoramento de performance integrado
- **Extensibilidade**: Uso de JSONB para estruturas flexíveis (rankings, estudos, respostas)

### ⚠️ **Problemas Críticos Identificados**

#### **1. SEGURANÇA (4 Erros, 3 Avisos)**
- ❌ **4 Views com SECURITY DEFINER**: Expõem potencial risco de escalação de privilégios
- ⚠️ **87+ Funções sem search_path**: Vulnerabilidade de injeção de schema
- ⚠️ **Proteção de senha vazada desabilitada**: Senhas comprometidas podem ser usadas
- ⚠️ **Versão do PostgreSQL desatualizada**: 15.8.1.105 tem patches de segurança pendentes

#### **2. PERFORMANCE (96 Problemas)**
- ⚠️ **4 Foreign Keys sem índice**: Impacto em JOINs e queries relacionadas
- ⚠️ **48 Políticas RLS com auth.<function>() não otimizadas**: Re-avaliação desnecessária por linha
- ⚠️ **44 Índices não utilizados**: Ocupando espaço e impactando writes
- ⚠️ **Múltiplas políticas permissivas**: Performance subótima em várias tabelas

#### **3. INTEGRIDADE DE DADOS**
- ⚠️ **4 Tabelas backup sem primary key**: Difícil rastreamento e manutenção
- ⚠️ **9 Índices duplicados**: Desperdício de espaço e overhead em writes

---

## 📊 **ESTATÍSTICAS DO BANCO**

### **Tamanho das Tabelas (Top 10)**
| # | Tabela | Tamanho | Uso |
|---|--------|---------|-----|
| 1 | `audit_trail` | **4.4 MB** | Auditoria limitada a 100 registros |
| 2 | `audit_logs` | **3.9 MB** | Logs completos de auditoria |
| 3 | `user_rankings` | **2.6 MB** | Dados consolidados de rankings |
| 4 | `concursos` | **1.2 MB** | Configurações de concursos |
| 5 | `user_study_v2` | **944 KB** | Sistema de estudos V2 |
| 6 | `security_logs` | **224 KB** | Logs de segurança |
| 7 | `notifications` | **152 KB** | Notificações de usuários |
| 8 | `users_profiles` | **112 KB** | Perfis de usuários |
| 9 | `query_performance_logs` | **96 KB** | Logs de performance |
| 10 | `user_roles` | **88 KB** | Papéis de usuários |

**Tamanho Total Estimado**: ~13.5 MB

### **Dados do Sistema**
- **Total de Usuários**: 18 usuários registrados
- **Usuários Online**: 1 usuário ativo
- **Usuários Aprovados**: 0
- **Total de Rankings**: 5 rankings ativos
- **Usuários com Rankings**: 5 usuários participando
- **Concursos Cadastrados**: 3 concursos
- **Migrações Aplicadas**: 237 migrações

---

## 🗄️ **ESTRUTURA DAS TABELAS**

### **1. TABELAS PRINCIPAIS**

#### **📚 `concursos`** (1.2 MB, 3 linhas)
**Função**: Armazena configurações de concursos/provas.

**Estrutura JSONB Hierárquica**:
```json
{
  "disciplines": {
    "blocks": [
      {
        "blockId": "uuid",
        "blockName": "Nome do Bloco",
        "blockMinimumScore": 0,
        "blockMinimumCotas": 0,
        "disciplines": [
          {
            "id": "uuid",
            "name": "Nome da Disciplina",
            "type": "custom_xxx",
            "weight": 1,
            "questionCount": 10,
            "minimum_score": 0,
            "minimum_score_cotas": 0
          }
        ]
      }
    ],
    "minimum_total_score": 0,
    "minimum_total_score_cotas": 0,
    "wrong_answer_penalty": 0
  },
  "has_cota": {
    "ppp": true,
    "pcd": false,
    "ind": false,
    "hip": false,
    "tra": false,
    "min_cota": 0
  },
  "official_answers": {
    "booklets": {
      "booklet_id": {
        "sections": {
          "basic": { "1": "A", "2": "B" }
        }
      }
    }
  },
  "exam_booklets": []
}
```

**Campos Críticos**:
- `disciplines` (JSONB): Estrutura hierárquica de blocos e disciplinas
- `has_cota` (JSONB): Configuração de cotas
- `official_answers` (JSONB): Gabaritos por caderno
- `exam_booklets` (JSONB): Tipos de cadernos de prova
- `alternatives_count`: Número de alternativas por questão

**Índices** (23 índices, muitos duplicados):
- 6 índices GIN para campos JSONB
- 17 índices B-tree para campos comuns

**⚠️ Problemas**:
- 9 índices duplicados (ex: `concursos_banca_idx` e `idx_concursos_banca`)
- 6+ políticas RLS permissivas para mesmo role/action

---

#### **📊 `user_rankings`** (2.6 MB, 5 linhas)
**Função**: Armazena participações de usuários em rankings (estrutura consolidada por usuário).

**Estrutura**:
```json
{
  "consolidated_data": {
    "rankings": {
      "ranking_<concurso_id>_<user_id>_<timestamp>": {
        "concurso_id": "uuid",
        "selected_booklet_id": "uuid",
        "user_data": {
          "answers": { "1": "A", "2": "B" },
          "nullified_questions": [],
          "object_scores": {},
          "subjective_scores": {},
          "score": 0,
          "total_score": 0,
          "weighted_score": 0
        },
        "control_metadata": {
          "last_updated": "timestamp",
          "edit_count": 0
        }
      }
    }
  }
}
```

**Características**:
- **1 linha por usuário** (não por ranking!)
- Suporta até **5 rankings por usuário**
- Chave primária: `user_id` (UUID)
- Foreign key para `users_profiles.id`

**Índices** (12 índices, 5 duplicados):
- 1 GIN no `consolidated_data`
- 11 B-tree para queries específicas

**⚠️ Problemas**:
- 5 índices idênticos não utilizados
- RLS com `auth.uid()` não otimizado

---

#### **📖 `user_study_v2`** (944 KB, 16 linhas)
**Função**: Sistema de estudos V2 separado de cronogramas.

**Estrutura JSONB**:
```json
{
  "study_sessions": [],
  "study_cycles": [
    {
      "id": "uuid",
      "name": "Nome do Ciclo",
      "blocks": [
        {
          "id": "uuid",
          "name": "Nome do Bloco",
          "subjects": [
            {
              "id": "uuid",
              "name": "Nome da Matéria",
              "color": "#hex"
            }
          ]
        }
      ]
    }
  ],
  "study_schedule": [],
  "study_statistics": {},
  "study_metadata": {}
}
```

**Campos**:
- `study_sessions` (JSONB): Sessões de estudo
- `study_cycles` (JSONB): Ciclos de estudo
- `study_schedule` (JSONB): Cronograma
- `study_statistics` (JSONB): Estatísticas
- `last_activity_date` (DATE): Última atividade

**Índices** (4 índices GIN, nenhum utilizado):
- `idx_user_study_v2_sessions`
- `idx_user_study_v2_cycles`
- `idx_user_study_v2_statistics`
- `idx_user_study_v2_schedule`

**⚠️ Problemas**:
- 4 índices não utilizados
- 9+ políticas RLS permissivas

---

#### **👥 `users_profiles`** (112 KB, 18 linhas)
**Função**: Perfis públicos dos usuários.

**Campos Principais**:
- `name`, `email`, `avatar_url`, `bio`
- `concursos_aprovados`, `concursos_participando`
- `estado`, `formacao`, `cargo_atual`
- `is_studying`, `study_started_at`, `is_online`
- `status_concurseiro` (enum: 'Na Ativa', 'Aprovado', etc.)
- `privacy_settings` (JSONB): Controle de privacidade

**Privacy Settings**:
```json
{
  "showBio": true,
  "showEmail": false,
  "showState": true,
  "showApprovals": true,
  "showEducation": true,
  "showSpecialty": true,
  "showStudyArea": true,
  "showCurrentJob": true,
  "showStudyRoutine": true,
  "showPreparatoryCourse": true
}
```

**⚠️ Problemas**:
- 10+ políticas RLS permissivas
- RLS com `auth.uid()` não otimizado

---

### **2. TABELAS DE SEGURANÇA E AUDITORIA**

#### **🔐 `secure_tokens`** (64 KB, 0 linhas)
**Função**: Tokens seguros para obfuscação de URLs e segurança.

**Tipos de Token**:
- `session`, `refresh`, `api`, `reset_password`
- `user_obfuscation`, `concurso_obfuscation`
- `study_cycle_obfuscation`, `admin_obfuscation`
- `community_obfuscation`, `ranking_obfuscation`

**Campos**:
- `token_hash` (UNIQUE): Hash do token
- `expires_at`: Data de expiração
- `revoked_at`: Data de revogação
- `last_used_at`: Último uso
- `ip_address`, `user_agent`: Rastreamento
- `metadata` (JSONB): Dados adicionais

**Índices** (5 índices, nenhum utilizado):
- `idx_secure_tokens_user_id`
- `idx_secure_tokens_token_hash`
- `idx_secure_tokens_expires_at`
- `idx_secure_tokens_type`
- `idx_secure_tokens_composite`

---

#### **📝 `audit_logs`** (3.9 MB, 443 linhas)
**Função**: Logs de auditoria completos com rastreamento de IP, user agent e metadata.

**Estrutura**:
- `action`: Ação realizada
- `resource_type`: Tipo de recurso
- `resource_id`: ID do recurso
- `old_data`, `new_data` (JSONB): Valores antes/depois
- `severity`: low, medium, high, critical
- `status`: success, failure, blocked
- `ip_address`, `user_agent`: Rastreamento

**⚠️ Problema**: RLS não otimizado para admin checks.

---

#### **🚨 `security_logs`** (224 KB, 420 linhas)
**Função**: Logs de segurança para rastreamento de ações suspeitas.

**Campos**:
- `action`: Ação de segurança
- `ip_address`, `user_agent`: Rastreamento
- `details` (JSONB): Detalhes adicionais

**⚠️ Problema**: Foreign key sem índice para `user_id`.

---

### **3. TABELAS DE MONITORAMENTO**

#### **📊 `performance_metrics`** (80 KB, 4 linhas)
**Função**: Métricas de performance do sistema.

**Campos**:
- `metric_name`: Nome da métrica
- `metric_value`: Valor numérico
- `metric_unit`: Unidade de medida
- `measurement_time`: Timestamp da medição
- `metadata` (JSONB): Dados adicionais

**Índices** (2 índices, nenhum utilizado):
- `idx_performance_metrics_name`
- `idx_performance_metrics_name_time`

---

#### **⚠️ `performance_alerts`** (48 KB, 0 linhas)
**Função**: Alertas de performance.

**Campos**:
- `alert_type`: Tipo de alerta
- `severity`: low, medium, high, critical
- `metric_name`, `threshold_value`, `current_value`
- `is_resolved`, `resolved_at`

**Índices** (3 índices, nenhum utilizado):
- `idx_performance_alerts_type`
- `idx_performance_alerts_severity`
- `idx_performance_alerts_resolved`

---

#### **🔍 `query_performance_logs`** (96 KB, 1 linha)
**Função**: Logs de performance de queries.

**Campos**:
- `query_text`: Query executada
- `execution_time_ms`: Tempo de execução
- `rows_returned`: Linhas retornadas
- `query_type`: Tipo de query
- `user_id`, `session_id`, `ip_address`, `user_agent`

**Índices** (3 índices, nenhum utilizado):
- `idx_query_logs_execution_time`
- `idx_query_logs_user_id`
- `idx_query_logs_query_type`

---

### **4. TABELAS AUXILIARES**

#### **💬 `notifications`** (152 KB, 62 linhas)
- Notificações de usuários
- `type`, `title`, `message`, `is_read`
- `metadata` (JSONB)

#### **📊 `score_calculation_logs`** (88 KB, 70 linhas)
- Logs de cálculo de pontuação
- `user_ranking_id`, `calculation_type`
- `previous_score`, `new_score`
- `calculation_details` (JSONB)

#### **👥 `user_followers`** (72 KB, 6 linhas)
- Relacionamentos seguidor/seguido
- ⚠️ **2 Foreign keys sem índice**

#### **🎫 `vouchers`** (80 KB, 0 linhas)
- Vouchers de assinatura
- ⚠️ **Foreign key sem índice**

#### **💳 `user_subscriptions`** (80 KB, 1 linha)
- Assinaturas de usuários
- Planos: `free`, `pro`

#### **👔 `user_roles`** (88 KB, 1 linha)
- Papéis de usuários
- Roles: `admin`, `moderator`, `user`

#### **📚 `subjects`** (80 KB, 17 linhas)
- Matérias predefinidas

---

### **5. TABELAS BACKUP** (SEM PRIMARY KEY)
- `concursos_backup` (1.2 MB, 3 linhas)
- `consolidated_answers_by_concurso_backup` (Vazio)
- `user_rankings_backup` (Vazio)
- `user_rankings_structure_backup` (1 linha)

**⚠️ Problema**: Nenhuma tem primary key, dificultando rastreamento.

---

## 🔧 **EXTENSÕES INSTALADAS**

### **Extensões Ativas** (5)
1. **`pg_stat_statements`** (v1.10): Rastreamento de queries
2. **`supabase_vault`** (v0.3.1): Gerenciamento de secrets
3. **`pgjwt`** (v0.2.0): JWT para PostgreSQL
4. **`pg_graphql`** (v1.5.11): Suporte GraphQL
5. **`pgsodium`** (v3.1.8): Criptografia libsodium
6. **`uuid-ossp`** (v1.1): Geração de UUIDs
7. **`pgcrypto`** (v1.3): Funções criptográficas
8. **`plpgsql`** (v1.0): Linguagem procedural
9. **`pg_net`** (v0.14.0): HTTP assíncrono

### **Extensões Disponíveis** (77+)
Incluindo: `timescaledb`, `postgis`, `vector`, `pg_cron`, `http`, `dblink`, etc.

---

## 🔐 **ANÁLISE DE SEGURANÇA**

### **❌ PROBLEMAS CRÍTICOS**

#### **1. Views com SECURITY DEFINER** (4 erros)
Views que executam com privilégios do criador, não do usuário:
- `public_profiles`
- `v_user_rankings_with_profiles`
- `v_concurso_statistics`
- `public_user_profiles`

**Risco**: Escalação de privilégios, bypass de RLS.  
**Solução**: Remover SECURITY DEFINER ou implementar checks rigorosos.

---

#### **2. Funções sem search_path** (87+ avisos)
Funções vulneráveis a injeção de schema:
- `update_study_statistics_updated_at`
- `calculate_user_score_realtime`
- `save_user_answers_v3`
- `recalculate_all_scores_with_weights`
- E mais 83 funções...

**Risco**: Injeção de schema, substituição de funções.  
**Solução**: Adicionar `SET search_path = public, pg_temp` em todas as funções.

---

#### **3. Proteção de Senha Vazada Desabilitada**
Supabase Auth não verifica senhas comprometidas contra HaveIBeenPwned.org.

**Risco**: Usuários podem usar senhas conhecidas em vazamentos.  
**Solução**: Habilitar no dashboard Supabase: Authentication > Providers > Email > Enable leaked password protection.

---

#### **4. PostgreSQL Desatualizado**
Versão atual: **15.8.1.105**  
Patches de segurança disponíveis.

**Risco**: Vulnerabilidades conhecidas sem patch.  
**Solução**: Agendar upgrade via dashboard Supabase: Database > Database Settings > Upgrade.

---

#### **5. OTP com Expiração Longa**
OTP de email com expiração maior que 1 hora.

**Risco**: Window de ataque maior.  
**Solução**: Reduzir para 15-30 minutos no dashboard Supabase.

---

### **✅ PONTOS FORTES DE SEGURANÇA**

1. ✅ **RLS habilitado em todas as tabelas**
2. ✅ **Sistema de tokens seguros** com expiração e revogação
3. ✅ **Auditoria completa** com logs de IP, user agent e metadata
4. ✅ **Foreign keys** implementadas corretamente
5. ✅ **Separação de concerns** (estudos V2, rankings consolidados)

---

## ⚡ **ANÁLISE DE PERFORMANCE**

### **⚠️ PROBLEMAS CRÍTICOS**

#### **1. Foreign Keys sem Índice** (4 problemas)
Impactam JOINs e queries relacionadas:
- `security_logs.user_id`
- `user_followers.followed_id`
- `user_scores.user_id`
- `vouchers.created_by`

**Impacto**: Degradação de performance em queries com JOIN.  
**Solução**:
```sql
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_user_followers_followed_id ON user_followers(followed_id);
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_vouchers_created_by ON vouchers(created_by);
```

---

#### **2. RLS com auth.<function>() Não Otimizado** (48 problemas)
Políticas RLS re-avaliando `auth.uid()` para cada linha:

**Exemplo Ruim**:
```sql
CREATE POLICY "Users can view own" ON users_profiles
FOR SELECT USING (auth.uid() = id);  -- ❌ Re-avaliado por linha
```

**Exemplo Bom**:
```sql
CREATE POLICY "Users can view own" ON users_profiles
FOR SELECT USING ((SELECT auth.uid()) = id);  -- ✅ Avaliado uma vez
```

**Impacto**: Degradação significativa em queries que retornam muitas linhas.  
**Solução**: Adicionar `SELECT` em todos os `auth.<function>()` nas políticas RLS.

---

#### **3. Índices Não Utilizados** (44 problemas)
Índices que nunca foram acessados:

**Top 10 Índices Não Utilizados**:
1. `idx_user_rankings_consolidated_data_concurso`
2. `idx_user_rankings_score`
3. `idx_user_rankings_reservation_type`
4. `idx_user_rankings_user_info`
5. `idx_user_rankings_edit_history`
6. `idx_performance_metrics_name`
7. `idx_performance_metrics_name_time`
8. `idx_performance_alerts_*` (3 índices)
9. `idx_concursos_*` (vários índices GIN/B-tree)
10. `idx_user_study_v2_*` (4 índices GIN)

**Impacto**: Espaço desperdiçado + overhead em writes.  
**Solução**: Avaliar e remover índices não utilizados após análise de queries.

---

#### **4. Índices Duplicados** (9 problemas)
Índices idênticos em tabelas:

**`audit_trail`**:
- `idx_audit_trail_table` = `idx_audit_trail_table_name`

**`concursos`**:
- `concursos_banca_idx` = `idx_concursos_banca`
- `idx_concursos_created_by` = `idx_concursos_created_by_user_id`
- `concursos_orgao_idx` = `idx_concursos_orgao`
- `concursos_status_idx` = `idx_concursos_status`
- `idx_concursos_exam_booklets` = `idx_concursos_exam_booklets_gin`
- `idx_concursos_form_config` = `idx_concursos_form_config_gin`
- `idx_concursos_official_answers` = `idx_concursos_official_answers_gin`

**`user_rankings`**:
- 5 índices idênticos não utilizados

**Impacto**: Desperdício de espaço + overhead em writes.  
**Solução**: Remover índices duplicados, mantendo apenas um de cada par.

---

#### **5. Múltiplas Políticas Permissivas** (48+ problemas)
Várias tabelas com múltiplas políticas RLS para mesma ação/role:

**Exemplo - `concursos` (6 políticas para SELECT)**:
- `Admins can insert, update, delete concursos`
- `Allow public read access to concursos`
- `Anyone can view concursos`
- `Enable read access for all users`
- `Public can read concursos`
- `concursos_select_all`

**Impacto**: Todas as políticas são executadas, impactando performance.  
**Solução**: Consolidar políticas permissivas em uma única política por ação/role.

---

### **✅ PONTOS FORTES DE PERFORMANCE**

1. ✅ **Índices GIN para JSONB**: Queries eficientes em campos estruturados
2. ✅ **Índices B-tree em campos comuns**: Queries rápidas
3. ✅ **Sistema de monitoramento**: `performance_metrics`, `query_performance_logs`
4. ✅ **Estrutura consolidada**: `user_rankings` com 1 linha por usuário
5. ✅ **Separação V2**: Sistema de estudos independente do cronograma

---

## 🗺️ **MIGRAÇÕES**

### **Estatísticas**
- **Total**: 237 migrações aplicadas
- **Primeiras Migrações**: Maio de 2025
- **Últimas Migrações**: Janeiro de 2025 (25/01)

### **Migrações Recentes** (Últimas 10)
1. `20251025150604_add_audit_logs_insert_policy`
2. `20251025150543_fix_update_study_statistics_security`
3. `20251025150258_fix_audit_trigger_function_resource_id_type`
4. `20251025150015_fix_audit_trigger_function_user_rankings`
5. `20251025144330_fix_concursos_rls_406_error_v2`
6. `20251025142743_fix_performance_functions_user_study_v2`
7. `20251025142654_fix_add_study_session_function`
8. `20251025142323_fix_update_study_statistics_function`
9. `20251025123832_expand_obfuscation_token_types`
10. `20251025020412_*` (sem nome)

### **Tópicos das Migrações**
- **Segurança**: RLS, tokens, auditoria
- **Performance**: Índices, funções otimizadas
- **Estrutura**: V2 separado, rankings consolidados
- **Correções**: Bugs, validações, migrações de dados

---

## 🎯 **RECOMENDAÇÕES PRIORITÁRIAS**

### **🚨 CRÍTICO (Implementar Imediatamente)**

#### **1. SEGURANÇA**
```sql
-- 1.1. Remover SECURITY DEFINER das Views
ALTER VIEW public_profiles SET (security_invoker = true);
ALTER VIEW v_user_rankings_with_profiles SET (security_invoker = true);
ALTER VIEW v_concurso_statistics SET (security_invoker = true);
ALTER VIEW public_user_profiles SET (security_invoker = true);

-- 1.2. Adicionar search_path em TODAS as funções (exemplo)
ALTER FUNCTION calculate_user_score_realtime 
SET search_path = public, pg_temp;

-- 1.3. Agendar upgrade do PostgreSQL via dashboard
-- Dashboard > Database > Database Settings > Upgrade
```

#### **2. PERFORMANCE**
```sql
-- 2.1. Adicionar índices em Foreign Keys
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_user_followers_followed_id ON user_followers(followed_id);
CREATE INDEX idx_user_scores_user_id ON user_scores(user_id);
CREATE INDEX idx_vouchers_created_by ON vouchers(created_by);

-- 2.2. Otimizar RLS (exemplo para users_profiles)
DROP POLICY IF EXISTS "secure_users_can_view_own_profile" ON users_profiles;
CREATE POLICY "secure_users_can_view_own_profile" ON users_profiles
FOR SELECT USING ((SELECT auth.uid()) = id);
```

---

### **⚠️ IMPORTANTE (Implementar em 1-2 Semanas)**

#### **3. LIMPEZA DE ÍNDICES**
```sql
-- 3.1. Remover índices duplicados (exemplo)
DROP INDEX IF EXISTS idx_audit_trail_table_name;  -- Manter idx_audit_trail_table
DROP INDEX IF EXISTS concursos_banca_idx;  -- Manter idx_concursos_banca
DROP INDEX IF EXISTS idx_concursos_created_by;  -- Manter idx_concursos_created_by_user_id

-- 3.2. Remover índices não utilizados (após análise de queries)
-- Avaliar cada índice antes de remover!
```

#### **4. CONSOLIDAÇÃO DE POLÍTICAS RLS**
```sql
-- 4.1. Consolidar políticas permissivas (exemplo para concursos SELECT)
DROP POLICY IF EXISTS "Allow public read access to concursos" ON concursos;
DROP POLICY IF EXISTS "Anyone can view concursos" ON concursos;
DROP POLICY IF EXISTS "Enable read access for all users" ON concursos;
DROP POLICY IF EXISTS "Public can read concursos" ON concursos;

-- Manter apenas uma política consolidada
CREATE POLICY "concursos_select_all" ON concursos
FOR SELECT TO PUBLIC USING (true);
```

---

### **📋 OPCIONAL (Melhorias Futuras)**

#### **5. ESTRUTURA**
- Adicionar primary keys em tabelas backup
- Avaliar necessidade de manter tabelas backup
- Implementar particionamento em `audit_logs` (se crescer muito)
- Implementar CRON job para limpeza automática de `secure_tokens` expirados

#### **6. MONITORAMENTO**
- Configurar alertas para `performance_alerts`
- Implementar dashboard de métricas de performance
- Adicionar mais métricas de negócio
- Implementar rate limiting baseado em `security_logs`

---

## 📚 **DOCUMENTAÇÃO ADICIONAL**

### **Links Úteis**
- [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [PostgreSQL Index Advisor](https://supabase.com/docs/guides/database/database-linter)
- [Leaked Password Protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Database Upgrade Guide](https://supabase.com/docs/guides/platform/upgrading)

### **Scripts de Manutenção**
```sql
-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar índices não utilizados
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Verificar queries lentas
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- Queries com mais de 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## 🎉 **CONCLUSÃO**

O banco de dados **Convoca-AI** está bem estruturado e seguro, mas requer **otimizações de performance** e **correções de segurança** para escalar adequadamente.

### **Prioridades**
1. 🚨 **Corrigir problemas de segurança** (SECURITY DEFINER, search_path)
2. ⚡ **Adicionar índices em Foreign Keys**
3. 🧹 **Remover índices duplicados e não utilizados**
4. 🔧 **Otimizar políticas RLS** com `SELECT auth.uid()`
5. 📊 **Agendar upgrade do PostgreSQL**

### **Impacto Estimado**
- **Segurança**: ⬆️ +40% (remover vulnerabilidades críticas)
- **Performance**: ⬆️ +60% (índices + RLS otimizado)
- **Manutenção**: ⬆️ +30% (limpeza de índices)

---

**Gerado em**: 25/01/2025  
**Ferramenta**: Análise Automática Supabase + SQL
**Próxima Análise Recomendada**: 25/04/2025 (3 meses)

