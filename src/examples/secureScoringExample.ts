/**
 * Exemplo de Uso do Sistema de Pontuação Seguro
 * Demonstra como migrar do sistema antigo para o novo
 */

import { calculateSecureScore, validateScoring, type SecureScoringInput } from '@/services/secureScoring';
import { updateFeatureFlags } from '@/config/featureFlags';

// Exemplo 1: Uso básico com feature flags
export const exemploUsoBasico = async () => {
  console.log('=== Exemplo 1: Uso Básico ===');
  
  const input: SecureScoringInput = {
    questionWeight: 1,
    disciplineWeight: 2,
    isCorrect: true,
    isNullified: false,
    isBlank: false,
    examType: 'Múltipla Escolha',
    wrongAnswerPenalty: 0,
    context: 'exemplo-basico',
  };

  // Com backend desabilitado (padrão em desenvolvimento)
  const resultadoFrontend = await calculateSecureScore(input);
  console.log('Resultado Frontend:', resultadoFrontend);

  // Habilitar backend para produção
  updateFeatureFlags({ useBackendScoring: true });
  const resultadoBackend = await calculateSecureScore(input);
  console.log('Resultado Backend:', resultadoBackend);
};

// Exemplo 2: Validação de consistência
export const exemploValidacao = async () => {
  console.log('=== Exemplo 2: Validação de Consistência ===');
  
  const input: SecureScoringInput = {
    questionWeight: 1.5,
    disciplineWeight: 3,
    isCorrect: false,
    isNullified: true,
    isBlank: false,
    examType: 'Múltipla Escolha',
    wrongAnswerPenalty: 0,
    context: 'exemplo-validacao',
  };

  const validacao = await validateScoring(input);
  console.log('Validação:', {
    valido: validacao.valid,
    frontend: validacao.frontend,
    backend: validacao.backend,
    diferencas: validacao.comparison.differences,
  });
};

// Exemplo 3: Migração gradual por usuário
export const exemploMigracaoGradual = async () => {
  console.log('=== Exemplo 3: Migração Gradual ===');
  
  // Usuário beta tester
  const usuarioBeta = '34d22725-d158-4d75-9089-efd049a1fb98';
  
  const input: SecureScoringInput = {
    questionWeight: 1,
    disciplineWeight: 1,
    isCorrect: false,
    isNullified: false,
    isBlank: false,
    examType: 'Certo ou Errado',
    wrongAnswerPenalty: 0.5,
    context: 'exemplo-migracao',
    userId: usuarioBeta, // Usuário beta terá backend habilitado
  };

  const resultado = await calculateSecureScore(input);
  console.log('Resultado para usuário beta:', resultado);
  
  // Usuário normal
  const inputNormal = { ...input, userId: 'usuario-normal' };
  const resultadoNormal = await calculateSecureScore(inputNormal);
  console.log('Resultado para usuário normal:', resultadoNormal);
};

// Exemplo 4: Diferentes tipos de exame
export const exemploTiposExame = async () => {
  console.log('=== Exemplo 4: Diferentes Tipos de Exame ===');
  
  const cenarios = [
    {
      nome: 'Múltipla Escolha - Resposta Correta',
      input: {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: true,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha' as const,
        wrongAnswerPenalty: 0,
        context: 'multipla-correta',
      },
    },
    {
      nome: 'Múltipla Escolha - Resposta Errada',
      input: {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Múltipla Escolha' as const,
        wrongAnswerPenalty: 0.5,
        context: 'multipla-errada',
      },
    },
    {
      nome: 'Certo ou Errado - Com Penalidade',
      input: {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Certo ou Errado' as const,
        wrongAnswerPenalty: 0.5,
        context: 'certo-errado-penalidade',
      },
    },
    {
      nome: 'Certo ou Errado - Sem Penalidade',
      input: {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: false,
        examType: 'Certo ou Errado' as const,
        wrongAnswerPenalty: 0,
        context: 'certo-errado-sem-penalidade',
      },
    },
    {
      nome: 'Questão Anulada',
      input: {
        questionWeight: 1.5,
        disciplineWeight: 3,
        isCorrect: false,
        isNullified: true,
        isBlank: false,
        examType: 'Múltipla Escolha' as const,
        wrongAnswerPenalty: 0,
        context: 'anulada',
      },
    },
    {
      nome: 'Resposta em Branco',
      input: {
        questionWeight: 1,
        disciplineWeight: 2,
        isCorrect: false,
        isNullified: false,
        isBlank: true,
        examType: 'Múltipla Escolha' as const,
        wrongAnswerPenalty: 0,
        context: 'branco',
      },
    },
  ];

  for (const cenario of cenarios) {
    console.log(`\n--- ${cenario.nome} ---`);
    const resultado = await calculateSecureScore(cenario.input);
    console.log('Resultado:', {
      totalDelta: resultado.totalDelta,
      disciplineDelta: resultado.disciplineDelta,
      weightedDisciplineDelta: resultado.weightedDisciplineDelta,
      source: resultado.source,
    });
  }
};

// Exemplo 5: Monitoramento de discrepâncias
export const exemploMonitoramento = async () => {
  console.log('=== Exemplo 5: Monitoramento de Discrepâncias ===');
  
  // Simular cenário onde frontend e backend podem divergir
  const input: SecureScoringInput = {
    questionWeight: 1,
    disciplineWeight: 2,
    isCorrect: true,
    isNullified: false,
    isBlank: false,
    examType: 'Múltipla Escolha',
    wrongAnswerPenalty: 0,
    context: 'monitoramento',
  };

  // Forçar validação em ambos
  const validacao = await validateScoring(input);
  
  if (!validacao.valid) {
    console.warn('⚠️ DISCREPÂNCIA DETECTADA!');
    console.warn('Frontend:', validacao.frontend);
    console.warn('Backend:', validacao.backend);
    console.warn('Diferenças:', validacao.comparison.differences);
  } else {
    console.log('✅ Resultados consistentes entre frontend e backend');
  }
};

// Função para executar todos os exemplos
export const executarTodosExemplos = async () => {
  console.log('🚀 Executando Exemplos do Sistema de Pontuação Seguro\n');
  
  try {
    await exemploUsoBasico();
    await exemploValidacao();
    await exemploMigracaoGradual();
    await exemploTiposExame();
    await exemploMonitoramento();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
};

// Executar se chamado diretamente
if (import.meta.hot) {
  // Executar em modo de desenvolvimento
  executarTodosExemplos();
}
