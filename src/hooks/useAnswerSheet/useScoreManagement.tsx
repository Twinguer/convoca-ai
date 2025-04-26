
import { useState } from 'react';

export const useScoreManagement = () => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);

  // Função para resetar todas as pontuações
  const resetAllScores = () => {
    setDiscursiveScore(null);
    setCaseStudy1Score(null);
    setCaseStudy2Score(null);
    setCaseStudy3Score(null);
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
    resetAllScores
  };
};
