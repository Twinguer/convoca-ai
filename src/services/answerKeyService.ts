
import { supabase } from "@/integrations/supabase/client";
import { recalculateAllUserScores } from "@/integrations/supabase/rankings/batchOperations";

interface UpdateAnswerParams {
  concursoId: string;
  questionNumber: number;
  answer: string;
  weight: number;
  sectionType?: string;
  isNullified: boolean;
}

export const answerKeyService = {
  // Buscar gabarito oficial com pesos
  async fetchOfficialAnswerWeights(concursoId: string) {
    const { data, error } = await supabase.rpc('get_official_answer_weights', {
      p_concurso_id: concursoId,
    });

    if (error) throw error;
    return data;
  },

  async updateAnswer(
    {
      concursoId,
      questionNumber,
      answer,
      weight,
      isNullified,
      sectionType
    }: UpdateAnswerParams
  ) {  
    console.log('[answerKeyService] Atualizando resposta:', {
      concursoId,
      questionNumber,
      answer,
      weight,
      isNullified,
      sectionType
    });
    
    // Usamos a versão atualizada da função com 6 parâmetros que usa correct_answer
    const { data, error } = await supabase.rpc("update_answer_with_weight", {
      p_concurso_id: concursoId,
      p_question_number: questionNumber,
      p_correct_answer: answer,
      p_weight: weight,
      p_is_nullified: isNullified,
      p_section_type: sectionType
    });

    if (error) throw error;
    
    // Forçar o recálculo para todos os usuários do concurso usando a função otimizada
    // Mantemos essa atualização automática aqui, pois é quando o gabarito oficial é atualizado
    try {
      console.log('[answerKeyService] Recalculando pontuações para todos os usuários...');
      const recalcResult = await recalculateAllUserScores(concursoId);
      
      if (recalcResult.success) {
        console.log('[answerKeyService] Recálculo bem-sucedido para todos os usuários:', recalcResult);
        return {
          success: true,
          data,
          updatedCount: recalcResult.updatedCount
        };
      } else {
        console.error('[answerKeyService] Erro ao recalcular pontuações:', recalcResult.error);
        throw new Error(recalcResult.error);
      }
    } catch (recalcError) {
      console.error('[answerKeyService] Erro ao recalcular todas as pontuações:', recalcError);
      throw recalcError;
    }
  },
  
  // Nova função para salvar o gabarito completo evitando conflitos de chave primária
  async saveAnswerKeyAndRecalculate(concursoId: string, answerKeyData: any[]) {
    try {
      console.log('[answerKeyService] Salvando gabarito completo para concurso:', concursoId);
      
      // Buscar informações do concurso para determinar os tipos de seção
      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select('*')
        .eq('id', concursoId)
        .single();
        
      if (concursoError) {
        console.error('[answerKeyService] Erro ao buscar dados do concurso:', concursoError);
      }
      
      // Em vez de deletar tudo e reinserir, vamos atualizar cada questão individualmente
      // para evitar o erro de duplicação
      for (const item of answerKeyData) {
        // Determinar o section_type para a questão se não estiver definido
        if (!item.section_type && concursoData) {
          item.section_type = getSectionTypeForQuestion(concursoData, item.question_number);
        }
        
        // Verificar se já existe esta questão para este concurso
        const { data: existingData, error: checkError } = await supabase
          .from('official_answer_weights')
          .select('id')
          .eq('concurso_id', concursoId)
          .eq('question_number', item.question_number)
          .maybeSingle();
        
        if (checkError) {
          console.error('[answerKeyService] Erro ao verificar existência da questão:', checkError);
        }
        
        // Se a questão já existe, atualize-a
        if (existingData) {
          const { error: updateError } = await supabase
            .from('official_answer_weights')
            .update({
              correct_answer: item.correct_answer,
              weight: item.weight,
              section_type: item.section_type,
              is_nullified: item.is_nullified,
              updated_at: new Date().toISOString()
            })
            .eq('concurso_id', concursoId)
            .eq('question_number', item.question_number);
            
          if (updateError) {
            console.error('[answerKeyService] Erro ao atualizar questão existente:', updateError);
            throw updateError;
          }
        }
        // Senão, insira uma nova questão
        else {
          const { error: insertError } = await supabase
            .from('official_answer_weights')
            .insert(item);
            
          if (insertError) {
            console.error('[answerKeyService] Erro ao inserir nova questão:', insertError);
            throw insertError;
          }
        }
      }
      
      // Recalcular pontuações
      // Mantemos essa atualização automática aqui, pois é quando o gabarito oficial é salvo/atualizado completamente
      console.log('[answerKeyService] Iniciando recálculo de pontuações...');
      const recalcResult = await recalculateAllUserScores(concursoId);
      
      if (!recalcResult.success) {
        console.error('[answerKeyService] Erro no recálculo:', recalcResult.error);
        throw new Error(recalcResult.error);
      }
      
      console.log('[answerKeyService] Recálculo concluído com sucesso:', recalcResult);
      return {
        success: true,
        updatedCount: recalcResult.updatedCount
      };
      
    } catch (error) {
      console.error('[answerKeyService] Erro ao salvar gabarito e recalcular pontuações:', error);
      throw error;
    }
  }
};

import { getSectionTypeForQuestion } from '@/integrations/supabase/rankings/examStructure';
