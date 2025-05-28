
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface CompletionDetail {
  bookletId: string;
  bookletName: string;
  completed: number;
  total: number;
  isComplete: boolean;
}

interface CompletionStatus {
  allComplete: boolean;
  details: CompletionDetail[];
}

interface BookletAnswerKeySelectorProps {
  booklets: ExamBooklet[];
  selectedBookletId: string;
  onBookletChange: (bookletId: string) => void;
  completionStatus?: CompletionStatus;
  disabled?: boolean;
}

export const BookletAnswerKeySelector: React.FC<BookletAnswerKeySelectorProps> = ({
  booklets,
  selectedBookletId,
  onBookletChange,
  completionStatus,
  disabled = false
}) => {
  if (!booklets || booklets.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum caderno de prova configurado</p>
            <p className="text-xs">Configure cadernos na seção "Informações Gerais"</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se há apenas um caderno, seleciona automaticamente
  React.useEffect(() => {
    if (booklets.length === 1 && !selectedBookletId) {
      onBookletChange(booklets[0].id);
    }
  }, [booklets, selectedBookletId, onBookletChange]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Escolher Caderno do Gabarito</h3>
          </div>
          {completionStatus && (
            <Badge variant={completionStatus.allComplete ? "default" : "secondary"}>
              {completionStatus.allComplete ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Todos Completos
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Pendente
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="booklet-selector" className="text-sm font-medium">
            Caderno para Preencher Gabarito *
          </Label>
          <Select 
            value={selectedBookletId} 
            onValueChange={onBookletChange}
            disabled={disabled}
          >
            <SelectTrigger id="booklet-selector">
              <SelectValue placeholder="Selecione o caderno para preencher o gabarito" />
            </SelectTrigger>
            <SelectContent>
              {booklets.map((booklet) => {
                const completion = completionStatus?.details.find(d => d.bookletId === booklet.id);
                return (
                  <SelectItem key={booklet.id} value={booklet.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="font-medium">{booklet.name}</span>
                      </div>
                      {completion && (
                        <Badge 
                          variant={completion.isComplete ? "default" : "secondary"}
                          className="ml-2"
                        >
                          {completion.completed}/{completion.total}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Você deve preencher o gabarito oficial para cada caderno configurado no concurso.
          </p>
        </div>

        {/* Status de completude por caderno */}
        {completionStatus && completionStatus.details.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status dos Gabaritos</Label>
            <div className="grid gap-2">
              {completionStatus.details.map((detail) => (
                <div 
                  key={detail.bookletId}
                  className={`flex items-center justify-between p-2 rounded border ${
                    detail.isComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {detail.isComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">{detail.bookletName}</span>
                  </div>
                  <Badge variant={detail.isComplete ? "default" : "secondary"}>
                    {detail.completed}/{detail.total} questões
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aviso sobre obrigatoriedade */}
        {completionStatus && !completionStatus.allComplete && (
          <div className="p-3 rounded bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Atenção!</p>
                <p className="text-amber-700">
                  Todos os cadernos devem ter gabarito completo antes de ativar o ranking.
                  Os participantes só poderão ser avaliados corretamente quando todos os gabaritos estiverem preenchidos.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
