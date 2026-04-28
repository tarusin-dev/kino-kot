'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
  type CookieConsentValue,
} from '@/lib/cookie-consent';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
  const [isScriptReady, setIsScriptReady] = useState(false);

  useEffect(() => {
    const syncConsent = () => {
      const isAccepted = getCookieConsent() === 'accepted';

      setHasAnalyticsConsent(isAccepted);

      if (!isAccepted) {
        setIsScriptReady(false);

        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
          });
        }
      }
    };

    const handleConsentChange = (event: Event) => {
      const value = (event as CustomEvent<{ value: CookieConsentValue }>).detail?.value;
      setHasAnalyticsConsent(value === 'accepted');

      if (value !== 'accepted') {
        setIsScriptReady(false);
      }
    };

    syncConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
    window.addEventListener('storage', syncConsent);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentChange);
      window.removeEventListener('storage', syncConsent);
    };
  }, []);

  useEffect(() => {
    if (!GA_ID || !hasAnalyticsConsent || !isScriptReady || typeof window.gtag !== 'function') {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pagePath,
    });
  }, [hasAnalyticsConsent, isScriptReady, pathname, searchParams]);

  if (!GA_ID || !hasAnalyticsConsent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('consent', 'default', {
            analytics_storage: 'granted'
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
