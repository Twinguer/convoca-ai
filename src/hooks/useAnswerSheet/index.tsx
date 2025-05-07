
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from '../useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';

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

  // Função aprimorada para obter as questões da seção selecionada
  const getSectionQuestions = () => {
    if (!concurso) return [];
    
    console.log('Getting questions for section:', selectedSection);
    
    const questions: number[] = [];
    
    // Verifica se o concurso utiliza o modelo de disciplinas
    if (concurso.minimum_score_type === 'subject' && concurso.subjects) {
      // Parse subjects se for uma string JSON
      let subjects = [];
      try {
        subjects = typeof concurso.subjects === 'string' 
          ? JSON.parse(concurso.subjects) 
          : concurso.subjects;
      } catch (e) {
        console.error('Erro ao fazer parse das disciplinas:', e);
        return [];
      }
      
      // Se a seção selecionada corresponder ao código de uma disciplina
      if (subjects && Array.isArray(subjects)) {
        // Encontrar o índice da disciplina que corresponde à seção selecionada
        const subjectIndex = subjects.findIndex(s => s.code === selectedSection);
        
        if (subjectIndex !== -1) {
          // Calcular o intervalo de números de questão para esta disciplina
          let startQuestionNumber = 1;
          for (let i = 0; i < subjectIndex; i++) {
            startQuestionNumber += (subjects[i].questions || 0);
          }
          
          // Adicionar números de questão para esta disciplina
          const questionCount = subjects[subjectIndex].questions || 0;
          for (let i = 0; i < questionCount; i++) {
            questions.push(startQuestionNumber + i);
          }
        }
      }
    } else {
      // Se não estiver usando o modelo de disciplinas, use o modelo antigo baseado em conhecimentos
      if (Object.keys(questionType).length === 0) {
        // Se o mapa de tipos de questão estiver vazio, inicialize com base na configuração do concurso
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
      } else {
        // Use o mapeamento existente de tipos de questão
        Object.entries(questionType).forEach(([num, type]) => {
          if (
            (selectedSection === 'basic' && type === 'basic') ||
            (selectedSection === 'specific1' && type === 'specific1') ||
            (selectedSection === 'specific2' && type === 'specific2') ||
            (selectedSection === 'specific3' && type === 'specific3')
          ) {
            questions.push(parseInt(num));
          }
        });
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
    getSectionQuestions
  };
};
