import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  session_token: string;
}

Deno.serve(async (req) => {
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

    const body: RequestBody = await req.json();
    const { session_token } = body;

    if (!session_token) {
      return new Response(
        JSON.stringify({ error: 'session_token required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar sessão
    const { data: sessionValidation, error: validationError } = await supabase.rpc(
      'validate_session',
      { p_session_token: session_token }
    );

    if (validationError || !sessionValidation?.valid) {
      return new Response(
        JSON.stringify({ error: sessionValidation?.error || 'Invalid session' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter resource_id (backend-only, nunca exposto)
    const { data: resourceId, error: resourceError } = await supabase.rpc(
      'get_session_resource',
      { p_session_token: session_token }
    );

    if (resourceError || !resourceId) {
      return new Response(
        JSON.stringify({ error: 'Resource not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do ranking (usando RLS - já valida permissões)
    const { data: rankingData, error: rankingError } = await supabase
      .from('concursos')
      .select(`
        titulo,
        orgao,
        banca,
        exam_type,
        disciplines,
        status,
        exam_date,
        estados,
        cargos,
        minimum_total_score,
        minimum_total_score_cotas,
        exam_booklets (
          id,
          booklet_name,
          display_order
        )
      `)
      .eq('id', resourceId)
      .single();

    if (rankingError || !rankingData) {
      return new Response(
        JSON.stringify({ error: 'Ranking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados de participação do usuário se for contexto de participação
    let userRankingData = null;
    if (sessionValidation.context_type === 'participate_ranking') {
      const { data: userRanking } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('concurso_id', resourceId)
        .eq('user_id', user.id)
        .single();
      
      userRankingData = userRanking;
    }

    // Retornar dados (SEM IDs sensíveis, apenas dados necessários)
    return new Response(
      JSON.stringify({
        ranking: {
          titulo: rankingData.titulo,
          orgao: rankingData.orgao,
          banca: rankingData.banca,
          exam_type: rankingData.exam_type,
          disciplines: rankingData.disciplines,
          status: rankingData.status,
          exam_date: rankingData.exam_date,
          estados: rankingData.estados,
          cargos: rankingData.cargos,
          minimum_total_score: rankingData.minimum_total_score,
          minimum_total_score_cotas: rankingData.minimum_total_score_cotas,
          booklets: rankingData.exam_booklets
        },
        user_participation: userRankingData ? {
          answers: userRankingData.answers,
          booklet_id: userRankingData.booklet_id,
          score_prova_objetiva: userRankingData.score_prova_objetiva,
          score_prova_discursiva: userRankingData.score_prova_discursiva,
          score_total: userRankingData.score_total,
          subject_scores: userRankingData.subject_scores
        } : null
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[get-ranking-data] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
