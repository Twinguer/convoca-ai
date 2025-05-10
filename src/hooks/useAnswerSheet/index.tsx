
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
    
    const questions: number[] = [];

    // Verificar primeiro se estamos usando conhecimento customizável
    if (concurso.has_custom_knowledge) {
      console.log("Using custom knowledge model");
      
      if (Object.keys(questionType).length === 0) {
        // Se ainda não temos mapeamento, inicializar baseado no modelo customizável
        console.log("No question type mapping yet, building from disciplines");
        
        if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
          let currentQuestion = 1;
          
          for (const discipline of concurso.disciplines) {
            const questionCount = typeof discipline.questionCount === 'number'
              ? discipline.questionCount
              : Number(discipline.questionCount);
              
            if (discipline.isEnabled && discipline.type === selectedSection && questionCount) {
              console.log(`Adding ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
              
              for (let i = 0; i < questionCount; i++) {
                questions.push(currentQuestion++);
              }
            } else if (discipline.isEnabled) {
              // Pular questões de outras disciplinas
              console.log(`Skipping ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
              currentQuestion += questionCount;
            }
          }
        } else {
          console.warn("No disciplines array found in concurso");
        }
      } else {
        // Usar o mapeamento existente para encontrar questões do tipo selecionado
        console.log("Using existing question type mapping");
        
        Object.entries(questionType).forEach(([num, type]) => {
          if (type === selectedSection) {
            questions.push(parseInt(num));
          }
        });
      }
      
      console.log(`Found ${questions.length} questions for section ${selectedSection}:`, questions);
      return questions.sort((a, b) => a - b);
    }
    
    // Estrutura tradicional - verifique primeiro se temos mapeamento
    if (Object.keys(questionType).length === 0) {
      // Se não tiver, inicializamos com as questões que DEVERIAM existir com base no concurso
      console.log("No question type mapping yet, building from traditional structure");
      
      if (selectedSection === 'basic' && concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        const count = typeof concurso.basic_knowledge_questions === 'number'
          ? concurso.basic_knowledge_questions
          : Number(concurso.basic_knowledge_questions);
          
        console.log(`Adding ${count} basic knowledge questions`);
        
        for (let i = 1; i <= count; i++) {
          questions.push(i);
        }
      } else if (selectedSection === 'specific1' && concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        const basicCount = typeof concurso.basic_knowledge_questions === 'number'
          ? concurso.basic_knowledge_questions
          : Number(concurso.basic_knowledge_questions || 0);
          
        const count = typeof concurso.specific_knowledge_1_questions === 'number'
          ? concurso.specific_knowledge_1_questions
          : Number(concurso.specific_knowledge_1_questions);
          
        const startIndex = basicCount + 1;
        console.log(`Adding ${count} specific1 questions starting from ${startIndex}`);
        
        for (let i = startIndex; i < startIndex + count; i++) {
          questions.push(i);
        }
      } else if (selectedSection === 'specific2' && concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        const basicCount = typeof concurso.basic_knowledge_questions === 'number'
          ? concurso.basic_knowledge_questions
          : Number(concurso.basic_knowledge_questions || 0);
          
        const specific1Count = typeof concurso.specific_knowledge_1_questions === 'number'
          ? concurso.specific_knowledge_1_questions
          : Number(concurso.specific_knowledge_1_questions || 0);
          
        const count = typeof concurso.specific_knowledge_2_questions === 'number'
          ? concurso.specific_knowledge_2_questions
          : Number(concurso.specific_knowledge_2_questions);
          
        const startIndex = basicCount + specific1Count + 1;
        console.log(`Adding ${count} specific2 questions starting from ${startIndex}`);
        
        for (let i = startIndex; i < startIndex + count; i++) {
          questions.push(i);
        }
      } else if (selectedSection === 'specific3' && concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        const basicCount = typeof concurso.basic_knowledge_questions === 'number'
          ? concurso.basic_knowledge_questions
          : Number(concurso.basic_knowledge_questions || 0);
          
        const specific1Count = typeof concurso.specific_knowledge_1_questions === 'number'
          ? concurso.specific_knowledge_1_questions
          : Number(concurso.specific_knowledge_1_questions || 0);
          
        const specific2Count = typeof concurso.specific_knowledge_2_questions === 'number'
          ? concurso.specific_knowledge_2_questions
          : Number(concurso.specific_knowledge_2_questions || 0);
          
        const count = typeof concurso.specific_knowledge_3_questions === 'number'
          ? concurso.specific_knowledge_3_questions
          : Number(concurso.specific_knowledge_3_questions);
          
        const startIndex = basicCount + specific1Count + specific2Count + 1;
        console.log(`Adding ${count} specific3 questions starting from ${startIndex}`);
        
        for (let i = startIndex; i < startIndex + count; i++) {
          questions.push(i);
        }
      }
    } else {
      // Se tiver, usamos o mapeamento existente
      console.log("Using existing question type mapping for traditional structure");
      
      Object.entries(questionType).forEach(([num, type]) => {
        if (type === selectedSection) {
          questions.push(parseInt(num));
        }
      });
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
