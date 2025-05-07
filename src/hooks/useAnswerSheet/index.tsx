
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
import { getAllQuestionsForConcurso } from '@/integrations/supabase/rankings/examStructure';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  
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

  // Initialize with the first available section
  useEffect(() => {
    if (concurso) {
      handleQuestionSectionSelection(concurso, setSelectedSection);
    }
  }, [concurso]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchExistingAnswers(
          rankingId, 
          setAnswers, 
          setQuestionType, 
          setDiscursiveScore, 
          setCaseStudy1Score, 
          setCaseStudy2Score, 
          setCaseStudy3Score
        );
      } catch (error) {
        console.error("Erro ao buscar respostas existentes:", error);
      }
    };
    
    if (rankingId) {
      fetchData();
    }
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
    
    // Obtém todas as questões disponíveis para o concurso
    const allQuestions = getAllQuestionsForConcurso(concurso);
    
    // Para concursos baseados em disciplinas, quando estiver na seção "basic",
    // simplesmente retorna todas as questões
    if (concurso.minimum_score_type === 'subject' && selectedSection === 'basic') {
      console.log('Concurso baseado em disciplinas, retornando todas as questões:', allQuestions);
      return allQuestions;
    }
    
    // Para concursos baseados em conhecimentos, filtramos pelas questões da seção selecionada
    if (Object.keys(questionType).length > 0) {
      // Se já temos o mapeamento de tipos de questão, usamos isso para filtrar
      const filteredQuestions = Object.entries(questionType)
        .filter(([_, type]) => {
          return (selectedSection === 'basic' && type === 'basic') ||
                 (selectedSection === 'specific1' && type === 'specific1') ||
                 (selectedSection === 'specific2' && type === 'specific2') ||
                 (selectedSection === 'specific3' && type === 'specific3');
        })
        .map(([num]) => parseInt(num));
      
      console.log('Filtered questions for section', selectedSection, ':', filteredQuestions);
      return filteredQuestions.sort((a, b) => a - b);
    } else {
      // Caso ainda não tenha o mapeamento, construímos a sequência de questões baseada na configuração
      const questions: number[] = [];
      
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
      }
      
      console.log('Generated questions for section', selectedSection, ':', questions);
      return questions;
    }
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
    getSectionQuestions
  };
};
