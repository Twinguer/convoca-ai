
import { supabase } from '../client';

// Function to save user answers and calculate scores
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { question_number: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // First, save the user's answers
    const answersData = answers.map(a => ({
      user_ranking_id: rankingId,
      question_number: a.question_number,
      answer: a.answer,
      is_basic_knowledge: a.isBasicKnowledge,
      is_specific_1: false,
      is_specific_2: false,
      is_specific_3: false
    }));
    
    console.log('Saving user answers:', answersData);
    
    // Delete existing answers first
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Get concurso data to determine question ranges
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;
    
    // Calculate question ranges
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
    
    // Set correct section flags
    answersData.forEach(item => {
      const qNum = item.question_number;
      
      if (qNum <= basicEnd) {
        item.is_basic_knowledge = true;
      } else if (qNum <= specific1End) {
        item.is_basic_knowledge = false;
        item.is_specific_1 = true;
      } else if (qNum <= specific2End) {
        item.is_basic_knowledge = false;
        item.is_specific_2 = true;
      } else {
        item.is_basic_knowledge = false;
        item.is_specific_3 = true;
      }
    });
    
    console.log('Updated answers with correct section flags:', answersData);
    
    // Insert new answers
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;
    
    // Get the official answer key
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    console.log('Official answer key:', answerKey);
    console.log('User answers to check:', answers);
    
    // Calculate scores
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;
    
    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.question_number
      );
      
      if (officialAnswer) {
        // Para questões anuladas, pontua apenas quem errou
        if (officialAnswer.is_nullified && officialAnswer.answer !== userAnswer.answer) {
          if (userAnswer.isBasicKnowledge) {
            basicKnowledgeScore += 1;
          } else {
            specificKnowledgeScore += 1;
            
            // Compare question number with ranges to determine section
            const qNum = userAnswer.question_number;
            
            if (qNum > basicEnd && qNum <= specific1End) {
              specific1Score += 1;
            } else if (qNum > specific1End && qNum <= specific2End) {
              specific2Score += 1;
            } else if (qNum > specific2End) {
              specific3Score += 1;
            }
          }
        }
        // Para questões normais, pontua quem acertou
        else if (!officialAnswer.is_nullified && officialAnswer.answer === userAnswer.answer) {
          if (userAnswer.isBasicKnowledge) {
            basicKnowledgeScore += 1;
          } else {
            specificKnowledgeScore += 1;
            
            // Compare question number with ranges to determine section
            const qNum = userAnswer.question_number;
            
            if (qNum > basicEnd && qNum <= specific1End) {
              specific1Score += 1;
            } else if (qNum > specific1End && qNum <= specific2End) {
              specific2Score += 1;
            } else if (qNum > specific2End) {
              specific3Score += 1;
            }
          }
        }
      }
    });
    
    console.log('Calculated raw scores:', {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score
    });
    
    // Get concurso weights
    const { data: concursoWithWeights, error: concursoWeightsError } = await supabase
      .from('concursos')
      .select(`
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
      
    if (concursoWeightsError) {
      console.error('Error fetching concurso weights:', concursoWeightsError);
      throw concursoWeightsError;
    }
    
    // Get the correct weights
    const basicWeight = concursoWithWeights?.basic_knowledge_weight || 1;
    const specific1Weight = concursoWithWeights?.specific_knowledge_1_weight || 1;
    const specific2Weight = concursoWithWeights?.specific_knowledge_2_weight || 1;
    const specific3Weight = concursoWithWeights?.specific_knowledge_3_weight || 1;
    
    console.log('Retrieved weights from database:', {
      basicWeight,
      specific1Weight,
      specific2Weight,
      specific3Weight,
      fullConcursoData: concursoWithWeights
    });
    
    // Calculate weighted scores
    const weightedBasicScore = basicKnowledgeScore * basicWeight;
    const weightedSpecific1Score = specific1Score * specific1Weight;
    const weightedSpecific2Score = specific2Score * specific2Weight;
    const weightedSpecific3Score = specific3Score * specific3Weight;
    
    // Get existing subjective scores from user_rankings to include in total score
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
      console.error('Error fetching existing subjective scores:', rankingError);
    }
    
    // Calculate subjective scores with weights
    const discursiveScore = (rankingData?.discursive_score || 0);
    const caseStudy1Score = (rankingData?.case_study_1_score || 0);
    const caseStudy2Score = (rankingData?.case_study_2_score || 0);
    const caseStudy3Score = (rankingData?.case_study_3_score || 0);
    
    const weightedDiscursiveScore = discursiveScore * (concursoWithWeights?.discursive_weight || 1);
    const weightedCaseStudy1Score = caseStudy1Score * (concursoWithWeights?.case_study_1_weight || 1);
    const weightedCaseStudy2Score = caseStudy2Score * (concursoWithWeights?.case_study_2_weight || 1);
    const weightedCaseStudy3Score = caseStudy3Score * (concursoWithWeights?.case_study_3_weight || 1);
    
    console.log('Subjective scores:', {
      discursiveScore,
      weightedDiscursiveScore,
      caseStudy1Score,
      weightedCaseStudy1Score,
      caseStudy2Score,
      weightedCaseStudy2Score,
      caseStudy3Score,
      weightedCaseStudy3Score
    });
    
    // Calculate total score including subjective scores
    const totalScore = 
      weightedBasicScore + 
      weightedSpecific1Score + 
      weightedSpecific2Score + 
      weightedSpecific3Score +
      weightedDiscursiveScore +
      weightedCaseStudy1Score +
      weightedCaseStudy2Score +
      weightedCaseStudy3Score;
    
    console.log('Weighted scores:', {
      weightedBasicScore,
      weightedSpecific1Score,
      weightedSpecific2Score,
      weightedSpecific3Score,
      totalWithObjective: weightedBasicScore + weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
      totalWithSubjective: totalScore,
      weights: {
        basic: basicWeight,
        specific1: specific1Weight,
        specific2: specific2Weight,
        specific3: specific3Weight,
        discursive: concursoWithWeights?.discursive_weight || 1,
        caseStudy1: concursoWithWeights?.case_study_1_weight || 1,
        caseStudy2: concursoWithWeights?.case_study_2_weight || 1,
        caseStudy3: concursoWithWeights?.case_study_3_weight || 1
      }
    });
    
    // Update user ranking with scores
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
    console.error('Error saving answers and calculating score:', error);
    throw error;
  }
};

// Function to recalculate scores for all users when answer key changes
export const recalculateAllUserScores = async (concursoId: string) => {
  try {
    console.log(`Recalculating scores for all users in concurso: ${concursoId}`);
    
    // Get all user rankings for this concurso
    const { data: userRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('id, user_id')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (!userRankings || userRankings.length === 0) {
      console.log('No user rankings found for this concurso');
      return { success: true, updatedCount: 0 };
    }
    
    console.log(`Found ${userRankings.length} user rankings to update`);
    
    // Get exam structure and weights
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
    
    // Get answer key
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      console.log('No answer key found for this concurso');
      return { success: false, error: 'Gabarito oficial não encontrado' };
    }
    
    // Process each user ranking
    let updatedCount = 0;
    for (const ranking of userRankings) {
      // Get user answers
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_ranking_id', ranking.id);
        
      if (answersError) {
        console.error(`Error fetching answers for user ranking ${ranking.id}:`, answersError);
        continue;
      }
      
      if (!userAnswers || userAnswers.length === 0) {
        console.log(`No answers found for user ranking ${ranking.id}`);
        continue;
      }
      
      // Calculate scores using the same logic as in saveUserAnswers
      // Calculate question ranges
      const basicEnd = concurso.basic_knowledge_questions || 0;
      const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
      const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
      
      // Calculate raw scores
      let basicKnowledgeScore = 0;
      let specificKnowledgeScore = 0;
      let specific1Score = 0;
      let specific2Score = 0;
      let specific3Score = 0;
      
      userAnswers.forEach(userAnswer => {
        const officialAnswer = answerKey.find(
          a => a.question_number === userAnswer.question_number
        );
        
        if (officialAnswer) {
          // Para questões anuladas, pontua apenas quem errou
          if (officialAnswer.is_nullified && officialAnswer.answer !== userAnswer.answer) {
            if (userAnswer.is_basic_knowledge) {
              basicKnowledgeScore += 1;
            } else {
              specificKnowledgeScore += 1;
              
              // Compare question number with ranges to determine section
              const qNum = userAnswer.question_number;
              
              if (qNum > basicEnd && qNum <= specific1End) {
                specific1Score += 1;
              } else if (qNum > specific1End && qNum <= specific2End) {
                specific2Score += 1;
              } else if (qNum > specific2End) {
                specific3Score += 1;
              }
            }
          }
          // Para questões normais, pontua quem acertou
          else if (!officialAnswer.is_nullified && officialAnswer.answer === userAnswer.answer) {
            if (userAnswer.is_basic_knowledge) {
              basicKnowledgeScore += 1;
            } else {
              specificKnowledgeScore += 1;
              
              // Compare question number with ranges to determine section
              const qNum = userAnswer.question_number;
              
              if (qNum > basicEnd && qNum <= specific1End) {
                specific1Score += 1;
              } else if (qNum > specific1End && qNum <= specific2End) {
                specific2Score += 1;
              } else if (qNum > specific2End) {
                specific3Score += 1;
              }
            }
          }
        }
      });
      
      // Get subjective scores
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
        console.error(`Error fetching subjective scores for ranking ${ranking.id}:`, rankingError);
        continue;
      }
      
      // Get weights
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      
      // Calculate weighted scores
      const weightedBasicScore = basicKnowledgeScore * basicWeight;
      const weightedSpecific1Score = specific1Score * specific1Weight;
      const weightedSpecific2Score = specific2Score * specific2Weight;
      const weightedSpecific3Score = specific3Score * specific3Weight;
      
      // Add subjective scores
      const discursiveScore = (rankingData?.discursive_score || 0);
      const caseStudy1Score = (rankingData?.case_study_1_score || 0);
      const caseStudy2Score = (rankingData?.case_study_2_score || 0);
      const caseStudy3Score = (rankingData?.case_study_3_score || 0);
      
      const weightedDiscursiveScore = discursiveScore * (concurso.discursive_weight || 1);
      const weightedCaseStudy1Score = caseStudy1Score * (concurso.case_study_1_weight || 1);
      const weightedCaseStudy2Score = caseStudy2Score * (concurso.case_study_2_weight || 1);
      const weightedCaseStudy3Score = caseStudy3Score * (concurso.case_study_3_weight || 1);
      
      // Calculate total score
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score +
        weightedDiscursiveScore +
        weightedCaseStudy1Score +
        weightedCaseStudy2Score +
        weightedCaseStudy3Score;
      
      // Update the ranking with ALL weighted fields
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          specific_knowledge_1_score: specific1Score,
          specific_knowledge_2_score: specific2Score,
          specific_knowledge_3_score: specific3Score,
          weighted_basic_score: weightedBasicScore,
          weighted_specific_1_score: weightedSpecific1Score,
          weighted_specific_2_score: weightedSpecific2Score,
          weighted_specific_3_score: weightedSpecific3Score,
          weighted_discursive_score: weightedDiscursiveScore,
          weighted_case_study_1_score: weightedCaseStudy1Score,
          weighted_case_study_2_score: weightedCaseStudy2Score,
          weighted_case_study_3_score: weightedCaseStudy3Score,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', ranking.id);
        
      if (updateError) {
        console.error(`Error updating scores for ranking ${ranking.id}:`, updateError);
        continue;
      }
      
      updatedCount++;
    }
    
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error('Error recalculating all user scores:', error);
    throw error;
  }
};

// Função de cálculo de pontuação para considerar questões anuladas
export const calculateAndUpdateScore = async (
  userAnswers: { question_number: number; answer: string; isBasicKnowledge: boolean; isNullified: boolean }[],
  officialAnswers: any[],
  concursoId: string,
  rankingId: string
) => {
  try {
    // Obter estrutura do concurso para definir pesos e intervalos de questões
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
        specific_knowledge_3_weight
      `)
      .eq('id', concursoId)
      .single();
      
    if (concursoError) throw concursoError;

    // Calcular intervalos das seções
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);

    // Preparar pontuação por seção
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    userAnswers.forEach(userAnswer => {
      const officialAnswer = officialAnswers.find(
        a => a.question_number === userAnswer.question_number
      );
      
      if (officialAnswer) {
        // Para questões anuladas, pontua quem errou
        if (officialAnswer.is_nullified && officialAnswer.answer !== userAnswer.answer) {
          if (userAnswer.isBasicKnowledge) {
            basicKnowledgeScore += 1;
          } else {
            specificKnowledgeScore += 1;
            
            const qNum = userAnswer.question_number;
            if (qNum > basicEnd && qNum <= specific1End) {
              specific1Score += 1;
            } else if (qNum > specific1End && qNum <= specific2End) {
              specific2Score += 1;
            } else {
              specific3Score += 1;
            }
          }
        } 
        // Para questões normais, mantém a lógica de pontuação existente
        else if (!officialAnswer.is_nullified && officialAnswer.answer === userAnswer.answer) {
          if (userAnswer.isBasicKnowledge) {
            basicKnowledgeScore += 1;
          } else {
            specificKnowledgeScore += 1;
            
            const qNum = userAnswer.question_number;
            if (qNum > basicEnd && qNum <= specific1End) {
              specific1Score += 1;
            } else if (qNum > specific1End && qNum <= specific2End) {
              specific2Score += 1;
            } else {
              specific3Score += 1;
            }
          }
        }
      }
    });

    // Calcular pontuações com pesos
    const basicWeight = concurso.basic_knowledge_weight || 1;
    const specific1Weight = concurso.specific_knowledge_1_weight || 1;
    const specific2Weight = concurso.specific_knowledge_2_weight || 1;
    const specific3Weight = concurso.specific_knowledge_3_weight || 1;

    const weightedBasicScore = basicKnowledgeScore * basicWeight;
    const weightedSpecific1Score = specific1Score * specific1Weight;
    const weightedSpecific2Score = specific2Score * specific2Weight;
    const weightedSpecific3Score = specific3Score * specific3Weight;

    // Atualizar pontuação do ranking
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        specific_knowledge_1_score: specific1Score,
        specific_knowledge_2_score: specific2Score,
        specific_knowledge_3_score: specific3Score,
        score: weightedBasicScore + weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;

  } catch (error) {
    console.error('Error calculating score:', error);
  }
};
