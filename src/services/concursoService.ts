
import { supabase } from "@/integrations/supabase/client";
import { Concurso } from "@/types/concursos";
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

    return data?.map(item => ({
      id: item.concurso_id,
      rankingId: item.id,
      score: item.score,
      titulo: item.concursos.titulo,
      orgao: item.concursos.orgao,
      banca: item.concursos.banca,
      etapa_atual: item.concursos.etapa_atual,
      data_publicacao: item.concursos.data_publicacao,
      status: item.concursos.status
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

// More functions can be added here as needed...
