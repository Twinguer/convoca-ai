import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationResult {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

export const useVerifyAnswerFlow = (concursoId: string, rankingId: string) => {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  const addResult = (result: VerificationResult) => {
    setVerificationResults(prev => [...prev, result]);
  };

  const verifyFlow = async () => {
    setIsVerifying(true);
    setVerificationResults([]);

    try {
      // 1. Verificar estrutura da tabela user_answers
      addResult({ step: 'Verificando estrutura do banco', success: true });
      
      const { data: dbStructure, error: dbError } = await supabase
        .from('user_answers')
        .select('user_ranking_id, answers_data, answer_format')
        .eq('user_ranking_id', concursoId)
        .limit(1);

      if (dbError) {
        addResult({ 
          step: 'Verificar estrutura do banco', 
          success: false, 
          error: dbError.message 
        });
        return;
      }

      addResult({ 
        step: 'Estrutura do banco verificada', 
        success: true, 
        data: dbStructure 
      });

      // 2. Testar salvamento de respostas
      const testAnswers = [
        { questionNumber: 1, answer: 'A' },
        { questionNumber: 2, answer: 'B' }
      ];

      const { data: saveResult, error: saveError } = await supabase
        .rpc('save_user_answers_consolidated_by_concurso', {
          p_ranking_id: rankingId,
          p_concurso_id: concursoId,
          p_booklet_id: 'test-booklet',
          p_answers: testAnswers,
          p_discursive_score: 50,
          p_current_edit_count: 0
        });

      if (saveError) {
        addResult({ 
          step: 'Teste de salvamento', 
          success: false, 
          error: saveError.message 
        });
        return;
      }

      addResult({ 
        step: 'Salvamento testado', 
        success: true, 
        data: saveResult 
      });

      // 3. Verificar se os dados foram salvos corretamente
      const { data: savedData, error: retrieveError } = await supabase
        .from('user_answers')
        .select('answers_data')
        .eq('user_ranking_id', concursoId)
        .single();

      if (retrieveError) {
        addResult({ 
          step: 'Verificação de dados salvos', 
          success: false, 
          error: retrieveError.message 
        });
        return;
      }

      addResult({ 
        step: 'Dados salvos verificados', 
        success: true, 
        data: savedData 
      });

      // 4. Testar recuperação de respostas
      const userData = savedData?.answers_data?.users?.[rankingId];
      if (userData) {
        addResult({ 
          step: 'Recuperação de dados do usuário', 
          success: true, 
          data: userData 
        });
      } else {
        addResult({ 
          step: 'Recuperação de dados do usuário', 
          success: false, 
          error: 'Dados do usuário não encontrados na estrutura JSON' 
        });
      }

    } catch (error: any) {
      addResult({ 
        step: 'Erro geral', 
        success: false, 
        error: error.message 
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verificationResults,
    isVerifying,
    verifyFlow,
    clearResults: () => setVerificationResults([])
  };
};