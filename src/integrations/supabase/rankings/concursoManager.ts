
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
    
    // Add debug logs to see the quota values and exam structure being sent
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
    
    console.log('Weight values being sent to database:');
    console.log('basic_knowledge_weight:', rankingData.basic_knowledge_weight);
    console.log('specific_knowledge_1_weight:', rankingData.specific_knowledge_1_weight);
    console.log('specific_knowledge_2_weight:', rankingData.specific_knowledge_2_weight);
    console.log('specific_knowledge_3_weight:', rankingData.specific_knowledge_3_weight);
    console.log('discursive_weight:', rankingData.discursive_weight);
    console.log('case_study_1_weight:', rankingData.case_study_1_weight);
    console.log('case_study_2_weight:', rankingData.case_study_2_weight);
    console.log('case_study_3_weight:', rankingData.case_study_3_weight);
    
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
    
    // Try to add the optional weight fields only if they exist in the database
    // This prevents errors with columns that might not exist
    if (rankingData.specific_knowledge_1_weight) {
      try {
        // Check if field exists in database by doing a small query
        const { data: checkField } = await supabase
          .from('concursos')
          .select('specific_knowledge_1_weight')
          .limit(1);
          
        if (checkField !== null) {
          sanitizedData['specific_knowledge_1_weight'] = rankingData.specific_knowledge_1_weight;
        }
      } catch (error) {
        console.warn('Field specific_knowledge_1_weight may not exist in database, skipping');
      }
    }
    
    // Check and add other weight fields if they exist
    const optionalWeightFields = [
      'specific_knowledge_2_weight',
      'specific_knowledge_3_weight',
      'discursive_weight',
      'case_study_1_weight',
      'case_study_2_weight',
      'case_study_3_weight'
    ];
    
    for (const field of optionalWeightFields) {
      if (rankingData[field]) {
        try {
          const { data: checkField } = await supabase
            .from('concursos')
            .select(field)
            .limit(1);
            
          if (checkField !== null) {
            sanitizedData[field] = rankingData[field];
          }
        } catch (error) {
          console.warn(`Field ${field} may not exist in database, skipping`);
        }
      }
    }
    
    console.log('Sanitized data being sent to database:', sanitizedData);
    
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
