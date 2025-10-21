
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';
import { mapFormDataToDisciplinesStructure } from '@/utils/disciplinesStructure';

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

// Helper to create disciplines from structure fields - SEMPRE hierárquica
const createDisciplinesFromStructure = (formValues: any): any[] => {
  // Usar apenas a estrutura JSONB disciplines (sempre hierárquica)
  if (formValues.disciplines && Array.isArray(formValues.disciplines)) {
    return formValues.disciplines;
  }

  // Fallback para estrutura vazia se não houver disciplines
  return [];
};

// Helper to create subjects structure from form values
const createSubjectsStructure = (formValues: any): any => {
  // Sempre criar a partir dos valores atuais do formulário
  return {
    discr: formValues.has_discursive === true,
    discr_min_score: formValues.has_discursive ? (formValues.discursive_minimum_score || 0) : 0,
    discr_min_score_cotas: formValues.has_discursive ? (formValues.discursive_minimum_score_cotas || 0) : 0,
    case1: formValues.has_case_study_1 === true,
    case1_min_score: formValues.has_case_study_1 ? (formValues.case_study_1_minimum_score || 0) : 0,
    case1_min_score_cotas: formValues.has_case_study_1 ? (formValues.case_study_1_minimum_score_cotas || 0) : 0,
    case2: formValues.has_case_study_2 === true,
    case2_min_score: formValues.has_case_study_2 ? (formValues.case_study_2_minimum_score || 0) : 0,
    case2_min_score_cotas: formValues.has_case_study_2 ? (formValues.case_study_2_minimum_score_cotas || 0) : 0,
    case3: formValues.has_case_study_3 === true,
    case3_min_score: formValues.has_case_study_3 ? (formValues.case_study_3_minimum_score || 0) : 0,
    case3_min_score_cotas: formValues.has_case_study_3 ? (formValues.case_study_3_minimum_score_cotas || 0) : 0,
    other: formValues.has_other_subjective === true,
    name_other: formValues.has_other_subjective ? (formValues.other_subjective_name || '') : '',
    other_min_score: formValues.has_other_subjective ? (formValues.other_subjective_minimum_score || 0) : 0,
    other_min_score_cotas: formValues.has_other_subjective ? (formValues.other_subjective_minimum_score_cotas || 0) : 0
  };
};

// Helper to create has_cota structure from form values
const createHasCotaStructure = (formValues: any): any => {
  // Sempre criar a partir dos valores atuais do formulário
  return {
    ppp: formValues.has_ppp === true,
    pcd: formValues.has_pcd === true,
    ind: formValues.has_indigenas === true,
    hip: formValues.has_hipossuficientes === true,
    tra: formValues.has_transsexuais === true,
    min_cota: 0 // Coluna has_quota_minimum_score foi removida - dados agora em JSONB
  };
};

export const useSaveRanking = () => {
  const queryClient = useQueryClient();
  
  const saveRanking = useCallback(async ({ formValues, userId, editId, jobTitles }: SaveRankingOptions) => {
    try {
      // Se estivermos editando, buscar dados existentes primeiro para preservar estrutura
      let existingDisciplines: any[] = [];
      let examType: string = 'Alternativas';
      
      if (editId) {
        // Buscar as disciplinas existentes para preservar IDs
        const { data: existingRanking, error: fetchError } = await supabase
          .from('concursos')
          .select('disciplines, exam_type')
          .eq('id', editId)
          .single();
        
        if (!fetchError && existingRanking?.disciplines) {
          existingDisciplines = existingRanking.disciplines;
          examType = existingRanking.exam_type || 'Alternativas';
        }
      } else {
        examType = formValues.exam_type || 'Alternativas';
      }

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
      formValues.alternatives_count = ensureNumeric(formValues.alternatives_count);
      
      // Minimum score fields
      if (formValues.has_minimum_score) {
        formValues.total_minimum_score = ensureNumeric(formValues.total_minimum_score);
      } else {
        formValues.total_minimum_score = 0;
      }
      
      // Coluna has_quota_minimum_score foi removida - dados agora em JSONB
      formValues.quota_minimum_score = 0;

      // Don't force custom knowledge mode - let the form values determine this
      
      // Se estamos editando e temos disciplinas existentes, preservar a estrutura
      if (editId && existingDisciplines.length > 0 && formValues.disciplines) {
        // Log removido por segurança
        
        // Verificar se as disciplinas atuais e existentes usam a estrutura de blocos
        const hasCurrBlocks = formValues.disciplines.length > 0 && 
                              'name' in formValues.disciplines[0] && 
                              'disciplines' in formValues.disciplines[0];
        
        const hasExistingBlocks = existingDisciplines.length > 0 && 
                                'name' in existingDisciplines[0] && 
                                'disciplines' in existingDisciplines[0];
        
        // Se ambas têm estrutura de bloco, preservar IDs
        if (hasCurrBlocks && hasExistingBlocks) {
          formValues.disciplines = formValues.disciplines.map((block: any, blockIdx: number) => {
            // Procurar bloco correspondente por índice ou nome
            const existingBlock = existingDisciplines[blockIdx] || 
                                existingDisciplines.find((b: any) => b.name === block.name);
            
            if (existingBlock && existingBlock.id) {
              // Preservar id do bloco
              const updatedBlock = { ...block, id: existingBlock.id };
              
              // Processar disciplinas dentro do bloco
              if (block.disciplines && Array.isArray(block.disciplines) && 
                  existingBlock.disciplines && Array.isArray(existingBlock.disciplines)) {
                updatedBlock.disciplines = block.disciplines.map((discipline: any, discIdx: number) => {
                  // Procurar disciplina correspondente por índice, nome ou tipo
                  const existingDiscipline = existingBlock.disciplines[discIdx] ||
                                          existingBlock.disciplines.find((d: any) => 
                                            d.name === discipline.name || d.type === discipline.type
                                          );
                  
                  if (existingDiscipline && existingDiscipline.id) {
                    // Preservar id da disciplina
                    return {
                      ...discipline,
                      id: existingDiscipline.id,
                      type: discipline.type || existingDiscipline.type // Manter type também para consistência
                    };
                  }
                  
                  return discipline;
                });
              }
              
              return updatedBlock;
            }
            
            return block;
          });
          
          // Log removido por segurança
        }
      }

      // Processar os blocos de disciplinas - SEMPRE usar estrutura hierárquica
      if (formValues.disciplines && Array.isArray(formValues.disciplines)) {
        // Verificar se estamos lidando com a estrutura de blocos
        if (formValues.disciplines.length > 0 && 'name' in formValues.disciplines[0] && 'disciplines' in formValues.disciplines[0]) {
          // Estrutura hierárquica - processar e adicionar metadados do bloco às disciplinas
          formValues.disciplines.forEach((block: any, index: number) => {
            if (block.disciplines && Array.isArray(block.disciplines)) {
              block.disciplines.forEach((discipline: any) => {
                // Adicionar informações do bloco à disciplina
                discipline.blockId = block.id;
                discipline.blockName = block.name;
                discipline.blockWeight = block.weight || 1;
                discipline.blockMinimumScore = ensureNumeric(block.minimum_score);
                discipline.minimum_score = ensureNumeric(discipline.minimum_score);
              });
            }
          });
        }
      }
      
      // Ensure disciplines is a valid array
      if (!formValues.disciplines || !Array.isArray(formValues.disciplines)) {
        formValues.disciplines = [];
      }

      // Process disciplines for valid numeric fields and check if any are enabled
      let hasEnabledDiscipline = false;
      
      if (formValues.flattenedDisciplines && formValues.flattenedDisciplines.length > 0) {
        // Process the flattened disciplines array (compatibility with the backend)
        formValues.flattenedDisciplines = formValues.flattenedDisciplines.map((discipline: any) => {
          const enabled = discipline.isEnabled === true;
          if (enabled) {
            hasEnabledDiscipline = true;
          }
          return {
            ...discipline,
            questionCount: ensureNumeric(discipline.questionCount),
            weight: ensureNumeric(discipline.weight),
            isEnabled: enabled,
            minimum_score: ensureNumeric(discipline.minimum_score)
          };
        });
      } else if (formValues.disciplines.length > 0 && 'disciplines' in formValues.disciplines[0]) {
        // Check for enabled disciplines in the block structure
        // Verificar se existem disciplinas habilitadas
        for (const block of formValues.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled === true) {
                hasEnabledDiscipline = true;
                break;
              }
            }
          }
          if (hasEnabledDiscipline) break;
        }
      }
      
      // Validate that at least one discipline is enabled
      if (!hasEnabledDiscipline) {
        toast.error("Por favor, selecione ao menos uma disciplina.");
        return { duplicated: false, error: true };
      }

      // Fetch rankings and do the comparison in JS for robust uniqueness
      const { data: founds, error: findError } = await supabase
        .from('concursos')
        .select('id, titulo, orgao, banca, created_at');

      if (findError) throw findError;

      // Don't check for duplicates when editing as admin
      const isAdminEditing = editId && formValues.is_admin_update;
      
      const isDuplicate = !editId && !isAdminEditing && founds?.some(item =>
        normalize(item.titulo) === normalize(title) &&
        normalize(item.orgao) === normalize(orgao) &&
        normalize(item.banca) === normalize(formValues.custom_banca || formValues.banca)
      );

      if (isDuplicate) {
        toast.error("Já existe um ranking com mesmo título, órgão e banca.");
        return { duplicated: true };
      }

      // Create a clean object with the data for submission (only essential fields)
      const dataToSubmit: Record<string, any> = {
        titulo: title,
        orgao: orgao,
        banca: formValues.custom_banca || formValues.banca,
        status: formValues.status || 'Ativo',
        created_by_user_id: userId,
        // Campos básicos do concurso
        vagas: ensureNumeric(formValues.vagas),
        inscritos: ensureNumeric(formValues.inscritos),
        etapa_atual: formValues.etapa_atual,
        link: formValues.link
        // Pontuações mínimas agora vão dentro da estrutura disciplines
      };

      // Remove any temporary fields not needed in database
      // (não há mais campos temporários para remover)

      // Add admin flags if provided
      if (formValues.is_admin_created !== undefined) {
        dataToSubmit.is_admin_created = formValues.is_admin_created;
      }
      
      if (formValues.is_admin_update !== undefined) {
        dataToSubmit.is_admin_update = formValues.is_admin_update;
      }

      // Log removido por segurança

      let result;
      let concursoIdToUse = editId;

      if (editId) {
        // Para edição, incluir todos os campos necessários
        const subjectsStructure = createSubjectsStructure(formValues);
        const hasCotaStructure = createHasCotaStructure(formValues);
        
        // Processar estrutura de disciplinas para edição usando helper
        const disciplinesStructure = mapFormDataToDisciplinesStructure({
          disciplines: formValues.disciplines || [],
          minimum_total_score: formValues.minimumTotalScore || 0,
          minimum_total_score_cotas: formValues.minimumTotalScoreCotas || 0,
          wrong_answer_penalty: formValues.wrong_answer_penalty || 0
        });
        
        const editDataToSubmit = {
          ...dataToSubmit,
          // Campos básicos do concurso
          vagas: ensureNumeric(formValues.vagas),
          inscritos: ensureNumeric(formValues.inscritos),
          etapa_atual: formValues.etapa_atual,
          link: formValues.link,
          // Campos de localidade e cotas
          localidades: formValues.localidades,
          // Campos de configuração de exame
          exam_type: formValues.exam_type || 'Alternativas',
          alternatives_count: ensureNumeric(formValues.alternatives_count),
          // Campos de disciplinas - sempre usar estrutura hierárquica
          disciplines: disciplinesStructure,
          subjects: subjectsStructure,
          has_cota: hasCotaStructure,
          form_config: formValues.form_config || {},
          official_answers: formValues.official_answers || {},
          exam_booklets: formValues.exam_booklets || [],
          metadata: formValues.metadata || {}
        };

        const { data, error } = await supabase
          .from('concursos')
          .update(editDataToSubmit)
          .eq('id', editId)
          .select();

        if (error) {
          console.error("Error updating ranking:", error);
          throw error;
        }
        result = data;
        concursoIdToUse = editId;
        
        // console.log('[useSaveRanking] Ranking editado com sucesso, campos atualizados:', Object.keys(editDataToSubmit));
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
      }

      // Segunda etapa: atualizar com campos adicionais (sempre executar)
      if (concursoIdToUse) {
        // ✅ NOVA ESTRUTURA: Mapear dados do formulário para estrutura hierárquica correta
        // Normalizar campos de mínimo global (snake_case) para garantir persistência correta
        const disciplinesStructure = mapFormDataToDisciplinesStructure({
          ...formValues,
          minimum_total_score: formValues.minimumTotalScore || 0,
          minimum_total_score_cotas: formValues.minimumTotalScoreCotas || 0,
          wrong_answer_penalty: formValues.wrong_answer_penalty || 0
        });
        
        console.log('[useSaveRanking] Disciplines structure to save:', disciplinesStructure);
        console.log('[useSaveRanking] Is disciplines structure an object?', typeof disciplinesStructure === 'object');
        console.log('[useSaveRanking] Is disciplines structure an array?', Array.isArray(disciplinesStructure));
        console.log('[useSaveRanking] Disciplines structure blocks:', disciplinesStructure.blocks);
        console.log('[useSaveRanking] Form values disciplines:', formValues.disciplines);
        console.log('[useSaveRanking] Form values disciplines type:', typeof formValues.disciplines);
        console.log('[useSaveRanking] Form values disciplines isArray:', Array.isArray(formValues.disciplines));
        
        // ✅ VALIDAÇÃO: Verificar se há disciplinas antes de salvar
        if (!disciplinesStructure.blocks || disciplinesStructure.blocks.length === 0) {
          console.warn('[useSaveRanking] No disciplines found in form data - continuing anyway for debugging');
          // toast.error('Por favor, adicione pelo menos uma disciplina na estrutura da prova');
          // return;
        }
        
        // Determinar se há disciplinas customizadas baseado na nova estrutura
        const hasCustomDisciplines = disciplinesStructure.blocks && disciplinesStructure.blocks.length > 0;
        
        console.log('[useSaveRanking] Updating concurso with ID:', concursoIdToUse);
        console.log('[useSaveRanking] Update data:', {
          exam_type: formValues.exam_type || 'Alternativas',
          disciplines: disciplinesStructure,
          has_custom_knowledge: hasCustomDisciplines
        });
        
        const { error: updateError } = await supabase
          .from('concursos')
          .update({ 
            exam_type: formValues.exam_type || 'Alternativas',
            // has_custom_knowledge removido - usando disciplines JSONB
            created_by_user_id: formValues.created_by_user_id || userId,
            // Campos básicos do concurso
            vagas: ensureNumeric(formValues.vagas),
            inscritos: ensureNumeric(formValues.inscritos),
            etapa_atual: formValues.etapa_atual,
            link: formValues.link,
            // Campos de localidade e cotas
            localidades: formValues.localidades,
            // Campos JSONB sincronizados com convoca-ai
            disciplines: disciplinesStructure,
            subjects: createSubjectsStructure(formValues),
            has_cota: createHasCotaStructure(formValues),
            form_config: formValues.form_config || {},
            official_answers: formValues.official_answers || {},
            exam_booklets: formValues.exam_booklets || [],
            metadata: formValues.metadata || {},
            total_participants: 0
          })
          .eq('id', concursoIdToUse);

        if (updateError) {
          console.error("Error updating additional fields:", updateError);
          console.error("Update error details:", {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          toast.error(`Erro ao atualizar campos adicionais: ${updateError.message}`);
          // Não falhar a operação, apenas logar o erro
        }

        // Disparar recálculo para todos os participantes após editar mínimos/pesos/blocos
        try {
          // Buscar todos os user_rankings e filtrar em memória os que participam deste concurso
          const { data: allUserRankings } = await supabase
            .from('user_rankings')
            .select('user_id, consolidated_data');

          const participants: string[] = [];
          if (allUserRankings && Array.isArray(allUserRankings)) {
            for (const ur of allUserRankings) {
              const rankingsMap = ur?.consolidated_data?.rankings || {};
              const keys = Object.keys(rankingsMap);
              const participates = keys.some((k) => rankingsMap[k]?.concurso_id === concursoIdToUse);
              if (participates) participants.push(ur.user_id);
            }
          }

          if (participants.length > 0) {
            const { recalculateUserScore } = await import('@/integrations/supabase/rankings/rankingMutations');
            // Rodar em background sem bloquear a UI
            Promise.allSettled(participants.map((uid) => recalculateUserScore(uid, concursoIdToUse!)))
              .then(() => {
                // Invalidate para refletir resultados
                queryClient.invalidateQueries({ queryKey: ['rankings', concursoIdToUse] });
                queryClient.invalidateQueries({ queryKey: ['user-created-rankings'] });
              })
              .catch((e) => console.error('[useSaveRanking] Erro ao executar recálculo em lote:', e));
          }
        } catch (batchErr) {
          console.error('[useSaveRanking] Erro ao preparar recálculo pós-edição:', batchErr);
        }
      }

      // Show success message and invalidate queries
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['concursos'] });
      queryClient.invalidateQueries({ queryKey: ['concurso', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['participant-count-v2', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['user-participation-v2', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['user-created-rankings', userId] });
      
      return { id: concursoIdToUse, duplicated: false };
    } catch (error: any) {
      console.error("Erro ao salvar ranking:", error);
      toast.error("Erro ao salvar ranking: " + (error?.message || 'Erro desconhecido'));
      return { duplicated: false, error: true };
    }
  }, [queryClient]);

  return { saveRanking };
};
