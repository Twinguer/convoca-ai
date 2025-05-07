
import { useState } from 'react';

export const useScoreManagement = () => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({});

  const updateSubjectScore = (subjectCode: string, score: number) => {
    setSubjectScores((prev) => ({
      ...prev,
      [subjectCode]: score
    }));
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
    subjectScores,
    setSubjectScores,
    updateSubjectScore
  };
};
