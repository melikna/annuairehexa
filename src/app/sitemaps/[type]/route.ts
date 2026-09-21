import { NextResponse } from 'next/server'
import { getRegions, getDepartements } from '@/lib/geo/service'
import { NAF_SECTIONS } from '@/lib/naf/sections'
import { TOP_FRENCH_CITIES_LIST } from '@/lib/geo/top-cities'
import { fetchNouvellesCreations } from '@/lib/creations/creations-service'
import { fetchProceduresCollectives } from '@/lib/procedures/procedures-service'

export const revalidate = 3600 // Cache 1h

function buildUrlSetXml(urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }>) {
  const items = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority !== undefined ? `<priority>${u.priority.toFixed(2)}</priority>` : ''}
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'
  const now = new Date().toISOString().split('T')[0]

  let urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: number }> = []

  switch (type) {
    case 'pages.xml': {
      urls = [
        { loc: `${siteUrl}`, lastmod: now, changefreq: 'daily', priority: 1.0 },
        { loc: `${siteUrl}/procedures-collectives`, lastmod: now, changefreq: 'hourly', priority: 0.95 },
        { loc: `${siteUrl}/regions`, lastmod: now, changefreq: 'daily', priority: 0.9 },
        { loc: `${siteUrl}/departements`, lastmod: now, changefreq: 'daily', priority: 0.9 },
        { loc: `${siteUrl}/villes`, lastmod: now, changefreq: 'daily', priority: 0.9 },
        { loc: `${siteUrl}/secteurs`, lastmod: now, changefreq: 'daily', priority: 0.9 },
        { loc: `${siteUrl}/couverture`, lastmod: now, changefreq: 'hourly', priority: 0.8 },
        { loc: `${siteUrl}/methodologie`, lastmod: now, changefreq: 'monthly', priority: 0.7 },
        { loc: `${siteUrl}/sources`, lastmod: now, changefreq: 'monthly', priority: 0.7 },
        { loc: `${siteUrl}/guides/lire-une-fiche`, lastmod: now, changefreq: 'monthly', priority: 0.75 },
        { loc: `${siteUrl}/guides/siren-siret`, lastmod: now, changefreq: 'monthly', priority: 0.75 },
        { loc: `${siteUrl}/mentions-legales`, lastmod: now, changefreq: 'yearly', priority: 0.4 },
        { loc: `${siteUrl}/confidentialite`, lastmod: now, changefreq: 'yearly', priority: 0.4 },
        { loc: `${siteUrl}/cgu`, lastmod: now, changefreq: 'yearly', priority: 0.4 },
        { loc: `${siteUrl}/contact`, lastmod: now, changefreq: 'monthly', priority: 0.5 },
        { loc: `${siteUrl}/correction`, lastmod: now, changefreq: 'monthly', priority: 0.5 },
      ]
      break
    }

    case 'regions.xml': {
      const regions = await getRegions()
      urls = regions.map((r) => ({
        loc: `${siteUrl}/region/${r.slug}`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.85,
      }))
      break
    }

    case 'departements.xml': {
      const departements = await getDepartements()
      urls = departements.map((d) => ({
        loc: `${siteUrl}/departement/${d.slug}`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.85,
      }))
      break
    }

    case 'villes.xml': {
      urls = TOP_FRENCH_CITIES_LIST.map((city) => ({
        loc: `${siteUrl}/ville/${city.slug}`,
        lastmod: now,
        changefreq: 'daily',
        priority: 0.8,
      }))
      break
    }

    case 'secteurs.xml': {
      urls = NAF_SECTIONS.map((sec) => ({
        loc: `${siteUrl}/activite/NAFRev2/${sec.code}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: 0.8,
      }))
      break
    }

    case 'creations.xml': {
      // Les dernières créations d'entreprises (très prisées par Google pour la fraîcheur)
      try {
        const creations = await fetchNouvellesCreations({ limit: 100 })
        urls = (creations.results || [])
          .filter((c) => Boolean(c.siren))
          .map((c) => ({
            loc: `${siteUrl}/entreprise/${c.siren}`,
            lastmod: c.dateParution || now,
            changefreq: 'weekly',
            priority: 0.75,
          }))
      } catch (err) {
        urls = []
      }
      break
    }

    case 'procedures.xml': {
      // Les entreprises en liquidation et redressement récent (flux d'alerte)
      try {
        const procedures = await fetchProceduresCollectives({ limit: 100 })
        urls = (procedures.results || [])
          .filter((p) => Boolean(p.siren))
          .map((p) => ({
            loc: `${siteUrl}/entreprise/${p.siren}`,
            lastmod: p.dateJugement || p.datePublication || now,
            changefreq: 'weekly',
            priority: 0.8,
          }))
      } catch (err) {
        urls = []
      }
      break
    }

    default: {
      return new NextResponse('Sitemap Not Found', { status: 404 })
    }
  }

  const xml = buildUrlSetXml(urls)

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
