
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

  // Fetch existing answers if any
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

  // Auto-assign question types based on concurso structure
  const initializeQuestionTypes = () => {
    if (concurso && Object.keys(questionType).length === 0) {
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' } = {};
      let questionNumber = 1;
      
      // Basic knowledge questions
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        for (let i = 0; i < concurso.basic_knowledge_questions; i++) {
          typesMap[questionNumber] = 'basic';
          questionNumber++;
        }
      }
      
      // Specific knowledge 1 questions
      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        for (let i = 0; i < concurso.specific_knowledge_1_questions; i++) {
          typesMap[questionNumber] = 'specific1';
          questionNumber++;
        }
      }
      
      // Specific knowledge 2 questions
      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        for (let i = 0; i < concurso.specific_knowledge_2_questions; i++) {
          typesMap[questionNumber] = 'specific2';
          questionNumber++;
        }
      }
      
      setQuestionType(typesMap);
    }
  };

  // Load data on mount
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

  // Generate question numbers for currently selected section
  const getSectionQuestions = () => {
    if (!concurso) return [];
    
    const questions: number[] = [];
    
    // Get all question numbers for the selected section
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
    
    // For multiple choice, use the alternatives_count or default to 5
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, etc.
  };
  
  // Create matrix-style layout for answers
  const createAnswerMatrix = () => {
    const sectionQuestions = getSectionQuestions();
    if (sectionQuestions.length === 0) return [];
    
    // Define matrix size - try to get a balanced layout
    const COLUMNS = 6; // Fixed number of columns
    const rows = Math.ceil(sectionQuestions.length / COLUMNS);
    
    const matrix = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < COLUMNS; col++) {
        const index = row * COLUMNS + col;
        if (index < sectionQuestions.length) {
          rowData.push(sectionQuestions[index]);
        } else {
          rowData.push(null); // Empty cell
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
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType
  };
};
