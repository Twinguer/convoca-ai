
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
  specificKnowledge1Score: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  specificKnowledge2Score: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  specificKnowledge3Score: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  discursiveScore: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  caseStudy1Score: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  caseStudy2Score: z.coerce.number()
    .min(0, 'A nota não pode ser negativa')
    .max(100, 'A nota não pode ser maior que 100'),
  caseStudy3Score: z.coerce.number()
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
      specificKnowledge1Score: 0,
      specificKnowledge2Score: 0,
      specificKnowledge3Score: 0,
      discursiveScore: 0,
      caseStudy1Score: 0,
      caseStudy2Score: 0,
      caseStudy3Score: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Apply weights to each component
      const weightedBasicScore = values.basicKnowledgeScore * (concurso.basic_knowledge_weight || 1);
      const weightedSpecific1Score = values.specificKnowledge1Score * (concurso.specific_knowledge_1_weight || 1);
      const weightedSpecific2Score = values.specificKnowledge2Score * (concurso.specific_knowledge_2_weight || 1);
      const weightedSpecific3Score = values.specificKnowledge3Score * (concurso.specific_knowledge_3_weight || 1);
      const weightedDiscursiveScore = values.discursiveScore * (concurso.discursive_weight || 1);
      const weightedCaseStudy1Score = values.caseStudy1Score * (concurso.case_study_1_weight || 1);
      const weightedCaseStudy2Score = values.caseStudy2Score * (concurso.case_study_2_weight || 1);
      const weightedCaseStudy3Score = values.caseStudy3Score * (concurso.case_study_3_weight || 1);
      
      // Combined specific knowledge score
      const specificKnowledgeScore = 
        values.specificKnowledge1Score + 
        values.specificKnowledge2Score + 
        values.specificKnowledge3Score;
      
      // Combined discursive/case study score
      const combinedDiscursiveScore = 
        values.discursiveScore + 
        values.caseStudy1Score + 
        values.caseStudy2Score + 
        values.caseStudy3Score;
        
      // Calculate total weighted score - numerical sum, not string concatenation
      const totalScore = 
        weightedBasicScore + 
        weightedSpecific1Score + 
        weightedSpecific2Score + 
        weightedSpecific3Score + 
        weightedDiscursiveScore + 
        weightedCaseStudy1Score + 
        weightedCaseStudy2Score + 
        weightedCaseStudy3Score;
      
      console.log('Updating scores:', {
        rankingId,
        userId,
        basicKnowledge: values.basicKnowledgeScore,
        specificKnowledge: specificKnowledgeScore,
        discursive: combinedDiscursiveScore,
        weightedBasic: weightedBasicScore,
        weightedSpecific: weightedSpecific1Score + weightedSpecific2Score + weightedSpecific3Score,
        weightedDiscursive: weightedDiscursiveScore + weightedCaseStudy1Score + weightedCaseStudy2Score + weightedCaseStudy3Score,
        total: totalScore
      });
      
      // Update the user ranking directly
      const { error } = await supabase
        .from('user_rankings')
        .update({
          basic_knowledge_score: values.basicKnowledgeScore,
          specific_knowledge_score: specificKnowledgeScore,
          discursive_score: combinedDiscursiveScore,
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
            {/* Basic Knowledge Score */}
            {concurso.has_basic_knowledge && (
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
                      {concurso.basic_knowledge_weight && concurso.basic_knowledge_weight > 1 && 
                        ` - Peso ${concurso.basic_knowledge_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Specific Knowledge 1 Score */}
            {concurso.has_specific_knowledge_1 && (
              <FormField
                control={form.control}
                name="specificKnowledge1Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conhecimentos Específicos 1 (C.E.1)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 75.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota na parte de conhecimentos específicos 1 (0-100)
                      {concurso.specific_knowledge_1_weight && concurso.specific_knowledge_1_weight > 1 && 
                        ` - Peso ${concurso.specific_knowledge_1_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Specific Knowledge 2 Score */}
            {concurso.has_specific_knowledge_2 && (
              <FormField
                control={form.control}
                name="specificKnowledge2Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conhecimentos Específicos 2 (C.E.2)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 82.5" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota na parte de conhecimentos específicos 2 (0-100)
                      {concurso.specific_knowledge_2_weight && concurso.specific_knowledge_2_weight > 1 && 
                        ` - Peso ${concurso.specific_knowledge_2_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Specific Knowledge 3 Score */}
            {concurso.has_specific_knowledge_3 && (
              <FormField
                control={form.control}
                name="specificKnowledge3Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conhecimentos Específicos 3 (C.E.3)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 78.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota na parte de conhecimentos específicos 3 (0-100)
                      {concurso.specific_knowledge_3_weight && concurso.specific_knowledge_3_weight > 1 && 
                        ` - Peso ${concurso.specific_knowledge_3_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Discursive Score */}
            {concurso.has_discursive && (
              <FormField
                control={form.control}
                name="discursiveScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discursiva</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 70.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota na parte discursiva (0-100)
                      {concurso.discursive_weight && concurso.discursive_weight > 1 && 
                        ` - Peso ${concurso.discursive_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Case Study 1 Score */}
            {concurso.has_case_study_1 && (
              <FormField
                control={form.control}
                name="caseStudy1Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudo de Caso 1</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 85.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota no estudo de caso 1 (0-100)
                      {concurso.case_study_1_weight && concurso.case_study_1_weight > 1 && 
                        ` - Peso ${concurso.case_study_1_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Case Study 2 Score */}
            {concurso.has_case_study_2 && (
              <FormField
                control={form.control}
                name="caseStudy2Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudo de Caso 2</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 75.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota no estudo de caso 2 (0-100)
                      {concurso.case_study_2_weight && concurso.case_study_2_weight > 1 && 
                        ` - Peso ${concurso.case_study_2_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Case Study 3 Score */}
            {concurso.has_case_study_3 && (
              <FormField
                control={form.control}
                name="caseStudy3Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estudo de Caso 3</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 80.0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Sua nota no estudo de caso 3 (0-100)
                      {concurso.case_study_3_weight && concurso.case_study_3_weight > 1 && 
                        ` - Peso ${concurso.case_study_3_weight}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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
