
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2 } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { QuotaSelector, QuotaType } from './QuotaSelector';

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
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaType>('Ampla Concorrência');
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          reservation_type: selectedQuota
        })
        .select('id')
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({
        queryKey: ['participating', concurso.id, user.id]
      });

      toast({
        title: "Inscrição iniciada!",
        description: "Preencha o cartão de respostas para participar oficialmente do ranking."
      });

      // After successful participation, show the answer sheet
      if (data) {
        setShowAnswerSheet(true);
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error joining ranking:', error);
      toast({
        title: "Erro ao participar",
        description: error.message || "Não foi possível completar sua inscrição. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  // Show answer sheet if user is already participating or if they just joined
  if (isAlreadyParticipating || showAnswerSheet) {
    return (
      <AnswerSheet 
        concurso={concurso} 
        rankingId={userRankingId!}
        onSuccess={() => {
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
    <div className="p-6 rounded-lg shadow-sm border bg-zinc-950">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      <p className="mb-4 text-zinc-50">
        Participe do ranking deste concurso para comparar seu desempenho com outros candidatos.
        Você poderá preencher seu cartão de respostas e ver sua classificação.
      </p>
      
      <QuotaSelector 
        concurso={concurso} 
        selectedQuota={selectedQuota} 
        onQuotaChange={setSelectedQuota} 
      />
      
      <Button 
        onClick={handleParticipate} 
        disabled={isLoading} 
        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processando...
          </>
        ) : 'Participar do Ranking'}
      </Button>
    </div>
  );
};
