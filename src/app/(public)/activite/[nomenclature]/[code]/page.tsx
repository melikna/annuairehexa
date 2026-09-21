import type { Metadata } from 'next'
import Link from 'next/link'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Pagination } from '@/components/ui/Pagination'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getSearchEngine } from '@/lib/search/engine'
import { NAF_SECTIONS } from '@/lib/naf/sections'
import { formatSiren, formatTrancheEffectif } from '@/lib/publication/service'
import { ListingFilters } from '@/components/search/ListingFilters'
import { Search, Tag, AlertTriangle, ArrowRight, Building2, Briefcase, ChevronRight } from 'lucide-react'

export const revalidate = 3600

interface ActivitePageProps {
  params: Promise<{ nomenclature: string; code: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: ActivitePageProps): Promise<Metadata> {
  const { nomenclature, code } = await params
  const decodedCode = decodeURIComponent(code).trim()
  const isSection = /^[A-Za-z]$/.test(decodedCode)
  const sectionObj = isSection ? NAF_SECTIONS.find(s => s.code.toUpperCase() === decodedCode.toUpperCase()) : null

  if (isSection && sectionObj) {
    return {
      title: `Secteur ${sectionObj.code} — ${sectionObj.nom} (${nomenclature}) : Entreprises`,
      description: `${sectionObj.nom} : liste et annuaire des entreprises et établissements du secteur ${sectionObj.code} (${nomenclature}) en France. Données Insee Sirene.`,
      alternates: {
        canonical: `/activite/${nomenclature}/${code}`,
      },
    }
  }

  return {
    title: `Code APE / NAF ${decodedCode} (${nomenclature}) — Entreprises et Répertoire Sirene`,
    description: `Entreprises et établissements enregistrés sous le code d'activité APE ${decodedCode} (${nomenclature}). Données du répertoire Sirene INSEE.`,
    alternates: {
      canonical: `/activite/${nomenclature}/${code}`,
    },
  }
}

export default async function ActiviteDetailPage({ params, searchParams }: ActivitePageProps) {
  const { nomenclature, code } = await params
  const sp = await searchParams
  const decodedCode = decodeURIComponent(code).trim()
  const isSection = /^[A-Za-z]$/.test(decodedCode)
  const sectionObj = isSection ? NAF_SECTIONS.find(s => s.code.toUpperCase() === decodedCode.toUpperCase()) : null

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

  const page = Math.max(1, parseInt(typeof sp.page === 'string' ? sp.page : '1') || 1)
  const perPage = 20

  // Récupération des entreprises du secteur ou du code APE avec filtres
  const engine = getSearchEngine()
  const searchResult = await engine.searchEntities({
    section: isSection ? decodedCode.toUpperCase() : undefined,
    activitePrincipale: !isSection ? decodedCode : undefined,
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

  // URL pour la pagination en conservant tous les filtres
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
  const paginationBaseUrl = `/activite/${nomenclature}/${code}${paginationParams.toString() ? `?${paginationParams.toString()}` : ''}`

  const title = isSection
    ? `Secteur ${decodedCode.toUpperCase()} — ${sectionObj ? sectionObj.nom : 'Activité'}`
    : `Code activité APE ${decodedCode}`

  const description = isSection && sectionObj
    ? sectionObj.description
    : `Fiche descriptive et entreprises répertoriées sous cette sous-classe d'activité économique (${nomenclature === 'NAF2025' ? 'NAF 2025' : 'NAF Rév. 2'}).`

  const searchUrl = isSection
    ? `/recherche?section=${encodeURIComponent(decodedCode.toUpperCase())}`
    : `/recherche?activite_principale=${encodeURIComponent(decodedCode)}`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://annuairehexa.fr'

  // Schema.org CollectionPage + ItemList + BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/activite/${nomenclature}/${code}`,
        name: title,
        description,
        url: `${siteUrl}/activite/${nomenclature}/${code}`,
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
        '@id': `${siteUrl}/activite/${nomenclature}/${code}#breadcrumb`,
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
            name: 'Secteurs d\'activité',
            item: `${siteUrl}/secteurs`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: isSection ? `Secteur ${decodedCode.toUpperCase()}` : `Code APE ${decodedCode}`,
            item: `${siteUrl}/activite/${nomenclature}/${code}`,
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
            { label: 'Secteurs', href: '/secteurs' },
            { label: isSection ? `Secteur ${decodedCode.toUpperCase()}` : `Code APE ${decodedCode}` },
          ]}
        />

        <header className="mt-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-100 text-blue-800 rounded-md">
              {nomenclature === 'NAF2025' ? 'NAF 2025' : 'NAF Rév. 2'}
            </span>
            {isSection && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                Section INSEE
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 max-w-3xl text-base leading-relaxed">
            {description}
          </p>
        </header>

        {/* Note pédagogique et honnêteté légale */}
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold mb-1">Avertissement légal sur les nomenclatures d'activités</p>
              <p className="leading-relaxed">
                Le code d'Activité Principale Exercée (APE) ou la section attribuée par l'INSEE a une vocation principalement
                statistique. Il reflète l'activité principale déclarée lors de l'immatriculation mais ne constitue en aucun cas
                une preuve de qualification, d'habilitation professionnelle réglementée, d'assurance décennale ou d'agrément public.
              </p>
            </div>
          </div>
        </div>

        {/* Bloc d'actions & recherche avancée */}
        <div className="p-6 bg-white border border-gray-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 shadow-xs">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {searchResult.pagination.total > 0
                ? `${searchResult.pagination.total.toLocaleString('fr-FR')} entreprises répertoriées`
                : `Entreprises du code ${decodedCode}`}
            </h2>
            <p className="text-sm text-gray-600">
              {isSection
                ? `Consultez et filtrez les entreprises actives du secteur ${decodedCode.toUpperCase()} avec des critères géographiques ou juridiques.`
                : `Affichez l'ensemble des établissements exerçant principalement sous cette classification APE.`}
            </p>
          </div>
          <Link
            href={searchUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-lg transition-colors shrink-0 shadow-xs"
          >
            <Search className="w-4 h-4" />
            Recherche avancée avec filtres
          </Link>
        </div>

        {/* Système de filtres multi-critères : taille, effectifs, forme juridique, statuts, agréments */}
        <ListingFilters
          baseUrl={`/activite/${nomenclature}/${code}`}
          totalResults={searchResult.pagination.total}
        />

        {/* Liste des entreprises réelles */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {isSection
                ? `Entreprises du secteur ${decodedCode.toUpperCase()}`
                : `Entreprises avec l'activité APE ${decodedCode}`}
            </h2>
            {searchResult.pagination.total > 0 && (
              <span className="text-sm text-gray-500">
                Page {searchResult.pagination.page} sur {searchResult.pagination.totalPages || 1} ({searchResult.pagination.total} résultats)
              </span>
            )}
          </div>

          {searchResult.results.length === 0 ? (
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
              <Building2 className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Aucune entreprise trouvée pour ces critères de filtrage</p>
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
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
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

        <div className="text-sm text-gray-500">
          <Link href="/guides/codes-naf" className="text-blue-600 hover:underline">
            → Guide explicatif : comprendre la nomenclature d'activités française
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
