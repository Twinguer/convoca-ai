
// Define types for the rankings
export interface UserRanking {
  position?: number;
  score: number;
  id?: string;
  userId?: string;
}

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  basicKnowledgeScore?: number;
  specificKnowledgeScore?: number;
  discursiveScore?: number;
}
