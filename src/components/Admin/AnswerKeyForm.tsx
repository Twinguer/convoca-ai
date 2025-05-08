
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';
import { NullifyQuestionButton } from '../Admin/NullifyQuestionButton';
import { recalculateAllUserScores } from '@/integrations/supabase/rankings/batchOperations';
import { answerKeyService } from '@/services/answerKeyService';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  // Estado para a seção selecionada (agora precisa suportar todas as áreas de conhecimento)
  const [selectedSection, setSelectedSection] = useState<string>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [recalculationSuccess, setRecalculationSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: concurso, isLoading: isLoadingConcurso } = useQuery({
    queryKey: ['concurso-details', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (error) throw error;
      return data as Concurso;
    },
  });

  const { data: existingAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['official-answers-weights', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_official_answer_weights', {
        p_concurso_id: concursoId
      });
        
      if (error) throw error;
      return data || {};
    },
  });

  useEffect(() => {
    if (existingAnswers && Object.keys(existingAnswers).length > 0) {
      const answersMap: { [key: number]: string } = {};
      const nullifiedSet = new Set<number>();
      
      Object.entries(existingAnswers).forEach(([key, value]: [string, any]) => {
        const questionNumber = parseInt(key.replace('questao', ''));
        
        answersMap[questionNumber] = value.resposta;
        if (value.anulada) {
          nullifiedSet.add(questionNumber);
        }
      });
      
      setAnswers(answersMap);
      setNullifiedQuestions(nullifiedSet);
    }
  }, [existingAnswers]);

  if (isLoadingConcurso || isLoadingAnswers) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-center text-gray-600">Carregando informações do gabarito...</p>
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-destructive space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <p>Não foi possível carregar as informações do concurso.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAllQuestionsFromAllSections = () => {
    const allQuestions: number[] = [];
    
    let currentQuestionNumber = 1;
    
    // Mapear todos os campos de conhecimento possíveis
    const knowledgeFields = [
      { has: 'has_basic_knowledge', questions: 'basic_knowledge_questions' },
      { has: 'has_specific_knowledge_1', questions: 'specific_knowledge_1_questions' },
      { has: 'has_specific_knowledge_2', questions: 'specific_knowledge_2_questions' },
      { has: 'has_specific_knowledge_3', questions: 'specific_knowledge_3_questions' },
      
      // Novas áreas de conhecimento
      { has: 'has_lpt', questions: 'lpt_questions' },
      { has: 'has_ing', questions: 'ing_questions' },
      { has: 'has_mat', questions: 'mat_questions' },
      { has: 'has_rlm', questions: 'rlm_questions' },
      { has: 'has_est', questions: 'est_questions' },
      { has: 'has_cos', questions: 'cos_questions' },
      { has: 'has_adm', questions: 'adm_questions' },
      { has: 'has_ado', questions: 'ado_questions' },
      { has: 'has_cot', questions: 'cot_questions' },
      { has: 'has_coc', questions: 'coc_questions' },
      { has: 'has_eco', questions: 'eco_questions' },
      { has: 'has_tri', questions: 'tri_questions' },
      { has: 'has_afo', questions: 'afo_questions' },
      { has: 'has_ltc', questions: 'ltc_questions' },
      { has: 'has_tic', questions: 'tic_questions' },
      { has: 'has_ett', questions: 'ett_questions' },
      { has: 'has_aud', questions: 'aud_questions' },
      { has: 'has_civ', questions: 'civ_questions' },
      { has: 'has_pen', questions: 'pen_questions' },
      { has: 'has_inf', questions: 'inf_questions' },
      { has: 'has_emp', questions: 'emp_questions' },
      { has: 'has_mtf', questions: 'mtf_questions' },
      { has: 'has_out', questions: 'out_questions' }
    ];
    
    knowledgeFields.forEach(field => {
      const hasField = concurso[field.has as keyof Concurso] as boolean;
      const questionsCount = concurso[field.questions as keyof Concurso] as number || 0;
      
      if (hasField && questionsCount > 0) {
        for (let i = 0; i < questionsCount; i++) {
          allQuestions.push(currentQuestionNumber++);
        }
      }
    });
    
    return allQuestions;
  };

  const getQuestionsCount = (sectionKey: string): number => {
    const fieldMappings: Record<string, keyof Concurso> = {
      'basic': 'basic_knowledge_questions',
      'specific1': 'specific_knowledge_1_questions',
      'specific2': 'specific_knowledge_2_questions',
      'specific3': 'specific_knowledge_3_questions',
      
      // Novas áreas de conhecimento
      'lpt': 'lpt_questions',
      'ing': 'ing_questions',
      'mat': 'mat_questions',
      'rlm': 'rlm_questions',
      'est': 'est_questions',
      'cos': 'cos_questions',
      'adm': 'adm_questions',
      'ado': 'ado_questions',
      'cot': 'cot_questions',
      'coc': 'coc_questions',
      'eco': 'eco_questions',
      'tri': 'tri_questions',
      'afo': 'afo_questions',
      'ltc': 'ltc_questions',
      'tic': 'tic_questions',
      'ett': 'ett_questions',
      'aud': 'aud_questions',
      'civ': 'civ_questions',
      'pen': 'pen_questions',
      'inf': 'inf_questions',
      'emp': 'emp_questions',
      'mtf': 'mtf_questions',
      'out': 'out_questions'
    };

    const hasFieldMappings: Record<string, keyof Concurso> = {
      'basic': 'has_basic_knowledge',
      'specific1': 'has_specific_knowledge_1',
      'specific2': 'has_specific_knowledge_2',
      'specific3': 'has_specific_knowledge_3',
      
      // Novas áreas de conhecimento
      'lpt': 'has_lpt',
      'ing': 'has_ing',
      'mat': 'has_mat',
      'rlm': 'has_rlm',
      'est': 'has_est',
      'cos': 'has_cos',
      'adm': 'has_adm',
      'ado': 'has_ado',
      'cot': 'has_cot',
      'coc': 'has_coc',
      'eco': 'has_eco',
      'tri': 'has_tri',
      'afo': 'has_afo',
      'ltc': 'has_ltc',
      'tic': 'has_tic',
      'ett': 'has_ett',
      'aud': 'has_aud',
      'civ': 'has_civ',
      'pen': 'has_pen',
      'inf': 'has_inf',
      'emp': 'has_emp',
      'mtf': 'has_mtf',
      'out': 'has_out'
    };
    
    const hasField = concurso[hasFieldMappings[sectionKey] as keyof Concurso] as boolean;
    if (hasField) {
      return (concurso[fieldMappings[sectionKey] as keyof Concurso] as number) || 0;
    }
    
    return 0;
  };

  const getQuestionsRange = () => {
    if (!concurso) return [];
    
    // Mapear todos os campos de conhecimento
    const knowledgeFields = [
      { key: 'basic', has: 'has_basic_knowledge', questions: 'basic_knowledge_questions' },
      { key: 'specific1', has: 'has_specific_knowledge_1', questions: 'specific_knowledge_1_questions' },
      { key: 'specific2', has: 'has_specific_knowledge_2', questions: 'specific_knowledge_2_questions' },
      { key: 'specific3', has: 'has_specific_knowledge_3', questions: 'specific_knowledge_3_questions' },
      
      // Novas áreas de conhecimento
      { key: 'lpt', has: 'has_lpt', questions: 'lpt_questions' },
      { key: 'ing', has: 'has_ing', questions: 'ing_questions' },
      { key: 'mat', has: 'has_mat', questions: 'mat_questions' },
      { key: 'rlm', has: 'has_rlm', questions: 'rlm_questions' },
      { key: 'est', has: 'has_est', questions: 'est_questions' },
      { key: 'cos', has: 'has_cos', questions: 'cos_questions' },
      { key: 'adm', has: 'has_adm', questions: 'adm_questions' },
      { key: 'ado', has: 'has_ado', questions: 'ado_questions' },
      { key: 'cot', has: 'has_cot', questions: 'cot_questions' },
      { key: 'coc', has: 'has_coc', questions: 'coc_questions' },
      { key: 'eco', has: 'has_eco', questions: 'eco_questions' },
      { key: 'tri', has: 'has_tri', questions: 'tri_questions' },
      { key: 'afo', has: 'has_afo', questions: 'afo_questions' },
      { key: 'ltc', has: 'has_ltc', questions: 'ltc_questions' },
      { key: 'tic', has: 'has_tic', questions: 'tic_questions' },
      { key: 'ett', has: 'has_ett', questions: 'ett_questions' },
      { key: 'aud', has: 'has_aud', questions: 'aud_questions' },
      { key: 'civ', has: 'has_civ', questions: 'civ_questions' },
      { key: 'pen', has: 'has_pen', questions: 'pen_questions' },
      { key: 'inf', has: 'has_inf', questions: 'inf_questions' },
      { key: 'emp', has: 'has_emp', questions: 'emp_questions' },
      { key: 'mtf', has: 'has_mtf', questions: 'mtf_questions' },
      { key: 'out', has: 'has_out', questions: 'out_questions' }
    ];
    
    // Encontrar a posição inicial da seção selecionada
    let startNumber = 1;
    
    for (const field of knowledgeFields) {
      const hasField = concurso[field.has as keyof Concurso] as boolean;
      const questionsCount = concurso[field.questions as keyof Concurso] as number || 0;
      
      if (field.key === selectedSection) {
        // Encontramos a seção selecionada
        if (hasField && questionsCount > 0) {
          return Array.from({ length: questionsCount }, (_, i) => startNumber + i);
        }
        return [];
      }
      
      // Incrementar o número inicial para a próxima seção
      if (hasField && questionsCount > 0) {
        startNumber += questionsCount;
      }
    }
    
    return [];
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleNullifyQuestion = (questionNumber: number) => {
    setNullifiedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionNumber)) {
        newSet.delete(questionNumber);
      } else {
        newSet.add(questionNumber);
      }
      return newSet;
    });
  };

  const createAnswerMatrix = () => {
    const questions = getQuestionsRange();
    if (questions.length === 0) return [];
    
    const QUESTIONS_PER_ROW = 4;
    const rows = Math.ceil(questions.length / QUESTIONS_PER_ROW);
    
    const matrix = [];
    
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < QUESTIONS_PER_ROW; col++) {
        const index = row * QUESTIONS_PER_ROW + col;
        if (index < questions.length) {
          rowData.push(questions[index]);
        } else {
          rowData.push(null);
        }
      }
      matrix.push(rowData);
    }
    
    return matrix;
  };

  const performRecalculation = async () => {
    try {
      setIsRecalculating(true);
      
      toast({
        title: "Recalculando pontuações",
        description: "Iniciando recálculo para todos os usuários. Isso pode levar algum tempo.",
      });
      
      const recalculationResult = await recalculateAllUserScores(concursoId);
      console.log('Recalculation result:', recalculationResult);

      if (recalculationResult.success) {
        setRecalculationSuccess(true);
        const updatedCount = recalculationResult.updatedCount || 0;
        
        toast({
          title: "Recálculo completado",
          description: `As notas de ${updatedCount} usuários foram atualizadas.`,
        });
        
        setTimeout(() => {
          setRecalculationSuccess(false);
        }, 5000);
      } else {
        toast({
          title: "Erro no recálculo",
          description: recalculationResult.error || "Ocorreu um erro ao recalcular as notas dos usuários.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error during recalculation:', error);
      toast({
        title: "Erro no recálculo",
        description: error.message || "Ocorreu um erro durante o recálculo das pontuações.",
        variant: "destructive"
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSaveAnswerKey = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);
      
      // Verificar todas as questões em todas as seções, não apenas a aba atual
      const allQuestions = getAllQuestionsFromAllSections();
      const unansweredQuestions = allQuestions.filter(q => !answers[q]);
      
      if (unansweredQuestions.length > 0) {
        setError(`Todas as questões devem ser respondidas. Faltam as questões: ${unansweredQuestions.join(', ')}`);
        toast({
          title: "Erro ao salvar gabarito",
          description: "Todas as questões devem ser respondidas antes de salvar o gabarito.",
          variant: "destructive"
        });
        return;
      }
      
      // Preparar dados para salvar o gabarito completo de uma vez
      const answerKeyData = allQuestions.map(qNum => {
        // Determinar o tipo de seção para cada questão
        let sectionType = '';
        let questionIndex = qNum;
        
        // Mapear todos os campos de conhecimento
        const knowledgeFields = [
          { key: 'basic', has: 'has_basic_knowledge', questions: 'basic_knowledge_questions', type: 'basic' },
          { key: 'specific1', has: 'has_specific_knowledge_1', questions: 'specific_knowledge_1_questions', type: 'specific1' },
          { key: 'specific2', has: 'has_specific_knowledge_2', questions: 'specific_knowledge_2_questions', type: 'specific2' },
          { key: 'specific3', has: 'has_specific_knowledge_3', questions: 'specific_knowledge_3_questions', type: 'specific3' },
          
          // Novas áreas de conhecimento
          { key: 'lpt', has: 'has_lpt', questions: 'lpt_questions', type: 'lpt' },
          { key: 'ing', has: 'has_ing', questions: 'ing_questions', type: 'ing' },
          { key: 'mat', has: 'has_mat', questions: 'mat_questions', type: 'mat' },
          { key: 'rlm', has: 'has_rlm', questions: 'rlm_questions', type: 'rlm' },
          { key: 'est', has: 'has_est', questions: 'est_questions', type: 'est' },
          { key: 'cos', has: 'has_cos', questions: 'cos_questions', type: 'cos' },
          { key: 'adm', has: 'has_adm', questions: 'adm_questions', type: 'adm' },
          { key: 'ado', has: 'has_ado', questions: 'ado_questions', type: 'ado' },
          { key: 'cot', has: 'has_cot', questions: 'cot_questions', type: 'cot' },
          { key: 'coc', has: 'has_coc', questions: 'coc_questions', type: 'coc' },
          { key: 'eco', has: 'has_eco', questions: 'eco_questions', type: 'eco' },
          { key: 'tri', has: 'has_tri', questions: 'tri_questions', type: 'tri' },
          { key: 'afo', has: 'has_afo', questions: 'afo_questions', type: 'afo' },
          { key: 'ltc', has: 'has_ltc', questions: 'ltc_questions', type: 'ltc' },
          { key: 'tic', has: 'has_tic', questions: 'tic_questions', type: 'tic' },
          { key: 'ett', has: 'has_ett', questions: 'ett_questions', type: 'ett' },
          { key: 'aud', has: 'has_aud', questions: 'aud_questions', type: 'aud' },
          { key: 'civ', has: 'has_civ', questions: 'civ_questions', type: 'civ' },
          { key: 'pen', has: 'has_pen', questions: 'pen_questions', type: 'pen' },
          { key: 'inf', has: 'has_inf', questions: 'inf_questions', type: 'inf' },
          { key: 'emp', has: 'has_emp', questions: 'emp_questions', type: 'emp' },
          { key: 'mtf', has: 'has_mtf', questions: 'mtf_questions', type: 'mtf' },
          { key: 'out', has: 'has_out', questions: 'out_questions', type: 'out' }
        ];
        
        let currentIndex = 1;
        for (const field of knowledgeFields) {
          const hasField = concurso[field.has as keyof Concurso] as boolean;
          const questionsCount = concurso[field.questions as keyof Concurso] as number || 0;
          
          if (hasField && questionsCount > 0) {
            if (qNum >= currentIndex && qNum < currentIndex + questionsCount) {
              sectionType = field.type;
              break;
            }
            currentIndex += questionsCount;
          }
        }

        return {
          concurso_id: concursoId,
          question_number: qNum,
          correct_answer: answers[qNum],
          weight: 1.0,
          section_type: sectionType,
          is_nullified: nullifiedQuestions.has(qNum)
        };
      });

      // Usar o método que evita recrear toda a tabela
      const saveResult = await answerKeyService.saveAnswerKeyAndRecalculate(concursoId, answerKeyData);

      if (saveResult.success) {
        setSavedSuccess(true);
        toast({
          title: "Gabarito salvo com sucesso",
          description: `O gabarito oficial foi atualizado. ${saveResult.updatedCount || 0} pontuações foram recalculadas.`,
        });
        
        setTimeout(() => {
          setSavedSuccess(false);
        }, 3000);
      } else {
        throw new Error("Erro ao salvar gabarito");
      }
    } catch (error: any) {
      console.error('Error saving answer key:', error);
      setError(error.message || "Ocorreu um erro ao salvar o gabarito oficial.");
      
      toast({
        title: "Erro ao salvar gabarito",
        description: error.message || "Ocorreu um erro ao salvar o gabarito oficial. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getOptionsForQuestion = () => {
    if (concurso.exam_type === 'Certo ou Errado') {
      return ['C', 'E'];
    }
    
    const count = concurso.alternatives_count || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  };

  const getObjectiveSectionList = () => {
    const sections = [];
    
    // Mapeamento de chave para rótulo legível
    const sectionLabels: Record<string, string> = {
      'basic': 'Conhecimentos Básicos',
      'specific1': 'C. Específicos 1',
      'specific2': 'C. Específicos 2',
      'specific3': 'C. Específicos 3',
      'lpt': 'Português',
      'ing': 'Inglês',
      'mat': 'Matemática',
      'rlm': 'RLM',
      'est': 'Estatística',
      'cos': 'Constitucional',
      'adm': 'Administrativo',
      'ado': 'Administração',
      'cot': 'Contabilidade',
      'coc': 'Cont. Custos',
      'eco': 'Economia',
      'tri': 'Tributário',
      'afo': 'AFO',
      'ltc': 'Leg. Tributária',
      'tic': 'TI',
      'ett': 'Estatuto',
      'aud': 'Auditoria',
      'civ': 'Civil',
      'pen': 'Penal',
      'inf': 'Informática',
      'emp': 'Empresarial',
      'mtf': 'Mat. Financeira',
      'out': 'Outro'
    };
    
    // Mapear todas as seções habilitadas
    const knowledgeFields = [
      { key: 'basic', has: 'has_basic_knowledge' },
      { key: 'specific1', has: 'has_specific_knowledge_1' },
      { key: 'specific2', has: 'has_specific_knowledge_2' },
      { key: 'specific3', has: 'has_specific_knowledge_3' },
      
      // Novas áreas de conhecimento
      { key: 'lpt', has: 'has_lpt' },
      { key: 'ing', has: 'has_ing' },
      { key: 'mat', has: 'has_mat' },
      { key: 'rlm', has: 'has_rlm' },
      { key: 'est', has: 'has_est' },
      { key: 'cos', has: 'has_cos' },
      { key: 'adm', has: 'has_adm' },
      { key: 'ado', has: 'has_ado' },
      { key: 'cot', has: 'has_cot' },
      { key: 'coc', has: 'has_coc' },
      { key: 'eco', has: 'has_eco' },
      { key: 'tri', has: 'has_tri' },
      { key: 'afo', has: 'has_afo' },
      { key: 'ltc', has: 'has_ltc' },
      { key: 'tic', has: 'has_tic' },
      { key: 'ett', has: 'has_ett' },
      { key: 'aud', has: 'has_aud' },
      { key: 'civ', has: 'has_civ' },
      { key: 'pen', has: 'has_pen' },
      { key: 'inf', has: 'has_inf' },
      { key: 'emp', has: 'has_emp' },
      { key: 'mtf', has: 'has_mtf' },
      { key: 'out', has: 'has_out' }
    ];
    
    knowledgeFields.forEach(field => {
      const hasField = concurso[field.has as keyof Concurso] as boolean;
      if (hasField) {
        sections.push({ 
          key: field.key, 
          label: field.key === 'out' && concurso.out_name ? 
            `${sectionLabels[field.key]} (${concurso.out_name})` : 
            sectionLabels[field.key] 
        });
      }
    });
    
    return sections;
  };

  const objectiveSections = getObjectiveSectionList();
  
  // Contar o total de questões que ainda não foram respondidas
  const totalQuestions = getAllQuestionsFromAllSections().length;
  const answeredQuestions = Object.keys(answers).length;
  const percentageComplete = totalQuestions > 0 ? Math.floor((answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gabarito Oficial - {concurso?.titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        
        {savedSuccess && (
          <div className="bg-green-100 p-3 rounded-md flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <p>Gabarito salvo com sucesso!</p>
          </div>
        )}
        
        {recalculationSuccess && (
          <div className="bg-blue-100 p-3 rounded-md flex items-center gap-2 text-blue-800">
            <CheckCircle className="h-4 w-4" />
            <p>Recálculo de pontuações concluído com sucesso!</p>
          </div>
        )}
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Questões Anuladas</h4>
              <p className="text-sm text-amber-700 mt-1">
                Este concurso possui {nullifiedQuestions.size} {nullifiedQuestions.size === 1 ? 'questão anulada' : 'questões anuladas'}.
                {nullifiedQuestions.size > 0 && (
                  <span className="block mt-1">
                    Questões anuladas: {Array.from(nullifiedQuestions).sort((a, b) => a - b).join(', ')}
                  </span>
                )}
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Ao anular questões, as pontuações de todos os usuários serão recalculadas automaticamente após salvar.
              </p>
            </div>
          </div>
        </div>
        
        {/* Barra de progresso de preenchimento do gabarito */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex flex-col">
            <h4 className="font-medium text-blue-800">Progresso do preenchimento</h4>
            <p className="text-sm text-blue-700 mt-1">
              {answeredQuestions} de {totalQuestions} questões respondidas ({percentageComplete}%)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{width: `${percentageComplete}%`}}
              ></div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Todas as questões precisam ser respondidas antes de salvar o gabarito.
            </p>
          </div>
        </div>
        
        {objectiveSections.length > 0 && (
          <div className="border rounded-md overflow-hidden shadow-sm">
            <Tabs 
              value={selectedSection} 
              onValueChange={(value) => setSelectedSection(value)}
              className="w-full"
            >
              <div className="overflow-x-auto">
                <TabsList className="flex w-max min-w-full">
                  {objectiveSections.map(section => (
                    <TabsTrigger key={section.key} value={section.key}>
                      {section.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {objectiveSections.map(section => (
                <TabsContent key={section.key} value={section.key}>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {createAnswerMatrix().map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          {row.map((questionNumber, colIndex) => (
                            questionNumber !== null && (
                              <div key={`${rowIndex}-${colIndex}`} className="border rounded-md p-3 bg-white">
                                <div className="mb-2 font-medium text-gray-700">Questão {questionNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                  {getOptionsForQuestion().map((option) => (
                                    <button
                                      key={option}
                                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors
                                        ${answers[questionNumber] === option 
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                      onClick={() => handleAnswerChange(questionNumber, option)}
                                      disabled={nullifiedQuestions.has(questionNumber)}
                                      type="button"
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                                <NullifyQuestionButton
                                  questionNumber={questionNumber}
                                  isNullified={nullifiedQuestions.has(questionNumber)}
                                  onNullify={handleNullifyQuestion}
                                />
                              </div>
                            )
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
        
        <div className="flex justify-between mt-4">
          <Button 
            onClick={performRecalculation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSaving || isRecalculating}
          >
            {isRecalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recalculando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Recalcular Pontuações
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSaveAnswerKey}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSaving || isRecalculating}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Gabarito
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
