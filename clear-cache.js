// Script para limpar cache do navegador e forçar atualização
console.log('🧹 Limpando cache do navegador...');

// Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo');

// Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// Limpar cache do service worker se existir
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('✅ Service Worker removido');
    });
  });
}

// Forçar reload da página
console.log('🔄 Recarregando página...');
window.location.reload(true);
