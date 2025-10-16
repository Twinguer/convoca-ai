import { supabase } from '@/integrations/supabase/client';

export const testRecalculate = async () => {
  try {
    console.log('🔍 [testRecalculate] Iniciando teste...');
    
    const userId = '46f5c46a-43c7-40a0-84ee-2a1616f912a8';
    const concursoId = '44c3e864-9c12-4f41-9d12-40b2a1273b62';
    
    // 1. Buscar dados do concurso
    console.log('🔍 [testRecalculate] Buscando dados do concurso...');
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, titulo, disciplines, official_answers')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('❌ Erro ao buscar concurso:', concursoError);
      return;
    }

    console.log('✅ Concurso encontrado:', concurso.titulo);
    console.log('📊 Disciplinas:', concurso.disciplines);

    // 2. Buscar dados do usuário
    console.log('🔍 [testRecalculate] Buscando dados do usuário...');
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (userRankingError || !userRanking) {
      console.error('❌ Erro ao buscar usuário:', userRankingError);
      return;
    }

    console.log('✅ Usuário encontrado');
    console.log('📊 Consolidated data keys:', Object.keys(userRanking.consolidated_data?.rankings || {}));

    // 3. Encontrar rankingId
    let rankingId = null;
    if (userRanking.consolidated_data?.rankings) {
      for (const key in userRanking.consolidated_data.rankings) {
        const ranking = userRanking.consolidated_data.rankings[key];
        if (ranking.concurso_id === concursoId) {
          rankingId = key;
          break;
        }
      }
    }

    if (!rankingId) {
      console.error('❌ RankingId não encontrado');
      return;
    }

    console.log('✅ RankingId encontrado:', rankingId);

    // 4. Extrair respostas
    const rankingData = userRanking.consolidated_data.rankings[rankingId];
    const userAnswers: any[] = [];
    
    if (rankingData?.user_data?.answers) {
      const answersData = rankingData.user_data.answers;
      console.log('📊 Estrutura de respostas:', answersData);
      
      for (const blockId in answersData) {
        const blockData = answersData[blockId];
        if (typeof blockData === 'object' && blockData !== null) {
          for (const disciplineType in blockData) {
            const disciplineData = blockData[disciplineType];
            if (typeof disciplineData === 'object' && disciplineData !== null) {
              for (const questionNumber in disciplineData) {
                const questionNum = parseInt(questionNumber);
                if (!isNaN(questionNum)) {
                  userAnswers.push({
                    question_number: questionNum,
                    answer: disciplineData[questionNumber],
                    discipline_type: disciplineType
                  });
                }
              }
            }
          }
        }
      }
    }

    console.log(`✅ Encontradas ${userAnswers.length} respostas do usuário`);
    console.log('📊 Respostas:', userAnswers);

    // 5. Buscar gabarito
    console.log('🔍 [testRecalculate] Buscando gabarito...');
    const officialAnswers = concurso.official_answers?.booklets?.default?.answers || 
                           concurso.official_answers?.booklets?.[Object.keys(concurso.official_answers?.booklets || {})[0]]?.answers || {};

    console.log(`✅ Encontradas ${Object.keys(officialAnswers).length} respostas oficiais`);
    console.log('📊 Primeiras 3 respostas oficiais:', Object.entries(officialAnswers).slice(0, 3));

    // 6. Testar cálculo
    console.log('🔍 [testRecalculate] Testando cálculo...');
    const disciplineScores: Record<string, number> = {};
    let totalScore = 0;

    for (const userAnswer of userAnswers) {
      const questionNumberStr = userAnswer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];

      if (officialAnswer) {
        const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
        const questionWeight = officialAnswer.weight ?? 1;
        const disciplineType = userAnswer.discipline_type;

        if (!disciplineScores[disciplineType]) {
          disciplineScores[disciplineType] = 0;
        }

        if (isCorrect) {
          totalScore += questionWeight;
          disciplineScores[disciplineType] += questionWeight;
          console.log(`✅ Q${userAnswer.question_number}: ${userAnswer.answer} vs ${officialAnswer.correct_answer} - CORRETO (+${questionWeight})`);
        } else {
          console.log(`❌ Q${userAnswer.question_number}: ${userAnswer.answer} vs ${officialAnswer.correct_answer} - ERRADO`);
        }
      } else {
        console.log(`⚠️ Q${userAnswer.question_number}: Gabarito não encontrado`);
      }
    }

    console.log('📊 Pontuações calculadas:', disciplineScores);
    console.log('📊 Total score:', totalScore);

    return {
      userAnswers,
      officialAnswers: Object.keys(officialAnswers).length,
      disciplineScores,
      totalScore
    };

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};
