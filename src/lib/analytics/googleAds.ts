import { devLog } from '@/utils/productionLogger';
import type { GoogleAdsConversionEvent } from './types';

const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID?.trim();

const CONVERSION_ENV_MAP: Record<GoogleAdsConversionEvent, string | undefined> = {
  signup: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_SIGNUP,
  signup_confirm: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_SIGNUP_CONFIRM,
  purchase: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_PURCHASE,
  view_planos: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_VIEW_PLANOS,
};

let scriptInjected = false;
let configured = false;

/** Produção com ID configurado; em dev só se VITE_GOOGLE_ADS_ENABLE_DEV=true */
export function isGoogleAdsEnabled(): boolean {
  if (!ADS_ID) return false;
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_GOOGLE_ADS_ENABLE_DEV === 'true';
  }
  return true;
}

export function getGoogleAdsId(): string | undefined {
  return ADS_ID;
}

/**
 * Carrega gtag.js e configura a conta Google Ads (AW-...).
 * page_view manual via trackPageView (SPA).
 */
export function initGoogleAds(): void {
  if (!isGoogleAdsEnabled() || typeof window === 'undefined') return;
  if (configured) return;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());

  if (!scriptInjected) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID!)}`;
    document.head.appendChild(script);
    scriptInjected = true;
  }

  window.gtag('config', ADS_ID, { send_page_view: false });
  configured = true;

  if (import.meta.env.DEV) {
    devLog.log('[googleAds] inicializado', ADS_ID);
  }
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  if (!isGoogleAdsEnabled() || typeof window.gtag !== 'function' || !ADS_ID) return;

  window.gtag('config', ADS_ID, {
    page_path: pagePath,
    page_title: pageTitle ?? document.title,
  });
}

/**
 * Dispara conversão no Google Ads. Requer send_to no .env
 * (ex.: AW-18180561896/AbCdEfGh criado em Ferramentas → Conversões).
 */
export function trackConversion(
  event: GoogleAdsConversionEvent,
  options?: { value?: number; currency?: string }
): void {
  const sendTo = CONVERSION_ENV_MAP[event]?.trim();
  if (!sendTo) {
    if (import.meta.env.DEV) {
      devLog.log('[googleAds] conversão ignorada (send_to não configurado):', event);
    }
    return;
  }

  if (!isGoogleAdsEnabled() || typeof window.gtag !== 'function') return;

  window.gtag('event', 'conversion', {
    send_to: sendTo,
    value: options?.value ?? 1.0,
    currency: options?.currency ?? 'BRL',
  });

  if (import.meta.env.DEV) {
    devLog.log('[googleAds] conversion', event, sendTo);
  }
}
