import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getCommuneBySlug, getDepartementByCode } from '@/lib/geo/service'
import { getSearchEngine } from '@/lib/search/engine'
import { formatSiren, formatTrancheEffectif } from '@/lib/publication/service'
import { formatResultCount } from '@/lib/search/pagination-utils'
import { ListingFilters } from '@/components/search/ListingFilters'
import type { UniteLegalePubliable } from '@/types/domain'
import { MapPin, Search, Building2, Users, ChevronRight, Briefcase } from 'lucide-react'

export const revalidate = 3600 // 1h

interface VillePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: VillePageProps): Promise<Metadata> {
  const { slug } = await params
  const commune = await getCommuneBySlug(slug)

  if (!commune) {
    return { title: 'Ville introuvable' }
  }

  const dep = await getDepartementByCode(commune.codeDepartement)
  const depName = dep ? dep.nom : commune.codeDepartement

  return {
    title: `Entreprises à ${commune.nom} (${commune.codeDepartement}) — Liste et Répertoire Sirene`,
    description: `Liste complète des entreprises, commerces et artisans implantés à ${commune.nom} (${depName}, Code INSEE ${commune.code}). Données du répertoire Insee, Siren, Siret, TVA et avis de situation.`,
    alternates: {
      canonical: `/ville/${slug}`,
    },
  }
}

export default async function VilleDetailPage({ params, searchParams }: VillePageProps) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1') || 1)
  const perPage = 20

  const commune = await getCommuneBySlug(slug)

  if (!commune) {
    notFound()
  }

  const dep = await getDepartementByCode(commune.codeDepartement)

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

  // Récupération des entreprises réelles de la commune avec filtres
  const engine = getSearchEngine()
  const searchResult = await engine.searchEntities({
    codeCommune: commune.code,
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
  const paginationBaseUrl = `/ville/${slug}${paginationParams.toString() ? `?${paginationParams.toString()}` : ''}`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  // Schema.org CollectionPage + ItemList + BreadcrumbList pour booster le SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/ville/${slug}`,
        name: `Entreprises à ${commune.nom} (${commune.codeDepartement})`,
        description: `Annuaire des entreprises situées à ${commune.nom}.`,
        url: `${siteUrl}/ville/${slug}`,
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
        '@id': `${siteUrl}/ville/${slug}#breadcrumb`,
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
            name: 'Départements',
            item: `${siteUrl}/departements`,
          },
          ...(dep
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: dep.nom,
                  item: `${siteUrl}/departement/${dep.slug}`,
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: commune.nom,
                  item: `${siteUrl}/ville/${slug}`,
                },
              ]
            : [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: commune.nom,
                  item: `${siteUrl}/ville/${slug}`,
                },
              ]),
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
            { label: 'Départements', href: '/departements' },
            ...(dep ? [{ label: dep.nom, href: `/departement/${dep.slug}` }] : []),
            { label: commune.nom },
          ]}
        />

        <header className="mt-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-100 text-blue-800 rounded-md">
              INSEE {commune.code}
            </span>
            {dep && (
              <Link
                href={`/departement/${dep.slug}`}
                className="px-2.5 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              >
                {dep.nom} ({dep.code})
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Entreprises et commerces à {commune.nom}
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Consultez le répertoire légal des entreprises, artisans, sièges sociaux et établissements
            implantés sur le territoire de <strong>{commune.nom}</strong>. Données publiques du répertoire Sirene de l'Insee.
          </p>
        </header>

        {/* Statistiques et localisation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-5 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <MapPin className="w-5 h-5" />
              <h2 className="text-sm font-semibold text-gray-900">Localisation</h2>
            </div>
            <p className="text-sm text-gray-600">
              Département : <strong>{dep ? `${dep.nom} (${dep.code})` : commune.codeDepartement}</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Code commune INSEE : <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{commune.code}</code>
            </p>
            {commune.codesPostaux.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Codes postaux : {commune.codesPostaux.join(', ')}
              </p>
            )}
          </div>

          <div className="p-5 bg-white border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3 text-blue-600 mb-2">
              <Users className="w-5 h-5" />
              <h2 className="text-sm font-semibold text-gray-900">Population</h2>
            </div>
            {commune.population ? (
              <>
                <p className="text-2xl font-bold text-gray-900">
                  {commune.population.toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">habitants (recensement Insee)</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">Donnée démographique en cours de mise à jour.</p>
            )}
          </div>

          <div className="p-5 bg-white border border-gray-200 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-blue-600 mb-2">
                <Building2 className="w-5 h-5" />
                <h2 className="text-sm font-semibold text-gray-900">Tissu économique</h2>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {searchResult.pagination.total >= 10000
                  ? '+ de 10 000'
                  : searchResult.pagination.total.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {searchResult.pagination.total >= 10000
                  ? 'entreprises consultables (plafond API)'
                  : 'entreprises répertoriées sur la commune'}
              </p>
            </div>
            <Link
              href={`/recherche?code_commune=${commune.code}`}
              className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
            >
              Recherche avancée avec filtres
            </Link>
          </div>
        </div>

        {/* Système de filtres multi-critères : taille, effectifs, forme juridique, statuts, agréments */}
        <ListingFilters
          baseUrl={`/ville/${slug}`}
          totalResults={searchResult.pagination.total}
        />

        {/* Liste des entreprises de la ville */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Liste des entreprises de {commune.nom}
            </h2>
            <span className="text-sm text-gray-500">
              Page {searchResult.pagination.page} sur {searchResult.pagination.totalPages || 1} ({formatResultCount(searchResult.pagination.total).displayCount})
            </span>
          </div>

          {formatResultCount(searchResult.pagination.total).notice && (
            <div className="p-3 mb-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              {formatResultCount(searchResult.pagination.total).notice}
            </div>
          )}

          {searchResult.results.length === 0 ? (
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

        {/* Contenu éditorial & SEO local */}
        <section className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            À propos du tissu économique de {commune.nom}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            La commune de <strong>{commune.nom}</strong> ({commune.code}) est située dans le département{' '}
            <strong>{dep ? `${dep.nom} (${dep.code})` : commune.codeDepartement}</strong>. Notre annuaire recense{' '}
            l'ensemble des professionnels immatriculés (sociétés commerciales, entreprises individuelles, artisans,
            professions libérales et associations employeuses). Chaque fiche présente les données vérifiées de l'INSEE :
            numéro SIREN, SIRET du siège, code NAF d'activité, TVA intracommunautaire, état administratif et historique
            des décisions de justice commerciale (procédures collectives BODACC).
          </p>
        </section>
      </div>
    </PublicLayout>
  )
}
