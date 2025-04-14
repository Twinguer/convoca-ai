
import { useState, useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' }>({});
  const [selectedSection, setSelectedSection] = useState<'basic' | 'specific1' | 'specific2'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchExistingAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', rankingId);
        
      if (error) throw error;
      
      if (data?.length) {
        const answersMap: { [key: number]: string } = {};
        const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' } = {};
        
        data.forEach((item: any) => {
          answersMap[item.question_number] = item.answer;
          
          if (item.is_basic_knowledge) {
            typesMap[item.question_number] = 'basic';
          } else if (concurso.has_specific_knowledge_1) {
            typesMap[item.question_number] = 'specific1';
          } else if (concurso.has_specific_knowledge_2) {
            typesMap[item.question_number] = 'specific2';
          }
        });
        
        setAnswers(answersMap);
        setQuestionType(typesMap);
      }
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  const initializeQuestionTypes = () => {
    if (concurso && Object.keys(questionType).length === 0) {
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' } = {};
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
      
      setQuestionType(typesMap);
    }
  };

  useEffect(() => {
    fetchExistingAnswers();
  }, [rankingId]);

  useEffect(() => {
    initializeQuestionTypes();
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
    
    return total;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  const getSectionQuestions = () => {
    if (!concurso) return [];
    
    const questions: number[] = [];
    
    Object.entries(questionType).forEach(([num, type]) => {
      if (
        (selectedSection === 'basic' && type === 'basic') ||
        (selectedSection === 'specific1' && type === 'specific1') ||
        (selectedSection === 'specific2' && type === 'specific2')
      ) {
        questions.push(parseInt(num));
      }
    });
    
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
    questionType
  };
};
