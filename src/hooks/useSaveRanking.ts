
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SaveRankingProps {
  formValues: any;
  userId: string | undefined;
  editId?: string | null;
  jobTitles?: any[];
}

export const useSaveRanking = () => {
  const [isLoading, setIsLoading] = useState(false);

  const saveRanking = async ({ formValues, userId, editId, jobTitles }: SaveRankingProps) => {
    setIsLoading(true);
    
    try {
      // Basic validation
      if (!formValues.titulo || !formValues.orgao || !formValues.banca) {
        toast.error("Preencha todos os campos obrigatórios");
        setIsLoading(false);
        return { error: "Dados incompletos" };
      }
      
      // Check if a ranking with the same title and organization already exists
      if (!editId) {
        const { data: existingConcurso, error: existingError } = await supabase
          .from('concursos')
          .select('id, titulo, orgao')
          .eq('titulo', formValues.titulo)
          .eq('orgao', formValues.orgao)
          .single();
          
        if (!existingError && existingConcurso) {
          toast.error(`Já existe um ranking para ${formValues.titulo} - ${formValues.orgao}`);
          setIsLoading(false);
          return { duplicated: true };
        }
      }
      
      // Adjust job title
      let finalTitle = formValues.titulo;
      if (formValues.predefined_job_title === 'OUTRO' && formValues.custom_job_title) {
        finalTitle = formValues.custom_job_title.toUpperCase();
      } else if (formValues.predefined_job_title && formValues.predefined_job_title !== 'OUTRO') {
        finalTitle = formValues.predefined_job_title;
      }
      
      // Adjust exam board
      let finalBanca = formValues.banca;
      if (formValues.banca === 'OUTRO' && formValues.custom_banca) {
        finalBanca = 'OUTRO';
      }
      
      // Process subjects
      let processedSubjects = formValues.subjects;
      if (typeof formValues.subjects === 'string') {
        try {
          processedSubjects = JSON.parse(formValues.subjects);
        } catch (error) {
          console.error("Error processing subjects:", error);
          processedSubjects = [];
        }
      }
      
      // Make sure processedSubjects is an array
      if (!Array.isArray(processedSubjects)) {
        processedSubjects = [];
      }
      
      // Additional validation for knowledge or subject structure
      if (formValues.minimum_score_type === 'knowledge') {
        // At least one knowledge section must be enabled and have questions
        const hasValidKnowledgeSection = 
          (formValues.has_basic_knowledge && formValues.basic_knowledge_questions > 0) || 
          (formValues.has_specific_knowledge_1 && formValues.specific_knowledge_1_questions > 0) || 
          (formValues.has_specific_knowledge_2 && formValues.specific_knowledge_2_questions > 0) || 
          (formValues.has_specific_knowledge_3 && formValues.specific_knowledge_3_questions > 0);
          
        if (!hasValidKnowledgeSection) {
          toast.error("Pelo menos uma seção de conhecimento deve estar habilitada e ter um número de questões maior que zero");
          setIsLoading(false);
          return { error: "Configuração de conhecimentos inválida" };
        }
      } else if (formValues.minimum_score_type === 'subject') {
        // For subject-based structure
        if (processedSubjects.length === 0) {
          toast.error("Pelo menos uma disciplina deve ser adicionada quando o modo por disciplina é selecionado");
          setIsLoading(false);
          return { error: "Disciplinas não configuradas" };
        }
        
        // Check if each subject has questions
        const hasInvalidSubject = processedSubjects.some((subject: any) => 
          !subject.questions || subject.questions <= 0
        );
        
        if (hasInvalidSubject) {
          toast.error("Todas as disciplinas devem ter pelo menos uma questão");
          setIsLoading(false);
          return { error: "Configuração de disciplinas inválida" };
        }
      }
      
      // Data for insertion
      const concursoData = {
        titulo: finalTitle,
        orgao: formValues.orgao,
        banca: finalBanca,
        custom_banca: formValues.banca === 'OUTRO' ? formValues.custom_banca : null,
        data_publicacao: formValues.data_publicacao,
        etapa_atual: formValues.etapa_atual,
        status: formValues.status,
        link: formValues.link,
        vagas: formValues.vagas,
        inscritos: formValues.inscritos,
        created_by_user_id: userId,
        localidades: formValues.localidades,
        
        // Exam configuration
        exam_type: formValues.exam_type,
        alternatives_count: formValues.alternatives_count,
        wrong_answer_penalty: formValues.wrong_answer_penalty,
        
        // Knowledge structure
        has_basic_knowledge: formValues.has_basic_knowledge,
        basic_knowledge_questions: formValues.basic_knowledge_questions,
        basic_knowledge_weight: formValues.basic_knowledge_weight,
        basic_knowledge_minimum_score: formValues.basic_knowledge_minimum_score,
        
        has_specific_knowledge_1: formValues.has_specific_knowledge_1,
        specific_knowledge_1_questions: formValues.specific_knowledge_1_questions,
        specific_knowledge_1_weight: formValues.specific_knowledge_1_weight,
        specific_knowledge_1_minimum_score: formValues.specific_knowledge_1_minimum_score,
        
        has_specific_knowledge_2: formValues.has_specific_knowledge_2,
        specific_knowledge_2_questions: formValues.specific_knowledge_2_questions,
        specific_knowledge_2_weight: formValues.specific_knowledge_2_weight,
        specific_knowledge_2_minimum_score: formValues.specific_knowledge_2_minimum_score,
        
        has_specific_knowledge_3: formValues.has_specific_knowledge_3,
        specific_knowledge_3_questions: formValues.specific_knowledge_3_questions,
        specific_knowledge_3_weight: formValues.specific_knowledge_3_weight,
        specific_knowledge_3_minimum_score: formValues.specific_knowledge_3_minimum_score,
        
        has_discursive: formValues.has_discursive,
        discursive_weight: formValues.discursive_weight,
        discursive_minimum_score: formValues.discursive_minimum_score,
        
        has_case_study_1: formValues.has_case_study_1,
        case_study_1_weight: formValues.case_study_1_weight,
        case_study_1_minimum_score: formValues.case_study_1_minimum_score,
        
        has_case_study_2: formValues.has_case_study_2,
        case_study_2_weight: formValues.case_study_2_weight,
        case_study_2_minimum_score: formValues.case_study_2_minimum_score,
        
        has_case_study_3: formValues.has_case_study_3,
        case_study_3_weight: formValues.case_study_3_weight,
        case_study_3_minimum_score: formValues.case_study_3_minimum_score,
        
        // Minimum score configuration
        has_minimum_score: formValues.has_minimum_score,
        minimum_score_unit_type: formValues.minimum_score_unit_type,
        minimum_score_type: formValues.minimum_score_type,
        total_minimum_score: formValues.total_minimum_score,
        
        // Quota minimum score configuration
        has_quota_minimum_score: formValues.has_quota_minimum_score,
        quota_minimum_score: formValues.quota_minimum_score,
        quota_minimum_score_unit_type: formValues.quota_minimum_score_unit_type,
        
        // Subjects
        subjects: processedSubjects,
        
        // Reservation quota configuration
        has_ampla_concorrencia: formValues.has_ampla_concorrencia,
        has_ppp: formValues.has_ppp,
        has_pcd: formValues.has_pcd,
        has_hipossuficientes: formValues.has_hipossuficientes,
        has_indigenas: formValues.has_indigenas,
        has_transsexuais: formValues.has_transsexuais,
        
        // Admin flags
        is_admin_created: formValues.is_admin_created,
        is_admin_update: formValues.is_admin_update
      };
      
      let result;
      
      if (editId) {
        // Update existing ranking
        const { data, error } = await supabase
          .from('concursos')
          .update(concursoData)
          .eq('id', editId)
          .select()
          .single();
          
        if (error) {
          console.error("Error updating ranking:", error);
          toast.error("Error updating ranking: " + error.message);
          setIsLoading(false);
          return { error: error.message };
        }
        
        result = { id: editId, data };
        toast.success("Ranking updated successfully!");
      } else {
        // Create new ranking
        const { data, error } = await supabase
          .from('concursos')
          .insert(concursoData)
          .select()
          .single();
          
        if (error) {
          console.error("Error creating ranking:", error);
          toast.error("Error creating ranking: " + error.message);
          setIsLoading(false);
          return { error: error.message };
        }
        
        result = { id: data.id, data };
        toast.success("Ranking created successfully!");
      }
      
      setIsLoading(false);
      return result;
    } catch (error) {
      console.error("Error saving ranking:", error);
      toast.error("Error saving ranking: " + (error as Error).message);
      setIsLoading(false);
      return { error: (error as Error).message };
    }
  };

  return { saveRanking, isLoading };
};
