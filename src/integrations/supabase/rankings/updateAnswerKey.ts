
import { supabase } from '../client';
import { toast } from 'sonner';

export interface AnswerKeyUpdate {
  id: string;
  question_number: number;
  answer: string;
}

export const updateAnswerKey = async (concursoId: string, updates: AnswerKeyUpdate[]): Promise<boolean> => {
  try {
    // Atualiza cada resposta do gabarito
    const updatePromises = updates.map(update => {
      return supabase
        .from('answer_keys')
        .update({ answer: update.answer })
        .eq('id', update.id)
        .eq('concurso_id', concursoId);
    });

    const results = await Promise.all(updatePromises);
    
    // Verifica se houve algum erro nas atualizações
    const hasError = results.some(result => result.error);
    if (hasError) {
      console.error('Erros ao atualizar gabarito:', results.filter(r => r.error).map(r => r.error));
      return false;
    }

    console.log('Gabarito atualizado com sucesso');
    
    // Recalcula as pontuações de todos os participantes
    await recalculateAllRankings(concursoId);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar gabarito:', error);
    return false;
  }
};

// Função para recalcular as pontuações de todos os participantes
export const recalculateAllRankings = async (concursoId: string): Promise<void> => {
  try {
    // Busca todos os rankings (participantes) deste concurso
    const { data: rankings, error: rankingError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('concurso_id', concursoId);
      
    if (rankingError) {
      throw rankingError;
    }
    
    if (!rankings || rankings.length === 0) {
      console.log('Nenhum participante encontrado para recalcular pontuação');
      return;
    }
    
    // Busca as informações do concurso para os pesos
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_weight,
        specific_knowledge_1_weight,
        specific_knowledge_2_weight,
        specific_knowledge_3_weight,
        specific_knowledge_weight,
        discursive_weight,
        case_study_1_weight,
        case_study_2_weight,
        case_study_3_weight,
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError || !concurso) {
      throw concursoError || new Error('Concurso não encontrado');
    }
    
    // Busca o gabarito oficial
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError || !answerKey) {
      throw keyError || new Error('Gabarito não encontrado');
    }
    
    // Para cada participante, recalcula a pontuação
    for (const ranking of rankings) {
      // Busca as respostas do usuário
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', ranking.id);
        
      if (answersError) {
        console.error(`Erro ao buscar respostas do usuário ${ranking.id}:`, answersError);
        continue;
      }
      
      if (!userAnswers || userAnswers.length === 0) {
        console.log(`Usuário ${ranking.id} não tem respostas registradas`);
        continue;
      }
      
      // Calcula pontuação para cada seção
      let basicScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;
      
      userAnswers.forEach(userAnswer => {
        const officialAnswer = answerKey.find(a => a.question_number === userAnswer.question_number);
        
        if (officialAnswer && officialAnswer.answer === userAnswer.answer) {
          if (userAnswer.is_basic_knowledge) {
            basicScore += 1;
          } else if (userAnswer.is_specific_1) {
            specific1Score += 1;
          } else if (userAnswer.is_specific_2) {
            specific2Score += 1;
          } else if (userAnswer.is_specific_3) {
            specific3Score += 1;
          }
        }
      });
      
      // Busca notas das seções discursivas
      const { data: rankingData } = await supabase
        .from('user_rankings')
        .select(`
          discursive_score,
          case_study_1_score,
          case_study_2_score,
          case_study_3_score
        `)
        .eq('id', ranking.id)
        .single();
      
      // Aplica os pesos e calcula pontuação final
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 
                             concurso.specific_knowledge_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      
      const weightedBasicScore = basicScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;
      
      // Calcula pontuação das seções discursivas
      const discursiveScore = rankingData?.discursive_score || 0;
      const caseStudy1Score = rankingData?.case_study_1_score || 0;
      const caseStudy2Score = rankingData?.case_study_2_score || 0;
      const caseStudy3Score = rankingData?.case_study_3_score || 0;
      
      const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
      const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
      const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
      const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);
      
      // Calcula pontuação total
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score +
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      // Atualiza a pontuação no ranking
      await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicScore,
          specific_knowledge_score: specific1Score + specific2Score + specific3Score,
          specific_knowledge_1_score: specific1Score,
          specific_knowledge_2_score: specific2Score,
          specific_knowledge_3_score: specific3Score,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', ranking.id);
    }
    
    console.log(`Recálculo concluído para ${rankings.length} participantes`);
    toast.success("Pontuações recalculadas com sucesso");
  } catch (error) {
    console.error('Erro ao recalcular pontuações:', error);
    toast.error("Erro ao recalcular pontuações");
  }
};
