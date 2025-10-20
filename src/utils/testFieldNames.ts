// Teste para verificar se os nomes dos campos estão corretos
import { mapFormDataToDisciplinesStructure } from './disciplinesStructure';

console.log('=== TESTE DOS NOMES DOS CAMPOS ===');

// Simular dados do formulário com os nomes corretos
const formData = {
  total_minimum_score: 8,
  quota_minimum_score: 5,
  disciplines: [
    {
      id: 'block-1',
      name: 'Bloco 1',
      minimum_score: 6,
      minimum_score_cotas: 4,
      disciplines: [
        {
          id: 'disc-1',
          name: 'Matemática',
          type: 'custom_math',
          weight: 1,
          isEnabled: true,
          minimum_score: 3,
          minimum_score_cotas: 2,
          questionCount: 10
        }
      ]
    }
  ]
};

console.log('Dados de entrada:', formData);

try {
  const result = mapFormDataToDisciplinesStructure(formData);
  console.log('Resultado:', result);
  
  // Verificar se os campos globais estão corretos
  if (result.minimum_total_score === 8) {
    console.log('✅ minimum_total_score correto:', result.minimum_total_score);
  } else {
    console.log('❌ minimum_total_score incorreto:', result.minimum_total_score);
  }
  
  if (result.minimum_total_score_cotas === 5) {
    console.log('✅ minimum_total_score_cotas correto:', result.minimum_total_score_cotas);
  } else {
    console.log('❌ minimum_total_score_cotas incorreto:', result.minimum_total_score_cotas);
  }
  
  // Verificar se os blocos estão corretos
  if (result.blocks && result.blocks.length > 0) {
    const block = result.blocks[0];
    console.log('Bloco:', block);
    
    if (block.blockMinimumScore === 6) {
      console.log('✅ blockMinimumScore correto:', block.blockMinimumScore);
    } else {
      console.log('❌ blockMinimumScore incorreto:', block.blockMinimumScore);
    }
    
    if (block.blockMinimumCotas === 4) {
      console.log('✅ blockMinimumCotas correto:', block.blockMinimumCotas);
    } else {
      console.log('❌ blockMinimumCotas incorreto:', block.blockMinimumCotas);
    }
    
    // Verificar disciplinas
    if (block.disciplines && block.disciplines.length > 0) {
      const discipline = block.disciplines[0];
      console.log('Disciplina:', discipline);
      
      if (discipline.minimum_score === 3) {
        console.log('✅ discipline minimum_score correto:', discipline.minimum_score);
      } else {
        console.log('❌ discipline minimum_score incorreto:', discipline.minimum_score);
      }
      
      if (discipline.minimum_score_cotas === 2) {
        console.log('✅ discipline minimum_score_cotas correto:', discipline.minimum_score_cotas);
      } else {
        console.log('❌ discipline minimum_score_cotas incorreto:', discipline.minimum_score_cotas);
      }
    }
  }
  
  console.log('=== TESTE CONCLUÍDO ===');
  
} catch (error) {
  console.error('❌ Erro no teste:', error);
}
