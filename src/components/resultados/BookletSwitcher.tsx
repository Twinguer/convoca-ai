
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { consolidatedAnswerService } from '@/services/consolidatedAnswerService';
import { toast } from 'sonner';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface BookletSwitcherProps {
  booklets: ExamBooklet[];
  currentBookletId: string;
  rankingId: string;
  onBookletChanged: (bookletId: string, answers: Record<number, string>) => void;
  disabled?: boolean;
}

export const BookletSwitcher: React.FC<BookletSwitcherProps> = ({
  booklets,
  currentBookletId,
  rankingId,
  onBookletChanged,
  disabled = false
}) => {
  const [selectedBookletId, setSelectedBookletId] = useState(currentBookletId);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchBooklet = async () => {
    if (!selectedBookletId || selectedBookletId === currentBookletId) {
      toast.warning('Selecione um caderno diferente do atual');
      return;
    }

    console.log('[BookletSwitcher] DEBUG - Iniciando troca de caderno');
    console.log('[BookletSwitcher] DEBUG - Caderno atual:', currentBookletId);
    console.log('[BookletSwitcher] DEBUG - Novo caderno selecionado:', selectedBookletId);

    setIsSwitching(true);
    try {
      console.log('[BookletSwitcher] Switching to booklet:', selectedBookletId);
      
      // Usar o serviço consolidado para trocar caderno
      const result = await consolidatedAnswerService.switchBooklet(rankingId, selectedBookletId);

      if (result.success) {
        // Converter as respostas do formato JSON para o formato esperado
        const answers: Record<number, string> = {};
        if (result.answers && typeof result.answers === 'object') {
          Object.entries(result.answers).forEach(([questionNum, answer]) => {
            const num = parseInt(questionNum);
            if (!isNaN(num) && answer) {
              answers[num] = answer as string;
            }
          });
        }

        console.log('[BookletSwitcher] Isolated answers for new booklet:', answers);

        // Notify parent component about the change with isolated answers
        onBookletChanged(selectedBookletId, answers);
        
        toast.success(`Caderno alterado para ${getBookletName(selectedBookletId)} com sucesso`);
      } else {
        console.error('[BookletSwitcher] Error switching booklet:', result.error);
        toast.error(result.error || 'Falha ao trocar caderno');
      }
    } catch (error: any) {
      console.error('[BookletSwitcher] Error:', error);
      toast.error('Erro inesperado ao trocar caderno');
    } finally {
      setIsSwitching(false);
    }
  };

  const getBookletName = (bookletId: string) => {
    const booklet = booklets.find(b => b.id === bookletId);
    return booklet?.name || 'Desconhecido';
  };

  // Se há apenas um caderno, não mostra o switcher
  if (booklets.length <= 1) {
    return null;
  }

  const currentBooklet = booklets.find(b => b.id === currentBookletId);
  const selectedBooklet = booklets.find(b => b.id === selectedBookletId);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-blue-800">Trocar Caderno de Prova</h3>
      </div>
      
      <Alert className="border-blue-200 bg-blue-50">
        <AlertTriangle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Caderno atual:</strong> {currentBooklet?.name || 'Não informado'}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="booklet-switcher" className="text-sm font-medium">
          Selecionar novo caderno:
        </Label>
        <Select 
          value={selectedBookletId} 
          onValueChange={setSelectedBookletId}
          disabled={disabled || isSwitching}
        >
          <SelectTrigger id="booklet-switcher">
            <SelectValue placeholder="Escolha um caderno" />
          </SelectTrigger>
          <SelectContent>
            {booklets.map((booklet) => (
              <SelectItem 
                key={booklet.id} 
                value={booklet.id}
                disabled={booklet.id === currentBookletId}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{booklet.name}</span>
                  {booklet.id === currentBookletId && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBookletId && selectedBookletId !== currentBookletId && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Atenção:</strong> Ao trocar para <strong>{selectedBooklet?.name}</strong>, 
            suas respostas atuais serão salvas e as respostas do novo caderno serão carregadas.
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSwitchBooklet}
        disabled={disabled || isSwitching || !selectedBookletId || selectedBookletId === currentBookletId}
        className="w-full"
        variant="outline"
      >
        {isSwitching ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Trocando caderno...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Trocar para {selectedBooklet?.name}
          </>
        )}
      </Button>
    </div>
  );
};
