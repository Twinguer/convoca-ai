
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
