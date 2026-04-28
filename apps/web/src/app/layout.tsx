import type { Metadata } from 'next';
import { Montserrat_Alternates } from 'next/font/google';
import { Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import CookieConsent from '@/components/CookieConsent/CookieConsent';
import GoogleAnalytics from '@/components/GoogleAnalytics/GoogleAnalytics';
import { AuthProvider } from '../context/AuthContext';
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from '@/lib/seo';
import './globals.scss';

const montserrat = Montserrat_Alternates({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: `${SITE_NAME} | отзывы на фильмы, сериалы и мультфильмы`,
  description: DEFAULT_DESCRIPTION,
  icons: {
    icon: '/images/favicon.ico',
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | отзывы на фильмы, сериалы и мультфильмы`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: absoluteUrl('/images/main-banner.webp'),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | отзывы на фильмы, сериалы и мультфильмы`,
    description: DEFAULT_DESCRIPTION,
    images: [absoluteUrl('/images/main-banner.webp')],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteJsonLd = buildWebsiteJsonLd();
  const organizationJsonLd = buildOrganizationJsonLd();

  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={montserrat.className}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>
          {children}
          <CookieConsent />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
