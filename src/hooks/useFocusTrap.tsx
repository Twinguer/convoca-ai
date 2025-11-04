import { useEffect, useRef } from 'react';

export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    // Priorizar elementos que não sejam campos de URL
    const nonUrlElements = Array.from(focusableElements).filter(el => 
      el.tagName !== 'INPUT' || (el as HTMLInputElement).type !== 'url'
    );
    
    const firstElement = nonUrlElements[0] || focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus no primeiro elemento quando o trap é ativado (sem outline)
    if (firstElement) {
      // Pequeno delay para garantir que o modal esteja totalmente renderizado
      setTimeout(() => {
        firstElement.focus();
        // Remove outline temporariamente para evitar borda verde
        firstElement.style.outline = 'none';
      }, 50);
    }

    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restaura outline quando o trap é desativado
      if (firstElement) {
        firstElement.style.outline = '';
      }
    };
  }, [isActive]);

  return containerRef;
};
