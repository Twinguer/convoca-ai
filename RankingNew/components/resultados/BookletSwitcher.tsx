
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { consolidatedAnswerService } from '@/services/consolidatedAnswerService';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  // Sincronizar selectedBookletId com currentBookletId quando mudar
  React.useEffect(() => {
    setSelectedBookletId(currentBookletId);
  }, [currentBookletId]);

  console.log('[BookletSwitcher] Estado inicial do selectedBookletId:', selectedBookletId);

  const handleSwitchBooklet = async (newBookletId: string) => {
    if (!newBookletId) {
      toast.warning('Selecione um caderno válido');
      return;
    }
    
    if (newBookletId === currentBookletId) {
      toast.warning('Selecione um caderno diferente do atual');
      return;
    }

    console.log('[BookletSwitcher] DEBUG - Iniciando troca de caderno');
    console.log('[BookletSwitcher] DEBUG - Caderno atual:', currentBookletId);
    console.log('[BookletSwitcher] DEBUG - Novo caderno selecionado:', newBookletId);
    console.log('[BookletSwitcher] DEBUG - RankingId:', rankingId);

    setIsSwitching(true);
    try {
      console.log('[BookletSwitcher] Switching to booklet:', newBookletId);
      console.log('[BookletSwitcher] Current booklet ID:', currentBookletId);
      console.log('[BookletSwitcher] Ranking ID:', rankingId);
      
      // Usar o serviço consolidado para trocar caderno
      const result = await consolidatedAnswerService.switchBooklet(rankingId, newBookletId);
      
      console.log('[BookletSwitcher] DEBUG - Resultado do switchBooklet:', result);

      if (result.success) {
        // Converter as respostas do formato JSON para o formato esperado
        const answers: Record<number, string> = {};
        if (result.answers && typeof result.answers === 'object') {
          console.log('[BookletSwitcher] DEBUG - Respostas brutas recebidas:', result.answers);
          
          Object.entries(result.answers).forEach(([questionNum, answer]) => {
            const num = parseInt(questionNum);
            if (!isNaN(num) && answer) {
              answers[num] = answer as string;
            }
          });
        }

        console.log('[BookletSwitcher] DEBUG - Respostas processadas:', answers);

        // Notify parent component about the change with isolated answers
        onBookletChanged(newBookletId, answers);
        
        toast.success(`Caderno alterado para ${getBookletName(newBookletId)} com sucesso`);
        await queryClient.invalidateQueries({ queryKey: ['user-ranking', rankingId] });
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
    const name = booklet?.name || 'Desconhecido';
    return name.length > 30 ? name.substring(0, 30) + '...' : name;
  };

  // Após a troca de caderno, logar o novo estado
  console.log('[BookletSwitcher] Novo estado do selectedBookletId após troca:', selectedBookletId);

  // Se há apenas um caderno, não mostra o switcher
  if (booklets.length <= 1) {
    return null;
  }

  const currentBooklet = booklets.find(b => b.id === currentBookletId);
  const selectedBooklet = booklets.find(b => b.id === selectedBookletId);

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-primary">Trocar Caderno de Prova</h3>
      </div>
      
      <Alert className="border-primary/20 bg-primary/10">
        <AlertTriangle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          <strong>Caderno atual:</strong> <span className="break-words">{currentBooklet?.name || 'Não informado'}</span>
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="booklet-switcher" className="text-sm font-medium">
          Selecionar novo caderno:
        </Label>
        <Select 
          value={selectedBookletId} 
          onValueChange={(value) => {
            setSelectedBookletId(value);
            handleSwitchBooklet(value);
          }}
          disabled={disabled || isSwitching}
        >
          <SelectTrigger id="booklet-switcher">
            <SelectValue placeholder="Escolha um caderno" />
          </SelectTrigger>
          <SelectContent>
            {booklets.map(booklet => (
              <SelectItem key={booklet.id} value={booklet.id}>
                {booklet.name.length > 30 ? booklet.name.substring(0, 30) + '...' : booklet.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedBookletId && selectedBookletId !== currentBookletId && (
        <Alert className="border-warning/20 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-foreground">
            <strong>Atenção:</strong> Ao trocar para <strong>{selectedBooklet?.name}</strong>, 
            suas respostas atuais serão salvas e as respostas do novo caderno serão carregadas.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
