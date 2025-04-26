
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Concurso } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ScoreForm } from './ScoreForm';
import { Loader2 } from 'lucide-react';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScoreForm, setShowScoreForm] = useState(isAlreadyParticipating);
  const [rankingId, setRankingId] = useState<string>(userRankingId || '');

  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para participar do ranking.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .insert({
          user_id: user.id,
          concurso_id: concurso.id,
          score: 0
        })
        .select('id')
        .single();

      if (error) throw error;

      setRankingId(data.id);
      setShowScoreForm(true);
      
      toast({
        title: "Participação confirmada!",
        description: "Você foi adicionado ao ranking deste concurso. Agora registre suas notas.",
      });
    } catch (error) {
      console.error('Error participating in ranking:', error);
      toast({
        title: "Erro ao participar",
        description: "Não foi possível registrar sua participação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScoreSuccess = () => {
    navigate(`/concurso/${concurso.id}/resultados`);
  };

  if (showScoreForm && user && rankingId) {
    return <ScoreForm concurso={concurso} userId={user.id} rankingId={rankingId} onSuccess={handleScoreSuccess} />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Participar do Ranking</CardTitle>
        <CardDescription>
          Participe do ranking para compartilhar seu desempenho e comparar com outros candidatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">{concurso.titulo}</p>
            <p className="text-sm text-muted-foreground">{concurso.orgao} • {concurso.banca}</p>
          </div>
          
          {isAlreadyParticipating ? (
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-green-800">
                Você já está participando deste ranking! Você pode atualizar suas notas a qualquer momento.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-800">
                Participe deste ranking para compartilhar seu desempenho e ver sua posição em relação a outros candidatos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isAlreadyParticipating ? (
          <Button 
            className="w-full" 
            onClick={() => setShowScoreForm(true)}
          >
            Registrar/Atualizar Notas
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleParticipate} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Participar do Ranking"
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
