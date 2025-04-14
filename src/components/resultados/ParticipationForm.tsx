
import React, { useState } from 'react';
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
  const [showAnswerSheet, setShowAnswerSheet] = useState(true); // Changed to true to show by default
  const [showScoreForm, setShowScoreForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Para participar do ranking, faça login primeiro.",
        variant: "destructive",
      });
      navigate('/project/auth');
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
        })
        .select('id')
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['participating', concurso.id, user.id] });
      
      toast({
        title: "Inscrição realizada!",
        description: "Você agora está participando deste ranking.",
      });
      
      // Redirect to the answer form
      setTimeout(() => {
        // We have the ranking ID from the INSERT operation above
        if (data) {
          setIsLoading(false);
          navigate(window.location.pathname, { replace: true });
        }
      }, 1500);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error joining ranking:', error);
      toast({
        title: "Erro ao participar",
        description: error.message || "Não foi possível completar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
        <p className="mb-4">Faça login para participar do ranking deste concurso.</p>
        <Button onClick={() => navigate('/project/auth')}>Fazer Login</Button>
      </div>
    );
  }

  if (isAlreadyParticipating && !showScoreForm && !showAnswerSheet) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Você já está participando!</h2>
        <p className="mb-6">Você já está inscrito neste ranking. Escolha uma opção:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => setShowAnswerSheet(true)}
            className="flex items-center justify-center gap-2"
          >
            <PencilLine className="h-4 w-4" />
            Preencher Cartão de Respostas
          </Button>
          
          <Button 
            onClick={() => setShowScoreForm(true)} 
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Inserir Notas Diretamente
          </Button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Você pode escolher entre preencher o cartão de respostas 
            da prova ou inserir suas notas diretamente.
          </p>
          <ArrowDown className="h-4 w-4 mx-auto my-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            O cartão de respostas é mais preciso para calcular sua pontuação!
          </p>
        </div>
      </div>
    );
  }

  if (showAnswerSheet && userRankingId) {
    return (
      <AnswerSheet 
        concurso={concurso}
        rankingId={userRankingId}
        onSuccess={() => {
          setShowAnswerSheet(false);
          queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
          toast({
            title: "Cartão de Respostas Processado",
            description: "Suas respostas foram processadas e seu ranking foi atualizado.",
          });
        }}
      />
    );
  }

  if (showScoreForm && userRankingId) {
    return (
      <ScoreForm 
        concurso={concurso}
        rankingId={userRankingId}
        userId={user.id}
        onSuccess={() => {
          setShowScoreForm(false);
          queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
        }}
      />
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      <p className="mb-4">
        Participe do ranking deste concurso para comparar seu desempenho com outros candidatos.
      </p>
      
      <Button 
        onClick={handleParticipate} 
        disabled={isLoading}
        className="w-full"
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
