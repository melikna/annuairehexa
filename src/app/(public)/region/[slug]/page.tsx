import { SearchUnavailable } from '@/components/search/SearchUnavailable'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ListingFilters } from '@/components/search/ListingFilters'
import { getRegionBySlug, getDepartements, getGeoStats } from '@/lib/geo/service'
import { getSearchEngine } from '@/lib/search/engine'
import { formatSiren, formatTrancheEffectif } from '@/lib/publication/service'
import { formatResultCount } from '@/lib/search/pagination-utils'
import { MapPin, Building2, ChevronRight, TrendingUp, Briefcase } from 'lucide-react'

export const revalidate = 3600

interface RegionPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug } = await params
  const region = await getRegionBySlug(slug)

  if (!region) {
    return { title: 'Région introuvable' }
  }

  return {
    title: `Entreprises en ${region.nom} (Région ${region.code}) — Répertoire Insee`,
    description: `Découvrez les entreprises, établissements et l'activité économique dans la région ${region.nom}. Répertoire Sirene INSEE avec filtres par taille et statut.`,
    alternates: {
      canonical: `/region/${slug}`,
    },
  }
}

export default async function RegionDetailPage({ params, searchParams }: RegionPageProps) {
  const { slug } = await params
  const sp = await searchParams
  const region = await getRegionBySlug(slug)

  if (!region) {
    notFound()
  }

  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1') || 1)
  const perPage = 20

  // Filtres avancés
  const categorieEntreprise = typeof sp.categorie_entreprise === 'string' ? sp.categorie_entreprise as any : undefined
  const trancheEffectifs = typeof sp.tranche_effectifs === 'string' ? sp.tranche_effectifs : undefined
  const etatAdministratif = typeof sp.etat_administratif === 'string' ? sp.etat_administratif as 'A' | 'C' | 'F' : undefined
  const natureJuridique = typeof sp.nature_juridique === 'string' ? sp.nature_juridique : undefined
  const estEss = sp.est_ess === 'true'
  const estRge = sp.est_rge === 'true'
  const estOrganismeFormation = sp.est_organisme_formation === 'true'
  const estSocieteMission = sp.est_societe_mission === 'true'
  const estBio = sp.est_bio === 'true'

  const departements = await getDepartements(region.code)
  const stats = await getGeoStats('region', region.code)

  // Entreprises de la région
  const engine = getSearchEngine()
  const searchResult = await engine.searchEntities({
    region: region.code,
    categorieEntreprise,
    trancheEffectifs,
    etatAdministratif,
    natureJuridique,
    estEss,
    estRge,
    estOrganismeFormation,
    estSocieteMission,
    estBio,
    page,
    perPage,
  })

  // URL pagination préservant les filtres
  const paginationParams = new URLSearchParams()
  if (categorieEntreprise) paginationParams.set('categorie_entreprise', categorieEntreprise)
  if (trancheEffectifs) paginationParams.set('tranche_effectifs', trancheEffectifs)
  if (etatAdministratif) paginationParams.set('etat_administratif', etatAdministratif)
  if (natureJuridique) paginationParams.set('nature_juridique', natureJuridique)
  if (estEss) paginationParams.set('est_ess', 'true')
  if (estRge) paginationParams.set('est_rge', 'true')
  if (estOrganismeFormation) paginationParams.set('est_organisme_formation', 'true')
  if (estSocieteMission) paginationParams.set('est_societe_mission', 'true')
  if (estBio) paginationParams.set('est_bio', 'true')
  const paginationBaseUrl = `/region/${slug}${paginationParams.toString() ? `?${paginationParams.toString()}` : ''}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/region/${slug}`,
        name: `Entreprises en région ${region.nom}`,
        description: `Tissu économique et répertoire des entreprises en région ${region.nom}.`,
        url: `${siteUrl}/region/${slug}`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: searchResult.pagination.total,
          itemListElement: searchResult.results.map((ent, idx) => ({
            '@type': 'ListItem',
            position: (page - 1) * perPage + idx + 1,
            item: {
              '@type': 'Organization',
              name: ent.denominationAffichable ?? `Entreprise ${ent.siren}`,
              identifier: ent.siren,
              url: `${siteUrl}/entreprise/${ent.siren}`,
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteUrl}/region/${slug}#breadcrumb`,
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
            name: 'Régions',
            item: `${siteUrl}/regions`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: region.nom,
            item: `${siteUrl}/region/${slug}`,
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
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Régions', href: '/regions' },
            { label: region.nom },
          ]}
        />

        <header className="mt-4 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-md">
              Région {region.code}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Entreprises en région {region.nom}
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Tissu économique et répertoire des entreprises implantées en région {region.nom}. Données du répertoire Insee Sirene.
          </p>
        </header>

        {/* Statistiques si disponibles */}
        {stats && stats.totalEtablissements > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Établissements actifs" value={stats.etablissementsActifs.toLocaleString('fr-FR')} />
            <StatCard label="Total établissements" value={stats.totalEtablissements.toLocaleString('fr-FR')} />
            <StatCard label="Entreprises actives" value={stats.unitesLegalesActives.toLocaleString('fr-FR')} />
            <StatCard label="Total entreprises" value={stats.totalUnitesLegales.toLocaleString('fr-FR')} />
          </div>
        )}

        {/* Système de filtres multi-critères : taille, effectifs, forme juridique, statuts, agréments */}
        <ListingFilters
          baseUrl={`/region/${slug}`}
          totalResults={searchResult.pagination.total}
        />

        {/* Liste des entreprises de la région */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Répertoire des entreprises en {region.nom}
            </h2>
            {searchResult.pagination.total > 0 && (
              <span className="text-sm text-gray-500">
                Page {searchResult.pagination.page} sur {searchResult.pagination.totalPages || 1} ({formatResultCount(searchResult.pagination.total).displayCount})
              </span>
            )}
          </div>

          {formatResultCount(searchResult.pagination.total).notice && (
            <div className="p-3 mb-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              {formatResultCount(searchResult.pagination.total).notice}
            </div>
          )}

          {searchResult.unavailable ? <SearchUnavailable /> : searchResult.results.length === 0 ? (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Aucune entreprise trouvée pour ces critères</p>
              <p className="text-sm text-gray-500 mt-1">
                Essayez d'élargir vos filtres de taille ou de statut pour afficher davantage de résultats.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResult.results.map((ent) => (
                <Link
                  key={ent.siren}
                  href={`/entreprise/${ent.siren}`}
                  className="flex items-start justify-between p-4 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-sm rounded-xl transition-all group"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base truncate">
                        {ent.denominationAffichable ?? `Entreprise ${formatSiren(ent.siren)}`}
                      </h3>
                      <StatusBadge etat={ent.etatAdministratif} entityType="unite_legale" size="sm" />
                      {ent.activitePrincipaleNAF25 && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                          NAF 2025 : {ent.activitePrincipaleNAF25}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="font-mono">SIREN {formatSiren(ent.siren)}</span>
                      {ent.libelleFormeJuridique && (
                        <span>{ent.libelleFormeJuridique}</span>
                      )}
                      {ent.activitePrincipale && (
                        <span>APE {ent.activitePrincipale} {ent.libelleActivite ? `— ${ent.libelleActivite}` : ''}</span>
                      )}
                      {ent.trancheEffectifs && (
                        <span>{formatTrancheEffectif(ent.trancheEffectifs, ent.anneeEffectifs)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0 mt-2" />
                </Link>
              ))}

              {/* Pagination */}
              {searchResult.pagination.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={searchResult.pagination.page}
                    totalPages={searchResult.pagination.totalPages}
                    baseUrl={paginationBaseUrl}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Liste des départements de la région */}
        <section className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Départements de la région {region.nom}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {departements.map((dep) => (
              <Link
                key={dep.code}
                href={`/departement/${dep.slug}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-9 rounded-lg bg-gray-50 text-gray-800 font-mono font-semibold text-sm flex items-center justify-center border border-gray-100">
                    {dep.code}
                  </span>
                  <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                    {dep.nom}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
