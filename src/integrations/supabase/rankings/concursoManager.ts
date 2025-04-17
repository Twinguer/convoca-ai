
import { supabase } from '../client';

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
    
    // Check for duplicate rankings
    const { data: existingRankings, error: checkError } = await supabase
      .from('concursos')
      .select('id')
      .eq('titulo', rankingData.titulo)
      .eq('orgao', rankingData.orgao)
      .eq('banca', rankingData.banca);
      
    if (checkError) {
      console.error('Error checking for duplicate rankings:', checkError);
      throw new Error('Erro ao verificar rankings duplicados');
    }
    
    if (existingRankings && existingRankings.length > 0) {
      throw new Error('Já existe um ranking com o mesmo título, órgão e banca');
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
    
    // Only the creator or an admin can delete the ranking
    const isCreator = rankingCheck.created_by_user_id === userId;
    
    if (!isAdmin && !isCreator) {
      throw new Error('Você não tem permissão para excluir este ranking');
    }
    
    // Check if there are more than 10 participants (only if not admin)
    if (!isAdmin) {
      const { data: participantCount, error: countError } = await supabase
        .rpc('count_concurso_participants', { concurso_id: rankingId });
        
      if (countError) {
        throw new Error('Erro ao verificar número de participantes');
      }
      
      if (participantCount > 10) {
        throw new Error('Rankings com mais de 10 participantes só podem ser excluídos pelo administrador');
      }
    }
    
    // Delete the ranking
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
