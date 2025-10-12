import { config } from 'dotenv';

// Carregar explicitamente o arquivo .env
config({ path: '.env' });

console.log('🔧 Testando variáveis de ambiente...\n');

console.log('📊 Variáveis carregadas:');
console.log(`   - VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}`);
console.log(`   - VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida'}`);
console.log(`   - VITE_SUPABASE_SERVICE_ROLE_KEY: ${process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? '✅ Definida' : '❌ Não definida'}`);

if (process.env.VITE_SUPABASE_URL) {
  console.log(`\n🌐 URL do Supabase: ${process.env.VITE_SUPABASE_URL}`);
  
  const isConvocaAi = process.env.VITE_SUPABASE_URL.includes('ppsymqrdtjyaguftracc');
  console.log(`   - Usando convoca-ai: ${isConvocaAi ? '✅ Sim' : '❌ Não'}`);
  
  if (isConvocaAi) {
    console.log('\n✅ Configuração correta! Sistema configurado para convoca-ai');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Reiniciar o servidor de desenvolvimento (npm run dev)');
    console.log('   2. Testar criação de ranking');
    console.log('   3. Verificar se o erro rankings_status_check foi resolvido');
  } else {
    console.log('\n❌ Configuração incorreta! Sistema não está usando convoca-ai');
  }
} else {
  console.log('\n❌ Arquivo .env não foi carregado corretamente');
  console.log('   - Verifique se o arquivo .env existe na raiz do projeto');
  console.log('   - Verifique se as variáveis estão definidas corretamente');
}
