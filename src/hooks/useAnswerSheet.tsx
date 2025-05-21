
import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';
import { handleQuestionSectionSelection } from './useAnswerSheet/sectionUtils';

export const useAnswerSheet = (concurso: Concurso, rankingId: string) => {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [questionType, setQuestionType] = useState<{ [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string }>({});
  const [selectedSection, setSelectedSection] = useState<SectionType>('basic');
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
      handleQuestionSectionSelection(concurso, setSelectedSection);
    }
  }, [concurso]);

  const fetchExistingAnswers = async () => {
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
        const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string } = {};

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
    } catch (error) {
      console.error('Error fetching answers:', error);
    }
  };

  const initializeQuestionTypes = () => {
    if (concurso && Object.keys(questionType).length === 0) {
      const typesMap: { [key: number]: 'basic' | 'specific1' | 'specific2' | 'specific3' | string } = {};
      
      console.log('[initializeQuestionTypes] Initializing question types for concurso:', concurso.id);

      // Verificar se estamos usando a estrutura customizada
      if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
        const hierarchical = isHierarchicalStructure(concurso);
        console.log('[initializeQuestionTypes] Using hierarchical structure:', hierarchical);
        
        let questionNumber = 1;

        if (hierarchical) {
          // Processar estrutura hierárquica (blocos -> disciplinas)
          for (const block of concurso.disciplines) {
            console.log('[initializeQuestionTypes] Processing block:', block.name);
            if (block.disciplines && Array.isArray(block.disciplines)) {
              for (const discipline of block.disciplines) {
                if (discipline.isEnabled) {
                  const questionCount = getNumericValue(discipline.questionCount);
                  console.log(`[initializeQuestionTypes] Adding ${questionCount} questions of type ${discipline.type} from discipline ${discipline.name}`);
                  
                  for (let i = 0; i < questionCount; i++) {
                    typesMap[questionNumber] = discipline.type;
                    questionNumber++;
                  }
                }
              }
            }
          }
        } else {
          // Processar estrutura plana
          for (const discipline of concurso.disciplines as any[]) {
            if (discipline.isEnabled) {
              const questionCount = getNumericValue(discipline.questionCount);
              console.log(`[initializeQuestionTypes] Adding ${questionCount} questions of type ${discipline.type} from flat discipline ${discipline.name}`);
              
              for (let i = 0; i < questionCount; i++) {
                typesMap[questionNumber] = discipline.type;
                questionNumber++;
              }
            }
          }
        }
      } else {
        // Processar estrutura tradicional (legacy)
        let questionNumber = 1;

        if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
          const count = getNumericValue(concurso.basic_knowledge_questions);
          console.log(`[initializeQuestionTypes] Adding ${count} basic knowledge questions`);
          
          for (let i = 0; i < count; i++) {
            typesMap[questionNumber] = 'basic';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
          const count = getNumericValue(concurso.specific_knowledge_1_questions);
          console.log(`[initializeQuestionTypes] Adding ${count} specific knowledge 1 questions`);
          
          for (let i = 0; i < count; i++) {
            typesMap[questionNumber] = 'specific1';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
          const count = getNumericValue(concurso.specific_knowledge_2_questions);
          console.log(`[initializeQuestionTypes] Adding ${count} specific knowledge 2 questions`);
          
          for (let i = 0; i < count; i++) {
            typesMap[questionNumber] = 'specific2';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
          const count = getNumericValue(concurso.specific_knowledge_3_questions);
          console.log(`[initializeQuestionTypes] Adding ${count} specific knowledge 3 questions`);
          
          for (let i = 0; i < count; i++) {
            typesMap[questionNumber] = 'specific3';
            questionNumber++;
          }
        }
      }

      console.log('Initialized question types mapping:', typesMap);
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
    
    console.log('[getTotalQuestions] Calculating total questions for concurso:', concurso.id);

    let total = 0;

    // Verificar se estamos usando a estrutura customizada
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const hierarchical = isHierarchicalStructure(concurso);
      console.log('[getTotalQuestions] Using hierarchical structure:', hierarchical);
      
      if (hierarchical) {
        // Processar estrutura hierárquica (blocos -> disciplinas)
        for (const block of concurso.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.questionCount) {
                const count = getNumericValue(discipline.questionCount);
                console.log(`[getTotalQuestions] Adding ${count} questions from discipline ${discipline.name}`);
                total += count;
              }
            }
          }
        }
      } else {
        // Processar estrutura plana
        for (const discipline of concurso.disciplines as any[]) {
          if (discipline.isEnabled && discipline.questionCount) {
            const count = getNumericValue(discipline.questionCount);
            console.log(`[getTotalQuestions] Adding ${count} questions from flat discipline ${discipline.name}`);
            total += count;
          }
        }
      }
    } else {
      // Processar estrutura tradicional (legacy)
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        const count = getNumericValue(concurso.basic_knowledge_questions);
        console.log(`[getTotalQuestions] Adding ${count} basic knowledge questions`);
        total += count;
      }

      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        const count = getNumericValue(concurso.specific_knowledge_1_questions);
        console.log(`[getTotalQuestions] Adding ${count} specific knowledge 1 questions`);
        total += count;
      }

      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        const count = getNumericValue(concurso.specific_knowledge_2_questions);
        console.log(`[getTotalQuestions] Adding ${count} specific knowledge 2 questions`);
        total += count;
      }

      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        const count = getNumericValue(concurso.specific_knowledge_3_questions);
        console.log(`[getTotalQuestions] Adding ${count} specific knowledge 3 questions`);
        total += count;
      }
    }

    console.log(`[getTotalQuestions] Total questions: ${total}`);
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

  // Função para obter questões baseadas na seção selecionada
  const getSectionQuestions = () => {
    if (!concurso) return [];

    console.log('[getSectionQuestions] Getting questions for section:', selectedSection);

    // Verificar se estamos usando a estrutura customizada
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const hierarchical = isHierarchicalStructure(concurso);
      console.log('[getSectionQuestions] Using hierarchical structure:', hierarchical);
      
      let startIndex = 1;

      if (hierarchical) {
        // Processar estrutura hierárquica (blocos -> disciplinas)
        for (const block of concurso.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                const questionCount = getNumericValue(discipline.questionCount);

                if (discipline.type === selectedSection) {
                  // Retornar o range de questões para esta disciplina
                  const questions = Array.from(
                    { length: questionCount },
                    (_, i) => startIndex + i
                  );
                  console.log(`[getSectionQuestions] Questions for discipline ${discipline.name} (type: ${discipline.type}):`, questions);
                  return questions;
                }

                // Atualizar índice inicial para a próxima disciplina
                startIndex += questionCount;
              }
            }
          }
        }
      } else {
        // Processar estrutura plana
        for (const discipline of concurso.disciplines as any[]) {
          if (discipline.isEnabled) {
            const questionCount = getNumericValue(discipline.questionCount);

            if (discipline.type === selectedSection) {
              // Retornar o range de questões para esta disciplina
              const questions = Array.from(
                { length: questionCount },
                (_, i) => startIndex + i
              );
              console.log(`[getSectionQuestions] Questions for flat discipline ${discipline.name} (type: ${discipline.type}):`, questions);
              return questions;
            }

            // Atualizar índice inicial para a próxima disciplina
            startIndex += questionCount;
          }
        }
      }

      return []; // Se a seção selecionada não foi encontrada
    }

    // Processar estrutura tradicional (legacy)
    const questions: number[] = [];

    if (concurso && questionType) {
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

    console.log('[getSectionQuestions] Questions for section', selectedSection, ':', questions);
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
    if (sectionQuestions.length === 0) {
      console.log('[createAnswerMatrix] No questions found for section:', selectedSection);
      return [];
    }

    const QUESTIONS_PER_ROW = 4;
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

    console.log('[createAnswerMatrix] Matrix for section', selectedSection, ':', matrix);
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
    getSectionQuestions
  };
};
