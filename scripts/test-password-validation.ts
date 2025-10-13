import 'dotenv/config';
import { PasswordValidator } from '../src/utils/passwordValidator';

function testPasswordValidation() {
  console.log('🔐 Testando validação de senha...');

  const testPasswords = [
    '12345678', // Muito simples
    'password123', // Sem maiúscula e especial
    'Password123', // Sem caractere especial
    'Password123!', // Válida
    'MinhaSenh@123', // Válida
    'Teste123!@#', // Válida
    'abc123', // Muito curta
    'PASSWORD123!', // Sem minúscula
    'password!@#', // Sem maiúscula e número
    '123456789012', // Apenas números
    'abcdefghijkl', // Apenas letras
    'Password123!Password123!', // Muito longa
  ];

  console.log('\n📋 Requisitos de senha:');
  console.log('✅ Mínimo: 12 caracteres');
  console.log('✅ Máximo: 128 caracteres');
  console.log('✅ Pelo menos 1 letra maiúscula (A-Z)');
  console.log('✅ Pelo menos 1 letra minúscula (a-z)');
  console.log('✅ Pelo menos 1 número (0-9)');
  console.log('✅ Pelo menos 1 caractere especial (!@#$%^&*(),.?":{}|<>)');
  console.log('❌ Não pode ter 4+ caracteres idênticos consecutivos');
  console.log('❌ Não pode conter sequências comuns (123456, abcdef, qwerty, password, admin, user)');
  console.log('❌ Não pode ser apenas números ou apenas letras');

  console.log('\n🧪 Testando senhas:');
  console.log('=' .repeat(80));

  testPasswords.forEach((password, index) => {
    const validation = PasswordValidator.validate(password);
    const status = validation.isValid ? '✅' : '❌';
    
    console.log(`\n${index + 1}. ${status} "${password}"`);
    console.log(`   Comprimento: ${password.length} caracteres`);
    console.log(`   Válida: ${validation.isValid ? 'Sim' : 'Não'}`);
    console.log(`   Score: ${validation.score}/100`);
    
    if (validation.errors.length > 0) {
      console.log(`   Erros:`);
      validation.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
    }
    
    if (validation.suggestions.length > 0) {
      console.log(`   Sugestões:`);
      validation.suggestions.forEach(suggestion => {
        console.log(`     - ${suggestion}`);
      });
    }
  });

  console.log('\n📋 Exemplos de senhas válidas:');
  console.log('✅ MinhaSenh@123');
  console.log('✅ Teste123!@#');
  console.log('✅ Password123!');
  console.log('✅ Usuario@2024');
  console.log('✅ Sistema#456');

  console.log('\n🔧 Instruções para o usuário:');
  console.log('1. Use pelo menos 12 caracteres');
  console.log('2. Combine letras maiúsculas, minúsculas, números e símbolos');
  console.log('3. Evite sequências comuns ou previsíveis');
  console.log('4. Use uma frase secreta se preferir');
}

// Executar teste
testPasswordValidation();



