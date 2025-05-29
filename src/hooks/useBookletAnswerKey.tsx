
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

  // Buscar cadernos disponíveis usando a tabela diretamente
  const { data: booklets, isLoading: isLoadingBooklets } = useQuery({
    queryKey: ['exam-booklets', concursoId],
    queryFn: async () => {
      console.log('Buscando cadernos para concurso:', concursoId);
      
      const { data, error } = await supabase
        .from('exam_booklets')
        .select('*')
        .eq('concurso_id', concursoId)
        .order('display_order');

      if (error) {
        console.error('Erro ao buscar cadernos:', error);
        throw error;
      }
      
      console.log('Cadernos encontrados:', data || []);
      return data || [];
    },
    enabled: !!concursoId,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: 1000
  });

  // Selecionar automaticamente o primeiro caderno disponível
  useEffect(() => {
    if (booklets && booklets.length > 0 && !selectedBookletId) {
      console.log('Selecionando primeiro caderno automaticamente:', booklets[0].id);
      setSelectedBookletId(booklets[0].id);
    }
    // Se o caderno selecionado não existe mais na lista, selecionar o primeiro
    if (booklets && booklets.length > 0 && selectedBookletId) {
      const exists = booklets.find((b: ExamBooklet) => b.id === selectedBookletId);
      if (!exists) {
        console.log('Caderno selecionado não existe mais, selecionando primeiro:', booklets[0].id);
        setSelectedBookletId(booklets[0].id);
      }
    }
  }, [booklets, selectedBookletId]);

  // Verificar completude de todos os cadernos
  const { data: completionStatus } = useQuery({
    queryKey: ['booklets-completion', concursoId],
    queryFn: async () => {
      if (!booklets || booklets.length === 0) {
        console.log('Nenhum caderno disponível para verificar completude');
        return { allComplete: true, details: [] };
      }

      console.log('Verificando completude dos cadernos...');
      const completionDetails = [];
      let allComplete = true;

      for (const booklet of booklets) {
        try {
          const { data: bookletAnswers } = await supabase
            .from('official_answer_weights')
            .select('id')
            .eq('concurso_id', concursoId)
            .eq('booklet_id', booklet.id);

          const answerCount = bookletAnswers?.length || 0;
          
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
        } catch (error) {
          console.error(`Erro ao verificar completude do caderno ${booklet.id}:`, error);
          // Se houver erro, considera como não completo
          allComplete = false;
          completionDetails.push({
            bookletId: booklet.id,
            bookletName: booklet.name,
            completed: 0,
            total: 0,
            isComplete: false
          });
        }
      }

      console.log('Status de completude:', { allComplete, details: completionDetails });
      return { allComplete, details: completionDetails };
    },
    enabled: !!booklets && booklets.length > 0,
    refetchInterval: 10000 // Refetch mais frequente para mostrar progresso
  });

  const handleBookletChange = (bookletId: string) => {
    console.log('Mudando caderno selecionado para:', bookletId);
    setSelectedBookletId(bookletId);
  };

  return {
    booklets: booklets || [],
    selectedBookletId,
    setSelectedBookletId: handleBookletChange,
    isLoading: isLoadingBooklets,
    completionStatus
  };
};
