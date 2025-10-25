import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'view' | 'edit' | 'participate' | 'list' | 'create';
  concurso_id?: string;
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
    const { action, concurso_id } = body;

    // Validar input
    if (!action || !['view', 'edit', 'participate', 'list', 'create'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ações que precisam de concurso_id
    if (['view', 'edit', 'participate'].includes(action) && !concurso_id) {
      return new Response(
        JSON.stringify({ error: 'concurso_id required for this action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapear action para context_type
    const contextMap: Record<string, string> = {
      'view': 'view_ranking',
      'edit': 'edit_ranking',
      'participate': 'participate_ranking',
      'list': 'list_rankings',
      'create': 'create_ranking'
    };

    // Obter IP e User-Agent
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Criar sessão via backend function
    const { data, error } = await supabase.rpc('create_secure_session', {
      p_context_type: contextMap[action],
      p_resource_id: concurso_id || null,
      p_expiry_minutes: 120, // 2 horas
      p_ip_address: ip,
      p_user_agent: userAgent
    });

    if (error || !data?.success) {
      console.error('[create-ranking-session] Error:', error || data?.error);
      return new Response(
        JSON.stringify({ error: data?.error || 'Failed to create session' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar APENAS o token (nunca o concurso_id)
    return new Response(
      JSON.stringify({
        session_token: data.session_token,
        expires_at: data.expires_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-ranking-session] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
