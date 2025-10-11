#!/usr/bin/env node

/**
 * Script para configurar variáveis de ambiente
 * Executa: node setup-env.js
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://ppsymqrdtjyaguftracc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs

# Security Keys (REQUIRED)
VITE_OBFUSCATION_KEY=nomeia_obfuscation_2024_secure_key_32_chars
VITE_URL_OBFUSCATION_KEY=nomeia_url_obfuscation_2024_secure_key_32_chars

# CORS Configuration (REQUIRED for production)
ALLOWED_ORIGIN=http://localhost:8080

# Development Mode
VITE_DEV_MODE=true
VITE_DEBUG_LOGS=true
`;

const envPath = path.join(__dirname, '.env.local');

try {
  // Verificar se o arquivo já existe
  if (fs.existsSync(envPath)) {
    console.log('⚠️  Arquivo .env.local já existe!');
    console.log('📝 Conteúdo atual:');
    console.log(fs.readFileSync(envPath, 'utf8'));
    console.log('\n❓ Deseja sobrescrever? (y/N)');
    
    // Em um ambiente interativo, você poderia usar readline
    // Por simplicidade, vamos apenas mostrar o conteúdo
    return;
  }

  // Criar o arquivo
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Arquivo .env.local criado com sucesso!');
  console.log('🔧 Variáveis de ambiente configuradas:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - VITE_SUPABASE_ANON_KEY');
  console.log('   - VITE_OBFUSCATION_KEY');
  console.log('   - VITE_URL_OBFUSCATION_KEY');
  console.log('   - ALLOWED_ORIGIN');
  console.log('   - VITE_DEV_MODE');
  console.log('   - VITE_DEBUG_LOGS');
  console.log('\n🚀 Agora execute: npm run dev');
  console.log('🌐 Acesse: http://localhost:8080');
  
} catch (error) {
  console.error('❌ Erro ao criar arquivo .env.local:', error.message);
  console.log('\n📝 Crie manualmente o arquivo .env.local com o seguinte conteúdo:');
  console.log(envContent);
}
