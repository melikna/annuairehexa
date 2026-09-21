import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { TOP_FRENCH_CITIES_LIST } from '@/lib/geo/top-cities'
import { MapPin, ChevronRight, Building2 } from 'lucide-react'

export const revalidate = 86400 // Cache 24h

export const metadata: Metadata = {
  title: 'Villes de France — Répertoire des entreprises par commune',
  description:
    'Consultez les entreprises, artisans et commerces immatriculés dans les principales villes et métropoles de France. Données Sirene Insee et BODACC.',
  alternates: { canonical: '/villes' },
  openGraph: {
    title: 'Villes de France — Annuaire des entreprises par commune',
    description: 'Accédez aux listes d\'entreprises par commune dans toute la France.',
    type: 'website',
  },
}

export default function VillesPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  // Regrouper les villes par région
  const groupedByRegion = TOP_FRENCH_CITIES_LIST.reduce<Record<string, typeof TOP_FRENCH_CITIES_LIST>>((acc, city) => {
    const list = acc[city.region] ?? []
    list.push(city)
    acc[city.region] = list
    return acc
  }, {})

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/villes`,
        name: 'Villes de France — Annuaire des entreprises',
        description: 'Répertoire des entreprises dans les principales communes de France.',
        url: `${siteUrl}/villes`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: TOP_FRENCH_CITIES_LIST.length,
          itemListElement: TOP_FRENCH_CITIES_LIST.map((city, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            item: {
              '@type': 'Place',
              name: city.nom,
              url: `${siteUrl}/ville/${city.slug}`,
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/villes#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Accueil',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Villes',
            item: `${siteUrl}/villes`,
          },
        ],
      },
    ],
  }

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Villes' }]} />

        <div className="mt-4 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 border border-blue-200">
            <MapPin className="w-3.5 h-3.5" />
            Répertoire communal national
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Entreprises par Ville en France
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Retrouvez facilement les fiches légales d'entreprises, de commerçants et d'indépendants dans les principales métropoles et communes françaises.
          </p>
        </div>

        <div className="space-y-10">
          {Object.entries(groupedByRegion).map(([regionName, cities]) => (
            <section key={regionName} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  {regionName}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {cities.length} {cities.length > 1 ? 'villes' : 'ville'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/ville/${city.slug}`}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
                  >
                    <div>
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors block">
                        {city.nom}
                      </span>
                      <span className="text-xs text-gray-500">
                        {city.departement}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Section Maillage SEO interne */}
        <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-gray-900">Recherche par région ou département</h3>
              <p className="text-sm text-gray-600">Vous pouvez aussi explorer l'annuaire par découpage administratif régional ou départemental.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/departements"
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Voir les départements
            </Link>
            <Link
              href="/regions"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir les régions
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
