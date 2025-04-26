
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
    
    // Add debug logs to see the quota values being sent
    console.log('Quota values being sent to database:');
    console.log('has_ampla_concorrencia:', rankingData.has_ampla_concorrencia);
    console.log('has_ppp:', rankingData.has_ppp);
    console.log('has_pcd:', rankingData.has_pcd);
    console.log('has_hipossuficientes:', rankingData.has_hipossuficientes);
    console.log('has_indigenas:', rankingData.has_indigenas);
    console.log('has_transsexuais:', rankingData.has_transsexuais);
    
    console.log('Exam structure being sent to database:');
    console.log('has_basic_knowledge:', rankingData.has_basic_knowledge);
    console.log('has_specific_knowledge_1:', rankingData.has_specific_knowledge_1);
    console.log('has_specific_knowledge_2:', rankingData.has_specific_knowledge_2);
    console.log('has_specific_knowledge_3:', rankingData.has_specific_knowledge_3);
    console.log('has_discursive:', rankingData.has_discursive);
    console.log('has_case_study_1:', rankingData.has_case_study_1);
    console.log('has_case_study_2:', rankingData.has_case_study_2);
    console.log('has_case_study_3:', rankingData.has_case_study_3);
    
    // Insert directly into concursos table
    const { data, error } = await supabase
      .from('concursos')
      .insert({
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
        
        // Weight fields for all sections
        basic_knowledge_weight: rankingData.basic_knowledge_weight,
        specific_knowledge_1_weight: rankingData.specific_knowledge_1_weight,
        specific_knowledge_2_weight: rankingData.specific_knowledge_2_weight,
        specific_knowledge_3_weight: rankingData.specific_knowledge_3_weight,
        specific_knowledge_weight: rankingData.specific_knowledge_weight || rankingData.specific_knowledge_1_weight,
        discursive_weight: rankingData.discursive_weight,
        case_study_1_weight: rankingData.case_study_1_weight,
        case_study_2_weight: rankingData.case_study_2_weight,
        case_study_3_weight: rankingData.case_study_3_weight,
        
        link: rankingData.link,
        
        // Add exam structure fields
        has_basic_knowledge: rankingData.has_basic_knowledge,
        has_specific_knowledge_1: rankingData.has_specific_knowledge_1,
        has_specific_knowledge_2: rankingData.has_specific_knowledge_2,
        has_specific_knowledge_3: rankingData.has_specific_knowledge_3,
        has_discursive: rankingData.has_discursive,
        has_case_study_1: rankingData.has_case_study_1,
        has_case_study_2: rankingData.has_case_study_2,
        has_case_study_3: rankingData.has_case_study_3,
        basic_knowledge_questions: rankingData.basic_knowledge_questions,
        specific_knowledge_1_questions: rankingData.specific_knowledge_1_questions,
        specific_knowledge_2_questions: rankingData.specific_knowledge_2_questions,
        specific_knowledge_3_questions: rankingData.specific_knowledge_3_questions,
        
        // Add reservation quota fields - ensuring these are properly set
        has_ampla_concorrencia: rankingData.has_ampla_concorrencia === undefined ? true : rankingData.has_ampla_concorrencia,
        has_ppp: rankingData.has_ppp === undefined ? false : rankingData.has_ppp,
        has_pcd: rankingData.has_pcd === undefined ? false : rankingData.has_pcd,
        has_hipossuficientes: rankingData.has_hipossuficientes === undefined ? false : rankingData.has_hipossuficientes,
        has_indigenas: rankingData.has_indigenas === undefined ? false : rankingData.has_indigenas,
        has_transsexuais: rankingData.has_transsexuais === undefined ? false : rankingData.has_transsexuais,
        
        // Add custom fields
        custom_banca: rankingData.custom_banca,
        predefined_job_title: rankingData.predefined_job_title,
        custom_job_title: rankingData.custom_job_title
      })
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
