
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso, SectionType } from '@/types/concursos';
import { useQuery } from '@tanstack/react-query';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { getSectionQuestionsDict, getQuestionMatrixForSection, SectionQuestions } from './matrixUtils';
import { createQuestionOptions, getTotalQuestions } from './initializeQuestionTypes';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { getSectionDisplayName, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';
import { handleQuestionSectionSelection } from './sectionUtils';

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

  // Initialize with the first available section
  useEffect(() => {
    if (concurso) {
      handleQuestionSectionSelection(concurso, setSelectedSection);
    }
  }, [concurso]);

  // Fetch existing answers when rankingId changes
  const { 
    data: existingAnswersData, 
    isLoading, 
    refetch: refetchAnswers,
    error: fetchError 
  } = useQuery({
    queryKey: ['user-answers', rankingId],
    queryFn: async () => {
      if (!rankingId) {
        console.warn('[useAnswerSheet] No ranking ID provided');
        return {};
      }
      
      console.log('[useAnswerSheet] Fetching answers for ranking:', rankingId);
      return fetchExistingAnswers(rankingId);
    },
    enabled: !!rankingId && !!concurso,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  // Handle data loading with useEffect instead of onSuccess
  useEffect(() => {
    if (existingAnswersData) {
      console.log('[useAnswerSheet] Dados carregados:', existingAnswersData);
      
      if (existingAnswersData.answers) {
        setAnswers(existingAnswersData.answers);
        
        // Também definir as pontuações subjetivas
        if (existingAnswersData.discursiveScore !== undefined) {
          setDiscursiveScore(existingAnswersData.discursiveScore);
        }
        if (existingAnswersData.caseStudy1Score !== undefined) {
          setCaseStudy1Score(existingAnswersData.caseStudy1Score);
        }
        if (existingAnswersData.caseStudy2Score !== undefined) {
          setCaseStudy2Score(existingAnswersData.caseStudy2Score);
        }
        if (existingAnswersData.caseStudy3Score !== undefined) {
          setCaseStudy3Score(existingAnswersData.caseStudy3Score);
        }
      }
    }
  }, [existingAnswersData, setAnswers, setDiscursiveScore, setCaseStudy1Score, setCaseStudy2Score, setCaseStudy3Score]);

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      console.error('[useAnswerSheet] Erro ao carregar dados:', fetchError);
      setError('Erro ao carregar respostas do usuário: ' + fetchError.message);
    }
  }, [fetchError]);

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
  const getTotalQuestionsFunc = useCallback(() => {
    if (!concurso) return 0;
    return getTotalQuestions(concurso);
  }, [concurso]);

  // Function to get the number of answered questions
  const getAnsweredQuestionsCount = useCallback(() => {
    return Object.keys(answers).length;
  }, [answers]);
  
  // Check if the selected section is a discursive-type section
  const isDiscursiveSection = useCallback(() => {
    return selectedSection === 'discursive' || 
           selectedSection === 'case_study1' ||
           selectedSection === 'case_study2' ||
           selectedSection === 'case_study3';
  }, [selectedSection]);
  
  // Get questions for a specific section
  const getSectionQuestions = useCallback((section?: string): number[] => {
    const sectionToUse = section || selectedSection;
    if (!sectionQuestions || !sectionQuestions[sectionToUse]) return [];
    return sectionQuestions[sectionToUse];
  }, [sectionQuestions, selectedSection]);

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
    getTotalQuestions: getTotalQuestionsFunc,
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
    isDiscursiveSection: isDiscursiveSection(),
    getSectionQuestions,
    isHierarchical,
    isLoading,
    refetchAnswers
  };
};

export * from './useScoreManagement';
export * from './matrixUtils';
export * from './useAnswerManagement';
export * from './sectionUtils';
