
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
      formValues.alternatives_count = ensureNumeric(formValues.alternatives_count);
      formValues.wrong_answer_penalty = ensureNumeric(formValues.wrong_answer_penalty);
      
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

      // Always use custom knowledge mode
      formValues.has_custom_knowledge = true;

      let existingDisciplines = null;
      
      // Se estamos editando, vamos obter os dados existentes do concurso para preservar a estrutura
      if (editId) {
        const { data: existingConcurso, error: existingError } = await supabase
          .from('concursos')
          .select('disciplines')
          .eq('id', editId)
          .single();
          
        if (!existingError && existingConcurso && existingConcurso.disciplines) {
          existingDisciplines = existingConcurso.disciplines;
          console.log("Disciplinas existentes carregadas:", existingDisciplines);
        }
      }

      // Processar os blocos de disciplinas e gerar disciplinas planas para o banco de dados
      if (formValues.disciplines && Array.isArray(formValues.disciplines)) {
        // Verificar se estamos lidando com a nova estrutura de blocos
        if (formValues.disciplines.length > 0 && 'disciplines' in formValues.disciplines[0]) {
          console.log("Processando disciplinas na estrutura de blocos");
          
          const flattenedDisciplines: any[] = [];
          
          formValues.disciplines.forEach((block: any) => {
            if (block.disciplines && Array.isArray(block.disciplines)) {
              block.disciplines.forEach((discipline: any) => {
                // Garantir que os valores numéricos são tratados corretamente
                const processedDiscipline = {
                  ...discipline,
                  blockId: block.id,
                  blockName: block.name,
                  blockWeight: ensureNumeric(block.weight) || 1,
                  questionCount: ensureNumeric(discipline.questionCount),
                  weight: ensureNumeric(discipline.weight) || 1,
                  minimum_score: ensureNumeric(discipline.minimum_score)
                };
                
                console.log(`Processando disciplina: ${discipline.type}, ativa: ${discipline.isEnabled}, questões: ${processedDiscipline.questionCount}`);
                
                // Adicionar informações do bloco à disciplina
                flattenedDisciplines.push(processedDiscipline);
              });
            }
          });
          
          // Criar uma cópia da estrutura original para preservar os blocos no frontend
          const originalStructure = JSON.parse(JSON.stringify(formValues.disciplines));
          console.log(`Total de disciplinas processadas: ${flattenedDisciplines.length}`);
          
          // Substituir o campo disciplines pela versão achatada
          formValues.flattenedDisciplines = flattenedDisciplines;
        } else if (existingDisciplines) {
          // Temos a estrutura antiga (não hierárquica) e dados existentes, reconstruir a estrutura
          console.log("Reconstruindo estrutura hierárquica a partir de dados existentes");
          formValues.disciplines = existingDisciplines;
        }
      } else if (existingDisciplines) {
        // Não recebemos disciplinas do frontend mas temos dados existentes, usar os existentes
        console.log("Usando disciplinas existentes do banco de dados");
        formValues.disciplines = existingDisciplines;
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
            isEnabled: enabled
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
      if (!hasEnabledDiscipline && formValues.has_custom_knowledge) {
        toast.error("Por favor, selecione ao menos uma disciplina.");
        return { duplicated: false, error: true };
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
        ...formValues,
        created_by_user_id: formValues.created_by_user_id || userId, // Keep original creator when admin is editing
        titulo: title,
        orgao: orgao,
        banca: formValues.custom_banca || formValues.banca,
        localidades: formValues.localidades,
        has_custom_knowledge: true,
        
        // Use the processed disciplines array - preferir a estrutura hierárquica original se disponível
        disciplines: formValues.disciplines,
        
        // Process minimum score fields
        has_minimum_score: formValues.has_minimum_score === true,
        minimum_score_unit_type: formValues.minimum_score_unit_type || 'percentage',
        minimum_score_type: formValues.minimum_score_type || 'knowledge',
        total_minimum_score: formValues.has_minimum_score ? ensureNumeric(formValues.total_minimum_score) : 0,
        
        has_quota_minimum_score: formValues.has_quota_minimum_score === true,
        quota_minimum_score_unit_type: formValues.quota_minimum_score_unit_type || 'percentage',
        quota_minimum_score: formValues.has_quota_minimum_score ? ensureNumeric(formValues.quota_minimum_score) : 0
      };

      // Remove any temporary fields not needed in database
      delete dataToSubmit.flattenedDisciplines;

      // Add admin flags if provided
      if (formValues.is_admin_created !== undefined) {
        dataToSubmit.is_admin_created = formValues.is_admin_created;
      }
      
      if (formValues.is_admin_update !== undefined) {
        dataToSubmit.is_admin_update = formValues.is_admin_update;
      }

      // Log for debugging
      console.log("Submitting to database:", {
        has_custom_knowledge: dataToSubmit.has_custom_knowledge,
        disciplines: dataToSubmit.disciplines,
        has_minimum_score: dataToSubmit.has_minimum_score,
        total_minimum_score: dataToSubmit.total_minimum_score,
        has_quota_minimum_score: dataToSubmit.has_quota_minimum_score,
        quota_minimum_score: dataToSubmit.quota_minimum_score
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

      // Logic to synchronize official_answer_weights with the disciplines
      if (concursoIdToUse) {
        // Get the saved ranking to access its disciplines
        const { data: savedConcurso, error: getConcursoError } = await supabase
          .from('concursos')
          .select('disciplines')
          .eq('id', concursoIdToUse)
          .single();

        if (getConcursoError) {
          console.error("Erro ao buscar concurso para sincronização:", getConcursoError);
          // Continue even with error, as the ranking was already saved
        } else if (savedConcurso && savedConcurso.disciplines) {
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
              console.log(`Processando ${disciplines.length} disciplinas para inserir em official_answer_weights`);
              
              // Lidar com estrutura hierárquica (blocos contendo disciplinas)
              if (disciplines.length > 0 && 'disciplines' in disciplines[0]) {
                for (const block of disciplines) {
                  if (block && typeof block === 'object' && 'disciplines' in block && Array.isArray(block.disciplines)) {
                    for (const discipline of block.disciplines) {
                      if (discipline.isEnabled !== true) {
                        console.log(`Pulando disciplina desabilitada: ${discipline.name}`);
                        continue;
                      }

                      const disciplineType = discipline.type;
                      const questionCount = ensureNumeric(discipline.questionCount);
                      const disciplineWeight = ensureNumeric(discipline.weight || 1.0);

                      console.log(`Processando disciplina: ${discipline.name}, tipo: ${disciplineType}, questões: ${questionCount}`);

                      if (disciplineType && questionCount > 0) {
                        for (let i = 0; i < questionCount; i++) {
                          officialAnswerWeightsToInsert.push({
                            concurso_id: concursoIdToUse,
                            question_number: questionCounter,
                            correct_answer: 'A', // Default initial value
                            section_type: disciplineType, // CRUCIAL: Use discipline type as section_type
                            weight: disciplineWeight,
                            is_nullified: false,
                            question_type: 'MULTIPLE_CHOICE'
                          });
                          questionCounter++;
                        }
                      } else {
                        console.warn(`Disciplina com type ou questionCount inválido ignorada:`, discipline);
                      }
                    }
                  }
                }
              } else {
                // Estrutura antiga (plana) - raramente deve ser usada
                for (const discipline of disciplines) {
                  if (discipline.isEnabled !== true) {
                    console.log(`Pulando disciplina desabilitada: ${discipline.name}`);
                    continue;
                  }

                  const disciplineType = discipline.type;
                  const questionCount = ensureNumeric(discipline.questionCount);
                  const disciplineWeight = ensureNumeric(discipline.weight || 1.0);

                  console.log(`Processando disciplina: ${discipline.name}, tipo: ${disciplineType}, questões: ${questionCount}`);

                  if (disciplineType && questionCount > 0) {
                    for (let i = 0; i < questionCount; i++) {
                      officialAnswerWeightsToInsert.push({
                        concurso_id: concursoIdToUse,
                        question_number: questionCounter,
                        correct_answer: 'A', // Default initial value
                        section_type: disciplineType, // CRUCIAL: Use discipline type as section_type
                        weight: disciplineWeight,
                        is_nullified: false,
                        question_type: 'MULTIPLE_CHOICE'
                      });
                      questionCounter++;
                    }
                  } else {
                    console.warn(`Disciplina com type ou questionCount inválido ignorada:`, discipline);
                  }
                }
              }
            }

            // 3. Insert new records
            if (officialAnswerWeightsToInsert.length > 0) {
              console.log(`Inserindo ${officialAnswerWeightsToInsert.length} registros em official_answer_weights`);
              
              const { error: insertError } = await supabase
                .from('official_answer_weights')
                .insert(officialAnswerWeightsToInsert);

              if (insertError) {
                console.error("Erro ao inserir novos official_answer_weights:", insertError);
                toast.error("Ranking salvo, mas houve um erro ao configurar os pesos das questões. O cálculo da pontuação pode estar incorreto.");
              } else {
                console.log(`Official answer weights criados com sucesso para o concurso ${concursoIdToUse}. Total: ${officialAnswerWeightsToInsert.length} registros.`);
              }
            } else {
              console.log("Nenhuma disciplina customizada válida encontrada para inserir em official_answer_weights.");
            }
          } catch (syncError) {
            console.error("Erro durante a sincronização com official_answer_weights:", syncError);
          }
        }
      }

      // Show success message after the whole process
      if (editId) {
        toast.success("Ranking atualizado com sucesso!");
      } else {
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
