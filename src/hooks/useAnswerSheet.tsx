
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';

interface UseAnswerSheetResult {
  answers: { [key: number]: string };
  selectedSection: 'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3';
  setSelectedSection: React.Dispatch<React.SetStateAction<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'>>;
  isSaving: boolean;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  savedSuccess: boolean;
  setSavedSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  handleAnswerChange: (questionNumber: number, answer: string) => void;
  handleClearAnswer: (questionNumber: number) => void;
  getTotalQuestions: () => number;
  getAnsweredQuestionsCount: () => number;
  getOptionsForQuestion: (questionNumber: number) => string[];
  createAnswerMatrix: () => (number | null)[][];
  questionType: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' };
  discursiveScore: number | null;
  setDiscursiveScore: React.Dispatch<React.SetStateAction<number | null>>;
  caseStudy1Score: number | null;
  setCaseStudy1Score: React.Dispatch<React.SetStateAction<number | null>>;
  caseStudy2Score: number | null;
  setCaseStudy2Score: React.Dispatch<React.SetStateAction<number | null>>;
  caseStudy3Score: number | null;
  setCaseStudy3Score: React.Dispatch<React.SetStateAction<number | null>>;
  isDiscursiveSection: () => boolean;
  getSectionQuestions: () => number[];
  initializeAnswers: (initialAnswers: { [key: number]: string }) => void;
  setAnswers: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
}

export const useAnswerSheet = (concurso?: Concurso, rankingId?: string): UseAnswerSheetResult => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' }>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2' | 'specific3' | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);

  // Initialize with the first available section
  useEffect(() => {
    if (concurso) {
      if (concurso.has_basic_knowledge) {
        setSelectedSection('basic');
      } else if (concurso.has_specific_knowledge_1) {
        setSelectedSection('specific1');
      } else if (concurso.has_specific_knowledge_2) {
        setSelectedSection('specific2');
      } else if (concurso.has_specific_knowledge_3) {
        setSelectedSection('specific3');
      }
    }
  }, [concurso]);

  const fetchExistingAnswers = async () => {
    if (!rankingId) return;
    
    try {
      console.log('Fetching existing answers for ranking ID:', rankingId);
      
      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', rankingId);
        
      if (answersError) throw answersError;
      
      console.log('Fetched answers data:', answersData);
      
      if (answersData?.length) {
        const answersMap: { [key: number]: string } = {};
        const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' } = {};
        
        answersData.forEach((item: any) => {
          answersMap[item.question_number] = item.answer;
          
          if (item.is_basic_knowledge) {
            typesMap[item.question_number] = 'basic';
          } else if (item.is_specific_1) {
            typesMap[item.question_number] = 'specific1';
          } else if (item.is_specific_2) {
            typesMap[item.question_number] = 'specific2';
          } else if (item.is_specific_3) {
            typesMap[item.question_number] = 'specific3';
          }
        });
        
        console.log('Parsed answers map:', answersMap);
        console.log('Parsed question types map:', typesMap);
        
        setAnswers(answersMap);
        setQuestionType(typesMap);
      }
      
      // Fetch user ranking for scores
      if (rankingId) {
        const { data: rankingData, error: rankingError } = await supabase
          .from('user_rankings')
          .select('*')
          .eq('id', rankingId)
          .single();
          
        if (rankingError) throw rankingError;
        
        console.log('Fetched ranking data:', rankingData);
        
        if (rankingData) {
          setDiscursiveScore(
            rankingData.discursive_score !== null && rankingData.discursive_score !== undefined
              ? rankingData.discursive_score
              : null
          );
          setCaseStudy1Score(
            rankingData.case_study_1_score !== null && rankingData.case_study_1_score !== undefined
              ? rankingData.case_study_1_score
              : null
          );
          setCaseStudy2Score(
            rankingData.case_study_2_score !== null && rankingData.case_study_2_score !== undefined
              ? rankingData.case_study_2_score
              : null
          );
          setCaseStudy3Score(
            rankingData.case_study_3_score !== null && rankingData.case_study_3_score !== undefined
              ? rankingData.case_study_3_score
              : null
          );
        }
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  const initializeQuestionTypes = () => {
    if (concurso && Object.keys(questionType).length === 0) {
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' } = {};
      let questionNumber = 1;
      
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        for (let i = 0; i < concurso.specific_knowledge_3_questions; i++) {
          typesMap[questionNumber] = 'specific3';
          questionNumber++;
        }
      }
      
      console.log('Initialized question types mapping:', typesMap);
      setQuestionType(typesMap);
    }
  };

  // Adicionando a função initializeAnswers
  const initializeAnswers = (initialAnswers: { [key: number]: string }) => {
    setAnswers(initialAnswers);
  };

  useEffect(() => {
    if (rankingId) {
      fetchExistingAnswers();
    }
  }, [rankingId]);

  useEffect(() => {
    if (concurso) {
      initializeQuestionTypes();
    }
  }, [concurso]);

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };
  
  const handleClearAnswer = (questionNumber: number) => {
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[questionNumber];
      return newAnswers;
    });
  };

  const getTotalQuestions = () => {
    if (!concurso) return 0;
    
    let total = 0;
    
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      total += concurso.basic_knowledge_questions;
    }
    
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      total += concurso.specific_knowledge_1_questions;
    }
    
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      total += concurso.specific_knowledge_2_questions;
    }
    
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      total += concurso.specific_knowledge_3_questions;
    }
    
    return total;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

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

  const createAnswerMatrix = () => {
    const sectionQuestions = getSectionQuestions();
    if (sectionQuestions.length === 0) return [];
    
    const QUESTIONS_PER_ROW = 4; // Changed from 5 to 4 for better display
    const rows = Math.ceil(sectionQuestions.length / QUESTIONS_PER_ROW);
    
    const matrix = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
        const index = row * QUESTIONS_PER_ROW + col;
        if (index < sectionQuestions.length) {
          rowData.push(sectionQuestions[index]);
        } else {
          rowData.push(null);
        }
      }
      matrix.push(rowData);
    }
    
    console.log('Created answer matrix for section', selectedSection, ':', matrix);
    return matrix;
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
    getTotalQuestions,
    getAnsweredQuestionsCount,
    getOptionsForQuestion,
    createAnswerMatrix,
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
    getSectionQuestions,
    initializeAnswers,
    setAnswers
  };
};
