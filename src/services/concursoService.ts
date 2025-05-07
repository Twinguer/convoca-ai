
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
        if (Array.isArray(filters.status) && filters.status.length > 0) {
          query = query.eq('status', filters.status[0]);
        } else if (typeof filters.status === 'string') {
          query = query.eq('status', filters.status);
        }
      }
      
      // Filter by orgao if provided
      if (filters.orgao && Array.isArray(filters.orgao) && filters.orgao.length > 0) {
        query = query.eq('orgao', filters.orgao[0]);
      }
      
      // Filter by banca if provided
      if (filters.banca && Array.isArray(filters.banca) && filters.banca.length > 0) {
        query = query.eq('banca', filters.banca[0]);
      }

      // Filter by search term if provided
      if (filters.searchTerm) {
        query = query.ilike('titulo', `%${filters.searchTerm}%`);
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

    // Map each item individually and access the nested properties correctly
    return data?.map(item => {
      // Safely access the nested concursos object with type assertion
      const concurso = item.concursos as {
        id?: string;
        titulo?: string; 
        orgao?: string;
        banca?: string;
        etapa_atual?: string;
        data_publicacao?: string;
        status?: string;
      } || {};
      
      return {
        id: item.concurso_id,
        rankingId: item.id,
        score: item.score,
        titulo: concurso.titulo || '',
        orgao: concurso.orgao || '',
        banca: concurso.banca || '',
        etapa_atual: concurso.etapa_atual || '',
        data_publicacao: concurso.data_publicacao || '',
        status: concurso.status || ''
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching user concurso rankings:', error);
    return [];
  }
};

// This function can reuse the fetchUserConcursoRankings
export const fetchUserRankings = async (userId: string) => {
  return fetchUserConcursoRankings(userId);
};

// Implementação da função deleteConcurso
export const deleteConcurso = async (id: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase
      .from("concursos")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting concurso:", error);
    return { 
      success: false, 
      message: error.message || "Erro ao excluir o concurso" 
    };
  }
};

// Modified scheduleScraper to work without the edge function
export const scheduleScraper = async () => {
  try {
    console.log('Scraper functionality has been deprecated');
    // Return mock success response since the function has been removed
    return { success: true, message: 'Scraper functionality deprecated but system continues to work' };
  } catch (error) {
    console.error('Error in scraper service:', error);
    return { success: false, message: 'Error in scraper service' };
  }
};
