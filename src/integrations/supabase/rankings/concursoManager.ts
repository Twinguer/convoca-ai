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
      
      // Add question counts
      basic_knowledge_questions: rankingData.basic_knowledge_questions,
      specific_knowledge_1_questions: rankingData.specific_knowledge_1_questions,
      specific_knowledge_2_questions: rankingData.specific_knowledge_2_questions,
      specific_knowledge_3_questions: rankingData.specific_knowledge_3_questions,
      
      // Add weight fields
      basic_knowledge_weight: rankingData.basic_knowledge_weight,
      specific_knowledge_weight: rankingData.specific_knowledge_weight || rankingData.specific_knowledge_1_weight, // For backward compatibility
      
      // Add reservation quota fields - ensuring boolean values
      has_ampla_concorrencia: rankingData.has_ampla_concorrencia === true,
      has_ppp: rankingData.has_ppp === true,
      has_pcd: rankingData.has_pcd === true,
      has_hipossuficientes: rankingData.has_hipossuficientes === true,
      has_indigenas: rankingData.has_indigenas === true,
      has_transsexuais: rankingData.has_transsexuais === true
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
        has_case_study_3
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
        'has_case_study_3'
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
    
    // 5. Delete answer_keys for this concurso
    const { error: answersKeysError } = await supabase
      .from('answer_keys')
      .delete()
      .eq('concurso_id', rankingId);
      
    if (answersKeysError) {
      console.error('Error deleting answer keys:', answersKeysError);
    }
    
    // 6. Finally delete the ranking itself
    const { error } = await supabase
      .from('concursos')
      .delete()
      .eq('id', rankingId);
      
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

// Function to update answer key and recalculate scores
export const updateAnswerKey = async (concursoId: string, answerKeyData: any) => {
  try {
    // Begin a transaction
    const { error: insertError } = await supabase
      .from('answer_keys')
      .upsert(answerKeyData, { onConflict: 'concurso_id,question_number' });
      
    if (insertError) {
      throw insertError;
    }
    
    // Recalculate scores for all users in this concurso
    await recalculateAllUserScores(concursoId);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating answer key:', error);
    throw error;
  }
};
