
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

export const useBookletAnswerKey = (concursoId: string) => {
  const [selectedBookletId, setSelectedBookletId] = useState<string>('');

  // Buscar cadernos disponíveis
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
    retryDelay: 1000,
    staleTime: 30000
  });

  // Selecionar automaticamente o primeiro caderno disponível
  useEffect(() => {
    if (booklets && booklets.length > 0 && !selectedBookletId) {
      console.log('Selecionando primeiro caderno automaticamente:', booklets[0].id);
      setSelectedBookletId(booklets[0].id);
    }
  }, [booklets, selectedBookletId]);

  // Verificar completude de todos os cadernos
  const { data: completionStatus } = useQuery({
    queryKey: ['booklets-completion', concursoId, booklets?.length],
    queryFn: async () => {
      if (!booklets || booklets.length === 0) {
        console.log('Nenhum caderno disponível para verificar completude');
        return { allComplete: true, details: [] };
      }

      console.log('Verificando completude dos cadernos...');
      const completionDetails = [];
      let allComplete = true;

      // Primeiro, buscar o total de questões esperadas do concurso
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
          has_specific_knowledge_3,
          has_custom_knowledge,
          disciplines
        `)
        .eq('id', concursoId)
        .single();

      let expectedQuestions = 0;
      
      if (concurso?.has_custom_knowledge && concurso.disciplines) {
        // Calcular questões para conhecimentos customizados
        const disciplines = Array.isArray(concurso.disciplines) ? concurso.disciplines : [];
        
        // Verificar se é estrutura hierárquica (blocos -> disciplinas)
        const isHierarchical = disciplines.length > 0 && 
                              disciplines[0] && 
                              typeof disciplines[0] === 'object' && 
                              'disciplines' in disciplines[0];
        
        if (isHierarchical) {
          // Estrutura hierárquica: blocos contendo disciplinas
          disciplines.forEach((block: any) => {
            if (block.disciplines && Array.isArray(block.disciplines)) {
              block.disciplines.forEach((discipline: any) => {
                if (discipline.isEnabled) {
                  expectedQuestions += parseInt(discipline.questionCount) || 0;
                }
              });
            }
          });
        } else {
          // Estrutura plana: disciplinas diretas
          disciplines.forEach((discipline: any) => {
            if (discipline.isEnabled) {
              expectedQuestions += parseInt(discipline.questionCount) || 0;
            }
          });
        }
      } else {
        // Calcular questões para estrutura tradicional
        expectedQuestions = 
          (concurso?.has_basic_knowledge ? (concurso?.basic_knowledge_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_1 ? (concurso?.specific_knowledge_1_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_2 ? (concurso?.specific_knowledge_2_questions || 0) : 0) +
          (concurso?.has_specific_knowledge_3 ? (concurso?.specific_knowledge_3_questions || 0) : 0);
      }

      console.log('Total de questões esperadas:', expectedQuestions);

      for (const booklet of booklets) {
        try {
          const { data: bookletAnswers } = await supabase
            .from('official_answer_weights')
            .select('id')
            .eq('concurso_id', concursoId)
            .eq('booklet_id', booklet.id);

          const answerCount = bookletAnswers?.length || 0;
          const isComplete = answerCount >= expectedQuestions;
          
          if (!isComplete) allComplete = false;

          completionDetails.push({
            bookletId: booklet.id,
            bookletName: booklet.name,
            completed: answerCount,
            total: expectedQuestions,
            isComplete
          });

          console.log(`Caderno ${booklet.name}: ${answerCount}/${expectedQuestions} questões (${isComplete ? 'completo' : 'incompleto'})`);
        } catch (error) {
          console.error(`Erro ao verificar completude do caderno ${booklet.id}:`, error);
          allComplete = false;
          completionDetails.push({
            bookletId: booklet.id,
            bookletName: booklet.name,
            completed: 0,
            total: expectedQuestions,
            isComplete: false
          });
        }
      }

      console.log('Status de completude:', { allComplete, details: completionDetails });
      return { allComplete, details: completionDetails };
    },
    enabled: !!booklets && booklets.length > 0 && !!concursoId,
    refetchInterval: 10000,
    staleTime: 5000
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
