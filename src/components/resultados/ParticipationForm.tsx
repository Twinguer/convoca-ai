
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Concurso } from '@/types/concursos';
import { Loader2, Trophy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  reservationType: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

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
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasAnyReservation = concurso.has_ppp || concurso.has_pcd || concurso.has_indigenas || 
                            concurso.has_hipossuficientes || concurso.has_transsexuais;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reservationType: 'Ampla Concorrência'
    }
  });

  useEffect(() => {
    form.reset({
      reservationType: 'Ampla Concorrência'
    });
  }, [concurso, form]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setError('Você precisa estar logado para participar deste ranking.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (isAlreadyParticipating) {
        if (userRankingId) {
          navigate(`/concurso/${concurso.id}/responder/${userRankingId}`);
        } else {
          setError('Houve um erro ao acessar seu gabarito. Tente novamente.');
        }
      } else {
        const { data: newRanking, error: createError } = await supabase
          .from('user_rankings')
          .insert({
            user_id: user.id,
            concurso_id: concurso.id,
            reservation_type: data.reservationType || 'Ampla Concorrência'
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setSuccess('Participação registrada com sucesso!');

        if (newRanking) {
          setTimeout(() => {
            navigate(`/concurso/${concurso.id}/responder/${newRanking.id}`);
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Error registering participation:', err);
      setError(err.message || 'Houve um erro ao registrar sua participação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participar do Ranking</CardTitle>
          <CardDescription>
            Para participar deste ranking, você precisa estar logado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-4">
            <AlertTitle>Você não está logado</AlertTitle>
            <AlertDescription>
              Faça login ou cadastre-se para participar deste ranking
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/auth')} className="w-full">
            Fazer Login / Cadastrar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
          {isAlreadyParticipating ? 'Você já está participando deste ranking' : 'Participar do Ranking'}
        </CardTitle>
        <CardDescription>
          {isAlreadyParticipating 
            ? 'Você já está participando deste ranking. Clique abaixo para editar suas respostas.'
            : 'Preencha o gabarito para participar deste ranking'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert variant="default" className="mb-4">
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!isAlreadyParticipating && hasAnyReservation && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reservationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de vaga</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de vaga" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ampla Concorrência">Ampla Concorrência</SelectItem>
                        {concurso.has_ppp && (
                          <SelectItem value="PPP">PPP (Pretos, Pardos ou Indígenas)</SelectItem>
                        )}
                        {concurso.has_pcd && (
                          <SelectItem value="PCD">PCD (Pessoas com Deficiência)</SelectItem>
                        )}
                        {concurso.has_indigenas && (
                          <SelectItem value="Indígenas">Indígenas</SelectItem>
                        )}
                        {concurso.has_hipossuficientes && (
                          <SelectItem value="Hipossuficientes">Hipossuficientes</SelectItem>
                        )}
                        {concurso.has_transsexuais && (
                          <SelectItem value="Transsexuais">Pessoas Transsexuais</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Preencher Gabarito'
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      
      {(isAlreadyParticipating || !hasAnyReservation) && (
        <CardFooter>
          <Button 
            onClick={() => form.handleSubmit(onSubmit)()} 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              isAlreadyParticipating ? 
                'Acessar Meu Gabarito' : 
                'Preencher Gabarito'
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
