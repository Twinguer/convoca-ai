
import { supabase } from '@/integrations/supabase/client';
import { getConsolidatedAnswerKey } from '@/services/answerKeyService';

export const checkMissingOfficialAnswers = async (concursoId: string) => {
  try {
    console.log('[checkMissingOfficialAnswers] Checking for concurso:', concursoId);
    
    // Buscar informações do concurso
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();

    if (concursoError || !concurso) {
      console.error('[checkMissingOfficialAnswers] Erro ao buscar concurso:', concursoError);
      return { missing: true, reason: 'Concurso não encontrado' };
    }

    // Calcular total de questões esperadas
    let totalExpectedQuestions = 0;
    
    if (concurso.has_basic_knowledge) {
      totalExpectedQuestions += concurso.basic_knowledge_questions || 0;
    }
    if (concurso.has_specific_knowledge_1) {
      totalExpectedQuestions += concurso.specific_knowledge_1_questions || 0;
    }
    if (concurso.has_specific_knowledge_2) {
      totalExpectedQuestions += concurso.specific_knowledge_2_questions || 0;
    }
    if (concurso.has_specific_knowledge_3) {
      totalExpectedQuestions += concurso.specific_knowledge_3_questions || 0;
    }

    // Para disciplinas customizadas
    if (concurso.has_custom_knowledge && concurso.disciplines) {
      const disciplines = Array.isArray(concurso.disciplines) ? concurso.disciplines : [];
      disciplines.forEach((discipline: any) => {
        if (discipline.isEnabled && discipline.questionCount) {
          totalExpectedQuestions += parseInt(discipline.questionCount) || 0;
        }
      });
    }

    console.log('[checkMissingOfficialAnswers] Total esperado de questões:', totalExpectedQuestions);

    if (totalExpectedQuestions === 0) {
      return { missing: true, reason: 'Nenhuma questão configurada no concurso' };
    }

    // Buscar gabarito consolidado
    const consolidatedData = await getConsolidatedAnswerKey(concursoId);
    
    if (!consolidatedData || !consolidatedData.booklets) {
      console.log('[checkMissingOfficialAnswers] Nenhum gabarito consolidado encontrado');
      return { missing: true, reason: 'Gabarito oficial não encontrado' };
    }

    // Verificar se há pelo menos um caderno com questões suficientes
    let hasCompleteBooklet = false;
    
    Object.entries(consolidatedData.booklets).forEach(([bookletId, bookletData]: [string, any]) => {
      const answersCount = Object.keys(bookletData.answers || {}).length;
      console.log(`[checkMissingOfficialAnswers] Caderno ${bookletId}: ${answersCount} respostas`);
      
      if (answersCount >= totalExpectedQuestions) {
        hasCompleteBooklet = true;
      }
    });

    if (!hasCompleteBooklet) {
      return { 
        missing: true, 
        reason: `Gabarito incompleto. Esperado: ${totalExpectedQuestions} questões por caderno` 
      };
    }

    console.log('[checkMissingOfficialAnswers] Gabarito oficial completo encontrado');
    return { missing: false };

  } catch (error) {
    console.error('[checkMissingOfficialAnswers] Erro:', error);
    return { missing: true, reason: 'Erro ao verificar gabarito oficial' };
  }
};
