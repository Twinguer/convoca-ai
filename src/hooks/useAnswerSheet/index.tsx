
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';

// Define o tipo para questionType que inclui conhecimentos, disciplinas e avaliaçôes discursivas
type QuestionSectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive'
  | 'case_study1' 
  | 'case_study2'
  | 'case_study3'
  // Disciplinas comuns
  | 'LPT' | 'ING' | 'MAT' | 'RLM' | 'EST' | 'COS' | 'ADM' | 'ADO' 
  | 'COT' | 'COC' | 'ECO' | 'TRI' | 'AFO' | 'LTC' | 'TIC' | 'ETT' 
  | 'AUD' | 'CIV' | 'PEN' | 'INF' | 'EMP' | 'MTF' | 'OUT'
  // Permite qualquer string para disciplinas customizadas
  | string;

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: QuestionSectionType }>({});
  const [selectedSection, setSelectedSection] = useState<QuestionSectionType>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [disciplines, setDisciplines] = useState<Array<{name: string, sigla: string, questions: number}>>([]);
  
  const { 
    discursiveScore, setDiscursiveScore,
    caseStudy1Score, setCaseStudy1Score,
    caseStudy2Score, setCaseStudy2Score,
    caseStudy3Score, setCaseStudy3Score
  } = useScoreManagement();
  
  const {
    handleAnswerChange,
    handleClearAnswer
  } = useAnswerManagement(answers, setAnswers);

  // Inicializa com a primeira seção disponível, seja conhecimento ou disciplina
  useEffect(() => {
    if (concurso) {
      // Primeiro, armazena as disciplinas se existirem
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        setDisciplines(concurso.disciplines);
      }
      
      // Chama a função auxiliar que trata conhecimentos e disciplinas como seções iguais
      handleQuestionSectionSelection(concurso, setSelectedSection);
    }
  }, [concurso]);

  useEffect(() => {
    const fetchData = async () => {
      await fetchExistingAnswers(
        rankingId, 
        setAnswers, 
        setQuestionType, 
        setDiscursiveScore, 
        setCaseStudy1Score, 
        setCaseStudy2Score, 
        setCaseStudy3Score
      );
    };
    
    fetchData();
  }, [rankingId]);

  useEffect(() => {
    if (concurso) {
      initializeQuestionTypes(concurso, questionType, setQuestionType);
    }
  }, [concurso]);

  const isDiscursiveSection = () => {
    return selectedSection === 'discursive' || 
           selectedSection === 'case_study1' || 
           selectedSection === 'case_study2' || 
           selectedSection === 'case_study3';
  };

  const getSectionQuestions = () => {
    if (!concurso) return [];
    
    console.log('Getting questions for section:', selectedSection);
    
    const questions: number[] = [];
    
    // Lógica unificada para conhecimentos e disciplinas
    if (selectedSection === 'basic' && concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      for (let i = 1; i <= concurso.basic_knowledge_questions; i++) {
        questions.push(i);
      }
    } else if (selectedSection === 'specific1' && concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      const startIndex = (concurso.basic_knowledge_questions || 0) + 1;
      for (let i = startIndex; i < startIndex + concurso.specific_knowledge_1_questions; i++) {
        questions.push(i);
      }
    } else if (selectedSection === 'specific2' && concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      const startIndex = (concurso.basic_knowledge_questions || 0) + (concurso.specific_knowledge_1_questions || 0) + 1;
      for (let i = startIndex; i < startIndex + concurso.specific_knowledge_2_questions; i++) {
        questions.push(i);
      }
    } else if (selectedSection === 'specific3' && concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      const startIndex = (concurso.basic_knowledge_questions || 0) + (concurso.specific_knowledge_1_questions || 0) + (concurso.specific_knowledge_2_questions || 0) + 1;
      for (let i = startIndex; i < startIndex + concurso.specific_knowledge_3_questions; i++) {
        questions.push(i);
      }
    } else {
      // Trata como disciplina (qualquer outro valor de selectedSection)
      const discipline = disciplines.find(d => d.sigla === selectedSection);
      
      if (discipline) {
        // Calcula o índice inicial para esta disciplina
        let startIndex = 1;
        
        // Adiciona todas as questões de conhecimentos
        if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
          startIndex += concurso.basic_knowledge_questions;
        }
        if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
          startIndex += concurso.specific_knowledge_1_questions;
        }
        if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
          startIndex += concurso.specific_knowledge_2_questions;
        }
        if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
          startIndex += concurso.specific_knowledge_3_questions;
        }
        
        // Adiciona questões das disciplinas anteriores
        for (const prevDiscipline of disciplines) {
          if (prevDiscipline.sigla === discipline.sigla) {
            break;
          }
          startIndex += prevDiscipline.questions;
        }
        
        // Adiciona as questões para esta disciplina
        for (let i = 0; i < discipline.questions; i++) {
          questions.push(startIndex + i);
        }
      }
    }
    
    console.log('Questions for section', selectedSection, ':', questions);
    return questions.sort((a, b) => a - b);
  };

  const getOptionsForQuestion = (questionNumber: number) => {
    if (!concurso?.exam_type) return ['A', 'B', 'C', 'D', 'E'];
    
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  return {
    answers,
    selectedSection,
    setSelectedSection,
    isSaving,
    setIsSaving,
    error,
    setError,
    savedSuccess,
    setSavedSuccess,
    handleAnswerChange,
    handleClearAnswer,
    getTotalQuestions: () => getTotalQuestions(concurso),
    getAnsweredQuestionsCount: () => getAnsweredQuestionsCount(answers),
    getOptionsForQuestion,
    createAnswerMatrix: () => createAnswerMatrix(getSectionQuestions()),
    questionType,
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score, 
    setCaseStudy3Score,
    isDiscursiveSection,
    disciplines
  };
};
