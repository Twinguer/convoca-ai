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

interface ScoreFormProps {
  concurso: Concurso;
  rankingId: string;
  userId: string;
  onSuccess: () => void;
}

// Definir a interface FormValues para resolver o problema de tipagem
interface FormValues {
  basicKnowledgeScore: number;
  specificKnowledge1Score: number;
  specificKnowledge2Score: number;
  specificKnowledge3Score: number;
  discursiveScore: number;
  caseStudy1Score: number;
  caseStudy2Score: number;
  caseStudy3Score: number;
  [key: string]: number; // Para campos dinâmicos como customDiscipline_*
}

// Create a dynamic form schema that includes custom disciplines
const createFormSchema = (concurso?: Concurso) => {
  const baseSchema: Record<string, any> = {
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
  };

  // Add custom discipline fields if they exist
  if (concurso?.disciplines && Array.isArray(concurso.disciplines)) {
    concurso.disciplines.forEach(discipline => {
      if (discipline.isEnabled && discipline.type) {
        baseSchema[`customDiscipline_${discipline.type}`] = z.coerce.number()
          .min(0, 'A nota não pode ser negativa')
          .max(100, 'A nota não pode ser maior que 100');
      }
    });
  }

  return z.object(baseSchema);
};

export const ScoreForm: React.FC<ScoreFormProps> = ({ concurso, rankingId, userId, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weights, setWeights] = useState<any>(null);
  const queryClient = useQueryClient();

  // Create the form schema based on the concurso
  const formSchema = createFormSchema(concurso);
  type FormValues = z.infer<typeof formSchema>;

  // Generate default values including custom disciplines
  const generateDefaultValues = () => {
    const defaultValues: any = {
      basicKnowledgeScore: 0,
      specificKnowledge1Score: 0,
      specificKnowledge2Score: 0,
      specificKnowledge3Score: 0,
      discursiveScore: 0,
      caseStudy1Score: 0,
      caseStudy2Score: 0,
      caseStudy3Score: 0,
    };

    // Add custom discipline default values
    if (concurso?.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach(discipline => {
        if (discipline.isEnabled && discipline.type) {
          defaultValues[`customDiscipline_${discipline.type}`] = 0;
        }
      });
    }

    return defaultValues;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: generateDefaultValues(),
  });

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
            case_study_3_weight,
            disciplines
          `)
          .eq('id', concurso.id)
          .single();
          
        if (error) {
          console.error('Error fetching concurso weights:', error);
          return;
        }
        
        if (data) {
          const weightsObj = {
            basicKnowledge: data.basic_knowledge_weight || 1,
            specificKnowledge1: data.specific_knowledge_1_weight || data.specific_knowledge_weight || 1,
            specificKnowledge2: data.specific_knowledge_2_weight || 1,
            specificKnowledge3: data.specific_knowledge_3_weight || 1,
            discursive: data.discursive_weight || 1,
            caseStudy1: data.case_study_1_weight || 1,
            caseStudy2: data.case_study_2_weight || 1,
            caseStudy3: data.case_study_3_weight || 1,
            customDisciplines: {}
          };
          
          // Add custom discipline weights
          if (data.disciplines && Array.isArray(data.disciplines)) {
            data.disciplines.forEach(discipline => {
              if (discipline.isEnabled && discipline.type) {
                weightsObj.customDisciplines[discipline.type] = discipline.weight || 1;
              }
            });
          }
          
          setWeights(weightsObj);
          console.log('Weights loaded from database:', weightsObj);
        }
      } catch (err) {
        console.error('Error in fetchWeights:', err);
      }
    };
    
    fetchWeights();
  }, [concurso.id]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Use weights from state if available, otherwise fall back to concurso prop
      const actualWeights = weights || {
        basicKnowledge: concurso.basic_knowledge_weight || 1,
        specificKnowledge1: concurso.specific_knowledge_1_weight || concurso.specific_knowledge_weight || 1,
        specificKnowledge2: concurso.specific_knowledge_2_weight || 1,
        specificKnowledge3: concurso.specific_knowledge_3_weight || 1,
        discursive: concurso.discursive_weight || 1,
        caseStudy1: concurso.case_study_1_weight || 1,
        caseStudy2: concurso.case_study_2_weight || 1,
        caseStudy3: concurso.case_study_3_weight || 1,
        customDisciplines: {}
      };
      
      // Add custom discipline weights from concurso if not in state
      if (!weights && concurso.disciplines && Array.isArray(concurso.disciplines)) {
        concurso.disciplines.forEach(discipline => {
          if (discipline.isEnabled && discipline.type) {
            actualWeights.customDisciplines[discipline.type] = discipline.weight || 1;
          }
        });
      }
      
      console.log('Using weights for calculation:', actualWeights);
      
      // Apply weights to each component
      const weightedBasicScore = values.basicKnowledgeScore * actualWeights.basicKnowledge;
      const weightedSpecific1Score = values.specificKnowledge1Score * actualWeights.specificKnowledge1;
      const weightedSpecific2Score = values.specificKnowledge2Score * actualWeights.specificKnowledge2;
      const weightedSpecific3Score = values.specificKnowledge3Score * actualWeights.specificKnowledge3;
      const weightedDiscursiveScore = values.discursiveScore * actualWeights.discursive;
      const weightedCaseStudy1Score = values.caseStudy1Score * actualWeights.caseStudy1;
      const weightedCaseStudy2Score = values.caseStudy2Score * actualWeights.caseStudy2;
      const weightedCaseStudy3Score = values.caseStudy3Score * actualWeights.caseStudy3;
      
      // Create objects for custom discipline scores
      const customDisciplineScores = {};
      const weightedCustomDisciplineScores = {};
      
      // Process custom discipline scores
      if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
        concurso.disciplines.forEach(discipline => {
          if (discipline.isEnabled && discipline.type) {
            const scoreKey = `customDiscipline_${discipline.type}`;
            const score = values[scoreKey] || 0;
            const weight = actualWeights.customDisciplines[discipline.type] || 1;
            const weightedScore = score * weight;
            
            customDisciplineScores[discipline.type] = score;
            weightedCustomDisciplineScores[discipline.type] = weightedScore;
          }
        });
      }
      
      // Combined specific knowledge score
      const specificKnowledgeScore = 
        (concurso.has_specific_knowledge_1 ? values.specificKnowledge1Score : 0) + 
        (concurso.has_specific_knowledge_2 ? values.specificKnowledge2Score : 0) + 
        (concurso.has_specific_knowledge_3 ? values.specificKnowledge3Score : 0);
      
      // Calculate total weighted score including custom disciplines
      let totalScore = 
        (concurso.has_basic_knowledge ? weightedBasicScore : 0) + 
        (concurso.has_specific_knowledge_1 ? weightedSpecific1Score : 0) + 
        (concurso.has_specific_knowledge_2 ? weightedSpecific2Score : 0) + 
        (concurso.has_specific_knowledge_3 ? weightedSpecific3Score : 0) + 
        (concurso.has_discursive ? weightedDiscursiveScore : 0) + 
        (concurso.has_case_study_1 ? weightedCaseStudy1Score : 0) + 
        (concurso.has_case_study_2 ? weightedCaseStudy2Score : 0) + 
        (concurso.has_case_study_3 ? weightedCaseStudy3Score : 0);
      
      // Add custom discipline scores to total
      Object.values(weightedCustomDisciplineScores).forEach(score => {
        totalScore += Number(score) || 0;
      });
      
      console.log('Calculando pontuação total:', {
        rankingId,
        userId,
        basicKnowledge: values.basicKnowledgeScore,
        basicWeight: actualWeights.basicKnowledge,
        weightedBasic: weightedBasicScore,
        specificKnowledge1: values.specificKnowledge1Score,
        specific1Weight: actualWeights.specificKnowledge1,
        weightedSpecific1: weightedSpecific1Score,
        specificKnowledge2: values.specificKnowledge2Score,
        specific2Weight: actualWeights.specificKnowledge2,
        weightedSpecific2: weightedSpecific2Score,
        specificKnowledge3: values.specificKnowledge3Score,
        specific3Weight: actualWeights.specificKnowledge3,
        weightedSpecific3: weightedSpecific3Score,
        discursive: values.discursiveScore,
        discursiveWeight: actualWeights.discursive,
        weightedDiscursive: weightedDiscursiveScore,
        caseStudy1: values.caseStudy1Score,
        caseStudy1Weight: actualWeights.caseStudy1,
        weightedCaseStudy1: weightedCaseStudy1Score,
        caseStudy2: values.caseStudy2Score,
        caseStudy2Weight: actualWeights.caseStudy2,
        weightedCaseStudy2: weightedCaseStudy2Score,
        caseStudy3: values.caseStudy3Score,
        caseStudy3Weight: actualWeights.caseStudy3,
        weightedCaseStudy3: weightedCaseStudy3Score,
        customDisciplineScores,
        weightedCustomDisciplineScores,
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
        custom_discipline_scores: customDisciplineScores,
        weighted_custom_discipline_scores: weightedCustomDisciplineScores,
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

            {/* Custom Disciplines Scores */}
            {concurso.disciplines && Array.isArray(concurso.disciplines) && 
              concurso.disciplines
                .filter(discipline => discipline.isEnabled)
                .map((discipline, index) => (
                  <FormField
                    key={`custom-discipline-${index}`}
                    control={form.control}
                    name={`customDiscipline_${discipline.type}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          {discipline.name}
                          {(weights?.customDisciplines?.[discipline.type] > 1 || discipline.weight > 1) && (
                            <span className="ml-2 flex items-center text-emerald-700 text-sm">
                              <Scale className="h-3.5 w-3.5 mr-1" />
                              Peso {weights?.customDisciplines?.[discipline.type] || discipline.weight}
                            </span>
                          )}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={`Ex: 85.0`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Sua nota em {discipline.name} (0-100)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))
            }

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
