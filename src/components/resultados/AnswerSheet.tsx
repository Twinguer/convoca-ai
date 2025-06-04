
import React, { useState, useEffect } from 'react';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { useSaveAnswers } from '@/hooks/useSaveAnswers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Concurso } from '@/types/concursos';
import { AnswerSheetHeader } from './AnswerSheetHeader';
import { SectionToggle } from './SectionToggle';
import { AnswerMatrix } from './AnswerMatrix';
import { DiscursiveSection } from './DiscursiveSection';
import { ExamTypeWarning } from './ExamTypeWarning';
import { BookletSelector } from './BookletSelector';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface AnswerSheetProps {
  concurso: Concurso;
  rankingId: string;
  onSuccess: () => void;
}

export const AnswerSheet: React.FC<AnswerSheetProps> = ({ concurso, rankingId, onSuccess }) => {
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoadingBooklets, setIsLoadingBooklets] = useState(false);
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  // Usar o hook useAnswerSheet com o caderno selecionado
  const {
    answers,
    selectedSection,
    setSelectedSection,
    isSaving,
    setIsSaving,
    error,
    setError,
    savedSuccess,
    setSavedSuccess,
    handleAnswerChange,
    handleClearAnswer,
    getTotalQuestions,
    getOptionsForQuestion,
    createAnswerMatrix,
    questionType,
    getAnsweredQuestionsCount,
    discursiveScore,
    setDiscursiveScore,
    caseStudy1Score,
    setCaseStudy1Score,
    caseStudy2Score,
    setCaseStudy2Score,
    caseStudy3Score,
    setCaseStudy3Score,
    isDiscursiveSection,
    getSectionQuestions,
    isHierarchical,
    isLoading,
    refetchAnswers
  } = useAnswerSheet(concurso, rankingId, selectedBooklet);

  // Get edit count from user_rankings
  const [editCount, setEditCount] = useState(0);

  useEffect(() => {
    const fetchEditCount = async () => {
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .select('edit_count')
          .eq('id', rankingId)
          .single();
        
        if (error) throw error;
        setEditCount(data?.edit_count || 0);
      } catch (error) {
        console.error('Error fetching edit count:', error);
      }
    };

    if (rankingId) {
      fetchEditCount();
    }
  }, [rankingId]);

  // Carregar cadernos disponíveis
  useEffect(() => {
    loadBooklets();
  }, [concurso.id]);

  const loadBooklets = async () => {
    try {
      setIsLoadingBooklets(true);
      const { data, error } = await supabase.rpc('manage_exam_booklets', {
        p_operation: 'GET',
        p_concurso_id: concurso.id
      });

      if (error) throw error;
      
      if (data?.booklets && data.booklets.length > 0) {
        setBooklets(data.booklets);
        // Se há apenas um caderno, seleciona automaticamente
        if (data.booklets.length === 1 && !selectedBooklet) {
          setSelectedBooklet(data.booklets[0].id);
        }
      } else {
        setBooklets([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
      setBooklets([]);
    } finally {
      setIsLoadingBooklets(false);
    }
  };

  const handleBookletChange = (bookletId: string) => {
    console.log('[AnswerSheet] Changing booklet from', selectedBooklet, 'to', bookletId);
    setSelectedBooklet(bookletId);
    // As respostas serão recarregadas automaticamente pelo useAnswerSheet
  };

  const { handleSaveAnswers } = useSaveAnswers({
    rankingId,
    concurso,
    answers,
    setIsSaving,
    setError,
    setSavedSuccess,
    onSuccess,
    discursiveScore,
    caseStudy1Score,
    caseStudy2Score,
    caseStudy3Score,
    editCount,
    nullifiedQuestions,
    selectedBookletId: selectedBooklet
  });

  const handleSave = () => {
    if (!selectedBooklet && booklets.length > 1) {
      toast({
        title: "Caderno obrigatório",
        description: "Por favor, selecione o caderno da sua prova antes de salvar",
        variant: "destructive"
      });
      return;
    }
    handleSaveAnswers();
  };

  const handleNullifyQuestion = (questionNumber: number) => {
    setNullifiedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
      } else {
        newSet.add(questionNumber);
      }
      return newSet;
    });
  };

  const totalQuestions = getTotalQuestions();
  const answeredQuestions = getAnsweredQuestionsCount();
  const answerMatrix = createAnswerMatrix();

  if (isLoading || isLoadingBooklets) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando folha de respostas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnswerSheetHeader 
        concurso={concurso}
        totalQuestions={totalQuestions}
        answeredQuestions={answeredQuestions}
        editCount={editCount}
      />

      <ExamTypeWarning examType={concurso.exam_type} />

      {/* Seletor de caderno */}
      {booklets.length > 0 && (
        <BookletSelector
          booklets={booklets}
          selectedBooklet={selectedBooklet}
          onBookletChange={handleBookletChange}
          required={booklets.length > 1}
        />
      )}

      <SectionToggle
        concurso={concurso}
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        isHierarchical={isHierarchical}
      />

      {isDiscursiveSection ? (
        <DiscursiveSection
          sectionType={selectedSection}
          discursiveScore={discursiveScore}
          setDiscursiveScore={setDiscursiveScore}
          caseStudy1Score={caseStudy1Score}
          setCaseStudy1Score={setCaseStudy1Score}
          caseStudy2Score={caseStudy2Score}
          setCaseStudy2Score={setCaseStudy2Score}
          caseStudy3Score={caseStudy3Score}
          setCaseStudy3Score={setCaseStudy3Score}
        />
      ) : (
        <AnswerMatrix
          matrix={answerMatrix}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          getOptionsForQuestion={getOptionsForQuestion}
          examType={concurso.exam_type}
          onClearAnswer={handleClearAnswer}
          nullifiedQuestions={nullifiedQuestions}
          onNullifyQuestion={handleNullifyQuestion}
        />
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800">Respostas salvas com sucesso!</p>
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          onClick={handleSave}
          disabled={isSaving || editCount >= 5}
          className="w-full max-w-md bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            `Salvar Respostas (${editCount}/5 edições)`
          )}
        </Button>
      </div>
    </div>
  );
};
