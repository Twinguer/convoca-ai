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
    
    const { pdfData, startPage, endPage, voice, fileName }: PDFProcessRequest = await req.json();

    if (!pdfData || !startPage || !endPage || !voice || !fileName) {
      throw new Error('Dados inválidos fornecidos');
    }

    console.log(`Processing PDF: ${fileName}, pages ${startPage}-${endPage}, voice: ${voice}`);

    // Convert base64 to binary for processing
    const pdfBuffer = Uint8Array.from(atob(pdfData.split(',')[1]), c => c.charCodeAt(0));
    
    console.log('PDF buffer created, size:', pdfBuffer.length);

    // Create FormData for document parsing
    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', pdfBlob, fileName);

    console.log('Parsing PDF document...');

    // Parse PDF using a document parsing API (simulated - in real implementation would use actual API)
    // For now, we'll simulate text extraction
    let extractedText = '';
    
    // Simulate text extraction from PDF pages
    // In a real implementation, you would use a proper PDF parsing library
    const simulatedPageTexts = [
      "Este é um exemplo de texto extraído da primeira página do documento PDF.",
      "Aqui temos o conteúdo da segunda página, com informações relevantes para o estudo.",
      "A terceira página contém mais conteúdo educacional importante.",
      "Continuamos com o material de estudo na quarta página.",
      "Por fim, a quinta página conclui o documento com informações adicionais."
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
    
    console.log('Text cleaned, generating audio...');

    // Generate audio using OpenAI TTS
    const audioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // High quality model for better voice
        input: cleanedText,
        voice: voice, // 'alloy' (female) or 'echo' (male)
        response_format: 'mp3',
        speed: 1.0
      }),
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('OpenAI TTS error:', errorText);
      throw new Error(`Erro ao gerar áudio: ${audioResponse.status} ${errorText}`);
    }

    console.log('Audio generated successfully');

    // Convert audio to base64 for download
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioArrayBuffer))
    );

    // Create data URL for download
    const audioDataUrl = `data:audio/mpeg;base64,${audioBase64}`;
    const audioFileName = fileName.replace('.pdf', '_audio.mp3');

    console.log('Audio processing complete, size:', audioArrayBuffer.byteLength);

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
        details: 'Verifique se o PDF está válido e tente novamente'
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