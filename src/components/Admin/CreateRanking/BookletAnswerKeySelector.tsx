
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
                  <Clock className="h-3 w-3 mr-1" />
                  {completionStatus.details.filter(d => d.isComplete).length}/{completionStatus.details.length} Completos
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
                        {completion?.isComplete && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
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
            <strong> É obrigatório preencher TODOS os cadernos antes de salvar.</strong>
          </p>
        </div>

        {/* Status de completude por caderno */}
        {completionStatus && completionStatus.details.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status dos Gabaritos por Caderno</Label>
            <div className="grid gap-2">
              {completionStatus.details.map((detail) => (
                <div 
                  key={detail.bookletId}
                  className={`flex items-center justify-between p-3 rounded border transition-colors ${
                    detail.bookletId === selectedBookletId ? 'bg-blue-50 border-blue-200' : ''
                  } ${
                    detail.isComplete ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {detail.isComplete ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {detail.bookletName}
                      {detail.bookletId === selectedBookletId && <span className="text-blue-600 ml-1">(Selecionado)</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={detail.isComplete ? "default" : "secondary"}>
                      {detail.completed}/{detail.total} questões
                    </Badge>
                    {detail.isComplete && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aviso sobre obrigatoriedade */}
        {completionStatus && !completionStatus.allComplete && (
          <div className="p-4 rounded bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">⚠️ Atenção: Gabarito Incompleto!</p>
                <p className="text-amber-700 mt-1">
                  Você deve preencher o gabarito completo de <strong>todos os cadernos</strong> antes de poder salvar.
                  Cada caderno deve ter todas as {completionStatus.details[0]?.total || 0} questões respondidas.
                </p>
                <p className="text-amber-700 mt-1">
                  <strong>Progresso atual:</strong> {completionStatus.details.filter(d => d.isComplete).length} de {completionStatus.details.length} cadernos completos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mensagem de sucesso quando todos estão completos */}
        {completionStatus && completionStatus.allComplete && (
          <div className="p-4 rounded bg-green-50 border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">✅ Todos os Gabaritos Completos!</p>
                <p className="text-green-700 mt-1">
                  Parabéns! Você preencheu o gabarito oficial de todos os {completionStatus.details.length} cadernos.
                  Agora você pode salvar o ranking e ativá-lo para os participantes.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
