import 'dotenv/config';
import { PasswordValidator } from '../src/utils/passwordValidator';

function createValidPasswords() {
  console.log('🔐 Criando senhas válidas para teste...');

  const validPasswords = [
    'MinhaSenh@123',
    'Teste123!@#',
    'Usuario@2024',
    'Sistema#456',
    'Concurso$789',
    'Ranking&012',
    'Nomeia@345',
    'Publico#678',
    'Estudo$901',
    'Aprovacao@234'
  ];

  console.log('\n✅ Senhas válidas criadas:');
  console.log('=' .repeat(50));
  
  validPasswords.forEach((password, index) => {
    const validation = PasswordValidator.validate(password);
    const status = validation.isValid ? '✅' : '❌';
    
    console.log(`${index + 1}. ${status} "${password}"`);
    console.log(`   Comprimento: ${password.length} caracteres`);
    console.log(`   Score: ${validation.score}/100`);
    
    if (!validation.isValid) {
      console.log(`   Erros:`);
      validation.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
    }
  });

  console.log('\n📋 Instruções para cadastro:');
  console.log('1. Use uma das senhas válidas acima');
  console.log('2. Ou crie sua própria seguindo os requisitos:');
  console.log('   - Mínimo 12 caracteres');
  console.log('   - Pelo menos 1 letra maiúscula (A-Z)');
  console.log('   - Pelo menos 1 letra minúscula (a-z)');
  console.log('   - Pelo menos 1 número (0-9)');
  console.log('   - Pelo menos 1 caractere especial (!@#$%^&*(),.?":{}|<>)');
  console.log('   - Evite sequências comuns');
  console.log('   - Evite repetições de caracteres');

  console.log('\n🎯 Exemplos práticos:');
  console.log('✅ SuaSenha@123');
  console.log('✅ MinhaConta#456');
  console.log('✅ Usuario$789');
  console.log('✅ Sistema&012');
  console.log('✅ Aplicacao@345');

  console.log('\n🌐 Acesse: http://localhost:8084');
  console.log('📧 Use um email real para receber a confirmação');
}

// Executar criação
createValidPasswords();



