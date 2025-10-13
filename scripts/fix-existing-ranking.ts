import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usar credenciais do convoca-ai
const supabaseUrl = 'https://ppsymqrdtjyaguftracc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExistingRanking() {
  console.log('🔧 Corrigindo ranking existente...\n');

  const rankingId = 'e2d7fa3e-0cbf-4c65-a171-a89cf64ac7ca';

  try {
    // 1. Buscar ranking existente
    console.log('1. Buscando ranking existente...');
    
    const { data: rankingData, error: fetchError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', rankingId)
      .single();

    if (fetchError) {
      console.error('❌ Erro ao buscar ranking:', fetchError);
      return;
    }

    console.log(`✅ Ranking encontrado: ${rankingData.titulo}`);

    // 2. Analisar estrutura de prova existente
    console.log('\n2. Analisando estrutura de prova existente...');
    
    const structure = {
      has_basic_knowledge: rankingData.has_basic_knowledge,
      basic_knowledge_questions: rankingData.basic_knowledge_questions,
      basic_knowledge_weight: rankingData.basic_knowledge_weight,
      has_specific_knowledge_1: rankingData.has_specific_knowledge_1,
      specific_knowledge_1_questions: rankingData.specific_knowledge_1_questions,
      specific_knowledge_1_weight: rankingData.specific_knowledge_1_weight,
      has_specific_knowledge_2: rankingData.has_specific_knowledge_2,
      specific_knowledge_2_questions: rankingData.specific_knowledge_2_questions,
      specific_knowledge_2_weight: rankingData.specific_knowledge_2_weight,
      has_specific_knowledge_3: rankingData.has_specific_knowledge_3,
      specific_knowledge_3_questions: rankingData.specific_knowledge_3_questions,
      specific_knowledge_3_weight: rankingData.specific_knowledge_3_weight,
      has_discursive: rankingData.has_discursive,
      discursive_weight: rankingData.discursive_weight,
      has_case_study_1: rankingData.has_case_study_1,
      case_study_1_weight: rankingData.case_study_1_weight,
      has_case_study_2: rankingData.has_case_study_2,
      case_study_2_weight: rankingData.case_study_2_weight,
      has_case_study_3: rankingData.has_case_study_3,
      case_study_3_weight: rankingData.case_study_3_weight,
      has_custom_knowledge: rankingData.has_custom_knowledge,
      custom_knowledge_questions: rankingData.custom_knowledge_questions,
      custom_knowledge_weight: rankingData.custom_knowledge_weight
    };

    console.log('📊 Estrutura de prova:');
    Object.entries(structure).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // 3. Criar disciplinas baseadas na estrutura
    console.log('\n3. Criando disciplinas baseadas na estrutura...');
    
    const disciplines = [];

    // Conhecimentos Básicos
    if (structure.has_basic_knowledge) {
      disciplines.push({
        id: 'basic-knowledge',
        name: 'Conhecimentos Básicos',
        type: 'basic_knowledge',
        isEnabled: true,
        questionCount: structure.basic_knowledge_questions || 0,
        weight: structure.basic_knowledge_weight || 1,
        minimum_score: 0
      });
    }

    // Conhecimentos Específicos 1
    if (structure.has_specific_knowledge_1) {
      disciplines.push({
        id: 'specific-knowledge-1',
        name: 'Conhecimentos Específicos 1',
        type: 'specific_knowledge_1',
        isEnabled: true,
        questionCount: structure.specific_knowledge_1_questions || 0,
        weight: structure.specific_knowledge_1_weight || 1,
        minimum_score: 0
      });
    }

    // Conhecimentos Específicos 2
    if (structure.has_specific_knowledge_2) {
      disciplines.push({
        id: 'specific-knowledge-2',
        name: 'Conhecimentos Específicos 2',
        type: 'specific_knowledge_2',
        isEnabled: true,
        questionCount: structure.specific_knowledge_2_questions || 0,
        weight: structure.specific_knowledge_2_weight || 1,
        minimum_score: 0
      });
    }

    // Conhecimentos Específicos 3
    if (structure.has_specific_knowledge_3) {
      disciplines.push({
        id: 'specific-knowledge-3',
        name: 'Conhecimentos Específicos 3',
        type: 'specific_knowledge_3',
        isEnabled: true,
        questionCount: structure.specific_knowledge_3_questions || 0,
        weight: structure.specific_knowledge_3_weight || 1,
        minimum_score: 0
      });
    }

    // Discursiva
    if (structure.has_discursive) {
      disciplines.push({
        id: 'discursive',
        name: 'Prova Discursiva',
        type: 'discursive',
        isEnabled: true,
        questionCount: 1,
        weight: structure.discursive_weight || 1,
        minimum_score: 0
      });
    }

    // Estudo de Caso 1
    if (structure.has_case_study_1) {
      disciplines.push({
        id: 'case-study-1',
        name: 'Estudo de Caso 1',
        type: 'case_study_1',
        isEnabled: true,
        questionCount: 1,
        weight: structure.case_study_1_weight || 1,
        minimum_score: 0
      });
    }

    // Estudo de Caso 2
    if (structure.has_case_study_2) {
      disciplines.push({
        id: 'case-study-2',
        name: 'Estudo de Caso 2',
        type: 'case_study_2',
        isEnabled: true,
        questionCount: 1,
        weight: structure.case_study_2_weight || 1,
        minimum_score: 0
      });
    }

    // Estudo de Caso 3
    if (structure.has_case_study_3) {
      disciplines.push({
        id: 'case-study-3',
        name: 'Estudo de Caso 3',
        type: 'case_study_3',
        isEnabled: true,
        questionCount: 1,
        weight: structure.case_study_3_weight || 1,
        minimum_score: 0
      });
    }

    // Conhecimentos Customizados
    if (structure.has_custom_knowledge) {
      disciplines.push({
        id: 'custom-knowledge',
        name: 'Conhecimentos Customizados',
        type: 'custom_knowledge',
        isEnabled: true,
        questionCount: structure.custom_knowledge_questions || 0,
        weight: structure.custom_knowledge_weight || 1,
        minimum_score: 0
      });
    }

    console.log(`📚 Disciplinas criadas: ${disciplines.length}`);
    disciplines.forEach((discipline, index) => {
      console.log(`   ${index + 1}. ${discipline.name} (${discipline.questionCount} questões, peso ${discipline.weight})`);
    });

    // 4. Atualizar ranking com disciplinas
    console.log('\n4. Atualizando ranking com disciplinas...');
    
    const { error: updateError } = await supabase
      .from('concursos')
      .update({
        disciplines: disciplines,
        subjects: rankingData.subjects || [],
        form_config: rankingData.form_config || {},
        metadata: rankingData.metadata || {},
        total_participants: rankingData.total_participants || 0
      })
      .eq('id', rankingId);

    if (updateError) {
      console.error('❌ Erro ao atualizar ranking:', updateError);
      return;
    }

    console.log('✅ Ranking atualizado com disciplinas');

    // 5. Verificar se a correção funcionou
    console.log('\n5. Verificando correção...');
    
    const { data: updatedRanking, error: verifyError } = await supabase
      .from('concursos')
      .select('disciplines, exam_booklets, official_answers')
      .eq('id', rankingId)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar ranking:', verifyError);
      return;
    }

    console.log('✅ Verificação concluída:');
    console.log(`   - Disciplinas: ${updatedRanking.disciplines?.length || 0}`);
    console.log(`   - Cadernos: ${updatedRanking.exam_booklets?.length || 0}`);
    console.log(`   - Gabaritos: ${Object.keys(updatedRanking.official_answers || {}).length}`);

    if (updatedRanking.disciplines && updatedRanking.disciplines.length > 0) {
      console.log('\n🎉 CORREÇÃO BEM-SUCEDIDA!');
      console.log('   ✅ Disciplinas foram criadas corretamente');
      console.log('   ✅ Estrutura de prova foi convertida para JSONB');
      console.log('   ✅ Gabarito oficial agora pode ser renderizado');
    } else {
      console.log('\n❌ CORREÇÃO FALHOU');
      console.log('   - Disciplinas ainda estão vazias');
    }

  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

fixExistingRanking();



