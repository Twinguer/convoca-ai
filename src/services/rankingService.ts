
import { supabase } from '@/integrations/supabase/client';
import { Concurso, ExamSection, EvaluationSection } from '@/types/concursos';

export interface Ranking {
  position: number;
  name: string;
  score: number;
  userId: string;
  avatarUrl?: string | null;
  sectionScores: Record<string, number>; // Dynamic scores keyed by section name
}

export const fetchUserRankings = async (concursoId: string): Promise<Ranking[]> => {
  try {
    console.log('Fetching rankings for concurso:', concursoId);
    
    // Get the concurso first to understand its structure
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        id,
        exam_sections (*),
        evaluation_sections (*)
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) {
      console.error('Error fetching concurso structure:', concursoError);
      throw concursoError;
    }
    
    // Get all rankings for the concurso
    const { data: rankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select(`
        id,
        user_id,
        score,
        section_scores
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (rankingsError) {
      console.error('Error in fetchUserRankings query:', rankingsError);
      throw rankingsError;
    }
    
    // If no rankings, return empty array
    if (!rankings || rankings.length === 0) {
      return [];
    }
    
    // Now fetch the user profiles separately
    const userIds = rankings.map(ranking => ranking.user_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
      
    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      throw profilesError;
    }
    
    console.log('User profiles data:', profiles);
    
    // Map the rankings with profile information
    const formattedRankings = rankings.map((ranking, index) => {
      // Find the matching profile
      const profile = profiles?.find(p => p.id === ranking.user_id);
      
      return {
        position: index + 1,
        name: profile?.name || 'Usuário Anônimo',
        score: ranking.score || 0,
        userId: ranking.user_id,
        avatarUrl: profile?.avatar_url || null,
        sectionScores: ranking.section_scores || {} // Dynamic section scores
      };
    });
    
    console.log('Transformed rankings:', formattedRankings);
    return formattedRankings;
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return [];
  }
};

// Helper function to get section names from a concurso
export const getConcursoSectionNames = async (concursoId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('concursos')
      .select(`
        exam_sections (name),
        evaluation_sections (name)
      `)
      .eq('id', concursoId)
      .single();
      
    if (error) {
      console.error('Error fetching concurso sections:', error);
      return [];
    }
    
    const examSectionNames = (data?.exam_sections || []).map((section: any) => section.name);
    const evalSectionNames = (data?.evaluation_sections || []).map((section: any) => section.name);
    
    return [...examSectionNames, ...evalSectionNames];
  } catch (error) {
    console.error('Error in getConcursoSectionNames:', error);
    return [];
  }
};
