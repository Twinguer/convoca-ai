import { supabase } from "@/integrations/supabase/client";
import { Concurso, ConcursoFilter } from "@/types/concursos";
import { fetchUserRankings as fetchRankingsFromService } from "./rankingService";

export const fetchConcursoById = async (id: string): Promise<Concurso | null> => {
  try {
    // console.log('[fetchConcursoById] Fetching concurso with ID:', id);
    
    // Nota: Função ensure_ranking_exists não existe mais, removida para simplificar

    // Buscar dados do concurso (estrutura híbrida)
    const { data: rankingData, error: rankingError } = await supabase
      .from("concursos")
      .select("*")
      .eq("id", id)
      .single();

    if (rankingError) {
      console.error('[fetchConcursoById] Ranking error:', rankingError);
      
      // Fallback: buscar do concurso original
      const { data: concursoData, error: concursoError } = await supabase
        .from("concursos")
        .select("*")
        .eq("id", id)
        .single();

      if (concursoError) {
        console.error('[fetchConcursoById] Concurso error:', concursoError);
        
        if (concursoError.code === 'PGRST116') {
          throw new Error(`Concurso com ID ${id} não encontrado`);
        }
        
        throw new Error(`Erro ao buscar concurso: ${concursoError.message}`);
      }

      if (!concursoData) {
        throw new Error(`Concurso com ID ${id} não encontrado`);
      }

      console.log('[fetchConcursoById] Concurso found (fallback):', concursoData);
      return concursoData;
    }

    if (!rankingData) {
      throw new Error(`Ranking com ID ${id} não encontrado`);
    }


    // Buscar disciplinas do JSONB disciplines na tabela concursos
    const disciplines = rankingData?.disciplines || [];

    // Converter ranking para formato de concurso
    // console.log('[fetchConcursoById] Criando concursoData com disciplines:', disciplines);
    // console.log('[fetchConcursoById] rankingData.disciplines original:', rankingData.disciplines);
    // console.log('[fetchConcursoById] ===== DADOS DO CRIADOR =====');
    // console.log('[fetchConcursoById] rankingData.created_by_user_id:', rankingData.created_by_user_id);
    // console.log('[fetchConcursoById] rankingData.is_admin_created:', rankingData.is_admin_created);
    
    const concursoData: Concurso = {
      id: rankingData.id,
      titulo: rankingData.titulo,
      orgao: rankingData.orgao,
      banca: rankingData.banca,
      created_at: rankingData.created_at,
      status: rankingData.status,
      updated_at: rankingData.updated_at,
      link: rankingData.descricao,
      inscritos: rankingData.inscritos || rankingData.total_participants,
      vagas: rankingData.vagas,
      knowledgeAreas: null,
      localidades: rankingData.localidades || [],
      custom_banca: null,
      is_admin_created: rankingData.is_admin_created,
      created_by_user_id: rankingData.created_by_user_id,
      has_custom_knowledge: true,
      exam_type: rankingData.exam_type,
      alternatives_count: 5,
      predefined_job_title: null,
      custom_job_title: null,
      // Estrutura JSONB para cotas
      has_cota: rankingData.has_cota || {
        ppp: false,
        pcd: false,
        ind: false,
        hip: false,
        tra: false,
        min_cota: 0
      },
      is_admin_update: false,
      disciplines: disciplines, // Usar disciplinas já convertidas
      has_basic_knowledge: false,
      has_specific_knowledge_1: false,
      has_specific_knowledge_2: false,
      has_specific_knowledge_3: false,
      // Estrutura JSONB para disciplinas subjetivas
      subjects: rankingData.subjects || {
        discr: false,
        case1: false,
        case2: false,
        case3: false,
        other: false,
        name_other: null,
        discr_min_score: 0,
        case1_min_score: 0,
        case2_min_score: 0,
        case3_min_score: 0,
        other_min_score: 0
      },
      // Manter campos individuais para compatibilidade
      has_discursive: rankingData.subjects?.discr || false,
      has_case_study_1: rankingData.subjects?.case1 || false,
      has_case_study_2: rankingData.subjects?.case2 || false,
      has_case_study_3: rankingData.subjects?.case3 || false,
      has_other_subjective: rankingData.subjects?.other || false,
      other_subjective_name: rankingData.subjects?.name_other || null,
      // Notas mínimas para questões subjetivas
      discursive_minimum_score: rankingData.subjects?.discr_min_score || 0,
      case_study_1_minimum_score: rankingData.subjects?.case1_min_score || 0,
      case_study_2_minimum_score: rankingData.subjects?.case2_min_score || 0,
      case_study_3_minimum_score: rankingData.subjects?.case3_min_score || 0,
      other_subjective_minimum_score: rankingData.subjects?.other_min_score || 0,
      basic_knowledge_questions: 0,
      specific_knowledge_1_questions: 0,
      specific_knowledge_2_questions: 0,
      specific_knowledge_3_questions: 0,
      basic_knowledge_weight: 0,
      specific_knowledge_1_weight: 0,
      specific_knowledge_2_weight: 0,
      specific_knowledge_3_weight: 0,
      custom_knowledge_questions: 0,
      custom_knowledge_weight: 0,
      has_minimum_score: rankingData.has_minimum_score,
      minimum_score_unit_type: null,
      total_minimum_score: rankingData.total_minimum_score,
      // has_quota_minimum_score: removida - dados agora em JSONB
      // quota_minimum_score: removida - dados agora em JSONB
      // quota_minimum_score_unit_type: removida - dados agora em JSONB
    };

    // console.log('[fetchConcursoById] Ranking converted to concurso:', concursoData);
    // console.log('[fetchConcursoById] FINAL disciplines being returned:', concursoData.disciplines);
    // console.log('[fetchConcursoById] FINAL has_custom_knowledge:', concursoData.has_custom_knowledge);
    // console.log('[fetchConcursoById] FINAL has_basic_knowledge:', concursoData.has_basic_knowledge);
    // console.log('[fetchConcursoById] ===== DADOS FINAIS DO CRIADOR =====');
    // console.log('[fetchConcursoById] FINAL created_by_user_id:', concursoData.created_by_user_id);
    // console.log('[fetchConcursoById] FINAL is_admin_created:', concursoData.is_admin_created);
    return concursoData;
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
    query = query.order('created_at', { ascending: false });
    
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
          status,
          created_at,
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
        status?: string;
        created_at?: string;
        status?: string;
      } || {};
      
      return {
        id: item.concurso_id,
        rankingId: item.id,
        score: item.score,
        titulo: concurso.titulo || '',
        orgao: concurso.orgao || '',
        banca: concurso.banca || '',
          status: concurso.status || '',
          created_at: concurso.created_at || ''
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
