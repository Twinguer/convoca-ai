
import { supabase } from '@/integrations/supabase/client';
import { isHierarchicalStructure, getDisciplineWeights, getDisciplineMinimums, getBlockMinimumMaps } from './examStructure';
import { migrateObjectScores, createInitialObjectScores } from '@/utils/consolidatedDataMapper';

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
        const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
        const questionWeight = officialAnswer.weight ?? 1;
        const sectionType = officialAnswer.section_type || 'default';
        
        // Usar o section_type do gabarito para mapear corretamente para a disciplina
        // Se o section_type não estiver mapeado, usar o section_type diretamente
        const disciplineType = sectionTypeToDisciplineTypeMap[sectionType] || sectionType;
        
        // Inicializar pontuação da disciplina se ainda não existir
        if (!disciplineScores[disciplineType]) {
          disciplineScores[disciplineType] = 0;
          weightedDisciplineScores[disciplineType] = 0;
        }
        
        if (isCorrect) {
          // Obter peso da disciplina do mapeamento
          const disciplineWeight = disciplineWeights[disciplineType] || 1;
          
          // Debug para entender o mapeamento
          console.log(`[recalculateUserScore] DEBUG - Question ${userAnswer.question_number}:`, {
            userAnswer: userAnswer.answer,
            officialAnswer: officialAnswer.correct_answer,
            sectionType,
            disciplineType,
            isCorrect,
            questionWeight,
            disciplineWeight,
            disciplineScoresBefore: disciplineScores[disciplineType] || 0
          });
          
          // Adicionar à pontuação total
          totalScore += questionWeight;
          
          // Adicionar à pontuação da disciplina específica
          disciplineScores[disciplineType] += questionWeight;
          weightedDisciplineScores[disciplineType] += questionWeight * disciplineWeight;
          
          console.log(`[recalculateUserScore] Question ${userAnswer.question_number} correct (${disciplineType}): +${questionWeight} * weight ${disciplineWeight}`);
          console.log(`[recalculateUserScore] DEBUG - Após cálculo: disciplineScores[${disciplineType}] = ${disciplineScores[disciplineType]}`);
        } else if (concurso.exam_type === 'Certo ou Errado') {
          // Penalty logic can be moved to JSONB if needed
          const penalty = 0; // Sem penalidade (feature removida/no-op)
          // Se penalty = 0, não faz nada (resposta errada não impacta)
        }
        
        totalWeight += questionWeight;
      } else if (concurso.exam_type === 'Certo ou Errado') {
        // Aplicar penalidade para respostas erradas em provas C/E
        const penalty = concurso.disciplines?.wrong_answer_penalty ?? 0;
        if (penalty > 0) {
          const sectionType = officialAnswer.section_type || 'default';
          const disciplineType = sectionTypeToDisciplineTypeMap[sectionType] || sectionType;
          const disciplineWeight = disciplineWeights[disciplineType] || 1;
          
          // Aplicar penalidade
          totalScore -= penalty;
          disciplineScores[disciplineType] = (disciplineScores[disciplineType] || 0);
          weightedDisciplineScores[disciplineType] = (weightedDisciplineScores[disciplineType] || 0) - (penalty * disciplineWeight);
          
          console.log(`[recalculateUserScore] Question ${userAnswer.question_number} incorrect (${disciplineType}): -${penalty} penalty`);
        }
      }
    }
    
    // Adicionar pontuações subjetivas ao total
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
    
    console.log(`[recalculateUserScore] Calculated total score: ${totalScore}, discipline scores:`, disciplineScores);
    console.log(`[recalculateUserScore] Weighted discipline scores:`, weightedDisciplineScores);
    console.log(`[recalculateUserScore] Subjective scores: discursive=${weightedDiscursiveScore}, caseStudy1=${weightedCaseStudy1Score}, caseStudy2=${weightedCaseStudy2Score}, caseStudy3=${weightedCaseStudy3Score}, other=${weightedOtherSubjectiveScore}`);

    // Recalcular total usando pontuações ponderadas sempre que existirem (independente da estrutura)
    if (Object.keys(weightedDisciplineScores).length > 0) {
      // Objetivas ponderadas
      totalScore = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + (score || 0), 0);
      
      // Adicionar pontuações subjetivas ponderadas
      totalScore += (weightedDiscursiveScore || 0)
                 + (weightedCaseStudy1Score || 0)
                 + (weightedCaseStudy2Score || 0)
                 + (weightedCaseStudy3Score || 0)
                 + (weightedOtherSubjectiveScore || 0);
      
      console.log(`[recalculateUserScore] Recalculated total with custom weights (any structure): ${totalScore}`);
      console.log(`[recalculateUserScore] Discipline scores:`, disciplineScores);
      console.log(`[recalculateUserScore] Subjective scores:`, {
        discursiveScore,
        caseStudy1Score,
        caseStudy2Score,
        caseStudy3Score,
        otherSubjectiveScore
      });
      console.log(`[recalculateUserScore] Weighted subjective scores:`, {
        weightedDiscursiveScore,
        weightedCaseStudy1Score,
        weightedCaseStudy2Score,
        weightedCaseStudy3Score,
        weightedOtherSubjectiveScore
      });
    }

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

    // 2) Subjective minimums from concurso.subjects
    const subj = (concurso as any).subjects || {};
    if ((subj.discr_min_score || 0) > 0 && (discursiveScore || 0) < (subj.discr_min_score || 0)) {
      belowDisciplineMinimums.push('discursive');
    }
    if ((subj.case1_min_score || 0) > 0 && (caseStudy1Score || 0) < (subj.case1_min_score || 0)) {
      belowDisciplineMinimums.push('case_study_1');
    }
    if ((subj.case2_min_score || 0) > 0 && (caseStudy2Score || 0) < (subj.case2_min_score || 0)) {
      belowDisciplineMinimums.push('case_study_2');
    }
    if ((subj.case3_min_score || 0) > 0 && (caseStudy3Score || 0) < (subj.case3_min_score || 0)) {
      belowDisciplineMinimums.push('case_study_3');
    }
    if ((subj.other_min_score || 0) > 0 && (otherSubjectiveScore || 0) < (subj.other_min_score || 0)) {
      belowDisciplineMinimums.push('other_subjective');
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
    const objectiveWeightedTotal = Object.values(weightedDisciplineScores).reduce((sum, v) => sum + (v || 0), 0);
    const objectiveSimpleTotal = Object.values(disciplineScores).reduce((sum, v) => sum + (v || 0), 0);
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
