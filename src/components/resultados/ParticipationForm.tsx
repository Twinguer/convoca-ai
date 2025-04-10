
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Concurso } from '@/types/concursos';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ParticipationFormProps {
  concurso: Concurso;
  isAlreadyParticipating: boolean;
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  concurso,
  isAlreadyParticipating
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        });

      if (error) throw error;

      toast({
        title: "Participação confirmada!",
        description: "Você foi adicionado ao ranking deste concurso.",
      });
      
      navigate(`/concurso/${concurso.id}/resultados`);
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
                Você já está participando deste ranking!
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-800">
                Participe deste ranking para compartilhar seu progresso e ver sua posição em relação a outros candidatos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isAlreadyParticipating ? (
          <Button 
            className="w-full" 
            onClick={() => navigate(`/concurso/${concurso.id}/resultados`)}
          >
            Ver Ranking
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleParticipate} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Participar do Ranking"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
