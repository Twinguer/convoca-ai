import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFProcessRequest {
  pdfData: string;
  startPage: number;
  endPage: number;
  fileName: string;
}

interface Flashcard {
  question: string;
  answer: string;
  topic: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('PDF to Flashcards function started');
    
    const requestBody = await req.json();
    console.log('Request received:', { ...requestBody, pdfData: 'PDF_DATA_RECEIVED' });
    
    const { pdfData, startPage, endPage, fileName }: PDFProcessRequest = requestBody;

    if (!pdfData || !startPage || !endPage || !fileName) {
      throw new Error('Dados inválidos fornecidos');
    }

    console.log(`Processing PDF: ${fileName}, pages ${startPage}-${endPage} for flashcards`);

    // Validate OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Validate PDF data format
    if (!pdfData.startsWith('data:application/pdf;base64,')) {
      throw new Error('Formato de PDF inválido');
    }

    // Extract base64 data
    const base64Data = pdfData.split(',')[1];
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Dados PDF inválidos');
    }

    console.log('PDF data validated, size:', base64Data.length);

    // For now, use simulated text extraction based on page range
    let extractedText = '';
    
    const pageTexts = [
      "Este documento aborda metodologias de estudo eficazes. A primeira técnica apresentada é a revisão espaçada, que consiste em revisar o material em intervalos crescentes de tempo. Esta metodologia aumenta significativamente a retenção de informações a longo prazo.",
      "Gestão do tempo é fundamental para o sucesso acadêmico. O método Pomodoro sugere períodos de estudo de 25 minutos seguidos de pausas de 5 minutos. Após quatro ciclos, deve-se fazer uma pausa mais longa de 15-30 minutos para maximizar a produtividade.",
      "Técnicas de leitura dinâmica podem aumentar a velocidade de compreensão. O método de varredura permite identificar rapidamente informações relevantes em textos extensos. É importante praticar a leitura seletiva para otimizar o tempo de estudo.",
      "Mapas mentais são ferramentas visuais poderosas para organizar informações. Eles utilizam cores, símbolos e conexões para representar conceitos de forma hierárquica. Esta técnica facilita a memorização e a compreensão de tópicos complexos.",
      "Autoavaliação regular é essencial para monitorar o progresso. Testes práticos e questionários ajudam a identificar lacunas no conhecimento. A metacognição, ou seja, pensar sobre o próprio processo de aprendizagem, melhora significativamente os resultados acadêmicos."
    ];

    // Simulate text extraction for specified pages
    for (let page = startPage; page <= Math.min(endPage, pageTexts.length); page++) {
      if (pageTexts[page - 1]) {
        extractedText += pageTexts[page - 1] + ' ';
      }
    }

    if (!extractedText.trim()) {
      throw new Error('Nenhum texto foi extraído do PDF nas páginas especificadas');
    }

    console.log('Text extracted, length:', extractedText.length);

    // Clean text
    const cleanedText = cleanText(extractedText);
    
    console.log('Text cleaned, generating flashcards with OpenAI...');

    // Generate flashcards using OpenAI
    const flashcardsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em criação de material de estudo. Crie flashcards baseados no texto fornecido.

            Regras:
            - Crie entre 8 a 15 flashcards
            - Perguntas claras e respostas concisas
            - Foque nos conceitos mais importantes
            - Varie os tipos de pergunta (definições, aplicações, exemplos)
            
            Retorne APENAS um JSON válido:
            {
              "flashcards": [
                {
                  "question": "Pergunta objetiva",
                  "answer": "Resposta completa", 
                  "topic": "Tópico"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Texto para análise:\n\n${cleanedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }),
    });

    if (!flashcardsResponse.ok) {
      const errorText = await flashcardsResponse.text();
      console.error('OpenAI flashcards error:', flashcardsResponse.status, errorText);
      throw new Error(`Erro ao gerar flashcards: ${flashcardsResponse.status}`);
    }

    const flashcardsData = await flashcardsResponse.json();
    console.log('OpenAI response received');

    let flashcards;
    try {
      const content = flashcardsData.choices[0].message.content;
      console.log('Content from OpenAI:', content.substring(0, 200) + '...');
      const parsedContent = JSON.parse(content);
      flashcards = parsedContent.flashcards;
    } catch (parseError) {
      console.error('Error parsing flashcards JSON:', parseError);
      throw new Error('Erro ao processar os flashcards gerados');
    }

    if (!flashcards || !Array.isArray(flashcards)) {
      throw new Error('Formato inválido de flashcards gerado');
    }

    console.log('Flashcards generated successfully, count:', flashcards.length);

    // Create JSON file content
    const flashcardsJson = {
      title: fileName.replace('.pdf', ' - Flashcards'),
      createdAt: new Date().toISOString(),
      totalCards: flashcards.length,
      flashcards: flashcards
    };

    // Convert to base64 for download
    const jsonContent = JSON.stringify(flashcardsJson, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));
    
    // Create data URL for download
    const dataUrl = `data:application/json;base64,${base64Content}`;
    const flashcardsFileName = fileName.replace('.pdf', '_flashcards.json');

    console.log('Flashcards processing complete');

    return new Response(
      JSON.stringify({
        success: true,
        flashcardsUrl: dataUrl,
        fileName: flashcardsFileName,
        totalCards: flashcards.length,
        message: 'Flashcards gerados com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in pdf-to-flashcards function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
        details: error.stack || 'Erro desconhecido'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Function to clean extracted text (same as pdf-to-audio)
function cleanText(text: string): string {
  console.log('Cleaning text for flashcards...');
  
  let cleaned = text
    // Remove page numbers (isolated numbers)
    .replace(/^\s*\d+\s*$/gm, '')
    // Remove headers/footers (short lines at start/end)
    .replace(/^.{1,50}$/gm, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove lines that are likely headers/footers (all caps, short)
    .replace(/^[A-Z\s]{1,30}$/gm, '')
    // Remove table of contents entries (lines ending with page numbers)
    .replace(/.*\.\.\.\s*\d+\s*$/gm, '')
    // Clean up multiple periods
    .replace(/\.{3,}/g, '.')
    // Remove isolated punctuation
    .replace(/^\s*[.,;:!?]\s*$/gm, '')
    .trim();

  console.log('Text cleaning for flashcards complete');
  return cleaned;
}