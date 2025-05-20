
import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { fetchExistingAnswers } from './fetchExistingAnswers';
import { initializeQuestionTypes } from './initializeQuestionTypes';
import { getAnsweredQuestionsCount, getTotalQuestions } from './questionCountUtils';
import { createAnswerMatrix } from './matrixUtils';
import { handleQuestionSectionSelection } from './sectionUtils';
import { useAnswerManagement } from './useAnswerManagement';
import { useScoreManagement } from './useScoreManagement';
import { 
  getSectionDisplayName, 
  getDisciplines, 
  getNumericValue, 
  isHierarchicalStructure 
} from '@/integrations/supabase/rankings/examStructure';

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
    
    // Se não temos mapeamento, tentar construir com base na estrutura
    console.log("No question type mapping yet, building from structure");
    const questions: number[] = [];
    
    // Check if using hierarchical structure
    if (isHierarchicalStructure(concurso)) {
      console.log("Building questions from hierarchical structure");
      let currentQuestionNumber = 1;
      
      if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
        for (const block of concurso.discipline_blocks) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type === selectedSection && discipline.questionCount) {
                const questionCount = getNumericValue(discipline.questionCount);
                
                console.log(`Adding ${questionCount} questions for discipline ${discipline.name} (${discipline.type}) from block ${block.name}`);
                
                for (let i = 0; i < questionCount; i++) {
                  questions.push(currentQuestionNumber++);
                }
              } else if (discipline.isEnabled) {
                // Skip questions from other disciplines
                currentQuestionNumber += getNumericValue(discipline.questionCount);
              }
            }
          }
        }
      }
    } else {
      // Traditional flat disciplines structure
      const disciplines = getDisciplines(concurso);
      
      if (Array.isArray(disciplines)) {
        let currentQuestion = 1;
        
        for (const discipline of disciplines) {
          const questionCount = getNumericValue(discipline.questionCount);
            
          if (discipline.isEnabled && discipline.type === selectedSection && questionCount > 0) {
            console.log(`Adding ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
            
            for (let i = 0; i < questionCount; i++) {
              questions.push(currentQuestion++);
            }
          } else if (discipline.isEnabled) {
            // Skip questions from other disciplines
            console.log(`Skipping ${questionCount} questions for discipline ${discipline.name} (${discipline.type})`);
            currentQuestion += questionCount;
          }
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
  
  // Function to get all sections available in the exam
  const getAllSections = () => {
    const sections: SectionType[] = [];
    
    // Check if using hierarchical structure
    if (isHierarchicalStructure(concurso)) {
      if (concurso.discipline_blocks && Array.isArray(concurso.discipline_blocks)) {
        for (const block of concurso.discipline_blocks) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                sections.push(discipline.type as SectionType);
              }
            }
          }
        }
      }
    } else if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      // Traditional flat disciplines
      for (const discipline of concurso.disciplines) {
        if (discipline.isEnabled && discipline.type) {
          sections.push(discipline.type as SectionType);
        }
      }
    }
    
    // Add subjective sections
    if (concurso.has_discursive) sections.push('discursive');
    if (concurso.has_case_study_1) sections.push('case_study1');
    if (concurso.has_case_study_2) sections.push('case_study2');
    if (concurso.has_case_study_3) sections.push('case_study3');
    
    return sections;
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
    getAllSections
  };
};
