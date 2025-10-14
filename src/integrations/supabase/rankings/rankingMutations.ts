
import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure } from './examStructure';

interface RecalculationResponse {
  success: boolean;
  message?: string;
  error?: any;
  updatedScore?: number;
}

type PositionThreshold = 'ampla' | 'cota_racial' | 'pcd';

const isPositionThreshold = (value: string): value is PositionThreshold => {
  return ['ampla', 'cota_racial', 'pcd'].includes(value);
};

export const recalculateUserScore = async (userId: string, concursoId: string): Promise<RecalculationResponse> => {
  try {
    // console.log(`[recalculateUserScore] Recalculating scores for ranking`);
    
    // Obter dados do concurso para aplicar regras específicas - apenas campos necessários
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, disciplines, has_minimum_score, total_minimum_score, exam_type, alternatives_count, wrong_answer_penalty')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar dados do concurso:', concursoError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do concurso', 
        error: concursoError 
      };
    }
    
    // Log da estrutura de disciplinas do concurso
    console.log(`[recalculateUserScore] Concurso discipline structure:`, 
               concurso.disciplines && concurso.disciplines.length > 0 ? 
               `${concurso.disciplines.length} disciplines/blocks` : 'No custom disciplines');

    // Se o concurso exige pontuação mínima verificamos isso
    let minimumScoreRequired = 0;
    
    // Verificar se tem score mínimo e buscar o valor corretamente
    if (concurso?.has_minimum_score === true) {
      // Usar acesso seguro à propriedade para evitar erro TypeScript
      minimumScoreRequired = typeof concurso?.total_minimum_score === 'number' 
        ? concurso.total_minimum_score 
        : parseInt(String(concurso?.total_minimum_score || '0'), 10);
        
      console.log(`[recalculateUserScore] Pontuação mínima requerida: ${minimumScoreRequired}`);
    }

    // Primeiro, busque o ranking_id correspondente ao usuário/concurso
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .single();

    if (userRankingError || !userRanking) {
      console.error('Erro ao buscar ranking do usuário:', userRankingError);
      return { 
        success: false, 
        message: 'Erro ao buscar ranking do usuário', 
        error: userRankingError 
      };
    }

    // Obter as respostas do usuário usando consolidated_answers_by_concurso
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select('concurso_id, user_id, selected_booklet')
      .eq('id', userRanking.id)
      .single();

    if (rankingError) {
      console.error('Erro ao buscar dados do ranking:', rankingError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do ranking', 
        error: rankingError 
      };
    }

    const { data: consolidatedData, error: consolidatedError } = await supabase
      .from('consolidated_answers_by_concurso')
      .select('consolidated_data')
      .eq('concurso_id', rankingData.concurso_id)
      .single();

    if (consolidatedError) {
      console.log('Nenhum dado consolidado encontrado');
      return { 
        success: false, 
        message: 'Nenhum dado consolidado encontrado', 
        error: consolidatedError 
      };
    }

    // Extrair respostas do usuário específico
    const userData = consolidatedData.consolidated_data?.users?.[rankingData.user_id];
    const userAnswers: any[] = [];
    
    if (userData?.booklets) {
      const selectedBookletId = rankingData.selected_booklet?.toString();
      const bookletData = selectedBookletId ? userData.booklets[selectedBookletId] : null;
      
      if (bookletData?.answers) {
        Object.entries(bookletData.answers).forEach(([questionNumber, answer]) => {
          const questionNum = parseInt(questionNumber);
          if (!isNaN(questionNum)) {
            userAnswers.push({
              question_number: questionNum,
              answer: answer
            });
          }
        });
      }
    }
    
    console.log(`[recalculateUserScore] Found ${userAnswers?.length || 0} answers for user`);

    // Obter os pesos das respostas corretas usando a estrutura consolidada
    const { data: consolidatedAnswers, error: consolidatedAnswersError } = await supabase
      .from('concursos')
      .select('official_answers')
      .eq('id', concursoId)
      .single();

    if (consolidatedAnswersError) {
      console.error('Erro ao buscar pesos das respostas corretas:', consolidatedAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter pesos das respostas corretas', 
        error: consolidatedAnswersError 
      };
    }
    
    if (!consolidatedAnswers?.official_answers) {
      console.log('[recalculateUserScore] No official answers found');
      return { 
        success: false, 
        message: 'Gabarito não encontrado para este concurso' 
      };
    }

    const answerData = consolidatedAnswers.official_answers;
    const booklets = answerData.booklets || {};
    
    // Usar o primeiro caderno disponível ou 'default'
    const bookletIds = Object.keys(booklets);
    const primaryBooklet = booklets['default'] || booklets[bookletIds[0]];
    
    if (!primaryBooklet?.answers) {
      console.log('[recalculateUserScore] No answers found in consolidated data');
      return { 
        success: false, 
        message: 'Nenhuma resposta encontrada no gabarito consolidado' 
      };
    }

    const officialAnswers = primaryBooklet.answers;
    console.log(`[recalculateUserScore] Found ${Object.keys(officialAnswers).length} official answers`);

    let totalScore = 0;
    let totalWeight = 0;
    
    // Para armazenar pontuações por disciplina
    const disciplineScores: Record<string, number> = {};
    const weightedDisciplineScores: Record<string, number> = {};

    // Obter as pontuações subjetivas antes de calcular
    const { data: subjectiveScores, error: subjectiveScoresError } = await supabase
      .from('user_rankings')
      .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
      .eq('id', userRanking.id)
      .single();
      
    if (subjectiveScoresError) {
      console.error('Erro ao buscar pontuações subjetivas:', subjectiveScoresError);
    }
    
    // Pontuações subjetivas - usar subject_scores JSONB se disponível, senão campos diretos
    const subjectScores = subjectiveScores?.subject_scores || {};
    const discursiveScore = subjectScores.discursive || subjectiveScores?.discursive_score || 0;
    const caseStudy1Score = subjectScores.case_study_1 || subjectiveScores?.case_study_1_score || 0;
    const caseStudy2Score = subjectScores.case_study_2 || subjectiveScores?.case_study_2_score || 0;
    const caseStudy3Score = subjectScores.case_study_3 || subjectiveScores?.case_study_3_score || 0;
    const otherSubjectiveScore = subjectScores.other_subjective || 0;
    
    // Calcular pesos usando JSONB disciplines (prioridade) ou campos diretos (fallback)
    const getWeightFromDisciplines = (type: string): number => {
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        for (const discipline of concurso.disciplines) {
          if ('disciplines' in discipline) {
            // Estrutura hierárquica
            const found = discipline.disciplines?.find(d => d.type === type);
            if (found) return found.weight || 1;
          } else {
            // Estrutura plana
            if (discipline.type === type) return discipline.weight || 1;
          }
        }
      }
      return 1; // Fallback
    };
    
    const weightedDiscursiveScore = discursiveScore * getWeightFromDisciplines('discursive');
    const weightedCaseStudy1Score = caseStudy1Score * getWeightFromDisciplines('case_study_1');
    const weightedCaseStudy2Score = caseStudy2Score * getWeightFromDisciplines('case_study_2');
    const weightedCaseStudy3Score = caseStudy3Score * getWeightFromDisciplines('case_study_3');
    const weightedOtherSubjectiveScore = otherSubjectiveScore * getWeightFromDisciplines('other_subjective');

    // Processar pontuações da disciplina baseadas no JSON de disciplinas
    // SEMPRE usar a nova estrutura JSONB disciplines (prioridade máxima)
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      // Verificar se estamos lidando com estrutura hierárquica (blocos -> disciplinas)
      const hierarchical = isHierarchicalStructure(concurso);
      
      console.log(`[recalculateUserScore] Structure type: ${hierarchical ? 'hierarchical' : 'flat'}`);
      
      // Criar um mapeamento de tipo para peso com base no JSON de disciplinas
      const disciplineWeights: Record<string, number> = {};
      const disciplineNames: Record<string, string> = {};
      
      // Percorrer as disciplinas e extrair os pesos
      if (hierarchical) {
        // Estrutura hierárquica (blocos -> disciplinas)
        for (const block of concurso.disciplines) {
          if ('disciplines' in block && Array.isArray(block.disciplines)) {
            for (const discipline of block.disciplines) {
              if (discipline.isEnabled && discipline.type) {
                disciplineWeights[discipline.type] = discipline.weight ?? 1;
                disciplineNames[discipline.type] = discipline.name || discipline.type;
                
                // Inicializar pontuações como zero
                disciplineScores[discipline.type] = 0;
                weightedDisciplineScores[discipline.type] = 0;
              }
            }
          }
        }
      } else {
        // Estrutura plana (disciplinas diretamente)
        for (const discipline of concurso.disciplines) {
          if ('isEnabled' in discipline && discipline.isEnabled && discipline.type) {
            disciplineWeights[discipline.type] = discipline.weight ?? 1;
            disciplineNames[discipline.type] = discipline.name || discipline.type;
            
            // Inicializar pontuações como zero
            disciplineScores[discipline.type] = 0;
            weightedDisciplineScores[discipline.type] = 0;
          }
        }
      }
      
      console.log("[recalculateUserScore] Discipline weights:", disciplineWeights);
    }

    // Calcular a pontuação do usuário para cada resposta
    for (const userAnswer of userAnswers || []) {
      const questionNumberStr = userAnswer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];

      if (officialAnswer) {
        const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
        const questionWeight = officialAnswer.weight ?? 1;
        const sectionType = officialAnswer.section_type || 'default';
        
        // Inicializar pontuação da disciplina se ainda não existir
        if (!disciplineScores[sectionType]) {
          disciplineScores[sectionType] = 0;
          weightedDisciplineScores[sectionType] = 0;
        }
        
        if (isCorrect) {
          // Obter o peso para esta disciplina do JSON de disciplines
          let disciplineWeight = 1;
          
          // SEMPRE usar a nova estrutura JSONB disciplines
          if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
            const hierarchical = isHierarchicalStructure(concurso);
            
            if (hierarchical) {
              // Procurar em estrutura hierárquica
              for (const block of concurso.disciplines) {
                if ('disciplines' in block && Array.isArray(block.disciplines)) {
                  for (const discipline of block.disciplines) {
                    if (discipline.type === sectionType) {
                      disciplineWeight = discipline.weight ?? 1;
                      break;
                    }
                  }
                }
              }
            } else {
              // Procurar em estrutura plana
              for (const discipline of concurso.disciplines) {
                if ('type' in discipline && discipline.type === sectionType) {
                  disciplineWeight = discipline.weight ?? 1;
                  break;
                }
              }
            }
          }
          
          // Adicionar à pontuação total
          totalScore += questionWeight;
          
          // Adicionar à pontuação da disciplina específica
          disciplineScores[sectionType] += 1;
          weightedDisciplineScores[sectionType] += questionWeight * disciplineWeight;
          
          console.log(`[recalculateUserScore] Question ${userAnswer.question_number} correct (${sectionType}): +${questionWeight} * weight ${disciplineWeight}`);
        } else if (concurso.exam_type === 'Certo ou Errado') {
          const penalty = (concurso?.wrong_answer_penalty ?? 0);
          if (penalty > 0) {
            let disciplineWeight = 1;
            // SEMPRE usar a nova estrutura JSONB disciplines
          if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
              const hierarchical = isHierarchicalStructure(concurso);
              if (hierarchical) {
                for (const block of concurso.disciplines) {
                  if ('disciplines' in block && Array.isArray(block.disciplines)) {
                    for (const discipline of block.disciplines) {
                      if (discipline.type === sectionType) {
                        disciplineWeight = discipline.weight ?? 1;
                        break;
                      }
                    }
                  }
                }
              } else {
                for (const discipline of concurso.disciplines) {
                  if ('type' in discipline && discipline.type === sectionType) {
                    disciplineWeight = discipline.weight ?? 1;
                    break;
                  }
                }
              }
            }
            // Aplicar penalidade POR QUESTÃO (não por disciplina)
            totalScore -= penalty; // Penalidade é valor absoluto, não multiplicado pelo peso da questão
            // Mantemos disciplineScores como contagem de acertos (não decrementar em erro)
            weightedDisciplineScores[sectionType] -= penalty * disciplineWeight; // Penalidade multiplicada apenas pelo peso da disciplina
            
            console.log(`[recalculateUserScore] Question ${userAnswer.question_number} wrong (${sectionType}): -${penalty} penalty`);
          }
          // Se penalty = 0, não faz nada (resposta errada não impacta)
        }
        
        totalWeight += questionWeight;
      }
    }
    
    // Adicionar pontuações subjetivas ao total
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
    
    console.log(`[recalculateUserScore] Calculated total score: ${totalScore}, discipline scores:`, disciplineScores);
    console.log(`[recalculateUserScore] Weighted discipline scores:`, weightedDisciplineScores);
    console.log(`[recalculateUserScore] Subjective scores: discursive=${weightedDiscursiveScore}, caseStudy1=${weightedCaseStudy1Score}, caseStudy2=${weightedCaseStudy2Score}, caseStudy3=${weightedCaseStudy3Score}`);

    // Se estivermos usando pesos de disciplina customizados, recalcular a pontuação total
    // SEMPRE usar a nova estrutura JSONB disciplines (prioridade máxima)
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0 && Object.keys(weightedDisciplineScores).length > 0) {
      // Resetar a pontuação total para incluir apenas as pontuações ponderadas
      totalScore = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + score, 0);
      
      // Adicionar pontuações subjetivas ponderadas
      totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
      
      console.log(`[recalculateUserScore] Recalculated total with custom weights: ${totalScore}`);
    }

    // Atualizar a pontuação do usuário no ranking com as pontuações por disciplina
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({ 
        score: totalScore, 
        customDisciplineScores: disciplineScores,
        weightedCustomDisciplineScores: weightedDisciplineScores,
        // Manter as pontuações subjetivas
        discursive_score: discursiveScore,
        case_study_1_score: caseStudy1Score,
        case_study_2_score: caseStudy2Score,
        case_study_3_score: caseStudy3Score,
        // Manter as pontuações subjetivas ponderadas
        weighted_discursive_score: weightedDiscursiveScore,
        weighted_case_study_1_score: weightedCaseStudy1Score,
        weighted_case_study_2_score: weightedCaseStudy2Score,
        weighted_case_study_3_score: weightedCaseStudy3Score
      })
      .eq('id', userRanking.id);

    if (updateError) {
      console.error('Erro ao atualizar pontuação do usuário:', updateError);
      return { 
        success: false, 
        message: 'Erro ao atualizar pontuação do usuário', 
        error: updateError 
      };
    }
    
    // Verificar se o usuário atingiu a pontuação mínima
    if (minimumScoreRequired > 0 && totalScore < minimumScoreRequired) {
      // Atualizar o status do usuário para "eliminado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'eliminado' })
        .eq('id', userRanking.id);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    } else {
      // Se o usuário atingiu a pontuação mínima, atualizar o status para "classificado"
      const { error: updateStatusError } = await supabase
        .from('user_rankings')
        .update({ status: 'classificado' })
        .eq('id', userRanking.id);
        
      if (updateStatusError) {
        console.error('Erro ao atualizar status do usuário:', updateStatusError);
        return { 
          success: false, 
          message: 'Erro ao atualizar status do usuário', 
          error: updateStatusError 
        };
      }
    }

    return { 
        success: true, 
        message: 'Pontuação recalculada com sucesso', 
        updatedScore: totalScore 
    };
  } catch (error) {
    console.error('Erro ao recalcular pontuação:', error);
    return { 
      success: false, 
      message: 'Erro ao recalcular pontuação', 
      error: error 
    };
  }
};

export const getUserRankingPosition = async (
  userId: string,
  concursoId: string,
  cota?: string
): Promise<number | null> => {
  try {
    let query = supabase
      .from('user_rankings')
      .select('position')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId);

    if (cota && isPositionThreshold(cota)) {
      query = query.eq('cota', cota);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar posição do usuário:', error);
      return null;
    }

    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('vagas')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar número de vagas:', concursoError);
      return null;
    }

    const vacanciesCount = concurso?.vagas;

    // Corrigir a expressão com o operador > para verificar as posições
    // Verificamos valores válidos antes da comparação
    if (cota && isPositionThreshold(cota) && 
        typeof data?.[0]?.position === 'number' && 
        typeof vacanciesCount === 'number' && 
        data[0].position > vacanciesCount) {
      return null;
    }

    return data?.[0]?.position || null;
  } catch (error) {
    console.error('Erro ao obter posição do usuário:', error);
    return null;
  }
};
