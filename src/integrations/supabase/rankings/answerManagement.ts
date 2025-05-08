
import { supabase } from '../client';
import { getExamStructure } from './examStructure';
import { Concurso } from '@/types/concursos';
import { getEnabledKnowledgeAreas } from '@/services/knowledgeAreaService';

// Função para salvar as respostas do usuário no banco de dados
export const saveUserAnswersData = async (
  rankingId: string,
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // Carregue os dados do concurso para determinar as faixas das seções
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
    if (concursoError) throw concursoError;

    const examStructure = getExamStructure(concurso);

    // Obter todas as áreas de conhecimento habilitadas
    const enabledAreas = getEnabledKnowledgeAreas(concurso);

    // Preparar os dados de resposta com as marcações corretas de seção
    const answersData = answers.map(a => {
      const qNum = a.questionNumber;

      return {
        user_ranking_id: rankingId,
        question_number: qNum,
        answer: a.answer,
        is_basic_knowledge: false, // Será ajustado abaixo
        is_specific_1: false,
        is_specific_2: false,
        is_specific_3: false
      };
    });
    
    // Corrija as flags para as seções corretamente
    // Percorrendo cada área de conhecimento habilitada e definindo flags para questões correspondentes
    let questionCounter = 0;
    for (const area of enabledAreas) {
      // Ignorar áreas sem questões (discursivas, etc.)
      if (!area.questionsField) continue;

      // Obter o número de questões para essa área
      const questionCount = concurso[area.questionsField as keyof Concurso] as number || 0;
      
      // Se há questões nesta área, marcá-las adequadamente
      if (questionCount > 0) {
        const endIndex = questionCounter + questionCount;
        
        // Para cada questão dentro desta área
        for (let q = questionCounter + 1; q <= endIndex; q++) {
          // Encontrar o objeto de resposta correspondente
          const answerItem = answersData.find(item => item.question_number === q);
          
          if (answerItem) {
            // Definir as flags apropriadas com base na área atual
            switch (area.key) {
              case 'basic':
                answerItem.is_basic_knowledge = true;
                break;
              case 'specific1':
                answerItem.is_specific_1 = true;
                break;
              case 'specific2':
                answerItem.is_specific_2 = true;
                break;
              case 'specific3':
                answerItem.is_specific_3 = true;
                break;
              // Tratando outras áreas como específicas
              // Nota: o banco de dados atual só tem flags para basic, specific1, specific2, specific3
              default:
                // Por padrão, vamos considerar como specific_1 para compatibilidade
                answerItem.is_specific_1 = true;
                break;
            }
          }
        }
        
        // Atualizar contador para a próxima área
        questionCounter += questionCount;
      }
    }

    console.log('Dados de respostas preparados para salvar:', answersData);

    // Primeiro exclui todas as respostas existentes
    const { error: deleteError } = await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    if (deleteError) {
      console.error('Erro ao excluir respostas existentes:', deleteError);
      throw deleteError;
    }
    
    console.log('Respostas anteriores excluídas com sucesso');
    
    // Insere novas respostas apenas se houver respostas para inserir
    if (answersData.length > 0) {
      const { error: insertError } = await supabase
        .from('user_answers')
        .insert(answersData);
        
      if (insertError) {
        console.error('Erro ao inserir novas respostas:', insertError);
        throw insertError;
      }
      
      console.log('Novas respostas inseridas com sucesso');
    } else {
      console.log('Nenhuma resposta para inserir');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar respostas do usuário:', error);
    throw error;
  }
};
