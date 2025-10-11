import { supabase } from "@/integrations/supabase/client";
import { Concurso, ConcursoFilter } from "@/types/concursos";
import { fetchUserRankings as fetchRankingsFromService } from "./rankingService";

export const fetchConcursoById = async (id: string): Promise<Concurso | null> => {
  try {
    console.log('[fetchConcursoById] Fetching concurso with ID:', id);
    
    const { data, error } = await supabase
      .from("concursos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error('[fetchConcursoById] Supabase error:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error(`Concurso com ID ${id} não encontrado`);
      }
      
      throw new Error(`Erro ao buscar concurso: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Concurso com ID ${id} não encontrado`);
    }

    console.log('[fetchConcursoById] Concurso found:', data);
    return data;
  } catch (error: any) {
    console.error('[fetchConcursoById] Error:', error);
    throw error;
  }
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

// More functions can be added here as needed...
