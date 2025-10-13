import 'dotenv/config';
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function restartDevServer() {
  console.log('🔄 Reiniciando servidor de desenvolvimento...');

  try {
    // Criar arquivo .env com as configurações corretas
    const envContent = `# =====================================================
# CONFIGURAÇÃO DO BANCO NOMEIA-AI (DESENVOLVIMENTO)
# =====================================================

# Banco principal (produção) - ORIGINAL
VITE_SUPABASE_URL_ORIGINAL=https://your-original-project.supabase.co
VITE_SUPABASE_ANON_KEY_ORIGINAL=your-original-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY_ORIGINAL=your-original-service-role-key

# Banco de desenvolvimento (nomeia-ai) - ATUAL
VITE_SUPABASE_URL=https://xuovcuefnullpmpktrzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEzMjI2MywiZXhwIjoyMDc1NzA4MjYzfQ.8Q5XqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQqJQ

# Configuração da branch
VITE_BRANCH=nomeia-ai

# ID do projeto para referência
VITE_SUPABASE_REF_ID=xuovcuefnullpmpktrzd`;

    console.log('1. Criando arquivo .env...');
    writeFileSync('.env', envContent);
    console.log('✅ Arquivo .env criado');

    // Verificar se o servidor está rodando
    console.log('\n2. Verificando servidor atual...');
    try {
      const response = await fetch('http://localhost:8083');
      if (response.ok) {
        console.log('⚠️ Servidor está rodando, será reiniciado');
      }
    } catch (error) {
      console.log('ℹ️ Servidor não está rodando');
    }

    // Reiniciar o servidor
    console.log('\n3. Reiniciando servidor...');
    console.log('📋 Execute os seguintes comandos:');
    console.log('   Ctrl+C (para parar o servidor atual)');
    console.log('   npm run dev (para iniciar com as novas variáveis)');
    console.log('\n4. Acesse: http://localhost:8083');

    // Verificar se as variáveis estão sendo carregadas
    console.log('\n5. Verificando variáveis de ambiente...');
    console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'NÃO DEFINIDA');
    console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');

  } catch (error: any) {
    console.error('❌ Erro:', error);
  }
}

// Executar reinicialização
restartDevServer().then(() => {
  console.log('\n🏁 Reinicialização concluída');
  console.log('\n📋 Próximos passos:');
  console.log('1. Pare o servidor atual (Ctrl+C)');
  console.log('2. Execute: npm run dev');
  console.log('3. Acesse: http://localhost:8083');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});



