
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';

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

// Helper to create disciplines from structure fields
const createDisciplinesFromStructure = (formValues: any): any[] => {
  // Usar apenas a estrutura JSONB disciplines
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
    case1: formValues.has_case_study_1 === true,
    case1_min_score: formValues.has_case_study_1 ? (formValues.case_study_1_minimum_score || 0) : 0,
    case2: formValues.has_case_study_2 === true,
    case2_min_score: formValues.has_case_study_2 ? (formValues.case_study_2_minimum_score || 0) : 0,
    case3: formValues.has_case_study_3 === true,
    case3_min_score: formValues.has_case_study_3 ? (formValues.case_study_3_minimum_score || 0) : 0,
    other: formValues.has_other_subjective === true,
    name_other: formValues.has_other_subjective ? (formValues.other_subjective_name || '') : '',
    other_min_score: formValues.has_other_subjective ? (formValues.other_subjective_minimum_score || 0) : 0
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
    min_cota: formValues.has_quota_minimum_score ? (formValues.quota_minimum_score || 0) : 0
  };
};

export const useSaveRanking = () => {
  const queryClient = useQueryClient();
  
  const saveRanking = useCallback(async ({ formValues, userId, editId, jobTitles }: SaveRankingOptions) => {
    // console.log('[useSaveRanking] saveRanking called with:', { formValues, userId, editId, jobTitles });
    try {
      // Se estivermos editando, buscar dados existentes primeiro para preservar estrutura
      let existingDisciplines: any[] = [];
      let examType: string = 'Alternativas'; // Default value
      
        if (editId) {
          // Buscar as disciplinas existentes para preservar IDs
          const { data: existingRanking, error: fetchError } = await supabase
            .from('concursos')
            .select('disciplines, exam_type')
            .eq('id', editId)
            .single();
        
        if (!fetchError && existingRanking?.disciplines) {
          // Log removido por segurança
          existingDisciplines = existingRanking.disciplines;
          examType = existingRanking.exam_type || 'Alternativas';
        }
      } else {
        // Para novos concursos, usar o exam_type do formulário
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
      
      if (formValues.has_quota_minimum_score) {
        formValues.quota_minimum_score = ensureNumeric(formValues.quota_minimum_score);
      } else {
        formValues.quota_minimum_score = 0;
      }

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

      // Processar os blocos de disciplinas e gerar disciplinas planas para o banco de dados
      if (formValues.disciplines && Array.isArray(formValues.disciplines)) {
        // Verificar se estamos lidando com a nova estrutura de blocos
        if (formValues.disciplines.length > 0 && 'name' in formValues.disciplines[0] && 'disciplines' in formValues.disciplines[0]) {
          const flattenedDisciplines: any[] = [];
          const originalDisciplines = JSON.parse(JSON.stringify(formValues.disciplines)); // Deep clone
          
          // Criar uma cópia original para manter a estrutura hierárquica
          const disciplinesWithHierarchy = JSON.parse(JSON.stringify(formValues.disciplines));
          
          formValues.disciplines.forEach((block: any) => {
            if (block.disciplines && Array.isArray(block.disciplines)) {
              block.disciplines.forEach((discipline: any) => {
                // Processar cada disciplina e adicionar informações do bloco
                flattenedDisciplines.push({
                  ...discipline,
                  blockId: block.id,
                  blockName: block.name,
                  minimum_score: ensureNumeric(discipline.minimum_score),
                  blockWeight: block.weight || 1,
                  blockMinimumScore: ensureNumeric(block.minimum_score)
                });
              });
            }
          });
          
          // Criar uma cópia da estrutura original para preservar os blocos no frontend
          // mas enviar a estrutura achatada para o backend
          
          // Substituir o campo disciplines pela versão achatada
          formValues.flattenedDisciplines = flattenedDisciplines;
          
          // Preservar a estrutura hierárquica para o banco de dados
          formValues.hierarchicalDisciplines = disciplinesWithHierarchy;
          
          // Logs removidos por segurança
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
        for (const block of formValues.disciplines) {
          if (block.disciplines && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled === true) {
                hasEnabledDiscipline = true;
                break;
              }
            }
            if (hasEnabledDiscipline) break;
          }
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
      };

      // Remove any temporary fields not needed in database
      delete dataToSubmit.flattenedDisciplines;
      delete dataToSubmit.hierarchicalDisciplines;

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
          // Campos de disciplinas
          disciplines: formValues.hierarchicalDisciplines || formValues.disciplines,
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

      // Segunda etapa: atualizar com campos adicionais se não for edição
      if (!editId && concursoIdToUse) {
        // Usar as disciplinas do formulário se existirem, senão criar automaticamente
        let disciplinesData = formValues.disciplines || [];
        
        // Se não há disciplinas no formulário, criar baseadas na estrutura de prova
        if (!disciplinesData || disciplinesData.length === 0) {
          disciplinesData = createDisciplinesFromStructure(formValues);
        }
        
        // Determinar se há disciplinas customizadas baseado nas disciplinas criadas
        const hasCustomDisciplines = disciplinesData && disciplinesData.length > 0;
        
        // console.log('[useSaveRanking] Usando disciplinas:', disciplinesData);
        // console.log('[useSaveRanking] hasCustomDisciplines:', hasCustomDisciplines);
        
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
            disciplines: disciplinesData,
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
          // Não falhar a operação, apenas logar o erro
        }
      }

      // REMOVIDO: Logic to synchronize official_answer_weights with the disciplines
      // Dados agora são salvos no JSONB da tabela concursos
      /* REMOVIDO - Dados salvos no JSONB
      if (concursoIdToUse) {
        // Get the saved ranking to access its disciplines
        const { data: savedRanking, error: getRankingError } = await supabase
          .from('concursos')
          .select('disciplines')
          .eq('id', concursoIdToUse)
          .single();

        if (getRankingError) {
          console.error("Erro ao buscar ranking para sincronização:", getRankingError);
          // Continue even with error, as the ranking was already saved
        } else if (savedRanking && savedRanking.disciplines) {
          try {
            // 1. Delete existing records for this ranking
            const { error: deleteError } = await supabase
              .from('official_answer_weights')
              .delete()
              .eq('concurso_id', concursoIdToUse);

            if (deleteError) {
              console.error("Erro ao excluir official_answer_weights existentes:", deleteError);
            }

            // 2. Generate data for official_answer_weights
            const disciplines = savedConcurso.disciplines;
            const officialAnswerWeightsToInsert: any[] = [];
            let questionCounter = 1;

            if (disciplines && Array.isArray(disciplines)) {
              // Log removido por segurança
              
              // Verificar se estamos lidando com estrutura hierárquica
              const isHierarchical = disciplines.length > 0 && 
                                    typeof disciplines[0] === 'object' && 
                                    'name' in disciplines[0] && 
                                    'disciplines' in disciplines[0];
              
              if (isHierarchical) {
                // Processar estrutura hierárquica (blocos -> disciplinas)
                for (const block of disciplines as any[]) {
                  // Log removido por segurança
                  
                  if (block.disciplines && Array.isArray(block.disciplines)) {
                    for (const discipline of block.disciplines) {
                      if (discipline.isEnabled !== true) {
                        // Log removido por segurança
                        continue;
                      }
                      
                      const disciplineType = discipline.type || `discipline_${questionCounter}`;
                      const questionCount = ensureNumeric(discipline.questionCount);
                      const disciplineWeight = ensureNumeric(discipline.weight || 1.0);
                      
                      // Log removido por segurança
                      
                      if (disciplineType && questionCount > 0) {
                        for (let i = 0; i < questionCount; i++) {
                          officialAnswerWeightsToInsert.push({
                            concurso_id: concursoIdToUse,
                            question_number: questionCounter,
                            correct_answer: examType === 'Certo ou Errado' ? 'C' : 'A', // Default initial value
                            section_type: disciplineType,
                            weight: disciplineWeight,
                            is_nullified: false,
                            question_type: examType === 'Certo ou Errado' ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE'
                          });
                          questionCounter++;
                        }
                      }
                    }
                  }
                }
              } else {
                // Processar estrutura plana (compatibilidade)
                for (const discipline of disciplines) {
                  if (discipline.isEnabled !== true) {
                    // Log removido por segurança
                    continue;
                  }

                  const disciplineType = discipline.type || `discipline_${questionCounter}`;
                  const questionCount = ensureNumeric(discipline.questionCount);
                  const disciplineWeight = ensureNumeric(discipline.weight || 1.0);

                  // Log removido por segurança

                  if (questionCount > 0) {
                    for (let i = 0; i < questionCount; i++) {
                      officialAnswerWeightsToInsert.push({
                        concurso_id: concursoIdToUse,
                        question_number: questionCounter,
                        correct_answer: examType === 'Certo ou Errado' ? 'C' : 'A', // Default initial value
                        section_type: disciplineType, // CRUCIAL: Use discipline type as section_type
                        weight: disciplineWeight,
                        is_nullified: false,
                        question_type: examType === 'Certo ou Errado' ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE'
                      });
                      questionCounter++;
                    }
                  } else {
                    console.warn(`Disciplina com questionCount inválido ignorada:`, discipline);
                  }
                }
              }
            }

            // 3. Insert new records
            if (officialAnswerWeightsToInsert.length > 0) {
              // Log removido por segurança
              
              const { error: insertError } = await supabase
                .from('official_answer_weights')
                .insert(officialAnswerWeightsToInsert);

              if (insertError) {
                console.error("Erro ao inserir novos official_answer_weights:", insertError);
                toast.error("Ranking salvo, mas houve um erro ao configurar os pesos das questões. O cálculo da pontuação pode estar incorreto.");
              } else {
                // Log removido por segurança
              }
            } else {
              // Log removido por segurança
            }
          } catch (syncError) {
            console.error("Erro durante a sincronização com official_answer_weights:", syncError);
          }
        }
      }
      */

      // Show success message after the whole process
      // console.log('[useSaveRanking] Ranking salvo com sucesso, ID:', concursoIdToUse);
      
      // Invalidar queries para refresh automático
      // console.log('[useSaveRanking] 🔄 Invalidando queries para refresh automático...');
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['concursos'] });
      queryClient.invalidateQueries({ queryKey: ['concurso', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['participant-count-v2', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['user-participation-v2', concursoIdToUse] });
      queryClient.invalidateQueries({ queryKey: ['user-created-rankings', userId] });
      // console.log('[useSaveRanking] ✅ Queries invalidadas, dados serão atualizados automaticamente');
      
      if (editId) {
      } else {
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
