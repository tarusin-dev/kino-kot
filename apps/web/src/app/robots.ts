import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile', '/search'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
