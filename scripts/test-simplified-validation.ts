import 'dotenv/config';
import { PasswordValidator } from '../src/utils/passwordValidator';

function testSimplifiedValidation() {
  console.log('🔐 Testando validação simplificada de senha...');

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
    'User123!', // Válida - 8 caracteres
    'Test@123', // Válida - 8 caracteres
    'Admin#456', // Válida - 8 caracteres
  ];

  console.log('\n📋 Requisitos de senha (simplificados):');
  console.log('✅ Mínimo: 8 caracteres');
  console.log('✅ Máximo: 128 caracteres');
  console.log('✅ Pelo menos 1 letra maiúscula (A-Z)');
  console.log('✅ Pelo menos 1 letra minúscula (a-z)');
  console.log('✅ Pelo menos 1 número (0-9)');
  console.log('✅ Pelo menos 1 caractere especial (!@#$%^&*(),.?":{}|<>)');
  console.log('❌ Não pode ter 5+ caracteres idênticos consecutivos');
  console.log('❌ Não pode conter sequências muito comuns');
  console.log('❌ Não pode ser apenas números ou apenas letras');

  console.log('\n🧪 Testando senhas:');
  console.log('=' .repeat(80));

  let validCount = 0;

  testPasswords.forEach((password, index) => {
    const validation = PasswordValidator.validate(password);
    const status = validation.isValid ? '✅' : '❌';
    
    if (validation.isValid) {
      validCount++;
    }
    
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

  console.log(`\n📊 Resultado: ${validCount}/${testPasswords.length} senhas válidas`);

  console.log('\n📋 Exemplos de senhas válidas:');
  console.log('✅ Password123!');
  console.log('✅ MinhaSenh@123');
  console.log('✅ Teste123!@#');
  console.log('✅ User123!');
  console.log('✅ Test@123');
  console.log('✅ Admin#456');

  console.log('\n🔧 Instruções para o usuário:');
  console.log('1. Use pelo menos 8 caracteres');
  console.log('2. Combine letras maiúsculas, minúsculas, números e símbolos');
  console.log('3. Evite sequências muito comuns');
  console.log('4. Use uma frase secreta se preferir');

  console.log('\n🌐 Acesse: http://localhost:8084');
  console.log('📧 Use um email real para receber a confirmação');
}

// Executar teste
testSimplifiedValidation();

