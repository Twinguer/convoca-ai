
import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure, getDisciplineWeights, getDisciplineMinimums, getBlockMinimumMaps } from './examStructure';
import { migrateObjectScores, createInitialObjectScores } from '@/utils/consolidatedDataMapper';
import { scoreObjectiveAnswer, type ExamType } from '@/services/scoring';

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

// Helper function to safely extract wrong_answer_penalty from disciplines
const getWrongAnswerPenalty = (disciplines: any): number => {
  if (!disciplines) return 0;
  
  // Nova estrutura (objeto com wrong_answer_penalty diretamente)
  if (typeof disciplines === 'object' && !Array.isArray(disciplines) && 'wrong_answer_penalty' in disciplines) {
    return Number(disciplines.wrong_answer_penalty) || 0;
  }
  
  // Estrutura antiga (array) - não tem penalidade
  return 0;
};

export const recalculateUserScore = async (userId: string, concursoId: string): Promise<RecalculationResponse> => {
  try {
    console.log(`[recalculateUserScore] 🚀 INICIANDO recálculo para usuário ${userId} no concurso ${concursoId}`);
    
    // Obter dados do concurso para aplicar regras específicas - apenas campos necessários
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, disciplines, subjects, exam_type, alternatives_count, official_answers, has_minimum_score, total_minimum_score, has_quota_minimum_score, quota_minimum_score')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error(`[recalculateUserScore] ❌ ERRO ao buscar concurso ${concursoId}:`, concursoError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do concurso', 
        error: concursoError 
      };
    }
    
    console.log(`[recalculateUserScore] ✅ Concurso encontrado: ${concurso.titulo || 'Sem título'}`);
    
    // Log da estrutura de disciplinas do concurso
    console.log(`[recalculateUserScore] Concurso discipline structure:`, 
               concurso.disciplines && concurso.disciplines.length > 0 ? 
               `${concurso.disciplines.length} disciplines/blocks` : 'No custom disciplines');

    // Se o concurso exige pontuação mínima verificamos isso
    let minimumScoreRequired = 0;
    
    // Verificar se tem score mínimo e buscar o valor corretamente
    const subjects = concurso?.subjects || {};
    if (subjects.discr || subjects.case1 || subjects.case2 || subjects.case3 || subjects.other) {
      // Usar o maior mínimo entre as seções subjetivas
      minimumScoreRequired = Math.max(
        subjects.discr_min_score || 0,
        subjects.case1_min_score || 0,
        subjects.case2_min_score || 0,
        subjects.case3_min_score || 0,
        subjects.other_min_score || 0
      );
        
      console.log(`[recalculateUserScore] Pontuação mínima requerida: ${minimumScoreRequired}`);
    }

    // Primeiro, busque o ranking correspondente ao usuário/concurso
    console.log(`[recalculateUserScore] 🔍 Buscando ranking para user ${userId} e concurso ${concursoId}`);
    
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .eq('user_id', userId)
      .maybeSingle();

    console.log(`[recalculateUserScore] 📊 Dados do ranking encontrados:`, {
      found: !!userRanking,
      error: userRankingError?.message,
      consolidatedData: userRanking?.consolidated_data
    });

    if (userRankingError || !userRanking) {
      console.error(`[recalculateUserScore] ❌ ERRO ao buscar usuário ${userId}:`, userRankingError);
      return { 
        success: false, 
        message: 'Erro ao buscar ranking do usuário', 
        error: userRankingError 
      };
    }
    
    console.log(`[recalculateUserScore] ✅ Usuário encontrado`);

    // Buscar o rankingId correto no consolidated_data
    let rankingId = null;
    console.log(`[recalculateUserScore] 🔍 Buscando rankingId para concurso ${concursoId}`);
    console.log(`[recalculateUserScore] 📊 Rankings disponíveis:`, Object.keys(userRanking.consolidated_data?.rankings || {}));
    
    if (userRanking.consolidated_data?.rankings) {
      for (const key in userRanking.consolidated_data.rankings) {
        const ranking = userRanking.consolidated_data.rankings[key];
        console.log(`[recalculateUserScore] 🔍 Verificando ranking ${key}:`, {
          concurso_id: ranking.concurso_id,
          matches: ranking.concurso_id === concursoId
        });
        if (ranking.concurso_id === concursoId) {
          rankingId = key;
          console.log(`[recalculateUserScore] ✅ RankingId encontrado: ${rankingId}`);
          break;
        }
      }
    }

    if (!rankingId) {
      console.error(`[recalculateUserScore] ❌ Usuário ${userId} não está participando do concurso ${concursoId}`);
      console.error(`[recalculateUserScore] 📊 Rankings disponíveis:`, Object.keys(userRanking.consolidated_data?.rankings || {}));
      return { 
        success: false, 
        message: 'Usuário não está participando deste concurso'
      };
    }
    
    console.log(`[recalculateUserScore] ✅ RankingId encontrado: ${rankingId}`);

    // Obter as respostas do usuário usando user_rankings consolidated_data
    const { data: userRankingData, error: consolidatedError } = await supabase
      .from('user_rankings')
      .select('consolidated_data')
      .eq('user_id', userRanking.user_id)
      .maybeSingle();

    if (consolidatedError) {
      console.error('Erro ao buscar dados consolidados:', consolidatedError);
      return { 
        success: false, 
        message: 'Erro ao obter dados do ranking', 
        error: consolidatedError 
      };
    }

    // Extrair respostas do usuário específico
    const rankingDataFromConsolidated = userRankingData.consolidated_data?.rankings?.[rankingId];
    const userAnswers: any[] = [];
    
    if (rankingDataFromConsolidated?.user_data?.answers) {
      const answersData = rankingDataFromConsolidated.user_data.answers;

      // DEBUG: Log para entender a estrutura
      console.log('[recalculateUserScore] DEBUG - Estrutura de respostas:', {
        answersStructure: answersData,
        answersType: typeof answersData,
        answersKeys: answersData ? Object.keys(answersData) : 'no answers'
      });

      // DEBUG: Log detalhado da estrutura hierárquica
      if (answersData && typeof answersData === 'object') {
        console.log('[recalculateUserScore] DEBUG - Estrutura hierárquica detalhada:');
        for (const blockId in answersData) {
          const blockData = answersData[blockId];
          console.log(`[recalculateUserScore] DEBUG - Bloco ${blockId}:`, blockData);
          if (typeof blockData === 'object' && blockData !== null) {
            for (const disciplineType in blockData) {
              const disciplineData = blockData[disciplineType];
              console.log(`[recalculateUserScore] DEBUG - Disciplina ${disciplineType}:`, disciplineData);
              if (typeof disciplineData === 'object' && disciplineData !== null) {
                const questionNumbers = Object.keys(disciplineData);
                console.log(`[recalculateUserScore] DEBUG - Questões da disciplina ${disciplineType}:`, questionNumbers);
              }
            }
          }
        }
      }

      // Processar estrutura hierárquica diretamente (blocos -> disciplinas -> questões)
      if (answersData && typeof answersData === 'object') {
        for (const blockId in answersData) {
          const blockData = answersData[blockId];
          if (typeof blockData === 'object' && blockData !== null) {
            console.log(`[recalculateUserScore] Processando bloco ${blockId}:`, blockData);
            for (const disciplineType in blockData) { // Mudança: usar disciplineType
              const disciplineData = blockData[disciplineType];
              if (typeof disciplineData === 'object' && disciplineData !== null) {
                console.log(`[recalculateUserScore] Processando disciplina ${disciplineType}:`, disciplineData);
                for (const questionNumber in disciplineData) {
                  const questionNum = parseInt(questionNumber);
                  if (!isNaN(questionNum)) {
                    userAnswers.push({
                      question_number: questionNum,
                      answer: disciplineData[questionNumber],
                      discipline_type: disciplineType // Adicionar disciplina para mapeamento
                    });
                    console.log(`[recalculateUserScore] Adicionada resposta: Q${questionNum} = ${disciplineData[questionNumber]} (disciplina: ${disciplineType})`);
                  }
                }
              }
            }
          }
        }
      } else {
        console.log('[recalculateUserScore] WARNING: Nenhuma resposta encontrada no consolidated_data');
      }
    }
    
    console.log(`[recalculateUserScore] Found ${userAnswers?.length || 0} answers for user`);
    console.log(`[recalculateUserScore] User answers:`, userAnswers);

    // Usar official_answers já buscado do concurso
    if (!concurso?.official_answers) {
      console.log('[recalculateUserScore] No official answers found');
      return { 
        success: false, 
        message: 'Gabarito não encontrado para este concurso' 
      };
    }

    console.log(`[recalculateUserScore] 🔍 DEBUG - official_answers:`, concurso.official_answers);
    
    const answerData = concurso.official_answers;
    console.log(`[recalculateUserScore] 🔍 DEBUG - answerData:`, answerData);
    
    if (!answerData) {
      console.log('[recalculateUserScore] ❌ official_answers está vazio ou undefined');
      return { 
        success: false, 
        message: 'Gabarito oficial não encontrado' 
      };
    }
    
    // A estrutura real tem os cadernos diretamente no primeiro nível
    const booklets = answerData || {};
    console.log(`[recalculateUserScore] 🔍 DEBUG - booklets:`, booklets);
    
    // Buscar o selected_booklet_id do usuário
    const currentUserRankingData = userRanking.consolidated_data?.rankings?.[rankingId];
    const selectedBookletId = currentUserRankingData?.selected_booklet_id;
    
    console.log(`[recalculateUserScore] 🔍 DEBUG - selectedBookletId:`, selectedBookletId);
    
    if (!selectedBookletId) {
      console.log('[recalculateUserScore] ❌ selected_booklet_id não encontrado');
      return { 
        success: false, 
        message: 'Caderno selecionado não encontrado' 
      };
    }
    
    // Usar o gabarito do caderno selecionado pelo usuário
    const selectedBooklet = booklets[selectedBookletId];
    console.log(`[recalculateUserScore] 🔍 DEBUG - selectedBooklet:`, selectedBooklet);
    
    if (!selectedBooklet?.questions) {
      console.log('[recalculateUserScore] ❌ No questions found in selected booklet');
      console.log('[recalculateUserScore] ❌ selectedBooklet:', selectedBooklet);
      return { 
        success: false, 
        message: `Gabarito não encontrado para o caderno ${selectedBookletId}` 
      };
    }

    const officialAnswers = selectedBooklet.questions;
    console.log(`[recalculateUserScore] Found ${Object.keys(officialAnswers).length} official answers`);

    let totalScore = 0;
    let totalWeight = 0;
    
    // Para armazenar pontuações por disciplina
    const disciplineScores: Record<string, number> = {};
    const weightedDisciplineScores: Record<string, number> = {};

    // Determinar tipo de reserva (antes para usar em mínimos por cota)
    const reservationType = (() => {
      const raw = userRanking.consolidated_data?.rankings?.[rankingId]?.user_data?.reservation_type || '';
      return raw === 'Ampla Concorrência' ? 'ampla' : (raw || 'ampla');
    })();
    const isQuota = reservationType !== 'ampla' && reservationType !== '';

    // Criar mapeamento de section_type para discipline.type
    const sectionTypeToDisciplineTypeMap: Record<string, string> = {};
    const disciplineWeights: Record<string, number> = getDisciplineWeights(concurso);
    const disciplineMinimums: Record<string, number> = getDisciplineMinimums(concurso, isQuota);

    // Percorrer as disciplinas do concurso para criar o mapeamento
    // Nova estrutura JSONB: objeto com blocks
    // Mapear section_type -> discipline.type para uso com official_answers
    if (concurso.disciplines) {
      if (typeof concurso.disciplines === 'object' && (concurso.disciplines as any).blocks) {
        for (const block of (concurso.disciplines as any).blocks) {
          if (block?.disciplines && Array.isArray(block.disciplines)) {
            for (const d of block.disciplines) {
              if (d?.type && d.isEnabled) sectionTypeToDisciplineTypeMap[d.type] = d.type;
            }
          }
        }
      } else if (Array.isArray(concurso.disciplines)) {
        for (const item of concurso.disciplines) {
          if ((item as any)?.disciplines && Array.isArray((item as any).disciplines)) {
            for (const d of (item as any).disciplines) {
              if (d?.type && d.isEnabled) sectionTypeToDisciplineTypeMap[d.type] = d.type;
            }
          } else if ((item as any)?.type) {
            const d = item as any;
            if (d?.type && d.isEnabled) sectionTypeToDisciplineTypeMap[d.type] = d.type;
          }
        }
      }
    }

    // DEBUG: Log do mapeamento criado
    console.log('[recalculateUserScore] DEBUG - Mapeamento section_type -> discipline.type:', sectionTypeToDisciplineTypeMap);
    console.log('[recalculateUserScore] DEBUG - Pesos das disciplinas:', disciplineWeights);
    console.log('[recalculateUserScore] DEBUG - Mínimos das disciplinas:', disciplineMinimums);

    console.log('[recalculateUserScore] Mapeamento section_type -> discipline.type:', sectionTypeToDisciplineTypeMap);
    console.log('[recalculateUserScore] Pesos das disciplinas:', disciplineWeights);
    console.log('[recalculateUserScore] Mínimos das disciplinas:', disciplineMinimums);

    // Obter as pontuações subjetivas do consolidated_data
    const subjectiveScores = userRanking.consolidated_data?.rankings?.[rankingId]?.user_data?.subjectives || {};
    
    // Pontuações subjetivas do consolidated_data
    const discursiveScore = subjectiveScores.discursive || 0;
    const caseStudy1Score = subjectiveScores.case_study_1 || 0;
    const caseStudy2Score = subjectiveScores.case_study_2 || 0;
    const caseStudy3Score = subjectiveScores.case_study_3 || 0;
    const otherSubjectiveScore = subjectiveScores.other_subjective || 0;
    
    // Usar o mapa de pesos já normalizado
    const getWeightFromDisciplines = (type: string): number => Number(disciplineWeights[type] ?? 1);
    
    const weightedDiscursiveScore = discursiveScore * getWeightFromDisciplines('discursive');
    const weightedCaseStudy1Score = caseStudy1Score * getWeightFromDisciplines('case_study_1');
    const weightedCaseStudy2Score = caseStudy2Score * getWeightFromDisciplines('case_study_2');
    const weightedCaseStudy3Score = caseStudy3Score * getWeightFromDisciplines('case_study_3');
    const weightedOtherSubjectiveScore = otherSubjectiveScore * getWeightFromDisciplines('other_subjective');

    // Inicializar pontuações para todas as disciplinas habilitadas conhecidas
    Object.keys(disciplineWeights).forEach(type => {
      disciplineScores[type] = 0;
      weightedDisciplineScores[type] = 0;
    });

    // Calcular a pontuação do usuário para cada resposta
    for (const userAnswer of userAnswers || []) {
      const questionNumberStr = userAnswer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];

      if (officialAnswer) {
        const questionWeight = officialAnswer.weight ?? 1;
        const isNullified = officialAnswer.is_nullified === true;
        const sectionType = officialAnswer.section_type || 'default';
        
        // Usar o section_type do gabarito para mapear corretamente para a disciplina
        const disciplineType = sectionTypeToDisciplineTypeMap[sectionType] || sectionType;
        
        // Inicializar pontuação da disciplina se ainda não existir (apenas para tipos não mapeados)
        if (disciplineScores[disciplineType] === undefined) {
          disciplineScores[disciplineType] = 0;
          weightedDisciplineScores[disciplineType] = 0;
        }
        
        // Obter peso da disciplina do mapeamento
        const disciplineWeight = disciplineWeights[disciplineType] || 1;
        
        // Determinar se resposta está em branco
        const isBlank = !userAnswer.answer || userAnswer.answer.trim() === '';
        
        // Determinar se resposta está correta (ignorando anuladas)
        const isCorrect = !isNullified && userAnswer.answer === officialAnswer.correct_answer;
        
        // Obter penalidade para C/E (se aplicável)
        const wrongAnswerPenalty = concurso.exam_type === 'Certo ou Errado' 
          ? getWrongAnswerPenalty(concurso.disciplines)
          : 0;
        
        // Debug para entender o estado da questão
        console.log(`[recalculateUserScore] DEBUG - Question ${userAnswer.question_number}:`, {
          userAnswer: userAnswer.answer,
          officialAnswer: officialAnswer.correct_answer,
          sectionType,
          disciplineType,
          isCorrect,
          isNullified,
          isBlank,
          questionWeight,
          disciplineWeight,
          wrongAnswerPenalty,
          examType: concurso.exam_type
        });
        
        // Usar a função scoreObjectiveAnswer para calcular o delta
        const scoringResult = scoreObjectiveAnswer({
          examType: concurso.exam_type as ExamType,
          wrongAnswerPenalty: wrongAnswerPenalty,
          questionWeight: questionWeight,
          disciplineWeight: disciplineWeight,
          isCorrect: isCorrect,
          isNullified: isNullified,
          isBlank: isBlank
        });
        
        // Aplicar os deltas calculados
        totalScore += scoringResult.totalDelta;
        disciplineScores[disciplineType] += scoringResult.disciplineDelta;
        weightedDisciplineScores[disciplineType] += scoringResult.weightedDisciplineDelta;
        
        console.log(`[recalculateUserScore] Question ${userAnswer.question_number} scoring result:`, {
          totalDelta: scoringResult.totalDelta,
          disciplineDelta: scoringResult.disciplineDelta,
          weightedDisciplineDelta: scoringResult.weightedDisciplineDelta,
          newTotalScore: totalScore,
          newDisciplineScore: disciplineScores[disciplineType],
          newWeightedDisciplineScore: weightedDisciplineScores[disciplineType]
        });
        
        totalWeight += questionWeight;
      }
    }
    
    // Adicionar pontuações subjetivas ao total
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
    
    console.log(`[recalculateUserScore] Calculated total score: ${totalScore}, discipline scores:`, disciplineScores);
    console.log(`[recalculateUserScore] Weighted discipline scores:`, weightedDisciplineScores);
    console.log(`[recalculateUserScore] Subjective scores: discursive=${weightedDiscursiveScore}, caseStudy1=${weightedCaseStudy1Score}, caseStudy2=${weightedCaseStudy2Score}, caseStudy3=${weightedCaseStudy3Score}, other=${weightedOtherSubjectiveScore}`);

    // ✅ TOTAIS CALCULADOS CORRETAMENTE ACIMA (com penalidades para C/E)
    // Calcular totais objetivos apenas para logs/debug e verificação de mínimos
    const objectiveSimpleTotal = Object.values(disciplineScores).reduce((sum, score) => sum + (score || 0), 0);
    const objectiveWeightedTotal = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + (score || 0), 0);

    // ⚠️ NÃO sobrescrever totalScore! Ele já foi calculado corretamente no loop acima
    // disciplineScores = contagem de acertos (não inclui penalidades)
    // weightedDisciplineScores = pontuação com penalidades aplicadas (para C/E)
    // totalScore já inclui TUDO: acertos + penalidades + subjetivas

    console.log(`[recalculateUserScore] ✅ Final totals (already calculated correctly):`, {
      totalScore, // JÁ INCLUI penalidades + subjetivas
      objectiveSimpleTotal, // Contagem de acertos (sem penalidades)
      objectiveWeightedTotal, // Com penalidades (para C/E) ou pesos (para Alternativas)
      examType: concurso.exam_type
    });

    // Calcular totais
    const subjectScoresTot = Object.values(disciplineScores).reduce((sum, score) => sum + score, 0);
    const subjectiveScoresTot = discursiveScore + caseStudy1Score + caseStudy2Score + caseStudy3Score + otherSubjectiveScore;
    
    // Criar estrutura correta de subject_scores (APENAS objetivas)
    const correctSubjectScores: Record<string, number> = {};

    // Percorrer as disciplinas do concurso para criar subject_scores dinamicamente - NOVA ESTRUTURA COMPATÍVEL
    // Verificar se é a nova estrutura hierárquica (objeto com blocks)
    if (concurso.disciplines && typeof concurso.disciplines === 'object' && !Array.isArray(concurso.disciplines) && concurso.disciplines.blocks) {
      console.log('[recalculateUserScore] Usando nova estrutura hierárquica com blocks');
      
      for (const block of concurso.disciplines.blocks) {
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Incluir todas as disciplinas objetivas (não apenas custom_)
              const isObjectiveDiscipline = !['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type);
              
              if (isObjectiveDiscipline) {
                const score = weightedDisciplineScores[discipline.type] || 0;
                const minimum = disciplineMinimums[discipline.type] || 0;
                
                // Verificar se atingiu pontuação mínima
                if (score < minimum) {
                  console.log(`[recalculateUserScore] WARNING: Discipline ${discipline.type} below minimum: ${score} < ${minimum}`);
                }
                
                correctSubjectScores[discipline.type] = score;
                console.log(`[recalculateUserScore] DEBUG - Disciplina objetiva ${discipline.type}: score=${score}, minimum=${minimum}`);
              }
            }
          }
        }
      }
    }
    // Verificar se é array (estrutura antiga)
    else if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      console.log('[recalculateUserScore] Usando estrutura de disciplinas (array)');
      
      for (const block of concurso.disciplines) {
        if ('disciplines' in block && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Incluir todas as disciplinas objetivas (não apenas custom_)
              const isObjectiveDiscipline = !['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type);
              
              if (isObjectiveDiscipline) {
                const score = weightedDisciplineScores[discipline.type] || 0;
                const minimum = disciplineMinimums[discipline.type] || 0;
                
                // Verificar se atingiu pontuação mínima
                if (score < minimum) {
                  console.log(`[recalculateUserScore] WARNING: Discipline ${discipline.type} below minimum: ${score} < ${minimum}`);
                }
                
                correctSubjectScores[discipline.type] = score;
                console.log(`[recalculateUserScore] DEBUG - Disciplina objetiva ${discipline.type}: score=${score}, minimum=${minimum}`);
              }
            }
          }
        }
      }
    }

    console.log('[recalculateUserScore] DEBUG - correctSubjectScores:', correctSubjectScores);
    console.log('[recalculateUserScore] DEBUG - disciplineScores calculados:', disciplineScores);
    
    // Criar estrutura correta de subjectives (TODAS as subjetivas)
    const correctSubjectives = {
      "discursive": discursiveScore || 0,
      "case_study_1": caseStudy1Score || 0,
      "case_study_2": caseStudy2Score || 0,
      "case_study_3": caseStudy3Score || 0,
      "other_subjective": otherSubjectiveScore || 0
    };

    // ===== NEW: Minimum thresholds evaluation =====
    const belowDisciplineMinimums: string[] = [];
    const belowBlockMinimums: string[] = [];

    // Determinar se devemos usar pontuação ponderada para mínimos
    // Para "Certo ou Errado", questões sempre valem 1 ponto (não ponderado)
    const useWeightedScoring = concurso.exam_type !== 'Certo ou Errado';
    
    console.log(`[recalculateUserScore] Minimum scoring mode: exam_type=${concurso.exam_type}, useWeightedScoring=${useWeightedScoring}`);

    // 1) Discipline-level minimums (objective disciplines)
    const scoresToCheckForDisciplines = useWeightedScoring ? weightedDisciplineScores : disciplineScores;
    for (const [discType, score] of Object.entries(scoresToCheckForDisciplines)) {
      const min = disciplineMinimums[discType] || 0;
      if (min > 0 && score < min) {
        belowDisciplineMinimums.push(discType);
        console.log(`[recalculateUserScore] Disciplina ${discType} abaixo do mínimo: ${score} < ${min} (weighted=${useWeightedScoring})`);
      }
    }

    // 2) Subjective minimums from concurso.subjects (considering quota type)
    const subj = (concurso as any).subjects || {};
    
    // ✅ Aplicar mínimos corretos baseado no tipo de cota do usuário
    const discursiveMin = isQuota ? (subj.discr_min_score_cotas || 0) : (subj.discr_min_score || 0);
    const case1Min = isQuota ? (subj.case1_min_score_cotas || 0) : (subj.case1_min_score || 0);
    const case2Min = isQuota ? (subj.case2_min_score_cotas || 0) : (subj.case2_min_score || 0);
    const case3Min = isQuota ? (subj.case3_min_score_cotas || 0) : (subj.case3_min_score || 0);
    const otherMin = isQuota ? (subj.other_min_score_cotas || 0) : (subj.other_min_score || 0);
    
    console.log(`[recalculateUserScore] Subjective minimums for ${isQuota ? 'quota' : 'ampla'}:`, {
      discursive: discursiveMin,
      case1: case1Min,
      case2: case2Min,
      case3: case3Min,
      other: otherMin
    });
    
    if (discursiveMin > 0 && (discursiveScore || 0) < discursiveMin) {
      belowDisciplineMinimums.push('discursive');
      console.log(`[recalculateUserScore] Discursive abaixo do mínimo ${isQuota ? 'cota' : 'ampla'}: ${discursiveScore} < ${discursiveMin}`);
    }
    if (case1Min > 0 && (caseStudy1Score || 0) < case1Min) {
      belowDisciplineMinimums.push('case_study_1');
      console.log(`[recalculateUserScore] Case Study 1 abaixo do mínimo ${isQuota ? 'cota' : 'ampla'}: ${caseStudy1Score} < ${case1Min}`);
    }
    if (case2Min > 0 && (caseStudy2Score || 0) < case2Min) {
      belowDisciplineMinimums.push('case_study_2');
      console.log(`[recalculateUserScore] Case Study 2 abaixo do mínimo ${isQuota ? 'cota' : 'ampla'}: ${caseStudy2Score} < ${case2Min}`);
    }
    if (case3Min > 0 && (caseStudy3Score || 0) < case3Min) {
      belowDisciplineMinimums.push('case_study_3');
      console.log(`[recalculateUserScore] Case Study 3 abaixo do mínimo ${isQuota ? 'cota' : 'ampla'}: ${caseStudy3Score} < ${case3Min}`);
    }
    if (otherMin > 0 && (otherSubjectiveScore || 0) < otherMin) {
      belowDisciplineMinimums.push('other_subjective');
      console.log(`[recalculateUserScore] Other Subjective abaixo do mínimo ${isQuota ? 'cota' : 'ampla'}: ${otherSubjectiveScore} < ${otherMin}`);
    }

    // 3) Block-level minimums using disciplines mapping
    const blockScores: Record<string, number> = {};
    const { blockMinimums, disciplineToBlock } = getBlockMinimumMaps(concurso, isQuota);
    Object.keys(blockMinimums).forEach(id => { blockScores[id] = 0; });

    // Usar pontuações apropriadas baseado no tipo de prova
    const scoresToCheckForBlocks = useWeightedScoring ? weightedDisciplineScores : disciplineScores;
    for (const [discType, score] of Object.entries(scoresToCheckForBlocks)) {
      const bId = disciplineToBlock[discType];
      if (bId) {
        blockScores[bId] = (blockScores[bId] || 0) + (score || 0);
      }
    }

    for (const [bId, bMin] of Object.entries(blockMinimums)) {
      if ((bMin || 0) > 0 && (blockScores[bId] || 0) < (bMin || 0)) {
        belowBlockMinimums.push(bId);
        console.log(`[recalculateUserScore] Bloco ${bId} abaixo do mínimo: ${blockScores[bId]} < ${bMin} (weighted=${useWeightedScoring})`);
      }
    }

    // 4) Global minimum (only objective total, excluding subjectives)
    // ✅ Read minimum from nova estrutura JSONB disciplines (AC vs Cotas)
    
    let globalMinimumToCheck = 0;
    let hasGlobalMin = false;
    
    // Nova estrutura JSONB: objeto com blocks
    if (concurso.disciplines && typeof concurso.disciplines === 'object' && 'blocks' in concurso.disciplines) {
      if (isQuota && concurso.disciplines.minimum_total_score_cotas) {
        globalMinimumToCheck = Number(concurso.disciplines.minimum_total_score_cotas) || 0;
        hasGlobalMin = globalMinimumToCheck > 0;
      } else if (concurso.disciplines.minimum_total_score) {
        globalMinimumToCheck = Number(concurso.disciplines.minimum_total_score) || 0;
        hasGlobalMin = globalMinimumToCheck > 0;
      }
      
      console.log('[recalculateUserScore] Nova estrutura JSONB para global minimum:', {
        isQuota,
        minimum: globalMinimumToCheck,
        hasMin: hasGlobalMin
      });
    }
    // Estrutura antiga: array de blocos (fallback)
    else if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      const firstBlock = concurso.disciplines[0];
      if (isQuota && firstBlock.minimum_total_score_cotas) {
        globalMinimumToCheck = Number(firstBlock.minimum_total_score_cotas) || 0;
        hasGlobalMin = globalMinimumToCheck > 0;
      } else if (firstBlock.minimum_total_score) {
        globalMinimumToCheck = Number(firstBlock.minimum_total_score) || 0;
        hasGlobalMin = globalMinimumToCheck > 0;
      }
      
      console.log('[recalculateUserScore] Estrutura antiga para global minimum (fallback)');
    }
    
    // Usar total objetivo apropriado (ponderado ou não) para o mínimo global
    // objectiveWeightedTotal e objectiveSimpleTotal já foram declarados acima (linhas 424-425)
    const scoreToCheckForGlobal = useWeightedScoring ? objectiveWeightedTotal : objectiveSimpleTotal;
    
    const isBelowGlobalMinimum = hasGlobalMin ? (scoreToCheckForGlobal < globalMinimumToCheck) : false;
    
    console.log(`[recalculateUserScore] Global minimum check: reservationType=${reservationType}, isQuota=${isQuota}, minimum=${globalMinimumToCheck}, objectiveWeighted=${objectiveWeightedTotal}, objectiveSimple=${objectiveSimpleTotal}, scoreUsed=${scoreToCheckForGlobal}, useWeighted=${useWeightedScoring}, below=${isBelowGlobalMinimum}`);

    const belowMinimum = isBelowGlobalMinimum || belowDisciplineMinimums.length > 0 || belowBlockMinimums.length > 0;
    
    console.log(`[recalculateUserScore] Minimum thresholds summary: belowMinimum=${belowMinimum}, isBelowGlobalMinimum=${isBelowGlobalMinimum}, belowDisciplineMinimums=${belowDisciplineMinimums.length}, belowBlockMinimums=${belowBlockMinimums.length}`);

    // Atualizar a pontuação do usuário no consolidated_data
    const updatedConsolidatedData = {
      ...userRanking.consolidated_data,
      rankings: {
        ...userRanking.consolidated_data.rankings,
        [rankingId]: { // Usar rankingId correto
          ...userRanking.consolidated_data.rankings[rankingId],
          user_data: {
            ...userRanking.consolidated_data.rankings[rankingId].user_data, // Preservar todos os campos existentes
            score: totalScore, // Total geral (objetivas + subjetivas)
            subject_scores_tot: objectiveWeightedTotal, // Total objetivo ponderado
            object_scores: correctSubjectScores, // Estrutura correta (apenas objetivas)
            subjective_scores: subjectiveScoresTot, // Soma das subjetivas - ANTES de subjectives
            subjectives: correctSubjectives, // Pontuações subjetivas individuais
            status: belowMinimum ? 'eliminado' : 'classificado',
            belowMinimum: belowMinimum,
            belowDisciplineMinimums: belowDisciplineMinimums,
            belowBlockMinimums: belowBlockMinimums,
            isBelowGlobalMinimum: isBelowGlobalMinimum,
            last_calculated: new Date().toISOString()
          },
          // Persistir informações de mínimos para uso no front
          belowMinimum: belowMinimum,
          belowDisciplineMinimums: belowDisciplineMinimums,
          belowBlockMinimums: belowBlockMinimums,
          status: belowMinimum ? 'eliminado' : 'classificado'
        }
      }
    };

    console.log(`[recalculateUserScore] 📊 Estrutura final sendo salva:`, {
      rankingId,
      totalScore,
      subjectScoresTot,
      subjectiveScoresTot,
      correctSubjectScores,
      correctSubjectives,
      updatedConsolidatedData: updatedConsolidatedData.rankings[rankingId].user_data
    });

    console.log(`[recalculateUserScore] Updating consolidated_data with:`, {
      rankingId,
      totalScore,
      disciplineScores,
      subjectiveScores: {
        discursive_score: discursiveScore,
        case_study_1_score: caseStudy1Score,
        case_study_2_score: caseStudy2Score,
        case_study_3_score: caseStudy3Score,
        other_subjective_score: otherSubjectiveScore
      },
      weightedSubjectiveScores: {
        discursive_score: weightedDiscursiveScore,
        case_study_1_score: weightedCaseStudy1Score,
        case_study_2_score: weightedCaseStudy2Score,
        case_study_3_score: weightedCaseStudy3Score,
        other_subjective_score: weightedOtherSubjectiveScore
      }
    });

    console.log(`[recalculateUserScore] 💾 Salvando no banco de dados...`);
    
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({ 
        consolidated_data: updatedConsolidatedData
      })
      .eq('user_id', userRanking.user_id);

    if (updateError) {
      console.error(`[recalculateUserScore] ❌ Erro ao atualizar pontuação do usuário:`, updateError);
      return { 
        success: false, 
        message: 'Erro ao atualizar pontuação do usuário', 
        error: updateError 
      };
    }

    console.log(`[recalculateUserScore] ✅ Successfully updated consolidated_data for user ${userRanking.user_id}`);

    return { 
        success: true, 
        message: 'Pontuação recalculada com sucesso', 
        updatedScore: totalScore 
    };
  } catch (error) {
    console.error(`[recalculateUserScore] ❌ ERRO GERAL para usuário ${userId}:`, error);
    console.error(`[recalculateUserScore] ❌ Stack trace:`, error.stack);
    return { 
      success: false, 
      message: `Erro ao recalcular pontuação: ${error.message}`, 
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
    // Buscar dados do usuário usando consolidated_data
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('consolidated_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (userRankingError || !userRanking) {
      console.error('Erro ao buscar ranking do usuário:', userRankingError);
      return null;
    }

    // Buscar o rankingId correto no consolidated_data
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
      console.error('Usuário não está participando deste concurso');
      return null;
    }

    // Obter posição do consolidated_data
    const position = userRanking.consolidated_data.rankings[rankingId].user_data?.position || null;

    // Verificar se a posição está dentro das vagas disponíveis
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('vagas')
      .eq('id', concursoId)
      .single();

    if (concursoError) {
      console.error('Erro ao buscar número de vagas:', concursoError);
      return position;
    }

    const vacanciesCount = concurso?.vagas;

    // Verificar se a posição está dentro das vagas disponíveis
    if (cota && isPositionThreshold(cota) && 
        typeof position === 'number' && 
        typeof vacanciesCount === 'number' && 
        position > vacanciesCount) {
      return null;
    }

    return position;
  } catch (error) {
    console.error('Erro ao obter posição do usuário:', error);
    return null;
  }
};
