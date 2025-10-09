
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
    // Log removido por segurança
    
    // Obter dados do concurso para aplicar regras específicas
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
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
    
    // Log removido por segurança

    // Se o concurso exige pontuação mínima verificamos isso
    let minimumScoreRequired = 0;
    
    // Verificar se tem score mínimo e buscar o valor corretamente
    if (concurso?.has_minimum_score === true) {
      // Usar acesso seguro à propriedade para evitar erro TypeScript
      minimumScoreRequired = typeof concurso?.total_minimum_score === 'number' 
        ? concurso.total_minimum_score 
        : parseInt(String(concurso?.total_minimum_score || '0'), 10);
        
      // Log removido por segurança
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

    // Obter as respostas do usuário usando o ranking_id
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_number, answer')
      .eq('user_ranking_id', userRanking.id);

    if (userAnswersError) {
      console.error('Erro ao buscar respostas do usuário:', userAnswersError);
      return { 
        success: false, 
        message: 'Erro ao obter respostas do usuário', 
        error: userAnswersError 
      };
    }
    
    console.log(`[recalculateUserScore] Found ${userAnswers?.length || 0} answers for user`);

    // Obter os pesos das respostas corretas usando a estrutura consolidada
    const { data: consolidatedAnswers, error: consolidatedError } = await supabase
      .from('official_answer_weights')
      .select('consolidated_answer_data')
      .eq('concurso_id', concursoId)
      .single();

    if (consolidatedError) {
      console.error('Erro ao buscar pesos das respostas corretas:', consolidatedError);
      return { 
        success: false, 
        message: 'Erro ao obter pesos das respostas corretas', 
        error: consolidatedError 
      };
    }
    
    if (!consolidatedAnswers?.consolidated_answer_data) {
      console.log('[recalculateUserScore] No consolidated answer data found');
      return { 
        success: false, 
        message: 'Gabarito não encontrado para este concurso' 
      };
    }

    const answerData = consolidatedAnswers.consolidated_answer_data;
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
    
    // Pontuações subjetivas e seus pesos
    const discursiveScore = subjectiveScores?.discursive_score || 0;
    const caseStudy1Score = subjectiveScores?.case_study_1_score || 0;
    const caseStudy2Score = subjectiveScores?.case_study_2_score || 0;
    const caseStudy3Score = subjectiveScores?.case_study_3_score || 0;
    
    const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
    const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
    const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
    const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);

    // Processar pontuações da disciplina baseadas no JSON de disciplinas
    if (concurso.has_custom_knowledge && concurso.disciplines && Array.isArray(concurso.disciplines)) {
      // Verificar se estamos lidando com estrutura hierárquica (blocos -> disciplinas)
      const hierarchical = isHierarchicalStructure(concurso);
      
      // Log removido por segurança
      
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
      
      // Log removido por segurança
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
          
          if (concurso.has_custom_knowledge && concurso.disciplines) {
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
          
          // Log removido por segurança
        } else if (concurso.exam_type === 'Certo ou Errado') {
          const penalty = (concurso?.wrong_answer_penalty ?? 0);
          if (penalty > 0) {
            let disciplineWeight = 1;
            if (concurso.has_custom_knowledge && concurso.disciplines) {
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
            
            // Log removido por segurança
          }
          // Se penalty = 0, não faz nada (resposta errada não impacta)
        }
        
        totalWeight += questionWeight;
      }
    }
    
    // Adicionar pontuações subjetivas ao total
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
    
    // Logs removidos por segurança

    // Se estivermos usando pesos de disciplina customizados, recalcular a pontuação total
    if (concurso.has_custom_knowledge && Object.keys(weightedDisciplineScores).length > 0) {
      // Resetar a pontuação total para incluir apenas as pontuações ponderadas
      totalScore = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + score, 0);
      
      // Adicionar pontuações subjetivas ponderadas
      totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score;
      
      // Log removido por segurança
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
