import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateScoreRequest {
  userId: string;
  concursoId: string;
  answers: Record<string, string>;
  bookletId: string;
  reservationType: string;
  subjectiveScores?: {
    discursive_score?: number;
    case_study_1_score?: number;
    case_study_2_score?: number;
    case_study_3_score?: number;
    other_subjective_score?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  const requestData: CalculateScoreRequest = await req.json();
  const { userId, concursoId, answers, bookletId, reservationType, subjectiveScores } = requestData;
  
  // Validar que o bookletId é válido
  if (!bookletId) {
    return new Response(
      JSON.stringify({ error: 'Booklet ID is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

    // Validar que o usuário só pode calcular seu próprio score
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Cannot calculate score for another user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[calculate-ranking-score] Processing for user ${userId}, concurso ${concursoId}`);

    // Buscar dados do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('official_answers, disciplines, exam_type')
      .eq('id', concursoId)
      .single();

    if (concursoError || !concurso) {
      console.error('[calculate-ranking-score] Error fetching concurso:', concursoError);
      return new Response(
        JSON.stringify({ error: 'Concurso not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar gabarito oficial do booklet específico
    const officialAnswers = concurso.official_answers?.[bookletId];
    if (!officialAnswers) {
      console.error(`[calculate-ranking-score] Official answers not found for booklet ${bookletId}`);
      return new Response(
        JSON.stringify({ error: `Official answers not found for booklet ${bookletId}` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular score de forma segura
    let totalScore = 0;
    const subjectScores: Record<string, number> = {};
    const blockScores: Record<string, number> = {};
    const examType = concurso.exam_type || 'Múltipla Escolha';
    
    // Extrair penalidade e mínimos da estrutura disciplines (JSONB)
    let wrongAnswerPenalty = 0;
    let minimumTotalScore = 0;
    let minimumTotalScoreCotas = 0;
    const blocks: any[] = [];
    
    if (concurso.disciplines && typeof concurso.disciplines === 'object' && !Array.isArray(concurso.disciplines)) {
      wrongAnswerPenalty = Number(concurso.disciplines.wrong_answer_penalty) || 0;
      minimumTotalScore = Number(concurso.disciplines.minimum_total_score) || 0;
      minimumTotalScoreCotas = Number(concurso.disciplines.minimum_total_score_cotas) || 0;
      blocks = concurso.disciplines.blocks || [];
    }

    console.log(`[calculate-ranking-score] Calculating score for ${Object.keys(answers).length} answers`);

    // Iterar pelas respostas do usuário
    for (const [questionNumber, userAnswer] of Object.entries(answers)) {
      const officialAnswerData = officialAnswers.questions?.[questionNumber];
      
      if (!officialAnswerData) {
        console.warn(`[calculate-ranking-score] Question ${questionNumber} not found in official answers`);
        continue;
      }

      const correctAnswer = officialAnswerData.correct_answer;
      const isNullified = officialAnswerData.is_nullified || false;
      const weight = officialAnswerData.weight || 1;
      const disciplineWeight = officialAnswerData.discipline_weight || 1;
      const sectionType = officialAnswerData.section_type;

      let questionScore = 0;

      // Questão anulada: sempre soma o peso
      if (isNullified) {
        questionScore = weight;
      } 
      // Resposta em branco
      else if (!userAnswer || userAnswer.trim() === '') {
        questionScore = 0;
      }
      // Resposta correta
      else if (userAnswer === correctAnswer) {
        questionScore = weight * disciplineWeight;
      }
      // Resposta errada
      else {
        if (examType === 'Certo ou Errado' && wrongAnswerPenalty > 0) {
          questionScore = -wrongAnswerPenalty * disciplineWeight;
        } else {
          questionScore = 0;
        }
      }

      totalScore += questionScore;

      // Acumular por disciplina/seção
      if (sectionType) {
        subjectScores[sectionType] = (subjectScores[sectionType] || 0) + questionScore;
      }

      // Acumular por bloco
      for (const block of blocks) {
        const blockId = block.blockId;
        const blockDisciplines = block.disciplines || [];
        
        for (const discipline of blockDisciplines) {
          if (discipline.id === sectionType) {
            blockScores[blockId] = (blockScores[blockId] || 0) + questionScore;
            break;
          }
        }
      }
    }

    // Adicionar pontuações subjetivas
    if (subjectiveScores) {
      totalScore += subjectiveScores.discursive_score || 0;
      totalScore += subjectiveScores.case_study_1_score || 0;
      totalScore += subjectiveScores.case_study_2_score || 0;
      totalScore += subjectiveScores.case_study_3_score || 0;
      totalScore += subjectiveScores.other_subjective_score || 0;
    }

    console.log(`[calculate-ranking-score] Total score calculated: ${totalScore}`);

    // Verificar mínimos
    const isCotas = reservationType !== 'Ampla Concorrência';
    const applicableMinimum = isCotas ? minimumTotalScoreCotas : minimumTotalScore;
    const belowMinimum = totalScore < applicableMinimum;
    
    const belowDisciplineMinimums: string[] = [];
    const belowBlockMinimums: string[] = [];
    const eliminationReasons: string[] = [];

    // Verificar mínimos por disciplina
    for (const block of blocks) {
      const blockDisciplines = block.disciplines || [];
      
      for (const discipline of blockDisciplines) {
        const disciplineId = discipline.id;
        const disciplineScore = subjectScores[disciplineId] || 0;
        const minScore = isCotas ? (discipline.minimum_score_cotas || 0) : (discipline.minimum_score || 0);
        
        if (minScore > 0 && disciplineScore < minScore) {
          belowDisciplineMinimums.push(disciplineId);
          eliminationReasons.push(`Abaixo do mínimo em ${discipline.name}: ${disciplineScore.toFixed(2)} < ${minScore}`);
        }
      }
    }

    // Verificar mínimos por bloco
    for (const block of blocks) {
      const blockId = block.blockId;
      const blockScore = blockScores[blockId] || 0;
      const minScore = isCotas ? (block.blockMinimumCotas || 0) : (block.blockMinimumScore || 0);
      
      if (minScore > 0 && blockScore < minScore) {
        belowBlockMinimums.push(blockId);
        eliminationReasons.push(`Abaixo do mínimo no bloco ${block.blockName}: ${blockScore.toFixed(2)} < ${minScore}`);
      }
    }

    // Verificar mínimo global
    if (belowMinimum) {
      eliminationReasons.push(`Abaixo do mínimo global: ${totalScore.toFixed(2)} < ${applicableMinimum}`);
    }

    // Determinar status
    let status = 'approved';
    if (belowMinimum || belowDisciplineMinimums.length > 0 || belowBlockMinimums.length > 0) {
      status = 'eliminated';
    }

    console.log(`[calculate-ranking-score] Status: ${status}, BelowMinimum: ${belowMinimum}`);

    // Preparar consolidated_data completo
    const consolidatedData = {
      answers,
      subject_scores: subjectScores,
      block_scores: blockScores,
      subjective_scores: subjectiveScores || {},
      below_minimum: belowMinimum,
      status,
      elimination_reasons: eliminationReasons,
      belowDisciplineMinimums,
      belowBlockMinimums,
      metadata: {
        last_updated: new Date().toISOString(),
        booklet_id: bookletId,
        calculation_source: 'edge_function',
        minimum_total_score: applicableMinimum,
      },
    };

    // Verificar se já existe um ranking para este usuário neste concurso
    const { data: existingRanking } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('user_id', userId)
      .eq('concurso_id', concursoId)
      .maybeSingle();

    if (existingRanking) {
      // Atualizar ranking existente
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          score: totalScore,
          reservation_type: reservationType,
          selected_booklet_id: bookletId,
          consolidated_data: consolidatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRanking.id);

      if (updateError) {
        console.error('[calculate-ranking-score] Error updating ranking:', updateError);
        throw updateError;
      }

      console.log(`[calculate-ranking-score] Updated ranking ${existingRanking.id}`);
    } else {
      // Criar novo ranking
      const { error: insertError } = await supabase
        .from('user_rankings')
        .insert({
          user_id: userId,
          concurso_id: concursoId,
          score: totalScore,
          reservation_type: reservationType,
          selected_booklet_id: bookletId,
          consolidated_data: consolidatedData,
        });

      if (insertError) {
        console.error('[calculate-ranking-score] Error inserting ranking:', insertError);
        throw insertError;
      }

      console.log(`[calculate-ranking-score] Created new ranking for user ${userId}`);
    }

    // Atualizar total_participants no concurso
    const { count } = await supabase
      .from('user_rankings')
      .select('*', { count: 'exact', head: true })
      .eq('concurso_id', concursoId);

    if (count !== null) {
      await supabase
        .from('concursos')
        .update({ total_participants: count })
        .eq('id', concursoId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        score: totalScore,
        subject_scores: subjectScores,
        calculation_source: 'edge_function',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[calculate-ranking-score] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
