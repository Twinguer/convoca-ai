import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  session_token: string;
  answers: Record<number, string>;
  booklet_id: string;
  subjective_scores?: Record<string, number>;
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
    const { session_token, answers, booklet_id, subjective_scores = {} } = body;

    if (!session_token || !answers || !booklet_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar sessão
    const { data: sessionValidation } = await supabase.rpc(
      'validate_session',
      {
        p_session_token: session_token,
        p_required_context: 'participate_ranking'
      }
    );

    if (!sessionValidation?.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid session for participation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar inputs (backend)
    const { data: inputValidation } = await supabase.rpc('validate_input_security', {
      p_input: JSON.stringify(answers),
      p_input_type: 'json'
    });

    if (!inputValidation?.is_valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid input data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar respostas via função segura
    const { data: saveResult, error: saveError } = await supabase.rpc(
      'save_user_answers_secure',
      {
        p_session_token: session_token,
        p_booklet_id: booklet_id,
        p_answers: answers,
        p_subjective_scores: subjective_scores
      }
    );

    if (saveError || !saveResult?.success) {
      console.error('[submit-answers] Save error:', saveError || saveResult?.error);
      return new Response(
        JSON.stringify({ error: saveResult?.error || 'Failed to save answers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Answers saved successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[submit-answers] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
