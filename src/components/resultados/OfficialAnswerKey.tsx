import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Concurso } from '@/types/concursos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfficialAnswerKeyProps {
  concurso: Concurso;
  userBookletId?: string;
}

interface OfficialAnswer {
  correct_answer: string;
  is_nullified: boolean;
  discipline_type?: string;
}

interface BookletAnswers {
  [questionNumber: string]: OfficialAnswer;
}

interface OfficialAnswersData {
  [bookletId: string]: {
    questions: BookletAnswers;
  };
}

export const OfficialAnswerKey: React.FC<OfficialAnswerKeyProps> = ({
  concurso,
  userBookletId
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [officialAnswers, setOfficialAnswers] = useState<OfficialAnswersData>({});
  const [selectedBookletId, setSelectedBookletId] = useState<string>('');
  const [availableBooklets, setAvailableBooklets] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Carregar gabarito oficial
  useEffect(() => {
    const loadOfficialAnswers = async () => {
      if (!concurso?.id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('concursos')
          .select('official_answers, exam_booklets')
          .eq('id', concurso.id)
          .single();

        if (error) throw error;

        if (data?.official_answers) {
          setOfficialAnswers(data.official_answers);
          
          // Configurar cadernos disponíveis
          const booklets = data.exam_booklets || [];
          setAvailableBooklets(booklets);
          
          // Usar o caderno do usuário se disponível, senão o primeiro
          const bookletToUse = userBookletId || (booklets.length > 0 ? booklets[0].id : '');
          setSelectedBookletId(bookletToUse);
        }
      } catch (error) {
        console.error('Erro ao carregar gabarito oficial:', error);
        toast.error('Erro ao carregar gabarito oficial');
      } finally {
        setLoading(false);
      }
    };

    loadOfficialAnswers();
  }, [concurso?.id, userBookletId]);

  const currentBookletAnswers = selectedBookletId ? officialAnswers[selectedBookletId]?.questions : {};
  const currentBookletName = availableBooklets.find(b => b.id === selectedBookletId)?.name || 'Caderno';

  const toggleAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  const getAnswerStatus = (answer: OfficialAnswer) => {
    if (answer.is_nullified) {
      return { status: 'nullified', label: 'Anulada', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'correct', label: 'Correta', color: 'bg-green-100 text-green-800' };
  };

  const getAnswerIcon = (answer: OfficialAnswer) => {
    if (answer.is_nullified) {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Carregando gabarito oficial...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!officialAnswers || Object.keys(officialAnswers).length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Gabarito oficial não disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gabarito Oficial
          </CardTitle>
          <Button
            onClick={toggleAnswers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAnswers ? 'Ocultar' : 'Mostrar'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {availableBooklets.length > 1 && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Caderno:</label>
            <select
              value={selectedBookletId}
              onChange={(e) => setSelectedBookletId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {availableBooklets.map((booklet) => (
                <option key={booklet.id} value={booklet.id}>
                  {booklet.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {showAnswers && currentBookletAnswers && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Gabarito do {currentBookletName} - {Object.keys(currentBookletAnswers).length} questões
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Object.entries(currentBookletAnswers)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([questionNumber, answer]) => {
                  const answerStatus = getAnswerStatus(answer);
                  return (
                    <div
                      key={questionNumber}
                      className="flex flex-col items-center p-3 border rounded-lg bg-gray-50"
                    >
                      <div className="text-sm font-medium mb-1">
                        Q{questionNumber}
                      </div>
                      <div className="text-lg font-bold mb-2">
                        {answer.correct_answer}
                      </div>
                      <Badge className={`text-xs ${answerStatus.color}`}>
                        <div className="flex items-center gap-1">
                          {getAnswerIcon(answer)}
                          {answerStatus.label}
                        </div>
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {!showAnswers && (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Clique em "Mostrar" para visualizar o gabarito oficial</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


