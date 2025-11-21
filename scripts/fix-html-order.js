import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const htmlPath = resolve('dist', 'index.html');

try {
  let html = readFileSync(htmlPath, 'utf-8');
  
  // Encontrar o react-vendor, vendor e o script principal
  // Procurar em modulepreload primeiro (pode ter atributos em qualquer ordem)
  const reactVendorPreload = html.match(/<link[^>]*href=["']([^"']*react-vendor[^"']+)["'][^>]*>/);
  const reactVendorScript = html.match(/<script[^>]*src=["']([^"']*react-vendor[^"']+)["'][^>]*>/);
  const reactVendorMatch = reactVendorPreload || reactVendorScript;
  
  const vendorPreload = html.match(/<link[^>]*href=["']([^"']*vendor[^"']+)["'][^>]*>/);
  const scriptTag = html.match(/<script[^>]*src=["']([^"']*index[^"']+)["'][^>]*>/);
  
  if (reactVendorMatch && scriptTag) {
    const reactVendorPath = reactVendorMatch[1];
    
    // Remover todos os modulepreloads
    html = html.replace(/<link[^>]*rel=["']modulepreload["'][^>]*>/g, '');
    
    // Inserir scripts na ordem correta: react-vendor PRIMEIRO, depois vendor (se existir), depois index
    let newScripts = `<script type="module" crossorigin src="${reactVendorPath}"></script>`;
    if (vendorPreload) {
      newScripts += `\n    <script type="module" crossorigin src="${vendorPreload[1]}"></script>`;
    }
    newScripts += `\n    ${scriptTag[0]}`;
    
    html = html.replace(scriptTag[0], newScripts);
    
    // Escrever o HTML modificado
    writeFileSync(htmlPath, html, 'utf-8');
    console.log('✅ HTML modificado: react-vendor será carregado antes de vendor e index');
  } else {
    console.warn('⚠️ Não foi possível encontrar react-vendor ou script tag no HTML');
  }
} catch (error) {
  console.error('❌ Erro ao modificar index.html:', error);
  process.exit(1);
}

