
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnswerKeyForm } from '../AnswerKeyForm';
import { BookletAnswerKeySelector } from './BookletAnswerKeySelector';
import { useBookletAnswerKey } from '@/hooks/useBookletAnswerKey';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnswerKeyTabProps {
  concursoId: string;
  onGoToResults?: () => void;
}

export const AnswerKeyTab: React.FC<AnswerKeyTabProps> = ({
  concursoId,
  onGoToResults
}) => {
  const {
    booklets,
    selectedBookletId,
    setSelectedBookletId,
    answers,
    setAnswers,
    nullifiedQuestions,
    setNullifiedQuestions,
    updateAnswer,
    isLoading,
    isSaving,
    completionStatus
  } = useBookletAnswerKey(concursoId);

  const [showAnswerForm, setShowAnswerForm] = useState(false);

  // Mostrar o formulário apenas quando há um caderno selecionado
  useEffect(() => {
    if (selectedBookletId && booklets.length > 0) {
      setShowAnswerForm(true);
    } else {
      setShowAnswerForm(false);
    }
  }, [selectedBookletId, booklets]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <p>Carregando informações dos cadernos...</p>
        </div>
      </div>
    );
  }

  // Se não há cadernos configurados, mostrar aviso
  if (!booklets || booklets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gabarito Oficial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Configuração Necessária:</strong> Para preencher o gabarito oficial, você deve primeiro 
              configurar os cadernos de prova na aba "Informações Gerais".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seletor de cadernos sempre visível quando há cadernos */}
      <BookletAnswerKeySelector
        booklets={booklets}
        selectedBookletId={selectedBookletId}
        onBookletChange={setSelectedBookletId}
        completionStatus={completionStatus}
        disabled={isSaving}
      />

      {/* Formulário de gabarito apenas quando um caderno está selecionado */}
      {showAnswerForm && selectedBookletId ? (
        <AnswerKeyForm 
          concursoId={concursoId}
          selectedBookletId={selectedBookletId}
          answers={answers}
          setAnswers={setAnswers}
          nullifiedQuestions={nullifiedQuestions}
          setNullifiedQuestions={setNullifiedQuestions}
          updateAnswer={updateAnswer}
          isSaving={isSaving}
        />
      ) : (
        selectedBookletId && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Carregando gabarito do caderno selecionado...</p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Botão para ir aos resultados - só aparece quando todos os gabaritos estão completos */}
      {completionStatus?.allComplete && onGoToResults && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={onGoToResults}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Ver Resultados do Ranking
          </Button>
        </div>
      )}
    </div>
  );
};
