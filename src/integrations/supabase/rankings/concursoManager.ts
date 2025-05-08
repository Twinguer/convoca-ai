
import { supabase } from '../client';
import { recalculateAllUserScores } from './userAnswers';

// Function to schedule scraper for concursos
export const scheduleScraper = async (): Promise<void> => {
  try {
    console.log('Scheduling scraper for concursos...');
    // This would typically make an API call to schedule scraping
    // For now, we'll just log that it was called
  } catch (error) {
    console.error('Error scheduling scraper:', error);
  }
};

// Function to create a new ranking
export const createRanking = async (rankingData: any) => {
  try {
    console.log('Creating new ranking with data:', rankingData);
    
    // First, check if all required fields are present
    const requiredFields = ['titulo', 'orgao', 'banca'];
    for (const field of requiredFields) {
      if (!rankingData[field]) {
        throw new Error(`Campo obrigatório faltando: ${field}`);
      }
    }
    
    // Create a sanitized data object with only the fields that exist in the database
    const sanitizedData = {
      titulo: rankingData.titulo,
      orgao: rankingData.orgao,
      banca: rankingData.banca,
      data_publicacao: rankingData.data_publicacao,
      vagas: rankingData.vagas,
      inscritos: rankingData.inscritos,
      etapa_atual: rankingData.etapa_atual,
      status: rankingData.status,
      exam_type: rankingData.exam_type,
      alternatives_count: rankingData.alternatives_count,
      wrong_answer_penalty: rankingData.wrong_answer_penalty,
      link: rankingData.link,
      
      // Add user ID if provided
      created_by_user_id: rankingData.created_by_user_id,
      is_admin_created: rankingData.is_admin_created || false,
      is_admin_update: rankingData.is_admin_update || false,
      
      // Add custom fields
      custom_banca: rankingData.custom_banca,
      predefined_job_title: rankingData.predefined_job_title,
      custom_job_title: rankingData.custom_job_title,
      
      // Add exam structure fields - ensuring boolean values
      has_basic_knowledge: rankingData.has_basic_knowledge === true,
      has_specific_knowledge_1: rankingData.has_specific_knowledge_1 === true,
      has_specific_knowledge_2: rankingData.has_specific_knowledge_2 === true,
      has_specific_knowledge_3: rankingData.has_specific_knowledge_3 === true,
      has_discursive: rankingData.has_discursive === true,
      has_case_study_1: rankingData.has_case_study_1 === true,
      has_case_study_2: rankingData.has_case_study_2 === true,
      has_case_study_3: rankingData.has_case_study_3 === true,
      
      // Novas áreas de conhecimento - campos boolean
      has_lpt: rankingData.has_lpt === true,
      has_ing: rankingData.has_ing === true,
      has_mat: rankingData.has_mat === true,
      has_rlm: rankingData.has_rlm === true,
      has_est: rankingData.has_est === true,
      has_cos: rankingData.has_cos === true,
      has_adm: rankingData.has_adm === true,
      has_ado: rankingData.has_ado === true,
      has_cot: rankingData.has_cot === true,
      has_coc: rankingData.has_coc === true,
      has_eco: rankingData.has_eco === true,
      has_tri: rankingData.has_tri === true,
      has_afo: rankingData.has_afo === true,
      has_ltc: rankingData.has_ltc === true,
      has_tic: rankingData.has_tic === true,
      has_ett: rankingData.has_ett === true,
      has_aud: rankingData.has_aud === true,
      has_civ: rankingData.has_civ === true,
      has_pen: rankingData.has_pen === true,
      has_inf: rankingData.has_inf === true,
      has_emp: rankingData.has_emp === true,
      has_mtf: rankingData.has_mtf === true,
      has_out: rankingData.has_out === true,
      out_name: rankingData.out_name,
      
      // Add question counts
      basic_knowledge_questions: rankingData.basic_knowledge_questions,
      specific_knowledge_1_questions: rankingData.specific_knowledge_1_questions,
      specific_knowledge_2_questions: rankingData.specific_knowledge_2_questions,
      specific_knowledge_3_questions: rankingData.specific_knowledge_3_questions,
      
      // Quantidade de questões para novas áreas
      lpt_questions: rankingData.lpt_questions,
      ing_questions: rankingData.ing_questions,
      mat_questions: rankingData.mat_questions,
      rlm_questions: rankingData.rlm_questions,
      est_questions: rankingData.est_questions,
      cos_questions: rankingData.cos_questions,
      adm_questions: rankingData.adm_questions,
      ado_questions: rankingData.ado_questions,
      cot_questions: rankingData.cot_questions,
      coc_questions: rankingData.coc_questions,
      eco_questions: rankingData.eco_questions,
      tri_questions: rankingData.tri_questions,
      afo_questions: rankingData.afo_questions,
      ltc_questions: rankingData.ltc_questions,
      tic_questions: rankingData.tic_questions,
      ett_questions: rankingData.ett_questions,
      aud_questions: rankingData.aud_questions,
      civ_questions: rankingData.civ_questions,
      pen_questions: rankingData.pen_questions,
      inf_questions: rankingData.inf_questions,
      emp_questions: rankingData.emp_questions,
      mtf_questions: rankingData.mtf_questions,
      out_questions: rankingData.out_questions,
      
      // Add weight fields
      basic_knowledge_weight: rankingData.basic_knowledge_weight,
      specific_knowledge_weight: rankingData.specific_knowledge_weight || rankingData.specific_knowledge_1_weight, // For backward compatibility
      
      // Pesos para novas áreas
      lpt_weight: rankingData.lpt_weight,
      ing_weight: rankingData.ing_weight,
      mat_weight: rankingData.mat_weight,
      rlm_weight: rankingData.rlm_weight,
      est_weight: rankingData.est_weight,
      cos_weight: rankingData.cos_weight,
      adm_weight: rankingData.adm_weight,
      ado_weight: rankingData.ado_weight,
      cot_weight: rankingData.cot_weight,
      coc_weight: rankingData.coc_weight,
      eco_weight: rankingData.eco_weight,
      tri_weight: rankingData.tri_weight,
      afo_weight: rankingData.afo_weight,
      ltc_weight: rankingData.ltc_weight,
      tic_weight: rankingData.tic_weight,
      ett_weight: rankingData.ett_weight,
      aud_weight: rankingData.aud_weight,
      civ_weight: rankingData.civ_weight,
      pen_weight: rankingData.pen_weight,
      inf_weight: rankingData.inf_weight,
      emp_weight: rankingData.emp_weight,
      mtf_weight: rankingData.mtf_weight,
      out_weight: rankingData.out_weight,
      
      // Add reservation quota fields - ensuring boolean values
      has_ampla_concorrencia: rankingData.has_ampla_concorrencia === true,
      has_ppp: rankingData.has_ppp === true,
      has_pcd: rankingData.has_pcd === true,
      has_hipossuficientes: rankingData.has_hipossuficientes === true,
      has_indigenas: rankingData.has_indigenas === true,
      has_transsexuais: rankingData.has_transsexuais === true,
      
      // Localidades
      localidades: rankingData.localidades
    };
    
    // Add additional weight fields if they exist
    const weightFields = [
      'specific_knowledge_1_weight',
      'specific_knowledge_2_weight',
      'specific_knowledge_3_weight',
      'discursive_weight',
      'case_study_1_weight',
      'case_study_2_weight',
      'case_study_3_weight'
    ];
    
    for (const field of weightFields) {
      if (rankingData[field]) {
        sanitizedData[field] = rankingData[field];
      }
    }
    
    // Insert sanitized data into concursos table
    const { data, error } = await supabase
      .from('concursos')
      .insert(sanitizedData)
      .select();
      
    if (error) {
      console.error('Database error creating ranking:', error);
      throw error;
    }
    
    console.log('Ranking created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating ranking:', error);
    throw error;
  }
};

// Function to update an existing ranking
export const updateRanking = async (rankingId: string, rankingData: any, userId: string) => {
  try {
    // Check if the user has permission to update this ranking
    const { data: rankingCheck, error: checkError } = await supabase
      .from('concursos')
      .select('created_by_user_id, is_admin_created')
      .eq('id', rankingId)
      .single();
      
    if (checkError) {
      throw new Error('Ranking não encontrado');
    }
    
    // Only the creator or an admin can update the ranking
    const isAdmin = rankingData.is_admin_update === true;
    const isCreator = rankingCheck.created_by_user_id === userId;
    
    if (!isAdmin && !isCreator) {
      throw new Error('Você não tem permissão para editar este ranking');
    }
    
    // Store old values for comparison
    const { data: oldData, error: oldDataError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions,
        basic_knowledge_weight,
        specific_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight,
        has_basic_knowledge,
        has_specific_knowledge_1,
        has_specific_knowledge_2,
        has_specific_knowledge_3,
        has_discursive,
        has_case_study_1,
        has_case_study_2,
        has_case_study_3,
        
        has_lpt, lpt_questions, lpt_weight,
        has_ing, ing_questions, ing_weight,
        has_mat, mat_questions, mat_weight,
        has_rlm, rlm_questions, rlm_weight,
        has_est, est_questions, est_weight,
        has_cos, cos_questions, cos_weight,
        has_adm, adm_questions, adm_weight,
        has_ado, ado_questions, ado_weight,
        has_cot, cot_questions, cot_weight,
        has_coc, coc_questions, coc_weight,
        has_eco, eco_questions, eco_weight,
        has_tri, tri_questions, tri_weight,
        has_afo, afo_questions, afo_weight,
        has_ltc, ltc_questions, ltc_weight,
        has_tic, tic_questions, tic_weight,
        has_ett, ett_questions, ett_weight,
        has_aud, aud_questions, aud_weight,
        has_civ, civ_questions, civ_weight,
        has_pen, pen_questions, pen_weight,
        has_inf, inf_questions, inf_weight,
        has_emp, emp_questions, emp_weight,
        has_mtf, mtf_questions, mtf_weight,
        has_out, out_questions, out_weight,
        out_name
      `)
      .eq('id', rankingId)
      .single();
    
    if (oldDataError) {
      console.error('Error fetching old ranking data:', oldDataError);
    }
    
    // Update the ranking
    const { data, error } = await supabase
      .from('concursos')
      .update(rankingData)
      .eq('id', rankingId)
      .select();
      
    if (error) {
      console.error('Database error updating ranking:', error);
      throw error;
    }
    
    // Check if any exam structure or weights have changed
    let structureChanged = false;
    if (oldData) {
      // Lista completa de campos de estrutura, incluindo novas áreas
      const structureFields = [
        'basic_knowledge_questions',
        'specific_knowledge_1_questions',
        'specific_knowledge_2_questions',
        'specific_knowledge_3_questions',
        'basic_knowledge_weight',
        'specific_knowledge_weight',
        'specific_knowledge_1_weight',
        'specific_knowledge_2_weight',
        'specific_knowledge_3_weight',
        'discursive_weight',
        'case_study_1_weight',
        'case_study_2_weight',
        'case_study_3_weight',
        'has_basic_knowledge',
        'has_specific_knowledge_1',
        'has_specific_knowledge_2',
        'has_specific_knowledge_3',
        'has_discursive',
        'has_case_study_1',
        'has_case_study_2',
        'has_case_study_3',
        
        // Novas áreas de conhecimento
        'has_lpt', 'lpt_questions', 'lpt_weight',
        'has_ing', 'ing_questions', 'ing_weight',
        'has_mat', 'mat_questions', 'mat_weight',
        'has_rlm', 'rlm_questions', 'rlm_weight',
        'has_est', 'est_questions', 'est_weight',
        'has_cos', 'cos_questions', 'cos_weight',
        'has_adm', 'adm_questions', 'adm_weight',
        'has_ado', 'ado_questions', 'ado_weight',
        'has_cot', 'cot_questions', 'cot_weight',
        'has_coc', 'coc_questions', 'coc_weight',
        'has_eco', 'eco_questions', 'eco_weight',
        'has_tri', 'tri_questions', 'tri_weight',
        'has_afo', 'afo_questions', 'afo_weight',
        'has_ltc', 'ltc_questions', 'ltc_weight',
        'has_tic', 'tic_questions', 'tic_weight',
        'has_ett', 'ett_questions', 'ett_weight',
        'has_aud', 'aud_questions', 'aud_weight',
        'has_civ', 'civ_questions', 'civ_weight',
        'has_pen', 'pen_questions', 'pen_weight',
        'has_inf', 'inf_questions', 'inf_weight',
        'has_emp', 'emp_questions', 'emp_weight',
        'has_mtf', 'mtf_questions', 'mtf_weight',
        'has_out', 'out_questions', 'out_weight',
        'out_name'
      ];
      
      for (const field of structureFields) {
        if (rankingData[field] !== undefined && rankingData[field] !== oldData[field]) {
          structureChanged = true;
          console.log(`Field ${field} changed from ${oldData[field]} to ${rankingData[field]}`);
          break;
        }
      }
    }
    
    // If structure changed, recalculate all scores
    if (structureChanged) {
      try {
        console.log('Exam structure changed, recalculating all scores');
        await recalculateAllUserScores(rankingId);
      } catch (recalcError) {
        console.error('Error recalculating scores after structure change:', recalcError);
        // Don't throw error here, as the update was successful
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error updating ranking:', error);
    throw error;
  }
};

// Function to delete a ranking
export const deleteRanking = async (rankingId: string, userId: string, isAdmin: boolean = false) => {
  try {
    // Check if the ranking exists
    const { data: rankingCheck, error: checkError } = await supabase
      .from('concursos')
      .select('created_by_user_id, is_admin_created')
      .eq('id', rankingId)
      .single();
      
    if (checkError) {
      throw new Error('Ranking não encontrado');
    }
    
    // Allow admins to delete any ranking, or users to delete their own
    const isCreator = rankingCheck.created_by_user_id === userId;
    
    // For admin check, if isAdmin is explicitly set to true, bypass the user check
    if (!isAdmin && !isCreator) {
      throw new Error('Você não tem permissão para excluir este ranking');
    }
    
    // 1. First, get all user_rankings ids for this concurso
    const { data: userRankings, error: userRankingsError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('concurso_id', rankingId);
      
    if (userRankingsError) {
      console.error('Error fetching user_rankings ids:', userRankingsError);
    }
    
    const userRankingIds = userRankings?.map(ur => ur.id) || [];
    
    // 2. Delete score_calculation_logs for each user_ranking
    if (userRankingIds.length > 0) {
      for (const userRankingId of userRankingIds) {
        const { error: scoreLogsError } = await supabase
          .from('score_calculation_logs')
          .delete()
          .eq('user_ranking_id', userRankingId);
          
        if (scoreLogsError) {
          console.error(`Error deleting score_calculation_logs for user_ranking ${userRankingId}:`, scoreLogsError);
        }
      }
    }
    
    // 3. Delete all user_answers
    for (const userRankingId of userRankingIds) {
      const { error: answersError } = await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', userRankingId);
        
      if (answersError) {
        console.error(`Error deleting user answers for user_ranking ${userRankingId}:`, answersError);
      }
    }
    
    // 4. Delete all user_rankings for this concurso
    const { error: rankingsError } = await supabase
      .from('user_rankings')
      .delete()
      .eq('concurso_id', rankingId);
      
    if (rankingsError) {
      console.error('Error deleting user rankings:', rankingsError);
      throw rankingsError;
    }
    
    const { error } = await supabase.from('concursos').delete().eq('id', rankingId);
      
    if (error) {
      console.error('Database error deleting ranking:', error);
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting ranking:', error);
    throw error;
  }
};
