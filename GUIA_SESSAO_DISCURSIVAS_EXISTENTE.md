# Guia: Utilizando a Sessão "Discursivas/Estt. Caso" Existente

## 📋 Visão Geral

O sistema já possui uma sessão "Discursivas/Estt. Caso" completamente implementada e integrada. Este guia mostra como utilizar essa funcionalidade existente ao invés de criar uma nova sessão.

## 🎯 Estrutura Atual

### 1. **Sistema de Cronograma**
- **Localização**: `src/pages/Estudos/Cronograma.tsx`
- **Funcionalidade**: Permite criar sessões de estudo para disciplinas discursivas
- **Integração**: Conectado com `useStudyCyclesV2` hook

### 2. **Sistema de Rankings**
- **Localização**: `src/components/Admin/CreateRanking/ExamStructureSection.tsx`
- **Funcionalidade**: Configuração de provas discursivas e estudos de caso
- **Campos disponíveis**:
  - `has_discursive` - Prova Discursiva
  - `has_case_study_1` - Estudo de Caso 1
  - `has_case_study_2` - Estudo de Caso 2
  - `has_case_study_3` - Estudo de Caso 3

### 3. **Estrutura de Dados**
- **Tabela**: `study_cycles_v2`
- **Campo JSONB**: `schedule_data.available_blocks`
- **Blocos**: "Provas Subjetivas" ou "Discursivas"
- **Disciplinas**: "Prova Discursiva", "Estudo de Caso 1", etc.

## 🚀 Como Utilizar

### **Passo 1: Acessar o Cronograma**
1. Navegue para `/estudos/cronograma`
2. Selecione um ciclo de estudos ativo
3. Clique em "Adicionar Sessão"

### **Passo 2: Configurar Sessão Discursiva**
1. **Selecionar Bloco**: Escolha "Discursivas" ou "Provas Subjetivas"
2. **Selecionar Disciplina**: 
   - "Prova Discursiva" (para questões dissertativas)
   - "Estudo de Caso 1/2/3" (para estudos de caso)
3. **Definir Horário**: Configure início e fim da sessão
4. **Adicionar Link**: Opcionalmente, adicione link para material de estudo

### **Passo 3: Registrar Progresso**
1. Durante a sessão, use o timer integrado
2. Após completar, registre:
   - Duração da sessão
   - Número de questões respondidas
   - Questões corretas
   - Notas sobre o estudo

## 🔧 Configuração no Sistema de Rankings

### **Para Administradores**
1. Acesse a criação de ranking
2. Na seção "Discursivas/Est. Caso":
3. Ative as opções necessárias:
   - ✅ Dissertativa
   - ✅ Estudo de Caso
   - ✅ Estudo de Caso 2
   - ✅ Estudo de Caso 3

### **Estrutura JSONB Resultante**
```json
{
  "available_blocks": [
    {
      "id": "subjective-block",
      "name": "Provas Subjetivas",
      "disciplines": [
        {
          "id": "discursive-1",
          "name": "Prova Discursiva",
          "type": "discursive",
          "isEnabled": true,
          "questionCount": 1,
          "weight": 1
        },
        {
          "id": "case-study-1",
          "name": "Estudo de Caso 1",
          "type": "case_study_1",
          "isEnabled": true,
          "questionCount": 1,
          "weight": 1
        }
      ]
    }
  ]
}
```

## 📊 Vantagens da Sessão Existente

### ✅ **Já Implementada**
- Interface completa de cronograma
- Sistema de timer integrado
- Registro de progresso
- Estatísticas de estudo

### ✅ **Integração Completa**
- Conectada com sistema de rankings
- Sincronizada com banco de dados
- Suporte a múltiplos tipos de prova

### ✅ **Flexibilidade**
- Suporte a até 3 estudos de caso
- Configuração de pesos
- Links para materiais de estudo

## 🎯 Casos de Uso

### **1. Estudo para Prova Discursiva**
- Criar sessão com disciplina "Prova Discursiva"
- Usar timer para controlar tempo de estudo
- Registrar questões praticadas

### **2. Preparação para Estudos de Caso**
- Criar sessões específicas para cada tipo
- Organizar por bloco "Discursivas"
- Acompanhar progresso individual

### **3. Simulados Discursivos**
- Usar links para acessar simulados
- Registrar performance em tempo real
- Acompanhar evolução ao longo do tempo

## 🔄 Fluxo de Trabalho Recomendado

1. **Configuração Inicial**
   - Ativar disciplinas discursivas no ranking
   - Criar ciclo de estudos

2. **Planejamento Semanal**
   - Adicionar sessões no cronograma
   - Distribuir disciplinas pelos dias

3. **Execução**
   - Seguir cronograma criado
   - Usar timer para controle de tempo
   - Registrar progresso

4. **Acompanhamento**
   - Visualizar estatísticas
   - Ajustar cronograma conforme necessário
   - Preparar para simulados

## 📝 Notas Importantes

- **Não é necessário criar nova sessão** - use a existente
- **A sessão está totalmente funcional** e integrada
- **Suporte completo** para todos os tipos de prova discursiva
- **Sistema otimizado** com performance melhorada

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se o ciclo está ativo
2. Confirme se as disciplinas estão habilitadas
3. Verifique a estrutura JSONB no banco de dados
4. Consulte os logs do sistema para erros específicos

---

**Conclusão**: A sessão "Discursivas/Estt. Caso" já está completamente implementada e pronta para uso. Não há necessidade de criar uma nova sessão - basta utilizar a funcionalidade existente seguindo este guia.

