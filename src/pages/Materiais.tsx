import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Volume2, Download, BookOpen, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  audioUrl?: string;
  fileName?: string;
}

interface FlashcardsState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  flashcardsUrl?: string;
  fileName?: string;
}

const Materiais = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState({ start: '', end: '' });
  const [voice, setVoice] = useState<'alloy' | 'echo'>('alloy'); // alloy = feminina, echo = masculina
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0
  });
  const [flashcardsProcessing, setFlashcardsProcessing] = useState<FlashcardsState>({
    status: 'idle',
    progress: 0
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      toast({
        title: "Arquivo selecionado",
        description: `${file.name} está pronto para processamento`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF válido",
        variant: "destructive",
      });
    }
  };

  const processDocument = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    if (!pageRange.start || !pageRange.end) {
      toast({
        title: "Erro", 
        description: "Por favor, informe o intervalo de páginas",
        variant: "destructive",
      });
      return;
    }

    const startPage = parseInt(pageRange.start);
    const endPage = parseInt(pageRange.end);
    
    if (endPage - startPage + 1 > 30) {
      toast({
        title: "Erro",
        description: "O limite máximo é de 30 páginas por vez",
        variant: "destructive",
      });
      return;
    }

    setProcessing({ status: 'uploading', progress: 10 });

    try {
      // Convert file to base64 for processing
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        setProcessing({ status: 'processing', progress: 30 });

        // Call edge function to process PDF and generate audio
        const { data, error } = await supabase.functions.invoke('pdf-to-audio', {
          body: {
            pdfData: base64,
            startPage: parseInt(pageRange.start),
            endPage: parseInt(pageRange.end),
            voice: voice,
            fileName: selectedFile.name
          }
        });

        if (error) {
          throw error;
        }

        setProcessing({
          status: 'completed',
          progress: 100,
          audioUrl: data.audioUrl,
          fileName: data.fileName
        });

        toast({
          title: "Sucesso!",
          description: "Áudio gerado com sucesso. Faça o download antes de sair da página.",
        });
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error processing document:', error);
      setProcessing({ status: 'error', progress: 0 });
      toast({
        title: "Erro",
        description: "Erro ao processar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const downloadAudio = () => {
    if (processing.audioUrl && processing.fileName) {
      const link = document.createElement('a');
      link.href = processing.audioUrl;
      link.download = processing.fileName.replace('.pdf', '.mp3');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const processFlashcards = async () => {
    if (!selectedFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo PDF",
        variant: "destructive",
      });
      return;
    }

    if (!pageRange.start || !pageRange.end) {
      toast({
        title: "Erro", 
        description: "Por favor, informe o intervalo de páginas",
        variant: "destructive",
      });
      return;
    }

    const startPage = parseInt(pageRange.start);
    const endPage = parseInt(pageRange.end);
    
    if (endPage - startPage + 1 > 30) {
      toast({
        title: "Erro",
        description: "O limite máximo é de 30 páginas por vez",
        variant: "destructive",
      });
      return;
    }

    setFlashcardsProcessing({ status: 'uploading', progress: 10 });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        setFlashcardsProcessing({ status: 'processing', progress: 30 });

        const { data, error } = await supabase.functions.invoke('pdf-to-flashcards', {
          body: {
            pdfData: base64,
            startPage: parseInt(pageRange.start),
            endPage: parseInt(pageRange.end),
            fileName: selectedFile.name
          }
        });

        if (error) {
          throw error;
        }

        setFlashcardsProcessing({
          status: 'completed',
          progress: 100,
          flashcardsUrl: data.flashcardsUrl,
          fileName: data.fileName
        });

        toast({
          title: "Sucesso!",
          description: "Flashcards gerados com sucesso. Faça o download antes de sair da página.",
        });
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('Error processing flashcards:', error);
      setFlashcardsProcessing({ status: 'error', progress: 0 });
      toast({
        title: "Erro",
        description: "Erro ao processar os flashcards. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const downloadFlashcards = () => {
    if (flashcardsProcessing.flashcardsUrl && flashcardsProcessing.fileName) {
      const link = document.createElement('a');
      link.href = flashcardsProcessing.flashcardsUrl;
      link.download = flashcardsProcessing.fileName.replace('.pdf', '_flashcards.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetProcess = () => {
    setSelectedFile(null);
    setPageRange({ start: '', end: '' });
    setProcessing({ status: 'idle', progress: 0 });
    setFlashcardsProcessing({ status: 'idle', progress: 0 });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Materiais de Estudo</h1>
        <p className="text-muted-foreground">
          Converta seus PDFs em áudio ou gere flashcards para facilitar seus estudos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Conversor PDF para Áudio
          </CardTitle>
          <CardDescription>
            Faça upload de um PDF e gere um áudio com narração profissional das páginas selecionadas (máximo 30 páginas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {processing.status === 'idle' && (
            <>
              {/* Upload de arquivo */}
              <div className="space-y-2">
                <Label htmlFor="pdf-upload">Selecionar arquivo PDF</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Clique para selecionar um arquivo PDF'}
                    </span>
                  </Label>
                </div>
              </div>

              {/* Configurações */}
              {selectedFile && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-page">Página inicial</Label>
                      <Input
                        id="start-page"
                        type="number"
                        placeholder="1"
                        value={pageRange.start}
                        onChange={(e) => setPageRange(prev => ({ ...prev, start: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-page">Página final</Label>
                      <Input
                        id="end-page"
                        type="number"
                        placeholder="10"
                        value={pageRange.end}
                        onChange={(e) => setPageRange(prev => ({ ...prev, end: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="voice-select">Tipo de voz</Label>
                    <Select value={voice} onValueChange={(value: 'alloy' | 'echo') => setVoice(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de voz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Feminina</SelectItem>
                        <SelectItem value="echo">Masculina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={processDocument} className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Áudio
                  </Button>
                </>
              )}
            </>
          )}

          {/* Status de processamento */}
          {(processing.status === 'uploading' || processing.status === 'processing') && (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <p className="font-medium">
                  {processing.status === 'uploading' ? 'Fazendo upload do arquivo...' : 'Processando documento e gerando áudio...'}
                </p>
                <Progress value={processing.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Este processo pode levar alguns minutos dependendo do tamanho do documento
                </p>
              </div>
            </div>
          )}

          {/* Download do áudio */}
          {processing.status === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  Áudio gerado com sucesso!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-300 mb-4">
                  Seu áudio está pronto para download. Lembre-se: o arquivo será perdido se você sair desta página sem fazer o download.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={downloadAudio} className="bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Áudio
                  </Button>
                  <Button variant="outline" onClick={resetProcess}>
                    Processar Novo Arquivo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Erro */}
          {processing.status === 'error' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Erro no processamento
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                  Ocorreu um erro ao processar seu arquivo. Verifique se o PDF está válido e tente novamente.
                </p>
                <Button variant="outline" onClick={resetProcess}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card para Flashcards */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Gerador de Flashcards
          </CardTitle>
          <CardDescription>
            Gere flashcards automaticamente a partir do conteúdo do PDF (máximo 30 páginas)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {flashcardsProcessing.status === 'idle' && (
            <>
              {!selectedFile ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Primeiro selecione um arquivo PDF no card acima
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Arquivo selecionado: {selectedFile.name}</span>
                  </div>
                  
                  {pageRange.start && pageRange.end && (
                    <Button onClick={processFlashcards} className="w-full" variant="outline">
                      <Brain className="mr-2 h-4 w-4" />
                      Gerar Flashcards
                    </Button>
                  )}
                </>
              )}
            </>
          )}

          {/* Status de processamento flashcards */}
          {(flashcardsProcessing.status === 'uploading' || flashcardsProcessing.status === 'processing') && (
            <div className="space-y-4 text-center">
              <div className="space-y-2">
                <p className="font-medium">
                  {flashcardsProcessing.status === 'uploading' ? 'Fazendo upload do arquivo...' : 'Analisando conteúdo e gerando flashcards...'}
                </p>
                <Progress value={flashcardsProcessing.progress} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Este processo pode levar alguns minutos dependendo do conteúdo do documento
                </p>
              </div>
            </div>
          )}

          {/* Download dos flashcards */}
          {flashcardsProcessing.status === 'completed' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Flashcards gerados com sucesso!
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300 mb-4">
                  Seus flashcards estão prontos para download. O arquivo contém perguntas e respostas baseadas no conteúdo do PDF.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={downloadFlashcards} className="bg-blue-600 hover:bg-blue-700">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Flashcards
                  </Button>
                  <Button variant="outline" onClick={resetProcess}>
                    Processar Novo Arquivo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Erro flashcards */}
          {flashcardsProcessing.status === 'error' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  Erro no processamento
                </h3>
                <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                  Ocorreu um erro ao processar os flashcards. Verifique se o PDF está válido e tente novamente.
                </p>
                <Button variant="outline" onClick={resetProcess}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações importantes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• O sistema ignora automaticamente capas, índices e notas de rodapé</p>
          <p>• Limite máximo de 30 páginas por processamento</p>
          <p>• Os arquivos gerados não são armazenados no servidor - faça o download imediatamente</p>
          <p>• Aceita apenas arquivos PDF válidos</p>
          <p>• Flashcards são gerados em formato JSON com perguntas e respostas</p>
          <p>• O processamento pode levar alguns minutos para documentos grandes</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Materiais;