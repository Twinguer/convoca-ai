
import { supabase } from '../client';

// Define constantes e tipos para disciplinas
export const DEFAULT_SUBJECTS = [
  { code: 'PTG', name: 'Língua Portuguesa' },
  { code: 'MAT', name: 'Matemática' },
  { code: 'DIR', name: 'Direito' },
  { code: 'INF', name: 'Informática' },
  { code: 'RLM', name: 'Raciocínio Lógico-Matemático' },
  { code: 'LEG', name: 'Legislação' },
  { code: 'ADM', name: 'Administração' },
  { code: 'CON', name: 'Contabilidade' },
  { code: 'ECO', name: 'Economia' },
  { code: 'EST', name: 'Estatística' },
  { code: 'AFO', name: 'AFO' },
  { code: 'DCO', name: 'Direito Constitucional' },
  { code: 'DAD', name: 'Direito Administrativo' },
  { code: 'DCI', name: 'Direito Civil' },
  { code: 'DPE', name: 'Direito Penal' },
  { code: 'DPR', name: 'Direito Processual' },
  { code: 'DTR', name: 'Direito Tributário' },
  { code: 'AUD', name: 'Auditoria' }
];

// Função para gerar código de disciplina a partir do nome
export const generateSubjectCode = (name: string): string => {
  // Extrair iniciais e limitar a 3 caracteres
  const initials = name
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  return initials || 'SUB'; // Código padrão se não for possível gerar
};

// Esta função pega um concurso e retorna a estrutura de questões por disciplinas
export const getSubjectExamStructure = (concurso: any) => {
  // Inicializar objeto para armazenar intervalos de questões por disciplina
  const subjectRanges: Record<string, { start: number; end: number; count: number }> = {};
  let totalQuestions = 0;
  
  try {
    // Verificar se o concurso tem disciplinas configuradas
    if (!concurso.subjects || !Array.isArray(concurso.subjects) || concurso.subjects.length === 0) {
      console.warn('Concurso não tem disciplinas configuradas');
      return { subjectRanges, totalQuestions };
    }
    
    console.log('Processando estrutura de exame para disciplinas:', concurso.subjects);
    
    // Processar cada disciplina
    let currentQuestionIndex = 1; // Começar da questão 1
    
    concurso.subjects.forEach((subject: any) => {
      const subjectCode = subject.code;
      const questionCount = subject.question_count || 0;
      
      if (!subjectCode || questionCount <= 0) {
        console.warn(`Disciplina inválida: ${JSON.stringify(subject)}`);
        return; // Skip this subject
      }
      
      // Definir intervalo para esta disciplina
      subjectRanges[subjectCode] = {
        start: currentQuestionIndex,
        end: currentQuestionIndex + questionCount - 1,
        count: questionCount
      };
      
      // Atualizar índice para a próxima disciplina
      currentQuestionIndex += questionCount;
      // Incrementar contador total
      totalQuestions += questionCount;
    });
    
    console.log(`[getSubjectExamStructure] Estrutura final: ${totalQuestions} questões, disciplinas:`, subjectRanges);
    
  } catch (error) {
    console.error('Erro ao processar estrutura de exame:', error);
  }
  
  return { subjectRanges, totalQuestions };
};

// Função para obter uma única lista sequencial de todas as questões do concurso
export const getAllQuestionsForConcurso = (concurso: any): number[] => {
  const allQuestions: number[] = [];
  
  if (concurso.minimum_score_type === 'subject') {
    // Para concursos baseados em disciplinas
    const { subjectRanges, totalQuestions } = getSubjectExamStructure(concurso);
    
    // Criar uma sequência contínua de 1 até totalQuestions
    for (let i = 1; i <= totalQuestions; i++) {
      allQuestions.push(i);
    }
  } else {
    // Para concursos baseados em conhecimentos
    let currentQuestionNumber = 1;
    
    // Básico
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 1
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 2
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 3
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
  }
  
  return allQuestions;
};

// Função para obter a estrutura de exame por tipos de conhecimento
export const getExamStructure = (concurso: any) => {
  const basicQuestions = concurso.basic_knowledge_questions || 0;
  const specific1Questions = concurso.specific_knowledge_1_questions || 0;
  const specific2Questions = concurso.specific_knowledge_2_questions || 0;
  const specific3Questions = concurso.specific_knowledge_3_questions || 0;

  const basicEnd = basicQuestions;
  const specific1End = basicEnd + specific1Questions;
  const specific2End = specific1End + specific2Questions;
  const specific3End = specific2End + specific3Questions;

  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions: specific3End
  };
};
