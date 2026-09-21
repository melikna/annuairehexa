import { NextResponse } from 'next/server'

export const revalidate = 3600 // Cache 1h

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'
  const now = new Date().toISOString().split('T')[0]

  const subSitemaps = [
    { loc: `${siteUrl}/sitemaps/pages.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/creations.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/procedures.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/villes.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/departements.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/regions.xml`, lastmod: now },
    { loc: `${siteUrl}/sitemaps/secteurs.xml`, lastmod: now },
  ]

  const items = subSitemaps
    .map(
      (s) => `  <sitemap>
    <loc>${s.loc}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`
    )
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
