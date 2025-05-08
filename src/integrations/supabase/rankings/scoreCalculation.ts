
import { getExamStructure } from "./examStructure";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../client";

// Calcula pontuação bruta com base nas respostas e no gabarito
export const calculateRawScores = async (
  concursoId: string,
  userAnswers: any[]
) => {
  try {
    // Obtenha o gabarito oficial com pesos
    const { data: answerKey, error: keyError } = await supabase.rpc(
      'get_official_answer_weights',
      {
        p_concurso_id: concursoId
      }
    );

    if (keyError) throw keyError;
    if (!answerKey || Object.keys(answerKey).length === 0) {
      console.error(
        '[calculateRawScores] Gabarito oficial não encontrado para este concurso'
      );
      
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }

    // Logging para depuração
    console.log(`[calculateRawScores] Número de questões no gabarito: ${Object.keys(answerKey).length}`);
    const nullifiedQuestions = Object.entries(answerKey).filter(([_, q]: [string, any]) => q.anulada);
    console.log(`[calculateRawScores] Questões anuladas: ${nullifiedQuestions.length}`);
    if (nullifiedQuestions.length > 0) {
      console.log('[calculateRawScores] Questões anuladas:', 
        nullifiedQuestions.map(([q, _]) => q).join(', '));
    }

    // Carregue os dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select(`
        basic_knowledge_questions,
        specific_knowledge_1_questions,
        specific_knowledge_2_questions,
        specific_knowledge_3_questions,
        lpt_questions,
        ing_questions,
        mat_questions,
        rlm_questions,
        est_questions,
        cos_questions,
        adm_questions,
        ado_questions,
        cot_questions,
        coc_questions,
        eco_questions,
        tri_questions,
        afo_questions,
        ltc_questions,
        tic_questions,
        ett_questions,
        aud_questions,
        civ_questions,
        pen_questions,
        inf_questions,
        emp_questions,
        mtf_questions,
        out_questions
      `)
      .eq('id', concursoId)
      .single();
    if (concursoError) throw concursoError;

    const examStructure = getExamStructure(concurso);

    // Inicializa contadores de acertos por seção
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    let specific1Score = 0;
    let specific2Score = 0;
    let specific3Score = 0;

    // Contadores para novas áreas de conhecimento
    let lptScore = 0;
    let ingScore = 0;
    let matScore = 0;
    let rlmScore = 0;
    let estScore = 0;
    let cosScore = 0;
    let admScore = 0;
    let adoScore = 0;
    let cotScore = 0;
    let cocScore = 0;
    let ecoScore = 0;
    let triScore = 0;
    let afoScore = 0;
    let ltcScore = 0;
    let ticScore = 0;
    let ettScore = 0;
    let audScore = 0;
    let civScore = 0;
    let penScore = 0;
    let infScore = 0;
    let empScore = 0;
    let mtfScore = 0;
    let outScore = 0;

    // Debug log para respostas do usuário
    console.log(`[calculateRawScores] Número de respostas do usuário: ${userAnswers.length}`);

    // Calcula os acertos
    userAnswers.forEach(userAnswer => {
      const questionNumber = userAnswer.question_number;
      const questionKey = `questao${questionNumber}`;
      const officialAnswer = answerKey[questionKey];

      // Verificação detalhada para depuração
      if (officialAnswer) {
        const isNullified = officialAnswer.anulada;
        const isCorrect = officialAnswer.resposta === userAnswer.answer;
        const sectionType = officialAnswer.secao || 'unknown';
        
        console.log(`[calculateRawScores] Questão ${questionNumber}: ` +
          `Anulada: ${isNullified}, ` +
          `Seção: ${sectionType}, ` +
          `Resposta oficial: ${officialAnswer.resposta}, ` +
          `Resposta do usuário: ${userAnswer.answer}, ` +
          `Correta: ${isCorrect}`);

        // Contabiliza acerto se a questão é anulada ou a resposta está correta
        if (isNullified || isCorrect) {
          // Usamos o campo secao (section_type) do gabarito oficial
          const weight = officialAnswer.peso || 1;
          
          // Contabilizar pontuação com base na seção/tipo da questão
          switch (sectionType.toLowerCase()) {
            case 'basic':
              basicKnowledgeScore += weight;
              break;
            case 'specific1':
              specific1Score += weight;
              specificKnowledgeScore += weight;
              break;
            case 'specific2':
              specific2Score += weight;
              specificKnowledgeScore += weight;
              break;
            case 'specific3':
              specific3Score += weight;
              specificKnowledgeScore += weight;
              break;
            case 'lpt':
              lptScore += weight;
              break;
            case 'ing':
              ingScore += weight;
              break;
            case 'mat':
              matScore += weight;
              break;
            case 'rlm':
              rlmScore += weight;
              break;
            case 'est':
              estScore += weight;
              break;
            case 'cos':
              cosScore += weight;
              break;
            case 'adm':
              admScore += weight;
              break;
            case 'ado':
              adoScore += weight;
              break;
            case 'cot':
              cotScore += weight;
              break;
            case 'coc':
              cocScore += weight;
              break;
            case 'eco':
              ecoScore += weight;
              break;
            case 'tri':
              triScore += weight;
              break;
            case 'afo':
              afoScore += weight;
              break;
            case 'ltc':
              ltcScore += weight;
              break;
            case 'tic':
              ticScore += weight;
              break;
            case 'ett':
              ettScore += weight;
              break;
            case 'aud':
              audScore += weight;
              break;
            case 'civ':
              civScore += weight;
              break;
            case 'pen':
              penScore += weight;
              break;
            case 'inf':
              infScore += weight;
              break;
            case 'emp':
              empScore += weight;
              break;
            case 'mtf':
              mtfScore += weight;
              break;
            case 'out':
              outScore += weight;
              break;
            default:
              // Fallback usando legacy flags
              if (userAnswer.is_basic_knowledge) {
                basicKnowledgeScore += weight;
              } else if (userAnswer.is_specific_1) {
                specific1Score += weight;
                specificKnowledgeScore += weight;
              } else if (userAnswer.is_specific_2) {
                specific2Score += weight;
                specificKnowledgeScore += weight;
              } else if (userAnswer.is_specific_3) {
                specific3Score += weight;
                specificKnowledgeScore += weight;
              }
              break;
          }
        }
      } else {
        console.log(`[calculateRawScores] ALERTA: Questão ${questionNumber} não encontrada no gabarito oficial`);
      }
    });

    // Log das pontuações calculadas
    console.log(`[calculateRawScores] Pontuações calculadas: ` +
      `Básico: ${basicKnowledgeScore}, ` +
      `Específico total: ${specificKnowledgeScore} ` +
      `(E1: ${specific1Score}, E2: ${specific2Score}, E3: ${specific3Score})`);

    return {
      basicKnowledgeScore,
      specificKnowledgeScore,
      specific1Score,
      specific2Score,
      specific3Score,
      lptScore,
      ingScore,
      matScore,
      rlmScore,
      estScore,
      cosScore,
      admScore,
      adoScore,
      cotScore,
      cocScore,
      ecoScore,
      triScore,
      afoScore,
      ltcScore,
      ticScore,
      ettScore,
      audScore,
      civScore,
      penScore,
      infScore,
      empScore,
      mtfScore,
      outScore
    };
  } catch (error) {
    console.error('[calculateRawScores] Error calculating raw scores:', error);
    throw error;
  }
};

// Aplica pesos para calcular as pontuações finais
export const applyWeightsToScores = async (
  concursoId: string,
  scores: {
    basicKnowledgeScore: number;
    specificKnowledgeScore: number;
    specific1Score: number;
    specific2Score: number;
    specific3Score: number;
    lptScore: number;
    ingScore: number;
    matScore: number;
    rlmScore: number;
    estScore: number;
    cosScore: number;
    admScore: number;
    adoScore: number;
    cotScore: number;
    cocScore: number;
    ecoScore: number;
    triScore: number;
    afoScore: number;
    ltcScore: number;
    ticScore: number;
    ettScore: number;
    audScore: number;
    civScore: number;
    penScore: number;
    infScore: number;
    empScore: number;
    mtfScore: number;
    outScore: number;
  },
  subjectiveScores: {
    discursiveScore: number;
    caseStudy1Score: number;
    caseStudy2Score: number;
    caseStudy3Score: number;
  }
) => {
  try {    
    // Obtenha os pesos do concurso
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
        case_study_3_weight,
        lpt_weight,
        ing_weight,
        mat_weight,
        rlm_weight,
        est_weight,
        cos_weight,
        adm_weight,
        ado_weight,
        cot_weight,
        coc_weight,
        eco_weight,
        tri_weight,
        afo_weight,
        ltc_weight,
        tic_weight,
        ett_weight,
        aud_weight,
        civ_weight,
        pen_weight,
        inf_weight,
        emp_weight,
        mtf_weight,
        out_weight
      `)
      .eq('id', concursoId)
      .single();
    if (concursoWeightsError) throw concursoWeightsError;
    
    // Extrai os pesos
    const weights = {
      basicKnowledge: concursoWithWeights?.basic_knowledge_weight || 1,
      specificKnowledge1: concursoWithWeights?.specific_knowledge_1_weight || 1,
      specificKnowledge2: concursoWithWeights?.specific_knowledge_2_weight || 1,
      specificKnowledge3: concursoWithWeights?.specific_knowledge_3_weight || 1,
      discursive: concursoWithWeights?.discursive_weight || 1,
      caseStudy1: concursoWithWeights?.case_study_1_weight || 1,
      caseStudy2: concursoWithWeights?.case_study_2_weight || 1,
      caseStudy3: concursoWithWeights?.case_study_3_weight || 1,
      
      // Pesos para novas áreas
      lpt: concursoWithWeights?.lpt_weight || 1,
      ing: concursoWithWeights?.ing_weight || 1,
      mat: concursoWithWeights?.mat_weight || 1,
      rlm: concursoWithWeights?.rlm_weight || 1,
      est: concursoWithWeights?.est_weight || 1,
      cos: concursoWithWeights?.cos_weight || 1,
      adm: concursoWithWeights?.adm_weight || 1,
      ado: concursoWithWeights?.ado_weight || 1,
      cot: concursoWithWeights?.cot_weight || 1,
      coc: concursoWithWeights?.coc_weight || 1,
      eco: concursoWithWeights?.eco_weight || 1,
      tri: concursoWithWeights?.tri_weight || 1,
      afo: concursoWithWeights?.afo_weight || 1,
      ltc: concursoWithWeights?.ltc_weight || 1,
      tic: concursoWithWeights?.tic_weight || 1,
      ett: concursoWithWeights?.ett_weight || 1,
      aud: concursoWithWeights?.aud_weight || 1,
      civ: concursoWithWeights?.civ_weight || 1,
      pen: concursoWithWeights?.pen_weight || 1,
      inf: concursoWithWeights?.inf_weight || 1,
      emp: concursoWithWeights?.emp_weight || 1,
      mtf: concursoWithWeights?.mtf_weight || 1,
      out: concursoWithWeights?.out_weight || 1
    };

    console.log('[applyWeightsToScores] Pesos do concurso:', weights);
    console.log('[applyWeightsToScores] Pontuações brutas:', scores);

    // Aplica os pesos
    const weightedScores = {
      weightedBasicScore: scores.basicKnowledgeScore * weights.basicKnowledge,
      weightedSpecific1Score: scores.specific1Score * weights.specificKnowledge1,
      weightedSpecific2Score: scores.specific2Score * weights.specificKnowledge2,
      weightedSpecific3Score: scores.specific3Score * weights.specificKnowledge3,
      weightedDiscursiveScore: subjectiveScores.discursiveScore * weights.discursive,
      weightedCaseStudy1Score: subjectiveScores.caseStudy1Score * weights.caseStudy1,
      weightedCaseStudy2Score: subjectiveScores.caseStudy2Score * weights.caseStudy2,
      weightedCaseStudy3Score: subjectiveScores.caseStudy3Score * weights.caseStudy3,
      
      // Pesos para novas áreas
      weightedLptScore: scores.lptScore * weights.lpt,
      weightedIngScore: scores.ingScore * weights.ing,
      weightedMatScore: scores.matScore * weights.mat,
      weightedRlmScore: scores.rlmScore * weights.rlm,
      weightedEstScore: scores.estScore * weights.est,
      weightedCosScore: scores.cosScore * weights.cos,
      weightedAdmScore: scores.admScore * weights.adm,
      weightedAdoScore: scores.adoScore * weights.ado,
      weightedCotScore: scores.cotScore * weights.cot,
      weightedCocScore: scores.cocScore * weights.coc,
      weightedEcoScore: scores.ecoScore * weights.eco,
      weightedTriScore: scores.triScore * weights.tri,
      weightedAfoScore: scores.afoScore * weights.afo,
      weightedLtcScore: scores.ltcScore * weights.ltc,
      weightedTicScore: scores.ticScore * weights.tic,
      weightedEttScore: scores.ettScore * weights.ett,
      weightedAudScore: scores.audScore * weights.aud,
      weightedCivScore: scores.civScore * weights.civ,
      weightedPenScore: scores.penScore * weights.pen,
      weightedInfScore: scores.infScore * weights.inf,
      weightedEmpScore: scores.empScore * weights.emp,
      weightedMtfScore: scores.mtfScore * weights.mtf,
      weightedOutScore: scores.outScore * weights.out
    };

    console.log('[applyWeightsToScores] Pontuações ponderadas:', weightedScores);

    // Calcula o score total
    const totalScore =
      weightedScores.weightedBasicScore +
      weightedScores.weightedSpecific1Score +
      weightedScores.weightedSpecific2Score +
      weightedScores.weightedSpecific3Score +
      weightedScores.weightedDiscursiveScore +
      weightedScores.weightedCaseStudy1Score +
      weightedScores.weightedCaseStudy2Score +
      weightedScores.weightedCaseStudy3Score +
      weightedScores.weightedLptScore +
      weightedScores.weightedIngScore +
      weightedScores.weightedMatScore +
      weightedScores.weightedRlmScore +
      weightedScores.weightedEstScore +
      weightedScores.weightedCosScore +
      weightedScores.weightedAdmScore +
      weightedScores.weightedAdoScore +
      weightedScores.weightedCotScore +
      weightedScores.weightedCocScore +
      weightedScores.weightedEcoScore +
      weightedScores.weightedTriScore +
      weightedScores.weightedAfoScore +
      weightedScores.weightedLtcScore +
      weightedScores.weightedTicScore +
      weightedScores.weightedEttScore +
      weightedScores.weightedAudScore +
      weightedScores.weightedCivScore +
      weightedScores.weightedPenScore +
      weightedScores.weightedInfScore +
      weightedScores.weightedEmpScore +
      weightedScores.weightedMtfScore +
      weightedScores.weightedOutScore;

    return {
      ...weightedScores,
      totalScore
    };
  } catch (error) {
    console.error('Error applying weights to scores:', error);
    throw error;
  }
};

// Salva todas as pontuações do usuário (brutas e ponderadas)
export const saveUserScores = async (
  rankingId: string,
  rawScores: {
    basicKnowledgeScore: number;
    specificKnowledgeScore: number;
    specific1Score: number;
    specific2Score: number;
    specific3Score: number;
    lptScore: number;
    ingScore: number;
    matScore: number;
    rlmScore: number;
    estScore: number;
    cosScore: number;
    admScore: number;
    adoScore: number;
    cotScore: number;
    cocScore: number;
    ecoScore: number;
    triScore: number;
    afoScore: number;
    ltcScore: number;
    ticScore: number;
    ettScore: number;
    audScore: number;
    civScore: number;
    penScore: number;
    infScore: number;
    empScore: number;
    mtfScore: number;
    outScore: number;
  },
  subjectiveScores: {
    discursiveScore: number;
    caseStudy1Score: number;
    caseStudy2Score: number;
    caseStudy3Score: number;
  },
  weightedScores: {
    weightedBasicScore: number;
    weightedSpecific1Score: number;
    weightedSpecific2Score: number;
    weightedSpecific3Score: number;
    weightedDiscursiveScore: number;
    weightedCaseStudy1Score: number;
    weightedCaseStudy2Score: number;
    weightedCaseStudy3Score: number;
    weightedLptScore: number;
    weightedIngScore: number;
    weightedMatScore: number;
    weightedRlmScore: number;
    weightedEstScore: number;
    weightedCosScore: number;
    weightedAdmScore: number;
    weightedAdoScore: number;
    weightedCotScore: number;
    weightedCocScore: number;
    weightedEcoScore: number;
    weightedTriScore: number;
    weightedAfoScore: number;
    weightedLtcScore: number;
    weightedTicScore: number;
    weightedEttScore: number;
    weightedAudScore: number;
    weightedCivScore: number;
    weightedPenScore: number;
    weightedInfScore: number;
    weightedEmpScore: number;
    weightedMtfScore: number;
    weightedOutScore: number;
    totalScore: number;
  }
) => {
  try {
    console.log('[saveUserScores] Salvando pontuações para ranking:', rankingId);
    console.log('[saveUserScores] Pontuações brutas:', rawScores);
    console.log('[saveUserScores] Pontuações ponderadas:', weightedScores);
    
    // Atualiza o ranking do usuário com todas as pontuações
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        // Pontuações brutas - conhecimentos padrão
        basic_knowledge_score: rawScores.basicKnowledgeScore,
        specific_knowledge_score: rawScores.specificKnowledgeScore,
        specific_knowledge_1_score: rawScores.specific1Score,
        specific_knowledge_2_score: rawScores.specific2Score,
        specific_knowledge_3_score: rawScores.specific3Score,
        
        // Pontuações brutas - discursivas
        discursive_score: subjectiveScores.discursiveScore,
        case_study_1_score: subjectiveScores.caseStudy1Score,
        case_study_2_score: subjectiveScores.caseStudy2Score,
        case_study_3_score: subjectiveScores.caseStudy3Score,
        
        // Pontuações brutas - novas áreas
        lpt_score: rawScores.lptScore,
        ing_score: rawScores.ingScore,
        mat_score: rawScores.matScore,
        rlm_score: rawScores.rlmScore,
        est_score: rawScores.estScore,
        cos_score: rawScores.cosScore,
        adm_score: rawScores.admScore,
        ado_score: rawScores.adoScore,
        cot_score: rawScores.cotScore,
        coc_score: rawScores.cocScore,
        eco_score: rawScores.ecoScore,
        tri_score: rawScores.triScore,
        afo_score: rawScores.afoScore,
        ltc_score: rawScores.ltcScore,
        tic_score: rawScores.ticScore,
        ett_score: rawScores.ettScore,
        aud_score: rawScores.audScore,
        civ_score: rawScores.civScore,
        pen_score: rawScores.penScore,
        inf_score: rawScores.infScore,
        emp_score: rawScores.empScore,
        mtf_score: rawScores.mtfScore,
        out_score: rawScores.outScore,
        
        // Pontuações ponderadas - conhecimentos padrão
        weighted_basic_score: weightedScores.weightedBasicScore,
        weighted_specific_1_score: weightedScores.weightedSpecific1Score,
        weighted_specific_2_score: weightedScores.weightedSpecific2Score,
        weighted_specific_3_score: weightedScores.weightedSpecific3Score,
        
        // Pontuações ponderadas - discursivas
        weighted_discursive_score: weightedScores.weightedDiscursiveScore,
        weighted_case_study_1_score: weightedScores.weightedCaseStudy1Score,
        weighted_case_study_2_score: weightedScores.weightedCaseStudy2Score,
        weighted_case_study_3_score: weightedScores.weightedCaseStudy3Score,
        
        // Pontuações ponderadas - novas áreas
        weighted_lpt_score: weightedScores.weightedLptScore,
        weighted_ing_score: weightedScores.weightedIngScore,
        weighted_mat_score: weightedScores.weightedMatScore,
        weighted_rlm_score: weightedScores.weightedRlmScore,
        weighted_est_score: weightedScores.weightedEstScore,
        weighted_cos_score: weightedScores.weightedCosScore,
        weighted_adm_score: weightedScores.weightedAdmScore,
        weighted_ado_score: weightedScores.weightedAdoScore,
        weighted_cot_score: weightedScores.weightedCotScore,
        weighted_coc_score: weightedScores.weightedCocScore,
        weighted_eco_score: weightedScores.weightedEcoScore,
        weighted_tri_score: weightedScores.weightedTriScore,
        weighted_afo_score: weightedScores.weightedAfoScore,
        weighted_ltc_score: weightedScores.weightedLtcScore,
        weighted_tic_score: weightedScores.weightedTicScore,
        weighted_ett_score: weightedScores.weightedEttScore,
        weighted_aud_score: weightedScores.weightedAudScore,
        weighted_civ_score: weightedScores.weightedCivScore,
        weighted_pen_score: weightedScores.weightedPenScore,
        weighted_inf_score: weightedScores.weightedInfScore,
        weighted_emp_score: weightedScores.weightedEmpScore,
        weighted_mtf_score: weightedScores.weightedMtfScore,
        weighted_out_score: weightedScores.weightedOutScore,

        // Pontuação final
        score: weightedScores.totalScore,        
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return true;
  } catch (error) {
    console.error('Error saving user scores:', error);
    throw error;
  }
};

// Helper function to update section_type in official_answer_weights
export const updateSectionTypeForConcurso = async (concursoId: string) => {
  try {
    console.log('Updating section_type for concurso:', concursoId);
    
    // Get concurso structure
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
    
    // Calculate section ranges
    const basicEnd = concurso.basic_knowledge_questions || 0;
    const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
    const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
    
    // Update section_type for all answers
    // Basic knowledge questions
    if (basicEnd > 0) {
      const { error: basicUpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'basic' })
        .eq('concurso_id', concursoId)
        .lte('question_number', basicEnd);
        
      if (basicUpdateError) {
        console.error('Error updating basic knowledge section_type:', basicUpdateError);
        return {
          success: false,
          error: basicUpdateError.message
        };
      }
    }
    
    // Specific knowledge 1 questions
    if (concurso.specific_knowledge_1_questions > 0) {
      const { error: specific1UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific1' })
        .eq('concurso_id', concursoId)
        .gt('question_number', basicEnd)
        .lte('question_number', specific1End);
        
      if (specific1UpdateError) {
        console.error('Error updating specific1 section_type:', specific1UpdateError);
        return {
          success: false,
          error: specific1UpdateError.message
        };
      }
    }
    
    // Specific knowledge 2 questions
    if (concurso.specific_knowledge_2_questions > 0) {
      const { error: specific2UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific2' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific1End)
        .lte('question_number', specific2End);
        
      if (specific2UpdateError) {
        console.error('Error updating specific2 section_type:', specific2UpdateError);
        return {
          success: false,
          error: specific2UpdateError.message
        };
      }
    }
    
    // Specific knowledge 3 questions
    if (concurso.specific_knowledge_3_questions > 0) {
      const { error: specific3UpdateError } = await supabase
        .from('official_answer_weights')
        .update({ section_type: 'specific3' })
        .eq('concurso_id', concursoId)
        .gt('question_number', specific2End);
        
      if (specific3UpdateError) {
        console.error('Error updating specific3 section_type:', specific3UpdateError);
        return {
          success: false,
          error: specific3UpdateError.message
        };
      }
    }
    
    return {
      success: true
    };
  } catch (error: any) {
    console.error('Error updating section_type:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
