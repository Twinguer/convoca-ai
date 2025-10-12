import 'dotenv/config';

// Simular import.meta.env para o teste
const mockImportMetaEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  VITE_SUPABASE_SERVICE_ROLE_KEY: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
};

// Mock do import.meta.env
(global as any).import = {
  meta: {
    env: mockImportMetaEnv
  }
};

import { currentConfig, currentDatabase, isDevelopment } from '../src/config/database';

console.log('🔧 Testando configuração do banco de dados...\n');

console.log('📊 Configuração atual:');
console.log(`   - Ambiente: ${isDevelopment ? 'Desenvolvimento' : 'Produção'}`);
console.log(`   - Banco: ${currentDatabase}`);
console.log(`   - URL: ${currentConfig.url}`);
console.log(`   - Anon Key: ${currentConfig.anonKey ? '✅ Definida' : '❌ Não definida'}`);
console.log(`   - Service Role Key: ${currentConfig.serviceRoleKey ? '✅ Definida' : '❌ Não definida'}`);

console.log('\n🎯 Verificando se está usando convoca-ai:');
const isConvocaAi = currentConfig.url?.includes('ppsymqrdtjyaguftracc');
console.log(`   - Usando convoca-ai: ${isConvocaAi ? '✅ Sim' : '❌ Não'}`);

if (isConvocaAi) {
  console.log('\n✅ Configuração correta! Sistema usando banco convoca-ai');
} else {
  console.log('\n❌ Configuração incorreta! Sistema não está usando convoca-ai');
}

console.log('\n📝 Próximos passos:');
console.log('   1. Criar arquivo .env com as credenciais do convoca-ai');
console.log('   2. Reiniciar o servidor de desenvolvimento');
console.log('   3. Testar criação de ranking');
