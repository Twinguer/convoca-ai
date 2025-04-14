
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ParticipationFormProps {
  concurso: Concurso;
  isAlreadyParticipating: boolean;
  userRankingId?: string;
  editCount?: number;
  showAnswerSheet?: boolean;
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  concurso,
  isAlreadyParticipating,
  userRankingId,
  editCount = 0,
  showAnswerSheet = false
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isShowingAnswerSheet, setIsShowingAnswerSheet] = useState(showAnswerSheet);
  const [isShowingScoreForm, setIsShowingScoreForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const maxEditsReached = editCount >= 3;

  // If showAnswerSheet is changed via props, update state
  useEffect(() => {
    setIsShowingAnswerSheet(showAnswerSheet);
  }, [showAnswerSheet]);

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
          edit_count: 0,
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

  // If max edits reached, show warning
  if (isAlreadyParticipating && maxEditsReached && !isShowingAnswerSheet && !isShowingScoreForm) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limite de edições atingido</AlertTitle>
          <AlertDescription>
            Você já atingiu o limite máximo de 3 edições do seu cartão de respostas para este concurso.
            Não é possível fazer mais alterações.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button 
            onClick={() => navigate(`/concurso/${concurso.id}/resultados`)}
            variant="outline"
            className="w-full"
          >
            Ver Ranking do Concurso
          </Button>
        </div>
      </div>
    );
  }

  // If user is already participating and we're not showing any form yet, show options
  if (isAlreadyParticipating && !isShowingScoreForm && !isShowingAnswerSheet) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Você já está participando!</h2>
        <p className="mb-6">Você já está inscrito neste ranking. Escolha uma opção:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={() => setIsShowingAnswerSheet(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={maxEditsReached}
          >
            <PencilLine className="h-4 w-4" />
            Preencher Cartão de Respostas
            {maxEditsReached && <span className="text-xs ml-1">(limite atingido)</span>}
          </Button>
          
          <Button 
            onClick={() => setIsShowingScoreForm(true)} 
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Inserir Notas Diretamente
          </Button>
        </div>
        
        {editCount > 0 && (
          <div className="mt-4 text-sm text-center">
            <p className="text-muted-foreground">
              Você já editou seu cartão de respostas {editCount} vez(es) de 3 permitidas.
            </p>
          </div>
        )}
        
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

  // Show the answer sheet if selected and we have a ranking ID
  if (isShowingAnswerSheet && userRankingId) {
    if (maxEditsReached) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Limite de edições atingido</AlertTitle>
            <AlertDescription>
              Você já atingiu o limite máximo de 3 edições do seu cartão de respostas para este concurso.
              Não é possível fazer mais alterações.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={() => setIsShowingAnswerSheet(false)}
              variant="outline"
              className="flex-1"
            >
              Voltar
            </Button>
            
            <Button 
              onClick={() => navigate(`/concurso/${concurso.id}/resultados`)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Ver Ranking do Concurso
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <AnswerSheet 
        concurso={concurso}
        rankingId={userRankingId}
        onSuccess={() => {
          setIsShowingAnswerSheet(false);
          queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
          queryClient.invalidateQueries({ queryKey: ['participating', concurso.id, user.id] });
          toast({
            title: "Cartão de Respostas Processado",
            description: "Suas respostas foram processadas e seu ranking foi atualizado.",
          });
        }}
      />
    );
  }

  // Show the score form if selected and we have a ranking ID
  if (isShowingScoreForm && userRankingId) {
    return (
      <ScoreForm 
        concurso={concurso}
        rankingId={userRankingId}
        userId={user.id}
        onSuccess={() => {
          setIsShowingScoreForm(false);
          queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
        }}
      />
    );
  }

  // Default view for non-participating users
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      <p className="mb-4">
        Participe do ranking deste concurso para comparar seu desempenho com outros candidatos.
      </p>
      
      <Button 
        onClick={handleParticipate} 
        disabled={isLoading}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
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
