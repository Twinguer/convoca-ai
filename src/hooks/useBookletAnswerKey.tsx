
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface AnswerWeight {
  resposta: string;
  peso: number;
  secao: 'basic' | 'specific1' | 'specific2' | 'specific3';
  anulada: boolean;
}

interface OfficialAnswerWeights {
  [key: string]: AnswerWeight;
}

export const useBookletAnswerKey = (concursoId: string) => {
  const queryClient = useQueryClient();
  const [selectedBookletId, setSelectedBookletId] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [nullifiedQuestions, setNullifiedQuestions] = useState<number[]>([]);

  // Buscar cadernos disponíveis
  const { data: booklets, isLoading: isLoadingBooklets } = useQuery({
    queryKey: ['exam-booklets', concursoId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('manage_exam_booklets', {
        p_operation: 'GET',
        p_concurso_id: concursoId
      });

      if (error) throw error;
      return data?.booklets || [];
    },
    enabled: !!concursoId
  });

  // Selecionar automaticamente o primeiro caderno
  useEffect(() => {
    if (booklets && booklets.length > 0 && !selectedBookletId) {
      setSelectedBookletId(booklets[0].id);
    }
  }, [booklets, selectedBookletId]);

  // Buscar gabarito do caderno selecionado
  const { data: officialAnswers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['official-answers-booklet', concursoId, selectedBookletId],
    queryFn: async () => {
      if (!selectedBookletId) return {};

      const { data, error } = await supabase.rpc('get_official_answer_weights_by_booklet', {
        p_concurso_id: concursoId,
        p_booklet_id: selectedBookletId
      });

      if (error) throw error;
      return data as OfficialAnswerWeights;
    },
    enabled: !!concursoId && !!selectedBookletId
  });

  // Atualizar estado local quando carregar gabarito
  useEffect(() => {
    if (officialAnswers && Object.keys(officialAnswers).length > 0) {
      const answerMap: Record<number, string> = {};
      const nullified: number[] = [];
      
      Object.entries(officialAnswers).forEach(([key, value]) => {
        const questionNumber = parseInt(key.replace('questao', ''));
        answerMap[questionNumber] = value.resposta;
        if (value.anulada) {
          nullified.push(questionNumber);
        }
      });
      
      setAnswers(answerMap);
      setNullifiedQuestions(nullified);
    } else {
      setAnswers({});
      setNullifiedQuestions([]);
    }
  }, [officialAnswers]);

  // Limpar dados ao trocar de caderno
  useEffect(() => {
    setAnswers({});
    setNullifiedQuestions([]);
  }, [selectedBookletId]);

  // Mutação para salvar gabarito do caderno específico
  const saveAnswerKeyMutation = useMutation({
    mutationFn: async ({ 
      questionNumber, 
      answer, 
      weight = 1.0,
      isNullified = false,
      sectionType 
    }: { 
      questionNumber: number; 
      answer: string; 
      weight?: number;
      isNullified?: boolean;
      sectionType?: string;
    }) => {
      if (!selectedBookletId) {
        throw new Error('Caderno deve ser selecionado');
      }

      const { data, error } = await supabase.rpc('update_answer_with_weight', {
        p_concurso_id: concursoId,
        p_question_number: questionNumber,
        p_correct_answer: answer,
        p_weight: weight,
        p_is_nullified: isNullified,
        p_section_type: sectionType,
        p_booklet_id: selectedBookletId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['official-answers-booklet', concursoId, selectedBookletId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['booklets-completion', concursoId] 
      });
      toast.success('Resposta salva com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao salvar resposta:', error);
      toast.error('Erro ao salvar resposta');
    }
  });

  // Verificar completude de todos os cadernos
  const { data: completionStatus } = useQuery({
    queryKey: ['booklets-completion', concursoId],
    queryFn: async () => {
      if (!booklets || booklets.length === 0) return { allComplete: true, details: [] };

      const completionDetails = [];
      let allComplete = true;

      for (const booklet of booklets) {
        const { data: bookletAnswers } = await supabase.rpc('get_official_answer_weights_by_booklet', {
          p_concurso_id: concursoId,
          p_booklet_id: booklet.id
        });

        const answerCount = Object.keys(bookletAnswers || {}).length;
        
        // Buscar total de questões esperadas do concurso
        const { data: concurso } = await supabase
          .from('concursos')
          .select(`
            basic_knowledge_questions,
            specific_knowledge_1_questions,
            specific_knowledge_2_questions,
            specific_knowledge_3_questions,
            has_basic_knowledge,
            has_specific_knowledge_1,
            has_specific_knowledge_2,
            has_specific_knowledge_3
          `)
          .eq('id', concursoId)
          .single();

        const expectedQuestions = 
          (concurso?.has_basic_knowledge ? (concurso?.basic_knowledge_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_1 ? (concurso?.specific_knowledge_1_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_2 ? (concurso?.specific_knowledge_2_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_3 ? (concurso?.specific_knowledge_3_questions || 0) : 0);

        const isComplete = answerCount >= expectedQuestions;
        if (!isComplete) allComplete = false;

        completionDetails.push({
          bookletId: booklet.id,
          bookletName: booklet.name,
          completed: answerCount,
          total: expectedQuestions,
          isComplete
        });
      }

      return { allComplete, details: completionDetails };
    },
    enabled: !!booklets && booklets.length > 0,
    refetchInterval: 5000 // Refetch mais frequente para mostrar progresso
  });

  const updateAnswer = (
    questionNumber: number, 
    answer: string, 
    weight: number = 1.0,
    isNullified: boolean = false,
    sectionType?: string
  ) => {
    return saveAnswerKeyMutation.mutate({ 
      questionNumber, 
      answer, 
      weight,
      isNullified,
      sectionType 
    });
  };

  const handleBookletChange = (bookletId: string) => {
    setSelectedBookletId(bookletId);
  };

  return {
    booklets: booklets || [],
    selectedBookletId,
    setSelectedBookletId: handleBookletChange,
    answers,
    setAnswers,
    nullifiedQuestions,
    setNullifiedQuestions,
    updateAnswer,
    isLoading: isLoadingBooklets || isLoadingAnswers,
    isSaving: saveAnswerKeyMutation.isPending,
    completionStatus
  };
};
