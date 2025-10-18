
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { UseSaveAnswersProps, SaveAnswersResponse } from './types';
import { validateSaveAnswers } from './validation';
import { prepareAnswersData } from './prepareData';
import { rankingCache } from '@/services/rankingCache';

export const useSaveAnswers = ({
  rankingId,
  concurso,
  answers,
  setIsSaving,
  setError,
  setSavedSuccess,
  onSuccess,
  discursiveScore,
  caseStudy1Score,
  caseStudy2Score,
  caseStudy3Score,
  subjectScores,
  editCount,
  nullifiedQuestions = new Set(),
  selectedBookletId
}: UseSaveAnswersProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSaveAnswers = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSavedSuccess(false);

      // Validar dados de entrada
      const validation = validateSaveAnswers(editCount, selectedBookletId);
      if (!validation.isValid) {
        setError(validation.errorMessage!);
        return;
      }

      console.log('[useSaveAnswers] Preparando dados para salvamento');
      console.log('[useSaveAnswers] Respostas do usuário:', answers);
      console.log('[useSaveAnswers] Caderno selecionado:', selectedBookletId);
      
      // Debug dos valores subjetivos recebidos
      console.log('[useSaveAnswers] Valores subjetivos recebidos:', {
        discursiveScore,
        caseStudy1Score,
        caseStudy2Score,
        caseStudy3Score,
        subjectScores,
        otherSubjectiveScore: subjectScores?.other_subjective || 0
      });
      console.log('[useSaveAnswers] DEBUG - selectedBookletId detalhado:', {
        value: selectedBookletId,
        type: typeof selectedBookletId,
        length: selectedBookletId?.length,
        trimmed: selectedBookletId?.trim(),
        isEmpty: selectedBookletId?.trim() === '',
        isUndefined: selectedBookletId === undefined
      });
      console.log('[useSaveAnswers] Todos os parâmetros recebidos:', {
        rankingId,
        concursoId: concurso?.id,
        selectedBookletId,
        answersCount: Object.keys(answers).length,
        editCount
      });

      // Garantir que sempre temos um bookletId válido
      let bookletIdString = 'default';
      
      // Buscar dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Buscar dados consolidados usando user_id
      const { data: currentRanking } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      // Extrair selected_booklet_id da estrutura consolidada
      const consolidatedData = currentRanking?.consolidated_data;
      const rankingData = consolidatedData?.rankings?.[rankingId];
      const bookletFromData = rankingData?.selected_booklet_id;
      
      if (bookletFromData) {
        bookletIdString = String(bookletFromData);
      } else if (selectedBookletId && selectedBookletId.trim() !== '') {
        bookletIdString = String(selectedBookletId);
      } else {
        // Se não temos bookletId, tentar buscar o primeiro caderno disponível
        try {
          const { data: concursoData } = await supabase
            .from('concursos')
            .select('exam_booklets')
            .eq('id', concurso.id)
            .maybeSingle();
          
          if (concursoData?.exam_booklets && concursoData.exam_booklets.length > 0) {
            bookletIdString = concursoData.exam_booklets[0].id;
            console.log('[useSaveAnswers] Usando primeiro caderno do concurso:', bookletIdString);
          } else {
            console.log('[useSaveAnswers] Nenhum caderno encontrado no concurso, usando padrão');
          }
        } catch (error) {
          console.error('[useSaveAnswers] Erro ao buscar cadernos:', error);
        }
      }

      // Preparar dados das respostas
      const preparedData = prepareAnswersData(answers, concurso, nullifiedQuestions, subjectScores, bookletIdString);

      console.log('[useSaveAnswers] Dados formatados para RPC:', preparedData);
      console.log('[useSaveAnswers] Total de respostas a salvar:', Object.keys(preparedData.answers).length);

      // Salvar diretamente no consolidated_data sem usar RPC
      console.log('[useSaveAnswers] Salvando diretamente no consolidated_data:', {
        rankingId,
        concursoId: concurso.id,
        bookletId: bookletIdString,
        answers: preparedData.answers,
        subjectScores: preparedData.subjectScores,
        editCount
      });
      
      // Buscar dados atuais do usuário
      const { data: currentUserRanking, error: fetchError } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('[useSaveAnswers] Erro ao buscar dados do usuário:', fetchError);
        throw new Error('Erro ao buscar dados do usuário');
      }

      if (!currentUserRanking?.consolidated_data) {
        throw new Error('Dados de ranking do usuário não encontrados');
      }

      // Atualizar consolidated_data
      const updatedConsolidatedData = { ...currentUserRanking.consolidated_data };
      
      if (updatedConsolidatedData.rankings && updatedConsolidatedData.rankings[rankingId]) {
        // Atualizar ranking existente - SALVAR answers E pontuações subjetivas
        const updatedRankingData = {
          ...updatedConsolidatedData.rankings[rankingId],
          user_data: {
            ...updatedConsolidatedData.rankings[rankingId].user_data,
            answers: preparedData.answers,
            all_questions_answered: (() => {
              // Contar total de respostas na estrutura {bookletId: {disciplineType: {questionNumber: answer}}}
              let totalAnswers = 0;
              Object.values(preparedData.answers).forEach(bookletAnswers => {
                Object.values(bookletAnswers).forEach(disciplineAnswers => {
                  totalAnswers += Object.keys(disciplineAnswers).length;
                });
              });
              return totalAnswers > 0;
            })(),
            // SALVAR pontuações subjetivas (sempre preservar valores existentes quando não forem editados)
            subjectives: (() => {
              // Buscar valores existentes para preservá-los se não forem alterados
              const existingSubjectives = updatedConsolidatedData.rankings[rankingId].user_data?.subjectives || {};
              
              const subjectiveValues = {
                discursive: discursiveScore ?? existingSubjectives.discursive ?? 0,
                case_study_1: caseStudy1Score ?? existingSubjectives.case_study_1 ?? 0,
                case_study_2: caseStudy2Score ?? existingSubjectives.case_study_2 ?? 0,
                case_study_3: caseStudy3Score ?? existingSubjectives.case_study_3 ?? 0,
                other_subjective: subjectScores?.other_subjective ?? existingSubjectives.other_subjective ?? 0
              };
              
              console.log('[useSaveAnswers] 💾 Salvando subjectives:', {
                valores_recebidos: {
                  discursiveScore,
                  caseStudy1Score,
                  caseStudy2Score,
                  caseStudy3Score,
                  'subjectScores?.other_subjective': subjectScores?.other_subjective
                },
                valores_existentes: existingSubjectives,
                valores_finais: subjectiveValues
              });
              
              return subjectiveValues;
            })(),
            // Preservar reservation_type dentro de user_data
            reservation_type: updatedConsolidatedData.rankings[rankingId].user_data?.reservation_type || 'Ampla Concorrência'
            // score, object_scores, subject_scores_tot serão atualizados pelo recalculateUserScore
          },
          selected_booklet_id: bookletIdString,
          edit_count: editCount + 1,
          control_metadata: {
            ...updatedConsolidatedData.rankings[rankingId].control_metadata,
            last_updated: new Date().toISOString()
          }
        };

        updatedConsolidatedData.rankings[rankingId] = updatedRankingData;
      } else {
        throw new Error('Ranking não encontrado nos dados consolidados');
      }

      // Salvar no banco
      const { error: updateError } = await supabase
        .from('user_rankings')
        .update({
          consolidated_data: updatedConsolidatedData
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[useSaveAnswers] Erro ao atualizar dados:', updateError);
        throw new Error('Erro ao salvar respostas');
      }

      console.log('[useSaveAnswers] Dados salvos com sucesso no consolidated_data');
      
      // 🔥 ADICIONAR: Recálculo de pontuações
      console.log('[useSaveAnswers] 🔄 Iniciando recálculo de pontuações...');

      try {
        const { recalculateUserScore } = await import('@/integrations/supabase/rankings/rankingMutations');
        
        console.log('[useSaveAnswers] 🔄 Chamando recalculateUserScore com:', {
          userId: user.id,
          concursoId: concurso.id
        });
        
        const recalculationResult = await recalculateUserScore(user.id, concurso.id);
        
        console.log('[useSaveAnswers] 📊 Resultado do recálculo:', recalculationResult);
        
        if (recalculationResult.success) {
          console.log('[useSaveAnswers] ✅ Pontuações recalculadas com sucesso');
        } else {
          console.error('[useSaveAnswers] ❌ Erro no recálculo de pontuações:', recalculationResult.message);
        }
      } catch (recalculationError) {
        console.error('[useSaveAnswers] ❌ Erro ao chamar recálculo de pontuações:', recalculationError);
      }
      
      console.log('[useSaveAnswers] Salvamento bem-sucedido, aguardando recálculo de pontuações...');

      console.log('[useSaveAnswers] Respostas salvas com sucesso:', Object.keys(preparedData.answers).length);
      console.log('[useSaveAnswers] Total de respostas salvas:', Object.keys(preparedData.answers).length);

      // Limpar cache local para forçar busca de dados frescos
      console.log('[useSaveAnswers] 🗑️ Limpando cache local...');
      rankingCache.clear();
      
      // Invalidar queries para refresh automático
      console.log('[useSaveAnswers] 🔄 Invalidando queries para refresh automático...');
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['rankings-v2', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count-v2', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['user-participation-v2', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['concurso', concurso.id] });
      queryClient.invalidateQueries({ queryKey: ['user-answers', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['answer-stats', rankingId] });
      queryClient.invalidateQueries({ queryKey: ['user-ranking-detail', rankingId] });
      // Invalidar todas as queries de rankings para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      console.log('[useSaveAnswers] ✅ Cache limpo e queries invalidadas, dados serão atualizados automaticamente');

      setSavedSuccess(true);
      toast({
        title: "Respostas salvas com sucesso",
        description: `${Object.keys(preparedData.answers).length} respostas foram salvas para o caderno selecionado.`,
        duration: 5000
      });

      onSuccess();

      // Após salvar, buscar o selected_booklet atualizado do banco
      const { data: updatedRanking } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      const refreshedConsolidatedData = updatedRanking?.consolidated_data;
      const updatedRankingData = refreshedConsolidatedData?.rankings?.[rankingId];
      const updatedBooklet = updatedRankingData?.selected_booklet_id;

      if (updatedBooklet) {
        // console.log('[useSaveAnswers] Estado do caderno atualizado após salvamento:', updatedBooklet);
        // Nota: setSelectedBookletId será chamado pelo componente pai se necessário
      }

    } catch (error: any) {
      console.error('[useSaveAnswers] Erro ao salvar respostas:', error);
      setError(error.message || "Erro ao salvar respostas");
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return { handleSaveAnswers };
};

export * from './types';
