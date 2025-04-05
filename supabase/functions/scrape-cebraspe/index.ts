
// This edge function scrapes concursos from Cebraspe website
// Follow the Supabase Edge Function format
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.37.0';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
async function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = await handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request
    const method = req.method;
    
    if (method === 'GET') {
      // Scrape concursos from Cebraspe
      const concursos = await scrapeCebraspe();

      // Store concursos in database
      if (concursos.length > 0) {
        const { data, error } = await supabaseClient
          .from('concursos')
          .upsert(concursos, { onConflict: 'link' });

        if (error) {
          console.error("Error storing concursos:", error);
          return new Response(
            JSON.stringify({ error: 'Failed to store concursos' }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
          );
        }
      }

      // Return concursos
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Scraped ${concursos.length} concursos`,
          concursos 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unsupported method
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Function to scrape concursos from Cebraspe
async function scrapeCebraspe() {
  console.log("Starting Cebraspe scraping");
  
  // Simulated concursos data
  // In a real implementation, we would fetch the HTML from Cebraspe and parse it
  const currentYear = new Date().getFullYear();
  const fiveYearsAgo = currentYear - 5;
  
  const mockConcursos = [
    {
      titulo: "Concurso Banco do Brasil",
      orgao: "Banco do Brasil",
      banca: "Cebraspe",
      vagas: 4000,
      inscritos: 1500000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/bb_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-15`
    },
    {
      titulo: "Concurso Polícia Federal - Agente",
      orgao: "Polícia Federal",
      banca: "Cebraspe",
      vagas: 1500,
      inscritos: 500000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/pf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-20`
    },
    {
      titulo: "Concurso INSS",
      orgao: "INSS",
      banca: "Cebraspe",
      vagas: 1000,
      inscritos: 1000000,
      etapa_atual: "Resultado Final",
      link: "https://www.cebraspe.org.br/concursos/inss_22",
      status: "Finalizado",
      data_publicacao: `${currentYear-1}-11-10`
    },
    {
      titulo: "Tribunal Regional Federal da 1ª Região",
      orgao: "TRF 1",
      banca: "Cebraspe",
      vagas: 250,
      inscritos: 120000,
      etapa_atual: "Prova de Títulos",
      link: "https://www.cebraspe.org.br/concursos/trf1_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-28`
    },
    {
      titulo: "Concurso Ministério Público Federal",
      orgao: "MPF",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 80000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/mpf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-04-05`
    },
    {
      titulo: "Banco Central do Brasil",
      orgao: "BACEN",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 150000,
      etapa_atual: "Prova Discursiva",
      link: "https://www.cebraspe.org.br/concursos/bacen_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-15`
    },
    {
      titulo: "Agência Nacional de Transportes Terrestres",
      orgao: "ANTT",
      banca: "Cebraspe",
      vagas: 150,
      inscritos: 95000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/antt_22",
      status: "Em andamento",
      data_publicacao: `${currentYear-1}-12-10`
    },
    {
      titulo: "Defensoria Pública da União",
      orgao: "DPU",
      banca: "Cebraspe",
      vagas: 50,
      inscritos: 30000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/dpu_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-25`
    }
  ];

  // For demo purposes, return mock data
  console.log(`Scraped ${mockConcursos.length} mock concursos`);
  return mockConcursos;
}
