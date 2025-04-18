
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, Edit2, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateAnswerKey, recalculateAllRankings } from '@/integrations/supabase/rankings/updateAnswerKey';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';

interface AnswerKeyTabProps {
  concursoId: string;
  hasBasicKnowledge: boolean;
  hasSpecificKnowledge1: boolean;
  hasSpecificKnowledge2: boolean;
  hasSpecificKnowledge3: boolean;
  basicKnowledgeQuestions?: number;
  specificKnowledge1Questions?: number;
  specificKnowledge2Questions?: number;
  specificKnowledge3Questions?: number;
  examType: string;
  alternativesCount: number;
}

interface AnswerKey {
  id: string;
  concurso_id: string;
  question_number: number;
  answer: string;
  is_basic_knowledge: boolean;
  is_specific_1?: boolean;
  is_specific_2?: boolean;
  section?: string;
}

export const AnswerKeyTab: React.FC<AnswerKeyTabProps> = ({
  concursoId,
  hasBasicKnowledge,
  hasSpecificKnowledge1,
  hasSpecificKnowledge2,
  hasSpecificKnowledge3,
  basicKnowledgeQuestions,
  specificKnowledge1Questions,
  specificKnowledge2Questions,
  specificKnowledge3Questions,
  examType,
  alternativesCount
}) => {
  const [answerKey, setAnswerKey] = useState<AnswerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("gabarito");
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  const [concursoData, setConcursoData] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      has_basic_knowledge: hasBasicKnowledge,
      has_specific_knowledge_1: hasSpecificKnowledge1,
      has_specific_knowledge_2: hasSpecificKnowledge2,
      has_specific_knowledge_3: hasSpecificKnowledge3,
      basic_knowledge_questions: basicKnowledgeQuestions,
      specific_knowledge_1_questions: specificKnowledge1Questions,
      specific_knowledge_2_questions: specificKnowledge2Questions,
      specific_knowledge_3_questions: specificKnowledge3Questions,
      basic_knowledge_weight: 1,
      specific_knowledge_1_weight: 1,
      specific_knowledge_2_weight: 1,
      specific_knowledge_3_weight: 1,
      discursive_weight: 1,
      case_study_1_weight: 1,
      case_study_2_weight: 1,
      case_study_3_weight: 1,
      has_discursive: false,
      has_case_study_1: false,
      has_case_study_2: false,
      has_case_study_3: false,
      exam_type: examType,
      alternatives_count: alternativesCount,
      wrong_answer_penalty: 0
    }
  });

  useEffect(() => {
    fetchConcursoData();
    fetchAnswerKey();
  }, [concursoId]);

  const fetchConcursoData = async () => {
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select(`*`)
        .eq('id', concursoId)
        .single();

      if (error) throw error;
      if (data) {
        setConcursoData(data);
        form.reset({
          has_basic_knowledge: data.has_basic_knowledge,
          has_specific_knowledge_1: data.has_specific_knowledge_1,
          has_specific_knowledge_2: data.has_specific_knowledge_2,
          has_specific_knowledge_3: data.has_specific_knowledge_3,
          basic_knowledge_questions: data.basic_knowledge_questions,
          specific_knowledge_1_questions: data.specific_knowledge_1_questions,
          specific_knowledge_2_questions: data.specific_knowledge_2_questions,
          specific_knowledge_3_questions: data.specific_knowledge_3_questions,
          basic_knowledge_weight: data.basic_knowledge_weight || 1,
          specific_knowledge_1_weight: data.specific_knowledge_1_weight || data.specific_knowledge_weight || 1,
          specific_knowledge_2_weight: data.specific_knowledge_2_weight || 1,
          specific_knowledge_3_weight: data.specific_knowledge_3_weight || 1,
          discursive_weight: data.discursive_weight || 1,
          case_study_1_weight: data.case_study_1_weight || 1,
          case_study_2_weight: data.case_study_2_weight || 1,
          case_study_3_weight: data.case_study_3_weight || 1,
          has_discursive: data.has_discursive || false,
          has_case_study_1: data.has_case_study_1 || false,
          has_case_study_2: data.has_case_study_2 || false,
          has_case_study_3: data.has_case_study_3 || false,
          exam_type: data.exam_type || 'Alternativas',
          alternatives_count: data.alternatives_count || 5,
          wrong_answer_penalty: data.wrong_answer_penalty || 0
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do concurso:', error);
    }
  };

  const fetchAnswerKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('answer_keys')
        .select('*')
        .eq('concurso_id', concursoId)
        .order('question_number', { ascending: true });

      if (error) throw error;

      // Organize questions by section
      const processedData = data.map((item: any) => {
        let section = 'Outros';
        if (item.is_basic_knowledge) {
          section = 'Conhecimento Básico';
        } else if (item.is_specific_1) {
          section = 'Conhecimento Específico 1';
        } else if (item.is_specific_2) {
          section = 'Conhecimento Específico 2';
        }
        return { ...item, section };
      });

      setAnswerKey(processedData);
    } catch (error: any) {
      console.error('Erro ao buscar gabarito:', error);
      setError(error.message || 'Erro ao carregar gabarito');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (id: string, answer: string) => {
    setAnswerKey((prev) =>
      prev.map((item) => (item.id === id ? { ...item, answer } : item))
    );
  };

  const handleSaveAnswerKey = async () => {
    setSaving(true);
    try {
      const updates = answerKey.map(q => ({
        id: q.id,
        question_number: q.question_number,
        answer: q.answer
      }));

      const success = await updateAnswerKey(concursoId, updates);
      if (success) {
        toast.success('Gabarito atualizado com sucesso');
      } else {
        throw new Error('Falha ao atualizar o gabarito');
      }
    } catch (error: any) {
      console.error('Erro ao salvar gabarito:', error);
      toast.error(`Erro ao salvar gabarito: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStructure = async (data: any) => {
    try {
      setIsEditingStructure(false);
      setSaving(true);

      const { error } = await supabase
        .from('concursos')
        .update({
          has_basic_knowledge: data.has_basic_knowledge,
          has_specific_knowledge_1: data.has_specific_knowledge_1,
          has_specific_knowledge_2: data.has_specific_knowledge_2,
          has_specific_knowledge_3: data.has_specific_knowledge_3,
          basic_knowledge_questions: data.basic_knowledge_questions,
          specific_knowledge_1_questions: data.specific_knowledge_1_questions,
          specific_knowledge_2_questions: data.specific_knowledge_2_questions,
          specific_knowledge_3_questions: data.specific_knowledge_3_questions,
          basic_knowledge_weight: data.basic_knowledge_weight,
          specific_knowledge_1_weight: data.specific_knowledge_1_weight,
          specific_knowledge_2_weight: data.specific_knowledge_2_weight,
          specific_knowledge_3_weight: data.specific_knowledge_3_weight,
          discursive_weight: data.discursive_weight,
          case_study_1_weight: data.case_study_1_weight,
          case_study_2_weight: data.case_study_2_weight,
          case_study_3_weight: data.case_study_3_weight,
          has_discursive: data.has_discursive,
          has_case_study_1: data.has_case_study_1,
          has_case_study_2: data.has_case_study_2,
          has_case_study_3: data.has_case_study_3,
          exam_type: data.exam_type,
          alternatives_count: data.alternatives_count,
          wrong_answer_penalty: data.wrong_answer_penalty
        })
        .eq('id', concursoId);

      if (error) throw error;
      
      toast.success('Estrutura da prova atualizada com sucesso');
      
      // Recalcular pontuações após atualizar a estrutura da prova
      await recalculateAllRankings(concursoId);
      
      fetchConcursoData(); // Recarrega os dados do concurso
    } catch (error: any) {
      console.error('Erro ao salvar estrutura da prova:', error);
      toast.error(`Erro ao salvar estrutura: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Helper function to determine available answer options
  const getAnswerOptions = () => {
    if (examType === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    // Para provas de alternativas (A, B, C, D, E, etc.)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: alternativesCount }, (_, i) => letters[i]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando gabarito...</span>
      </div>
    );
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="gabarito">Gabarito Oficial</TabsTrigger>
          <TabsTrigger value="estrutura">Estrutura da Prova</TabsTrigger>
        </TabsList>

        <TabsContent value="gabarito">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gabarito Oficial</CardTitle>
              <Button onClick={handleSaveAnswerKey} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : answerKey.length === 0 ? (
                <p className="text-center py-4">
                  Nenhuma questão cadastrada. Adicione questões usando o botão acima.
                </p>
              ) : (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {answerKey.map((question) => (
                      <div key={question.id} className="flex flex-col border rounded-md p-2">
                        <Label className="text-xs text-muted-foreground mb-1">
                          Q{question.question_number}
                        </Label>
                        <Select
                          value={question.answer}
                          onValueChange={(value) => handleAnswerChange(question.id, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAnswerOptions().map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs mt-1 text-muted-foreground">
                          {question.section}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estrutura">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Estrutura da Prova</CardTitle>
              {isEditingStructure ? (
                <Button onClick={form.handleSubmit(handleSaveStructure)} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={() => setIsEditingStructure(true)} variant="outline">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Estrutura
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingStructure ? (
                <ExamStructureSection form={form} />
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Formato do Exame</h3>
                    <p>Tipo: {concursoData?.exam_type}</p>
                    <p>Número de alternativas: {concursoData?.alternatives_count}</p>
                    <p>Penalidade para erros: {concursoData?.wrong_answer_penalty}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Seções</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {concursoData?.has_basic_knowledge && (
                        <li>
                          Conhecimento Básico - {concursoData?.basic_knowledge_questions} questões (Peso: {concursoData?.basic_knowledge_weight})
                        </li>
                      )}
                      {concursoData?.has_specific_knowledge_1 && (
                        <li>
                          Conhecimento Específico 1 - {concursoData?.specific_knowledge_1_questions} questões (Peso: {concursoData?.specific_knowledge_1_weight})
                        </li>
                      )}
                      {concursoData?.has_specific_knowledge_2 && (
                        <li>
                          Conhecimento Específico 2 - {concursoData?.specific_knowledge_2_questions} questões (Peso: {concursoData?.specific_knowledge_2_weight})
                        </li>
                      )}
                      {concursoData?.has_specific_knowledge_3 && (
                        <li>
                          Conhecimento Específico 3 - {concursoData?.specific_knowledge_3_questions} questões (Peso: {concursoData?.specific_knowledge_3_weight})
                        </li>
                      )}
                      {concursoData?.has_discursive && (
                        <li>Discursiva (Peso: {concursoData?.discursive_weight})</li>
                      )}
                      {concursoData?.has_case_study_1 && (
                        <li>Estudo de Caso 1 (Peso: {concursoData?.case_study_1_weight})</li>
                      )}
                      {concursoData?.has_case_study_2 && (
                        <li>Estudo de Caso 2 (Peso: {concursoData?.case_study_2_weight})</li>
                      )}
                      {concursoData?.has_case_study_3 && (
                        <li>Estudo de Caso 3 (Peso: {concursoData?.case_study_3_weight})</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
