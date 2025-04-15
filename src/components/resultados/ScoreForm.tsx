
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useQueryClient } from '@tanstack/react-query';

interface ScoreFormProps {
  concurso: Concurso;
  rankingId: string;
  userId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  basicKnowledgeScore: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  specificKnowledgeScore: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  discursiveScore: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
});

type FormValues = z.infer<typeof formSchema>;

export const ScoreForm: React.FC<ScoreFormProps> = ({ concurso, rankingId, userId, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      basicKnowledgeScore: 0,
      specificKnowledgeScore: 0,
      discursiveScore: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Calculate total score as sum of all component scores
      const totalScore = values.basicKnowledgeScore + values.specificKnowledgeScore + values.discursiveScore;
      
      console.log('Updating scores:', {
        rankingId,
        userId,
        basicKnowledge: values.basicKnowledgeScore,
        specificKnowledge: values.specificKnowledgeScore,
        discursive: values.discursiveScore,
        total: totalScore
      });
      
      // Update the user ranking directly
      const { error } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: values.basicKnowledgeScore,
          specific_knowledge_score: values.specificKnowledgeScore,
          discursive_score: values.discursiveScore,
          score: totalScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId);

      if (error) {
        console.error('Supabase error while updating rankings:', error);
        throw error;
      }
      
      // Invalidate related queries to force a refresh
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings', userId] });
      
      toast({
        title: 'Notas registradas com sucesso!',
        description: 'Suas notas foram salvas e seu ranking foi atualizado.',
      });
      
      // Small delay to let the toast appear before redirecting
      setTimeout(onSuccess, 1500);
    } catch (error) {
      console.error('Error updating scores:', error);
      toast({
        title: 'Erro ao registrar notas',
        description: 'Ocorreu um erro ao tentar registrar suas notas. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Registrar suas notas - {concurso.titulo}</CardTitle>
        <CardDescription>
          Preencha abaixo com suas notas para participar do ranking deste concurso
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="basicKnowledgeScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conhecimentos Básicos (C.B.)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 80.5" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Sua nota na parte de conhecimentos básicos (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specificKnowledgeScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conhecimentos Específicos (C.E.)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 75.0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Sua nota na parte de conhecimentos específicos (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discursiveScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discursiva / Estudo de Caso (Dis.)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 70.0" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Sua nota na parte discursiva ou estudo de caso (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Notas'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
