
import { useState } from 'react';

export const useScoreManagement = () => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);
  const [disciplineScores, setDisciplineScores] = useState<Record<string, number | null>>({});

  const setDisciplineScore = (disciplineName: string, score: number | null) => {
    setDisciplineScores(prev => ({
      ...prev,
      [disciplineName]: score
    }));
  };

  const getDisciplineScore = (disciplineName: string): number | null => {
    return disciplineScores[disciplineName] || null;
  };

  return {
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score,
    disciplineScores,
    setDisciplineScore,
    getDisciplineScore,
  };
};
