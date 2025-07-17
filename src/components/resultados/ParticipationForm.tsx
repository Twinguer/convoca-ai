
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2 } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { QuotaSelector, QuotaType } from './QuotaSelector';
import { BookletSelector } from './BookletSelector';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface ParticipationFormProps {
  concurso: Concurso;
  isAlreadyParticipating: boolean;
  userRankingId?: string;
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  concurso,
  isAlreadyParticipating,
  userRankingId
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(true);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaType>('Ampla Concorrência');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoadingBooklets, setIsLoadingBooklets] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Carregar cadernos disponíveis
  useEffect(() => {
    loadBooklets();
  }, [concurso.id]);

  // Check URL params to see if we should force display answer sheet
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAnswerSheet') === 'true') {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    }
  }, []);

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
        if (data.booklets.length === 1) {
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

  const validateParticipation = () => {
    if (!selectedQuota) {
      toast({
        title: "Cota obrigatória",
        description: "Por favor, selecione uma cota de reserva",
        variant: "destructive"
      });
      return false;
    }

    // Se há múltiplos cadernos, a seleção é obrigatória
    if (booklets.length > 1 && !selectedBooklet) {
      toast({
        title: "Caderno obrigatório",
        description: "Por favor, selecione o caderno da sua prova",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Para participar do ranking, faça login primeiro.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    if (!validateParticipation()) {
      return;
    }

    setIsLoading(true);
    try {
        const { data, error } = await supabase
        .from('user_rankings')
        .insert({
          user_id: user.id,
          concurso_id: concurso.id,
          score: 0,
          edit_count: 0,
          all_questions_answered: false,
          reservation_type: selectedQuota,
          selected_booklet: booklets.length > 0 && selectedBooklet ? selectedBooklet as string : null
        })
        .select('id')
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ['participating', concurso.id, user.id]
      });

      toast({
        title: "Inscrição iniciada!",
        description: "Preencha o cartão de respostas para participar oficialmente do ranking."
      });

      // Just reload the page to show the answer sheet
      setTimeout(() => {
        if (data) {
          setIsLoading(false);
          window.location.reload();
        }
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error joining ranking:', error);
      toast({
        title: "Erro ao participar",
        description: error.message || "Não foi possível completar sua inscrição. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
        <p className="mb-4">Faça login para participar do ranking deste concurso.</p>
        <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">
          Fazer Login
        </Button>
      </div>
    );
  }

  // Show the answer sheet if selected and we have a ranking ID
  if ((showAnswerSheet || isAlreadyParticipating) && userRankingId) {
    return (
      <AnswerSheet 
        concurso={concurso} 
        rankingId={userRankingId} 
        onSuccess={() => {
          setShowAnswerSheet(false);
          queryClient.invalidateQueries({
            queryKey: ['rankings', concurso.id]
          });
          navigate(`/concurso/${concurso.id}/resultados`);
          toast({
            title: "Cartão de Respostas Processado",
            description: "Suas respostas foram processadas e seu ranking foi atualizado."
          });
        }} 
      />
    );
  }

  // Default view for non-participating users
  return (
    <div className="p-6 rounded-lg shadow-sm border bg-zinc-50">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      <p className="mb-4 text-gray-500">
        Participe do ranking deste concurso para comparar seu desempenho com outros candidatos.
        Você poderá preencher seu cartão de respostas e ver sua classificação.
      </p>
      
      <div className="space-y-4">
        {/* Quota selection component */}
        <QuotaSelector 
          concurso={concurso} 
          selectedQuota={selectedQuota} 
          onQuotaChange={setSelectedQuota} 
        />
        
        {/* Booklet selection (only if multiple booklets available) */}
        {isLoadingBooklets ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando cadernos...
          </div>
        ) : (
          <BookletSelector
            booklets={booklets}
            selectedBooklet={selectedBooklet}
            onBookletChange={setSelectedBooklet}
            required={booklets.length > 1}
          />
        )}
      </div>
      
      <Button 
        onClick={handleParticipate} 
        disabled={isLoading || isLoadingBooklets} 
        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processando...
          </>
        ) : (
          'Participar do Ranking'
        )}
      </Button>
    </div>
  );
};
