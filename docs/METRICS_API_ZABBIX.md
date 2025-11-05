# 📊 API de Métricas para Monitoramento Zabbix

Esta documentação descreve como usar a API de métricas do sistema para monitoramento via Zabbix HTTP Agent.

## 🔗 URL da API

**Endpoint Base:**
```
https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/metrics
```

**Método:** `GET`

**Autenticação:** Não requerida (público, mas recomendado usar IP whitelist no Supabase)

---

## 📋 Formato da Resposta

A API retorna um JSON com as seguintes métricas:

```json
{
  "timestamp": "2025-01-27T10:30:00.000Z",
  "status": "ok",
  "metrics": {
    "users": {
      "total": 1250,
      "online": 45,
      "active_24h": 320,
      "active_7d": 850
    },
    "rankings": {
      "total": 150,
      "active": 25,
      "participations": 3500,
      "participations_24h": 120
    },
    "scores": {
      "average": 75.5,
      "highest": 98.5,
      "lowest": 45.0,
      "total_scored": 3500
    },
    "studies": {
      "total_cycles": 450,
      "active_cycles": 120,
      "total_sessions": 3200,
      "total_hours": 1250.75,
      "questions_answered": 45000,
      "correct_answers": 31500,
      "accuracy_rate": 70.0
    },
    "coach": {
      "total_coaches": 25,
      "active_subscriptions": 20,
      "total_students": 150,
      "pending_invitations": 15,
      "access_logs_24h": 45
    },
    "security": {
      "audit_logs_24h": 120,
      "security_logs_24h": 8,
      "total_security_events": 1250
    },
    "notifications": {
      "total": 850,
      "unread": 120,
      "created_24h": 45
    },
    "performance": {
      "avg_query_time_ms": 125.5,
      "slow_queries_count": 3,
      "active_alerts": 2,
      "critical_alerts": 0
    },
    "system": {
      "health": "healthy",
      "engagement_rate": 25,
      "uptime_percentage": 99.9
    }
  }
}
```

---

## 🔧 Configuração no Zabbix

### 1. Criar Item HTTP Agent

1. Acesse: **Configuration → Hosts → Items → Create Item**
2. Configure:
   - **Name:** `ConvoCAI - Métricas do Sistema`
   - **Type:** `HTTP Agent`
   - **Key:** `convoca.metrics`
   - **URL:** `https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/metrics`
   - **Request Method:** `GET`
   - **Request Type:** `JSON`
   - **Update Interval:** `60s` (ou conforme necessário)

### 2. Criar Item Dependente para Métricas Específicas

Para cada métrica que deseja monitorar, crie um item dependente:

#### Exemplo: Total de Usuários

- **Name:** `ConvoCAI - Total de Usuários`
- **Type:** `Dependent Item`
- **Key:** `convoca.metrics.users.total`
- **Master Item:** `convoca.metrics` (item criado acima)
- **Preprocessing:**
  - **Step 1:** `JSONPath`
  - **Path:** `$.metrics.users.total`
  - **Type:** `Numeric (unsigned)`

#### Exemplo: Saúde do Sistema

- **Name:** `ConvoCAI - Saúde do Sistema`
- **Type:** `Dependent Item`
- **Key:** `convoca.metrics.system.health`
- **Master Item:** `convoca.metrics`
- **Preprocessing:**
  - **Step 1:** `JSONPath`
  - **Path:** `$.metrics.system.health`
  - **Step 2:** `JavaScript (ou Regex)`
  - **Script:** 
    ```javascript
    if (value === 'critical') return 3;
    if (value === 'warning') return 2;
    if (value === 'healthy') return 1;
    return 0;
    ```
  - **Type:** `Numeric (unsigned)`

---

## 📊 Métricas Disponíveis

### 👥 Métricas de Usuários

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.users.total` | Total de usuários cadastrados | Numérico | usuários |
| `$.metrics.users.online` | Usuários online no momento | Numérico | usuários |
| `$.metrics.users.active_24h` | Usuários ativos nas últimas 24h | Numérico | usuários |
| `$.metrics.users.active_7d` | Usuários ativos nos últimos 7 dias | Numérico | usuários |

### 🏆 Métricas de Rankings

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.rankings.total` | Total de rankings cadastrados | Numérico | rankings |
| `$.metrics.rankings.active` | Rankings em andamento | Numérico | rankings |
| `$.metrics.rankings.participations` | Total de participações | Numérico | participações |
| `$.metrics.rankings.participations_24h` | Participações nas últimas 24h | Numérico | participações |

### 📊 Métricas de Pontuações

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.scores.average` | Pontuação média | Numérico | pontos |
| `$.metrics.scores.highest` | Maior pontuação | Numérico | pontos |
| `$.metrics.scores.lowest` | Menor pontuação | Numérico | pontos |
| `$.metrics.scores.total_scored` | Total de participações com pontuação | Numérico | participações |

### 📚 Métricas de Estudos

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.studies.total_cycles` | Total de ciclos de estudos | Numérico | ciclos |
| `$.metrics.studies.active_cycles` | Ciclos ativos (últimos 30 dias) | Numérico | ciclos |
| `$.metrics.studies.total_sessions` | Total de sessões de estudo | Numérico | sessões |
| `$.metrics.studies.total_hours` | Total de horas estudadas | Numérico | horas |
| `$.metrics.studies.questions_answered` | Total de perguntas respondidas | Numérico | perguntas |
| `$.metrics.studies.correct_answers` | Total de respostas corretas | Numérico | respostas |
| `$.metrics.studies.accuracy_rate` | Taxa de acerto (%) | Numérico | percentual |

### 👨‍🏫 Métricas de Coach

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.coach.total_coaches` | Total de coaches cadastrados | Numérico | coaches |
| `$.metrics.coach.active_subscriptions` | Assinaturas ativas | Numérico | assinaturas |
| `$.metrics.coach.total_students` | Total de alunos sendo treinados | Numérico | alunos |
| `$.metrics.coach.pending_invitations` | Convites pendentes | Numérico | convites |
| `$.metrics.coach.access_logs_24h` | Logs de acesso (últimas 24h) | Numérico | logs |

### 🔒 Métricas de Segurança

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.security.audit_logs_24h` | Logs de auditoria (24h) | Numérico | logs |
| `$.metrics.security.security_logs_24h` | Logs de segurança (24h) | Numérico | logs |
| `$.metrics.security.total_security_events` | Total de eventos de segurança | Numérico | eventos |

### 🔔 Métricas de Notificações

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.notifications.total` | Total de notificações | Numérico | notificações |
| `$.metrics.notifications.unread` | Notificações não lidas | Numérico | notificações |
| `$.metrics.notifications.created_24h` | Notificações criadas (24h) | Numérico | notificações |

### ⚡ Métricas de Performance

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.performance.avg_query_time_ms` | Tempo médio de queries | Numérico | milissegundos |
| `$.metrics.performance.slow_queries_count` | Quantidade de queries lentas (>1s) | Numérico | queries |
| `$.metrics.performance.active_alerts` | Alertas de performance ativos | Numérico | alertas |
| `$.metrics.performance.critical_alerts` | Alertas críticos ativos | Numérico | alertas |

### 🖥️ Métricas de Sistema

| Caminho JSONPath | Descrição | Tipo | Unidade |
|-----------------|-----------|------|---------|
| `$.metrics.system.health` | Saúde do sistema | Texto | "healthy", "warning", "critical" |
| `$.metrics.system.engagement_rate` | Taxa de engajamento (%) | Numérico | percentual |
| `$.metrics.system.uptime_percentage` | Uptime estimado | Numérico | percentual |

---

## 🚨 Configuração de Triggers

### Exemplo: Alerta de Saúde Crítica

**Trigger:**
- **Name:** `ConvoCAI - Sistema com Saúde Crítica`
- **Expression:** `{convoca.metrics.system.health:last()}=3`
- **Severity:** `High`
- **Description:** `Sistema em estado crítico. Verificar métricas de performance e alertas.`

### Exemplo: Muitas Queries Lentas

**Trigger:**
- **Name:** `ConvoCAI - Alto Número de Queries Lentas`
- **Expression:** `{convoca.metrics.performance.slow_queries_count:last()}>10`
- **Severity:** `Warning`
- **Description:** `Sistema com {ITEM.VALUE} queries lentas (>1s).`

### Exemplo: Baixo Engajamento

**Trigger:**
- **Name:** `ConvoCAI - Engajamento de Usuários Baixo`
- **Expression:** `{convoca.metrics.system.engagement_rate:last()}<10`
- **Severity:** `Warning`
- **Description:** `Taxa de engajamento abaixo de 10%. Apenas {ITEM.VALUE}% dos usuários estão ativos.`

---

## 🔒 Segurança

### Recomendações

1. **IP Whitelist no Supabase:**
   - Configure o IP do servidor Zabbix no painel do Supabase
   - Acesse: **Project Settings → API → Edge Functions → IP Restrictions**

2. **Autenticação (Opcional):**
   - Se necessário, adicione um header de autenticação na edge function
   - Configure no Zabbix: **Headers → Add → `Authorization: Bearer <token>`**

3. **Rate Limiting:**
   - A API está configurada para aceitar requisições frequentes
   - Recomendado: intervalo de coleta de 60 segundos ou mais

---

## 📝 Exemplo de Teste Manual

```bash
# Teste via cURL
curl -X GET \
  "https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/metrics" \
  -H "Content-Type: application/json"

# Teste com jq (formatação)
curl -s "https://ppsymqrdtjyaguftracc.supabase.co/functions/v1/metrics" | jq .
```

---

## 🛠️ Troubleshooting

### Erro 500 - Internal Server Error

- Verifique os logs da edge function no Supabase Dashboard
- Confirme que as tabelas `users_profiles`, `concursos`, `user_rankings` existem
- Verifique se as tabelas `performance_alerts` e `query_performance_logs` existem (opcional)

### Erro 403 - Forbidden

- Verifique se o IP do Zabbix está na whitelist do Supabase
- Confirme que a função está configurada com `verify_jwt = false` no `config.toml`

### Métricas retornando 0

- Verifique se as tabelas têm dados
- Confirme que as colunas `is_online`, `last_activity` existem em `users_profiles`
- Verifique se o status dos rankings está sendo salvo corretamente

---

## 📚 Referências

- [Zabbix HTTP Agent Documentation](https://www.zabbix.com/documentation/current/manual/config/items/itemtypes/http)
- [JSONPath Syntax](https://goessner.net/articles/JsonPath/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Última atualização:** 27 de Janeiro de 2025

