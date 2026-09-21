import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/recherche', // Empêche l'indexation des résultats de recherche internes (conforme bonnes pratiques SEO)
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
