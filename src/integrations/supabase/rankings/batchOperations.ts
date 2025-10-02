
import { supabase } from '../client';

interface BatchRecalculationResult {
  success: boolean;
  updatedCount?: number;
  error?: string;
  details?: any;
}

export const recalculateAllUserScores = async (concursoId: string): Promise<BatchRecalculationResult> => {
  try {
    console.log(`[recalculateAllUserScores] Starting batch recalculation for concurso: ${concursoId}`);

    // Obter dados do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('[recalculateAllUserScores] Error fetching concurso:', concursoError);
      return { success: false, error: 'Erro ao buscar dados do concurso' };
    }

    // Obter gabarito consolidado
    const { data: consolidatedAnswers, error: consolidatedError } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .single();

    if (consolidatedError) {
      console.error('[recalculateAllUserScores] Error fetching consolidated answers:', consolidatedError);
      return { success: false, error: 'Erro ao buscar gabarito consolidado' };
    }

    if (!consolidatedAnswers?.consolidated_answer_data) {
      console.log('[recalculateAllUserScores] No consolidated answer data found');
      return { success: false, error: 'Gabarito não encontrado para este concurso' };
    }

    const answerData = consolidatedAnswers.consolidated_answer_data;
    const booklets = answerData.booklets || {};
    
    console.log(`[recalculateAllUserScores] Found ${Object.keys(booklets).length} booklets in official answers`);

    // Verificar se existem gabaritos para os cadernos
    if (Object.keys(booklets).length === 0) {
      console.log('[recalculateAllUserScores] No booklets found in consolidated data');
      return { success: false, error: 'Nenhum caderno encontrado no gabarito consolidado' };
    }

    // Buscar todos os rankings para este concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id, discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('concurso_id', concursoId);

    if (rankingsError) {
      console.error('[recalculateAllUserScores] Error fetching user rankings:', rankingsError);
      return { success: false, error: 'Erro ao buscar rankings dos usuários' };
    }

    console.log(`[recalculateAllUserScores] Found ${userRankings?.length || 0} user rankings to process`);

    let successCount = 0;
    let failedCount = 0;
    const failedRecalculations: any[] = [];

    for (const ranking of userRankings || []) {
      try {
        console.log(`[recalculateAllUserScores] Processing ranking ${ranking.id} for user ${ranking.user_id}`);

        // Buscar dados consolidados do CONCURSO na tabela dedicada
        const { data: concursoData, error: answersError } = await supabase
          .from('consolidated_answers_by_concurso')
          .select('consolidated_data')
          .eq('concurso_id', concursoId)
          .single();

        if (answersError) {
          console.error(`[recalculateAllUserScores] Error fetching concurso data for ranking ${ranking.id}:`, answersError);
          failedCount++;
          failedRecalculations.push({ rankingId: ranking.id, error: answersError });
          continue;
        }

        let totalScore = 0;
        const disciplineScores: Record<string, number> = {};
        const weightedDisciplineScores: Record<string, number> = {};

        // Extrair respostas do usuário específico do JSON consolidado do concurso
        let userAnswers: Record<string, string> = {};
        if (concursoData?.consolidated_data?.users?.[ranking.user_id]) {
          const userData = concursoData.consolidated_data.users[ranking.user_id];
          
          // CORREÇÃO: Usar o caderno selecionado pelo usuário, não o primeiro
          const selectedBooklet = userData.selected_booklet;
          if (userData.booklets && selectedBooklet && userData.booklets[selectedBooklet]) {
            userAnswers = userData.booklets[selectedBooklet]?.answers || {};
            console.log(`[recalculateAllUserScores] Using selected booklet ${selectedBooklet} for user ${ranking.user_id}`);
            
            // CORREÇÃO: Usar o gabarito do caderno correspondente ao usuário
            if (!booklets[selectedBooklet]?.answers) {
              console.log(`[recalculateAllUserScores] No official answers found for booklet ${selectedBooklet}`);
              continue; // Pular este usuário se não há gabarito para seu caderno
            }
          } else {
            console.log(`[recalculateAllUserScores] No selected booklet or booklet data found for user ${ranking.user_id}`);
            continue; // Pular usuário sem caderno selecionado
          }
        }

        // Obter o gabarito oficial do caderno específico do usuário
        const userData = concursoData?.consolidated_data?.users?.[ranking.user_id];
        const selectedBooklet = userData?.selected_booklet;
        const officialAnswers = booklets[selectedBooklet]?.answers || {};
        
        // Calcular pontuação das respostas objetivas
        for (const [questionNumberStr, userAnswer] of Object.entries(userAnswers)) {
          const officialAnswer = officialAnswers[questionNumberStr];

          if (officialAnswer) {
            const isNullified = officialAnswer.is_nullified === true;
            const isCorrect = userAnswer === officialAnswer.correct_answer;
            const isBlank = !userAnswer || userAnswer.trim() === '';
            const questionWeight = officialAnswer.weight || 1;
            const sectionType = officialAnswer.section_type || 'default';
            const isCertoOuErrado = concurso.exam_type === 'Certo ou Errado';
            
            // Inicializar pontuação da disciplina se ainda não existir
            if (!disciplineScores[sectionType]) {
              disciplineScores[sectionType] = 0;
              weightedDisciplineScores[sectionType] = 0;
            }
            
            let disciplineWeight = 1;
            
            // Obter peso da disciplina se usar conhecimentos customizados
            if (concurso.has_custom_knowledge && concurso.disciplines) {
              const isHierarchical = concurso.disciplines.some((item: any) => 'disciplines' in item);
              
              if (isHierarchical) {
                for (const block of concurso.disciplines) {
                  if ('disciplines' in block && Array.isArray(block.disciplines)) {
                    for (const discipline of block.disciplines) {
                      if (discipline.type === sectionType) {
                        disciplineWeight = discipline.weight || 1;
                        break;
                      }
                    }
                  }
                }
              } else {
                for (const discipline of concurso.disciplines) {
                  if ('type' in discipline && discipline.type === sectionType) {
                    disciplineWeight = discipline.weight || 1;
                    break;
                  }
                }
              }
            }
            
            // Aplicar pontuação
            if (isNullified) {
              // Questão anulada: sempre soma o peso
              totalScore += questionWeight;
              disciplineScores[sectionType] += 1;
              weightedDisciplineScores[sectionType] += questionWeight * disciplineWeight;
            } else if (isBlank) {
              // Resposta em branco: não altera pontuação
              continue;
            } else if (isCorrect) {
              // Resposta correta: soma o peso
              totalScore += questionWeight;
              disciplineScores[sectionType] += 1;
              weightedDisciplineScores[sectionType] += questionWeight * disciplineWeight;
            } else if (isCertoOuErrado) {
              // Resposta errada em C/E: subtrai o peso
              totalScore -= questionWeight;
              disciplineScores[sectionType] -= 1;
              weightedDisciplineScores[sectionType] -= questionWeight * disciplineWeight;
            }
            // Resposta errada em outros tipos de prova: não altera (já faz continue implícito)
          }
        }

        // Adicionar pontuações subjetivas
        const discursiveScore = ranking.discursive_score || 0;
        const caseStudy1Score = ranking.case_study_1_score || 0;
        const caseStudy2Score = ranking.case_study_2_score || 0;
        const caseStudy3Score = ranking.case_study_3_score || 0;
        
        const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
        const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
        const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
        const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);

        // Se usar conhecimentos customizados, recalcular total com pesos
        if (concurso.has_custom_knowledge && Object.keys(weightedDisciplineScores).length > 0) {
          totalScore = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + score, 0);
        }
        
        totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;

        // Atualizar ranking
        const { error: updateError } = await supabase
          .from('user_rankings')
          .update({
            score: totalScore,
            customDisciplineScores: disciplineScores,
            weightedCustomDisciplineScores: weightedDisciplineScores,
            weighted_discursive_score: weightedDiscursiveScore,
            weighted_case_study_1_score: weightedCaseStudy1Score,
            weighted_case_study_2_score: weightedCaseStudy2Score,
            weighted_case_study_3_score: weightedCaseStudy3Score
          })
          .eq('id', ranking.id);

        if (updateError) {
          console.error(`[recalculateAllUserScores] Error updating ranking ${ranking.id}:`, updateError);
          failedCount++;
          failedRecalculations.push({ rankingId: ranking.id, error: updateError });
        } else {
          successCount++;
          console.log(`[recalculateAllUserScores] Successfully updated ranking ${ranking.id} with score ${totalScore}`);
        }

      } catch (error) {
        console.error(`[recalculateAllUserScores] Error processing ranking ${ranking.id}:`, error);
        failedCount++;
        failedRecalculations.push({ rankingId: ranking.id, error });
      }
    }

    console.log(`[recalculateAllUserScores] Completed: ${successCount} successful, ${failedCount} failed`);
    
    if (failedCount > 0) {
      console.log(`[recalculateAllUserScores] ${failedCount} score recalculations failed`);
      failedRecalculations.forEach((failed, index) => {
        console.log(`Failed recalculation ${index}:`, failed.error);
      });
    }

    console.log(`[recalculateAllUserScores] Successfully recalculated ${successCount} of ${userRankings?.length || 0} scores`);

    return {
      success: true,
      updatedCount: successCount,
      details: {
        total: userRankings?.length || 0,
        successful: successCount,
        failed: failedCount,
        failures: failedRecalculations
      }
    };

  } catch (error) {
    console.error('[recalculateAllUserScores] Unexpected error:', error);
    return { 
      success: false, 
      error: `Erro inesperado durante o recálculo: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};
