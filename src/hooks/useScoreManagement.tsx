
import { useState } from 'react';

export const useScoreManagement = () => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);
  const [weightedBasicScore, setWeightedBasicScore] = useState<number | null>(null);
  const [weightedSpecific1Score, setWeightedSpecific1Score] = useState<number | null>(null);
  const [weightedSpecific2Score, setWeightedSpecific2Score] = useState<number | null>(null);
  const [weightedSpecific3Score, setWeightedSpecific3Score] = useState<number | null>(null);

  return {
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score,
    weightedBasicScore,
    setWeightedBasicScore,
    weightedSpecific1Score,
    setWeightedSpecific1Score,
    weightedSpecific2Score,
    setWeightedSpecific2Score,
    weightedSpecific3Score,
    setWeightedSpecific3Score
  };
};
