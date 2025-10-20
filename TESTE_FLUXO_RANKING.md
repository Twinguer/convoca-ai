# 🧪 TESTE COMPLETO DO FLUXO DE CRIAÇÃO DE RANKING

## 📋 CHECKLIST DE TESTES

### **1. ✅ CRIAÇÃO DO RANKING**

#### **1.1 Acesso à Página**
- [ ] Acessar `http://localhost:8080/criar-ranking`
- [ ] Verificar se a página carrega sem erros
- [ ] Verificar se não há erros no console

#### **1.2 Preenchimento dos Dados Básicos**
- [ ] **Título**: "TESTE RANKING NOVA ESTRUTURA"
- [ ] **Órgão**: "TESTE ORG"
- [ ] **Banca**: "FGV"
- [ ] **Tipo de Prova**: "Alternativas"
- [ ] **Número de Alternativas**: 5
- [ ] **Vagas**: 10
- [ ] **Data de Início**: Data atual
- [ ] **Data de Fim**: Data atual + 7 dias

#### **1.3 Estrutura da Prova (NOVA ESTRUTURA JSONB)**
- [ ] **Adicionar Bloco 1**:
  - Nome: "Bloco Matemática"
  - Nota mínima: 5
  - Nota mínima cotas: 3
- [ ] **Adicionar Disciplina no Bloco 1**:
  - Nome: "Matemática"
  - Tipo: "custom_math123"
  - Nº de Questões: 15
  - Peso: 1
  - Nota mínima: 2
  - Nota mínima cotas: 1
- [ ] **Adicionar Bloco 2**:
  - Nome: "Bloco Português"
  - Nota mínima: 4
  - Nota mínima cotas: 2
- [ ] **Adicionar Disciplina no Bloco 2**:
  - Nome: "Português"
  - Tipo: "custom_port456"
  - Nº de Questões: 10
  - Peso: 1
  - Nota mínima: 1
  - Nota mínima cotas: 0.5

#### **1.4 Mínimos Globais**
- [ ] **Nota mínima geral**: 8
- [ ] **Nota mínima cotas**: 5

#### **1.5 Cadernos**
- [ ] **Adicionar Caderno T1**:
  - Nome: "T1"
  - Ordem: 1
- [ ] **Adicionar Caderno T2**:
  - Nome: "T2"
  - Ordem: 2

### **2. ✅ SALVAMENTO DO RANKING**

#### **2.1 Salvar Estrutura**
- [ ] Clicar em "Salvar Estrutura"
- [ ] Verificar se não há erros no console
- [ ] Verificar se a mensagem de sucesso aparece
- [ ] Verificar se o ranking é redirecionado para a aba "Gabarito Oficial"

#### **2.2 Verificar Estrutura JSONB no Banco**
- [ ] Verificar se `disciplines` foi salvo como objeto JSONB
- [ ] Verificar se contém `minimum_total_score` e `minimum_total_score_cotas`
- [ ] Verificar se contém `blocks` com as disciplinas
- [ ] Verificar se `questionCount` está correto (15 e 10)

### **3. ✅ GABARITO OFICIAL**

#### **3.1 Preenchimento do Gabarito**
- [ ] **Seção T1(Selecionado)**:
  - Verificar se mostra "15/15 questões" (não 15/0)
  - Preencher respostas: A, B, C, D, E, A, B, C, D, E, A, B, C, D, E
- [ ] **Seção T2(Selecionado)**:
  - Verificar se mostra "10/10 questões" (não 10/0)
  - Preencher respostas: A, B, C, D, E, A, B, C, D, E

#### **3.2 Salvar Gabarito**
- [ ] Clicar em "Salvar Gabarito"
- [ ] Verificar se não há erros no console
- [ ] Verificar se a mensagem de sucesso aparece

### **4. ✅ PARTICIPAÇÃO NO RANKING**

#### **4.1 Acessar Ranking**
- [ ] Ir para a página de resultados
- [ ] Encontrar o ranking criado
- [ ] Clicar em "Participar"

#### **4.2 Preenchimento das Respostas**
- [ ] **Seção T1**:
  - Verificar se o cartão de respostas aparece
  - Verificar se mostra 15 questões
  - Preencher algumas respostas: A, B, C, D, E, A, B, C, D, E, A, B, C, D, E
- [ ] **Seção T2**:
  - Verificar se o cartão de respostas aparece
  - Verificar se mostra 10 questões
  - Preencher algumas respostas: A, B, C, D, E, A, B, C, D, E

#### **4.3 Salvar Respostas**
- [ ] Clicar em "Salvar Respostas"
- [ ] Verificar se não há erros no console
- [ ] Verificar se a mensagem de sucesso aparece

### **5. ✅ VERIFICAÇÃO DOS DADOS**

#### **5.1 Verificar Console (Sem Erros)**
- [ ] Não deve aparecer "disciplines is not iterable"
- [ ] Não deve aparecer "TypeError: disciplines.forEach is not a function"
- [ ] Não deve aparecer "createAnswerMatrix returning empty matrix"
- [ ] Deve aparecer logs de migração: "[migrateObjectScores]", "[createInitialObjectScores]"

#### **5.2 Verificar Estrutura no Banco**
- [ ] `user_rankings.consolidated_data` deve conter `object_scores` com as disciplinas corretas
- [ ] `object_scores` deve ter `custom_math123` e `custom_port456`
- [ ] Estrutura deve estar na nova hierarquia JSONB

#### **5.3 Verificar Tabela de Classificação**
- [ ] Tabela deve mostrar as disciplinas corretas
- [ ] Não deve estar vazia
- [ ] Deve mostrar pontuações por disciplina

### **6. ✅ TESTES DE COMPATIBILIDADE**

#### **6.1 Teste com Dados Antigos**
- [ ] Criar ranking com estrutura antiga (se possível)
- [ ] Verificar se migração automática funciona
- [ ] Verificar se dados antigos são preservados

#### **6.2 Teste de Performance**
- [ ] Verificar se não há travamentos
- [ ] Verificar se salvamento é rápido
- [ ] Verificar se carregamento é rápido

## 🚨 PONTOS CRÍTICOS A OBSERVAR

### **❌ ERROS QUE NÃO DEVEM APARECER:**
1. `TypeError: disciplines is not iterable`
2. `TypeError: disciplines.forEach is not a function`
3. `[createAnswerMatrix] Números das questões para seção: Array(0)`
4. `[getQuestionMatrixForSection] Matriz criada: [[null]]`
5. Contagem de questões incorreta (15/0 em vez de 15/15)

### **✅ LOGS QUE DEVEM APARECER:**
1. `[migrateObjectScores] Migrando object_scores existente para nova estrutura`
2. `[createInitialObjectScores] Criando object_scores inicial baseado na estrutura do concurso`
3. `[getTotalQuestions] Usando nova estrutura hierárquica com blocks`
4. `[getSectionQuestionsDict] Usando nova estrutura hierárquica com blocks`

## 📊 RESULTADO ESPERADO

Após completar todos os testes, o sistema deve:
- ✅ Criar rankings com nova estrutura JSONB
- ✅ Salvar e carregar dados corretamente
- ✅ Mostrar cartão de respostas com questões corretas
- ✅ Calcular pontuações corretamente
- ✅ Exibir tabela de classificação com disciplinas
- ✅ Manter compatibilidade com dados existentes
- ✅ Não apresentar erros de JavaScript

## 🔧 DEBUGGING

Se algum teste falhar:
1. Verificar console do navegador para erros
2. Verificar logs de migração
3. Verificar estrutura JSONB no banco
4. Verificar se `questionCount` está sendo salvo corretamente
5. Verificar se `object_scores` está sendo migrado corretamente

