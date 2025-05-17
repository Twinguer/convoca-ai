
import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { getSectionDisplayName, getDisciplines, getNumericValue } from '@/integrations/supabase/rankings/examStructure';

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
    
    if (Object.keys(questionType).length === 0) {
      // Se não temos mapeamento de tipo, precisamos construí-lo dinamicamente
      console.log("Building question types on-the-fly because questionType is empty");
      
      // Verificar se estamos usando conhecimento customizado
      if (concurso.has_custom_knowledge && concurso.disciplines) {
        const disciplines = getDisciplines(concurso);
        const questions: number[] = [];
        
        if (Array.isArray(disciplines)) {
          let currentQuestion = 1;
          
          for (const discipline of disciplines) {
            if (discipline.isEnabled && discipline.type === selectedSection) {
              const questionCount = getNumericValue(discipline.questionCount);
              console.log(`Found matching discipline ${discipline.name}: adding ${questionCount} questions starting from ${currentQuestion}`);
              
              for (let i = 0; i < questionCount; i++) {
                questions.push(currentQuestion++);
              }
            } else if (discipline.isEnabled) {
              // Pular questões das outras disciplinas
              const questionCount = getNumericValue(discipline.questionCount);
              console.log(`Skipping ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
              currentQuestion += questionCount;
            }
          }
        }
        
        console.log(`Generated ${questions.length} questions for section ${selectedSection}:`, questions);
        return questions;
      }
      
      // Caso não esteja usando conhecimento customizado, use a lógica tradicional
      let currentQuestionNumber = 1;
      const questions: number[] = [];
      
      if (concurso.has_basic_knowledge && selectedSection === 'basic') {
        for (let i = 0; i < getNumericValue(concurso.basic_knowledge_questions); i++) {
          questions.push(currentQuestionNumber++);
        }
      } else if (concurso.has_basic_knowledge) {
        currentQuestionNumber += getNumericValue(concurso.basic_knowledge_questions);
      }
      
      if (concurso.has_specific_knowledge_1 && selectedSection === 'specific1') {
        for (let i = 0; i < getNumericValue(concurso.specific_knowledge_1_questions); i++) {
          questions.push(currentQuestionNumber++);
        }
      } else if (concurso.has_specific_knowledge_1) {
        currentQuestionNumber += getNumericValue(concurso.specific_knowledge_1_questions);
      }
      
      if (concurso.has_specific_knowledge_2 && selectedSection === 'specific2') {
        for (let i = 0; i < getNumericValue(concurso.specific_knowledge_2_questions); i++) {
          questions.push(currentQuestionNumber++);
        }
      } else if (concurso.has_specific_knowledge_2) {
        currentQuestionNumber += getNumericValue(concurso.specific_knowledge_2_questions);
      }
      
      if (concurso.has_specific_knowledge_3 && selectedSection === 'specific3') {
        for (let i = 0; i < getNumericValue(concurso.specific_knowledge_3_questions); i++) {
          questions.push(currentQuestionNumber++);
        }
      }
      
      console.log(`Generated ${questions.length} questions using traditional structure for section ${selectedSection}:`, questions);
      return questions;
    }
    
    // Se temos o mapeamento de tipos, usamos ele
    console.log("Using existing question type mapping");
    const questions: number[] = [];
    
    Object.entries(questionType).forEach(([num, type]) => {
      if (type === selectedSection) {
        questions.push(parseInt(num));
      }
    });
    
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
