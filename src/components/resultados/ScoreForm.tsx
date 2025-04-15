
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
      const basicWeight = concurso.basic_knowledge_weight || 1;
      const specific1Weight = concurso.specific_knowledge_1_weight || 1;
      const specific2Weight = concurso.specific_knowledge_2_weight || 1;
      const specific3Weight = concurso.specific_knowledge_3_weight || 1;
      
      // Calculate weighted scores for objective tests
      const weightedBasicScore = values.basicKnowledgeScore * basicWeight;
      const weightedSpecific1Score = values.specificKnowledge1Score * specific1Weight;
      const weightedSpecific2Score = values.specificKnowledge2Score * specific2Weight;
      const weightedSpecific3Score = values.specificKnowledge3Score * specific3Weight;
      
      // Add discursive and case study scores (without weights)
      const discursiveScore = values.discursiveScore;
      const caseStudy1Score = values.caseStudy1Score;
      const caseStudy2Score = values.caseStudy2Score;
      const caseStudy3Score = values.caseStudy3Score;
      
      // Combined specific knowledge score
      const specificKnowledgeScore = 
        (concurso.has_specific_knowledge_1 ? values.specificKnowledge1Score : 0) + 
        (concurso.has_specific_knowledge_2 ? values.specificKnowledge2Score : 0) + 
        (concurso.has_specific_knowledge_3 ? values.specificKnowledge3Score : 0);
      
      // Combined discursive/case study score
      const combinedDiscursiveScore = 
        (concurso.has_discursive ? values.discursiveScore : 0) + 
        (concurso.has_case_study_1 ? values.caseStudy1Score : 0) + 
        (concurso.has_case_study_2 ? values.caseStudy2Score : 0) + 
        (concurso.has_case_study_3 ? values.caseStudy3Score : 0);
        
      // Calculate total weighted score using the formula:
      // (C.Bas x Peso) + (C.Esp1 x Peso) + (C.Esp2 x Peso) + (C.Esp3 x Peso) + Discursiva + Est. Caso1 + Est. Caso2 + Est. Caso3
      const totalScore = 
        (concurso.has_basic_knowledge ? weightedBasicScore : 0) + 
        (concurso.has_specific_knowledge_1 ? weightedSpecific1Score : 0) + 
        (concurso.has_specific_knowledge_2 ? weightedSpecific2Score : 0) + 
        (concurso.has_specific_knowledge_3 ? weightedSpecific3Score : 0) + 
        (concurso.has_discursive ? discursiveScore : 0) + 
        (concurso.has_case_study_1 ? caseStudy1Score : 0) + 
        (concurso.has_case_study_2 ? caseStudy2Score : 0) + 
        (concurso.has_case_study_3 ? caseStudy3Score : 0);
      
      console.log('Calculando pontuação total:', {
        rankingId,
        userId,
        basicKnowledge: values.basicKnowledgeScore,
        basicWeight,
        weightedBasic: weightedBasicScore,
        specificKnowledge1: values.specificKnowledge1Score,
        specific1Weight,
        weightedSpecific1: weightedSpecific1Score,
        specificKnowledge2: values.specificKnowledge2Score,
        specific2Weight,
        weightedSpecific2: weightedSpecific2Score,
        specificKnowledge3: values.specificKnowledge3Score,
        specific3Weight,
        weightedSpecific3: weightedSpecific3Score,
        discursive: discursiveScore,
        caseStudy1: caseStudy1Score,
        caseStudy2: caseStudy2Score,
        caseStudy3: caseStudy3Score,
        total: totalScore
      });
      
      // Prepare the scores to update
      const scoreData = {
        basic_knowledge_score: concurso.has_basic_knowledge ? values.basicKnowledgeScore : 0,
        specific_knowledge_1_score: concurso.has_specific_knowledge_1 ? values.specificKnowledge1Score : 0,
        specific_knowledge_2_score: concurso.has_specific_knowledge_2 ? values.specificKnowledge2Score : 0,
        specific_knowledge_3_score: concurso.has_specific_knowledge_3 ? values.specificKnowledge3Score : 0,
        specific_knowledge_score: specificKnowledgeScore,
        discursive_score: concurso.has_discursive ? values.discursiveScore : 0,
        case_study_1_score: concurso.has_case_study_1 ? values.caseStudy1Score : 0,
        case_study_2_score: concurso.has_case_study_2 ? values.caseStudy2Score : 0,
        case_study_3_score: concurso.has_case_study_3 ? values.caseStudy3Score : 0,
        score: totalScore,
        all_questions_answered: true, // Since user is manually entering scores
        updated_at: new Date().toISOString()
      };
      
      // Update the user ranking directly
      const { error } = await supabase
        .from('user_rankings')
        .update(scoreData)
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
