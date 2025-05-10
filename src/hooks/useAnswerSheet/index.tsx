
import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { sectionDisplayNames, getExamStructure } from '@/integrations/supabase/rankings/examStructure';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: SectionType }>({});
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
      handleQuestionSectionSelection(
        concurso,
        (section: SectionType) => setSelectedSection(section)
      );
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
    console.log('Question type mapping:', questionType);
    
    const questions: number[] = [];

    // Verificar primeiro se estamos usando conhecimento customizável
    if (concurso.has_custom_knowledge) {
      if (Object.keys(questionType).length === 0) {
        // Se ainda não temos mapeamento, inicializar baseado no modelo customizável
        if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
          let currentQuestion = 1;
          
          for (const discipline of concurso.disciplines) {
            if (discipline.isEnabled && discipline.type === selectedSection && discipline.questionCount) {
              for (let i = 0; i < discipline.questionCount; i++) {
                questions.push(currentQuestion++);
              }
            } else if (discipline.isEnabled) {
              // Pular questões de outras disciplinas
              currentQuestion += (discipline.questionCount || 0);
            }
          }
        }
      } else {
        // Usar o mapeamento existente para encontrar questões do tipo selecionado
        Object.entries(questionType).forEach(([num, type]) => {
          if (type === selectedSection) {
            questions.push(parseInt(num));
          }
        });
      }
      
      return questions.sort((a, b) => a - b);
    }
    
    // Estrutura tradicional - verifique primeiro se temos mapeamento
    if (Object.keys(questionType).length === 0) {
      // Se não tiver, inicializamos com as questões que DEVERIAM existir com base no concurso
      const structure = getExamStructure(concurso);
      
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
      // Se tiver, usamos o mapeamento existente
      Object.entries(questionType).forEach(([num, type]) => {
        if (type === selectedSection) {
          questions.push(parseInt(num));
        }
      });
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
