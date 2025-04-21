
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveRankingOptions {
  formValues: any;
  userId: string;
  editId?: string | null;
  jobTitles: Array<{ id: string; title: string }>;
}

export const useSaveRanking = () => {
  const saveRanking = useCallback(async ({ formValues, userId, editId, jobTitles }: SaveRankingOptions) => {
    // Checa se já existe ranking idêntico (mesmo título, órgão, banca e data de publicação)
    const title = formValues.custom_job_title || formValues.predefined_job_title;
    const { data: found, error: findError } = await supabase
      .from('concursos')
      .select('id')
      .eq('titulo', title)
      .eq('orgao', formValues.orgao)
      .eq('banca', formValues.custom_banca || formValues.banca)
      .eq('data_publicacao', formValues.data_publicacao)
      .maybeSingle();

    // Bloqueia duplicidade se não for no modo edição e encontrou igual
    if (!editId && found) {
      toast.error("Já existe um ranking com mesmo título, órgão, banca e data.");
      return { duplicated: true };
    }

    const dataToSubmit = {
      ...formValues,
      created_by_user_id: userId,
      titulo: title,
      banca: formValues.custom_banca || formValues.banca,
      localidades: formValues.localidades
    };

    let result;
    let concursoIdToUse = editId;

    if (editId) {
      const { data, error } = await supabase
        .from('concursos')
        .update(dataToSubmit)
        .eq('id', editId)
        .select();

      if (error) throw error;
      result = data;
      concursoIdToUse = editId;
      toast.success("Ranking atualizado com sucesso!");
    } else {
      result = await supabase.from('concursos').insert(dataToSubmit).select();
      concursoIdToUse = result?.data?.[0]?.id;
      toast.success("Ranking criado com sucesso!");
    }

    return { id: concursoIdToUse, duplicated: false };
  }, []);

  return { saveRanking };
};
