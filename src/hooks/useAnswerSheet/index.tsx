
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso, SectionType } from '@/types/concursos';
import { useQuery } from '@tanstack/react-query';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { getSectionQuestionsDict, getQuestionMatrixForSection, SectionQuestions } from './matrixUtils';
import { createQuestionOptions } from './initializeQuestionTypes';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { getSectionDisplayName, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [selectedSection, setSelectedSection] = useState<SectionType>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [questionOptions, setQuestionOptions] = useState<Record<number, string[]>>({});
  const [sectionQuestions, setSectionQuestions] = useState<SectionQuestions>({});
  const [isHierarchical, setIsHierarchical] = useState<boolean>(false);

  // Get discursive scores from the useScoreManagement hook
  const {
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score
  } = useScoreManagement();

  // Get answer management functions and state from useAnswerManagement hook
  const {
    answers,
    handleAnswerChange,
    handleClearAnswer,
    setAnswers
  } = useAnswerManagement();

  // Detect if we're using hierarchical structure
  useEffect(() => {
    if (concurso) {
      const hierarchical = isHierarchicalStructure(concurso);
      setIsHierarchical(hierarchical);
      console.log(`[useAnswerSheet] Concurso ${concurso.id} uses hierarchical structure: ${hierarchical}`);
    }
  }, [concurso]);

  // Create question options based on exam type
  useEffect(() => {
    if (concurso) {
      setQuestionOptions(createQuestionOptions(concurso));
    }
  }, [concurso]);

  // Get section questions mapping
  useEffect(() => {
    if (concurso) {
      const questions = getSectionQuestionsDict(concurso);
      setSectionQuestions(questions);
    }
  }, [concurso]);

  // Fetch existing answers when rankingId changes
  const { isLoading, refetch } = useQuery({
    queryKey: ['user-answers', rankingId],
    queryFn: () => fetchExistingAnswers(rankingId),
    enabled: !!rankingId,
    onSuccess: (data) => {
      if (data && data.answers) {
        setAnswers(data.answers);
      }
    }
  });

  // Function to create the answer matrix for rendering
  const createAnswerMatrix = useCallback(() => {
    if (!concurso || !selectedSection) return [[]];

    return getQuestionMatrixForSection(concurso, selectedSection, sectionQuestions);
  }, [concurso, selectedSection, sectionQuestions]);

  // Returns the list of answers options for a specific question
  const getOptionsForQuestion = useCallback((questionNumber: number): string[] => {
    return questionOptions[questionNumber] || ['A', 'B', 'C', 'D', 'E'];
  }, [questionOptions]);

  // Get question type based on the exam type
  const questionType = concurso?.exam_type === 'Certo ou Errado' ? 'trueOrFalse' : 'multipleChoice';

  // Function to get the total number of questions
  const getTotalQuestions = useCallback(() => {
    if (!concurso) return 0;
    
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      // For custom disciplines, sum up all question counts from enabled disciplines
      let totalQuestions = 0;
      
      // Check if hierarchical structure
      if (isHierarchical) {
        for (const block of concurso.disciplines) {
          if ('disciplines' in block) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                totalQuestions += parseInt(String(discipline.questionCount), 10) || 0;
              }
            }
          }
        }
      } else {
        // Flat structure
        for (const discipline of concurso.disciplines) {
          if ('isEnabled' in discipline && discipline.isEnabled) {
            totalQuestions += parseInt(String(discipline.questionCount), 10) || 0;
          }
        }
      }
      
      return totalQuestions;
    } else {
      // Traditional structure
      return (
        (concurso.has_basic_knowledge ? parseInt(String(concurso.basic_knowledge_questions), 10) || 0 : 0) +
        (concurso.has_specific_knowledge_1 ? parseInt(String(concurso.specific_knowledge_1_questions), 10) || 0 : 0) +
        (concurso.has_specific_knowledge_2 ? parseInt(String(concurso.specific_knowledge_2_questions), 10) || 0 : 0) +
        (concurso.has_specific_knowledge_3 ? parseInt(String(concurso.specific_knowledge_3_questions), 10) || 0 : 0)
      );
    }
  }, [concurso, isHierarchical]);

  // Function to get the number of answered questions
  const getAnsweredQuestionsCount = useCallback(() => {
    return Object.keys(answers).length;
  }, [answers]);
  
  // Check if the selected section is a discursive-type section
  const isDiscursiveSection = selectedSection === 'discursive' || 
                             selectedSection === 'case_study1' ||
                             selectedSection === 'case_study2' ||
                             selectedSection === 'case_study3';
  
  // Get questions for a specific section
  const getSectionQuestions = useCallback((section: string): number[] => {
    if (!sectionQuestions || !sectionQuestions[section]) return [];
    return sectionQuestions[section];
  }, [sectionQuestions]);

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
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType,
    getAnsweredQuestionsCount,
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score,
    isDiscursiveSection,
    getSectionQuestions,
    isHierarchical, // Export the hierarchical flag
    isLoading,
    refetchAnswers: refetch
  };
};

export * from './useScoreManagement';
export * from './fetchExistingAnswers';
export * from './matrixUtils';
export * from './initializeQuestionTypes';
export * from './questionCountUtils';
export * from './useAnswerManagement';
export * from './sectionUtils';
