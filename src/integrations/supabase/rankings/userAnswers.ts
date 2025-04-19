
import { supabase } from '../client';

// Outras funções permanecem iguais

// Nova função para recalcular pontuações para todos os usuários quando o gabarito ou estrutura do exame muda
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Recalculando pontuações para todos os usuários no concurso: ${concursoId}`);
    
    // Obter todos os rankings de usuários para este concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('Nenhum ranking de usuário encontrado para este concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Encontrados ${userRankings.length} rankings de usuários para atualizar`);
    
    // Obter estrutura do exame e pesos
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions,
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Obter gabarito
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      console.log('Nenhum gabarito encontrado para este concurso');
      return { success: false, error: 'Gabarito oficial não encontrado' };
    }
    
    // Criar um conjunto de questões anuladas para busca rápida
    const nullifiedQuestions = new Set(
      answerKey
        .filter((q: any) => q.is_nullified)
        .map((q: any) => q.question_number)
    );
    
    console.log('Questões anuladas:', [...nullifiedQuestions]);
    
    // Processar cada ranking de usuário
    let updatedCount = 0;
    for (const ranking of userRankings) {
      // Obter respostas do usuário
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', ranking.id);
        
      if (answersError) {
        console.error(`Erro ao buscar respostas para o ranking de usuário ${ranking.id}:`, answersError);
        continue;
      }
      
      // Calcular limites de questões
      const basicEnd = concurso.basic_knowledge_questions || 0;
      const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
      const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
      
      // Calcular pontuações brutas
      let basicKnowledgeScore = 0;
      let specificKnowledgeScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;
      
      // Mapear todas as questões respondidas pelo usuário
      const answeredQuestions = new Set(userAnswers?.map((a: any) => a.question_number) || []);
      
      // Para cada questão anulada, verificar se o usuário já recebeu pontos por ela
      nullifiedQuestions.forEach(qNum => {
        if (!answeredQuestions.has(qNum)) {
          // Determinar a qual seção pertence esta questão
          if (qNum <= basicEnd) {
            basicKnowledgeScore += 1;
          } else if (qNum <= specific1End) {
            specific1Score += 1;
            specificKnowledgeScore += 1;
          } else if (qNum <= specific2End) {
            specific2Score += 1;
            specificKnowledgeScore += 1;
          } else {
            specific3Score += 1;
            specificKnowledgeScore += 1;
          }
        }
      });
      
      // Avaliar as respostas do usuário
      if (userAnswers && userAnswers.length > 0) {
        userAnswers.forEach((userAnswer: any) => {
          const qNum = userAnswer.question_number;
          
          // Verificar se a questão foi anulada
          const isNullified = nullifiedQuestions.has(qNum);
          
          // Obter a resposta oficial para esta questão
          const officialAnswer = answerKey.find((a: any) => a.question_number === qNum);
          
          // Se a questão foi anulada ou a resposta está correta, dar pontos
          const isCorrect = isNullified || (officialAnswer && officialAnswer.answer === userAnswer.answer);
          
          if (isCorrect) {
            if (userAnswer.is_basic_knowledge) {
              basicKnowledgeScore += 1;
            } else if (userAnswer.is_specific_1) {
              specific1Score += 1;
              specificKnowledgeScore += 1;
            } else if (userAnswer.is_specific_2) {
              specific2Score += 1;
              specificKnowledgeScore += 1;
            } else if (userAnswer.is_specific_3) {
              specific3Score += 1;
              specificKnowledgeScore += 1;
            }
          }
        });
      }
      
      // Obter notas subjetivas
      const { data: rankingData, error: rankingError } = await supabase
        .from('user_rankings')
        .select(`
          discursive_score,
          case_study_1_score,
          case_study_2_score,
          case_study_3_score
        `)
        .eq('id', ranking.id)
        .single();
        
      if (rankingError) {
        console.error(`Erro ao buscar notas subjetivas para o ranking ${ranking.id}:`, rankingError);
        continue;
      }
      
      // Obter pesos
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      const discursiveWeight = concurso.discursive_weight || 1;
      const caseStudy1Weight = concurso.case_study_1_weight || 1;
      const caseStudy2Weight = concurso.case_study_2_weight || 1;
      const caseStudy3Weight = concurso.case_study_3_weight || 1;
      
      // Calcular pontuações ponderadas
      const weightedBasicScore = basicKnowledgeScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;
      
      // Adicionar notas subjetivas
      const discursiveScore = (rankingData?.discursive_score || 0);
      const caseStudy1Score = (rankingData?.case_study_1_score || 0);
      const caseStudy2Score = (rankingData?.case_study_2_score || 0);
      const caseStudy3Score = (rankingData?.case_study_3_score || 0);
      
      const weightedDiscursiveScore = discursiveScore * discursiveWeight;
      const weightedCaseStudy1Score = caseStudy1Score * caseStudy1Weight;
      const weightedCaseStudy2Score = caseStudy2Score * caseStudy2Weight;
      const weightedCaseStudy3Score = caseStudy3Score * caseStudy3Weight;
      
      // Calcular pontuação total
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score +
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      console.log(`Notas do usuário ${ranking.user_id}:`, {
        básica: basicKnowledgeScore,
        específica1: specific1Score,
        específica2: specific2Score,
        específica3: specific3Score,
        básicaPonderada: weightedBasicScore,
        específica1Ponderada: weightedSpecific1Score,
        específica2Ponderada: weightedSpecific2Score,
        específica3Ponderada: weightedSpecific3Score,
        total: totalScore,
        pontosQuestõesAnuladas: [...nullifiedQuestions].length,
        pesos: {
          básico: basicWeight,
          específico1: specific1Weight,
          específico2: specific2Weight,
          específico3: specific3Weight
        }
      });
      
      // Atualizar o ranking
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          specific_knowledge_1_score: specific1Score,
          specific_knowledge_2_score: specific2Score,
          specific_knowledge_3_score: specific3Score,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', ranking.id);
        
      if (updateError) {
        console.error(`Erro ao atualizar pontuações para o ranking ${ranking.id}:`, updateError);
        continue;
      }
      
      updatedCount++;
    }
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Erro ao recalcular todas as pontuações do usuário:', error);
    return { success: false, error: error.message || 'Erro desconhecido' };
  }
};

// Função para salvar respostas do usuário e calcular pontuações
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // Primeiro, salvar as respostas do usuário
    const answersData = answers.map(a => {
      // Determinar a seção de conhecimento com base no número da questão
      const qNum = a.questionNumber;

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: a.isBasicKnowledge,
        is_specific_1: !a.isBasicKnowledge && a.questionNumber <= 0, // Será definido corretamente abaixo
        is_specific_2: !a.isBasicKnowledge && a.questionNumber <= 0, // Será definido corretamente abaixo
        is_specific_3: !a.isBasicKnowledge && a.questionNumber <= 0  // Será definido corretamente abaixo
      };
    });
    
    console.log('Salvando respostas do usuário:', answersData);
    
    // Excluir respostas existentes primeiro
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Obter dados do concurso para determinar intervalos de questões
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions,
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Calcular intervalos de questões
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
    
    // Definir flags de seção corretamente
    answersData.forEach(item => {
      const qNum = item.question_number;
      
      if (qNum <= basicEnd) {
        item.is_basic_knowledge = true;
        item.is_specific_1 = false;
        item.is_specific_2 = false;
        item.is_specific_3 = false;
      } else if (qNum <= specific1End) {
        item.is_basic_knowledge = false;
        item.is_specific_1 = true;
        item.is_specific_2 = false;
        item.is_specific_3 = false;
      } else if (qNum <= specific2End) {
        item.is_basic_knowledge = false;
        item.is_specific_1 = false;
        item.is_specific_2 = true;
        item.is_specific_3 = false;
      } else {
        item.is_basic_knowledge = false;
        item.is_specific_1 = false;
        item.is_specific_2 = false;
        item.is_specific_3 = true;
      }
    });
    
    console.log('Respostas atualizadas com flags de seção corretas:', answersData);
    
    // Inserir novas respostas
    if (answersData.length > 0) {
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(answersData);
        
      if (insertError) throw insertError;
    }
    
    // Obter o gabarito oficial
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    console.log('Gabarito oficial:', answerKey);
    console.log('Respostas do usuário para verificar:', answers);
    
    // Criar um conjunto de questões anuladas para busca rápida
    const nullifiedQuestions = new Set(
      answerKey
        .filter((q: any) => q.is_nullified)
        .map((q: any) => q.question_number)
    );
    
    console.log('Questões anuladas:', [...nullifiedQuestions]);
    
    // Calcular pontuação comparando respostas do usuário com respostas oficiais
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;
    
    // Para cada questão anulada, verificar se o usuário já recebeu pontos por ela
    nullifiedQuestions.forEach(qNum => {
      const userHasAnswered = answers.some(a => a.questionNumber === qNum);
      
      if (!userHasAnswered) {
        // Determinar a qual seção pertence esta questão
        if (qNum <= basicEnd) {
          basicKnowledgeScore += 1;
        } else if (qNum <= specific1End) {
          specific1Score += 1;
          specificKnowledgeScore += 1;
        } else if (qNum <= specific2End) {
          specific2Score += 1;
          specificKnowledgeScore += 1;
        } else {
          specific3Score += 1;
          specificKnowledgeScore += 1;
        }
      }
    });
    
    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        (a: any) => a.question_number === userAnswer.questionNumber
      );
      
      // Dar pontos para questões anuladas ou respostas corretas
      if (officialAnswer && (nullifiedQuestions.has(userAnswer.questionNumber) || 
                             officialAnswer.answer === userAnswer.answer)) {
        if (userAnswer.isBasicKnowledge) {
          basicKnowledgeScore += 1;
        } else {
          specificKnowledgeScore += 1;
          
          // Comparar número da questão com intervalos para determinar a seção
          const qNum = userAnswer.questionNumber;
          
          if (qNum > basicEnd && qNum <= specific1End) {
            specific1Score += 1;
          } else if (qNum > specific1End && qNum <= specific2End) {
            specific2Score += 1;
          } else if (qNum > specific2End) {
            specific3Score += 1;
          }
        }
      }
    });
    
    console.log('Pontuações brutas calculadas:', {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score
    });
    
    // Obter pesos do concurso
    const basicWeight = concurso.basic_knowledge_weight || 1;
    const specific1Weight = concurso.specific_knowledge_1_weight || 1;
    const specific2Weight = concurso.specific_knowledge_2_weight || 1;
    const specific3Weight = concurso.specific_knowledge_3_weight || 1;
    
    console.log('Pesos recuperados do banco de dados:', {
      basicWeight,
      specific1Weight,
      specific2Weight,
      specific3Weight,
      concursoData: concurso
    });
    
    // Calcular pontuações ponderadas
    const weightedBasicScore = basicKnowledgeScore * basicWeight;
    const weightedSpecific1Score = specific1Score * specific1Weight;
    const weightedSpecific2Score = specific2Score * specific2Weight;
    const weightedSpecific3Score = specific3Score * specific3Weight;
    
    // Obter pontuações subjetivas existentes do user_rankings para incluir na pontuação total
    const { data: rankingData, error: rankingError } = await supabase
      .from('user_rankings')
      .select(`
        discursive_score,
        case_study_1_score,
        case_study_2_score,
        case_study_3_score
      `)
      .eq('id', rankingId)
      .single();
      
    if (rankingError) {
      console.error('Erro ao buscar pontuações subjetivas existentes:', rankingError);
    }
    
    // Calcular pontuações subjetivas com pesos
    const discursiveScore = (rankingData?.discursive_score || 0);
    const caseStudy1Score = (rankingData?.case_study_1_score || 0);
    const caseStudy2Score = (rankingData?.case_study_2_score || 0);
    const caseStudy3Score = (rankingData?.case_study_3_score || 0);
    
    const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
    const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
    const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
    const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);
    
    console.log('Pontuações subjetivas:', {
      discursiveScore,
      weightedDiscursiveScore,
      caseStudy1Score,
      weightedCaseStudy1Score,
      caseStudy2Score,
      weightedCaseStudy2Score,
      caseStudy3Score,
      weightedCaseStudy3Score
    });
    
    // Calcular pontuação total incluindo pontuações subjetivas
    const totalScore = 
      weightedBasicScore + 
      weightedSpecific1Score + 
      weightedSpecific2Score + 
      weightedSpecific3Score +
      weightedDiscursiveScore +
      weightedCaseStudy1Score +
      weightedCaseStudy2Score +
      weightedCaseStudy3Score;
    
    console.log('Pontuações ponderadas:', {
      weightedBasicScore,
      weightedSpecific1Score,
      weightedSpecific2Score,
      weightedSpecific3Score,
      totalWithObjective: weightedBasicScore + weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
      totalWithSubjective: totalScore,
      pesos: {
        básico: basicWeight,
        específico1: specific1Weight,
        específico2: specific2Weight,
        específico3: specific3Weight,
        discursiva: concurso.discursive_weight || 1,
        estudoDeCaso1: concurso.case_study_1_weight || 1,
        estudoDeCaso2: concurso.case_study_2_weight || 1,
        estudoDeCaso3: concurso.case_study_3_weight || 1
      }
    });
    
    // Atualizar ranking do usuário com pontuações
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        specific_knowledge_1_score: specific1Score,
        specific_knowledge_2_score: specific2Score,
        specific_knowledge_3_score: specific3Score,
        score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      basicKnowledgeScore, 
      specificKnowledgeScore, 
      specific1Score,
      specific2Score,
      specific3Score,
      totalScore 
    };
  } catch (error: any) {
    console.error('Erro ao salvar respostas e calcular pontuação:', error);
    throw error;
  }
};
