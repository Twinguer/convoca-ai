
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const body = await req.json()
    const { ranking_id } = body

    if (!ranking_id) {
      return new Response(
        JSON.stringify({ error: 'ranking_id is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get the current edit count
    const { data: rankingData, error: fetchError } = await supabaseClient
      .from('user_rankings')
      .select('edit_count')
      .eq('id', ranking_id)
      .single()

    if (fetchError) {
      throw fetchError
    }

    // Increment the edit count
    const currentCount = rankingData?.edit_count || 0
    const newCount = currentCount + 1

    // Update the edit count
    const { error: updateError } = await supabaseClient
      .from('user_rankings')
      .update({ edit_count: newCount })
      .eq('id', ranking_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        old_count: currentCount, 
        new_count: newCount 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error incrementing edit counter:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
