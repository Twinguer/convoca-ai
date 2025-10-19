
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
    console.log(`[recalculateUserScore] 🚀 INICIANDO recálculo para usuário ${userId} no concurso ${concursoId}`);
    
    // Obter dados do concurso para aplicar regras específicas - apenas campos necessários
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('id, disciplines, subjects, exam_type, alternatives_count, official_answers, has_minimum_score, total_minimum_score, has_cota')
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
    console.log(`[recalculateUserScore] Total user answers found:`, userAnswers?.length || 0);
    
    // DEBUG: Verificar se as respostas têm discipline_type
    if (userAnswers && userAnswers.length > 0) {
      const answersWithDisciplineType = userAnswers.filter(answer => answer.discipline_type);
      const answersWithoutDisciplineType = userAnswers.filter(answer => !answer.discipline_type);
      console.log(`[recalculateUserScore] DEBUG - Respostas com discipline_type: ${answersWithDisciplineType.length}`);
      console.log(`[recalculateUserScore] DEBUG - Respostas sem discipline_type: ${answersWithoutDisciplineType.length}`);
      
      if (answersWithDisciplineType.length > 0) {
        console.log(`[recalculateUserScore] DEBUG - Exemplos de discipline_type encontrados:`, 
          answersWithDisciplineType.slice(0, 3).map(a => ({ q: a.question_number, discipline: a.discipline_type }))
        );
      }
    }

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

    // Criar mapeamento de section_type para discipline.type
    const sectionTypeToDisciplineTypeMap: Record<string, string> = {};
    const disciplineWeights: Record<string, number> = {};
    const disciplineMinimums: Record<string, number> = {};

    // Percorrer as disciplinas do concurso para criar o mapeamento
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      for (const block of concurso.disciplines) {
        if ('disciplines' in block && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Mapear section_type (do gabarito) para discipline.type (das respostas)
              // Para disciplinas customizadas, o section_type geralmente é o mesmo que discipline.type
              // Criar mapeamento bidirecional: section_type -> discipline.type e discipline.type -> discipline.type
              sectionTypeToDisciplineTypeMap[discipline.type] = discipline.type;
              // Também mapear o discipline.type para si mesmo (caso o section_type seja igual)
              sectionTypeToDisciplineTypeMap[discipline.type] = discipline.type;
              disciplineWeights[discipline.type] = discipline.weight || 1;
              disciplineMinimums[discipline.type] = discipline.minimum_score || 0;
            }
          }
        }
      }
    }

    // DEBUG: Log do mapeamento criado
    console.log('[recalculateUserScore] DEBUG - Mapeamento section_type -> discipline.type:', sectionTypeToDisciplineTypeMap);
    console.log('[recalculateUserScore] DEBUG - Pesos das disciplinas:', disciplineWeights);
    console.log('[recalculateUserScore] DEBUG - Mínimos das disciplinas:', disciplineMinimums);

    // DEBUG: Verificar se há incompatibilidade entre section_type e discipline.type
    const allSectionTypes = new Set();
    const allDisciplineTypes = new Set();

    // Coletar todos os section_types do gabarito
    for (const userAnswer of userAnswers || []) {
      const questionNumberStr = userAnswer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];
      if (officialAnswer?.section_type) {
        allSectionTypes.add(officialAnswer.section_type);
      }
    }

    // Coletar todos os discipline.types das disciplinas
    for (const block of concurso.disciplines || []) {
      if ('disciplines' in block && Array.isArray(block.disciplines)) {
        for (const discipline of block.disciplines) {
          if (discipline.isEnabled && discipline.type) {
            allDisciplineTypes.add(discipline.type);
          }
        }
      }
    }

    console.log('[recalculateUserScore] DEBUG - Section types no gabarito:', Array.from(allSectionTypes));
    console.log('[recalculateUserScore] DEBUG - Discipline types habilitadas:', Array.from(allDisciplineTypes));

    // Verificar incompatibilidades
    const missingSectionTypes = Array.from(allSectionTypes).filter(st => !allDisciplineTypes.has(st));
    const missingDisciplineTypes = Array.from(allDisciplineTypes).filter(dt => !allSectionTypes.has(dt));

    if (missingSectionTypes.length > 0) {
      console.warn('[recalculateUserScore] WARNING - Section types no gabarito que não correspondem a disciplinas:', missingSectionTypes);
    }
    if (missingDisciplineTypes.length > 0) {
      console.warn('[recalculateUserScore] WARNING - Discipline types que não correspondem a section types:', missingDisciplineTypes);
    }

    // Obter as pontuações subjetivas do consolidated_data
    const subjectiveScores = userRanking.consolidated_data?.rankings?.[rankingId]?.user_data?.subjectives || {};
    
    // Pontuações subjetivas do consolidated_data
    const discursiveScore = subjectiveScores.discursive || 0;
    const caseStudy1Score = subjectiveScores.case_study_1 || 0;
    const caseStudy2Score = subjectiveScores.case_study_2 || 0;
    const caseStudy3Score = subjectiveScores.case_study_3 || 0;
    const otherSubjectiveScore = subjectiveScores.other_subjective || 0;
    
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
    // SEMPRE usar a nova estrutura JSONB disciplines (sempre hierárquica)
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
      console.log(`[recalculateUserScore] Structure type: hierarchical`);
      
      // Criar um mapeamento de tipo para peso com base no JSON de disciplinas
      const disciplineWeights: Record<string, number> = {};
      const disciplineNames: Record<string, string> = {};
      
      // Percorrer as disciplinas e extrair os pesos - SEMPRE hierárquica
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
      
      console.log("[recalculateUserScore] Discipline weights:", disciplineWeights);
    }

    // Calcular a pontuação do usuário para cada resposta
    console.log('[recalculateUserScore] DEBUG - userAnswers recebidas:', userAnswers?.length || 0);
    console.log('[recalculateUserScore] DEBUG - officialAnswers carregados:', Object.keys(officialAnswers).length);
    console.log('[recalculateUserScore] DEBUG - disciplineWeights disponíveis:', Object.keys(disciplineWeights));
    
    for (const userAnswer of userAnswers || []) {
      const questionNumberStr = userAnswer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];

      if (officialAnswer) {
        const isCorrect = officialAnswer.is_nullified === true || userAnswer.answer === officialAnswer.correct_answer;
        const questionWeight = officialAnswer.weight ?? 1;
        const sectionType = officialAnswer.section_type || 'default';
        
        // CORREÇÃO: Usar o section_type do gabarito oficial como fonte única da verdade
        let disciplineType = officialAnswer.section_type;
        
        console.log(`[recalculateUserScore] DEBUG - Questão ${userAnswer.question_number}:`, {
          userAnswer: userAnswer.answer,
          officialAnswer: officialAnswer.correct_answer,
          sectionType: sectionType,
          disciplineType: disciplineType,
          isCorrect: isCorrect,
          questionWeight: questionWeight,
          disciplineExists: !!disciplineWeights[disciplineType]
        });
        
        // Verificar se a disciplina existe e está habilitada
        if (!disciplineType || disciplineType === 'default') {
          // Tratar caso especial: se section_type é "default", mapear para disciplinas customizadas
          if (sectionType === 'default') {
            // Encontrar disciplinas customizadas habilitadas
            const customDisciplines: string[] = [];
            for (const block of concurso.disciplines || []) {
              if ('disciplines' in block && Array.isArray(block.disciplines)) {
                for (const discipline of block.disciplines) {
                  if (discipline.isEnabled && discipline.type && discipline.type.startsWith('custom_')) {
                    customDisciplines.push(discipline.type);
                  }
                }
              }
            }
            
            if (customDisciplines.length > 0) {
              // Distribuir questões entre disciplinas customizadas baseado no número da questão
              const questionNum = userAnswer.question_number;
              const disciplineIndex = (questionNum - 1) % customDisciplines.length;
              disciplineType = customDisciplines[disciplineIndex];
              console.log(`[recalculateUserScore] DEBUG - Mapeando questão ${questionNum} de 'default' para disciplina customizada: ${disciplineType} (índice: ${disciplineIndex})`);
            } else {
              console.warn(`[recalculateUserScore] WARNING: Nenhuma disciplina customizada encontrada para mapear 'default'`);
            }
          } else {
            // Se não encontrar a disciplina, tentar mapear usando o mapeamento
            if (!disciplineWeights[disciplineType]) {
              if (sectionTypeToDisciplineTypeMap[sectionType]) {
                disciplineType = sectionTypeToDisciplineTypeMap[sectionType];
              } else {
                // Tentar encontrar uma disciplina que corresponda ao section_type
                for (const [mappedSectionType, mappedDisciplineType] of Object.entries(sectionTypeToDisciplineTypeMap)) {
                  if (mappedSectionType === sectionType) {
                    disciplineType = mappedDisciplineType;
                    break;
                  }
                }
              }
            }
          }
        }

        // Verificar se a disciplina existe e está habilitada após todas as tentativas
        if (!disciplineWeights[disciplineType]) {
          console.warn(`[recalculateUserScore] WARNING: Discipline ${disciplineType} not found or not enabled. sectionType: ${sectionType}`);
          console.warn(`[recalculateUserScore] Available disciplines:`, Object.keys(disciplineWeights));
          console.warn(`[recalculateUserScore] Available mappings:`, sectionTypeToDisciplineTypeMap);
        }
        
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
            disciplineScoresBefore: disciplineScores[disciplineType] || 0,
            mappingFound: sectionTypeToDisciplineTypeMap[sectionType] ? 'YES' : 'NO',
            disciplineExists: disciplineWeights[disciplineType] ? 'YES' : 'NO'
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
          const penalty = 0; // Default no penalty
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
    totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
    
    console.log(`[recalculateUserScore] Calculated total score: ${totalScore}, discipline scores:`, disciplineScores);
    console.log(`[recalculateUserScore] Weighted discipline scores:`, weightedDisciplineScores);
    console.log(`[recalculateUserScore] Subjective scores: discursive=${weightedDiscursiveScore}, caseStudy1=${weightedCaseStudy1Score}, caseStudy2=${weightedCaseStudy2Score}, caseStudy3=${weightedCaseStudy3Score}, other=${weightedOtherSubjectiveScore}`);

    // Se estivermos usando pesos de disciplina customizados, recalcular a pontuação total
    // SEMPRE usar a nova estrutura JSONB disciplines (prioridade máxima)
    if (concurso.disciplines && Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0 && Object.keys(weightedDisciplineScores).length > 0) {
      // Resetar a pontuação total para incluir apenas as pontuações ponderadas
      totalScore = Object.values(weightedDisciplineScores).reduce((sum, score) => sum + score, 0);
      
      // Adicionar pontuações subjetivas ponderadas
      totalScore += weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score + weightedOtherSubjectiveScore;
      
      console.log(`[recalculateUserScore] Recalculated total with custom weights: ${totalScore}`);
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

    // Percorrer as disciplinas do concurso para criar subject_scores dinamicamente
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      for (const block of concurso.disciplines) {
        if ('disciplines' in block && Array.isArray(block.disciplines)) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              // Incluir todas as disciplinas objetivas (não apenas custom_)
              const isObjectiveDiscipline = !['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type);
              
              if (isObjectiveDiscipline) {
                // Usar pontuação com peso aplicado para object_scores
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

    console.log('[recalculateUserScore] DEBUG - correctSubjectScores (object_scores):', correctSubjectScores);
    console.log('[recalculateUserScore] DEBUG - disciplineScores calculados:', disciplineScores);
    console.log('[recalculateUserScore] DEBUG - weightedDisciplineScores calculados:', weightedDisciplineScores);
    
    // DEBUG: Verificar se há disciplinas com score 0 que deveriam ter score > 0
    const zeroScoreDisciplines = Object.entries(correctSubjectScores).filter(([type, score]) => score === 0);
    if (zeroScoreDisciplines.length > 0) {
      console.warn('[recalculateUserScore] WARNING - Disciplinas com score 0:', zeroScoreDisciplines);
    }
    
    // Log específico para disciplinas customizadas
    const customDisciplines = Object.entries(correctSubjectScores).filter(([type, score]) => type.startsWith('custom_'));
    console.log('[recalculateUserScore] DEBUG - Disciplinas customizadas calculadas:', customDisciplines);
    
    // Verificar se há respostas em "default" que foram processadas
    const defaultAnswers = userAnswers?.filter(answer => {
      const questionNumberStr = answer.question_number.toString();
      const officialAnswer = officialAnswers[questionNumberStr];
      return officialAnswer?.section_type === 'default' || !officialAnswer?.section_type;
    });
    console.log('[recalculateUserScore] DEBUG - Respostas processadas de "default":', defaultAnswers?.length || 0);
    
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

    // 1) Discipline-level minimums (objective disciplines)
    for (const [discType, score] of Object.entries(weightedDisciplineScores)) {
      const min = disciplineMinimums[discType] || 0;
      if (min > 0 && score < min) {
        belowDisciplineMinimums.push(discType);
      }
    }

    // 2) Subjective minimums from concurso.subjects (JSONB structure)
    const subj = concurso.subjects || {};
    
    // Verificar mínimos subjetivos usando pontuações BRUTAS (sem peso)
    if (subj.discr && subj.discr_min_score > 0) {
      if (discursiveScore < subj.discr_min_score) {
        belowDisciplineMinimums.push('discursive');
        console.log(`[recalculateUserScore] WARNING: Subjective discursive below minimum: ${discursiveScore} < ${subj.discr_min_score}`);
      }
    }
    
    if (subj.case1 && subj.case1_min_score > 0) {
      if (caseStudy1Score < subj.case1_min_score) {
        belowDisciplineMinimums.push('case_study_1');
        console.log(`[recalculateUserScore] WARNING: Subjective case_study_1 below minimum: ${caseStudy1Score} < ${subj.case1_min_score}`);
      }
    }
    
    if (subj.case2 && subj.case2_min_score > 0) {
      if (caseStudy2Score < subj.case2_min_score) {
        belowDisciplineMinimums.push('case_study_2');
        console.log(`[recalculateUserScore] WARNING: Subjective case_study_2 below minimum: ${caseStudy2Score} < ${subj.case2_min_score}`);
      }
    }
    
    if (subj.case3 && subj.case3_min_score > 0) {
      if (caseStudy3Score < subj.case3_min_score) {
        belowDisciplineMinimums.push('case_study_3');
        console.log(`[recalculateUserScore] WARNING: Subjective case_study_3 below minimum: ${caseStudy3Score} < ${subj.case3_min_score}`);
      }
    }
    
    if (subj.other && subj.other_min_score > 0) {
      if (otherSubjectiveScore < subj.other_min_score) {
        belowDisciplineMinimums.push('other_subjective');
        console.log(`[recalculateUserScore] WARNING: Subjective other_subjective below minimum: ${otherSubjectiveScore} < ${subj.other_min_score}`);
      }
    }

    // 3) Block-level minimums using disciplines mapping
    const blockMinimums: Record<string, number> = {};
    const blockScores: Record<string, number> = {};
    const disciplineToBlock: Record<string, string> = {};

    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      for (const block of concurso.disciplines as any[]) {
        const blockId = block.id || block.name;
        const blockMin = block.minimum_score || 0;
        if (blockId) {
          blockMinimums[blockId] = blockMin;
          blockScores[blockId] = 0;
        }
        if (block.disciplines && Array.isArray(block.disciplines)) {
          for (const d of block.disciplines) {
            if (d?.type && d.isEnabled) {
              disciplineToBlock[d.type] = blockId;
            }
          }
        }
      }
    }

    for (const [discType, wScore] of Object.entries(weightedDisciplineScores)) {
      const bId = disciplineToBlock[discType];
      if (bId) {
        blockScores[bId] = (blockScores[bId] || 0) + (wScore || 0);
      }
    }

    for (const [bId, bMin] of Object.entries(blockMinimums)) {
      if ((bMin || 0) > 0 && (blockScores[bId] || 0) < (bMin || 0)) {
        belowBlockMinimums.push(bId);
      }
    }

    // 4) HIERARQUIA DE VERIFICAÇÃO DE MÍNIMOS
    // Ordem: Disciplina → Bloco → Global → Subjetivo
    
    let isEliminated = false;
    let eliminationReason = '';
    
    // 4.1) Verificar mínimos por DISCIPLINA (já calculado acima)
    if (belowDisciplineMinimums.length > 0) {
      isEliminated = true;
      eliminationReason = `Disciplinas abaixo do mínimo: ${belowDisciplineMinimums.join(', ')}`;
      console.log(`[recalculateUserScore] ❌ ELIMINADO por disciplina: ${eliminationReason}`);
    }
    
    // 4.2) Verificar mínimos por BLOCO (já calculado acima)
    if (!isEliminated && belowBlockMinimums.length > 0) {
      isEliminated = true;
      eliminationReason = `Blocos abaixo do mínimo: ${belowBlockMinimums.join(', ')}`;
      console.log(`[recalculateUserScore] ❌ ELIMINADO por bloco: ${eliminationReason}`);
    }
    
    // 4.3) Verificar mínimo GLOBAL usando disciplines JSONB
    if (!isEliminated) {
      // Calcular soma total das notas objetivas (já considera pesos)
      const totalObjectiveScore = subjectScoresTot;
      
      // Verificar se há mínimo global configurado nos blocos de disciplinas
      let minimumTotalScore = 0;
      let minimumTotalScoreCotas = 0;
      
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        // Procurar pelo primeiro bloco que tenha os campos de mínimo global
        for (const block of concurso.disciplines) {
          if (block.minimum_total_score && block.minimum_total_score > 0) {
            minimumTotalScore = block.minimum_total_score;
          }
          if (block.minimum_total_score_cotas && block.minimum_total_score_cotas > 0) {
            minimumTotalScoreCotas = block.minimum_total_score_cotas;
          }
          // Se encontrou ambos, pode parar
          if (minimumTotalScore > 0 && minimumTotalScoreCotas > 0) {
            break;
          }
        }
      }
      
      // Determinar qual mínimo usar baseado no tipo de reserva
      const reservationType = userRankingData?.user_data?.reservation_type || 'Ampla Concorrência';
      const isQuotaUser = reservationType !== 'Ampla Concorrência';
      
      let requiredMinimum = 0;
      let minimumType = '';
      
      if (isQuotaUser && minimumTotalScoreCotas > 0) {
        requiredMinimum = minimumTotalScoreCotas;
        minimumType = 'cota';
      } else if (minimumTotalScore > 0) {
        requiredMinimum = minimumTotalScore;
        minimumType = 'geral';
      }
      
      if (requiredMinimum > 0) {
        const isBelowMinimum = totalObjectiveScore < requiredMinimum;
        
        console.log(`[recalculateUserScore] Verificação mínimo ${minimumType}:`, {
          reservationType,
          isQuotaUser,
          requiredMinimum,
          totalObjectiveScore,
          isBelowMinimum,
          minimumTotalScore,
          minimumTotalScoreCotas
        });
        
        if (isBelowMinimum) {
          isEliminated = true;
          eliminationReason = `Mínimo ${minimumType} não atingido: ${totalObjectiveScore} < ${requiredMinimum}`;
          console.log(`[recalculateUserScore] ❌ ELIMINADO por mínimo ${minimumType}: ${eliminationReason}`);
        }
      }
    }
    
    // 4.4) Verificar mínimos SUBJETIVOS (já calculado acima)
    if (!isEliminated && belowDisciplineMinimums.length > 0) {
      // Verificar se há mínimos subjetivos não atingidos
      const subjectiveMinimums = belowDisciplineMinimums.filter(d => 
        ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(d)
      );
      
      if (subjectiveMinimums.length > 0) {
        isEliminated = true;
        eliminationReason = `Mínimos subjetivos não atingidos: ${subjectiveMinimums.join(', ')}`;
        console.log(`[recalculateUserScore] ❌ ELIMINADO por mínimo subjetivo: ${eliminationReason}`);
      }
    }
    
    // 4.5) Resultado final
    if (!isEliminated) {
      console.log(`[recalculateUserScore] ✅ CLASSIFICADO - Todos os mínimos atingidos`);
    } else {
      console.log(`[recalculateUserScore] ❌ ELIMINADO - ${eliminationReason}`);
    }

    const belowMinimum = isEliminated;

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
            subject_scores_tot: subjectScoresTot, // Total das objetivas - ANTES de object_scores
            object_scores: correctSubjectScores, // Estrutura correta (apenas objetivas)
            subjective_scores: subjectiveScoresTot, // Soma das subjetivas - ANTES de subjectives
            subjectives: correctSubjectives, // Pontuações subjetivas individuais
            status: belowMinimum ? 'eliminado' : 'classificado',
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
