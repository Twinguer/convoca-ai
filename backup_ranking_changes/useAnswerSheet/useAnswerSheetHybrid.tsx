import { useState, useEffect, useCallback } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { fetchExistingAnswersLegacy } from './fetchExistingAnswersLegacy';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { fetchOfficialAnswersLegacy } from './fetchOfficialAnswersLegacy';
import { useSaveAnswersLegacy } from '../useSaveAnswers/useSaveAnswersLegacy';
import { useSaveAnswers } from '../useSaveAnswers';
import { getDisciplines, isHierarchicalStructure, sectionDisplayNames, updateSectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';

// Hook híbrido que alterna entre estruturas antigas e novas
export const useAnswerSheetHybrid = (concurso: Concurso, rankingId: string, useLegacyStructure: boolean = true) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedSection, setSelectedSection] = useState<SectionType>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks para cada estrutura - só criar o necessário
  const saveAnswersLegacy = useLegacyStructure ? useSaveAnswersLegacy({
    rankingId,
    concurso,
    answers,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    discursiveScore,
    caseStudy1Score,
    caseStudy2Score,
    caseStudy3Score,
    editCount: 0, // Será atualizado quando carregar os dados
    nullifiedQuestions: new Set(),
    selectedBookletId: 'default'
  }) : null;

  const saveAnswersNew = !useLegacyStructure ? useSaveAnswers({
    rankingId,
    concurso,
    answers,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    },
    discursiveScore,
    caseStudy1Score,
    caseStudy2Score,
    caseStudy3Score,
    editCount: 0, // Será atualizado quando carregar os dados
    nullifiedQuestions: new Set(),
    selectedBookletId: 'default'
  }) : null;

  // Carregar dados existentes
  const loadExistingAnswers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = useLegacyStructure 
        ? await fetchExistingAnswersLegacy(rankingId)
        : await fetchExistingAnswers(rankingId);

      if (data.answers) {
        setAnswers(data.answers);
      }
      if (data.discursiveScore !== null) {
        setDiscursiveScore(data.discursiveScore);
      }
      if (data.caseStudy1Score !== null) {
        setCaseStudy1Score(data.caseStudy1Score);
      }
      if (data.caseStudy2Score !== null) {
        setCaseStudy2Score(data.caseStudy2Score);
      }
      if (data.caseStudy3Score !== null) {
        setCaseStudy3Score(data.caseStudy3Score);
      }
    } catch (error) {
      console.error('Erro ao carregar respostas existentes:', error);
      setError('Erro ao carregar respostas existentes');
    } finally {
      setIsLoading(false);
    }
  }, [rankingId, useLegacyStructure]);

  // Carregar dados na inicialização
  useEffect(() => {
    loadExistingAnswers();
  }, [loadExistingAnswers]);

  // Funções de manipulação de respostas
  const handleAnswerChange = useCallback((questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  }, []);

  const handleClearAnswer = useCallback((questionNumber: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
  }, []);

  const clearAllAnswers = useCallback(() => {
    setAnswers({});
  }, []);

  // Função de salvamento que alterna entre estruturas
  const handleSaveAnswers = useCallback(async () => {
    if (useLegacyStructure && saveAnswersLegacy) {
      await saveAnswersLegacy.handleSaveAnswers();
    } else if (!useLegacyStructure && saveAnswersNew) {
      await saveAnswersNew.handleSaveAnswers();
    }
  }, [useLegacyStructure, saveAnswersLegacy, saveAnswersNew]);

  // Funções auxiliares
  const getTotalQuestions = useCallback(() => {
    if (!concurso) return 0;
    
    let total = 0;
    if (concurso.has_basic_knowledge) total += concurso.basic_knowledge_questions || 0;
    if (concurso.has_specific_knowledge_1) total += concurso.specific_knowledge_1_questions || 0;
    if (concurso.has_specific_knowledge_2) total += concurso.specific_knowledge_2_questions || 0;
    if (concurso.has_specific_knowledge_3) total += concurso.specific_knowledge_3_questions || 0;
    
    return total;
  }, [concurso]);

  const getOptionsForQuestion = useCallback((questionNumber: number) => {
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    return ['A', 'B', 'C', 'D', 'E'];
  }, [concurso]);

  const createAnswerMatrix = useCallback(() => {
    const totalQuestions = getTotalQuestions();
    const matrix = [];
    
    for (let i = 1; i <= totalQuestions; i++) {
      matrix.push({
        questionNumber: i,
        answer: answers[i] || '',
        isAnswered: !!answers[i]
      });
    }
    
    return matrix;
  }, [answers, getTotalQuestions]);

  const getAnsweredQuestionsCount = useCallback(() => {
    return Object.values(answers).filter(answer => answer && answer.trim() !== '').length;
  }, [answers]);

  const isDiscursiveSection = useCallback((section: string) => {
    return section === 'discursive' || section === 'case_study_1' || section === 'case_study_2' || section === 'case_study_3';
  }, []);

  const getSectionQuestions = useCallback((section: SectionType) => {
    if (!concurso) return [];
    
    const questions = [];
    let startQuestion = 1;
    
    if (section === 'basic' && concurso.has_basic_knowledge) {
      const count = concurso.basic_knowledge_questions || 0;
      for (let i = startQuestion; i < startQuestion + count; i++) {
        questions.push(i);
      }
      startQuestion += count;
    }
    
    if (section === 'specific1' && concurso.has_specific_knowledge_1) {
      const count = concurso.specific_knowledge_1_questions || 0;
      for (let i = startQuestion; i < startQuestion + count; i++) {
        questions.push(i);
      }
      startQuestion += count;
    }
    
    if (section === 'specific2' && concurso.has_specific_knowledge_2) {
      const count = concurso.specific_knowledge_2_questions || 0;
      for (let i = startQuestion; i < startQuestion + count; i++) {
        questions.push(i);
      }
      startQuestion += count;
    }
    
    if (section === 'specific3' && concurso.has_specific_knowledge_3) {
      const count = concurso.specific_knowledge_3_questions || 0;
      for (let i = startQuestion; i < startQuestion + count; i++) {
        questions.push(i);
      }
    }
    
    return questions;
  }, [concurso]);

  const isHierarchical = isHierarchicalStructure(concurso);
  const questionType = concurso.exam_type as 'Alternativas' | 'Certo ou Errado';

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
    clearAllAnswers,
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
    isHierarchical,
    isLoading,
    handleSaveAnswers,
    refetchAnswers: loadExistingAnswers
  };
};
