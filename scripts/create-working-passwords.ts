import 'dotenv/config';
import { PasswordValidator } from '../src/utils/passwordValidator';

function createWorkingPasswords() {
  console.log('🔐 Criando senhas que realmente funcionam...');

  const workingPasswords = [
    'MinhaSenha@123',
    'TesteSistema#456',
    'UsuarioRanking$789',
    'ConcursoPublico&012',
    'NomeiaAplicacao@345',
    'EstudoAprovacao#678',
    'SistemaSeguro$901',
    'ContaUsuario@234',
    'AplicacaoTeste#567',
    'RankingConcurso$890'
  ];

  console.log('\n✅ Senhas que funcionam:');
  console.log('=' .repeat(60));
  
  let validCount = 0;
  
  workingPasswords.forEach((password, index) => {
    const validation = PasswordValidator.validate(password);
    const status = validation.isValid ? '✅' : '❌';
    
    if (validation.isValid) {
      validCount++;
    }
    
    console.log(`${index + 1}. ${status} "${password}"`);
    console.log(`   Comprimento: ${password.length} caracteres`);
    console.log(`   Score: ${validation.score}/100`);
    console.log(`   Válida: ${validation.isValid ? 'Sim' : 'Não'}`);
    
    if (!validation.isValid) {
      console.log(`   Erros:`);
      validation.errors.forEach(error => {
        console.log(`     - ${error}`);
      });
    }
    
    console.log('');
  });

  console.log(`\n📊 Resultado: ${validCount}/${workingPasswords.length} senhas válidas`);

  if (validCount > 0) {
    console.log('\n🎯 Use uma dessas senhas para cadastro:');
    workingPasswords.forEach((password, index) => {
      const validation = PasswordValidator.validate(password);
      if (validation.isValid) {
        console.log(`✅ ${password}`);
      }
    });
  } else {
    console.log('\n⚠️ Nenhuma senha passou na validação rigorosa');
    console.log('🔧 Vou criar senhas mais complexas...');
    
    const complexPasswords = [
      'MinhaSenha@123!',
      'TesteSistema#456$',
      'UsuarioRanking$789&',
      'ConcursoPublico&012@',
      'NomeiaAplicacao@345#',
      'EstudoAprovacao#678$',
      'SistemaSeguro$901!',
      'ContaUsuario@234#',
      'AplicacaoTeste#567$',
      'RankingConcurso$890!'
    ];
    
    console.log('\n🔐 Testando senhas mais complexas:');
    console.log('=' .repeat(60));
    
    complexPasswords.forEach((password, index) => {
      const validation = PasswordValidator.validate(password);
      const status = validation.isValid ? '✅' : '❌';
      
      console.log(`${index + 1}. ${status} "${password}"`);
      console.log(`   Comprimento: ${password.length} caracteres`);
      console.log(`   Score: ${validation.score}/100`);
      console.log(`   Válida: ${validation.isValid ? 'Sim' : 'Não'}`);
      
      if (validation.isValid) {
        console.log(`   🎉 Esta senha funciona!`);
      }
      
      console.log('');
    });
  }

  console.log('\n📋 Instruções finais:');
  console.log('1. Acesse: http://localhost:8084');
  console.log('2. Use um email real para receber a confirmação');
  console.log('3. Use uma das senhas válidas mostradas acima');
  console.log('4. Confirme o email e faça login');
}

// Executar criação
createWorkingPasswords();

