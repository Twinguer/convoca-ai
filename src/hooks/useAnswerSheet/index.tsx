
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection, SectionType } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { getAllQuestionsForConcurso } from '@/integrations/supabase/rankings/examStructure';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }>({});
  const [selectedSection, setSelectedSection] = useState<SectionType>('basic');
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

  // Função unificada para obter questões da seção selecionada
  const getSectionQuestions = () => {
    if (!concurso) return [];

    // Para ambos os tipos de concurso (conhecimentos e disciplinas), usamos a mesma lógica
    if (selectedSection === 'basic') {
      // Para a seção 'basic', retornamos todas as questões apropriadas
      if (concurso.minimum_score_type === 'subject') {
        // Para concursos baseados em disciplinas, retornamos todas as questões em uma única seção
        return getAllQuestionsForConcurso(concurso);
      } else if (Object.keys(questionType).length > 0) {
        // Para concursos baseados em conhecimentos, filtramos pelas questões básicas
        return Object.entries(questionType)
          .filter(([_, type]) => type === 'basic')
          .map(([num]) => parseInt(num))
          .sort((a, b) => a - b);
      }
    } else if (selectedSection === 'specific1') {
      // Para specific1, filtramos as questões de conhecimento específico 1
      return Object.entries(questionType)
        .filter(([_, type]) => type === 'specific1')
        .map(([num]) => parseInt(num))
        .sort((a, b) => a - b);
    } else if (selectedSection === 'specific2') {
      // Para specific2, filtramos as questões de conhecimento específico 2
      return Object.entries(questionType)
        .filter(([_, type]) => type === 'specific2')
        .map(([num]) => parseInt(num))
        .sort((a, b) => a - b);
    } else if (selectedSection === 'specific3') {
      // Para specific3, filtramos as questões de conhecimento específico 3
      return Object.entries(questionType)
        .filter(([_, type]) => type === 'specific3')
        .map(([num]) => parseInt(num))
        .sort((a, b) => a - b);
    }
    
    // Lógica de fallback comum para ambos os tipos de concurso
    const questions: number[] = [];
    const totalQuestions = getTotalQuestions(concurso);
    
    if (totalQuestions > 0 && selectedSection === 'basic') {
      // Se estamos na seção básica, retornamos todas as questões
      for (let i = 1; i <= totalQuestions; i++) {
        questions.push(i);
      }
    }
    
    return questions;
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
