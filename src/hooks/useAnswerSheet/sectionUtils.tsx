
import React from 'react';

export const getSectionQuestions = (
  section: "basic" | "specific1" | "specific2" | "specific3" | "discursive" | "case_study1" | "case_study2" | "case_study3",
  concurso: any
) => {
  switch (section) {
    case "basic":
      return concurso?.basic_knowledge_questions || 0;
    case "specific1":
      return concurso?.specific_knowledge_1_questions || 0;
    case "specific2":
      return concurso?.specific_knowledge_2_questions || 0;
    case "specific3":
      return concurso?.specific_knowledge_3_questions || 0;
    default:
      return 0;
  }
};

export const getSectionTitle = (
  section: "basic" | "specific1" | "specific2" | "specific3" | "discursive" | "case_study1" | "case_study2" | "case_study3"
) => {
  switch (section) {
    case "basic":
      return "Conhecimentos Básicos";
    case "specific1":
      return "Conhecimentos Específicos 1";
    case "specific2":
      return "Conhecimentos Específicos 2";
    case "specific3":
      return "Conhecimentos Específicos 3";
    case "discursive":
      return "Prova Discursiva";
    case "case_study1":
      return "Estudo de Caso 1";
    case "case_study2":
      return "Estudo de Caso 2";
    case "case_study3":
      return "Estudo de Caso 3";
    default:
      return "";
  }
};

// Função para selecionar a seção inicial com base no concurso
export const handleQuestionSectionSelection = (
  concurso: any,
  setSelectedSection: React.Dispatch<React.SetStateAction<"basic" | "specific1" | "specific2" | "specific3" | "discursive" | "case_study1" | "case_study2" | "case_study3">>
) => {
  if (concurso) {
    // Verificar se o concurso usa modelo de disciplinas
    if (concurso.minimum_score_type === 'subject' && concurso.subjects) {
      try {
        // Tenta obter a primeira disciplina definida
        const subjects = typeof concurso.subjects === 'string' 
          ? JSON.parse(concurso.subjects) 
          : concurso.subjects;
          
        if (Array.isArray(subjects) && subjects.length > 0) {
          // Seleciona a primeira disciplina como seção ativa
          setSelectedSection(subjects[0].code as any);
          return;
        }
      } catch (e) {
        console.error('Erro ao processar disciplinas ao selecionar seção inicial:', e);
      }
    }
    
    // Fallback para o modelo baseado em conhecimentos se não for possível usar disciplinas
    if (concurso.has_basic_knowledge) {
      setSelectedSection('basic');
    } else if (concurso.has_specific_knowledge_1) {
      setSelectedSection('specific1');
    } else if (concurso.has_specific_knowledge_2) {
      setSelectedSection('specific2');
    } else if (concurso.has_specific_knowledge_3) {
      setSelectedSection('specific3');
    } else if (concurso.has_discursive) {
      setSelectedSection('discursive');
    } else if (concurso.has_case_study_1) {
      setSelectedSection('case_study1');
    } else if (concurso.has_case_study_2) {
      setSelectedSection('case_study2');
    } else if (concurso.has_case_study_3) {
      setSelectedSection('case_study3');
    }
  }
};
