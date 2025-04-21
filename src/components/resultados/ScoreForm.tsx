import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Scale } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { useQueryClient } from '@tanstack/react-query';
import { applyWeightsToScores } from '@/integrations/supabase/rankings/scoreCalculation';

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
  const [weights, setWeights] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch the current weights from the database to ensure we're using the latest values
  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const { data, error } = await supabase
          .from('concursos')
          .select(`
            basic_knowledge_weight,
            specific_knowledge_1_weight,
            specific_knowledge_2_weight,
            specific_knowledge_3_weight,
            specific_knowledge_weight,
            discursive_weight,
            case_study_1_weight,
            case_study_2_weight,
            case_study_3_weight
          `)
          .eq('id', concurso.id)
          .single();
          
        if (error) {
          console.error('Error fetching concurso weights:', error);
          return;
        }
        
        if (data) {
          setWeights({
            basicKnowledge: data.basic_knowledge_weight || 1,
            specificKnowledge1: data.specific_knowledge_1_weight || data.specific_knowledge_weight || 1,
            specificKnowledge2: data.specific_knowledge_2_weight || 1,
            specificKnowledge3: data.specific_knowledge_3_weight || 1,
            discursive: data.discursive_weight || 1,
            caseStudy1: data.case_study_1_weight || 1,
            caseStudy2: data.case_study_2_weight || 1,
            caseStudy3: data.case_study_3_weight || 1
          });
          
          console.log('Weights loaded from database:', data);
        }
      } catch (err) {
        console.error('Error in fetchWeights:', err);
      }
    };
    
    fetchWeights();
  }, [concurso.id]);

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
      console.log('Enviando pontuações brutas (sem aplicar pesos):', values);
      
      // 1. Preparamos as pontuações brutas
      const rawScores = {
        basicKnowledgeScore: concurso.has_basic_knowledge ? values.basicKnowledgeScore : 0,
        specificKnowledgeScore: (
          (concurso.has_specific_knowledge_1 ? values.specificKnowledge1Score : 0) + 
          (concurso.has_specific_knowledge_2 ? values.specificKnowledge2Score : 0) + 
          (concurso.has_specific_knowledge_3 ? values.specificKnowledge3Score : 0)
        ),
        specific1Score: concurso.has_specific_knowledge_1 ? values.specificKnowledge1Score : 0,
        specific2Score: concurso.has_specific_knowledge_2 ? values.specificKnowledge2Score : 0,
        specific3Score: concurso.has_specific_knowledge_3 ? values.specificKnowledge3Score : 0
      };
      
      // 2. Preparamos as pontuações subjetivas
      const subjectiveScores = {
        discursiveScore: concurso.has_discursive ? values.discursiveScore : 0,
        caseStudy1Score: concurso.has_case_study_1 ? values.caseStudy1Score : 0,
        caseStudy2Score: concurso.has_case_study_2 ? values.caseStudy2Score : 0,
        caseStudy3Score: concurso.has_case_study_3 ? values.caseStudy3Score : 0
      };
      
      // 3. Aplicamos os pesos para calcular pontuações ponderadas
      const weightedScores = await applyWeightsToScores(
        concurso.id,
        rawScores,
        subjectiveScores
      );
      
      console.log('Pontuações calculadas:', {
        rawScores,
        subjectiveScores,
        weightedScores
      });
      
      // 4. Salvar todas as pontuações no banco de dados
      const scoreData = {
        // Pontuações brutas
        basic_knowledge_score: rawScores.basicKnowledgeScore,
        specific_knowledge_score: rawScores.specificKnowledgeScore,
        specific_knowledge_1_score: rawScores.specific1Score,
        specific_knowledge_2_score: rawScores.specific2Score,
        specific_knowledge_3_score: rawScores.specific3Score,
        discursive_score: subjectiveScores.discursiveScore,
        case_study_1_score: subjectiveScores.caseStudy1Score,
        case_study_2_score: subjectiveScores.caseStudy2Score,
        case_study_3_score: subjectiveScores.caseStudy3Score,
        
        // Pontuações ponderadas
        weighted_basic_score: weightedScores.weightedBasicScore,
        weighted_specific_1_score: weightedScores.weightedSpecific1Score,
        weighted_specific_2_score: weightedScores.weightedSpecific2Score,
        weighted_specific_3_score: weightedScores.weightedSpecific3Score,
        weighted_discursive_score: weightedScores.weightedDiscursiveScore,
        weighted_case_study_1_score: weightedScores.weightedCaseStudy1Score,
        weighted_case_study_2_score: weightedScores.weightedCaseStudy2Score,
        weighted_case_study_3_score: weightedScores.weightedCaseStudy3Score,
        
        // Pontuação total
        score: weightedScores.totalScore,
        
        // Outras flags
        all_questions_answered: true,
        updated_at: new Date().toISOString()
      };
      
      // Atualizar o ranking do usuário
      const { error } = await supabase
        .from('user_rankings')
        .update(scoreData)
        .eq('id', rankingId);

      if (error) {
        console.error('Supabase error while updating rankings:', error);
        throw error;
      }
      
      // Invalidar queries relacionadas para forçar uma atualização
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['user-rankings', userId] });
      
      toast({
        title: 'Notas registradas com sucesso!',
        description: 'Suas notas foram salvas e seu ranking foi atualizado.',
      });
      
      // Pequeno atraso para permitir que o toast apareça antes de redirecionar
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
                    <FormLabel className="flex items-center">
                      Conhecimentos Básicos (C.B.)
                      {weights?.basicKnowledge > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.basicKnowledge}
                        </span>
                      )}
                    </FormLabel>
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
            )}

            {/* Specific Knowledge 1 Score */}
            {concurso.has_specific_knowledge_1 && (
              <FormField
                control={form.control}
                name="specificKnowledge1Score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Conhecimentos Específicos 1 (C.E.1)
                      {weights?.specificKnowledge1 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.specificKnowledge1}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Conhecimentos Específicos 2 (C.E.2)
                      {weights?.specificKnowledge2 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.specificKnowledge2}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Conhecimentos Específicos 3 (C.E.3)
                      {weights?.specificKnowledge3 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.specificKnowledge3}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Discursiva
                      {weights?.discursive > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.discursive}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Estudo de Caso 1
                      {weights?.caseStudy1 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.caseStudy1}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Estudo de Caso 2
                      {weights?.caseStudy2 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.caseStudy2}
                        </span>
                      )}
                    </FormLabel>
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
                    <FormLabel className="flex items-center">
                      Estudo de Caso 3
                      {weights?.caseStudy3 > 1 && (
                        <span className="ml-2 flex items-center text-emerald-700 text-sm">
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Peso {weights.caseStudy3}
                        </span>
                      )}
                    </FormLabel>
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
