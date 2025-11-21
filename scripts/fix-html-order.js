import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const htmlPath = resolve('dist', 'index.html');

console.log('🔍 [fix-html-order] Iniciando correção da ordem de carregamento...');
console.log('📁 [fix-html-order] Caminho do HTML:', htmlPath);

try {
  let html = readFileSync(htmlPath, 'utf-8');
  console.log('✅ [fix-html-order] HTML lido com sucesso, tamanho:', html.length, 'bytes');
  
  // Encontrar o react-vendor, vendor e o script principal
  // Procurar em modulepreload primeiro (pode ter atributos em qualquer ordem)
  const reactVendorPreload = html.match(/<link[^>]*href=["']([^"']*react-vendor[^"']+)["'][^>]*>/);
  const reactVendorScript = html.match(/<script[^>]*src=["']([^"']*react-vendor[^"']+)["'][^>]*>/);
  const reactVendorMatch = reactVendorPreload || reactVendorScript;
  
  console.log('🔍 [fix-html-order] reactVendorPreload:', reactVendorPreload ? reactVendorPreload[1] : 'não encontrado');
  console.log('🔍 [fix-html-order] reactVendorScript:', reactVendorScript ? reactVendorScript[1] : 'não encontrado');
  console.log('🔍 [fix-html-order] reactVendorMatch:', reactVendorMatch ? reactVendorMatch[1] : 'não encontrado');
  
  const vendorPreload = html.match(/<link[^>]*href=["']([^"']*vendor[^"']+)["'][^>]*>/);
  const scriptTag = html.match(/<script[^>]*src=["']([^"']*index[^"']+)["'][^>]*>/);
  
  console.log('🔍 [fix-html-order] vendorPreload:', vendorPreload ? vendorPreload[1] : 'não encontrado');
  console.log('🔍 [fix-html-order] scriptTag:', scriptTag ? scriptTag[0] : 'não encontrado');
  
  if (reactVendorMatch && scriptTag) {
    const reactVendorPath = reactVendorMatch[1];
    console.log('✅ [fix-html-order] Todos os elementos encontrados, processando...');
    console.log('📝 [fix-html-order] react-vendor path:', reactVendorPath);
    
    // Remover todos os modulepreloads
    const modulepreloadCount = (html.match(/<link[^>]*rel=["']modulepreload["'][^>]*>/g) || []).length;
    console.log('🗑️ [fix-html-order] Removendo', modulepreloadCount, 'modulepreloads');
    html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
    
    // Inserir scripts na ordem correta: react-vendor PRIMEIRO, depois vendor (se existir), depois index
    let newScripts = `<script type="module" crossorigin src="${reactVendorPath}"></script>`;
    if (vendorPreload) {
      console.log('📝 [fix-html-order] vendor path:', vendorPreload[1]);
      newScripts += `\n    <script type="module" crossorigin src="${vendorPreload[1]}"></script>`;
    }
    newScripts += `\n    ${scriptTag[0]}`;
    
    console.log('📝 [fix-html-order] Nova ordem de scripts:');
    console.log(newScripts);
    
    html = html.replace(scriptTag[0], newScripts);
    
    // Escrever o HTML modificado
    writeFileSync(htmlPath, html, 'utf-8');
    console.log('✅ [fix-html-order] HTML modificado e salvo com sucesso');
    console.log('✅ [fix-html-order] react-vendor será carregado antes de vendor e index');
  } else {
    console.error('❌ [fix-html-order] ERRO: Não foi possível encontrar todos os elementos necessários');
    console.error('   reactVendorMatch:', reactVendorMatch ? 'encontrado' : 'NÃO encontrado');
    console.error('   scriptTag:', scriptTag ? 'encontrado' : 'NÃO encontrado');
    console.error('   HTML preview (primeiras 500 chars):', html.substring(0, 500));
    process.exit(1);
  }
} catch (error) {
  console.error('❌ [fix-html-order] Erro ao modificar index.html:', error);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

