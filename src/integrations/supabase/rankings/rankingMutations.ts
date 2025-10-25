
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
    // Log sanitizado - sem exposição de dados sensíveis
    // Debug logs removed for security
    
    // Obter dados do concurso para aplicar regras específicas - apenas campos necessários
           const { data: concurso, error: concursoError } = await supabase
             .from('concursos')
             .select('id, titulo, orgao, banca, disciplines, subjects, exam_type, alternatives_count, official_answers, has_minimum_score, total_minimum_score, has_quota_minimum_score, quota_minimum_score, created_at, updated_at')
             .eq('id', concursoId)
             .single();

    if (concursoError) {
      console.error(`[recalculateUserScore] ❌ ERRO ao buscar concurso: Database operation failed`);
      return { 
        success: false, 
        message: 'Erro ao obter dados do concurso', 
        error: concursoError 
      };
    }
    
    // Debug logs removed for security
    
    // Log sanitizado - sem exposição de dados sensíveis
    // Debug logs removed for security

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
        
        // Debug logs removed for security
    }

    // Primeiro, busque o ranking correspondente ao usuário/concurso
    // Debug logs removed for security
    
    const { data: userRanking, error: userRankingError } = await supabase
      .from('user_rankings')
      .select('user_id, consolidated_data')
      .eq('user_id', userId)
      .maybeSingle();

    // Debug logs removed for security

    if (userRankingError || !userRanking) {
      console.error(`[recalculateUserScore] ❌ ERRO ao buscar usuário: Database operation failed`);
      return { 
        success: false, 
        message: 'Erro ao buscar ranking do usuário', 
        error: userRankingError 
      };
    }
    
    // Debug logs removed for security

    // Buscar o rankingId correto no consolidated_data
    let rankingId = null;
    // Debug logs removed for security
    // Debug logs removed for security
    
    if (userRanking.consolidated_data?.rankings) {
      for (const key in userRanking.consolidated_data.rankings) {
        const ranking = userRanking.consolidated_data.rankings[key];
        // Debug logs removed for security
        if (ranking.concurso_id === concursoId) {
          rankingId = key;
          // Debug logs removed for security
          break;
        }
      }
    }

    if (!rankingId) {
      console.error(`[recalculateUserScore] ❌ Usuário não está participando do concurso`);
      // Debug logs removed for security
      return { 
        success: false, 
        message: 'Usuário não está participando deste concurso'
      };
    }
    
    // Debug logs removed for security

    // Obter as respostas do usuário usando user_rankings consolidated_data
    const { data: userRankingData, error: consolidatedError } = await supabase
      .from('user_rankings')
      .select('consolidated_data')
      .eq('user_id', userRanking.user_id)
      .maybeSingle();

    if (consolidatedError) {
      console.error('Erro ao buscar dados consolidados: Database operation failed');
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

      // Log sanitizado - sem exposição de dados sensíveis
      // Debug logs removed for security

      // DEBUG: Log detalhado da estrutura hierárquica
      if (answersData && typeof answersData === 'object') {
        // Debug logs removed for security
        for (const blockId in answersData) {
          const blockData = answersData[blockId];
          // Debug logs removed for security
          if (typeof blockData === 'object' && blockData !== null) {
            for (const disciplineType in blockData) {
              const disciplineData = blockData[disciplineType];
              // Debug logs removed for security
              if (typeof disciplineData === 'object' && disciplineData !== null) {
                const questionNumbers = Object.keys(disciplineData);
                // Debug logs removed for security
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
            // Debug logs removed for security
            for (const disciplineType in blockData) { // Mudança: usar disciplineType
              const disciplineData = blockData[disciplineType];
              if (typeof disciplineData === 'object' && disciplineData !== null) {
                // Debug logs removed for security
                for (const questionNumber in disciplineData) {
                  const questionNum = parseInt(questionNumber);
                  if (!isNaN(questionNum)) {
                    userAnswers.push({
                      question_number: questionNum,
                      answer: disciplineData[questionNumber],
                      discipline_type: disciplineType // Adicionar disciplina para mapeamento
                    });
                     // Debug logs removed for security
                  }
                }
              }
            }
          }
        }
      } else {
        // Debug logs removed for security
      }
    }
    
    // Debug logs removed for security
    // Debug logs removed for security

    // Usar official_answers já buscado do concurso
    if (!concurso?.official_answers) {
      // Debug logs removed for security
      return { 
        success: false, 
        message: 'Gabarito não encontrado para este concurso' 
      };
    }

    // Debug logs removed for security
    
    const answerData = concurso.official_answers;
    // Debug logs removed for security
    
    if (!answerData) {
      // Debug logs removed for security
      return { 
        success: false, 
        message: 'Gabarito oficial não encontrado' 
      };
    }
    
    // A estrutura real tem os cadernos diretamente no primeiro nível
    const booklets = answerData || {};
    // Debug logs removed for security
    
    // Buscar o selected_booklet_id do usuário
    const currentUserRankingData = userRanking.consolidated_data?.rankings?.[rankingId];
    const selectedBookletId = currentUserRankingData?.selected_booklet_id;
    
    // Debug logs removed for security
    
    if (!selectedBookletId) {
      // Debug logs removed for security
      return { 
        success: false, 
        message: 'Caderno selecionado não encontrado' 
      };
    }
    
    // Usar o gabarito do caderno selecionado pelo usuário
    const selectedBooklet = booklets[selectedBookletId];
    // Debug logs removed for security
    
    if (!selectedBooklet?.questions) {
      // Debug logs removed for security
      // Debug logs removed for security
      return { 
        success: false, 
        message: `Gabarito não encontrado para o caderno ${selectedBookletId}` 
      };
    }

    const officialAnswers = selectedBooklet.questions;
     // Debug logs removed for security

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
    const disciplineWeights: Record<string, number> = getDisciplineWeights({...concurso, has_custom_knowledge: true});
    const disciplineMinimums: Record<string, number> = getDisciplineMinimums({...concurso, has_custom_knowledge: true}, isQuota);

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

    // Log sanitizado - sem exposição de dados sensíveis
    // Debug logs removed for security
    // Debug logs removed for security
    // Debug logs removed for security

    // Debug logs removed for security
    // Debug logs removed for security
    // Debug logs removed for security

    // Obter as pontuações subjetivas do consolidated_data
    const subjectiveScores = userRanking.consolidated_data?.rankings?.[rankingId]?.user_data?.subjectives || {};
    
    // ✅ VALIDAÇÃO: Verificar quais subjetivas estão ativas no concurso
    const activeSubjectives = {
      discursive: concurso.subjects?.discr === true,
      case_study_1: concurso.subjects?.case1 === true,
      case_study_2: concurso.subjects?.case2 === true,
      case_study_3: concurso.subjects?.case3 === true,
      other_subjective: concurso.subjects?.other === true
    };
    
     // Debug logs removed for security
    
    // Pontuações subjetivas do consolidated_data (apenas as ativas)
    const discursiveScore = activeSubjectives.discursive ? (subjectiveScores.discursive || 0) : 0;
    const caseStudy1Score = activeSubjectives.case_study_1 ? (subjectiveScores.case_study_1 || 0) : 0;
    const caseStudy2Score = activeSubjectives.case_study_2 ? (subjectiveScores.case_study_2 || 0) : 0;
    const caseStudy3Score = activeSubjectives.case_study_3 ? (subjectiveScores.case_study_3 || 0) : 0;
    const otherSubjectiveScore = activeSubjectives.other_subjective ? (subjectiveScores.other_subjective || 0) : 0;
    
     // Debug logs removed for security
    
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
        
        // Log sanitizado - sem exposição de dados sensíveis
        // Debug logs removed for security
        
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
        
        // Debug logs removed for security
        
        totalWeight += questionWeight;
      }
    }
    
    // ✅ CORREÇÃO: Adicionar pontuações subjetivas ao total (sem duplicação)
    // As pontuações objetivas já foram somadas no loop acima (linha 431)
    // Agora adicionamos as pontuações subjetivas
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
    
    // ✅ CORREÇÃO: Calcular totais objetivos ANTES de usar nas logs
    const objectiveSimpleTotal = Object.values(disciplineScores).reduce((sum, score) => sum + (score || 0), 0);
    const objectiveWeightedTotal = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + (score || 0), 0);
    
     // Debug logs removed for security

    // ✅ TOTAIS CALCULADOS CORRETAMENTE ACIMA (com penalidades para C/E)

    // ⚠️ NÃO sobrescrever totalScore! Ele já foi calculado corretamente no loop acima
    // disciplineScores = contagem de acertos (não inclui penalidades)
    // weightedDisciplineScores = pontuação com penalidades aplicadas (para C/E)
    // totalScore já inclui TUDO: acertos + penalidades + subjetivas

    // ✅ VALIDAÇÃO: Verificar se pontuação está correta
    const subjectiveWeightedTotal = weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
    const expectedTotal = objectiveWeightedTotal + subjectiveWeightedTotal;
    const scoreDifference = Math.abs(totalScore - expectedTotal);
    
    if (scoreDifference > 0.01) {
      console.warn(`[recalculateUserScore] ⚠️ DISCREPÂNCIA DETECTADA:`, {
        totalScore,
        expectedTotal,
        difference: scoreDifference,
        objectiveTotal: objectiveWeightedTotal,
        subjectiveTotal: subjectiveWeightedTotal,
        examType: concurso.exam_type
      });
    } else {
      // Debug logs removed for security
    }

     // Debug logs removed for security

    // ✅ CORREÇÃO: Usar apenas pontuações weighted para consistência
    const subjectScoresTot = Object.values(disciplineScores).reduce((sum, score) => sum + score, 0);
    const subjectiveScoresTot = subjectiveWeightedTotal; // Usar total weighted em vez de não weighted
    
    // Criar estrutura correta de subject_scores (APENAS objetivas)
    const correctSubjectScores: Record<string, number> = {};

    // Percorrer as disciplinas do concurso para criar subject_scores dinamicamente - NOVA ESTRUTURA COMPATÍVEL
    // Verificar se é a nova estrutura hierárquica (objeto com blocks)
    if (concurso.disciplines && typeof concurso.disciplines === 'object' && !Array.isArray(concurso.disciplines) && concurso.disciplines.blocks) {
      // Debug logs removed for security
      
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
                  // Debug logs removed for security
                }
                
                correctSubjectScores[discipline.type] = score;
                // Debug logs removed for security
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
                  // Debug logs removed for security
                }
                
                correctSubjectScores[discipline.type] = score;
                // Debug logs removed for security
              }
            }
          }
        }
      }
    }

     // Debug logs removed for security
    
    // ✅ CORREÇÃO: Usar pontuações weighted para consistência
    const correctSubjectives = {
      "discursive": weightedDiscursiveScore || 0,
      "case_study_1": weightedCaseStudy1Score || 0,
      "case_study_2": weightedCaseStudy2Score || 0,
      "case_study_3": weightedCaseStudy3Score || 0,
      "other_subjective": weightedOtherSubjectiveScore || 0
    };

    // ===== NEW: Minimum thresholds evaluation =====
    const belowDisciplineMinimums: string[] = [];
    const belowBlockMinimums: string[] = [];

    // Determinar se devemos usar pontuação ponderada para mínimos
    // Para "Certo ou Errado", questões sempre valem 1 ponto (não ponderado)
    const useWeightedScoring = concurso.exam_type !== 'Certo ou Errado';
    
    // Debug logs removed for security

    // 1) Discipline-level minimums (objective disciplines)
    const scoresToCheckForDisciplines = useWeightedScoring ? weightedDisciplineScores : disciplineScores;
    for (const [discType, score] of Object.entries(scoresToCheckForDisciplines)) {
      const min = disciplineMinimums[discType] || 0;
      if (min > 0 && score < min) {
        belowDisciplineMinimums.push(discType);
        // Debug logs removed for security
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
    
     // Debug logs removed for security
    
    if (discursiveMin > 0 && (discursiveScore || 0) < discursiveMin) {
      belowDisciplineMinimums.push('discursive');
      // Debug logs removed for security
    }
    if (case1Min > 0 && (caseStudy1Score || 0) < case1Min) {
      belowDisciplineMinimums.push('case_study_1');
      // Debug logs removed for security
    }
    if (case2Min > 0 && (caseStudy2Score || 0) < case2Min) {
      belowDisciplineMinimums.push('case_study_2');
      // Debug logs removed for security
    }
    if (case3Min > 0 && (caseStudy3Score || 0) < case3Min) {
      belowDisciplineMinimums.push('case_study_3');
      // Debug logs removed for security
    }
    if (otherMin > 0 && (otherSubjectiveScore || 0) < otherMin) {
      belowDisciplineMinimums.push('other_subjective');
      // Debug logs removed for security
    }

    // 3) Block-level minimums using disciplines mapping
    const blockScores: Record<string, number> = {};
    const { blockMinimums, disciplineToBlock } = getBlockMinimumMaps({...concurso, has_custom_knowledge: true}, isQuota);
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
      
       // Debug logs removed for security
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
    
    // Debug logs removed for security

    const belowMinimum = isBelowGlobalMinimum || belowDisciplineMinimums.length > 0 || belowBlockMinimums.length > 0;
    
    // Debug logs removed for security

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

     // Debug logs removed for security

     // Debug logs removed for security

    // Debug logs removed for security
    
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

    // Debug logs removed for security

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
