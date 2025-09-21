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
    
    const { pdfData, startPage, endPage, fileName }: PDFProcessRequest = await req.json();

    if (!pdfData || !startPage || !endPage || !fileName) {
      throw new Error('Dados inválidos fornecidos');
    }

    console.log(`Processing PDF: ${fileName}, pages ${startPage}-${endPage} for flashcards`);

    // Convert base64 to binary for processing
    const pdfBuffer = Uint8Array.from(atob(pdfData.split(',')[1]), c => c.charCodeAt(0));
    
    console.log('PDF buffer created, size:', pdfBuffer.length);

    // Simulate text extraction from PDF pages (same as pdf-to-audio)
    let extractedText = '';
    
    const simulatedPageTexts = [
      "Este é um exemplo de texto extraído da primeira página do documento PDF. Conceitos importantes incluem metodologia de estudos, técnicas de memorização e organização temporal.",
      "Aqui temos o conteúdo da segunda página, com informações relevantes sobre gestão do tempo nos estudos. É fundamental estabelecer rotinas consistentes e intervalos regulares.",
      "A terceira página contém mais conteúdo educacional importante sobre técnicas de leitura dinâmica. A velocidade de leitura pode ser aumentada através de exercícios específicos.",
      "Continuamos com o material de estudo na quarta página, abordando métodos de revisão espaçada. Esta técnica é cientificamente comprovada para melhorar a retenção a longo prazo.",
      "Por fim, a quinta página conclui o documento com informações adicionais sobre avaliação do progresso nos estudos. Métricas claras ajudam a manter a motivação."
    ];

    // Extract text for the specified page range
    for (let page = startPage; page <= endPage; page++) {
      if (page <= simulatedPageTexts.length) {
        extractedText += simulatedPageTexts[page - 1] + ' ';
      }
    }

    if (!extractedText.trim()) {
      throw new Error('Nenhum texto foi extraído do PDF nas páginas especificadas');
    }

    console.log('Text extracted, length:', extractedText.length);
    console.log('Sample text:', extractedText.substring(0, 100) + '...');

    // Clean text - remove headers, footers, page numbers, etc.
    const cleanedText = cleanText(extractedText);
    
    console.log('Text cleaned, generating flashcards with OpenAI...');

    // Generate flashcards using OpenAI
    const flashcardsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em criação de material de estudo. Sua tarefa é analisar o texto fornecido e criar flashcards (cartões de estudo) com perguntas e respostas baseadas no conteúdo.

            Regras importantes:
            - Crie entre 10 a 20 flashcards dependendo do conteúdo
            - Cada flashcard deve ter uma pergunta clara e uma resposta concisa
            - Foque nos conceitos mais importantes e informações-chave
            - As perguntas devem ser variadas: definições, conceitos, aplicações, exemplos
            - Evite perguntas muito óbvias ou muito complexas
            - Organize por tópicos quando possível
            
            Retorne APENAS um JSON válido no seguinte formato:
            {
              "flashcards": [
                {
                  "question": "Pergunta clara e objetiva",
                  "answer": "Resposta concisa e completa", 
                  "topic": "Tópico ou categoria"
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Analise o seguinte texto e crie flashcards para estudo:\n\n${cleanedText}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!flashcardsResponse.ok) {
      const errorText = await flashcardsResponse.text();
      console.error('OpenAI flashcards error:', errorText);
      throw new Error(`Erro ao gerar flashcards: ${flashcardsResponse.status} ${errorText}`);
    }

    const flashcardsData = await flashcardsResponse.json();
    let flashcards;

    try {
      // Parse the JSON response from OpenAI
      const content = flashcardsData.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      flashcards = parsedContent.flashcards;
    } catch (parseError) {
      console.error('Error parsing flashcards JSON:', parseError);
      throw new Error('Erro ao processar os flashcards gerados');
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

    console.log('Flashcards processing complete, total cards:', flashcards.length);

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
        details: 'Verifique se o PDF está válido e tente novamente'
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