
// src/services/rankingService.ts

import { supabase } from '@/integrations/supabase/client';

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
  customDisciplineScores?: Record<string, number>;
  is_classified?: boolean;
}

// Function to fetch user rankings for a specific concurso
export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    console.log(`Fetching rankings for concurso: ${concursoId}`);
    
    // Fetch all users participating in the ranking
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id, 
        user_id,
        score,
        reservation_type,
        weighted_basic_score,
        weighted_specific_1_score,
        weighted_discursive_score,
        weighted_case_study_1_score,
        weighted_case_study_2_score,
        weighted_case_study_3_score,
        weightedCustomDisciplineScores,
        customDisciplineScores,
        is_score_recalculated,
        is_classified
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error fetching user rankings:', rankingsError);
      return [];
    }

    if (!userRankings || userRankings.length === 0) {
      console.log('No rankings found for this concurso');
      return [];
    }
    
    // Create an object to store user profile data to avoid duplicate fetches
    interface UserProfiles {
      [key: string]: {
        name: string;
        avatarUrl: string | null;
      }
    }
    
    // Fetch profile data for all users in the ranking
    const uniqueUserIds = [...new Set(userRankings.map(ranking => ranking.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', uniqueUserIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }
    
    // Create a lookup map for quick access to profile data
    const userProfiles: UserProfiles = {};
    
    if (profiles) {
      profiles.forEach(profile => {
        userProfiles[profile.id] = {
          name: profile.name,
          avatarUrl: profile.avatar_url
        };
      });
    }
    
    // Map rankings to the expected format with positions
    const formattedRankings: Ranking[] = userRankings.map((ranking, index) => {
      const userProfile = userProfiles[ranking.user_id] || { 
        name: 'Usuário desconhecido', 
        avatarUrl: null 
      };
      
      // Get friendly display name for reservation type
      const displayReservation = getDisplayNameForReservationType(ranking.reservation_type);
      
      return {
        id: ranking.id,
        userId: ranking.user_id,
        name: userProfile.name,
        position: index + 1, // Position starts from 1
        score: ranking.score || 0,
        avatarUrl: userProfile.avatarUrl || undefined,
        reservationType: ranking.reservation_type || 'Ampla Concorrência',
        displayReservation,
        weightedBasicKnowledgeScore: ranking.weighted_basic_score,
        weightedSpecificKnowledgeScore: ranking.weighted_specific_1_score,
        weightedDiscursiveScore: ranking.weighted_discursive_score,
        weightedCaseStudy1Score: ranking.weighted_case_study_1_score,
        weightedCaseStudy2Score: ranking.weighted_case_study_2_score, 
        weightedCaseStudy3Score: ranking.weighted_case_study_3_score,
        weightedCustomDisciplineScores: ranking.weightedCustomDisciplineScores || {},
        customDisciplineScores: ranking.customDisciplineScores || {},
        is_classified: ranking.is_classified
      };
    });
    
    return formattedRankings;
  } catch (error) {
    console.error('Error in fetchUserRankings:', error);
    return [];
  }
};

// Helper to get a user-friendly display name for reservation types
const getDisplayNameForReservationType = (type: string): string => {
  const displayNames: Record<string, string> = {
    'Ampla Concorrência': 'AC',
    'PPP': 'PPP',
    'PCD': 'PCD',
    'Hipossuficientes': 'Hip',
    'Indígenas': 'Ind',
    'Pessoas Trans': 'Trans'
  };
  
  return displayNames[type] || type;
};
