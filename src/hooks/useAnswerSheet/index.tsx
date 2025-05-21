import { useState, useEffect } from 'react';
import { Concurso, SectionType } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { getNumericValue } from '@/integrations/supabase/rankings/examStructure';

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
      if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
        // Verificar se estamos usando a estrutura hierárquica (blocos -> disciplinas)
        const isHierarchical = concurso.disciplines[0] &&
                               typeof concurso.disciplines[0] === 'object' &&
                               'name' in concurso.disciplines[0] &&
                               'disciplines' in concurso.disciplines[0];

                               if (isHierarchical) {
                                // Encontrar a primeira disciplina ativa em qualquer bloco
                                for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto para compatibilidade com dados, idealmente remover após refatoração completa
                                  if (block.disciplines && Array.isArray(block.disciplines)) {
                                    const firstDiscipline = block.disciplines.find((d: any) => d.isEnabled); // Acessa isEnabled nas disciplinas aninhadas
                                    if (firstDiscipline) {
                                      setSelectedSection(firstDiscipline.type as SectionType); // Acessa type nas disciplinas aninhadas
                                      break; // Sair do loop de blocos assim que encontrar
                                    }
                                  }
                                }
                              } else {
                                // Como a tipagem agora é sempre aninhada para has_custom_knowledge,
                                // precisamos iterar sobre blocos e disciplinas mesmo no "modo antigo"
                                for (const block of concurso.disciplines as any[]) { // Manter as any[] por enquanto
                                  if (block.disciplines && Array.isArray(block.disciplines)) {
                                    const firstDiscipline = block.disciplines.find((d: any) => d.isEnabled);
                                    if (firstDiscipline) {
                                      setSelectedSection(firstDiscipline.type as SectionType);
                                      break; // Sair do loop de blocos assim que encontrar
                                    }
                                  }
                                }
                              }
      } else if (concurso.has_basic_knowledge) {
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

      // Verificar se estamos usando a estrutura customizada (blocos -> disciplinas)
      if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
        let questionNumber = 1;

        // Processar estrutura hierárquica (blocos com disciplinas aninhadas)
        for (const block of concurso.disciplines) { // Iterar sobre os blocos
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) { // Iterar sobre as disciplinas dentro do bloco
              if (discipline.isEnabled) {
                const questionCount = getNumericValue(discipline.questionCount);
                for (let i = 0; i < questionCount; i++) {
                  typesMap[questionNumber] = discipline.type; // <-- Correção: Acessando type na disciplina
                  questionNumber++;
                }
              }
            }
          }
        }
      } else {
        // Processar estrutura tradicional (legacy) - Manter por retrocompatibilidade se ainda necessário
        let questionNumber = 1;

        if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
          for (let i = 0; i < getNumericValue(concurso.basic_knowledge_questions); i++) { // Usar getNumericValue
            typesMap[questionNumber] = 'basic';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
          for (let i = 0; i < getNumericValue(concurso.specific_knowledge_1_questions); i++) { // Usar getNumericValue
            typesMap[questionNumber] = 'specific1';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
          for (let i = 0; i < getNumericValue(concurso.specific_knowledge_2_questions); i++) { // Usar getNumericValue
            typesMap[questionNumber] = 'specific2';
            questionNumber++;
          }
        }

        if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
          for (let i = 0; i < getNumericValue(concurso.specific_knowledge_3_questions); i++) { // Usar getNumericValue
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

    let total = 0;

    // Verificar se estamos usando a estrutura customizada (blocos -> disciplinas)
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      // Processar estrutura hierárquica (blocos com disciplinas aninhadas)
      for (const block of concurso.disciplines) { // Iterar sobre os blocos
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) { // Iterar sobre as disciplinas dentro do bloco
            if (discipline.isEnabled && discipline.questionCount) {
              total += getNumericValue(discipline.questionCount);
            }
          }
        }
      }
    } else {
      // Processar estrutura tradicional (legacy) - Manter por retrocompatibilidade se ainda necessário
      if (concurso.has_basic_knowledge && concurso.basic_knowledge_questions) {
        total += getNumericValue(concurso.basic_knowledge_questions); // Usar getNumericValue também aqui
      }

      if (concurso.has_specific_knowledge_1 && concurso.specific_knowledge_1_questions) {
        total += getNumericValue(concurso.specific_knowledge_1_questions);
      }

      if (concurso.has_specific_knowledge_2 && concurso.specific_knowledge_2_questions) {
        total += getNumericValue(concurso.specific_knowledge_2_questions);
      }

      if (concurso.has_specific_knowledge_3 && concurso.specific_knowledge_3_questions) {
        total += getNumericValue(concurso.specific_knowledge_3_questions);
      }
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

  // Função para obter questões baseadas na seção selecionada
  const getSectionQuestions = () => {
    if (!concurso) return [];

    console.log('Getting questions for section:', selectedSection);

    // Verificar se estamos usando a estrutura customizada (blocos -> disciplinas)
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      let startIndex = 1;

      // Processar estrutura hierárquica (blocos com disciplinas aninhadas)
      for (const block of concurso.disciplines) { // Iterar sobre os blocos
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) { // Iterar sobre as disciplinas dentro do bloco
            if (discipline.isEnabled) {
              const questionCount = getNumericValue(discipline.questionCount);

              if (discipline.type === selectedSection) { // <-- Acessando type na disciplina
                // Retornar o range de questões para esta disciplina
                const questions = Array.from(
                  { length: questionCount },
                  (_, i) => startIndex + i
                );
                console.log(`Questions for discipline ${discipline.name} (type: ${discipline.type}):`, questions);
                return questions;
              }

              // Atualizar índice inicial para a próxima disciplina
              startIndex += questionCount;
            }
          }
        }
      }

      return []; // Se a seção selecionada não foi encontrada nos blocos/disciplinas
    }

    // Lidar com tipos tradicionais de seção (legacy) - Manter por retrocompatibilidade se ainda necessário
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
    getSectionQuestions
  };
};
