import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initGoogleAds, trackConversion, trackPageView } from '@/lib/analytics';

/**
 * Inicializa Google Ads e envia page_view a cada mudança de rota (SPA).
 */
export function useGoogleAdsRouteTracking(): void {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    initGoogleAds();
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;

    trackPageView(path);

    if (location.pathname === '/planos') {
      trackConversion('view_planos');
    }
  }, [location.pathname, location.search]);
}
