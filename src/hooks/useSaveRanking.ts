
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveRankingOptions {
  formValues: any;
  userId: string;
  editId?: string | null;
  jobTitles: Array<{ id: string; title: string }>;
}

// Helper to ensure numeric values
const ensureNumeric = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const useSaveRanking = () => {
  const saveRanking = useCallback(async ({ formValues, userId, editId, jobTitles }: SaveRankingOptions) => {
    try {
      // Normalize strings for uniqueness check (handling case and spaces)
      const normalize = (str: string) => (str || "").replace(/\s+/g, " ").trim().toUpperCase();

      // Truncate long titles for better display
      let title = formValues.custom_job_title || formValues.predefined_job_title;
      if (title && title.length > 30) {
        title = title.substring(0, 30) + '...';
      }
      
      // Truncate long orgão for better display
      let orgao = formValues.orgao;
      if (orgao && orgao.length > 30) {
        orgao = orgao.substring(0, 30) + '...';
      }

      // Explicitly convert numeric fields to ensure proper types
      formValues.basic_knowledge_questions = ensureNumeric(formValues.basic_knowledge_questions);
      formValues.specific_knowledge_1_questions = ensureNumeric(formValues.specific_knowledge_1_questions);
      formValues.specific_knowledge_2_questions = ensureNumeric(formValues.specific_knowledge_2_questions);
      formValues.specific_knowledge_3_questions = ensureNumeric(formValues.specific_knowledge_3_questions);
      formValues.alternatives_count = ensureNumeric(formValues.alternatives_count);
      formValues.wrong_answer_penalty = ensureNumeric(formValues.wrong_answer_penalty);

      // Ensure weight fields are numeric
      formValues.basic_knowledge_weight = ensureNumeric(formValues.basic_knowledge_weight);
      formValues.specific_knowledge_1_weight = ensureNumeric(formValues.specific_knowledge_1_weight);
      formValues.specific_knowledge_2_weight = ensureNumeric(formValues.specific_knowledge_2_weight);
      formValues.specific_knowledge_3_weight = ensureNumeric(formValues.specific_knowledge_3_weight);
      formValues.discursive_weight = ensureNumeric(formValues.discursive_weight);
      formValues.case_study_1_weight = ensureNumeric(formValues.case_study_1_weight);
      formValues.case_study_2_weight = ensureNumeric(formValues.case_study_2_weight);
      formValues.case_study_3_weight = ensureNumeric(formValues.case_study_3_weight);

      // Handle fields that might need to be removed or preserved
      const cleanFormValues = { ...formValues };
      
      // Remove fields that are not in the model but might be in the form
      if ('has_custom_knowledge' in cleanFormValues) {
        delete cleanFormValues.has_custom_knowledge;
      }
      
      if ('custom_knowledge_questions' in cleanFormValues) {
        delete cleanFormValues.custom_knowledge_questions;
      }
      
      if ('custom_knowledge_weight' in cleanFormValues) {
        delete cleanFormValues.custom_knowledge_weight;
      }

      // Fetch concursos and do the comparison in JS for robust uniqueness
      const { data: founds, error: findError } = await supabase
        .from('concursos')
        .select('id, titulo, orgao, banca, data_publicacao')
        .eq('data_publicacao', formValues.data_publicacao);

      if (findError) throw findError;

      // Don't check for duplicates when editing as admin
      const isAdminEditing = editId && formValues.is_admin_update;
      
      const isDuplicate = !editId && !isAdminEditing && founds?.some(item =>
        normalize(item.titulo) === normalize(title) &&
        normalize(item.orgao) === normalize(orgao) &&
        normalize(item.banca) === normalize(formValues.custom_banca || formValues.banca)
      );

      if (isDuplicate) {
        toast.error("Já existe um ranking com mesmo título, órgão, banca e data.");
        return { duplicated: true };
      }

      // Create a clean object with the data for submission
      const dataToSubmit: Record<string, any> = {
        ...cleanFormValues,
        created_by_user_id: cleanFormValues.created_by_user_id || userId, // Keep original creator when admin is editing
        titulo: title,
        orgao: orgao,
        banca: cleanFormValues.custom_banca || cleanFormValues.banca,
        localidades: cleanFormValues.localidades
      };

      // Add admin flags if provided
      if (cleanFormValues.is_admin_created !== undefined) {
        dataToSubmit.is_admin_created = cleanFormValues.is_admin_created;
      }
      
      if (cleanFormValues.is_admin_update !== undefined) {
        dataToSubmit.is_admin_update = cleanFormValues.is_admin_update;
      }

      // Log for debugging
      console.log("Submitting to database:", {
        basic_knowledge_questions: dataToSubmit.basic_knowledge_questions,
        basic_knowledge_questions_type: typeof dataToSubmit.basic_knowledge_questions
      });

      let result;
      let concursoIdToUse = editId;

      if (editId) {
        const { data, error } = await supabase
          .from('concursos')
          .update(dataToSubmit)
          .eq('id', editId)
          .select();

        if (error) {
          console.error("Error updating ranking:", error);
          throw error;
        }
        result = data;
        concursoIdToUse = editId;
        toast.success("Ranking atualizado com sucesso!");
      } else {
        const { data, error } = await supabase
          .from('concursos')
          .insert(dataToSubmit)
          .select();
          
        if (error) {
          console.error("Error inserting ranking:", error);
          throw error;
        }
        result = data;
        concursoIdToUse = result?.[0]?.id;
        toast.success("Ranking criado com sucesso!");
      }

      return { id: concursoIdToUse, duplicated: false };
    } catch (error) {
      console.error("Erro ao salvar ranking:", error);
      toast.error("Erro ao salvar ranking: " + (error as Error).message);
      return { duplicated: false, error: true };
    }
  }, []);

  return { saveRanking };
};
