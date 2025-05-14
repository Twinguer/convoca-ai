
// src/services/rankingService.ts

export interface Ranking {
  id: string;
  userId: string;
  name: string;
  position: number;
  score: number;
  previousPosition?: number;
  positionChange?: number;
  avatarUrl?: string;
  reservationType: string;
  displayReservation: string;
  quotaPosition?: number;
  weightedBasicKnowledgeScore?: number;
  weightedSpecificKnowledgeScore?: number;
  weightedDiscursiveScore?: number;
  weightedCaseStudy1Score?: number; 
  weightedCaseStudy2Score?: number;
  weightedCaseStudy3Score?: number;
  weightedCustomDisciplineScores?: Record<string, number>;
  is_classified?: boolean; // Add the is_classified field
}
