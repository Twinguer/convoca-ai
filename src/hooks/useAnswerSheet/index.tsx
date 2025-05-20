
import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { sectionDisplayNames, getDisciplines, getNumericValue, isHierarchicalStructure } from '@/integrations/supabase/rankings/examStructure';

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

  // Inicializar com a primeira seção disponível
  useEffect(() => {
    if (concurso) {
      console.log("Initializing selected section for concurso:", concurso.id);
      handleQuestionSectionSelection(
        concurso,
        (section: SectionType) => {
          console.log("Setting selected section to:", section);
          setSelectedSection(section);
        }
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
      console.log("Initializing question types for concurso:", concurso.id);
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
    if (!concurso) {
      console.warn("No concurso available for getSectionQuestions");
      return [];
    }
    
    console.log('Getting questions for section:', selectedSection);
    console.log('Question type mapping:', questionType);
    
    // Verificar se temos mapeamento de tipos de questão
    if (Object.keys(questionType).length > 0) {
      console.log("Using existing question type mapping");
      
      const questions: number[] = [];
      Object.entries(questionType).forEach(([num, type]) => {
        if (type === selectedSection) {
          questions.push(parseInt(num));
        }
      });
      console.log(`Found ${questions.length} questions for section ${selectedSection}:`, questions);
      return questions.sort((a, b) => a - b);
    }
    
    // Se não temos mapeamento, tentar construir com base nas disciplinas
    console.log("No question type mapping yet, building from disciplines");
    const questions: number[] = [];
    
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      const hierarchical = isHierarchicalStructure(concurso);
      let currentQuestion = 1;
      
      if (hierarchical) {
        // Estrutura hierárquica (blocos -> disciplinas)
        for (const block of concurso.disciplines as any[]) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                const questionCount = getNumericValue(discipline.questionCount);
                
                if (discipline.type === selectedSection) {
                  console.log(`Adding ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
                  
                  for (let i = 0; i < questionCount; i++) {
                    questions.push(currentQuestion++);
                  }
                } else {
                  // Pular questões de outras disciplinas
                  console.log(`Skipping ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
                  currentQuestion += questionCount;
                }
              }
            }
          }
        }
      } else {
        // Estrutura plana
        for (const discipline of concurso.disciplines) {
          if (discipline.isEnabled) {
            const questionCount = getNumericValue(discipline.questionCount);
            
            if (discipline.type === selectedSection) {
              console.log(`Adding ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
              
              for (let i = 0; i < questionCount; i++) {
                questions.push(currentQuestion++);
              }
            } else {
              // Pular questões de outras disciplinas
              console.log(`Skipping ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
              currentQuestion += questionCount;
            }
          }
        }
      }
    } else {
      // Estrutura tradicional
      let currentQuestion = 1;
      
      if (concurso.has_basic_knowledge && selectedSection === 'basic') {
        const count = getNumericValue(concurso.basic_knowledge_questions);
        for (let i = 0; i < count; i++) {
          questions.push(currentQuestion++);
        }
      } else if (concurso.has_basic_knowledge) {
        currentQuestion += getNumericValue(concurso.basic_knowledge_questions);
      }
      
      if (concurso.has_specific_knowledge_1 && selectedSection === 'specific1') {
        const count = getNumericValue(concurso.specific_knowledge_1_questions);
        for (let i = 0; i < count; i++) {
          questions.push(currentQuestion++);
        }
      } else if (concurso.has_specific_knowledge_1) {
        currentQuestion += getNumericValue(concurso.specific_knowledge_1_questions);
      }
      
      if (concurso.has_specific_knowledge_2 && selectedSection === 'specific2') {
        const count = getNumericValue(concurso.specific_knowledge_2_questions);
        for (let i = 0; i < count; i++) {
          questions.push(currentQuestion++);
        }
      } else if (concurso.has_specific_knowledge_2) {
        currentQuestion += getNumericValue(concurso.specific_knowledge_2_questions);
      }
      
      if (concurso.has_specific_knowledge_3 && selectedSection === 'specific3') {
        const count = getNumericValue(concurso.specific_knowledge_3_questions);
        for (let i = 0; i < count; i++) {
          questions.push(currentQuestion++);
        }
      }
    }
    
    console.log(`Found ${questions.length} questions for section ${selectedSection}:`, questions);
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

  // Função para obter todas as questões de todas as seções
  const getAllQuestionsFromAllSections = () => {
    const allQuestions: number[] = [];
    
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      let currentQuestionNumber = 1;
      const hierarchical = isHierarchicalStructure(concurso);
      
      if (hierarchical) {
        // Processar estrutura hierárquica (blocos -> disciplinas)
        for (const block of concurso.disciplines as any[]) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled) {
                const count = getNumericValue(discipline.questionCount);
                for (let i = 0; i < count; i++) {
                  allQuestions.push(currentQuestionNumber++);
                }
              }
            }
          }
        }
      } else {
        // Processar estrutura plana de disciplinas
        for (const discipline of concurso.disciplines) {
          if (discipline.isEnabled) {
            const count = getNumericValue(discipline.questionCount);
            for (let i = 0; i < count; i++) {
              allQuestions.push(currentQuestionNumber++);
            }
          }
        }
      }
      
      return allQuestions;
    }
    
    // Estrutura tradicional
    let currentQuestionNumber = 1;
    
    // Básico
    if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
      const count = getNumericValue(concurso.basic_knowledge_questions);
      for (let i = 0; i < count; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 1
    if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
      const count = getNumericValue(concurso.specific_knowledge_1_questions);
      for (let i = 0; i < count; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 2
    if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
      const count = getNumericValue(concurso.specific_knowledge_2_questions);
      for (let i = 0; i < count; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    // Específico 3
    if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
      const count = getNumericValue(concurso.specific_knowledge_3_questions);
      for (let i = 0; i < count; i++) {
        allQuestions.push(currentQuestionNumber++);
      }
    }
    
    return allQuestions;
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
    getSectionQuestions,
    getAllQuestionsFromAllSections
  };
};
