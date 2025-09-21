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
  voice: 'alloy' | 'echo';
  fileName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('PDF to Audio function started');
    
    const requestBody = await req.json();
    console.log('Request received:', { ...requestBody, pdfData: 'PDF_DATA_RECEIVED' });
    
    const { pdfData, startPage, endPage, voice, fileName }: PDFProcessRequest = requestBody;

    if (!pdfData || !startPage || !endPage || !voice || !fileName) {
      throw new Error('Dados inválidos fornecidos');
    }

    console.log(`Processing PDF: ${fileName}, pages ${startPage}-${endPage}, voice: ${voice}`);

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
    // This would be replaced with actual PDF parsing in a real implementation
    let extractedText = '';
    
    const pageTexts = [
      "Este é o conteúdo da primeira página do documento. Contém informações importantes sobre metodologias de estudo e técnicas de aprendizagem que são fundamentais para o desenvolvimento acadêmico.",
      "A segunda página apresenta conceitos avançados sobre gestão do tempo e organização de estudos. É essencial compreender como estruturar sessões de estudo eficazes.",
      "Na terceira página encontramos estratégias de memorização e revisão espaçada. Estas técnicas são comprovadamente eficazes para retenção de informações a longo prazo.",
      "A quarta página aborda métodos de avaliação e autoavaliação. Monitorar o progresso é crucial para identificar áreas que necessitam de maior atenção.",
      "A quinta página conclui com técnicas avançadas de concentração e foco. Manter a atenção durante períodos prolongados de estudo é uma habilidade que pode ser desenvolvida."
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

    // Clean and prepare text for TTS
    const cleanedText = cleanText(extractedText);
    
    if (cleanedText.length > 4000) {
      throw new Error('Texto muito longo para conversão. Limite máximo: 4000 caracteres');
    }

    console.log('Text cleaned, generating audio...');

    // Generate audio using OpenAI TTS
    const audioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: cleanedText,
        voice: voice,
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('OpenAI TTS error:', audioResponse.status, errorText);
      throw new Error(`Erro ao gerar áudio: ${audioResponse.status}`);
    }

    console.log('Audio generated successfully');

    // Convert audio to base64 for download
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    console.log('Audio buffer size:', audioArrayBuffer.byteLength);
    
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    );

    // Create data URL for download
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
    const audioFileName = fileName.replace('.pdf', '_audio.mp3');

    console.log('Audio processing complete');

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: audioDataUrl,
        fileName: audioFileName,
        textLength: cleanedText.length,
        message: 'Áudio gerado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in pdf-to-audio function:', error);
    
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

// Function to clean extracted text
function cleanText(text: string): string {
  console.log('Cleaning text...');
  
  // Remove common PDF artifacts and unwanted content
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

  console.log('Text cleaning complete');
  return cleaned;
}

// Helper function to validate PDF data
function isValidPDFData(data: string): boolean {
  try {
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    const binaryString = atob(base64Data);
    // Check for PDF header
    return binaryString.startsWith('%PDF-');
  } catch {
    return false;
  }
}