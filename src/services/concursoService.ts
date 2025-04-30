
import { supabase } from "@/integrations/supabase/client";
import { Concurso, ConcursoFilter } from "@/types/concursos";
import { fetchUserRankings as fetchRankingsFromService } from "./rankingService";

export const fetchConcursoById = async (id: string): Promise<Concurso | null> => {
  const { data, error } = await supabase
    .from("concursos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching concurso:", error);
    throw error;
  }

  return data;
};

export const fetchConcursos = async (filters?: ConcursoFilter): Promise<Concurso[]> => {
  try {
    let query = supabase
      .from("concursos")
      .select("*");
    
    // Add filters if provided
    if (filters) {
      // Filter by status if provided
      if (filters.status && filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }
      
      // Filter by orgao if provided
      if (filters.orgao && filters.orgao !== 'Todos') {
        query = query.eq('orgao', filters.orgao);
      }
      
      // Filter by banca if provided
      if (filters.banca && filters.banca !== 'Todos') {
        query = query.eq('banca', filters.banca);
      }
    }
    
    // Order by most recent first
    query = query.order('data_publicacao', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching concursos:', error);
    return [];
  }
};

export const getParticipantCount = async (concursoId: string): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('count_concurso_participants', {
      concurso_id: concursoId
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error('Error fetching participant count:', error);
    return 0;
  }
};

export const fetchUserConcursoRankings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        score,
        concurso_id,
        concursos (
          id,
          titulo,
          orgao,
          banca,
          etapa_atual,
          data_publicacao,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Correto: Mapeia cada item individualmente e acessa as propriedades aninhadas
    return data?.map(item => ({
      id: item.concurso_id,
      rankingId: item.id,
      score: item.score,
      titulo: item.concursos?.titulo,
      orgao: item.concursos?.orgao,
      banca: item.concursos?.banca,
      etapa_atual: item.concursos?.etapa_atual,
      data_publicacao: item.concursos?.data_publicacao,
      status: item.concursos?.status
    })) || [];
  } catch (error) {
    console.error('Error fetching user concurso rankings:', error);
    return [];
  }
};

// This function can reuse the fetchUserConcursoRankings
export const fetchUserRankings = async (userId: string) => {
  return fetchUserConcursoRankings(userId);
};

// Add the scheduleScraper function that's being imported in main.tsx
export const scheduleScraper = async () => {
  try {
    // Call the edge function to scrape concursos data
    const { data, error } = await supabase.functions.invoke('scrape-cebraspe', {
      method: 'POST',
      body: {}
    });
    
    if (error) {
      console.error('Error scheduling scraper:', error);
      throw error;
    }
    
    console.log('Scraper scheduled successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to schedule scraper:', error);
    return { success: false, message: 'Failed to schedule scraper' };
  }
};

// More functions can be added here as needed...
