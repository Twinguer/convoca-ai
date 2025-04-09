
import { supabase } from '@/integrations/supabase/client';
import { Concurso, ConcursoFilter } from '@/types/concursos';

// Fetch all concursos
export const fetchConcursos = async (filters?: ConcursoFilter): Promise<Concurso[]> => {
  let query = supabase.from('concursos').select('*');
  
  if (filters) {
    if (filters.orgao) {
      query = query.eq('orgao', filters.orgao);
    }
    
    if (filters.banca) {
      query = query.eq('banca', filters.banca);
    }
    
    if (filters.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }
  }
  
  const { data, error } = await query.order('data_publicacao', { ascending: false });
  
  if (error) {
    console.error('Error fetching concursos:', error);
    throw new Error('Failed to fetch concursos');
  }
  
  return data as Concurso[];
};

// Fetch a single concurso by ID
export const fetchConcursoById = async (id: string): Promise<Concurso> => {
  const { data, error } = await supabase
    .from('concursos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching concurso by ID:', error);
    throw new Error('Failed to fetch concurso');
  }
  
  return data as Concurso;
};

// Fetch concursos by banca
export const fetchConcursosByBanca = async (banca: string): Promise<Concurso[]> => {
  const { data, error } = await supabase
    .from('concursos')
    .select('*')
    .eq('banca', banca)
    .order('data_publicacao', { ascending: false });
  
  if (error) {
    console.error(`Error fetching concursos by banca ${banca}:`, error);
    throw new Error(`Failed to fetch concursos for banca ${banca}`);
  }
  
  return data as Concurso[];
};

// Get user rankings for a concurso
export const fetchUserRankings = async (concursoId: string) => {
  const { data, error } = await supabase
    .from('user_rankings')
    .select(`
      id,
      score,
      user_id,
      users_profiles!inner(name)
    `)
    .eq('concurso_id', concursoId)
    .order('score', { ascending: false });
    
  if (error) {
    console.error('Error fetching user rankings:', error);
    throw new Error('Failed to fetch user rankings');
  }
  
  return data.map((item, index) => ({
    position: index + 1,
    name: item.users_profiles.name,
    score: item.score,
    userId: item.user_id
  }));
};

// Get participant count for a concurso
export const getParticipantCount = async (concursoId: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('count_concurso_participants', { concurso_id: concursoId });
    
  if (error) {
    console.error('Error getting participant count:', error);
    throw new Error('Failed to get participant count');
  }
  
  return data as number;
};

// Schedule scraper to run
export const scheduleScraper = async () => {
  try {
    // This would call an edge function or API endpoint that triggers the scraper
    console.log('Scraper scheduled');
    return true;
  } catch (error) {
    console.error('Error scheduling scraper:', error);
    return false;
  }
};

// Submit user participation
export const submitParticipation = async (
  userId: string,
  concursoId: string,
  basicAnswers: Record<number, string>,
  specificAnswers: Record<number, string>,
  discursiveScore?: number
) => {
  try {
    // First, check if user is already participating
    const { data: existingRanking, error: checkError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    let rankingId = existingRanking?.id;
    
    // If not participating yet, create a new ranking entry
    if (!rankingId) {
      const { data: newRanking, error: rankingError } = await supabase
        .from('user_rankings')
        .insert({
          user_id: userId,
          concurso_id: concursoId,
          score: 0 // Will be calculated later
        })
        .select();
        
      if (rankingError) throw rankingError;
      rankingId = newRanking?.[0]?.id;
    }
    
    if (!rankingId) throw new Error('Failed to create ranking entry');
    
    // Prepare answers for insertion
    const answersToInsert = [
      ...Object.entries(basicAnswers).map(([question, answer]) => ({
        user_ranking_id: rankingId,
        question_number: parseInt(question),
        answer,
        is_basic_knowledge: true
      })),
      ...Object.entries(specificAnswers).map(([question, answer]) => ({
        user_ranking_id: rankingId,
        question_number: parseInt(question),
        answer,
        is_basic_knowledge: false
      }))
    ];
    
    // Delete existing answers
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Insert new answers
    const { error: answersError } = await supabase
      .from('user_answers')
      .insert(answersToInsert);
      
    if (answersError) throw answersError;
    
    return { success: true, rankingId };
  } catch (error) {
    console.error('Error submitting participation:', error);
    throw error;
  }
};
